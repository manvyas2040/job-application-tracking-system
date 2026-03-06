from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import enforce_owner_or_admin, require_roles
from ..Database import get_db
from ..Models import Application, Candidate, Interview, InterviewFeedback, Job, User
from ..schemas import InterviewCreate, InterviewFeedbackCreate, InterviewUpdate
from .dependencies import APP_TRANSITIONS, INTERVIEW_TRANSITIONS, _current_db_user, _notify

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.get("/my")
def get_my_interviews(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interviews assigned to current interviewer"""
    user = _current_db_user(current, db)
    require_roles("interviewer")(current)
    
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


@router.post("")
def create_interview(
    payload: InterviewCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedule a new interview (HR/Admin)"""
    _current_db_user(current, db)
    require_roles("HR", "admin")(current)

    app_row = db.query(Application).filter(Application.application_id == payload.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    enforce_owner_or_admin(current, job.owner_hr_id)

    # Check for interviewer conflicts
    conflict = (
        db.query(Interview)
        .filter(
            Interview.interviewer_id == payload.interviewer_id,
            Interview.interview_date == payload.interview_date,
            Interview.interview_status.in_(["scheduled", "rescheduled"]),
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=400, detail="Interviewer has a calendar conflict")

    row = Interview(
        application_id=payload.application_id,
        interview_date=payload.interview_date,
        interview_type=payload.interview_type,
        interviewer_id=payload.interviewer_id,
        interview_status="scheduled",
    )
    app_row.application_status = "interview_scheduled"
    db.add(row)
    
    _notify(db, app_row.candidate_id, "Interview scheduled", "info", app_row.application_id)
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
    """Delete/cancel an interview (HR/Admin)"""
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
    
    # Notify candidate about interview deletion
    _notify(db, app_row.candidate_id, "Your scheduled interview has been cancelled", "warning", app_row.application_id)
    
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
    
    # Check for conflicts with new date if provided
    if payload.interview_date:
        conflict = (
            db.query(Interview)
            .filter(
                Interview.interview_id != interview_id,
                Interview.interviewer_id == row.interviewer_id,
                Interview.interview_date == payload.interview_date,
                Interview.interview_status.in_(["scheduled", "rescheduled"]),
            )
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Interviewer has a calendar conflict at new time")
        
        row.interview_date = payload.interview_date
        row.interview_status = "rescheduled"
    
    if payload.interview_type:
        row.interview_type = payload.interview_type
    
    db.commit()
    
    # Notify candidate about reschedule
    _notify(
        db,
        app_row.candidate_id,
        f"Your interview has been rescheduled to {row.interview_date.strftime('%Y-%m-%d %H:%M')}",
        "info",
        app_row.application_id
    )
    
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
    if db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview.interview_id).first():
        raise HTTPException(status_code=400, detail="Feedback is write-once")

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
