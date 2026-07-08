from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session
from .models import User
from .auth import get_current_user_id, security
from .database import get_session

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security), session: Session = Depends(get_session)):
    sub = await get_current_user_id(auth)
    user = session.get(User, sub)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def require_role(role: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return user
    return role_checker
