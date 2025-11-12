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
