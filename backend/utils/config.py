"""
Configuration and API Keys for Plutus Predict
"""
import os
import secrets
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
SUPADATA_API_KEY = os.environ.get('SUPADATA_API_KEY', 'sd_05d93ed22e29')
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', secrets.token_hex(32))
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'alerts@plutuspredict.com')

# Pricing Plans
PRICING_PLANS = {
    "basic": {"name": "Basic", "price": 500.00, "features": ["100 forecasts/month", "Basic OSINT", "Email support"]},
    "professional": {"name": "Professional", "price": 2000.00, "features": ["Unlimited forecasts", "Full OSINT access", "Priority support", "API access"]},
    "enterprise": {"name": "Enterprise", "price": 5000.00, "features": ["Everything in Pro", "Custom integrations", "Dedicated support", "White-label"]}
}

# OSINT Categories
OSINT_CATEGORIES = {
    "conflict": {"name": "Conflict & Security", "refresh_hours": 6},
    "economic_indicators": {"name": "Economic Indicators", "refresh_hours": 24},
    "natural_disasters": {"name": "Natural Disaster Risk", "refresh_hours": 6},
    "geopolitical": {"name": "Geopolitical Events", "refresh_hours": 12},
    "pandemic": {"name": "Pandemic Risk", "refresh_hours": 24},
    "market_events": {"name": "Market Events", "refresh_hours": 12},
}
