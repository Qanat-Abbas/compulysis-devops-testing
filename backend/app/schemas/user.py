from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


# Login Request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


# Register Request
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirmPassword: str = Field(..., min_length=8)
    licenseNumber: Optional[str] = Field(None, max_length=100)
    specialization: str = Field(..., max_length=255)
    institution: str = Field(..., max_length=255)
    
    @field_validator('confirmPassword')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# User Response (without password)
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    licenseNumber: Optional[str] = None
    specialization: Optional[str] = None
    institution: Optional[str] = None
    createdAt: datetime
    
    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }
    
    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            email=obj.email,
            name=obj.name,
            role=obj.role,
            licenseNumber=obj.license_number,
            specialization=obj.specialization,
            institution=obj.institution,
            createdAt=obj.created_at
        )


# Forgot Password Request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# Reset Password Request
class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str = Field(..., min_length=8)
    confirmPassword: str = Field(..., min_length=8)
    
    @field_validator('confirmPassword')
    @classmethod
    def passwords_match(cls, v, info):
        if 'newPassword' in info.data and v != info.data['newPassword']:
            raise ValueError('Passwords do not match')
        return v


# Generic Response
class MessageResponse(BaseModel):
    message: str


Token.model_rebuild()