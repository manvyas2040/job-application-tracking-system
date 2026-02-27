from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..Models import User, AuditLog, CandidateNotification


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

ALLOWED_ROLES = {"admin", "hr", "candidate", "interviewer"}


def _normalize_role(role: str) -> str:
    """Normalize and validate role"""
    normalized = role.strip().lower()
    if normalized not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    return normalized


def _get_user(db: Session, user_id: int) -> User:
    """Get user by ID or raise 404"""
    row = db.query(User).filter(User.user_id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


def _current_db_user(current: dict, db: Session) -> User:
    """Get current user from DB and verify token version"""
    user = _get_user(db, current["user_id"])
    if user.token_version != current["token_version"]:
        raise HTTPException(status_code=401, detail="Token expired after security update")
    return user


def _audit(db: Session, user_id: int, action: str):
    """Log an audit entry"""
    db.add(AuditLog(user_id=user_id, action=action))
    db.commit()


def _notify(db: Session, candidate_id: int, message: str, notification_type: str = "info", app_id: int | None = None):
    """Create a notification for a candidate"""
    db.add(
        CandidateNotification(
            candidate_id=candidate_id,
            message=message,
            notification_type=notification_type,
            related_application_id=app_id,
        )
    )
