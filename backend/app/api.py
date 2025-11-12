from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from .auth import get_db, hash_pw, verify_pw, make_token, current_user
from . import schemas, models
from .calendar_ics import generate_ics

r=APIRouter(prefix="/api")

@r.post("/auth/register", response_model=schemas.TokenOut)
def register(data:schemas.RegisterIn, db:Session=Depends(get_db)):
    if db.query(models.User).filter_by(email=data.email).first():
        raise HTTPException(400,"Email already used")
    u=models.User(email=data.email, name=data.name, password_hash=hash_pw(data.password), timezone=data.timezone)
    db.add(u); db.commit(); db.refresh(u)
    return {"access_token": make_token(u.id)}

@r.post("/auth/login", response_model=schemas.TokenOut)
def login(data:schemas.LoginIn, db:Session=Depends(get_db)):
    u=db.query(models.User).filter_by(email=data.email).first()
    if not u or not verify_pw(data.password, u.password_hash):
        raise HTTPException(401,"Bad credentials")
    return {"access_token": make_token(u.id)}

@r.get("/me", response_model=schemas.UserOut)
def me(user:models.User=Depends(current_user)):
    return user

@r.post("/friends/{friend_id}/request")
def request_friend(friend_id:int, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    if friend_id==user.id: raise HTTPException(400,"Cannot add self")
    for a,b in [(user.id,friend_id),(friend_id,user.id)]:
        if not db.query(models.Friendship).filter_by(user_id=a, friend_id=b).first():
            db.add(models.Friendship(user_id=a, friend_id=b, status=models.FriendshipStatus.pending))
    db.commit(); return {"ok":True}

@r.get("/friends/requests/incoming", response_model=List[schemas.UserOut])
def incoming_requests(user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    rows=db.query(models.Friendship).filter_by(friend_id=user.id, status=models.FriendshipStatus.pending).all()
    ids=[r.user_id for r in rows]
    return db.query(models.User).filter(models.User.id.in_(ids)).all() if ids else []

@r.post("/friends/{friend_id}/approve")
def approve_friend(friend_id:int, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    for a,b in [(user.id,friend_id),(friend_id,user.id)]:
        fr=db.query(models.Friendship).filter_by(user_id=a, friend_id=b).first()
        if fr: fr.status=models.FriendshipStatus.accepted
        else: db.add(models.Friendship(user_id=a, friend_id=b, status=models.FriendshipStatus.accepted))
    db.commit(); return {"ok":True}

@r.post("/friends/{friend_id}/decline")
def decline_friend(friend_id:int, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    db.query(models.Friendship).filter(
        ((models.Friendship.user_id==user.id) & (models.Friendship.friend_id==friend_id)) |
        ((models.Friendship.user_id==friend_id) & (models.Friendship.friend_id==user.id))
    ).delete(synchronize_session=False)
    db.commit(); return {"ok":True}

@r.get("/friends", response_model=List[schemas.UserOut])
def friends(user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    ids = [f.friend_id for f in db.query(models.Friendship).filter_by(user_id=user.id, status=models.FriendshipStatus.accepted)]
    ids+= [f.user_id for f in db.query(models.Friendship).filter_by(friend_id=user.id, status=models.FriendshipStatus.accepted)]
    return db.query(models.User).filter(models.User.id.in_(ids)).all() if ids else []

def ping_out(p:models.Ping, db:Session)->schemas.PingOut:
    creator=db.query(models.User).get(p.creator_id)
    invites=db.query(models.PingInvite).filter_by(ping_id=p.id).all()
    users={u.id:u for u in db.query(models.User).filter(models.User.id.in_([i.invitee_id for i in invites])).all()}
    ics_url=f"/api/pings/{p.id}/ics-public?sig={p.ics_secret}"
    return schemas.PingOut(
        id=p.id, title=p.title, starts_at=p.starts_at, location=p.location, notes=p.notes,
        creator=schemas.UserOut.model_validate(creator),
        invites=[{"user":schemas.UserOut.model_validate(users[i.invitee_id]), "status":i.status.value} for i in invites],
        ics_public_url=ics_url
    )

@r.post("/pings", response_model=schemas.PingOut)
def create_ping(data:schemas.PingCreate, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    p=models.Ping(creator_id=user.id, title=data.title, starts_at=data.starts_at, location=data.location, notes=data.notes)
    db.add(p); db.commit(); db.refresh(p)
    for invitee_id in data.invitee_ids:
        db.add(models.PingInvite(ping_id=p.id, invitee_id=invitee_id))
    db.commit()
    return ping_out(p, db)

@r.get("/pings/inbox", response_model=List[schemas.PingOut])
def inbox(user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    my_creations=db.query(models.Ping).filter_by(creator_id=user.id).all()
    my_invites=db.query(models.Ping).join(models.PingInvite, models.Ping.id==models.PingInvite.ping_id)\
        .filter(models.PingInvite.invitee_id==user.id, models.PingInvite.status!=models.InviteStatus.declined).all()
    ids={p.id for p in my_creations+my_invites}
    return [ping_out(db.query(models.Ping).get(pid), db) for pid in ids]

@r.get("/pings/{ping_id}", response_model=schemas.PingOut)
def get_ping(ping_id:int, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    p=db.query(models.Ping).get(ping_id)
    if not p: raise HTTPException(404)
    return ping_out(p, db)

@r.post("/pings/{ping_id}/respond")
def respond(ping_id:int, data:schemas.RespondIn, user:models.User=Depends(current_user), db:Session=Depends(get_db)):
    inv=db.query(models.PingInvite).filter_by(ping_id=ping_id, invitee_id=user.id).first()
    if not inv: raise HTTPException(404, "No invite found")
    inv.status=models.InviteStatus(data.status); inv.responded_at=datetime.utcnow()
    db.commit(); return {"ok":True}

@r.get("/pings/{ping_id}/ics-public")
def ics_public(ping_id:int, sig:str, db:Session=Depends(get_db)):
    p=db.query(models.Ping).get(ping_id)
    if not p or sig!=p.ics_secret: raise HTTPException(404)
    ics=generate_ics(f"ping-{ping_id}@pfb", p.title, p.starts_at, 120, p.location)
    return Response(content=ics, media_type="text/calendar",
                    headers={"Content-Disposition": f'attachment; filename="ping-{ping_id}.ics"'})
