from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Symptom Checker Models
class PersonalInfo(BaseModel):
    age: int
    sex: str
    pregnant: Optional[bool] = None

class SymptomInput(BaseModel):
    personal_info: PersonalInfo
    primary_symptoms: List[str]
    symptom_duration: str
    severity: str
    additional_info: Optional[str] = None

class DiagnosisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personal_info: PersonalInfo
    symptoms: List[str]
    possible_conditions: List[dict]
    recommendations: str
    urgency_level: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssessmentHistory(BaseModel):
    id: str
    timestamp: str
    symptoms: List[str]
    urgency_level: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Symptom Checker API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Common symptoms list
@api_router.get("/symptoms/common")
async def get_common_symptoms():
    symptoms = [
        "Fever", "Headache", "Cough", "Sore throat", "Runny nose",
        "Fatigue", "Body aches", "Nausea", "Vomiting", "Diarrhea",
        "Abdominal pain", "Chest pain", "Shortness of breath", "Dizziness",
        "Rash", "Joint pain", "Back pain", "Loss of appetite",
        "Difficulty sleeping", "Anxiety", "Depression", "Confusion",
        "Vision problems", "Ear pain", "Toothache", "Muscle cramps",
        "Swelling", "Numbness", "Tingling", "Weight loss", "Weight gain",
        "Frequent urination", "Blood in urine", "Constipation", "Heartburn",
        "Sweating", "Chills", "Loss of taste or smell", "Sneezing",
        "Itching", "Bruising", "Hair loss", "Pale skin", "Dark urine"
    ]
    return {"symptoms": symptoms}

# Analyze symptoms with AI
@api_router.post("/symptoms/analyze", response_model=DiagnosisResult)
async def analyze_symptoms(symptom_input: SymptomInput):
    try:
        # Initialize LLM Chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="""You are a medical AI assistant specialized in symptom analysis. 
            Provide differential diagnosis based on symptoms, but always remind users to consult 
            healthcare professionals. Structure your response in JSON format with:
            1. possible_conditions: Array of {name, probability, description}
            2. recommendations: General health advice
            3. urgency_level: 'Emergency', 'Urgent', 'Schedule Appointment', or 'Self-Care'
            
            Be empathetic, clear, and medically accurate."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Build prompt
        symptoms_text = ", ".join(symptom_input.primary_symptoms)
        prompt = f"""Analyze these symptoms:
        
Patient Info:
- Age: {symptom_input.personal_info.age}
- Sex: {symptom_input.personal_info.sex}
- Pregnant: {symptom_input.personal_info.pregnant if symptom_input.personal_info.pregnant is not None else 'N/A'}

Symptoms: {symptoms_text}
Duration: {symptom_input.symptom_duration}
Severity: {symptom_input.severity}
Additional Info: {symptom_input.additional_info or 'None'}

Provide analysis in this exact JSON format:
{{
  "possible_conditions": [
    {{"name": "Condition name", "probability": "High/Medium/Low", "description": "Brief explanation"}}
  ],
  "recommendations": "Detailed recommendations",
  "urgency_level": "Emergency/Urgent/Schedule Appointment/Self-Care"
}}"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            # Extract JSON from response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            ai_result = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            ai_result = {
                "possible_conditions": [
                    {"name": "Unable to parse diagnosis", "probability": "Unknown", "description": response[:200]}
                ],
                "recommendations": "Please consult a healthcare professional for proper diagnosis.",
                "urgency_level": "Schedule Appointment"
            }
        
        # Create diagnosis result
        diagnosis = DiagnosisResult(
            personal_info=symptom_input.personal_info,
            symptoms=symptom_input.primary_symptoms,
            possible_conditions=ai_result.get("possible_conditions", []),
            recommendations=ai_result.get("recommendations", ""),
            urgency_level=ai_result.get("urgency_level", "Schedule Appointment")
        )
        
        # Save to database
        doc = diagnosis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.assessments.insert_one(doc)
        
        return diagnosis
        
    except Exception as e:
        logging.error(f"Error analyzing symptoms: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

# Get assessment history
@api_router.get("/assessments/history", response_model=List[AssessmentHistory])
async def get_assessment_history(limit: int = 10):
    assessments = await db.assessments.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    history = []
    for assessment in assessments:
        history.append(AssessmentHistory(
            id=assessment['id'],
            timestamp=assessment['timestamp'],
            symptoms=assessment['symptoms'],
            urgency_level=assessment['urgency_level']
        ))
    
    return history

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