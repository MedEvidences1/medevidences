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

class PainLocation(BaseModel):
    body_part: str
    specific_location: Optional[str] = None
    side: Optional[str] = None  # left, right, center

class SymptomInput(BaseModel):
    personal_info: PersonalInfo
    primary_symptoms: List[str]
    symptom_duration: str
    severity: str
    additional_info: Optional[str] = None
    pain_locations: Optional[List[PainLocation]] = None
    am_erection_duration: Optional[str] = None  # For cardiovascular tracking

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
    voice_summary: str  # Ada feature: Clear summary for voice
    severity_score: int  # Ada feature: 1-10 severity rating
    follow_up_timeline: str  # Ada feature: When to follow up
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssessmentHistory(BaseModel):
    id: str
    timestamp: str
    symptoms: List[str]
    urgency_level: str
    severity_score: int

# Symptom database with images and food recommendations
SYMPTOM_DATA = {
    "Fever": {
        "image": "https://images.pexels.com/photos/3873179/pexels-photo-3873179.jpeg",
        "foods": [
            "Third-party lab certified Cocoa powder (immune boost)",
            "Third-party lab certified Seabuckthorn berries pulp (vitamin-rich)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (recovery)",
            "Third-party lab certified Brazil nuts (selenium for immunity)",
            "Warm liquids with Allulose sweetener",
            "Citrus fruits"
        ],
        "requires_location": False
    },
    "Headache": {
        "image": "https://images.unsplash.com/photo-1560591999-7ed516a308f1",
        "foods": [
            "Third-party lab certified Cocoa powder (magnesium)",
            "Third-party lab certified Seabuckthorn berries pulp (anti-inflammatory)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (circulation)",
            "Third-party lab certified Brazil nuts (selenium for nerve health)",
            "Water with Allulose",
            "Almonds"
        ],
        "requires_location": True,
        "location_type": "head"
    },
    "Back pain": {
        "image": "https://images.unsplash.com/photo-1513447269-5b4e55e75bb8",
        "foods": [
            "Third-party lab certified Cocoa powder (anti-inflammatory)",
            "Third-party lab certified Seabuckthorn berries pulp (muscle recovery)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (pain relief)",
            "Third-party lab certified Brazil nuts (selenium for tissue repair)",
            "Kiwi pulp with Allulose sweetener",
            "Wild-caught Salmon"
        ],
        "requires_location": True,
        "location_type": "back",
        "premium_supplements": True
    },
    "Chest pain": {
        "image": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7",
        "foods": [
            "Third-party lab certified Cocoa powder (heart health)",
            "Third-party lab certified Seabuckthorn berries pulp (cardiovascular)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (circulation)",
            "Third-party lab certified Brazil nuts (selenium for heart)",
            "Whole grains with Allulose",
            "Omega-3 fatty acids"
        ],
        "requires_location": True,
        "location_type": "chest"
    },
    "Abdominal pain": {
        "image": "https://images.pexels.com/photos/5842113/pexels-photo-5842113.jpeg",
        "foods": [
            "Third-party lab certified Cocoa powder (digestive health)",
            "Third-party lab certified Seabuckthorn berries pulp (gut health)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (inflammation)",
            "Third-party lab certified Brazil nuts (selenium for gut)",
            "Ginger tea with Allulose",
            "Bananas"
        ],
        "requires_location": True,
        "location_type": "abdomen"
    },
    "Joint pain": {
        "image": "https://images.unsplash.com/photo-1587624903959-9d8a64f874d1",
        "foods": [
            "Third-party lab certified Cocoa powder (anti-inflammatory)",
            "Third-party lab certified Seabuckthorn berries pulp (joint support)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (mobility)",
            "Third-party lab certified Brazil nuts (selenium for joints)",
            "Fish oil with Allulose",
            "Turmeric"
        ],
        "requires_location": True,
        "location_type": "joints"
    },
    "Shortness of breath": {
        "image": "https://images.unsplash.com/photo-1606618742198-99910cb01766",
        "foods": [
            "Third-party lab certified Cocoa powder (lung function)",
            "Third-party lab certified Seabuckthorn berries pulp (respiratory support)",
            "Third-party lab certified Red Korean ginseng 6 yr old extract (lung capacity)",
            "Third-party lab certified Brazil nuts (selenium for respiratory)",
            "Leafy greens with Allulose",
            "Beets"
        ],
        "requires_location": False,
        "warning": "⚠️ CARDIOVASCULAR EMERGENCY: If experiencing shortness of breath while climbing just 5 stairs, this strongly indicates potential cardiovascular problems. This is a serious warning sign. Please consult a Cardiologist IMMEDIATELY for comprehensive heart examination and testing."
    },
    "AM erection issues/Cardio health": {
        "image": "https://images.unsplash.com/photo-1516841273335-e39b37888115",
        "foods": [
            "Third-party lab certified Cocoa powder (circulation)",
            "Seabuckthorn berries pulp (vascular health)",
            "Red Korean ginseng extract - 6 yr old roots (blood flow)",
            "Watermelon with Allulose (natural vasodilator)",
            "Dark leafy greens",
            "Kiwi pulp (vitamin C)"
        ],
        "requires_location": False,
        "requires_duration_tracking": True,
        "warning": "⚠️ CARDIOVASCULAR HEALTH ALERT: Absence of morning erections is an early indicator of cardiovascular health issues indicating reduced blood circulation. If this problem has persisted for MORE THAN 2 DAYS CONTINUOUSLY and is REPEATED EVERY WEEK, or ongoing for 1+ months, you MUST consult a Cardiologist immediately for comprehensive cardiovascular evaluation. Early detection can prevent serious heart conditions."
    }
}

