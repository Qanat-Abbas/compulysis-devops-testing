from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import (
    LoginRequest, 
    RegisterRequest, 
    Token, 
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.services.auth_service import AuthService
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new psychologist user
    
    - **name**: Full name of the psychologist
    - **email**: Valid email address (must be unique)
    - **password**: Minimum 8 characters
    - **confirmPassword**: Must match password
    - **licenseNumber**: Optional professional license number
    - **specialization**: Area of specialization (required)
    - **institution**: Healthcare institution (required)
    """
    user = AuthService.register_user(db, user_data)
    
    return MessageResponse(
        message="Registration successful! You can now login with your credentials."
    )


@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password
    
    Returns JWT access token and user information
    """
    # Authenticate user
    user = AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    # Create access token
    access_token = AuthService.create_user_token(user)
    
    # Return token and user data
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    
    Requires valid JWT token in Authorization header
    """
    return UserResponse.from_orm(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process
    
    Sends password reset email to user (if email exists)
    For security, always returns success message
    """
    message = AuthService.initiate_password_reset(db, request.email)
    
    return MessageResponse(message=message)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using reset token
    
    Token is valid for 1 hour after generation
    """
    message = AuthService.reset_password(db, request.token, request.newPassword)
    
    return MessageResponse(message=message)


@router.post("/verify-token", response_model=dict)
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """
    Verify if JWT token is valid
    
    Returns user info if token is valid
    """
    return {
        "valid": True,
        "user": UserResponse.from_orm(current_user)
    }