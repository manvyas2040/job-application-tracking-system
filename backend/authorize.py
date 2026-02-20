from fastapi import HTTPException, status


def require_roles(*roles: str):
    def checker(current_user: dict):
        if current_user.get("role") not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return checker


def enforce_self_or_admin(current_user: dict, target_user_id: int) -> None:
    is_admin = current_user.get("role") == "admin"
    is_self = current_user.get("user_id") == target_user_id
    if not (is_admin or is_self):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only manage your own profile")


def enforce_owner_or_admin(current_user: dict, owner_user_id: int) -> None:
    if current_user.get("role") == "admin":
        return
    if current_user.get("user_id") != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner permission required")