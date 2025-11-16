from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from .models import PRESET_ACTIVITIES


# Typalias för vilka aktiviteter som är tillåtna
ActivityType = Literal[
    "DRINK",
    "WALK",
    "COFFEE",
    "GYM",
    "DINNER",
    "GAME",
    "STUDY",
    "CHILL",
    "CUSTOM",
]


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


# -------- Pings / Auras --------
class PingCreate(BaseModel):
    title: str
    location: str
    starts_at: datetime
    invitee_ids: List[int]
    notes: Optional[str] = ""

    # NYTT: strukturerad vibe
    activity_type: Optional[ActivityType] = None
    activity_custom_label: Optional[str] = None

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

    @field_validator("activity_type")
    @classmethod
    def v_activity_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = set(PRESET_ACTIVITIES.keys()) | {"CUSTOM"}
        if v not in allowed:
            raise ValueError(
                f"activity_type must be one of: {', '.join(sorted(allowed))}"
            )
        return v

    @field_validator("activity_custom_label")
    @classmethod
    def v_activity_custom_label(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) > 100:
            raise ValueError("activity_custom_label too long (max 100)")
        return v

    @model_validator(mode="after")
    def validate_activity(self) -> "PingCreate":
        # Om du väljer CUSTOM måste du skriva in en custom label
        if self.activity_type == "CUSTOM":
            if not self.activity_custom_label or not self.activity_custom_label.strip():
                raise ValueError(
                    "activity_custom_label is required when activity_type='CUSTOM'"
                )
        return self


class PingOut(BaseModel):
    id: int
    title: str
    starts_at: datetime
    location: str
    notes: Optional[str] = ""
    creator: UserOut
    invites: List[InviteOut]
    ics_public_url: str

    # NYTT: skickas ut till frontend (activity_label kommer från models.Ping @property)
    activity_type: Optional[ActivityType] = None
    activity_custom_label: Optional[str] = None
    activity_label: Optional[str] = None

    class Config:
        from_attributes = True


# -------- Respond --------
class RespondIn(BaseModel):
    status: Literal["pending", "accepted", "declined", "maybe"]
