from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

from .authentication import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from .authorize import enforce_owner_or_admin, enforce_self_or_admin, require_roles
from .Database import Base, engine, get_db
from .Models import (
    Application,
    AuditLog,
    Candidate,
    CandidateNotification,
    Interview,
    InterviewFeedback,
    Job,
    User,
)
from .schemas import (
    ApplicationCreate,
    ApplicationUpdate,
    BulkStatusUpdate,
    InterviewCreate,
    InterviewFeedbackCreate,
    InterviewUpdate,
    JobCreate,
    JobStateUpdate,
    PasswordChangeRequest,
    RoleChangeRequest,
    TokenRefreshRequest,
    UserCreate,
    UserLogin,
    UserUpdate,
)

app = FastAPI(title="Intermediate Job Application Tracking System")

JOB_TRANSITIONS = {
    "draft": {"open", "archived"},
    "open": {"closed"},
    "closed": {"archived"},
    "archived": set(),
}
APP_TRANSITIONS = {
    "applied": {"shortlisted", "rejected"},
    "shortlisted": {"interview_scheduled", "rejected"},
    "interview_scheduled": {"hired", "rejected"},
    "rejected": set(),
    "hired": set(),
}
INTERVIEW_TRANSITIONS = {
    "scheduled": {"rescheduled", "completed", "cancelled"},
    "rescheduled": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def _get_user(db: Session, user_id: int) -> User:
    row = db.query(User).filter(User.user_id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


def _current_db_user(current: dict, db: Session) -> User:
    user = _get_user(db, current["user_id"])
    if user.token_version != current["token_version"]:
        raise HTTPException(status_code=401, detail="Token expired after security update")
    return user


def _audit(db: Session, user_id: int, action: str):
    db.add(AuditLog(user_id=user_id, action=action))


def _notify(db: Session, candidate_id: int, message: str, notification_type: str = "info", app_id: int | None = None):
    db.add(
        CandidateNotification(
            candidate_id=candidate_id,
            message=message,
            notification_type=notification_type,
            related_application_id=app_id,
        )
    )


@app.post("/auth/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
        status="pending",
        is_active=True,
        token_version=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user_id": user.user_id, "status": user.status}


@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.status != "active" or not user.is_active:
        raise HTTPException(status_code=403, detail="Login blocked for this account state")

    return {
        "access_token": create_access_token(user.user_id, user.role, user.token_version),
        "refresh_token": create_refresh_token(user.user_id, user.token_version),
        "token_type": "bearer",
    }


@app.post("/auth/refresh")
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(payload.refresh_token)
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token required")

    user = _get_user(db, int(data["sub"]))
    if data.get("token_version") != user.token_version:
        raise HTTPException(status_code=401, detail="Refresh token is stale")
    if user.status != "active" or not user.is_active:
        raise HTTPException(status_code=403, detail="Account is not active")

    return {
        "access_token": create_access_token(user.user_id, user.role, user.token_version),
        "refresh_token": create_refresh_token(user.user_id, user.token_version),
    }


@app.post("/auth/change-password")
def change_password(payload: PasswordChangeRequest, current=Depends(get_current_user), db: Session = Depends(get_db)):
    user = _current_db_user(current, db)
    if not verify_password(payload.old_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password = hash_password(payload.new_password)
    user.token_version += 1
    _audit(db, user.user_id, "password_changed")
    db.commit()
    return {"message": "Password changed. Please login again."}


@app.get("/users")
def list_users(
    role: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = 1,
    page_size: int = 10,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_roles("admin")(current)
    _current_db_user(current, db)

    q = db.query(User).filter(User.is_active.is_(True))
    if role:
        q = q.filter(User.role == role)
    if status_filter:
        q = q.filter(User.status == status_filter)
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


@app.patch("/users/{user_id}")
def update_user(user_id: int, payload: UserUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    _current_db_user(current, db)
    enforce_self_or_admin(current, user_id)
    user = _get_user(db, user_id)

    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email
    if payload.status is not None:
        require_roles("admin")(current)
        user.status = payload.status

    db.commit()
    db.refresh(user)
    return user


@app.post("/users/{user_id}/role")
def change_role(user_id: int, payload: RoleChangeRequest, current=Depends(get_current_user), db: Session = Depends(get_db)):
    require_roles("admin")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    old = user.role
    user.role = payload.new_role
    user.token_version += 1
    _audit(db, actor.user_id, f"role_changed:{user_id}:{old}->{payload.new_role}")
    db.commit()
    return {"message": "Role changed"}


@app.delete("/users/{user_id}")
def deactivate_user(user_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    require_roles("admin")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    user.is_active = False
    user.status = "inactive"
    user.token_version += 1
    _audit(db, actor.user_id, f"user_deactivated:{user_id}")
    db.commit()
    return {"message": "User deactivated"}


@app.post("/users/{user_id}/restore")
def restore_user(user_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    require_roles("admin")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    user.is_active = True
    user.status = "active"
    _audit(db, actor.user_id, f"user_restored:{user_id}")
    db.commit()
    return {"message": "User restored"}


@app.post("/jobs")
def create_job(payload: JobCreate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    actor = _current_db_user(current, db)
    require_roles("hr", "admin")(current)
    row = Job(
        company_id=payload.company_id,
        owner_hr_id=actor.user_id,
        job_titel=payload.job_title,
        job_description=payload.job_description,
        department=payload.department,
        experienc_required=payload.experience_required,
        job_status="draft",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    row = db.query(Job).filter(Job.job_id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    return row


@app.patch("/jobs/{job_id}/state")
def update_job_state(job_id: int, payload: JobStateUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    _current_db_user(current, db)
    row = db.query(Job).filter(Job.job_id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    enforce_owner_or_admin(current, row.owner_hr_id)

    if payload.job_status not in JOB_TRANSITIONS.get(row.job_status, set()):
        raise HTTPException(status_code=400, detail="Invalid job state transition")
    row.job_status = payload.job_status
    db.commit()
    return row


@app.get("/jobs/{job_id}/analytics")
def job_analytics(job_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    _current_db_user(current, db)
    require_roles("hr", "admin")(current)

    app_count = db.query(Application).filter(Application.job_id == job_id).count()
    interview_count = (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.application_id)
        .filter(Application.job_id == job_id)
        .count()
    )
    return {"job_id": job_id, "applications": app_count, "interviews": interview_count}


@app.post("/applications")
def apply_job(payload: ApplicationCreate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    user = _current_db_user(current, db)
    require_roles("candidate")(current)

    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
        raise HTTPException(status_code=400, detail="Candidate profile not found")

    job = db.query(Job).filter(Job.job_id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_status != "open":
        raise HTTPException(status_code=400, detail="Only open jobs accept applications")

    dup = (
        db.query(Application)
        .filter(Application.job_id == payload.job_id, Application.candidate_id == candidate.candidate_id)
        .first()
    )
    if dup:
        raise HTTPException(status_code=400, detail="Duplicate application not allowed")

    app_row = Application(candidate_id=candidate.candidate_id, job_id=payload.job_id, application_status="applied")
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    _notify(db, candidate.candidate_id, "Application submitted", "info", app_row.application_id)
    db.commit()
    return app_row


@app.get("/applications")
def list_applications(current=Depends(get_current_user), db: Session = Depends(get_db)):
    user = _current_db_user(current, db)
    if user.role == "admin":
        return db.query(Application).all()
    if user.role == "candidate":
        c = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
        return db.query(Application).filter(Application.candidate_id == c.candidate_id).all() if c else []
    if user.role == "hr":
        return (
            db.query(Application)
            .join(Job, Application.job_id == Job.job_id)
            .filter(Job.owner_hr_id == user.user_id)
            .all()
        )
    return []


@app.patch("/applications/{application_id}/state")
def update_application_state(
    application_id: int,
    payload: ApplicationUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _current_db_user(current, db)
    require_roles("hr", "admin")(current)
    app_row = db.query(Application).filter(Application.application_id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    enforce_owner_or_admin(current, job.owner_hr_id)

    if payload.application_status not in APP_TRANSITIONS.get(app_row.application_status, set()):
        raise HTTPException(status_code=400, detail="Invalid application transition")
    app_row.application_status = payload.application_status

    _notify(db, app_row.candidate_id, f"Application moved to {payload.application_status}", "action_required", application_id)
    db.commit()
    return app_row


@app.post("/applications/bulk-shortlist")
def bulk_shortlist(payload: BulkStatusUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    for app_id in payload.application_ids:
        update_application_state(app_id, ApplicationUpdate(application_status="shortlisted"), current, db)
    return {"updated": len(payload.application_ids)}


@app.post("/applications/bulk-reject")
def bulk_reject(payload: BulkStatusUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    for app_id in payload.application_ids:
        update_application_state(app_id, ApplicationUpdate(application_status="rejected"), current, db)
    return {"updated": len(payload.application_ids)}


@app.post("/interviews")
def create_interview(payload: InterviewCreate, current=Depends(get_current_user), db: Session = Depends(get_db)):
    _current_db_user(current, db)
    require_roles("hr", "admin")(current)

    app_row = db.query(Application).filter(Application.application_id == payload.application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    enforce_owner_or_admin(current, job.owner_hr_id)

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


@app.patch("/interviews/{interview_id}")
def update_interview(interview_id: int, payload: InterviewUpdate, current=Depends(get_current_user), db: Session = Depends(get_db)):
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


@app.post("/feedback")
def submit_feedback(payload: InterviewFeedbackCreate, current=Depends(get_current_user), db: Session = Depends(get_db)):
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


@app.get("/notifications")
def my_notifications(current=Depends(get_current_user), db: Session = Depends(get_db)):
    user = _current_db_user(current, db)
    require_roles("candidate")(current)
    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
        return []
    return db.query(CandidateNotification).filter(CandidateNotification.candidate_id == candidate.candidate_id).all()


@app.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: int, current=Depends(get_current_user), db: Session = Depends(get_db)):
    user = _current_db_user(current, db)
    require_roles("candidate")(current)
    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    row = (
        db.query(CandidateNotification)
        .filter(CandidateNotification.notification_id == notification_id, CandidateNotification.candidate_id == candidate.candidate_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@app.get("/audit-logs")
def audit_logs(current=Depends(get_current_user), db: Session = Depends(get_db)):
    require_roles("admin")(current)
    _current_db_user(current, db)
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
