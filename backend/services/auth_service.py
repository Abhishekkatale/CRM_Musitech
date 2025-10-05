from typing import Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.user import User, UserCreate, UserLogin, UserResponse, Token
from utils.auth import AuthUtils, get_token_expires_in

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db.users

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create user object
        user = User(
            email=user_data.email,
            password_hash=AuthUtils.get_password_hash(user_data.password),
            role=user_data.role,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            company=user_data.company,
            phone=user_data.phone
        )
        
        # Save to database
        result = await self.users_collection.insert_one(user.dict())
        
        # Return user response
        return UserResponse(**user.dict())

    async def authenticate_user(self, login_data: UserLogin) -> Optional[User]:
        """Authenticate user with email and password"""
        user_doc = await self.users_collection.find_one({"email": login_data.email})
        
        if not user_doc:
            return None
        
        user = User(**user_doc)
        
        # Verify password
        if not AuthUtils.verify_password(login_data.password, user.password_hash):
            return None
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled"
            )
        
        return user

    async def login(self, login_data: UserLogin) -> Token:
        """Login user and return JWT token"""
        user = await self.authenticate_user(login_data)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login
        await self.users_collection.update_one(
            {"id": user.id},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 days
        access_token = AuthUtils.create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role},
            expires_delta=access_token_expires
        )
        
        # Update user object with last login
        user.last_login = datetime.utcnow()
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=get_token_expires_in(),
            user=UserResponse(**user.dict())
        )

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_doc = await self.users_collection.find_one({"id": user_id})
        if user_doc:
            return User(**user_doc)
        return None

    async def get_user_profile(self, user_id: str) -> UserResponse:
        """Get user profile"""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(**user.dict())

    async def create_admin_user(self) -> UserResponse:
        """Create default admin user if not exists"""
        admin_email = "admin@musitech.com"
        
        # Check if admin already exists
        existing_admin = await self.users_collection.find_one({"email": admin_email})
        if existing_admin:
            return UserResponse(**existing_admin)
        
        # Create admin user
        admin_data = UserCreate(
            email=admin_email,
            password="admin",
            role="admin",
            first_name="Admin",
            last_name="User",
            company="Musitech"
        )
        
        return await self.create_user(admin_data)