from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from app.models.user import User
from app.schemas.user import RegisterRequest, LoginRequest
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    generate_reset_token
)


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """
        Authenticate user with email and password
        """
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive. Please contact support."
            )
        
        return user
    
    @staticmethod
    def register_user(db: Session, user_data: RegisterRequest) -> User:
        """
        Register a new psychologist user
        """
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please use a different email or login."
            )
        
        # Check if license number already exists (if provided and not empty)
        if user_data.licenseNumber and user_data.licenseNumber.strip():
            existing_license = db.query(User).filter(
                User.license_number == user_data.licenseNumber
            ).first()
            if existing_license:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="License number already registered."
                )
        
        # Create new user
        new_user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name,
            role="psychologist",
            license_number=user_data.licenseNumber if user_data.licenseNumber and user_data.licenseNumber.strip() else None,
            specialization=user_data.specialization,
            institution=user_data.institution,
            is_active=True,
            is_verified=False  # Can implement email verification later
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    
    @staticmethod
    def create_user_token(user: User) -> str:
        """
        Create JWT token for user
        """
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        return access_token
    
    @staticmethod
    def initiate_password_reset(db: Session, email: str) -> str:
        """
        Initiate password reset - generate token and save to database
        """
        user = db.query(User).filter(User.email == email).first()
        
        # For security, don't reveal if email exists
        # Always return success message
        if not user:
            return "If an account exists with this email, password reset instructions have been sent."
        
        # Generate reset token
        reset_token = generate_reset_token()
        reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
        
        # Save token to database
        user.reset_token = reset_token
        user.reset_token_expires = reset_token_expires
        db.commit()
        
        # TODO: Send email with reset link
        # send_password_reset_email(user.email, reset_token)
        
        return "Password reset instructions have been sent to your email."
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> str:
        """
        Reset password using token
        """
        user = db.query(User).filter(User.reset_token == token).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Check if token is expired
        if user.reset_token_expires < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired. Please request a new one."
            )
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        
        return "Password has been reset successfully. You can now login with your new password."