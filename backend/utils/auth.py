"""
Authentication utilities for Plutus Predict
"""
import hashlib
import secrets
from fastapi import Header, HTTPException
from utils.database import db
from utils.config import APP_SECRET_KEY


def hash_password(password: str) -> str:
    return hashlib.sha256((password + APP_SECRET_KEY).encode()).hexdigest()


def create_session(user_id: str) -> str:
    token = secrets.token_hex(32)
    return token


async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    session = await db.sessions.find_one({"token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_optional_user(authorization: str = Header(None)):
    try:
        return await get_current_user(authorization)
    except:
        return None
