from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
import io
from video_interview_service import VideoInterviewService
from job_crawler_service import JobCrawlerService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Session model for Google OAuth
class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Job Categories
JOB_CATEGORIES = [
    "Doctors/Physicians",
    "Medicine & Medical Research",
    "Scientific Research",
    "Nutrition & Dietetics",
    "Physics",
    "Consulting",
    "Teaching & Academia",
    "Chemistry",
    "Medical Tutoring",
    "Behavioral Science",
    "Mathematics"
]

# ============= Models =============

class UserRole:
    CANDIDATE = "candidate"
    EMPLOYER = "employer"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: str  # candidate or employer
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class CandidateProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    specialization: str
    experience_years: int
    skills: List[str] = []
    education: str
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    location: Optional[str] = None
    cv_url: Optional[str] = None
    resume_file: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    other_links: List[str] = []
    publications: List[str] = []
    certifications: List[str] = []
    availability: str = "Full-time"
    salary_expectation: Optional[str] = None
    interview_completed: bool = False
    interview_score: Optional[float] = None
    ai_vetting_score: Optional[float] = None
    ai_recommendation: Optional[str] = None
    profile_searchable: bool = True
    referral_code: Optional[str] = None
    total_earnings: float = 0.0
    subscription_status: str = "free"  # free, active, cancelled, expired
    subscription_plan: Optional[str] = None  # basic, premium
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidateProfileCreate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: str
    experience_years: int
    skills: List[str]
    education: str
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    other_links: List[str] = []
    publications: List[str] = []
    certifications: List[str] = []
    availability: str = "Full-time"
    salary_expectation: Optional[str] = None

class EmployerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    company_type: str  # Hospital, Research Lab, University, etc.
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployerProfileCreate(BaseModel):
    company_name: str
    company_type: str
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str
    title: str
    category: str
    description: str
    requirements: List[str]
    skills_required: List[str]
    location: str
    job_type: str  # Full-time, Part-time, Contract, Remote
    salary_range: Optional[str] = None
    experience_required: str
    # New detailed fields
    role_overview: str
    specific_tasks: List[str]
    education_requirements: str
    knowledge_areas: List[str]
    communication_skills: str = "Excellent communication required"
    responsiveness_required: bool = True
    independent_work: bool = True
    ai_understanding: bool = False
    english_proficiency: str = "High proficiency required"
    work_type: str  # Remote, Hybrid, On-site
    schedule_commitment: str
    compensation_details: str
    terms_conditions: str
    project_summary: str
    posted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"  # active, closed

class JobCreate(BaseModel):
    title: str
    category: str
    description: str
    requirements: List[str]
    skills_required: List[str]
    location: str
    job_type: str
    salary_range: Optional[str] = None
    experience_required: str
    role_overview: str
    specific_tasks: List[str]
    education_requirements: str
    knowledge_areas: List[str]
    communication_skills: str = "Excellent communication required"
    responsiveness_required: bool = True
    independent_work: bool = True
    ai_understanding: bool = False
    english_proficiency: str = "High proficiency required"
    work_type: str
    schedule_commitment: str
    compensation_details: str
    terms_conditions: str
    project_summary: str

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    candidate_id: str
    employer_id: str
    cover_letter: Optional[str] = None
    status: str = "pending"  # pending, reviewed, shortlisted, rejected, accepted
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    referral_code: Optional[str] = None  # MedEvidences tracking code
    sent_to_employer: bool = False  # Admin sent to employer via email
    sent_at: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None


class VideoInterview(BaseModel):
    """Video interview with recording and transcription"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    job_id: Optional[str] = None
    video_url: Optional[str] = None  # Stored video file path
    audio_url: Optional[str] = None  # Extracted audio
    transcript: Optional[str] = None  # Whisper transcription
    questions_asked: List[str] = []
    duration_seconds: Optional[int] = None
    status: str = "pending"  # pending, processing, completed, failed
    ai_analysis: Optional[dict] = None  # AI vetting results
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class JobOffer(BaseModel):
    """Job offers sent to candidates"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    employer_id: str
    job_id: str
    job_title: str
    company_name: str
    salary_offered: str
    employment_type: str  # Full-time, Part-time, Contract
    start_date: Optional[str] = None
    benefits: List[str] = []
    offer_letter_url: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected, expired
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    accepted_at: Optional[datetime] = None
    notes: Optional[str] = None

class AIInterview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    specialization: str
    questions: List[dict]  # [{"question": "...", "answer": "...", "score": 0-10, "analysis": "..."}]
    overall_score: float
    transcript: str  # Full interview transcript
    performance_analysis: dict  # {"communication": 0-10, "technical": 0-10, "problem_solving": 0-10}
    ai_vetting_score: float  # Overall AI vetting score
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendation: str  # "Highly Recommended", "Recommended", "Consider with caution"
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIInterviewCreate(BaseModel):
    specialization: str
    questions: List[dict]

class JobMatch(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    match_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]
    match_reasons: List[str]

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    employer_id: str
    job_id: str
    title: str
    description: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    salary: str
    status: str = "pending"  # pending, active, completed, terminated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Offer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    employer_id: str
    job_id: str
    title: str
    salary: str
    perks: List[str] = []
    start_date: Optional[str] = None
    contract_duration: Optional[str] = None
    status: str = "pending"  # pending, accepted, rejected, withdrawn
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_email: str
    contact_name: Optional[str] = None
    looking_for: str
    role: str
    contract_timeframe: str
    pay_offer: str
    perks: str
    requirements: str
    application_deadline: Optional[str] = None
    process: str
    incentives: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyContactCreate(BaseModel):
    company_name: str
    contact_email: EmailStr
    contact_name: Optional[str] = None
    looking_for: str
    role: str
    contract_timeframe: str
    pay_offer: str
    perks: str
    requirements: str
    application_deadline: Optional[str] = None
    process: str
    incentives: Optional[str] = None

class EmailNotification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    to_email: EmailStr
    subject: str
    content: str
    notification_type: str  # application_received, status_change, new_job, etc.
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # pending, sent, failed

class StripePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str
    amount: float
    currency: str = "usd"
    payment_type: str  # job_posting, subscription, success_fee
    job_id: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None
    status: str = "pending"  # pending, completed, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str
    plan_type: str  # basic, premium
    stripe_subscription_id: Optional[str] = None
    status: str = "active"  # active, cancelled, expired
    starts_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ends_at: datetime
    auto_renew: bool = True

class SuccessFee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employer_id: str
    candidate_id: str
    job_id: str
    annual_salary: float
    fee_percentage: float = 10.0
    fee_amount: float
    status: str = "pending"  # pending, invoiced, paid, disputed
    hire_confirmed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_due_date: datetime

# New Models for Advanced Features

class ResumeData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    file_name: str
    parsed_skills: List[str] = []
    parsed_experience_years: Optional[int] = None
    parsed_education: List[str] = []
    parsed_certifications: List[str] = []
    raw_text: str
    ai_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    job_id: str
    overall_score: float  # 0-100
    skills_match: float
    experience_match: float
    education_match: float
    ai_interview_score: Optional[float] = None
    ai_reasoning: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    candidate_id: str
    job_id: str
    employer_id: str
    hire_outcome: str  # hired, rejected, withdrawn
    employer_rating: Optional[int] = None  # 1-5
    candidate_rating: Optional[int] = None  # 1-5
    employer_feedback: Optional[str] = None
    candidate_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PayrollRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_id: str
    candidate_id: str
    employer_id: str
    period_start: datetime
    period_end: datetime
    hours_worked: float
    hourly_rate: float
    total_amount: float
    status: str = "pending"  # pending, approved, paid
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None

class ComplianceDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contract_id: str
    candidate_id: str
    document_type: str  # w9, i9, nda, contract
    file_name: str
    file_url: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None

class ScrapedJob(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str = "mercor"
    external_id: Optional[str] = None
    title: str
    description: str
    category: str
    location: Optional[str] = None
    salary_range: Optional[str] = None
    imported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    converted_to_job: bool = False
    job_id: Optional[str] = None

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def check_admin(user: dict):
    """Check if user is admin"""
    if user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    return True

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        
        # First try to decode as JWT (for regular auth)
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            return user
        except jwt.JWTError:
            # If JWT fails, check if it's an OAuth session token
            session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
            if not session:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            # Check if session expired
            expires_at = datetime.fromisoformat(session['expires_at'])
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            
            # Get user from session
            user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            return user
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= Routes =============

@api_router.get("/")
async def root():
    return {"message": "MedEvidences API", "version": "1.0"}

@api_router.get("/categories")
async def get_categories():
    return {"categories": JOB_CATEGORIES}

# Authentication Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        full_name=user_data.full_name
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token({"sub": user.id, "role": user.role})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user['id'], "role": user['role']})
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user['id'],
            "email": user['email'],
            "role": user['role'],
            "full_name": user['full_name']
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user['id'],
        "email": current_user['email'],
        "role": current_user['role'],
        "full_name": current_user['full_name']
    }

# Google OAuth Session Management
@api_router.post("/auth/session")
async def create_session_from_google(request: Request):
    """Handle Google OAuth session creation"""
    try:
        session_id = request.headers.get('X-Session-ID')
        logging.info(f"OAuth session request received with session_id: {session_id[:20] if session_id else 'None'}...")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Get user data from Emergent OAuth service
        import aiohttp
        oauth_service_url = os.environ.get('OAUTH_SERVICE_URL', 'https://demobackend.emergentagent.com')
        logging.info(f"Fetching user data from OAuth service: {oauth_service_url}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f'{oauth_service_url}/auth/v1/env/oauth/session-data',
                headers={'X-Session-ID': session_id}
            ) as response:
                response_text = await response.text()
                logging.info(f"OAuth service response status: {response.status}")
                
                if response.status != 200:
                    logging.error(f"OAuth service error: {response_text}")
                    raise HTTPException(status_code=401, detail=f"Invalid session: {response_text}")
                
                user_data = await response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
        logging.info(f"User lookup for {user_data['email']}: {'Found' if existing_user else 'Not found'}")
        
        if not existing_user:
            # Create new user (role will be set later)
            logging.info(f"Creating new OAuth user: {user_data['email']}")
            user = User(
                email=user_data['email'],
                password_hash='',  # OAuth users don't have password
                role='',  # Will be set on first login
                full_name=user_data['name']
            )
            user_dict = user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            user_dict['oauth_provider'] = 'google'
            user_dict['oauth_picture'] = user_data.get('picture', '')
            await db.users.insert_one(user_dict)
            user_id = user.id
            logging.info(f"New user created with ID: {user_id}")
        else:
            user_id = existing_user['id']
            logging.info(f"Using existing user ID: {user_id}")
        
        # Create session in database
        session_token = user_data['session_token']
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_doc = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'session_token': session_token,
            'expires_at': expires_at.isoformat()
        }
        await db.sessions.insert_one(session_doc)
        logging.info(f"Session created successfully for user {user_id}")
        
        # Return user data and session token
        user_response = {
            "session_token": session_token,
            "user": {
                "id": user_id,
                "email": user_data['email'],
                "full_name": user_data['name'],  # Changed to full_name to match User model
                "picture": user_data.get('picture'),
                "role": existing_user.get('role', '') if existing_user else ''
            }
        }
        logging.info(f"OAuth session successful for {user_data['email']}, role: {user_response['user']['role']}")
        return user_response
    except HTTPException as he:
        logging.error(f"OAuth HTTP error: {he.detail}")
        raise
    except Exception as e:
        logging.error(f"OAuth unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")

@api_router.post("/auth/set-role")
async def set_user_role(role: str, request: Request):
    """Set role for OAuth users on first login"""
    session_token = request.cookies.get('session_token')
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get user from session
    session = await db.sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Update user role
    await db.users.update_one(
        {"id": session['user_id']},
        {"$set": {"role": role}}
    )
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    return {
        "id": user['id'],
        "email": user['email'],
        "role": user['role'],
        "full_name": user['full_name']
    }

@api_router.post("/auth/logout")
async def logout(request: Request):
    """Logout and clear session"""
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    return {"message": "Logged out successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: dict):
    """Generate password reset token"""
    email = request.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate reset token (valid for 1 hour)
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.insert_one({
        "email": email,
        "reset_token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False
    })
    
    # In production, send email with reset link
    # For now, return token directly
    return {
        "message": "Reset token generated",
        "reset_token": reset_token,
        "note": "In production, this would be sent via email"
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: dict):
    """Reset password using token"""
    token = request.get('token')
    new_password = request.get('new_password')
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password required")
    
    # Find reset token
    reset_doc = await db.password_resets.find_one({"reset_token": token}, {"_id": 0})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    # Check if used
    if reset_doc.get('used'):
        raise HTTPException(status_code=400, detail="Reset token already used")
    
    # Check expiry
    expires_at = datetime.fromisoformat(reset_doc['expires_at'])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token expired")
    
    # Update password
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"email": reset_doc['email']},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"reset_token": token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

async def get_user_from_session(session_token: str):
    """Get user from session token"""
    session = await db.sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = datetime.fromisoformat(session['expires_at'])
    if expires_at < datetime.now(timezone.utc):
        await db.sessions.delete_one({"session_token": session_token})
        return None
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    return user

# Email notification helper
async def send_email_notification(to_email: str, subject: str, content: str, notification_type: str):
    """Queue email notification (in production, use SendGrid/Resend)"""
    notification = {
        'id': str(uuid.uuid4()),
        'to_email': to_email,
        'subject': subject,
        'content': content,
        'notification_type': notification_type,
        'sent_at': datetime.now(timezone.utc).isoformat(),
        'status': 'queued'
    }
    await db.email_notifications.insert_one(notification)
    
    # In production, integrate with SendGrid/Resend here
    # For now, just log
    logger.info(f"Email queued to {to_email}: {subject}")
    
    return notification['id']

