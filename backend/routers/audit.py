from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import require_roles
from ..Database import get_db
from ..Models import AuditLog
from .dependencies import _current_db_user

router = APIRouter(prefix="/audit-logs", tags=["Audit"])


@router.get("")
def audit_logs(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audit logs (Admin only)"""
    require_roles("admin")(current)
    _current_db_user(current, db)
    
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
