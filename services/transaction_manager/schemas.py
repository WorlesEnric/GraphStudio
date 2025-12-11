from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class SubscriptionBase(BaseModel):
    plan_name: str
    is_active: bool
    start_date: datetime
    end_date: Optional[datetime] = None

class Subscription(SubscriptionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    subscription: Optional[Subscription] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
