import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

supabase_client: Optional[Client] = None
supabase_admin: Optional[Client] = None

# In-memory storage fallback for demo/local testing when Supabase keys are unset
in_memory_db = {
    "teams": {},
    "team_members": {},
    "commit_audits": {},
    "fairness_reports": {},
    "payout_receipts": {}
}

def init_db():
    global supabase_client, supabase_admin
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            logger.info("Supabase client initialized successfully.")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase client: {e}. Falling back to memory mode.")
    
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            logger.info("Supabase admin client (Service Role) initialized successfully.")
        except Exception as e:
            logger.warning(f"Failed to initialize Supabase admin client: {e}.")

def get_supabase() -> Optional[Client]:
    return supabase_client

def get_supabase_admin() -> Optional[Client]:
    return supabase_admin or supabase_client
