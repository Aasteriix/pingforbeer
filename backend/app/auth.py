# backend/app/auth.py
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .db import SessionLocal
from . import models

# --- Config ---
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = os.getenv("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "60"))

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=True)


from passlib.context import CryptContext

# Support both: verify old hashes ("bcrypt") and create new ones with "bcrypt_sha256"
pwd_ctx = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)

# --- DB dependency ---
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Password helpers ---
def hash_pw(plain: str) -> str:
    return pwd_ctx.hash(plain)

def verify_pw(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

# --- JWT helpers ---
def make_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MIN)).timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# --- Auth dependency for protected routes ---
def current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    token = creds.credentials
    try:
        data = decode_token(token)
        uid = int(data.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).get(uid)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
