# Core module exports
from .database import db, client
from .config import (
    EMERGENT_LLM_KEY,
    STRIPE_API_KEY,
    APP_SECRET_KEY,
    RESEND_API_KEY,
    SENDER_EMAIL,
    logger
)
from .auth import hash_password, create_session, get_current_user, get_optional_user
