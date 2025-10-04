from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.user import UserLogin, UserCreate, UserResponse, Token
from services.auth_service import AuthService
from utils.auth import AuthUtils

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Import database dependency
from dependencies import get_database

# Dependency to get current user from JWT token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> UserResponse:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    # Verify token and get payload
    payload = AuthUtils.verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Get user from database
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserResponse(**user.dict())

@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login user with email and password"""
    auth_service = AuthService(db)
    return await auth_service.login(login_data)

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register a new user"""
    auth_service = AuthService(db)
    return await auth_service.create_user(user_data)

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user info (alias for profile)"""
    return current_user

@router.post("/create-admin", response_model=UserResponse)
async def create_admin(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create default admin user (for setup purposes)"""
    auth_service = AuthService(db)
    return await auth_service.create_admin_user()