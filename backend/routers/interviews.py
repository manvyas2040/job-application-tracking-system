from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import enforce_owner_or_admin, require_roles
from ..Database import get_db
from ..Models import Application, Candidate, Interview, InterviewFeedback, Job, User
from ..schemas import InterviewCreate, InterviewFeedbackCreate, InterviewUpdate
from .dependencies import APP_TRANSITIONS, INTERVIEW_TRANSITIONS, _audit, _current_db_user, _notify

INTERVIEW_DURATION = timedelta(hours=1)

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def _auto_complete_overdue(db: Session):
    """Auto-mark past interviews as 'awaiting_feedback' if still scheduled/rescheduled."""
    now = datetime.utcnow()
    overdue = (
        db.query(Interview)
        .filter(
            Interview.interview_date < now,
            Interview.interview_status.in_(["scheduled", "rescheduled"]),
        )
        .all()
    )
    for row in overdue:
        row.interview_status = "awaiting_feedback"
    if overdue:
        db.commit()


@router.get("")
def list_interviews_calendar(
    start: date | None = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end: date | None = Query(default=None, description="End date (YYYY-MM-DD)"),
    start_date: date | None = Query(default=None, description="Alternative start date"),
    end_date: date | None = Query(default=None, description="Alternative end date"),
    interviewer_id: int | None = Query(default=None),
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calendar feed for interviews with role-based visibility and date filtering."""
    user = _current_db_user(current, db)
    _auto_complete_overdue(db)

    start_val = start or start_date
    end_val = end or end_date

    q = (
        db.query(Interview, Application, Candidate, User, Job)
        .join(Application, Interview.application_id == Application.application_id)
        .join(Candidate, Application.candidate_id == Candidate.candidate_id)
        .join(User, Candidate.user_id == User.user_id)
        .join(Job, Application.job_id == Job.job_id)
    )

    role = (current.get("role") or "").strip().lower()
    if role == "admin":
        pass
    elif role == "hr":
        q = q.filter(Job.owner_hr_id == user.user_id)
    elif role == "interviewer":
        q = q.filter(Interview.interviewer_id == user.user_id)
    elif role == "candidate":
        candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
        if not candidate:
            return []
        q = q.filter(Application.candidate_id == candidate.candidate_id)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    if start_val:
        q = q.filter(Interview.interview_date >= datetime.combine(start_val, datetime.min.time()))
    if end_val:
        q = q.filter(Interview.interview_date <= datetime.combine(end_val, datetime.max.time()))

    if interviewer_id is not None:
        q = q.filter(Interview.interviewer_id == interviewer_id)

    rows = q.order_by(Interview.interview_date.asc()).all()

    interviewer_ids = sorted({row[0].interviewer_id for row in rows})
    interviewer_map = {
        u.user_id: u.name
        for u in db.query(User).filter(User.user_id.in_(interviewer_ids)).all()
    } if interviewer_ids else {}

    events = []
    for interview, app_row, _candidate_row, candidate_user, _job in rows:
        start_dt = interview.interview_date
        end_dt = start_dt + INTERVIEW_DURATION
        events.append(
            {
                "interview_id": interview.interview_id,
                "title": f"{candidate_user.name} - {interview.interview_type.title()}",
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
                "candidate_name": candidate_user.name,
                "interview_type": interview.interview_type,
                "interviewer_id": interview.interviewer_id,
                "interviewer_name": interviewer_map.get(interview.interviewer_id, "Unknown"),
                "status": interview.interview_status,
                "application_id": app_row.application_id,
            }
        )

    return events


@router.get("/interviewers")
def list_visible_interviewers(
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return interviewer options visible to the current user."""
    user = _current_db_user(current, db)

    role = (current.get("role") or "").strip().lower()
    q = db.query(User).filter(User.role == "interviewer", User.is_active.is_(True))

    if role == "admin":
        pass
    elif role == "hr":
        interviewer_ids = (
            db.query(Interview.interviewer_id)
            .join(Application, Interview.application_id == Application.application_id)
            .join(Job, Application.job_id == Job.job_id)
            .filter(Job.owner_hr_id == user.user_id)
            .distinct()
            .all()
        )
        ids = [row[0] for row in interviewer_ids]
        if not ids:
            return []
        q = q.filter(User.user_id.in_(ids))
    elif role == "interviewer":
        q = q.filter(User.user_id == user.user_id)
    elif role == "candidate":
        candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
        if not candidate:
            return []
        interviewer_ids = (
            db.query(Interview.interviewer_id)
            .join(Application, Interview.application_id == Application.application_id)
            .filter(Application.candidate_id == candidate.candidate_id)
            .distinct()
            .all()
        )
        ids = [row[0] for row in interviewer_ids]
        if not ids:
            return []
        q = q.filter(User.user_id.in_(ids))
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    users = q.order_by(User.name.asc()).all()
    return [{"user_id": u.user_id, "name": u.name} for u in users]


@router.get("/my")
def get_my_interviews(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interviews assigned to current interviewer"""
    user = _current_db_user(current, db)
    require_roles("interviewer")(current)

    _auto_complete_overdue(db)
    
    interviews = (
        db.query(Interview)
        .filter(Interview.interviewer_id == user.user_id)
        .all()
    )
    
    result = []
    for interview in interviews:
        # Get application details
        app = db.query(Application).filter(Application.application_id == interview.application_id).first()
        if not app:
            continue
        
        # Get candidate details
        candidate = db.query(Candidate).filter(Candidate.candidate_id == app.candidate_id).first()
        candidate_user = db.query(User).filter(User.user_id == candidate.user_id).first() if candidate else None
        
        # Get job details
        job = db.query(Job).filter(Job.job_id == app.job_id).first()
        
        # Get feedback if exists
        feedback = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview.interview_id).first()
        
        result.append({
            "interview": {
                "interview_id": interview.interview_id,
                "interview_date": interview.interview_date,
                "interview_type": interview.interview_type,
                "interview_status": interview.interview_status,
                "interviewer_id": interview.interviewer_id,
                "application_id": interview.application_id,
            },
            "application": {
                "application_id": app.application_id,
                "application_status": app.application_status,
                "applied_date": app.applied_date,
            },
            "candidate": {
                "candidate_id": app.candidate_id,
                "name": candidate_user.name if candidate_user else "Unknown",
                "email": candidate_user.email if candidate_user else "Unknown",
                "phone": candidate.phone,
                "skills": candidate.skills,
                "experience_years": candidate.experience_years,
            },
            "job": {
                "job_id": job.job_id,
                "job_title": job.job_title,
                "department": job.department,
            },
            "feedback": {
                "feedback_id": feedback.feedback_id if feedback else None,
                "rating": feedback.rating if feedback else None,
                "comments": feedback.comments if feedback else None,
                "recommendation": feedback.recommendation if feedback else None,
            } if feedback else None,
        })
    
    return result


@router.get("/my/notifications")
def get_my_interview_notifications(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview-only notifications for the current interviewer."""
    user = _current_db_user(current, db)
    require_roles("interviewer")(current)

    _auto_complete_overdue(db)

    rows = (
        db.query(Interview, Application, Candidate, User, Job)
        .join(Application, Interview.application_id == Application.application_id)
        .join(Candidate, Application.candidate_id == Candidate.candidate_id)
        .join(User, Candidate.user_id == User.user_id)
        .join(Job, Application.job_id == Job.job_id)
        .filter(Interview.interviewer_id == user.user_id)
        .order_by(Interview.interview_date.asc())
        .all()
    )

    now = datetime.utcnow()
    notifications = []
    for interview, app_row, _candidate_row, candidate_user, job in rows:
        if interview.interview_status == "cancelled":
            continue

        if interview.interview_status in ["scheduled", "rescheduled"] and interview.interview_date >= now:
            notification_type = "info"
            status_text = "rescheduled" if interview.interview_status == "rescheduled" else "scheduled"
            message = (
                f"Interview {status_text}: {candidate_user.name} for {job.job_title} on "
                f"{interview.interview_date.strftime('%B %d, %Y at %I:%M %p')}"
            )
        elif interview.interview_status == "awaiting_feedback":
            notification_type = "action_required"
            message = (
                f"Feedback pending: Submit feedback for {candidate_user.name} "
                f"({job.job_title})"
            )
        else:
            notification_type = "info"
            message = (
                f"Interview update: {candidate_user.name} ({job.job_title}) - "
                f"{interview.interview_status.replace('_', ' ').title()}"
            )

        notifications.append(
            {
                "notification_id": interview.interview_id,
                "notification_type": notification_type,
                "message": message,
                "related_application_id": app_row.application_id,
                "interview_id": interview.interview_id,
                "is_read": False,
                "created_at": interview.created_at,
            }
        )

    return notifications


@router.get("/candidate")
def get_candidate_interviews(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interviews for the current candidate's applications"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)

    _auto_complete_overdue(db)

    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    applications = db.query(Application).filter(Application.candidate_id == candidate.candidate_id).all()
    app_ids = [a.application_id for a in applications]

    interviews = db.query(Interview).filter(Interview.application_id.in_(app_ids)).all() if app_ids else []

    result = []
    for interview in interviews:
        app = next((a for a in applications if a.application_id == interview.application_id), None)
        job = db.query(Job).filter(Job.job_id == app.job_id).first() if app else None

        result.append({
            "interview_id": interview.interview_id,
            "application_id": interview.application_id,
            "interview_date": interview.interview_date,
            "interview_type": interview.interview_type,
            "interview_status": interview.interview_status,
            "job_title": job.job_title if job else "Unknown",
            "department": job.department if job else "Unknown",
        })

    return result


@router.get("/application/{application_id}")
def get_interviews_for_application(
    application_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interviews for a specific application"""
    user = _current_db_user(current, db)

    _auto_complete_overdue(db)

    app_row = db.query(Application).filter(Application.application_id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    # Candidates can only see their own application's interviews
    if current["role"] == "candidate":
        candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
        if not candidate or app_row.candidate_id != candidate.candidate_id:
            raise HTTPException(status_code=403, detail="Access denied")

    interviews = db.query(Interview).filter(Interview.application_id == application_id).all()

    result = []
    for interview in interviews:
        interviewer = db.query(User).filter(User.user_id == interview.interviewer_id).first()
        result.append({
            "interview_id": interview.interview_id,
            "interview_date": interview.interview_date,
            "interview_type": interview.interview_type,
            "interview_status": interview.interview_status,
            "interviewer_name": interviewer.name if interviewer else "Unknown",
        })

    return result


@router.post("")
def create_interview(
    payload: InterviewCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedule a new interview (HR/Admin) - validates all data, then creates interview & sends notifications atomically"""
    user = _current_db_user(current, db)
    require_roles("HR", "admin")(current)
    current_time = datetime.utcnow()

    # ============================================
    # VALIDATION PHASE - Check ALL data FIRST
    # ============================================
    
    # 1. Application must exist
    app_row = db.query(Application).filter(Application.application_id == payload.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    # 1a. Application must be shortlisted
    if app_row.application_status != "shortlisted":
        raise HTTPException(status_code=400, detail="Interviews can only be scheduled for shortlisted candidates")

    # 2. Interview must be in the future
    if payload.interview_date <= current_time:
        raise HTTPException(status_code=400, detail="Interview must be scheduled in the future")

    # 3. Job must exist
    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    enforce_owner_or_admin(current, job.owner_hr_id)

    # 4. Interviewer must exist
    interviewer = db.query(User).filter(User.user_id == payload.interviewer_id).first()
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")

    # 5. Interviewer must have role 'interviewer' (CRITICAL VALIDATION)
    if interviewer.role != "interviewer":
        raise HTTPException(status_code=400, detail="Selected user must have 'interviewer' role")

    # 6. Interviewer cannot be the candidate who applied
    candidate = db.query(Candidate).filter(Candidate.candidate_id == app_row.candidate_id).first()
    if candidate and candidate.user_id == interviewer.user_id:
        raise HTTPException(status_code=400, detail="Interviewer cannot be the candidate for this application")

    # 7. Interviewer must be available (no calendar conflict within 1 hour)
    range_start = payload.interview_date - INTERVIEW_DURATION
    range_end = payload.interview_date + INTERVIEW_DURATION
    conflict = (
        db.query(Interview)
        .filter(
            Interview.interviewer_id == payload.interviewer_id,
            Interview.interview_date >= range_start,
            Interview.interview_date <= range_end,
            Interview.interview_status.in_(["scheduled", "rescheduled"]),
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=400, detail="Interviewer has a calendar conflict")

    # 8. Candidate must be available (no conflicting interview at the same time)
    candidate_app_ids = [
        a.application_id
        for a in db.query(Application).filter(Application.candidate_id == app_row.candidate_id).all()
    ]
    candidate_conflict = (
        db.query(Interview)
        .filter(
            Interview.application_id.in_(candidate_app_ids),
            Interview.interview_date >= range_start,
            Interview.interview_date <= range_end,
            Interview.interview_status.in_(["scheduled", "rescheduled"]),
        )
        .first()
    )
    if candidate_conflict:
        raise HTTPException(status_code=400, detail="Candidate already has an interview scheduled at this time")

    # ============================================
    # CREATION PHASE - All validations passed
    # ============================================
    
    # Create the interview
    row = Interview(
        application_id=payload.application_id,
        interview_date=payload.interview_date,
        interview_type=payload.interview_type,
        interviewer_id=payload.interviewer_id,
        interview_status="scheduled",
    )
    
    # Update application status
    app_row.application_status = "interview_scheduled"
    db.add(row)
    
    # ============================================
    # NOTIFICATION PHASE - Add all before commit
    # ============================================
    
    # Get candidate user info for comprehensive notification
    candidate_user = db.query(User).filter(User.user_id == candidate.user_id).first() if candidate else None
    interview_date_str = payload.interview_date.strftime("%B %d, %Y at %I:%M %p")
    
    # Notify candidate about interview scheduling
    _notify(
        db, 
        app_row.candidate_id, 
        f"Interview scheduled for {job.job_title} role on {interview_date_str} with {interviewer.name}",
        "info", 
        app_row.application_id
    )
    
    # ============================================
    # AUDIT PHASE - Log the action
    # ============================================
    
    _audit(db, current["user_id"], f"interview_scheduled:{row.interview_id}:app_{payload.application_id}:interviewer_{payload.interviewer_id}")
    
    # ============================================
    # ATOMIC COMMIT - Single database transaction
    # ============================================
    
    db.commit()
    db.refresh(row)
    
    return row


@router.patch("/{interview_id}")
def update_interview(
    interview_id: int,
    payload: InterviewUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update interview details"""
    _current_db_user(current, db)
    require_roles("HR", "admin")(current)
    
    row = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Interview not found")

    if payload.interview_status and payload.interview_status not in INTERVIEW_TRANSITIONS.get(row.interview_status, set()):
        raise HTTPException(status_code=400, detail="Invalid interview transition")

    if payload.interview_date is not None:
        row.interview_date = payload.interview_date
    if payload.interview_type is not None:
        row.interview_type = payload.interview_type
    if payload.interview_status is not None:
        row.interview_status = payload.interview_status
    
    db.commit()
    return row


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete/cancel an interview (HR/Admin) - validates permissions and applies atomic transaction"""
    user = _current_db_user(current, db)
    require_roles("hr", "admin")(current)
    
    row = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get application to verify ownership and create notification
    app_row = db.query(Application).filter(Application.application_id == row.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify HR/Admin owns this job
    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    enforce_owner_or_admin(current, job.owner_hr_id)
    
    # Delete any feedback associated with this interview
    db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_id).delete()
    
    # Delete the interview
    db.delete(row)
    
    # Revert application status back to shortlisted
    if app_row.application_status == "interview_scheduled":
        app_row.application_status = "shortlisted"
    
    # Notify candidate about interview cancellation (atomic with delete)
    _notify(
        db, 
        app_row.candidate_id, 
        f"Your scheduled interview for {job.job_title} has been cancelled. Please contact HR for more details.",
        "warning", 
        app_row.application_id
    )
    
    # Log the action
    _audit(db, current["user_id"], f"interview_cancelled:{interview_id}:app_{app_row.application_id}")
    
    # Single atomic commit
    db.commit()
    
    return {"message": "Interview deleted successfully"}


@router.post("/{interview_id}/reschedule")
def reschedule_interview(
    interview_id: int,
    payload: InterviewUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reschedule an interview"""
    user = _current_db_user(current, db)
    require_roles("hr", "admin", "interviewer")(current)
    
    row = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get application
    app_row = db.query(Application).filter(Application.application_id == row.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Verify permissions (HR/Admin can reschedule, Interviewer can only request reschedule)
    if current["role"] == "interviewer" and row.interviewer_id != user.user_id:
        raise HTTPException(status_code=403, detail="Interviewer can only reschedule their own interviews")
    
    # Verify HR/Admin own this job
    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    if current["role"] in ["hr", "admin"]:
        enforce_owner_or_admin(current, job.owner_hr_id)
    
    # Check for conflicts with new date if provided (within 1 hour window)
    if payload.interview_date:
        range_start = payload.interview_date - INTERVIEW_DURATION
        range_end = payload.interview_date + INTERVIEW_DURATION
        conflict = (
            db.query(Interview)
            .filter(
                Interview.interview_id != interview_id,
                Interview.interviewer_id == row.interviewer_id,
                Interview.interview_date >= range_start,
                Interview.interview_date <= range_end,
                Interview.interview_status.in_(["scheduled", "rescheduled"]),
            )
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Interviewer has a calendar conflict at new time")

        # Check candidate conflict at new time
        candidate_app_ids = [
            a.application_id
            for a in db.query(Application).filter(Application.candidate_id == app_row.candidate_id).all()
        ]
        candidate_conflict = (
            db.query(Interview)
            .filter(
                Interview.interview_id != interview_id,
                Interview.application_id.in_(candidate_app_ids),
                Interview.interview_date >= range_start,
                Interview.interview_date <= range_end,
                Interview.interview_status.in_(["scheduled", "rescheduled"]),
            )
            .first()
        )
        if candidate_conflict:
            raise HTTPException(status_code=400, detail="Candidate already has an interview scheduled at this time")
        
        row.interview_date = payload.interview_date
        row.interview_status = "rescheduled"
    
    if payload.interview_type:
        row.interview_type = payload.interview_type
    
    # Notify candidate about reschedule (atomic with DB commit)
    interviewer = db.query(User).filter(User.user_id == row.interviewer_id).first()
    interviewer_name = interviewer.name if interviewer else "your interviewer"
    
    _notify(
        db,
        app_row.candidate_id,
        f"Your interview for {app_row.job_id} has been rescheduled to {row.interview_date.strftime('%B %d, %Y at %I:%M %p')} with {interviewer_name}",
        "info",
        app_row.application_id
    )
    
    _audit(db, current["user_id"], f"interview_rescheduled:{interview_id}")
    
    # Single atomic commit
    db.commit()
    return row


@router.post("/feedback")
def submit_feedback(
    payload: InterviewFeedbackCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit interview feedback (Interviewer)"""
    user = _current_db_user(current, db)
    require_roles("interviewer")(current)

    interview = db.query(Interview).filter(Interview.interview_id == payload.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.interviewer_id != user.user_id:
        raise HTTPException(status_code=403, detail="Only assigned interviewer can submit feedback")
    if interview.interview_date > datetime.utcnow():
        raise HTTPException(status_code=400, detail="Feedback can only be submitted after the interview")
    if db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview.interview_id).first():
        raise HTTPException(status_code=400, detail="Feedback is write-once")

    interview.interview_status = "completed"

    row = InterviewFeedback(
        interview_id=payload.interview_id,
        interviewer_id=user.user_id,
        rating=payload.rating,
        comments=payload.comments,
        recommendation=payload.recommendation,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, user.user_id, f"feedback_submitted:{payload.interview_id}")
    db.commit()
    return row


@router.post("/{interview_id}/hire")
def hire_candidate(
    interview_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark candidate as hired and interview as completed"""
    user = _current_db_user(current, db)
    require_roles("hr", "admin", "interviewer")(current)

    row = db.query(Interview).filter(Interview.interview_id == interview_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Interview not found")

    app_row = db.query(Application).filter(Application.application_id == row.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    if current["role"] == "interviewer" and row.interviewer_id != user.user_id:
        raise HTTPException(status_code=403, detail="Interviewer can only hire their own interviews")

    if current["role"] in ["hr", "admin"]:
        job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
        enforce_owner_or_admin(current, job.owner_hr_id)

    if row.interview_status not in INTERVIEW_TRANSITIONS or "completed" not in INTERVIEW_TRANSITIONS.get(row.interview_status, set()):
        if row.interview_status != "completed":
            raise HTTPException(status_code=400, detail="Interview cannot be completed from current status")

    if app_row.application_status not in APP_TRANSITIONS or "hired" not in APP_TRANSITIONS.get(app_row.application_status, set()):
        if app_row.application_status != "hired":
            raise HTTPException(status_code=400, detail="Application cannot be moved to hired from current status")

    row.interview_status = "completed"
    app_row.application_status = "hired"

    _notify(
        db,
        app_row.candidate_id,
        "Congratulations! You have been hired.",
        "success",
        app_row.application_id
    )

    db.commit()
    return {
        "message": "Candidate hired and interview completed",
        "application_id": app_row.application_id,
        "interview_id": row.interview_id
    }