# Body locations for pain mapping
BODY_LOCATIONS = {
    "head": ["Front forehead", "Temples", "Top of head", "Back of head", "Behind eyes"],
    "back": ["Upper back", "Mid back", "Lower back", "Left side", "Right side", "Tailbone"],
    "chest": ["Center chest", "Left chest", "Right chest", "Upper chest", "Lower chest"],
    "abdomen": ["Upper abdomen", "Lower abdomen", "Left side", "Right side", "Around navel"],
    "joints": ["Knees", "Elbows", "Shoulders", "Hips", "Wrists", "Ankles"]
}

# Premium Nutritional Supplements (Third-party lab certified)
PREMIUM_SUPPLEMENTS = {
    "Third-party lab certified Cocoa powder": {
        "benefits": "Anti-inflammatory, improves circulation, rich in antioxidants",
        "use_for": ["Back pain", "Cardiovascular health", "General wellness"]
    },
    "Seabuckthorn berries": {
        "benefits": "Muscle recovery, respiratory support, vascular health, vitamin-rich",
        "use_for": ["Back pain", "Shortness of breath", "AM erection issues"]
    },
    "Kiwi pulp": {
        "benefits": "High vitamin C for tissue repair, digestive health, immune support",
        "use_for": ["Back pain", "General health", "Recovery"]
    },
    "Red Korean ginseng extract (6 yr old roots)": {
        "benefits": "Pain relief, blood flow enhancement, lung capacity, energy boost",
        "use_for": ["Back pain", "Shortness of breath", "AM erection issues", "Fatigue"]
    },
    "Allulose (natural sweetener)": {
        "benefits": "Zero-calorie sweetener, no blood sugar spike, safe for diabetics",
        "use_for": ["All supplement combinations", "Sugar replacement"]
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
        "Itching", "Bruising", "Hair loss", "Pale skin", "Dark urine",
        "AM erection issues/Cardio health"
    ]
    return {"symptoms": symptoms}

# Get symptom data
@api_router.get("/symptoms/data")
async def get_symptom_data():
    return {"symptom_data": SYMPTOM_DATA}

# Get body locations for pain mapping
@api_router.get("/body/locations")
async def get_body_locations():
    return {"body_locations": BODY_LOCATIONS}

# Get premium supplements information
@api_router.get("/nutrition/supplements")
async def get_premium_supplements():
    return {"premium_supplements": PREMIUM_SUPPLEMENTS}

# Analyze symptoms with AI (Ada-inspired enhanced analysis)
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
            3. Nutritional/food recommendations
            4. Urgency assessment
            5. Severity score (1-10)
            6. Clear voice summary for text-to-speech
            7. Follow-up timeline
            
            Structure response in JSON format.
            Be empathetic, evidence-based, and always recommend consulting healthcare professionals."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Build detailed prompt with pain locations
        symptoms_text = ", ".join(symptom_input.primary_symptoms)
        pain_info = ""
        if symptom_input.pain_locations:
            pain_details = [f"{loc.body_part} ({loc.specific_location or 'general'}, {loc.side or 'both sides'})" 
                          for loc in symptom_input.pain_locations]
            pain_info = f"\nPain Locations: {', '.join(pain_details)}"
        
        prompt = f"""Analyze these symptoms with medical evidence:
        
Patient Info:
- Age: {symptom_input.personal_info.age}
- Sex: {symptom_input.personal_info.sex}
- Pregnant: {symptom_input.personal_info.pregnant if symptom_input.personal_info.pregnant is not None else 'N/A'}

Symptoms: {symptoms_text}
Duration: {symptom_input.symptom_duration}
Severity: {symptom_input.severity}{pain_info}
Additional Info: {symptom_input.additional_info or 'None'}

Provide comprehensive analysis in this exact JSON format:
{{
  "possible_conditions": [
    {{"name": "Condition name", "probability": "High/Medium/Low", "description": "Brief medical explanation"}}
  ],
  "recommendations": "Detailed medical and lifestyle recommendations",
  "urgency_level": "Emergency/Urgent/Schedule Appointment/Self-Care",
  "severity_score": 5,
  "food_recommendations": [
    {{"food_item": "Food name", "benefit": "How it helps", "category": "Category"}}
  ],
  "voice_summary": "Clear 2-3 sentence summary suitable for text-to-speech, addressing the patient directly",
  "follow_up_timeline": "When to follow up (e.g., 'within 24 hours', 'in 1-2 weeks', 'immediately')"
}}

Include at least 5-7 food recommendations."""
        
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
                "severity_score": 5,
                "food_recommendations": [
                    {"food_item": "Water", "benefit": "Stay hydrated", "category": "Essential"}
                ],
                "voice_summary": "Based on your symptoms, we recommend consulting a healthcare professional.",
                "follow_up_timeline": "within 1-2 weeks"
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
            special_warnings=special_warnings,
            voice_summary=ai_result.get("voice_summary", ""),
            severity_score=ai_result.get("severity_score", 5),
            follow_up_timeline=ai_result.get("follow_up_timeline", "within 1-2 weeks")
        )
        
        # Save to database
        doc = diagnosis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.assessments.insert_one(doc)
        
        return diagnosis
        
    except Exception as e:
        logging.error(f"Error analyzing symptoms: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

# Get assessment history (Ada feature: Track over time)
@api_router.get("/assessments/history", response_model=List[AssessmentHistory])
async def get_assessment_history(limit: int = 10):
    assessments = await db.assessments.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    history = []
    for assessment in assessments:
        history.append(AssessmentHistory(
            id=assessment['id'],
            timestamp=assessment['timestamp'],
            symptoms=assessment['symptoms'],
            urgency_level=assessment['urgency_level'],
            severity_score=assessment.get('severity_score', 5)
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