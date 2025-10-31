from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
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

class FoodRecommendation(BaseModel):
    food_item: str
    benefit: str
    category: str

class DiagnosisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personal_info: PersonalInfo
    symptoms: List[str]
    possible_conditions: List[dict]
    recommendations: str
    urgency_level: str
    food_recommendations: List[FoodRecommendation]
    special_warnings: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssessmentHistory(BaseModel):
    id: str
    timestamp: str
    symptoms: List[str]
    urgency_level: str

# Symptom database with images and food recommendations
SYMPTOM_DATA = {
    "Fever": {
        "image": "https://images.pexels.com/photos/3873179/pexels-photo-3873179.jpeg",
        "foods": ["Warm liquids", "Chicken soup", "Citrus fruits", "Ginger tea", "Bananas"]
    },
    "Headache": {
        "image": "https://images.unsplash.com/photo-1560591999-7ed516a308f1",
        "foods": ["Water", "Almonds", "Spinach", "Watermelon", "Magnesium-rich foods"]
    },
    "Back pain": {
        "image": "https://images.unsplash.com/photo-1513447269-5b4e55e75bb8",
        "foods": ["Turmeric", "Salmon", "Tart cherries", "Green tea", "Olive oil"]
    },
    "Cough": {
        "image": "https://images.pexels.com/photos/897817/pexels-photo-897817.jpeg",
        "foods": ["Honey", "Ginger", "Garlic", "Pineapple", "Warm water"]
    },
    "Shortness of breath": {
        "image": "https://images.unsplash.com/photo-1606618742198-99910cb01766",
        "foods": ["Leafy greens", "Beets", "Omega-3 rich fish", "Berries", "Nuts"],
        "warning": "⚠️ CARDIOVASCULAR WARNING: If experiencing shortness of breath while climbing 5 stairs, this may indicate cardiovascular problems. Please consult a Cardiologist immediately for proper examination."
    },
    "Chest pain": {
        "image": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7",
        "foods": ["Whole grains", "Omega-3 fatty acids", "Berries", "Dark chocolate", "Green vegetables"]
    },
    "AM erection issues/Cardio health": {
        "image": "https://images.unsplash.com/photo-1516841273335-e39b37888115",
        "foods": ["Watermelon", "Dark leafy greens", "Nuts", "Salmon", "Berries", "Whole grains"],
        "warning": "⚠️ CARDIOVASCULAR HEALTH CONCERN: Absence of morning erections can be an early indicator of cardiovascular health issues. This may suggest reduced blood circulation. Please schedule an examination with a Cardiologist for comprehensive evaluation."
    }
}

# Routes
@api_router.get("/")
async def root():
    return {"message": "MedEvidences - Super Intelligence Symptom Checker API"}

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

# Common symptoms list with enhanced data
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
        "Itching", "Bruising", "Hair loss", "Pale skin", "Dark urine",
        "AM erection issues/Cardio health"
    ]
    return {"symptoms": symptoms}

# Get symptom data
@api_router.get("/symptoms/data")
async def get_symptom_data():
    return {"symptom_data": SYMPTOM_DATA}

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
            system_message="""You are a medical AI assistant with deep knowledge in symptomology, nutrition, and diagnostics.
            Provide comprehensive analysis including:
            1. Differential diagnosis with probability
            2. Health recommendations
            3. Nutritional/food recommendations specific to symptoms
            4. Urgency assessment
            
            Structure response in JSON format with:
            {
                "possible_conditions": [{"name": "", "probability": "", "description": ""}],
                "recommendations": "",
                "urgency_level": "Emergency/Urgent/Schedule Appointment/Self-Care",
                "food_recommendations": [{"food_item": "", "benefit": "", "category": "Anti-inflammatory/Immune-boosting/etc"}]
            }
            
            Be empathetic, evidence-based, and always recommend consulting healthcare professionals."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Build prompt
        symptoms_text = ", ".join(symptom_input.primary_symptoms)
        prompt = f"""Analyze these symptoms with medical evidence:
        
Patient Info:
- Age: {symptom_input.personal_info.age}
- Sex: {symptom_input.personal_info.sex}
- Pregnant: {symptom_input.personal_info.pregnant if symptom_input.personal_info.pregnant is not None else 'N/A'}

Symptoms: {symptoms_text}
Duration: {symptom_input.symptom_duration}
Severity: {symptom_input.severity}
Additional Info: {symptom_input.additional_info or 'None'}

Provide comprehensive analysis in this exact JSON format:
{{
  "possible_conditions": [
    {{"name": "Condition name", "probability": "High/Medium/Low", "description": "Brief medical explanation"}}
  ],
  "recommendations": "Detailed medical and lifestyle recommendations",
  "urgency_level": "Emergency/Urgent/Schedule Appointment/Self-Care",
  "food_recommendations": [
    {{"food_item": "Food name", "benefit": "How it helps", "category": "Category like Anti-inflammatory"}}
  ]
}}

Include at least 5-7 food recommendations that specifically help with these symptoms."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            ai_result = json.loads(response_text)
        except json.JSONDecodeError as e:
            logging.error(f"JSON parse error: {e}")
            ai_result = {
                "possible_conditions": [
                    {"name": "Analysis pending", "probability": "Unknown", "description": "Please consult healthcare professional"}
                ],
                "recommendations": "Please consult a healthcare professional for proper diagnosis.",
                "urgency_level": "Schedule Appointment",
                "food_recommendations": [
                    {"food_item": "Water", "benefit": "Stay hydrated", "category": "Essential"}
                ]
            }
        
        # Collect special warnings
        special_warnings = []
        for symptom in symptom_input.primary_symptoms:
            if symptom in SYMPTOM_DATA and "warning" in SYMPTOM_DATA[symptom]:
                special_warnings.append(SYMPTOM_DATA[symptom]["warning"])
        
        # Parse food recommendations
        food_recs = []
        for food in ai_result.get("food_recommendations", []):
            food_recs.append(FoodRecommendation(
                food_item=food.get("food_item", ""),
                benefit=food.get("benefit", ""),
                category=food.get("category", "General")
            ))
        
        # Create diagnosis result
        diagnosis = DiagnosisResult(
            personal_info=symptom_input.personal_info,
            symptoms=symptom_input.primary_symptoms,
            possible_conditions=ai_result.get("possible_conditions", []),
            recommendations=ai_result.get("recommendations", ""),
            urgency_level=ai_result.get("urgency_level", "Schedule Appointment"),
            food_recommendations=food_recs,
            special_warnings=special_warnings
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