from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import require_roles
from ..Database import get_db
from ..Models import Candidate, CandidateNotification
from .dependencies import _current_db_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def my_notifications(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for current candidate"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)
    
    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
        return []
    
    return db.query(CandidateNotification).filter(
        CandidateNotification.candidate_id == candidate.candidate_id
    ).all()


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)
    
    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    row = (
        db.query(CandidateNotification)
        .filter(
            CandidateNotification.notification_id == notification_id,
            CandidateNotification.candidate_id == candidate.candidate_id
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    row.is_read = True
    db.commit()
    
    updated_row = db.query(CandidateNotification).filter(
        CandidateNotification.notification_id == notification_id
    ).first()
    
    return {"message": "Notification marked as read", "notification": updated_row}