# Pricing configuration
PRICING = {
    'job_posting': 149.00,  # $149 per job post
    'premium_subscription': 499.00,  # $499/month unlimited jobs
    'success_fee_percentage': 10.0  # 10% of first year salary
}

# Candidate Profile Routes
@api_router.post("/candidates/profile", response_model=CandidateProfile)
async def create_candidate_profile(
    profile_data: CandidateProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can create candidate profiles")
    
    # Check if profile exists
    existing_profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile_dict = profile_data.model_dump()
    profile_dict['user_id'] = current_user['id']
    profile_dict['full_name'] = current_user.get('full_name', '')
    profile_dict['email'] = current_user.get('email', '')
    profile_dict['id'] = str(uuid.uuid4())
    profile_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    profile_dict['interview_completed'] = False
    profile_dict['interview_score'] = None
    profile_dict['ai_vetting_score'] = None
    profile_dict['ai_recommendation'] = None
    profile_dict['profile_searchable'] = True
    profile_dict['referral_code'] = None
    profile_dict['total_earnings'] = 0.0
    profile_dict['subscription_status'] = "free"
    profile_dict['subscription_plan'] = None
    profile_dict['subscription_start'] = None
    profile_dict['subscription_end'] = None
    
    await db.candidate_profiles.insert_one(profile_dict)
    
    # Return with datetime object
    profile_dict['updated_at'] = datetime.fromisoformat(profile_dict['updated_at'])
    return CandidateProfile(**profile_dict)

@api_router.get("/candidates/profile", response_model=CandidateProfile)
async def get_my_candidate_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if isinstance(profile['updated_at'], str):
        profile['updated_at'] = datetime.fromisoformat(profile['updated_at'])
    
    return profile

@api_router.put("/candidates/profile", response_model=CandidateProfile)
async def update_candidate_profile(
    profile_data: CandidateProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can update candidate profiles")
    
    profile_dict = profile_data.model_dump()
    profile_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.candidate_profiles.update_one(
        {"user_id": current_user['id']},
        {"$set": profile_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    updated_profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if isinstance(updated_profile['updated_at'], str):
        updated_profile['updated_at'] = datetime.fromisoformat(updated_profile['updated_at'])
    
    return updated_profile

@api_router.get("/candidates", response_model=List[dict])
async def get_candidates(
    specialization: Optional[str] = None,
    skills: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can browse candidates")
    
    query = {}
    if specialization:
        query['specialization'] = specialization
    if skills:
        skill_list = [s.strip() for s in skills.split(',')]
        query['skills'] = {"$in": skill_list}
    
    candidates = await db.candidate_profiles.find(query, {"_id": 0}).to_list(100)
    
    # Get user info for each candidate
    result = []
    for candidate in candidates:
        user = await db.users.find_one({"id": candidate['user_id']}, {"_id": 0})
        if user:
            candidate['full_name'] = user['full_name']
            candidate['email'] = user['email']
            result.append(candidate)
    
    return result

@api_router.get("/candidates/{candidate_id}", response_model=dict)
async def get_candidate_by_id(candidate_id: str):
    profile = await db.candidate_profiles.find_one({"user_id": candidate_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    user = await db.users.find_one({"id": candidate_id}, {"_id": 0})
    if user:
        profile['full_name'] = user['full_name']
        profile['email'] = user['email']
    
    return profile

# Employer Profile Routes
@api_router.post("/employers/profile", response_model=EmployerProfile)
async def create_employer_profile(
    profile_data: EmployerProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can create employer profiles")
    
    existing_profile = await db.employer_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profile = EmployerProfile(user_id=current_user['id'], **profile_data.model_dump())
    profile_dict = profile.model_dump()
    profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
    
    await db.employer_profiles.insert_one(profile_dict)
    return profile

@api_router.get("/employers/profile", response_model=EmployerProfile)
async def get_my_employer_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.employer_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if isinstance(profile['updated_at'], str):
        profile['updated_at'] = datetime.fromisoformat(profile['updated_at'])
    
    return profile

@api_router.put("/employers/profile", response_model=EmployerProfile)
async def update_employer_profile(
    profile_data: EmployerProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can update employer profiles")
    
    profile_dict = profile_data.model_dump()
    profile_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.employer_profiles.update_one(
        {"user_id": current_user['id']},
        {"$set": profile_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    updated_profile = await db.employer_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if isinstance(updated_profile['updated_at'], str):
        updated_profile['updated_at'] = datetime.fromisoformat(updated_profile['updated_at'])
    
    return updated_profile

# Job Routes
@api_router.post("/jobs", response_model=Job)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can post jobs")
    
    job = Job(employer_id=current_user['id'], **job_data.model_dump())
    job_dict = job.model_dump()
    job_dict['posted_at'] = job_dict['posted_at'].isoformat()
    
    await db.jobs.insert_one(job_dict)
    return job

@api_router.get("/jobs", response_model=List[dict])
async def get_jobs(
    category: Optional[str] = None,
    job_type: Optional[str] = None,
    location: Optional[str] = None
):
    query = {"status": "active"}
    if category:
        query['category'] = category
    if job_type:
        query['job_type'] = job_type
    if location:
        query['location'] = {"$regex": location, "$options": "i"}
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(100)
    
    # Get employer info for each job
    result = []
    for job in jobs:
        employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
        if employer_profile:
            job['company_name'] = employer_profile['company_name']
            job['company_location'] = employer_profile.get('location', '')
        result.append(job)
    
    return result

@api_router.get("/jobs/{job_id}", response_model=dict)
async def get_job_by_id(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
    if employer_profile:
        job['company_name'] = employer_profile['company_name']
        job['company_type'] = employer_profile['company_type']
        job['company_location'] = employer_profile.get('location', '')
        job['company_website'] = employer_profile.get('website', '')
    
    return job

@api_router.get("/employers/jobs", response_model=List[Job])
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can view their jobs")
    
    jobs = await db.jobs.find({"employer_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    for job in jobs:
        if isinstance(job['posted_at'], str):
            job['posted_at'] = datetime.fromisoformat(job['posted_at'])
    
    return jobs

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can delete jobs")
    
    result = await db.jobs.delete_one({"id": job_id, "employer_id": current_user['id']})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    
    return {"message": "Job deleted successfully"}

@api_router.get("/jobs/{job_id}/can-apply")
async def can_apply_to_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Check if candidate can apply to a specific job"""
    if current_user['role'] != UserRole.CANDIDATE:
        return {"can_apply": False, "reason": "Only candidates can apply to jobs"}
    
    # Check if job exists
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        return {"can_apply": False, "reason": "Job not found"}
    
    # Check if profile exists
    candidate_profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not candidate_profile:
        return {"can_apply": False, "reason": "Please complete your profile first"}
    
    # Check subscription status (both active and cancelled have access until period end)
    subscription_status = candidate_profile.get('subscription_status', 'free')
    if subscription_status not in ['active', 'cancelled']:
        return {
            "can_apply": False, 
            "reason": "Subscription required to apply to jobs",
            "subscription_status": subscription_status,
            "requires_upgrade": True
        }
    
    # Check if subscription is still valid
    subscription_end = candidate_profile.get('subscription_end')
    if subscription_end:
        if isinstance(subscription_end, str):
            subscription_end = datetime.fromisoformat(subscription_end)
        if subscription_end < datetime.now(timezone.utc):
            return {
                "can_apply": False, 
                "reason": "Your subscription has expired",
                "subscription_status": "expired",
                "requires_upgrade": True
            }
    
    # Check if already applied
    existing_app = await db.applications.find_one({
        "job_id": job_id,
        "candidate_id": current_user['id']
    }, {"_id": 0})
    if existing_app:
        return {"can_apply": False, "reason": "Already applied to this job"}
    
    return {"can_apply": True, "reason": "Ready to apply"}

# Application Routes
@api_router.post("/applications", response_model=Application)
async def create_application(
    application_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can apply to jobs")
    
    # Check subscription status (both active and cancelled have access until period end)
    candidate_profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not candidate_profile:
        raise HTTPException(status_code=404, detail="Please complete your profile first")
    
    subscription_status = candidate_profile.get('subscription_status', 'free')
    if subscription_status not in ['active', 'cancelled']:
        raise HTTPException(
            status_code=402, 
            detail="Subscription required to apply to jobs. Please upgrade to a paid plan to apply."
        )
    
    # Check if subscription is still valid (for both active and cancelled)
    subscription_end = candidate_profile.get('subscription_end')
    if subscription_end:
        if isinstance(subscription_end, str):
            subscription_end = datetime.fromisoformat(subscription_end)
        if subscription_end < datetime.now(timezone.utc):
            # Update status to expired
            await db.candidate_profiles.update_one(
                {"user_id": current_user['id']},
                {"$set": {"subscription_status": "expired"}}
            )
            raise HTTPException(
                status_code=402, 
                detail="Your subscription has expired. Please renew to continue applying to jobs."
            )
    
    # Check if job exists
    job = await db.jobs.find_one({"id": application_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already applied
    existing_app = await db.applications.find_one({
        "job_id": application_data.job_id,
        "candidate_id": current_user['id']
    }, {"_id": 0})
    if existing_app:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    application = Application(
        job_id=application_data.job_id,
        candidate_id=current_user['id'],
        employer_id=job['employer_id'],
        cover_letter=application_data.cover_letter
    )
    
    app_dict = application.model_dump()
    app_dict['applied_at'] = app_dict['applied_at'].isoformat()
    app_dict['updated_at'] = app_dict['updated_at'].isoformat()
    
    await db.applications.insert_one(app_dict)
    
    # Send email notification to employer
    employer = await db.users.find_one({"id": job['employer_id']}, {"_id": 0})
    if employer:
        subject = f"New Application: {job['title']}"
        content = f"Hello {employer['full_name']},\n\n{current_user['full_name']} has applied to your job posting: {job['title']}.\n\nView the application in your MedEvidences dashboard.\n\nBest regards,\nMedEvidences Team"
        await send_email_notification(employer['email'], subject, content, 'application_received')
    
    return application

@api_router.get("/applications/my-applications", response_model=List[dict])
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can view their applications")
    
    applications = await db.applications.find({"candidate_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Get job details for each application
    result = []
    for app in applications:
        job = await db.jobs.find_one({"id": app['job_id']}, {"_id": 0})
        if job:
            employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
            app['job_title'] = job['title']
            app['job_category'] = job['category']
            app['company_name'] = employer_profile['company_name'] if employer_profile else 'Unknown'
            result.append(app)
    
    return result

@api_router.get("/applications/received", response_model=List[dict])
async def get_received_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can view received applications")
    
    applications = await db.applications.find({"employer_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Get candidate and job details for each application
    result = []
    for app in applications:
        candidate = await db.users.find_one({"id": app['candidate_id']}, {"_id": 0})
        candidate_profile = await db.candidate_profiles.find_one({"user_id": app['candidate_id']}, {"_id": 0})
        job = await db.jobs.find_one({"id": app['job_id']}, {"_id": 0})
        
        if candidate and candidate_profile and job:
            app['candidate_name'] = candidate['full_name']
            app['candidate_email'] = candidate['email']
            app['candidate_specialization'] = candidate_profile['specialization']
            app['candidate_experience'] = candidate_profile['experience_years']
            app['job_title'] = job['title']
            result.append(app)
    
    return result

@api_router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can update application status")
    
    valid_statuses = ["pending", "reviewed", "shortlisted", "rejected", "accepted"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    result = await db.applications.update_one(
        {"id": application_id, "employer_id": current_user['id']},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    
    return {"message": "Application status updated successfully"}


@api_router.get("/admin/applications")
async def get_all_applications_admin(current_user: dict = Depends(get_current_user)):
    """Admin endpoint to view ALL applications across platform"""
    # Check if user is admin
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    # Fetch all applications
    applications = await db.applications.find({}, {"_id": 0}).sort([("applied_at", -1)]).to_list(500)
    
    # Enrich with candidate, job, and employer details
    result = []
    for app in applications:
        candidate = await db.users.find_one({"id": app['candidate_id']}, {"_id": 0})
        candidate_profile = await db.candidate_profiles.find_one({"user_id": app['candidate_id']}, {"_id": 0})
        job = await db.jobs.find_one({"id": app['job_id']}, {"_id": 0})
        
        if candidate and job:
            # Get employer info
            employer = await db.users.find_one({"id": job['employer_id']}, {"_id": 0})
            employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
            
            app['candidate_name'] = candidate['full_name']
            app['candidate_email'] = candidate['email']
            app['job_title'] = job['title']
            app['company_name'] = employer_profile.get('company_name', 'Unknown') if employer_profile else 'Unknown'
            app['employer_email'] = employer['email'] if employer else 'N/A'
            
            if candidate_profile:
                app['candidate_specialization'] = candidate_profile.get('specialization', 'N/A')
                app['candidate_experience'] = candidate_profile.get('experience_years', 0)
            
            result.append(app)
    
    logging.info(f"Admin fetched {len(result)} applications")
    return result

@api_router.post("/admin/send-to-employer/{application_id}")
async def send_application_to_employer(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Admin sends candidate application to employer with MedEvidences referral code"""
    # Check if user is admin
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    # Get application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if already sent
    if application.get('sent_to_employer'):
        return {
            "message": "Already sent to employer",
            "referral_code": application.get('referral_code'),
            "sent_at": application.get('sent_at')
        }
    
    # Get candidate details
    candidate = await db.users.find_one({"id": application['candidate_id']}, {"_id": 0})
    candidate_profile = await db.candidate_profiles.find_one({"user_id": application['candidate_id']}, {"_id": 0})
    
    # Get job details
    job = await db.jobs.find_one({"id": application['job_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get employer details
    employer = await db.users.find_one({"id": application['employer_id']}, {"_id": 0})
    employer_profile = await db.employer_profiles.find_one({"user_id": application['employer_id']}, {"_id": 0})
    
    if not candidate or not employer:
        raise HTTPException(status_code=404, detail="Candidate or employer not found")
    
    # Generate unique MedEvidences referral code
    import random
    import string
    date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    referral_code = f"MED-{date_str}-{random_str}"
    
    # Update application with referral code
    sent_time = datetime.now(timezone.utc)
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "referral_code": referral_code,
            "sent_to_employer": True,
            "sent_at": sent_time.isoformat(),
            "updated_at": sent_time.isoformat()
        }}
    )
    
    # Prepare email content
    email_subject = f"New Candidate Referral from MedEvidences - {job['title']}"
    
    # Build cover letter section
    cover_letter_section = ""
    if application.get('cover_letter'):
        cover_letter_section = f"\nCANDIDATE COVER LETTER:\n{application.get('cover_letter')}\n"
    
    email_body = f"""
Dear {employer.get('full_name', 'Employer')},

MedEvidences has identified a qualified candidate for your position: {job['title']}

=== CANDIDATE DETAILS ===
Name: {candidate['full_name']}
Email: {candidate['email']}
Specialization: {candidate_profile.get('specialization', 'N/A') if candidate_profile else 'N/A'}
Experience: {candidate_profile.get('experience_years', 0) if candidate_profile else 0} years
Location: {candidate_profile.get('location', 'N/A') if candidate_profile else 'N/A'}

=== JOB DETAILS ===
Position: {job['title']}
Category: {job['category']}
Location: {job['location']}

=== MEDEVIDENCES REFERRAL CODE ===
Code: {referral_code}

Please use this referral code in all communications regarding this candidate to track this referral from MedEvidences.
{cover_letter_section}
To view the full candidate profile and manage this application, please log in to your MedEvidences employer dashboard.

Best regards,
MedEvidences Team
https://medevidences.com

---
This is an automated message from MedEvidences platform.
Referral Code: {referral_code}
"""
    
    # Send email (currently mock, will be real with SendGrid)
    logging.info(f"SENDING EMAIL TO EMPLOYER: {employer['email']}")
    logging.info(f"Subject: {email_subject}")
    logging.info(f"Referral Code: {referral_code}")
    logging.info(f"Email body preview: {email_body[:200]}...")
    
    # Mock email sending
    sendgrid_key = os.environ.get('SENDGRID_API_KEY', '')
    if not sendgrid_key or sendgrid_key == 'your-sendgrid-api-key-here':
        logging.warning(f"SendGrid not configured - MOCK EMAIL sent to {employer['email']}")
        # In production, integrate with SendGrid here
    else:
        # Real SendGrid integration would go here
        logging.info(f"SendGrid email sent to {employer['email']}")
    
    return {
        "message": "Application sent to employer successfully",
        "referral_code": referral_code,
        "employer_email": employer['email'],
        "candidate_name": candidate['full_name'],
        "job_title": job['title'],
        "sent_at": sent_time.isoformat()
    }


def generate_application_pdf(application, candidate, candidate_profile, job, employer_profile, referral_code):
    """Generate PDF for application"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
    )
    
    # Add title
    elements.append(Paragraph("MedEvidences Candidate Application", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Referral Code Box
    ref_data = [[Paragraph(f"<b>MedEvidences Referral Code: {referral_code}</b>", styles['Normal'])]]
    ref_table = Table(ref_data, colWidths=[6*inch])
    ref_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dcfce7')),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#16a34a')),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(ref_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Candidate Information
    elements.append(Paragraph("<b>CANDIDATE INFORMATION</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    candidate_data = [
        ['Name:', candidate['full_name']],
        ['Email:', candidate['email']],
        ['Specialization:', candidate_profile.get('specialization', 'N/A') if candidate_profile else 'N/A'],
        ['Experience:', f"{candidate_profile.get('experience_years', 0)} years" if candidate_profile else 'N/A'],
        ['Location:', candidate_profile.get('location', 'N/A') if candidate_profile else 'N/A'],
    ]
    
    cand_table = Table(candidate_data, colWidths=[1.5*inch, 4.5*inch])
    cand_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(cand_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Job Information
    elements.append(Paragraph("<b>JOB INFORMATION</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    job_data = [
        ['Position:', job['title']],
        ['Category:', job['category']],
        ['Location:', job['location']],
        ['Type:', job.get('job_type', 'N/A')],
        ['Company:', employer_profile.get('company_name', 'N/A') if employer_profile else 'N/A'],
    ]
    
    job_table = Table(job_data, colWidths=[1.5*inch, 4.5*inch])
    job_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(job_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Cover Letter
    if application.get('cover_letter'):
        elements.append(Paragraph("<b>COVER LETTER</b>", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        elements.append(Paragraph(application['cover_letter'], styles['BodyText']))
        elements.append(Spacer(1, 0.3*inch))
    
    # Application Details
    elements.append(Paragraph("<b>APPLICATION DETAILS</b>", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    app_data = [
        ['Status:', application['status'].upper()],
        ['Applied:', datetime.fromisoformat(application['applied_at']).strftime('%B %d, %Y %I:%M %p') if isinstance(application['applied_at'], str) else application['applied_at'].strftime('%B %d, %Y %I:%M %p')],
        ['Referral Code:', referral_code],
    ]
    
    app_table = Table(app_data, colWidths=[1.5*inch, 4.5*inch])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(app_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_text = f"""
    <i>This application was referred by MedEvidences.com</i><br/>
    <i>For any questions, please contact: support@medevidences.com</i><br/>
    <i>Generated: {datetime.now(timezone.utc).strftime('%B %d, %Y %I:%M %p UTC')}</i>
    """
    elements.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

@api_router.get("/admin/download-application-pdf/{application_id}")
async def download_application_pdf(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download application as PDF"""
    # Check if user is admin
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    # Get application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get all related data
    candidate = await db.users.find_one({"id": application['candidate_id']}, {"_id": 0})
    candidate_profile = await db.candidate_profiles.find_one({"user_id": application['candidate_id']}, {"_id": 0})
    job = await db.jobs.find_one({"id": application['job_id']}, {"_id": 0})
    employer_profile = await db.employer_profiles.find_one({"user_id": application['employer_id']}, {"_id": 0})
    
    if not candidate or not job:
        raise HTTPException(status_code=404, detail="Related data not found")
    
    # Get or generate referral code
    referral_code = application.get('referral_code')
    if not referral_code:
        import random
        import string
        date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        referral_code = f"MED-{date_str}-{random_str}"
    
    # Generate PDF
    pdf_buffer = generate_application_pdf(
        application, candidate, candidate_profile, job, employer_profile, referral_code
    )
    
    # Save to temp file
    filename = f"MedEvidences_Application_{referral_code}.pdf"
    temp_path = f"/tmp/{filename}"
    
    with open(temp_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    logging.info(f"Generated PDF for application {application_id}: {filename}")
    
    return FileResponse(
        temp_path,
        media_type='application/pdf',
        filename=filename
    )

@api_router.post("/admin/send-to-employer-with-options/{application_id}")
async def send_application_with_options(
    application_id: str,
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send application to employer with custom email and PDF attachment option"""
    # Check if user is admin
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    custom_email = request.get('employer_email')
    save_email = request.get('save_email', False)
    
    if not custom_email:
        raise HTTPException(status_code=400, detail="Employer email required")
    
    # Get application
    application = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get all data
    candidate = await db.users.find_one({"id": application['candidate_id']}, {"_id": 0})
    candidate_profile = await db.candidate_profiles.find_one({"user_id": application['candidate_id']}, {"_id": 0})
    job = await db.jobs.find_one({"id": application['job_id']}, {"_id": 0})
    employer = await db.users.find_one({"id": application['employer_id']}, {"_id": 0})
    employer_profile = await db.employer_profiles.find_one({"user_id": application['employer_id']}, {"_id": 0})
    
    if not candidate or not job or not employer:
        raise HTTPException(status_code=404, detail="Related data not found")
    
    # Save custom email to employer profile if requested
    if save_email and custom_email != employer['email']:
        await db.employer_profiles.update_one(
            {"user_id": application['employer_id']},
            {"$set": {"custom_contact_email": custom_email}}
        )
        logging.info(f"Saved custom email {custom_email} for employer {application['employer_id']}")
    
    # Generate referral code if not exists
    referral_code = application.get('referral_code')
    if not referral_code:
        import random
        import string
        date_str = datetime.now(timezone.utc).strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        referral_code = f"MED-{date_str}-{random_str}"
    
    # Update application
    sent_time = datetime.now(timezone.utc)
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "referral_code": referral_code,
            "sent_to_employer": True,
            "sent_at": sent_time.isoformat(),
            "sent_to_email": custom_email,
            "updated_at": sent_time.isoformat()
        }}
    )
    
    # Generate PDF
    pdf_buffer = generate_application_pdf(
        application, candidate, candidate_profile, job, employer_profile, referral_code
    )
    
    # Email content
    email_subject = f"New Candidate Referral from MedEvidences - {job['title']}"
    email_body = f"""
Dear {employer.get('full_name', 'Employer')},

MedEvidences has identified a qualified candidate for your position: {job['title']}

Please find the complete application attached as a PDF document.

=== QUICK SUMMARY ===
Candidate: {candidate['full_name']}
Position: {job['title']}
Referral Code: {referral_code}

⚠️ IMPORTANT: Please use referral code {referral_code} in all communications regarding this candidate.

Best regards,
MedEvidences Team
https://medevidences.com
    """
    
    # Log email (mock for now)
    logging.info(f"SENDING EMAIL TO: {custom_email}")
    logging.info(f"Subject: {email_subject}")
    logging.info(f"Referral Code: {referral_code}")
    logging.info(f"PDF attached: MedEvidences_Application_{referral_code}.pdf")
    
    sendgrid_key = os.environ.get('SENDGRID_API_KEY', '')
    if not sendgrid_key or sendgrid_key == 'your-sendgrid-api-key-here':
        logging.warning(f"SendGrid not configured - MOCK EMAIL with PDF attachment sent to {custom_email}")
    
    return {
        "message": "Application sent successfully with PDF attachment",
        "referral_code": referral_code,
        "employer_email": custom_email,
        "pdf_filename": f"MedEvidences_Application_{referral_code}.pdf",
        "sent_at": sent_time.isoformat()
    }


# Company Contact Routes
@api_router.post("/company-contact")
async def submit_company_contact(contact_data: CompanyContactCreate):
    """Submit company contact form"""
    contact = CompanyContact(**contact_data.model_dump())
    contact_dict = contact.model_dump()
    contact_dict['created_at'] = contact_dict['created_at'].isoformat()
    
    await db.company_contacts.insert_one(contact_dict)
    
    return {
        "message": "Thank you for contacting us! Our team will reach out to you within 24 hours.",
        "contact_id": contact.id
    }

# Contracts Routes
@api_router.get("/contracts")
async def get_contracts(current_user: dict = Depends(get_current_user)):
    """Get contracts for candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can view contracts")
    
    contracts = await db.contracts.find({"candidate_id": current_user['id']}, {"_id": 0}).to_list(100)
    return contracts

# Offers Routes
@api_router.get("/offers")
async def get_offers(current_user: dict = Depends(get_current_user)):
    """Get offers for candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can view offers")
    
    offers = await db.offers.find({"candidate_id": current_user['id']}, {"_id": 0}).to_list(100)
    
    # Get job details for each offer
    result = []
    for offer in offers:
        job = await db.jobs.find_one({"id": offer['job_id']}, {"_id": 0})
        if job:
            employer_profile = await db.employer_profiles.find_one({"user_id": offer['employer_id']}, {"_id": 0})
            offer['job_title'] = job['title']
            offer['company_name'] = employer_profile['company_name'] if employer_profile else 'Unknown'
            result.append(offer)
    
    return result

# Subscription Routes
@api_router.get("/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get current subscription status for candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can check subscription status")
    
    profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    subscription_status = profile.get('subscription_status', 'free')
    subscription_end = profile.get('subscription_end')
    
    # Check if subscription expired (for both active and cancelled)
    if subscription_status in ['active', 'cancelled'] and subscription_end:
        if isinstance(subscription_end, str):
            subscription_end_dt = datetime.fromisoformat(subscription_end)
        else:
            subscription_end_dt = subscription_end
            
        if subscription_end_dt < datetime.now(timezone.utc):
            # Update to expired
            await db.candidate_profiles.update_one(
                {"user_id": current_user['id']},
                {"$set": {"subscription_status": "expired"}}
            )
            subscription_status = "expired"
    
    # User can apply if status is 'active' OR 'cancelled' (still has access until period end)
    can_apply = subscription_status in ['active', 'cancelled']
    
    return {
        "subscription_status": subscription_status,
        "subscription_plan": profile.get('subscription_plan'),
        "subscription_start": profile.get('subscription_start'),
        "subscription_end": profile.get('subscription_end'),
        "can_apply": can_apply
    }

@api_router.post("/subscription/create-checkout")
async def create_subscription_checkout(
    plan: str,  # "basic" or "premium"
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can subscribe")
    
    # Validate plan
    if plan not in ["basic", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose 'basic' or 'premium'")
    
    # Pricing (in cents)
    pricing = {
        "basic": 2900,   # $29/month
        "premium": 4900  # $49/month
    }
    
    # Check for Stripe API key
    stripe_key = os.environ.get('STRIPE_SECRET_KEY')
    if not stripe_key or stripe_key.startswith('sk_test_your'):
        # Mock mode - Stripe keys not configured
        logging.warning("Stripe keys not configured - using mock checkout")
        return {
            "checkout_url": "#",
            "plan": plan,
            "price": pricing[plan] / 100,
            "message": "⚠️ Stripe not configured. Please add STRIPE_SECRET_KEY to backend/.env",
            "mock": True,
            "instructions": "See /app/STRIPE_SETUP_GUIDE.md for setup instructions"
        }
    
    try:
        # Real Stripe integration
        import stripe
        stripe.api_key = stripe_key
        
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'unit_amount': pricing[plan],
                    'product_data': {
                        'name': f'{plan.capitalize()} Plan Subscription',
                        'description': f'MedEvidences {plan.capitalize()} Plan - Monthly Subscription',
                    },
                    'recurring': {
                        'interval': 'month',
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{os.environ.get("FRONTEND_URL", "http://localhost:3000")}/subscription/success?success=true&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{os.environ.get("FRONTEND_URL", "http://localhost:3000")}/subscription?cancelled=true',
            client_reference_id=current_user['id'],
            metadata={
                'user_id': current_user['id'],
                'plan': plan
            }
        )
        
        logging.info(f"Stripe checkout created for user {current_user['id']}, plan: {plan}")
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "plan": plan,
            "price": pricing[plan] / 100,
            "message": "Redirecting to Stripe checkout..."
        }
    except Exception as e:
        logging.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")

@api_router.post("/subscription/activate")
async def activate_subscription(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Activate subscription after successful payment"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can activate subscriptions")
    
    session_id = request.get('session_id')
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Import stripe at the top level
    import stripe
    
    try:
        # Verify payment with Stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        
        logging.info(f"Retrieving Stripe session {session_id} for user {current_user['id']}")
        
        # Retrieve the session to verify payment
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['subscription']  # Expand subscription to get full details
        )
        
        logging.info(f"Session payment_status: {session.payment_status}, subscription: {session.subscription}")
        
        if session.payment_status != 'paid':
            logging.warning(f"Payment not completed for session {session_id}. Status: {session.payment_status}")
            raise HTTPException(status_code=400, detail=f"Payment not completed. Current status: {session.payment_status}")
        
        # Get plan from session metadata
        plan = session.metadata.get('plan', 'basic')
        
        logging.info(f"Activating subscription for user {current_user['id']}, plan: {plan}, stripe_sub_id: {session.subscription}")
        
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=30)  # 30-day subscription
        
        # Prepare update data
        update_data = {
            "subscription_status": "active",
            "subscription_plan": plan,
            "subscription_start": start_date.isoformat(),
            "subscription_end": end_date.isoformat(),
            "stripe_customer_id": session.customer
        }
        
        # Only add subscription ID if it exists
        if session.subscription:
            if isinstance(session.subscription, str):
                update_data["stripe_subscription_id"] = session.subscription
            else:
                # If expanded, it's an object
                update_data["stripe_subscription_id"] = session.subscription.id
        
        # Update candidate profile
        result = await db.candidate_profiles.update_one(
            {"user_id": current_user['id']},
            {"$set": update_data},
            upsert=True
        )
        
        logging.info(f"Database update result - matched: {result.matched_count}, modified: {result.modified_count}, upserted_id: {result.upserted_id}")
        logging.info(f"Subscription activated successfully for user {current_user['id']}")
        
        # Verify the update
        updated_profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        logging.info(f"Updated profile subscription_status: {updated_profile.get('subscription_status')}")
        
        # Send confirmation email
        await send_subscription_email(
            current_user['email'],
            current_user.get('full_name', 'User'),
            plan,
            end_date.isoformat()
        )
        
        return {
            "message": "Subscription activated successfully!",
            "plan": plan,
            "expires_at": end_date.isoformat(),
            "can_apply": True,
            "subscription_status": "active"
        }
    except stripe.StripeError as e:
        logging.error(f"Stripe error during activation: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logging.error(f"Activation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Activation error: {str(e)}")

@api_router.post("/subscription/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel active subscription - cancels at period end, no refund for current month"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can cancel subscriptions")
    
    profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    subscription_status = profile.get('subscription_status', 'free')
    
    # Allow cancellation for both 'active' and 'cancelled' (to show status), but prevent if already cancelled
    if subscription_status not in ['active', 'cancelled']:
        raise HTTPException(status_code=400, detail=f"No active subscription to cancel. Current status: {subscription_status}")
    
    # Import stripe at the top level
    import stripe
    
    try:
        # Cancel in Stripe (only if not already cancelled)
        stripe_sub_id = profile.get('stripe_subscription_id')
        
        if stripe_sub_id and subscription_status == 'active':
            stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
            
            logging.info(f"Cancelling Stripe subscription {stripe_sub_id} for user {current_user['id']}")
            
            # Cancel at period end - user keeps access until subscription_end date
            # NO REFUND - they pay for the full current month
            subscription = stripe.Subscription.modify(
                stripe_sub_id,
                cancel_at_period_end=True
            )
            
            logging.info(f"Stripe subscription {stripe_sub_id} set to cancel at period end. User retains access until {profile.get('subscription_end')}")
            
            # Update database to 'cancelled' status
            await db.candidate_profiles.update_one(
                {"user_id": current_user['id']},
                {"$set": {"subscription_status": "cancelled"}}
            )
            
            return {
                "message": "Subscription cancelled successfully. You will retain access until the end of your current billing period. No refund will be issued for the current month.",
                "expires_at": profile.get('subscription_end'),
                "access_until": profile.get('subscription_end'),
                "refund": False
            }
        elif subscription_status == 'cancelled':
            return {
                "message": "Subscription is already cancelled. You can continue using premium features until your current period ends.",
                "expires_at": profile.get('subscription_end'),
                "access_until": profile.get('subscription_end'),
                "refund": False
            }
        else:
            raise HTTPException(status_code=400, detail="Unable to cancel subscription - no Stripe subscription ID found")
            
    except stripe.StripeError as e:
        logging.error(f"Stripe error during cancellation: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logging.error(f"Cancel subscription error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error cancelling subscription: {str(e)}")

@api_router.get("/subscription/pricing")
async def get_subscription_pricing():
    """Get subscription pricing plans"""
    return {
        "plans": [
            {
                "id": "basic",
                "name": "Basic Plan",
                "price": 29,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Apply to unlimited jobs",
                    "Access to AI interview",
                    "Basic candidate badge",
                    "Email support"
                ]
            },
            {
                "id": "premium", 
                "name": "Premium Plan",
                "price": 49,
                "currency": "USD", 
                "interval": "month",
                "features": [
                    "Apply to unlimited jobs",
                    "Access to AI interview",
                    "Premium candidate badge",
                    "Priority in employer searches",
                    "Advanced analytics",
                    "Priority support"
                ]
            }
        ],
        "free_features": [
            "Browse all job listings",
            "View job details", 
            "Create candidate profile",
            "Basic profile visibility"
        ]
    }


# Email notification helper
async def send_subscription_email(user_email: str, user_name: str, plan: str, expires_at: str):
    """Send subscription confirmation email"""
    try:
        # Check if SendGrid is configured
        sendgrid_key = os.environ.get('SENDGRID_API_KEY', '')
        if not sendgrid_key or sendgrid_key == 'your-sendgrid-api-key-here':
            logging.warning(f"SendGrid not configured - would send email to {user_email}")
            # Mock email for now
            logging.info(f"MOCK EMAIL: Subscription activated for {user_name} ({user_email}) - Plan: {plan}, Expires: {expires_at}")
            return True
            
        # Real SendGrid implementation would go here
        # For now, just log
        logging.info(f"Would send subscription email to {user_email} for {plan} plan")
        return True
    except Exception as e:
        logging.error(f"Error sending subscription email: {str(e)}")
        return False

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for automatic subscription activation"""
    import stripe
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # For testing, allow webhooks without signature verification
    # In production, you should verify the webhook signature
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
    
    try:
        # Parse event
        try:
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
        except ValueError as e:
            logging.error(f"Invalid webhook payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        
        logging.info(f"Received Stripe webhook event: {event['type']}")
        
        # Handle checkout.session.completed event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            logging.info(f"Checkout completed for session: {session['id']}")
            logging.info(f"Payment status: {session.get('payment_status')}")
            logging.info(f"Customer: {session.get('customer')}")
            logging.info(f"Subscription: {session.get('subscription')}")
            
            # Get user_id from metadata
            user_id = session['metadata'].get('user_id')
            plan = session['metadata'].get('plan', 'basic')
            
            if not user_id:
                logging.error("No user_id in session metadata")
                return {"status": "error", "message": "No user_id"}
            
            # Only activate if payment is complete
            if session.get('payment_status') == 'paid':
                logging.info(f"Activating subscription for user {user_id} via webhook")
                
                start_date = datetime.now(timezone.utc)
                end_date = start_date + timedelta(days=30)
                
                update_data = {
                    "subscription_status": "active",
                    "subscription_plan": plan,
                    "subscription_start": start_date.isoformat(),
                    "subscription_end": end_date.isoformat(),
                    "stripe_customer_id": session.get('customer'),
                    "stripe_subscription_id": session.get('subscription')
                }
                
                result = await db.candidate_profiles.update_one(
                    {"user_id": user_id},
                    {"$set": update_data}
                )
                
                logging.info(f"Webhook activation - matched: {result.matched_count}, modified: {result.modified_count}")
                
                # Get user details for email
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user:
                    await send_subscription_email(
                        user['email'],
                        user.get('full_name', 'User'),
                        plan,
                        end_date.isoformat()
                    )
                
                return {"status": "success", "message": "Subscription activated"}
            else:
                logging.warning(f"Payment not completed yet: {session.get('payment_status')}")
                return {"status": "pending", "message": "Payment not completed"}
        
        # Handle subscription lifecycle events
        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            logging.info(f"Subscription updated: {subscription['id']}, status: {subscription['status']}")
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            logging.info(f"Subscription deleted: {subscription['id']}")
            
            # Update user status to expired
            result = await db.candidate_profiles.update_one(
                {"stripe_subscription_id": subscription['id']},
                {"$set": {"subscription_status": "expired"}}
            )
            logging.info(f"Marked subscription as expired - matched: {result.matched_count}")
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

@api_router.post("/subscription/manual-activate/{user_id}")
async def manual_activate_subscription(
    user_id: str,
    plan: str = "basic",
    current_user: dict = Depends(get_current_user)
):
    """Manual subscription activation for admin/testing purposes"""
    # Only allow admin users
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=30)
        
        update_data = {
            "subscription_status": "active",
            "subscription_plan": plan,
            "subscription_start": start_date.isoformat(),
            "subscription_end": end_date.isoformat()
        }
        
        result = await db.candidate_profiles.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        logging.info(f"Manual activation for user {user_id} - matched: {result.matched_count}, modified: {result.modified_count}")
        
        # Get user details
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            await send_subscription_email(
                user['email'],
                user.get('full_name', 'User'),
                plan,
                end_date.isoformat()
            )
        
        return {
            "message": "Subscription manually activated",
            "user_id": user_id,
            "plan": plan,
            "expires_at": end_date.isoformat()
        }
        
    except Exception as e:
        logging.error(f"Manual activation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# AI Interview Routes
@api_router.get("/interview/questions")
async def get_interview_questions(specialization: str):
    """Generate comprehensive AI interview questions based on specialization"""
    questions_map = {
        "Doctors/Physicians": [
            {"id": 1, "question": "Describe a complex medical case you diagnosed and treated. Walk me through your thought process, differential diagnosis, and treatment approach. How did you handle any complications?", "duration": "3-5 minutes"},
            {"id": 2, "question": "Explain how you stay current with medical research and new treatment protocols. Give specific examples of how you've implemented recent evidence-based practices in your work.", "duration": "2-3 minutes"},
            {"id": 3, "question": "Tell me about a time when you had to deliver difficult news to a patient or their family. How did you approach the situation, and what was the outcome?", "duration": "2-3 minutes"},
            {"id": 4, "question": "Describe your experience working in high-pressure emergency situations. How do you prioritize multiple critical patients?", "duration": "2-3 minutes"},
            {"id": 5, "question": "Discuss your proficiency with electronic health records and medical technology. What systems have you used, and how do you ensure accuracy?", "duration": "2 minutes"},
            {"id": 6, "question": "Explain a situation where you collaborated with other healthcare professionals to improve patient outcomes. What was your role?", "duration": "2-3 minutes"},
            {"id": 7, "question": "How do you handle disagreements with colleagues about patient care? Give a specific example.", "duration": "2-3 minutes"},
            {"id": 8, "question": "Describe your communication style with patients. How do you ensure they understand complex medical information?", "duration": "2-3 minutes"}
        ],
        "Medicine & Medical Research": [
            {"id": 1, "question": "Describe your most significant research project in detail. Include your hypothesis, methodology, challenges faced, and key findings. How did your work contribute to the field?", "duration": "4-5 minutes"},
            {"id": 2, "question": "Explain your experience with research methodologies and statistical analysis. What tools and techniques do you use regularly?", "duration": "3-4 minutes"},
            {"id": 3, "question": "Walk me through your process for designing a clinical trial. How do you ensure ethical compliance and data integrity?", "duration": "3-4 minutes"},
            {"id": 4, "question": "Describe your publication record and impact. What journals have you published in, and what was the reception of your work?", "duration": "2-3 minutes"},
            {"id": 5, "question": "How do you collaborate with multidisciplinary research teams? Give examples of successful collaborations.", "duration": "2-3 minutes"},
            {"id": 6, "question": "Explain how you handle unexpected results or failures in research. Provide a specific example.", "duration": "2-3 minutes"},
            {"id": 7, "question": "Discuss your experience with grant writing and securing research funding. What has been your success rate?", "duration": "2-3 minutes"},
            {"id": 8, "question": "How do you ensure reproducibility and transparency in your research work?", "duration": "2 minutes"}
        ],
        "Scientific Research": [
            {"id": 1, "question": "Describe your research expertise and the most impactful project you've worked on. Include methodology, challenges, and outcomes.", "duration": "4-5 minutes"},
            {"id": 2, "question": "Explain your proficiency with data analysis tools and statistical software. Walk me through a complex analysis you've performed.", "duration": "3-4 minutes"},
            {"id": 3, "question": "How do you approach experimental design? Describe your process from hypothesis to conclusion.", "duration": "3-4 minutes"},
            {"id": 4, "question": "Discuss your experience presenting research findings. How do you communicate complex concepts to different audiences?", "duration": "2-3 minutes"},
            {"id": 5, "question": "Describe a time when your research faced significant setbacks. How did you adapt and move forward?", "duration": "2-3 minutes"},
            {"id": 6, "question": "Explain your experience with peer review process, both as an author and reviewer.", "duration": "2 minutes"},
            {"id": 7, "question": "How do you stay current with developments in your field? What resources do you rely on?", "duration": "2 minutes"},
            {"id": 8, "question": "Describe your experience working independently versus in teams. Which do you prefer and why?", "duration": "2-3 minutes"}
        ],
        "default": [
            {"id": 1, "question": "Describe your professional background in detail. Include your education, key experiences, and major accomplishments in your field.", "duration": "4-5 minutes"},
            {"id": 2, "question": "What are your core technical skills and areas of expertise? Provide specific examples of how you've applied them.", "duration": "3-4 minutes"},
            {"id": 3, "question": "Tell me about your most challenging project. What was the problem, your approach, and the outcome?", "duration": "3-4 minutes"},
            {"id": 4, "question": "How do you stay updated with developments in your field? What resources do you use?", "duration": "2-3 minutes"},
            {"id": 5, "question": "Describe your communication style and how you work with others. Give specific examples.", "duration": "2-3 minutes"},
            {"id": 6, "question": "How do you handle tight deadlines and multiple priorities? Share a relevant experience.", "duration": "2-3 minutes"},
            {"id": 7, "question": "Explain your experience working independently on complex tasks. How do you ensure quality?", "duration": "2-3 minutes"},
            {"id": 8, "question": "What motivates you professionally, and what are your career goals for the next 3-5 years?", "duration": "2-3 minutes"}
        ]
    }
    
    questions = questions_map.get(specialization, questions_map["default"])
    
    # Calculate total duration (extract numbers from duration strings)
    total_duration = 0
    for q in questions:
        duration_str = q['duration'].split('-')[0].strip()
        # Extract first number from string like "3-5 minutes" or "2 minutes"
        import re
        numbers = re.findall(r'\d+', duration_str)
        if numbers:
            total_duration += int(numbers[0])
    
    return {
        "questions": questions,
        "total_duration_minutes": f"{total_duration}-{total_duration + len(questions)*2}",
        "instructions": "Please answer each question thoroughly. Your responses should be detailed and provide specific examples. The AI will analyze your communication skills, technical knowledge, and problem-solving abilities."
    }

@api_router.post("/interview/submit", response_model=AIInterview)
async def submit_interview(
    interview_data: AIInterviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit AI interview responses with comprehensive analysis"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can submit interviews")
    
    # Analyze each response (in production, would use actual AI)
    analyzed_questions = []
    total_score = 0
    communication_scores = []
    technical_scores = []
    problem_solving_scores = []
    
    for q in interview_data.questions:
        answer_length = len(q.get('answer', ''))
        # Simple analysis (in production, use actual AI/NLP)
        score = q.get('score', 7)
        
        # Analyze different aspects
        comm_score = min(10, answer_length / 50)  # Communication based on detail
        tech_score = score
        ps_score = min(10, answer_length / 40)
        
        communication_scores.append(comm_score)
        technical_scores.append(tech_score)
        problem_solving_scores.append(ps_score)
        
        analysis = f"Good understanding demonstrated. "
        if answer_length > 200:
            analysis += "Excellent detail and examples provided. "
        if score >= 8:
            analysis += "Strong technical knowledge shown."
        
        analyzed_questions.append({
            "question": q['question'],
            "answer": q['answer'],
            "score": score,
            "analysis": analysis
        })
        total_score += score
    
    overall_score = total_score / len(interview_data.questions) if interview_data.questions else 0
    
    # Performance analysis
    performance_analysis = {
        "communication": round(sum(communication_scores) / len(communication_scores), 1),
        "technical": round(sum(technical_scores) / len(technical_scores), 1),
        "problem_solving": round(sum(problem_solving_scores) / len(problem_solving_scores), 1)
    }
    
    # AI vetting score (weighted average)
    ai_vetting_score = (
        performance_analysis['communication'] * 0.3 +
        performance_analysis['technical'] * 0.4 +
        performance_analysis['problem_solving'] * 0.3
    )
    
    # Determine strengths and areas for improvement
    strengths = []
    improvements = []
    
    if performance_analysis['communication'] >= 8:
        strengths.append("Excellent communication skills")
    elif performance_analysis['communication'] < 6:
        improvements.append("Communication clarity")
    
    if performance_analysis['technical'] >= 8:
        strengths.append("Strong technical expertise")
    elif performance_analysis['technical'] < 6:
        improvements.append("Technical depth")
    
    if performance_analysis['problem_solving'] >= 8:
        strengths.append("Exceptional problem-solving abilities")
    elif performance_analysis['problem_solving'] < 6:
        improvements.append("Problem-solving approach")
    
    # Recommendation
    if ai_vetting_score >= 8:
        recommendation = "Highly Recommended - Exceptional candidate"
    elif ai_vetting_score >= 7:
        recommendation = "Recommended - Strong candidate"
    elif ai_vetting_score >= 6:
        recommendation = "Recommended - Good potential"
    else:
        recommendation = "Consider with caution - Additional evaluation needed"
    
    # Create transcript
    transcript = "\n\n".join([
        f"Q: {q['question']}\nA: {q['answer']}\nScore: {q['score']}/10"
        for q in analyzed_questions
    ])
    
    interview = AIInterview(
        candidate_id=current_user['id'],
        specialization=interview_data.specialization,
        questions=analyzed_questions,
        overall_score=round(overall_score, 1),
        transcript=transcript,
        performance_analysis=performance_analysis,
        ai_vetting_score=round(ai_vetting_score, 1),
        strengths=strengths if strengths else ["Solid foundation"],
        areas_for_improvement=improvements if improvements else ["Continue developing expertise"],
        recommendation=recommendation
    )
    
    interview_dict = interview.model_dump()
    interview_dict['completed_at'] = interview_dict['completed_at'].isoformat()
    
    await db.ai_interviews.insert_one(interview_dict)
    
    # Update candidate profile
    await db.candidate_profiles.update_one(
        {"user_id": current_user['id']},
        {"$set": {
            "interview_completed": True,
            "interview_score": overall_score,
            "ai_vetting_score": ai_vetting_score,
            "ai_recommendation": recommendation
        }}
    )
    
    return interview

@api_router.get("/interview/status")
async def get_interview_status(current_user: dict = Depends(get_current_user)):
    """Check if candidate has completed interview and get results"""
    profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        return {"completed": False, "score": None}
    
    # Get full interview details
    interview = await db.ai_interviews.find_one({"candidate_id": current_user['id']}, {"_id": 0})
    
    return {
        "completed": profile.get("interview_completed", False),
        "score": profile.get("interview_score"),
        "ai_vetting_score": profile.get("ai_vetting_score"),
        "recommendation": profile.get("ai_recommendation"),
        "performance_analysis": interview.get("performance_analysis") if interview else None,
        "strengths": interview.get("strengths") if interview else None,
        "areas_for_improvement": interview.get("areas_for_improvement") if interview else None
    }

# AI Job Matching Routes
@api_router.get("/matching/jobs", response_model=List[JobMatch])
async def get_matched_jobs(current_user: dict = Depends(get_current_user)):
    """Get AI-matched jobs for candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can get matched jobs")
    
    # Get candidate profile
    profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Please complete your profile first")
    
    # Get all active jobs
    jobs = await db.jobs.find({"status": "active"}, {"_id": 0}).to_list(100)
    
    matched_jobs = []
    for job in jobs:
        # Calculate match percentage
        match_data = calculate_job_match(profile, job)
        if match_data['match_percentage'] >= 30:  # Only show jobs with 30%+ match
            employer_profile = await db.employer_profiles.find_one({"user_id": job['employer_id']}, {"_id": 0})
            match_data['company_name'] = employer_profile['company_name'] if employer_profile else 'Unknown'
            matched_jobs.append(match_data)
    
    # Sort by match percentage
    matched_jobs.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return matched_jobs

def calculate_job_match(candidate_profile: dict, job: dict) -> dict:
    """Calculate match percentage between candidate and job"""
    match_percentage = 0
    match_reasons = []
    matched_skills = []
    missing_skills = []
    
    candidate_skills = set(s.lower() for s in candidate_profile.get('skills', []))
    job_skills = set(s.lower() for s in job.get('skills_required', []))
    
    # Skills match (50% weight)
    if job_skills:
        common_skills = candidate_skills.intersection(job_skills)
        skills_match = (len(common_skills) / len(job_skills)) * 50
        match_percentage += skills_match
        matched_skills = list(common_skills)
        missing_skills = list(job_skills - candidate_skills)
        
        if skills_match > 25:
            match_reasons.append(f"Strong skills match ({int(skills_match*2)}%)")
    
    # Specialization match (30% weight)
    if candidate_profile.get('specialization') == job.get('category'):
        match_percentage += 30
        match_reasons.append("Perfect specialization match")
    
    # Experience match (20% weight)
    exp_required = job.get('experience_required', '').lower()
    candidate_exp = candidate_profile.get('experience_years', 0)
    
    if 'entry' in exp_required or '0-2' in exp_required:
        if candidate_exp <= 3:
            match_percentage += 20
            match_reasons.append("Experience level matches")
    elif '3-5' in exp_required or 'mid' in exp_required:
        if 2 <= candidate_exp <= 7:
            match_percentage += 20
            match_reasons.append("Experience level matches")
    elif '5+' in exp_required or 'senior' in exp_required:
        if candidate_exp >= 5:
            match_percentage += 20
            match_reasons.append("Senior level experience")
    
    # Interview bonus
    if candidate_profile.get('interview_completed'):
        interview_score = candidate_profile.get('interview_score', 0)
        if interview_score >= 7:
            match_reasons.append("Strong interview performance")
    
    if not match_reasons:
        match_reasons.append("Basic qualification match")
    
    return {
        "job_id": job['id'],
        "job_title": job['title'],
        "company_name": "",  # Will be filled by caller
        "match_percentage": round(match_percentage, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_reasons": match_reasons
    }

@api_router.get("/matching/candidates-for-job/{job_id}")
async def get_matched_candidates_for_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-matched candidates for a specific job"""
    if current_user['role'] != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can access this")
    
    # Get job
    job = await db.jobs.find_one({"id": job_id, "employer_id": current_user['id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get all candidates
    candidates = await db.candidate_profiles.find({}, {"_id": 0}).to_list(100)
    
    matched_candidates = []
    for candidate in candidates:
        match_data = calculate_job_match(candidate, job)
        if match_data['match_percentage'] >= 30:
            user = await db.users.find_one({"id": candidate['user_id']}, {"_id": 0})
            if user:
                matched_candidates.append({
                    "candidate_id": candidate['user_id'],
                    "candidate_name": user['full_name'],
                    "specialization": candidate['specialization'],
                    "experience_years": candidate['experience_years'],
                    "match_percentage": match_data['match_percentage'],
                    "matched_skills": match_data['matched_skills'],
                    "match_reasons": match_data['match_reasons']
                })
    
    # Sort by match percentage
    matched_candidates.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return {"job_title": job['title'], "matches": matched_candidates}

# Seed Data Endpoint
@api_router.post("/seed/sample-jobs")
async def seed_sample_jobs():
    """Seed database with sample jobs for demonstration"""
    
    # Create a demo employer if doesn't exist
    demo_employer = await db.users.find_one({"email": "demo_employer@medevidences.com"}, {"_id": 0})
    if not demo_employer:
        demo_user = User(
            email="demo_employer@medevidences.com",
            password_hash=hash_password("demo123"),
            role="employer",
            full_name="MedEvidences Demo"
        )
        user_dict = demo_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        await db.users.insert_one(user_dict)
        demo_employer = demo_user.model_dump()
        
        # Create employer profile
        demo_profile = EmployerProfile(
            user_id=demo_user.id,
            company_name="Global Medical Research Center",
            company_type="Research Institute",
            description="Leading medical research institution",
            location="Boston, MA",
            website="https://example.com"
        )
        profile_dict = demo_profile.model_dump()
        profile_dict['updated_at'] = profile_dict['updated_at'].isoformat()
        await db.employer_profiles.insert_one(profile_dict)
    
    employer_id = demo_employer['id']
    
    sample_jobs = [
        {
            "title": "Senior Medical Researcher",
            "category": "Medicine & Medical Research",
            "description": "We are seeking a Senior Medical Researcher to lead cutting-edge clinical trials and research projects. You will work with a multidisciplinary team to advance medical science and improve patient outcomes.",
            "requirements": [
                "PhD in Medical Sciences or related field",
                "5+ years of clinical research experience",
                "Experience with FDA regulatory processes",
                "Strong publication record in peer-reviewed journals"
            ],
            "skills_required": ["Clinical Research", "Data Analysis", "Medical Writing", "Statistical Analysis", "Protocol Development"],
            "location": "Boston, MA (Remote Available)",
            "job_type": "Full-time",
            "salary_range": "$120,000 - $160,000",
            "experience_required": "5+ years"
        },
        {
            "title": "Physician - Internal Medicine",
            "category": "Doctors/Physicians",
            "description": "Join our team of dedicated physicians providing comprehensive care. We offer a collaborative environment with the latest medical technology and a focus on patient-centered care.",
            "requirements": [
                "MD or DO degree",
                "Board certified in Internal Medicine",
                "Valid state medical license",
                "Excellent communication skills"
            ],
            "skills_required": ["Patient Care", "Diagnosis", "Treatment Planning", "EMR Systems", "Medical Procedures"],
            "location": "New York, NY",
            "job_type": "Full-time",
            "salary_range": "$200,000 - $280,000",
            "experience_required": "3-7 years"
        },
        {
            "title": "Research Scientist - Physics",
            "category": "Physics",
            "description": "Exciting opportunity to work on quantum computing research. Collaborate with leading scientists on groundbreaking projects in quantum mechanics and computational physics.",
            "requirements": [
                "PhD in Physics or related field",
                "Experience with quantum mechanics",
                "Strong mathematical background",
                "Programming skills (Python, C++)"
            ],
            "skills_required": ["Quantum Mechanics", "Python", "C++", "Mathematical Modeling", "Research Methods"],
            "location": "San Francisco, CA (Remote)",
            "job_type": "Full-time",
            "salary_range": "$130,000 - $180,000",
            "experience_required": "3-5 years"
        },
        {
            "title": "Nutritionist & Dietitian",
            "category": "Nutrition & Dietetics",
            "description": "Develop personalized nutrition plans and provide evidence-based dietary guidance. Work with diverse patient populations in a modern healthcare setting.",
            "requirements": [
                "Master's degree in Nutrition or Dietetics",
                "Registered Dietitian Nutritionist (RDN)",
                "2+ years clinical experience",
                "Knowledge of current nutrition research"
            ],
            "skills_required": ["Nutrition Planning", "Patient Counseling", "Clinical Nutrition", "Health Education", "Meal Planning"],
            "location": "Los Angeles, CA",
            "job_type": "Part-time",
            "salary_range": "$60,000 - $85,000",
            "experience_required": "2-5 years"
        },
        {
            "title": "Chemistry Professor",
            "category": "Teaching & Academia",
            "description": "Tenure-track position for passionate educator and researcher. Teach undergraduate and graduate courses while pursuing innovative research in organic chemistry.",
            "requirements": [
                "PhD in Chemistry",
                "Teaching experience at university level",
                "Active research program",
                "Strong publication record"
            ],
            "skills_required": ["Teaching", "Organic Chemistry", "Research", "Curriculum Development", "Academic Writing"],
            "location": "Chicago, IL",
            "job_type": "Full-time",
            "salary_range": "$85,000 - $120,000",
            "experience_required": "3+ years"
        },
        {
            "title": "Behavioral Science Researcher",
            "category": "Behavioral Science",
            "description": "Conduct research on human behavior and cognition. Design and implement studies, analyze data, and contribute to publications in top-tier journals.",
            "requirements": [
                "PhD in Psychology or Behavioral Science",
                "Experience with experimental design",
                "Statistical analysis expertise",
                "IRB protocol experience"
            ],
            "skills_required": ["Research Design", "Statistical Analysis", "SPSS", "Behavioral Analysis", "Academic Writing"],
            "location": "Remote",
            "job_type": "Full-time",
            "salary_range": "$95,000 - $135,000",
            "experience_required": "2-5 years"
        },
        {
            "title": "Medical Tutor - MCAT Preparation",
            "category": "Medical Tutoring",
            "description": "Help aspiring medical students excel in their MCAT preparation. Provide personalized instruction and develop effective study strategies.",
            "requirements": [
                "Medical degree (MD/DO) or advanced science degree",
                "High MCAT score (515+)",
                "Teaching or tutoring experience",
                "Excellent communication skills"
            ],
            "skills_required": ["Teaching", "MCAT Content", "Test Prep", "Biology", "Chemistry", "Physics"],
            "location": "Remote",
            "job_type": "Part-time",
            "salary_range": "$40 - $80/hour",
            "experience_required": "1-3 years"
        },
        {
            "title": "Data Scientist - Healthcare Analytics",
            "category": "Scientific Research",
            "description": "Apply machine learning and AI to healthcare data. Work on predictive models for patient outcomes and population health management.",
            "requirements": [
                "Master's or PhD in Data Science, Statistics, or related field",
                "3+ years experience in healthcare analytics",
                "Proficiency in Python and R",
                "Experience with ML frameworks"
            ],
            "skills_required": ["Machine Learning", "Python", "R", "Healthcare Data", "Statistical Modeling", "SQL"],
            "location": "Seattle, WA (Hybrid)",
            "job_type": "Full-time",
            "salary_range": "$140,000 - $190,000",
            "experience_required": "3-7 years"
        },
        {
            "title": "Medical Consultant - Healthcare Strategy",
            "category": "Consulting",
            "description": "Provide strategic guidance to healthcare organizations. Analyze operations, develop improvement strategies, and drive organizational change.",
            "requirements": [
                "MBA or advanced healthcare degree",
                "5+ years healthcare consulting experience",
                "Strong analytical and presentation skills",
                "Knowledge of healthcare regulations"
            ],
            "skills_required": ["Strategy", "Healthcare Operations", "Business Analysis", "Project Management", "Stakeholder Management"],
            "location": "Washington, DC",
            "job_type": "Full-time",
            "salary_range": "$110,000 - $160,000",
            "experience_required": "5+ years"
        },
        {
            "title": "Mathematics Professor - Applied Math",
            "category": "Mathematics",
            "description": "Join our mathematics department to teach and conduct research in applied mathematics. Focus on mathematical modeling and computational methods.",
            "requirements": [
                "PhD in Mathematics",
                "Research experience in applied mathematics",
                "University teaching experience",
                "Grant writing experience preferred"
            ],
            "skills_required": ["Applied Mathematics", "Mathematical Modeling", "Teaching", "Research", "MATLAB", "Python"],
            "location": "Austin, TX",
            "job_type": "Full-time",
            "salary_range": "$90,000 - $130,000",
            "experience_required": "3-5 years"
        }
    ]
    
    # Insert jobs
    inserted_count = 0
    for job_data in sample_jobs:
        # Check if similar job already exists
        existing = await db.jobs.find_one({"title": job_data["title"]}, {"_id": 0})
        if not existing:
            job = Job(employer_id=employer_id, **job_data)
            job_dict = job.model_dump()
            job_dict['posted_at'] = job_dict['posted_at'].isoformat()
            await db.jobs.insert_one(job_dict)
            inserted_count += 1
    
    return {
        "message": f"Successfully seeded {inserted_count} sample jobs",
        "total": len(sample_jobs)
    }


# ============= Advanced Features Endpoints =============

# 1. Auto Resume Screening
@api_router.post("/resume/parse")
async def parse_resume(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Parse uploaded resume PDF and extract information using AI"""
    from PyPDF2 import PdfReader
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import io
    
    if current_user['role'] != 'candidate':
        raise HTTPException(status_code=403, detail="Only candidates can upload resumes")
    
    form = await request.form()
    resume_file = form.get('resume')
    
    if not resume_file:
        raise HTTPException(status_code=400, detail="No resume file provided")
    
    # Read PDF
    try:
        pdf_content = await resume_file.read()
        pdf_reader = PdfReader(io.BytesIO(pdf_content))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Use AI to parse resume
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"resume_parse_{current_user['id']}",
            system_message="You are an expert resume parser. Extract structured information from resumes."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Analyze this resume and extract the following information in JSON format:
{{
  "skills": ["list of technical and professional skills"],
  "experience_years": number (total years of experience),
  "education": ["list of degrees and institutions"],
  "certifications": ["list of certifications"],
  "summary": "brief professional summary in 2-3 sentences"
}}

Resume text:
{text[:4000]}
"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse AI response
        import json
        try:
            parsed_data = json.loads(response)
        except:
            # If response isn't pure JSON, try to extract JSON from it
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group())
            else:
                parsed_data = {
                    "skills": [],
                    "experience_years": 0,
                    "education": [],
                    "certifications": [],
                    "summary": response[:200]
                }
        
        # Store in database
        resume_data = ResumeData(
            candidate_id=current_user['id'],
            file_name=resume_file.filename,
            parsed_skills=parsed_data.get('skills', []),
            parsed_experience_years=parsed_data.get('experience_years'),
            parsed_education=parsed_data.get('education', []),
            parsed_certifications=parsed_data.get('certifications', []),
            raw_text=text[:2000],  # Store first 2000 chars
            ai_summary=parsed_data.get('summary')
        )
        
        resume_dict = resume_data.model_dump()
        resume_dict['created_at'] = resume_dict['created_at'].isoformat()
        await db.resume_data.insert_one(resume_dict)
        
        # Update candidate profile with parsed info
        update_data = {}
        if parsed_data.get('skills'):
            update_data['skills'] = parsed_data['skills']
        if parsed_data.get('experience_years'):
            update_data['experience_years'] = parsed_data['experience_years']
        if parsed_data.get('education'):
            update_data['education'] = ', '.join(parsed_data['education'])
        
        if update_data:
            await db.candidate_profiles.update_one(
                {"user_id": current_user['id']},
                {"$set": update_data}
            )
        
        return {
            "message": "Resume parsed successfully",
            "data": parsed_data,
            "resume_id": resume_data.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@api_router.get("/resume/data")
async def get_resume_data(current_user: dict = Depends(get_current_user)):
    """Get parsed resume data for current candidate"""
    if current_user['role'] != 'candidate':
        raise HTTPException(status_code=403, detail="Only candidates can view resume data")
    
    resume = await db.resume_data.find_one(
        {"candidate_id": current_user['id']},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not resume:
        return {"message": "No resume data found", "data": None}
    
    return {"data": resume}


# 2. Intelligent AI Candidate Matching
@api_router.post("/matching/generate-scores/{job_id}")
async def generate_match_scores(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered match scores for all candidates for a specific job"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if current_user['role'] != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can generate match scores")
    
    # Get job details
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job['employer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to access this job")
    
    # Get all candidates
    candidates = await db.candidate_profiles.find({}, {"_id": 0}).to_list(length=None)
    
    scores = []
    llm_key = os.environ.get('EMERGENT_LLM_KEY')
    
    for candidate in candidates:
        # Get AI interview results if available
        interview = await db.ai_interviews.find_one(
            {"candidate_id": candidate['user_id']},
            {"_id": 0},
            sort=[("completed_at", -1)]
        )
        
        # Use AI to calculate match score
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"match_{job_id}_{candidate['user_id']}",
            system_message="You are an expert recruiter. Analyze candidate-job fit and provide detailed scoring."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Analyze this candidate-job match and provide scores:

Job Requirements:
- Title: {job['title']}
- Required Skills: {', '.join(job.get('skills_required', []))}
- Experience: {job.get('experience_required', 'Not specified')}
- Description: {job.get('description', '')[:300]}

Candidate Profile:
- Specialization: {candidate.get('specialization', 'Not specified')}
- Experience: {candidate.get('experience_years', 0)} years
- Skills: {', '.join(candidate.get('skills', []))}
- Education: {candidate.get('education', 'Not specified')}
- Bio: {candidate.get('bio', 'Not provided')[:200]}
{f"- AI Interview Score: {interview.get('overall_score', 'N/A')}" if interview else ""}

Provide scores (0-100) in JSON format:
{{
  "overall_score": number,
  "skills_match": number,
  "experience_match": number,
  "education_match": number,
  "reasoning": "brief explanation of the match quality"
}}
"""
        
        try:
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            import json
            import re
            # Try to parse JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                score_data = json.loads(json_match.group())
            else:
                score_data = {
                    "overall_score": 50,
                    "skills_match": 50,
                    "experience_match": 50,
                    "education_match": 50,
                    "reasoning": "Unable to parse AI response"
                }
            
            # Store match score
            match_score = MatchScore(
                candidate_id=candidate['user_id'],
                job_id=job_id,
                overall_score=score_data['overall_score'],
                skills_match=score_data['skills_match'],
                experience_match=score_data['experience_match'],
                education_match=score_data['education_match'],
                ai_interview_score=interview.get('overall_score') if interview else None,
                ai_reasoning=score_data.get('reasoning')
            )
            
            match_dict = match_score.model_dump()
            match_dict['created_at'] = match_dict['created_at'].isoformat()
            match_dict['updated_at'] = match_dict['updated_at'].isoformat()
            
            # Upsert (update or insert)
            await db.match_scores.update_one(
                {"candidate_id": candidate['user_id'], "job_id": job_id},
                {"$set": match_dict},
                upsert=True
            )
            
            scores.append({
                "candidate_id": candidate['user_id'],
                "candidate_name": candidate.get('full_name', 'Unknown'),
                "score": score_data['overall_score'],
                "reasoning": score_data.get('reasoning')
            })
        except Exception as e:
            print(f"Error calculating match for candidate {candidate['user_id']}: {str(e)}")
            continue
    
    # Sort by score descending
    scores.sort(key=lambda x: x['score'], reverse=True)
    
    return {
        "message": f"Generated match scores for {len(scores)} candidates",
        "matches": scores
    }

@api_router.get("/matching/scores/{job_id}")
async def get_match_scores(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all match scores for a job, sorted by score"""
    if current_user['role'] != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can view match scores")
    
    # Verify job belongs to employer
    job = await db.jobs.find_one({"id": job_id, "employer_id": current_user['id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get all match scores for this job
    scores = await db.match_scores.find(
        {"job_id": job_id},
        {"_id": 0}
    ).to_list(length=None)
    
    # Enrich with candidate details
    enriched_scores = []
    for score in scores:
        candidate = await db.candidate_profiles.find_one(
            {"user_id": score['candidate_id']},
            {"_id": 0}
        )
        if candidate:
            enriched_scores.append({
                **score,
                "candidate_name": candidate.get('full_name', 'Unknown'),
                "candidate_specialization": candidate.get('specialization', 'Not specified'),
                "candidate_experience": candidate.get('experience_years', 0)
            })
    
    # Sort by overall score descending
    enriched_scores.sort(key=lambda x: x['overall_score'], reverse=True)
    
    return {"matches": enriched_scores}


# 3. Dynamic Data Collection & Feedback
@api_router.post("/feedback/submit")
async def submit_feedback(
    feedback_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit feedback on a hire/match outcome"""
    
    required_fields = ['candidate_id', 'job_id', 'hire_outcome']
    for field in required_fields:
        if field not in feedback_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Get match score to link feedback
    match = await db.match_scores.find_one(
        {
            "candidate_id": feedback_data['candidate_id'],
            "job_id": feedback_data['job_id']
        },
        {"_id": 0}
    )
    
    if not match:
        raise HTTPException(status_code=404, detail="Match record not found")
    
    # Get job to find employer
    job = await db.jobs.find_one({"id": feedback_data['job_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    feedback = FeedbackData(
        match_id=match['id'],
        candidate_id=feedback_data['candidate_id'],
        job_id=feedback_data['job_id'],
        employer_id=job['employer_id'],
        hire_outcome=feedback_data['hire_outcome'],
        employer_rating=feedback_data.get('employer_rating'),
        candidate_rating=feedback_data.get('candidate_rating'),
        employer_feedback=feedback_data.get('employer_feedback'),
        candidate_feedback=feedback_data.get('candidate_feedback')
    )
    
    feedback_dict = feedback.model_dump()
    feedback_dict['created_at'] = feedback_dict['created_at'].isoformat()
    await db.feedback_data.insert_one(feedback_dict)
    
    return {
        "message": "Feedback submitted successfully",
        "feedback_id": feedback.id
    }

@api_router.get("/feedback/analytics")
async def get_feedback_analytics(current_user: dict = Depends(get_current_user)):
    """Get analytics from collected feedback data"""
    
    # Get all feedback
    all_feedback = await db.feedback_data.find({}, {"_id": 0}).to_list(length=None)
    
    if not all_feedback:
        return {
            "message": "No feedback data available yet",
            "analytics": None
        }
    
    # Calculate analytics
    total_feedback = len(all_feedback)
    hired_count = len([f for f in all_feedback if f['hire_outcome'] == 'hired'])
    rejected_count = len([f for f in all_feedback if f['hire_outcome'] == 'rejected'])
    withdrawn_count = len([f for f in all_feedback if f['hire_outcome'] == 'withdrawn'])
    
    employer_ratings = [f['employer_rating'] for f in all_feedback if f.get('employer_rating')]
    candidate_ratings = [f['candidate_rating'] for f in all_feedback if f.get('candidate_rating')]
    
    analytics = {
        "total_feedback_count": total_feedback,
        "hire_outcomes": {
            "hired": hired_count,
            "rejected": rejected_count,
            "withdrawn": withdrawn_count
        },
        "average_employer_rating": sum(employer_ratings) / len(employer_ratings) if employer_ratings else 0,
        "average_candidate_rating": sum(candidate_ratings) / len(candidate_ratings) if candidate_ratings else 0,
        "hire_rate": (hired_count / total_feedback * 100) if total_feedback > 0 else 0
    }
    
    return {"analytics": analytics}


# 4. Payroll Tracking & Compliance
@api_router.post("/payroll/timesheet")
async def submit_timesheet(
    timesheet_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit timesheet for a contract period"""
    
    if current_user['role'] != 'candidate':
        raise HTTPException(status_code=403, detail="Only candidates can submit timesheets")
    
    required_fields = ['contract_id', 'period_start', 'period_end', 'hours_worked', 'hourly_rate']
    for field in required_fields:
        if field not in timesheet_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Get contract details
    contract = await db.contracts.find_one({"id": timesheet_data['contract_id']}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract['candidate_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized for this contract")
    
    # Calculate total amount
    total_amount = timesheet_data['hours_worked'] * timesheet_data['hourly_rate']
    
    payroll_record = PayrollRecord(
        contract_id=timesheet_data['contract_id'],
        candidate_id=current_user['id'],
        employer_id=contract['employer_id'],
        period_start=datetime.fromisoformat(timesheet_data['period_start']),
        period_end=datetime.fromisoformat(timesheet_data['period_end']),
        hours_worked=timesheet_data['hours_worked'],
        hourly_rate=timesheet_data['hourly_rate'],
        total_amount=total_amount
    )
    
    payroll_dict = payroll_record.model_dump()
    payroll_dict['submitted_at'] = payroll_dict['submitted_at'].isoformat()
    if payroll_dict.get('approved_at'):
        payroll_dict['approved_at'] = payroll_dict['approved_at'].isoformat()
    payroll_dict['period_start'] = payroll_dict['period_start'].isoformat()
    payroll_dict['period_end'] = payroll_dict['period_end'].isoformat()
    
    await db.payroll_records.insert_one(payroll_dict)
    
    return {
        "message": "Timesheet submitted successfully",
        "payroll_id": payroll_record.id,
        "total_amount": total_amount
    }

@api_router.get("/payroll/timesheets")
async def get_timesheets(current_user: dict = Depends(get_current_user)):
    """Get all timesheets for current user"""
    
    if current_user['role'] == 'candidate':
        timesheets = await db.payroll_records.find(
            {"candidate_id": current_user['id']},
            {"_id": 0}
        ).to_list(length=None)
    elif current_user['role'] == 'employer':
        timesheets = await db.payroll_records.find(
            {"employer_id": current_user['id']},
            {"_id": 0}
        ).to_list(length=None)
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return {"timesheets": timesheets}

@api_router.put("/payroll/approve/{payroll_id}")
async def approve_timesheet(
    payroll_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve a timesheet (employer only)"""
    
    if current_user['role'] != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can approve timesheets")
    
    payroll = await db.payroll_records.find_one({"id": payroll_id}, {"_id": 0})
    if not payroll:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    
    if payroll['employer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to approve this timesheet")
    
    await db.payroll_records.update_one(
        {"id": payroll_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Timesheet approved successfully"}

@api_router.post("/compliance/upload")
async def upload_compliance_document(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Upload compliance document"""
    
    if current_user['role'] != 'candidate':
        raise HTTPException(status_code=403, detail="Only candidates can upload compliance documents")
    
    form = await request.form()
    contract_id = form.get('contract_id')
    document_type = form.get('document_type')
    document_file = form.get('document')
    
    if not all([contract_id, document_type, document_file]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Verify contract
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract['candidate_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized for this contract")
    
    # In a real implementation, you would upload to S3 or similar
    # For now, just store metadata
    compliance_doc = ComplianceDocument(
        contract_id=contract_id,
        candidate_id=current_user['id'],
        document_type=document_type,
        file_name=document_file.filename,
        file_url=f"/uploads/compliance/{document_file.filename}"  # Placeholder
    )
    
    doc_dict = compliance_doc.model_dump()
    doc_dict['uploaded_at'] = doc_dict['uploaded_at'].isoformat()
    if doc_dict.get('reviewed_at'):
        doc_dict['reviewed_at'] = doc_dict['reviewed_at'].isoformat()
    
    await db.compliance_documents.insert_one(doc_dict)
    
    return {
        "message": "Compliance document uploaded successfully",
        "document_id": compliance_doc.id
    }

@api_router.get("/compliance/documents")
async def get_compliance_documents(current_user: dict = Depends(get_current_user)):
    """Get all compliance documents for current user"""
    
    if current_user['role'] == 'candidate':
        documents = await db.compliance_documents.find(
            {"candidate_id": current_user['id']},
            {"_id": 0}
        ).to_list(length=None)
    else:
        # Employers can see documents for their contracts
        contracts = await db.contracts.find(
            {"employer_id": current_user['id']},
            {"_id": 0}
        ).to_list(length=None)
        
        contract_ids = [c['id'] for c in contracts]
        documents = await db.compliance_documents.find(
            {"contract_id": {"$in": contract_ids}},
            {"_id": 0}
        ).to_list(length=None)
    
    return {"documents": documents}


# 5. Mercor Job Scraping via Apify
@api_router.post("/scrape/mercor-jobs")
async def scrape_mercor_jobs(
    order_by: str = "newest",
    search_query: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Fetch job listings from Mercor via Apify API"""
    from apify_client import ApifyClient
    
    # Only allow admin to fetch jobs from Mercor
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Only admin can import jobs from Mercor")
    
    try:
        # Initialize Apify client
        apify_token = os.environ.get('APIFY_API_TOKEN')
        if not apify_token:
            raise HTTPException(status_code=500, detail="Apify API token not configured")
        
        client = ApifyClient(apify_token)
        
        # Prepare actor input
        run_input = {
            "orderBy": order_by,  # newest, oldest, or search
            "limit": min(limit, 100)  # Cap at 100 to avoid excessive usage
        }
        
        # Add search query if provided and ordering by search
        if search_query and order_by == "search":
            run_input["searchQuery"] = search_query
        
        logging.info(f"Fetching Mercor jobs via Apify with params: {run_input}")
        
        # Run the actor and wait for results
        run = client.actor("fantastic-jobs/mercor-job-search-api").call(run_input=run_input)
        
        # Fetch results from dataset
        jobs_data = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            # Store in scraped_jobs collection
            scraped_job = ScrapedJob(
                source="mercor",
                external_id=item.get('listingId'),
                title=item.get('title', 'Untitled'),
                description=item.get('description', ''),
                category=item.get('category', 'General'),
                location=item.get('location', 'Remote'),
                salary_range=f"${item.get('rateMin', 0)} - ${item.get('rateMax', 0)} / {item.get('payRateFrequency', 'year')}"
            )
            
            scraped_dict = scraped_job.model_dump()
            scraped_dict['imported_at'] = scraped_dict['imported_at'].isoformat()
            
            # Check if already exists
            existing = await db.scraped_jobs.find_one({"external_id": item.get('listingId')}, {"_id": 0})
            if not existing:
                await db.scraped_jobs.insert_one(scraped_dict)
            
            jobs_data.append({
                "id": scraped_job.id,
                "external_id": item.get('listingId'),
                "title": item.get('title'),
                "company": item.get('companyName'),
                "location": item.get('location'),
                "commitment": item.get('commitment'),
                "salary_range": scraped_job.salary_range,
                "description": item.get('description', '')[:500],  # First 500 chars
                "referral_amount": item.get('referralAmount'),
                "recent_candidates": item.get('recentCandidatesCount'),
                "created_at": item.get('createdAt'),
                "status": item.get('status'),
                "url": f"https://work.mercor.com/explore?listingId={item.get('listingId')}"
            })
        
        logging.info(f"Successfully fetched {len(jobs_data)} jobs from Mercor")
        
        return {
            "message": f"Successfully fetched {len(jobs_data)} jobs from Mercor",
            "count": len(jobs_data),
            "jobs": jobs_data
        }
        
    except Exception as e:
        logging.error(f"Error fetching Mercor jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching jobs from Mercor: {str(e)}")

@api_router.get("/scrape/imported-jobs")
async def get_imported_jobs(current_user: dict = Depends(get_current_user)):
    """Get all scraped jobs from external sources"""
    
    jobs = await db.scraped_jobs.find({}, {"_id": 0}).to_list(length=None)
    
    return {
        "count": len(jobs),
        "jobs": jobs
    }

@api_router.post("/scrape/convert-to-job/{scraped_job_id}")
async def convert_scraped_job(
    scraped_job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Convert a scraped job into an actual job posting"""
    
    if current_user['role'] != 'employer':
        raise HTTPException(status_code=403, detail="Only employers can convert scraped jobs")
    
    scraped_job = await db.scraped_jobs.find_one({"id": scraped_job_id}, {"_id": 0})
    if not scraped_job:
        raise HTTPException(status_code=404, detail="Scraped job not found")
    
    # Create actual job from scraped data
    job = Job(
        employer_id=current_user['id'],
        title=scraped_job['title'],
        description=scraped_job['description'],
        category=scraped_job['category'],
        location=scraped_job.get('location', 'Remote'),
        job_type="Full-time",
        salary_range=scraped_job.get('salary_range', 'Competitive'),
        skills_required=[],
        experience_required="Not specified"
    )
    
    job_dict = job.model_dump()
    job_dict['posted_at'] = job_dict['posted_at'].isoformat()
    await db.jobs.insert_one(job_dict)
    
    # Mark scraped job as converted
    await db.scraped_jobs.update_one(
        {"id": scraped_job_id},
        {"$set": {"converted_to_job": True, "job_id": job.id}}
    )
    
    return {
        "message": "Scraped job converted successfully",
        "job_id": job.id
    }



# ============================================
# VIDEO INTERVIEW ENDPOINTS
# ============================================

video_service = VideoInterviewService()

@api_router.post("/video-interview/upload")
async def upload_video_interview(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Upload video interview file"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can upload video interviews")
    
    try:
        form = await request.form()
        video_file = form.get('video')
        job_id = form.get('job_id')
        
        if not video_file:
            raise HTTPException(status_code=400, detail="No video file provided")
        
        # Save video file
        upload_dir = Path("/tmp/video_interviews")
        upload_dir.mkdir(exist_ok=True)
        
        file_extension = video_file.filename.split('.')[-1]
        video_filename = f"{current_user['id']}_{uuid.uuid4()}.{file_extension}"
        video_path = upload_dir / video_filename
        
        with open(video_path, 'wb') as f:
            content = await video_file.read()
            f.write(content)
        
        # Create video interview record
        interview = {
            "id": str(uuid.uuid4()),
            "candidate_id": current_user['id'],
            "job_id": job_id,
            "video_url": str(video_path),
            "status": "uploaded",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.video_interviews.insert_one(interview)
        
        logging.info(f"Video interview uploaded: {interview['id']}")
        
        return {
            "message": "Video uploaded successfully",
            "interview_id": interview['id'],
            "status": "uploaded"
        }
    except Exception as e:
        logging.error(f"Video upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/video-interview/transcribe/{interview_id}")
async def transcribe_video_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Transcribe video interview using OpenAI Whisper"""
    interview = await db.video_interviews.find_one({"id": interview_id}, {"_id": 0})
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview['candidate_id'] != current_user['id'] and current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Update status
        await db.video_interviews.update_one(
            {"id": interview_id},
            {"$set": {"status": "processing"}}
        )
        
        # Extract audio and transcribe (simplified - assumes video has audio)
        video_path = interview['video_url']
        
        # For now, if video is mp4/webm, treat as audio file
        # In production, use ffmpeg to extract audio
        with open(video_path, 'rb') as audio_file:
            result = await video_service.transcribe_audio(audio_file)
        
        if result['success']:
            transcript = result['text']
            
            # Get candidate profile for specialization
            candidate = await db.candidate_profiles.find_one(
                {"user_id": current_user['id']},
                {"_id": 0}
            )
            specialization = candidate.get('specialization', 'Healthcare') if candidate else 'Healthcare'
            
            # Analyze with GPT-4o
            from openai import AsyncOpenAI
            openai_client = AsyncOpenAI(api_key=os.getenv('EMERGENT_LLM_KEY'))
            
            analysis_result = await video_service.analyze_interview_transcript(
                transcript, specialization, openai_client
            )
            
            if analysis_result['success']:
                analysis = analysis_result['analysis']
                
                # Update interview with transcript and analysis
                await db.video_interviews.update_one(
                    {"id": interview_id},
                    {"$set": {
                        "transcript": transcript,
                        "ai_analysis": analysis,
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "duration_seconds": result.get('duration')
                    }}
                )
                
                # Update candidate profile with AI vetting score
                await db.candidate_profiles.update_one(
                    {"user_id": current_user['id']},
                    {"$set": {
                        "interview_completed": True,
                        "interview_score": analysis.get('overall_score', 0),
                        "ai_vetting_score": analysis.get('overall_score', 0),
                        "ai_recommendation": analysis.get('recommendation', 'Pending Review')
                    }}
                )
                
                return {
                    "message": "Interview analyzed successfully",
                    "transcript": transcript,
                    "analysis": analysis
                }
            else:
                raise HTTPException(status_code=500, detail=f"Analysis failed: {analysis_result.get('error')}")
        else:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {result.get('error')}")
            
    except Exception as e:
        logging.error(f"Transcription error: {str(e)}", exc_info=True)
        await db.video_interviews.update_one(
            {"id": interview_id},
            {"$set": {"status": "failed"}}
        )
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/video-interview/candidate")
async def get_candidate_interviews(current_user: dict = Depends(get_current_user)):
    """Get all video interviews for current candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can view their interviews")
    
    interviews = await db.video_interviews.find(
        {"candidate_id": current_user['id']},
        {"_id": 0}
    ).sort([("created_at", -1)]).to_list(100)
    
    return interviews

# ============================================
# JOB OFFERS ENDPOINTS
# ============================================

@api_router.get("/job-offers/candidate")
async def get_candidate_offers(current_user: dict = Depends(get_current_user)):
    """Get all job offers for candidate"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can view offers")
    
    offers = await db.job_offers.find(
        {"candidate_id": current_user['id']},
        {"_id": 0}
    ).sort([("created_at", -1)]).to_list(100)
    
    # Enrich with job details
    for offer in offers:
        job = await db.jobs.find_one({"id": offer['job_id']}, {"_id": 0})
        if job:
            offer['job_details'] = {
                "title": job['title'],
                "location": job['location'],
                "category": job['category']
            }
    
    return offers

@api_router.post("/job-offers")
async def create_job_offer(
    offer_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a job offer (employer or admin only)"""
    if current_user['role'] not in [UserRole.EMPLOYER, 'admin']:
        raise HTTPException(status_code=403, detail="Only employers can create offers")
    
    # Get job and candidate details
    job = await db.jobs.find_one({"id": offer_data['job_id']}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    candidate = await db.users.find_one({"id": offer_data['candidate_id']}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    employer_profile = await db.employer_profiles.find_one(
        {"user_id": current_user['id']},
        {"_id": 0}
    )
    
    offer = {
        "id": str(uuid.uuid4()),
        "candidate_id": offer_data['candidate_id'],
        "employer_id": current_user['id'],
        "job_id": offer_data['job_id'],
        "job_title": job['title'],
        "company_name": employer_profile.get('company_name', 'Unknown') if employer_profile else 'Unknown',
        "salary_offered": offer_data.get('salary_offered', ''),
        "employment_type": offer_data.get('employment_type', 'Full-time'),
        "start_date": offer_data.get('start_date'),
        "benefits": offer_data.get('benefits', []),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "notes": offer_data.get('notes')
    }
    
    await db.job_offers.insert_one(offer)
    
    logging.info(f"Job offer created: {offer['id']} for candidate {offer_data['candidate_id']}")
    
    return {"message": "Offer created successfully", "offer_id": offer['id']}

@api_router.post("/job-offers/{offer_id}/accept")
async def accept_job_offer(
    offer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Accept a job offer"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can accept offers")
    
    offer = await db.job_offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer['candidate_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not your offer")
    
    if offer['status'] != 'pending':
        raise HTTPException(status_code=400, detail=f"Offer already {offer['status']}")
    
    await db.job_offers.update_one(
        {"id": offer_id},
        {"$set": {
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logging.info(f"Offer {offer_id} accepted by {current_user['id']}")
    
    return {"message": "Offer accepted successfully"}

@api_router.post("/job-offers/{offer_id}/reject")
async def reject_job_offer(
    offer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a job offer"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can reject offers")


# ============================================
# JOB CRAWLER ENDPOINTS (GitHub, LinkedIn, Twitter)
# ============================================

crawler_service = JobCrawlerService()

@api_router.post("/admin/crawl-jobs")
async def crawl_jobs_from_sources(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Crawl jobs from GitHub, LinkedIn, and Twitter (Admin only)"""
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    sources = request.get('sources', ['github', 'linkedin', 'twitter'])
    keywords = request.get('keywords', ['medical', 'healthcare', 'physician', 'researcher'])
    location = request.get('location', 'United States')
    limit = request.get('limit', 50)
    
    results = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "sources_requested": sources,
        "results": {}
    }
    
    try:
        # Scrape GitHub
        if 'github' in sources:
            github_result = await crawler_service.scrape_github_jobs(keywords, limit)
            results['results']['github'] = github_result
            
            if github_result['success']:
                # Save to database
                for job in github_result['jobs']:
                    job['id'] = str(uuid.uuid4())
                    job['category'] = 'Medicine & Medical Research'  # Default
                    job['employer_id'] = 'crawler_github'
                    await db.scraped_external_jobs.insert_one(job)
        
        # Scrape LinkedIn
        if 'linkedin' in sources:
            linkedin_result = await crawler_service.scrape_linkedin_jobs(keywords, location, limit)
            results['results']['linkedin'] = linkedin_result
            
            if linkedin_result['success']:
                for job in linkedin_result['jobs']:
                    job['id'] = str(uuid.uuid4())
                    job['category'] = 'Medicine & Medical Research'
                    job['employer_id'] = 'crawler_linkedin'
                    await db.scraped_external_jobs.insert_one(job)
        
        # Scrape Twitter
        if 'twitter' in sources:
            hashtags = [f"#{kw}jobs" for kw in keywords]
            twitter_result = await crawler_service.scrape_twitter_jobs(hashtags, limit)
            results['results']['twitter'] = twitter_result
            
            if twitter_result['success']:
                for job in twitter_result['jobs']:
                    job['id'] = str(uuid.uuid4())
                    job['category'] = 'Medicine & Medical Research'
                    job['employer_id'] = 'crawler_twitter'
                    await db.scraped_external_jobs.insert_one(job)
        
        results['completed_at'] = datetime.now(timezone.utc).isoformat()
        results['total_jobs_found'] = sum(
            len(r.get('jobs', [])) for r in results['results'].values()
        )
        
        logging.info(f"Crawler completed: {results['total_jobs_found']} jobs found")
        
        return results
        
    except Exception as e:
        logging.error(f"Crawler error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/crawled-jobs")
async def get_crawled_jobs(
    current_user: dict = Depends(get_current_user),
    source: str = None,
    limit: int = 100
):
    """Get crawled jobs from external sources"""
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    query = {}
    if source:
        query['source'] = source
    
    jobs = await db.scraped_external_jobs.find(query, {"_id": 0}).sort([("scraped_at", -1)]).limit(limit).to_list(limit)
    
    return {
        "count": len(jobs),
        "source_filter": source,
        "jobs": jobs
    }

@api_router.post("/admin/import-crawled-job/{job_id}")
async def import_crawled_job_to_platform(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Import a crawled job to the main jobs collection"""
    if current_user.get('email') != 'admin@medevidences.com':
        raise HTTPException(status_code=403, detail="Admin access only")
    
    # Get crawled job
    crawled = await db.scraped_external_jobs.find_one({"id": job_id}, {"_id": 0})
    if not crawled:
        raise HTTPException(status_code=404, detail="Crawled job not found")
    
    # Create proper job entry
    job = {
        "id": str(uuid.uuid4()),
        "title": crawled['title'],
        "category": crawled.get('category', 'Medicine & Medical Research'),
        "description": crawled['description'],
        "location": crawled['location'],
        "job_type": crawled.get('job_type', 'Full-time'),
        "salary_range": crawled.get('salary', ''),
        "requirements": [],
        "responsibilities": [],
        "benefits": [],
        "employer_id": 'external_crawler',
        "status": "active",
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "external_source": crawled['source'],
        "external_url": crawled.get('url', '')
    }
    
    await db.jobs.insert_one(job)
    
    # Mark as imported
    await db.scraped_external_jobs.update_one(
        {"id": job_id},
        {"$set": {"imported": True, "job_id": job['id']}}
    )
    
    logging.info(f"Imported crawled job: {job['id']} from {crawled['source']}")
    
    return {"message": "Job imported successfully", "job_id": job['id']}

@api_router.post("/admin/scrape-candidate-profile")
async def scrape_candidate_online_presence(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Scrape candidate info from GitHub, portfolio, LinkedIn (Admin/Auto)"""
    candidate_id = request.get('candidate_id')
    urls = request.get('urls', {})  # {github: url, portfolio: url, linkedin: url}
    
    if current_user.get('email') != 'admin@medevidences.com' and current_user['id'] != candidate_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    results = {}
    
    try:
        # Scrape portfolio if provided
        if urls.get('portfolio'):
            portfolio_data = await crawler_service.scrape_portfolio_website(urls['portfolio'])
            results['portfolio'] = portfolio_data
        
        # Note: GitHub and LinkedIn scraping would require specific implementations
        # For now, we've implemented the infrastructure
        
        return {
            "candidate_id": candidate_id,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "results": results
        }
        
    except Exception as e:
        logging.error(f"Profile scraping error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    
    offer = await db.job_offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer['candidate_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not your offer")
    
    if offer['status'] != 'pending':
        raise HTTPException(status_code=400, detail=f"Offer already {offer['status']}")
    
    await db.job_offers.update_one(
        {"id": offer_id},
        {"$set": {
            "status": "rejected",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    logging.info(f"Offer {offer_id} rejected by {current_user['id']}")
    
    return {"message": "Offer rejected"}

@api_router.get("/stripe/customer-portal")
async def get_stripe_portal_link(current_user: dict = Depends(get_current_user)):
    """Get Stripe customer portal link for managing subscription"""
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates have subscriptions")
    
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        
        # Get candidate profile
        profile = await db.candidate_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        
        if not profile or not profile.get('stripe_customer_id'):
            raise HTTPException(status_code=400, detail="No Stripe customer found. Please subscribe first.")
        
        # Create customer portal session
        session = stripe.billing_portal.Session.create(
            customer=profile['stripe_customer_id'],
            return_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard"
        )
        
        return {"portal_url": session.url}
        
    except Exception as e:
        logging.error(f"Stripe portal error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()