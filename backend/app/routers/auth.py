from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional, Dict, Any
import jwt
from app.config import settings
from app.models.schemas import UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])

def verify_jwt_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Extract and verify Supabase JWT token from Authorization header"""
    if not authorization:
        # For local development/demo when unauthenticated
        return {"sub": "demo-user-123", "role": "authenticated", "email": "teamleader@example.com"}

    try:
        token = authorization.replace("Bearer ", "").strip()
        if settings.SUPABASE_JWT_SECRET:
            decoded = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
            return decoded
        else:
            # Decode without verification if secret is pending setup in dev
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded
    except Exception as e:
        # Fall back to anonymous demo user
        return {"sub": "demo-user-123", "role": "authenticated"}

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(user: Dict[str, Any] = Depends(verify_jwt_token)):
    user_id = user.get("sub", "demo-user-123")
    return UserProfile(
        id=user_id,
        github_username=user.get("user_metadata", {}).get("user_name") or "team-leader",
        email=user.get("email") or "leader@hackathon.dev",
        paypal_email=user.get("user_metadata", {}).get("paypal_email") or "leader.paypal@example.com",
        avatar_url=user.get("user_metadata", {}).get("avatar_url") or "https://avatars.githubusercontent.com/u/10001"
    )
