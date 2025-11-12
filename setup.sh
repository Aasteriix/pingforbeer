# 0) Go to project root
cd /Users/astriddahlen/PycharmProjects/pingforbeer

# 1) Make folders
mkdir -p backend/app frontend/src/components docs

# 2) Create .env (minimal, no OAuth yet)
cat > .env <<'EOF'
JWT_SECRET=dev-secret-change-me
# DATABASE_URL=postgresql+psycopg2://pfb:pfbpass@db:5432/pfb
EOF

# 3) Root docker-compose.yml (SQLite only)
cat > docker-compose.yml <<'EOF'
services:
  api:
    build: ./backend
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"

  web:
    build: ./frontend
    environment:
      - VITE_API_URL=http://localhost:8000/api
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    depends_on:
      - api
EOF

# 4) BACKEND: Dockerfile
cat > backend/Dockerfile <<'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml /app/
RUN pip install --no-cache-dir fastapi uvicorn[standard] sqlalchemy pydantic bcrypt PyJWT python-multipart anyio
COPY app /app/app
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--reload"]
EOF

# 5) BACKEND: pyproject.toml
cat > backend/pyproject.toml <<'EOF'
[project]
name="pingforbeer-backend"
version="0.1.0"
dependencies=[
  "fastapi",
  "uvicorn[standard]",
  "sqlalchemy",
  "pydantic",
  "bcrypt",
  "PyJWT",
  "python-multipart",
  "anyio"
]
EOF

# 6) BACKEND: db.py
cat > backend/app/db.py <<'EOF'
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pfb.sqlite3")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
EOF

# 7) BACKEND: models.py
cat > backend/app/models.py <<'EOF'
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, UniqueConstraint
from datetime import datetime
from .db import Base
import enum, secrets

class FriendshipStatus(str, enum.Enum):
    accepted="accepted"; pending="pending"

class InviteStatus(str, enum.Enum):
    pending="pending"; accepted="accepted"; declined="declined"; maybe="maybe"

class PingStatus(str, enum.Enum):
    open="open"; closed="closed"

class User(Base):
    __tablename__="users"
    id=Column(Integer, primary_key=True)
    email=Column(String, unique=True, index=True, nullable=False)
    name=Column(String, nullable=False)
    password_hash=Column(String, nullable=False)
    timezone=Column(String, nullable=True)
    created_at=Column(DateTime, default=datetime.utcnow)

class Friendship(Base):
    __tablename__="friendships"
    user_id=Column(Integer, ForeignKey("users.id"), primary_key=True)
    friend_id=Column(Integer, ForeignKey("users.id"), primary_key=True)
    status=Column(Enum(FriendshipStatus), default=FriendshipStatus.pending)

class Ping(Base):
    __tablename__="pings"
    id=Column(Integer, primary_key=True)
    creator_id=Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    title=Column(String, default="Beer?")
    starts_at=Column(DateTime, nullable=False)
    location=Column(String, nullable=False)
    notes=Column(Text, nullable=True)
    status=Column(Enum(PingStatus), default=PingStatus.open)
    ics_secret=Column(String, default=lambda: secrets.token_urlsafe(16), nullable=False)
    created_at=Column(DateTime, default=datetime.utcnow)

class PingInvite(Base):
    __tablename__="ping_invites"
    id=Column(Integer, primary_key=True)
    ping_id=Column(Integer, ForeignKey("pings.id"), index=True, nullable=False)
    invitee_id=Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    status=Column(Enum(InviteStatus), default=InviteStatus.pending)
    responded_at=Column(DateTime, nullable=True)
    __table_args__=(UniqueConstraint("ping_id","invitee_id", name="uniq_ping_invitee"),)
EOF

# 8) BACKEND: schemas.py
cat > backend/app/schemas.py <<'EOF'
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional, Literal

class UserOut(BaseModel):
    id:int; email:EmailStr; name:str; timezone: Optional[str]=None
    class Config: from_attributes=True

class TokenOut(BaseModel):
    access_token:str; token_type:str="bearer"

class RegisterIn(BaseModel):
    email:EmailStr; name:str; password:str; timezone: Optional[str]=None

