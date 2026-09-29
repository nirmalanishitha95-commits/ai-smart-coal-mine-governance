from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_name: str # SUPER ADMIN, GOVERNMENT OFFICER, MINE MANAGER, INSPECTOR
    designation: Optional[str] = None
    phone: Optional[str] = None
    mine_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_id: int
    role_name: str
    designation: Optional[str] = None
    phone: Optional[str] = None
    mine_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None
