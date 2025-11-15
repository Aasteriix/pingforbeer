from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator


# -------- Auth --------
class RegisterIn(BaseModel):
    email: EmailStr
    name: str
    password: str
    timezone: Optional[str] = "Europe/Stockholm"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str


# -------- Users --------
class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    timezone: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2 (orm_mode replacement)


# -------- Invites --------
class InviteOut(BaseModel):
    user: UserOut
    status: Literal["pending", "accepted", "declined", "maybe"]


# -------- Pings --------
class PingCreate(BaseModel):
    title: str
    location: str
    starts_at: datetime
    invitee_ids: List[int]
    notes: Optional[str] = ""

    @field_validator("title")
    @classmethod
    def v_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title required")
        if len(v) > 140:
            raise ValueError("title too long (max 140)")
        return v

    @field_validator("location")
    @classmethod
    def v_loc(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("location required")
        if len(v) > 140:
            raise ValueError("location too long (max 140)")
        return v

    @field_validator("notes")
    @classmethod
    def v_notes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 1000:
            raise ValueError("notes too long (max 1000)")
        return v


class PingOut(BaseModel):
    id: int
    title: str
    starts_at: datetime
    location: str
    notes: Optional[str] = ""
    creator: UserOut
    invites: List[InviteOut]
    ics_public_url: str

    class Config:
        from_attributes = True


# -------- Respond --------
class RespondIn(BaseModel):
    status: Literal["pending", "accepted", "declined", "maybe"]
