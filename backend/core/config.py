"""
Configuration and API Keys for Plutus Predict
"""
import os
import secrets
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
SUPADATA_API_KEY = os.environ.get('SUPADATA_API_KEY', 'sd_05d93ed22e29')
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', secrets.token_hex(32))
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'alerts@plutuspredict.com')
