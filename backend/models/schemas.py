"""
Pydantic Models for Plutus Predict API
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Any
from enum import Enum

# =============================================================================
# AUTHENTICATION MODELS
# =============================================================================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    language: str = "en"

class UserLogin(BaseModel):
    email: str
    password: str

# =============================================================================
# FORECASTING MODELS
# =============================================================================

class ForecastRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=500)

class PredictionCreate(BaseModel):
    title: str
    category: str
    probability: float = Field(ge=0, le=100)
    rationale: str = ""

class DeepForecastRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=200)
    num_questions: int = Field(default=5, ge=1, le=10)
    timeframe: str = "2025"

class JudgmentalForecastRequest(BaseModel):
    question: str
    context: Optional[str] = ""
    include_factors: Optional[bool] = True

class BacktestRequest(BaseModel):
    question: str
    reference_date: str
    known_outcome: Optional[bool] = None

class MultiAgentForecastRequest(BaseModel):
    question: str
    depth: str = "comprehensive"
    include_scenarios: bool = True

# =============================================================================
# CHAT MODELS
# =============================================================================

class ChatMessage(BaseModel):
    message: str

# =============================================================================
# PAYMENT MODELS
# =============================================================================

class PaymentRequest(BaseModel):
    plan: str
    origin_url: str

# =============================================================================
# DASHBOARD MODELS
# =============================================================================

class DashboardRequest(BaseModel):
    name: str
    predictions: List[str]
    notify_on_change: bool = True

class DashboardCreateRequest(BaseModel):
    name: str
    widgets: List[Dict[str, Any]] = []

class DashboardUpdateRequest(BaseModel):
    name: Optional[str] = None
    widgets: Optional[List[Dict[str, Any]]] = None

# =============================================================================
# TOURNAMENT MODELS
# =============================================================================

class TournamentQuestionCreate(BaseModel):
    question: str
    resolution_date: str
    category: str = "general"

class TournamentForecastSubmit(BaseModel):
    question_id: str
    prediction: float = Field(ge=0, le=100)
    rationale: Optional[str] = ""

class TournamentResolve(BaseModel):
    question_id: str
    outcome: bool

# =============================================================================
# ADMIN MODELS
# =============================================================================

class OrganizationCreate(BaseModel):
    name: str

class EmployeeAdd(BaseModel):
    email: str
    role: str = "member"

class DocumentCreate(BaseModel):
    name: str
    content: str
    doc_type: str = "general"
    enterprise_id: Optional[str] = None

class DocumentShare(BaseModel):
    user_ids: List[str]

class PasswordPolicy(BaseModel):
    min_length: int = 8
    require_uppercase: bool = True
    require_numbers: bool = True
    require_special: bool = False
    expiry_days: int = 90

class EmailSettings(BaseModel):
    smtp_host: str = ""
    smtp_port: int = 587
    sender_email: str = ""
    sender_name: str = ""

class OrgEmail(BaseModel):
    subject: str
    body: str
    recipients: List[str]

# =============================================================================
# PREDICTION MODELS
# =============================================================================

class PredictionOutcomeRequest(BaseModel):
    prediction_id: str
    actual_outcome: bool
    notes: Optional[str] = ""

class EmailAlertRequest(BaseModel):
    recipient: str
    subject: str
    message: str

# =============================================================================
# ASTROLOGY MODELS
# =============================================================================

class AstrologySearchRequest(BaseModel):
    query: str
    channel_filter: Optional[str] = None
