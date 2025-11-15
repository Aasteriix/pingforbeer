from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import current_user, get_db, hash_pw, make_token, verify_pw
from .calendar_ics import generate_ics

r = APIRouter(prefix="/api")

# -------- Auth --------


@r.post("/auth/register", response_model=schemas.TokenOut)
def register(data: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=data.email).first():
        raise HTTPException(400, "Email already used")
    u = models.User(
        email=data.email,
        name=data.name,
        password_hash=hash_pw(data.password),
        timezone=data.timezone,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"access_token": make_token(u.id)}


@r.post("/auth/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    u = db.query(models.User).filter_by(email=data.email).first()
    if not u or not verify_pw(data.password, u.password_hash):
        raise HTTPException(401, "Bad credentials")
    return {"access_token": make_token(u.id)}


@r.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(current_user)):
    return user


# -------- Friends / Connections --------


@r.post("/friends/{friend_id}/request")
def request_friend(
    friend_id: int,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if friend_id == user.id:
        raise HTTPException(400, "Cannot add self")
    for a, b in [(user.id, friend_id), (friend_id, user.id)]:
        if not db.query(models.Friendship).filter_by(user_id=a, friend_id=b).first():
            db.add(
                models.Friendship(
                    user_id=a,
                    friend_id=b,
                    status=models.FriendshipStatus.pending,
                )
            )
    db.commit()
    return {"ok": True}


@r.get("/friends/requests/incoming", response_model=List[schemas.UserOut])
def incoming_requests(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.Friendship)
        .filter_by(friend_id=user.id, status=models.FriendshipStatus.pending)
        .all()
    )
    ids = [r.user_id for r in rows]
    return db.query(models.User).filter(models.User.id.in_(ids)).all() if ids else []


@r.post("/friends/{friend_id}/approve")
def approve_friend(
    friend_id: int,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    for a, b in [(user.id, friend_id), (friend_id, user.id)]:
        fr = db.query(models.Friendship).filter_by(user_id=a, friend_id=b).first()
        if fr:
            fr.status = models.FriendshipStatus.accepted
        else:
            db.add(
                models.Friendship(
                    user_id=a,
                    friend_id=b,
                    status=models.FriendshipStatus.accepted,
                )
            )
    db.commit()
    return {"ok": True}


@r.post("/friends/{friend_id}/decline")
def decline_friend(
    friend_id: int,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Friendship).filter(
        (
            (models.Friendship.user_id == user.id)
            & (models.Friendship.friend_id == friend_id)
        )
        | (
            (models.Friendship.user_id == friend_id)
            & (models.Friendship.friend_id == user.id)
        )
    ).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}


