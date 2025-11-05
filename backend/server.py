from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

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

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
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
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Get user data from Emergent OAuth service
        import aiohttp
        oauth_service_url = os.environ.get('OAUTH_SERVICE_URL', 'https://demobackend.emergentagent.com')
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f'{oauth_service_url}/auth/v1/env/oauth/session-data',
                headers={'X-Session-ID': session_id}
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=401, detail="Invalid session")
                user_data = await response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
        
        if not existing_user:
            # Create new user (role will be set later)
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
        else:
            user_id = existing_user['id']
        
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
        
        # Return user data and session token
        return {
            "session_token": session_token,
            "user": {
                "id": user_id,
                "email": user_data['email'],
                "name": user_data['name'],
                "picture": user_data.get('picture'),
                "role": existing_user.get('role', '') if existing_user else ''
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

# Application Routes
@api_router.post("/applications", response_model=Application)
async def create_application(
    application_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can apply to jobs")
    
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