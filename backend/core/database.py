"""
Database Configuration for Plutus Predict
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# MongoDB connection with error handling
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'plutus_predict')

try:
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    logger.info(f"MongoDB client initialized for database: {db_name}")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    client = None
    db = None