class LoginIn(BaseModel):
    email:EmailStr; password:str

class PingCreate(BaseModel):
    title:str="Beer?"
    starts_at:datetime
    location:str
    notes:Optional[str]=None
    invitee_ids:List[int]

class InviteOut(BaseModel):
    user:UserOut
    status:Literal["pending","accepted","declined","maybe"]

class PingOut(BaseModel):
    id:int; title:str; starts_at:datetime; location:str; notes:Optional[str]
    creator:UserOut
    invites:List[InviteOut]
    ics_public_url:str
    class Config: from_attributes=True

class RespondIn(BaseModel):
    status:Literal["accepted","declined","maybe"]
EOF

# 9) BACKEND: auth.py
cat > backend/app/auth.py <<'EOF'
from datetime import datetime, timedelta
import jwt, bcrypt, os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import User

JWT_SECRET=os.getenv("JWT_SECRET","dev-change-me")
auth_scheme=HTTPBearer()

def get_db():
    db=SessionLocal()
    try: yield db
    finally: db.close()

def hash_pw(p:str)->str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p:str, h:str)->bool:
    return bcrypt.checkpw(p.encode(), h.encode())

def make_token(user_id:int)->str:
    payload={"sub":user_id, "exp":datetime.utcnow()+timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def current_user(creds:HTTPAuthorizationCredentials=Depends(auth_scheme), db:Session=Depends(get_db))->User:
    try:
        payload=jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user=db.query(User).get(payload["sub"])
        if not user: raise Exception()
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
EOF

# 10) BACKEND: calendar_ics.py
cat > backend/app/calendar_ics.py <<'EOF'
from datetime import datetime, timedelta
def generate_ics(uid:str, title:str, starts_at:datetime, duration_minutes:int, location:str)->str:
    dtstart=starts_at.strftime("%Y%m%dT%H%M%SZ")
    dtend=(starts_at+timedelta(minutes=duration_minutes)).strftime("%Y%m%dT%H%M%SZ")
    return "\r\n".join([
        "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//PingForBeer//EN",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstart}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{title}",
        f"LOCATION:{location}",
        "END:VEVENT","END:VCALENDAR",""
    ])
EOF

# 11) BACKEND: api.py
cat > backend/app/api.py <<'EOF'
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
EOF

# 12) BACKEND: main.py
cat > backend/app/main.py <<'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base, engine
from . import api

Base.metadata.create_all(bind=engine)

app=FastAPI(title="PingForBeer API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(api.r)
EOF

# 13) FRONTEND: Dockerfile
cat > frontend/Dockerfile <<'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host"]
EOF

# 14) FRONTEND: package.json
cat > frontend/package.json <<'EOF'
{
  "name": "pingforbeer-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite"
  },
  "dependencies": {
    "vite": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF

# 15) FRONTEND: vite.config.js
cat > frontend/vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins:[react()] })
EOF

# 16) FRONTEND: index.html
cat > frontend/index.html <<'EOF'
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Ping for Beer</title>
  </head>
  <body style="margin:0;background:#0b0b10;color:#fff;font-family:system-ui,Arial">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# 17) FRONTEND: src/main.jsx
cat > frontend/src/main.jsx <<'EOF'
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(<App />);
EOF

# 18) FRONTEND: src/api.js
cat > frontend/src/api.js <<'EOF'
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const setToken = (t) => localStorage.setItem("token", t);
export const getToken = () => localStorage.getItem("token");
const hdr = () => ({ "Content-Type":"application/json", "Authorization":`Bearer ${getToken()}` });

