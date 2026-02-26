"""User management endpoints"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import enforce_self_or_admin, require_roles
from ..Database import get_db
from ..Models import User
from ..schemas import RoleChangeRequest, UserUpdate
from .dependencies import _audit, _current_db_user, _get_user, _normalize_role

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("")
def list_users(
    role: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = 1,
    page_size: int = 10,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all users (admin only)"""
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


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user details"""
    _current_db_user(current, db)
    enforce_self_or_admin(current, user_id)
    user = _get_user(db, user_id)
    
    if payload.status is not None:
        require_roles("ADMIN")(current)
        user.status = payload.status

    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/role")
def change_role(
    user_id: int,
    payload: RoleChangeRequest,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user role (admin only)"""
    require_roles("ADMIN")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    
    old = user.role
    new_role = _normalize_role(payload.new_role)
    user.role = new_role
    user.token_version += 1
    
    _audit(db, actor.user_id, f"role_changed:{user_id}:{old}->{new_role}")
    db.commit()
    return {"message": "Role changed"}


@router.delete("/{user_id}")
def deactivate_user(
    user_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deactivate user (admin only)"""
    require_roles("admin")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    
    user.is_active = False
    user.status = "inactive"
    user.token_version += 1
    
    _audit(db, actor.user_id, f"user_deactivated:{user_id}")
    db.commit()
    return {"message": "User deactivated"}


@router.post("/{user_id}/restore")
def restore_user(
    user_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore deactivated user (admin only)"""
    require_roles("admin")(current)
    actor = _current_db_user(current, db)
    user = _get_user(db, user_id)
    
    user.is_active = True
    user.status = "active"
    
    _audit(db, actor.user_id, f"user_restored:{user_id}")
    db.commit()
    return {"message": "User restored"}