@r.get("/friends", response_model=List[schemas.UserOut])
def friends(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    ids = [
        f.friend_id
        for f in db.query(models.Friendship).filter_by(
            user_id=user.id, status=models.FriendshipStatus.accepted
        )
    ]
    ids += [
        f.user_id
        for f in db.query(models.Friendship).filter_by(
            friend_id=user.id, status=models.FriendshipStatus.accepted
        )
    ]
    return db.query(models.User).filter(models.User.id.in_(ids)).all() if ids else []


# -------- Aura helper (used by aura/ping endpoints) --------


def aura_out(p: models.Ping, db: Session) -> schemas.PingOut:
    # creator
    creator = db.get(models.User, p.creator_id)

    # invites
    invites = db.query(models.PingInvite).filter_by(ping_id=p.id).all()
    user_ids = [i.invitee_id for i in invites]
    users = (
        {
            u.id: u
            for u in db.query(models.User).filter(models.User.id.in_(user_ids)).all()
        }
        if user_ids
        else {}
    )

    ics_url = f"/api/pings/{p.id}/ics-public?sig={p.ics_secret}"

    return schemas.PingOut(
        id=p.id,
        title=p.title,
        starts_at=p.starts_at,
        location=p.location,
        notes=p.notes,
        creator=schemas.UserOut.model_validate(creator),
        invites=[
            {
                "user": schemas.UserOut.model_validate(users[i.invitee_id]),
                "status": i.status.value,
            }
            for i in invites
        ],
        ics_public_url=ics_url,
    )


# -------- “Pings” (Auras) API --------
# NOTE: path still /pings/* so frontend keeps working, but conceptually these are Auras.


@r.post("/pings", response_model=schemas.PingOut, status_code=status.HTTP_201_CREATED)
def create_ping(
    data: schemas.PingCreate,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if not data.invitee_ids:
        raise HTTPException(400, "At least one invitee is required")

    # accepted friends only
    my_friend_ids = set()
    for fr in db.query(models.Friendship).filter_by(
        user_id=user.id, status=models.FriendshipStatus.accepted
    ):
        my_friend_ids.add(fr.friend_id)
    for fr in db.query(models.Friendship).filter_by(
        friend_id=user.id, status=models.FriendshipStatus.accepted
    ):
        my_friend_ids.add(fr.user_id)

    clean_invitees = []
    for i in set(data.invitee_ids):
        if i == user.id:
            continue
        if i not in my_friend_ids:
            raise HTTPException(400, f"Invitee {i} is not your accepted friend")
        clean_invitees.append(i)

    if not clean_invitees:
        raise HTTPException(400, "No valid invitees after filtering")

    p = models.Ping(
        creator_id=user.id,
        title=data.title,
        starts_at=data.starts_at,
        location=data.location,
        notes=(data.notes or "").strip(),
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    for invitee_id in clean_invitees:
        db.add(models.PingInvite(ping_id=p.id, invitee_id=invitee_id))
    db.commit()

    return aura_out(p, db)


@r.get("/pings/inbox", response_model=List[schemas.PingOut])
def inbox(
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    my_creations = db.query(models.Ping).filter_by(creator_id=user.id)
    my_invites = (
        db.query(models.Ping)
        .join(models.PingInvite, models.Ping.id == models.PingInvite.ping_id)
        .filter(
            models.PingInvite.invitee_id == user.id,
            models.PingInvite.status != models.InviteStatus.declined,
        )
    )

    ids = {p.id for p in my_creations.all()} | {p.id for p in my_invites.all()}
    rows = (
        db.query(models.Ping)
        .filter(models.Ping.id.in_(ids))
        .order_by(models.Ping.starts_at.asc())
        .all()
        if ids
        else []
    )
    return [aura_out(p, db) for p in rows]


@r.get("/pings/{ping_id}", response_model=schemas.PingOut)
def get_ping(
    ping_id: int,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    p = db.get(models.Ping, ping_id)
    if not p:
        raise HTTPException(404)
    return aura_out(p, db)


@r.post("/pings/{ping_id}/respond")
def respond(
    ping_id: int,
    data: schemas.RespondIn,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    inv = (
        db.query(models.PingInvite)
        .filter_by(ping_id=ping_id, invitee_id=user.id)
        .first()
    )
    if not inv:
        raise HTTPException(404, "No invite found")
    inv.status = models.InviteStatus(data.status)
    inv.responded_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@r.get("/pings/{ping_id}/ics-public")
def ics_public(
    ping_id: int,
    sig: str,
    db: Session = Depends(get_db),
):
    p = db.get(models.Ping, ping_id)
    if not p or sig != p.ics_secret:
        raise HTTPException(404)

    # Aura-flavoured ICS UID & filename
    ics = generate_ics(
        f"aura-{ping_id}@aura",
        p.title,
        p.starts_at,
        120,
        p.location,
    )
    return Response(
        content=ics,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="aura-{ping_id}.ics"'},
    )


# -------- Users --------


@r.get("/users/search", response_model=List[schemas.UserOut])
def search_users(
    q: str = Query(..., min_length=1),
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    like = f"%{q.lower()}%"
    return (
        db.query(models.User)
        .filter(models.User.id != user.id)
        .filter((models.User.name.ilike(like)) | (models.User.email.ilike(like)))
        .limit(25)
        .all()
    )


@r.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user_profile(
    user_id: int,
    _: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    u = db.get(models.User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    return u


# -------- Unfriend --------


@r.delete("/friends/{other_id}", status_code=204)
def unfriend(
    other_id: int,
    user: models.User = Depends(current_user),
    db: Session = Depends(get_db),
):
    """Remove friendship (and any pending requests) both ways."""
    if hasattr(models, "Friendship"):
        db.query(models.Friendship).filter(
            or_(
                and_(
                    models.Friendship.user_id == user.id,
                    models.Friendship.friend_id == other_id,
                ),
                and_(
                    models.Friendship.user_id == other_id,
                    models.Friendship.friend_id == user.id,
                ),
            )
        ).delete(synchronize_session=False)

    if hasattr(models, "FriendRequest"):
        db.query(models.FriendRequest).filter(
            or_(
                and_(
                    models.FriendRequest.requester_id == user.id,
                    models.FriendRequest.recipient_id == other_id,
                ),
                and_(
                    models.FriendRequest.requester_id == other_id,
                    models.FriendRequest.recipient_id == user.id,
                ),
            )
        ).delete(synchronize_session=False)

    db.commit()