export async function registerAccount(email,name,password,timezone){
  const r=await fetch(`${API}/auth/register`,{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,name,password,timezone})});
  if(!r.ok) throw new Error("Register failed"); return r.json();
}
export async function login(email,password){
  const r=await fetch(`${API}/auth/login`,{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email,password})});
  if(!r.ok) throw new Error("Login failed"); return r.json();
}
export async function me(){ return (await fetch(`${API}/me`,{headers:hdr()})).json(); }
export async function friends(){ return (await fetch(`${API}/friends`,{headers:hdr()})).json(); }
export async function requestFriend(id){ return (await fetch(`${API}/friends/${id}/request`,{method:"POST", headers:hdr()})).json(); }
export async function approveFriend(id){ return (await fetch(`${API}/friends/${id}/approve`,{method:"POST", headers:hdr()})).json(); }
export async function createPing(payload){
  const r=await fetch(`${API}/pings`,{method:"POST", headers:hdr(), body:JSON.stringify(payload)});
  if(!r.ok) throw new Error("Create failed"); return r.json();
}
export async function inbox(){ return (await fetch(`${API}/pings/inbox`,{headers:hdr()})).json(); }
export async function respond(pingId,status){
  return (await fetch(`${API}/pings/${pingId}/respond`,{method:"POST", headers:hdr(), body:JSON.stringify({status})})).json();
}
EOF

# 19) FRONTEND: src/App.jsx (super-minimal UI)
cat > frontend/src/App.jsx <<'EOF'
import React, { useState, useEffect } from "react";
import { setToken, registerAccount, login, me, friends, requestFriend, approveFriend, createPing, inbox, respond } from "./api";

export default function App(){
  const [email,setEmail]=useState("you@example.com");
  const [password,setPassword]=useState("pass123");
  const [name,setName]=useState("You");
  const [user,setUser]=useState(null);
  const [list,setList]=useState([]);
  const [items,setItems]=useState([]);
  const [title,setTitle]=useState("Beer?");
  const [location,setLocation]=useState("Local pub");
  const [startsAt,setStartsAt]=useState("");

  const load = async()=>{
    try{ setUser(await me()); }catch{}
    if(getToken()) {
      setList(await friends());
      setItems(await inbox());
    }
  };

  useEffect(()=>{ load(); },[]);

  return (
    <div style={{maxWidth:800, margin:"0 auto", padding:16}}>
      <h1>🍻 Ping for Beer</h1>

      {!user && (
        <div style={{display:"grid", gap:8, marginBottom:16}}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{display:"flex", gap:8}}>
            <button onClick={async()=>{
              const r=await registerAccount(email,name,password,"Europe/Stockholm");
              setToken(r.access_token); await load();
            }}>Register</button>
            <button onClick={async()=>{
              const r=await login(email,password);
              setToken(r.access_token); await load();
            }}>Login</button>
          </div>
        </div>
      )}

      {user && (
        <>
          <div style={{marginBottom:16}}>Logged in as <b>{user.name}</b> ({user.email})</div>

          <h3>New Ping</h3>
          <div style={{display:"grid", gap:8, marginBottom:16}}>
            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
            <input placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
            <input type="datetime-local" onChange={e=>setStartsAt(e.target.value)} />
            <button onClick={async ()=>{
              const fr = await friends();
              const invitee_ids = fr.map(f=>f.id); // invite all friends for demo
              const payload={title, location, starts_at:new Date(startsAt).toISOString(), invitee_ids};
              await createPing(payload);
              setItems(await inbox());
            }}>Send Ping</button>
          </div>

          <h3>Inbox</h3>
          <div style={{display:"grid", gap:8}}>
            {items.map(p=>(
              <div key={p.id} style={{padding:12, border:"1px solid #555", borderRadius:8}}>
                <div><b>{p.title}</b> • {new Date(p.starts_at).toLocaleString()} • {p.location}</div>
                <div>Invited: {p.invites.map(i=>`${i.user.name} (${i.status})`).join(", ")}</div>
                <div style={{display:"flex", gap:8, marginTop:8}}>
                  <button onClick={async()=>{await respond(p.id,"declined"); setItems(await inbox());}}>No</button>
                  <button onClick={async()=>{await respond(p.id,"maybe"); setItems(await inbox());}}>Maybe</button>
                  <button onClick={async()=>{await respond(p.id,"accepted"); setItems(await inbox());}}>Yes</button>
                  <a href={p.ics_public_url}>Add to calendar</a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getToken(){ return localStorage.getItem("token"); }
EOF

# 20) Optional: add your docs/setup.md placeholder so it exists
cat > docs/setup.md <<'EOF'
# Ping for Beer – Setup
This is a placeholder. The running app instructions are in the root README or your ChatGPT export.
EOF
