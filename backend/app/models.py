# backend/app/models.py
import enum
import secrets
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from .db import Base

PRESET_ACTIVITIES = {
    "DRINK": "Drink",
    "WALK": "Walk",
    "COFFEE": "Coffee",
    "GYM": "Gym",
    "DINNER": "Dinner",
    "GAME": "Game night",
    "STUDY": "Study",
    "CHILL": "Chill",
}


class FriendshipStatus(str, enum.Enum):
    accepted = "accepted"
    pending = "pending"


class InviteStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    maybe = "maybe"


class AuraStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    timezone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Friendship(Base):
    __tablename__ = "friendships"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    friend_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    status = Column(Enum(FriendshipStatus), default=FriendshipStatus.pending)


# ⚠️ Keep the CLASS name Ping because api.py uses models.Ping
class Ping(Base):
    __tablename__ = "auras"  # table is renamed, code name can stay Ping

    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title = Column(String, default="Catch up?")
    starts_at = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(Enum(AuraStatus), default=AuraStatus.open)
    ics_secret = Column(
        String, default=lambda: secrets.token_urlsafe(16), nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    # NEW: structured “vibe”
    activity_type = Column(String, nullable=True)  # e.g. "DRINK", "GYM", "CUSTOM"
    activity_custom_label = Column(String, nullable=True)  # for CUSTOM

    @property
    def activity_label(self) -> Optional[str]:
        """Human-friendly label that frontend can visa direkt."""
        if self.activity_type == "CUSTOM":
            return (self.activity_custom_label or "").strip() or None

        if self.activity_type in PRESET_ACTIVITIES:
            return PRESET_ACTIVITIES[self.activity_type]

        return None


class PingInvite(Base):
    __tablename__ = "aura_invites"

    id = Column(Integer, primary_key=True)
    ping_id = Column(Integer, ForeignKey("auras.id"), index=True, nullable=False)
    invitee_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    status = Column(Enum(InviteStatus), default=InviteStatus.pending)
    responded_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("ping_id", "invitee_id", name="uniq_ping_invitee"),
    )

