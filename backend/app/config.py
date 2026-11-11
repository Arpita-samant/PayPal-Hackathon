import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Meta Hackathon Prize Splitter API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Supabase configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = (
        os.getenv("SUPABASE_ANON_KEY", "") 
        or os.getenv("SUPABASE_PUBLISHABLE_KEY", "") 
        or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    )
    SUPABASE_SERVICE_ROLE_KEY: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") 
        or os.getenv("SUPABASE_SECRET_KEY", "")
    )
    SUPABASE_JWKS_URL: str = os.getenv("SUPABASE_JWKS_URL", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    
    # External APIs
    GITHUB_ACCESS_TOKEN: str = os.getenv("GITHUB_ACCESS_TOKEN", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # PayPal configuration
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_ENVIRONMENT: str = os.getenv("PAYPAL_ENVIRONMENT", "sandbox")  # sandbox | live
    
    # Execution mode
    MOCK_MODE_ENABLED: bool = os.getenv("MOCK_MODE_ENABLED", "false").lower() in ("true", "1", "t")

    @property
    def paypal_base_url(self) -> str:
        if self.PAYPAL_ENVIRONMENT == "live":
            return "https://api-m.paypal.com"
        return "https://api-m.sandbox.paypal.com"

settings = Settings()
