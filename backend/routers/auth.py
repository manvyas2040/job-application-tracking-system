from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..authentication import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from ..Database import get_db
from ..Models import User
from ..schemas import PasswordChangeRequest, TokenRefreshRequest, UserCreate
from .dependencies import _audit, _current_db_user, _get_user, _normalize_role

router = APIRouter(prefix="/auth", tags=["Authentication"])
     
     
@router.post("/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
                                                
    role = _normalize_role(payload.role)

    if role == "admin":
        admin_exists = db.query(User).filter(func.lower(User.role) == "admin").first() is not None
        if admin_exists:
            raise HTTPException(status_code=403, detail="Admin registration is not allowed. Contact an existing admin.")

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=role,
        status="active", 
        is_active=True,
        token_version=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _audit(db, user.user_id, f"user_created:{user.user_id}:{role}")
    db.commit()
    return {"user_id": user.user_id, "status": user.status}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.status != "active" or not user.is_active:
        raise HTTPException(status_code=403, detail="Login blocked for this account state")

    return {
        "access_token": create_access_token(user.user_id, user.role, user.token_version),
        "refresh_token": create_refresh_token(user.user_id, user.token_version),
        "token_type": "bearer",
    }


@router.post("/refresh")
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
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


@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    user = _current_db_user(current, db)
    if not verify_password(payload.old_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user.password = hash_password(payload.new_password)
    user.token_version += 1
    _audit(db, user.user_id, "password_changed")
    db.commit()
    return {"message": "Password changed. Please login again."}
