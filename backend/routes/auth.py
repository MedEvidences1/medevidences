"""
Authentication Routes for Plutus Predict
Extracted from server.py for better code organization
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid

# Import shared dependencies from core
from core.database import db
from core.config import logger
from core.auth import hash_password, create_session, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Trial duration - 60 minutes for all users
ENTERPRISE_TRIAL_DURATION_SECONDS = 3600

# Pydantic Models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    language: str = "en"

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/register")
async def register(user: UserCreate):
    """Register a new user with trial access"""
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(400, "Email already exists")
    
    user_id = str(uuid.uuid4())
    trial_started = datetime.now(timezone.utc)
    trial_expires = trial_started + timedelta(seconds=ENTERPRISE_TRIAL_DURATION_SECONDS)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "name": user.name,
        "role": "user",
        "plan": "trial",
        "subscription_status": "trial",
        "trial_started_at": trial_started.isoformat(),
        "trial_expires_at": trial_expires.isoformat(),
        "created_at": trial_started.isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_session(user_id)
    await db.sessions.insert_one({
        "token": token, 
        "user_id": user_id, 
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "user_id": user_id, 
        "token": token, 
        "name": user.name,
        "plan": "trial",
        "trial_expires_at": trial_expires.isoformat(),
        "trial_duration_seconds": ENTERPRISE_TRIAL_DURATION_SECONDS
    }


@router.post("/login")
async def login(user: UserLogin):
    """Login and create session"""
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or db_user["password_hash"] != hash_password(user.password):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_session(db_user["id"])
    await db.sessions.insert_one({
        "token": token, 
        "user_id": db_user["id"], 
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Check trial status for non-paid users
    trial_info = {}
    if db_user.get("subscription_status") == "trial" and db_user.get("trial_expires_at"):
        trial_expires = datetime.fromisoformat(db_user["trial_expires_at"].replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        is_expired = now > trial_expires
        remaining = max(0, (trial_expires - now).total_seconds())
        trial_info = {
            "trial_expires_at": db_user["trial_expires_at"],
            "trial_expired": is_expired,
            "trial_remaining_seconds": int(remaining)
        }
    
    return {
        "user_id": db_user["id"], 
        "token": token, 
        "name": db_user["name"], 
        "role": db_user["role"], 
        "plan": db_user.get("plan", "trial"),
        "subscription_status": db_user.get("subscription_status", "trial"),
        **trial_info
    }


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """Logout and invalidate session"""
    if authorization:
        token = authorization.replace("Bearer ", "")
        await db.sessions.delete_one({"token": token})
    return {"status": "logged out"}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "plan": user.get("plan", "trial")
    }


@router.get("/trial-status")
async def get_user_trial_status(user: dict = Depends(get_current_user)):
    """Get trial status for current user"""
    if user.get("subscription_status") != "trial":
        return {
            "is_trial": False,
            "plan": user.get("plan", "paid"),
            "subscription_status": user.get("subscription_status", "active")
        }
    
    trial_expires_str = user.get("trial_expires_at")
    if not trial_expires_str:
        return {"is_trial": True, "trial_expired": True, "remaining_seconds": 0}
    
    try:
        trial_expires = datetime.fromisoformat(trial_expires_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        remaining = (trial_expires - now).total_seconds()
        
        return {
            "is_trial": True,
            "trial_expired": remaining <= 0,
            "remaining_seconds": max(0, int(remaining)),
            "trial_expires_at": trial_expires_str,
            "trial_duration_total": ENTERPRISE_TRIAL_DURATION_SECONDS
        }
    except:
        return {"is_trial": True, "trial_expired": True, "remaining_seconds": 0}


@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    """Change password for logged-in user"""
    db_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not db_user:
        raise HTTPException(404, "User not found")
    
    if db_user["password_hash"] != hash_password(request.current_password):
        raise HTTPException(401, "Current password is incorrect")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(request.new_password)}}
    )
    
    return {"success": True, "message": "Password changed successfully"}
