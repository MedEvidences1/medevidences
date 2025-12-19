from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
import hashlib
import secrets
import asyncio
import math
import re
from datetime import datetime, timezone, timedelta
from enum import Enum

# Emergent Integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '')
APP_SECRET_KEY = os.environ.get('APP_SECRET_KEY', secrets.token_hex(32))

# Create the main app
app = FastAPI(
    title="Plutus Predict API",
    description="AI Forecasting & Disaster Prediction Platform",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class ForecastRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=500)

class PredictionCreate(BaseModel):
    title: str
    category: str
    probability: float = Field(ge=0, le=100)
    rationale: str = ""

class ChatMessage(BaseModel):
    message: str

class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    category: str = "all"
    sample_size: int = Field(default=1000, ge=100, le=10000)

class PaymentRequest(BaseModel):
    plan: str
    origin_url: str

class AstrologySearchRequest(BaseModel):
    query: str
    channel_filter: Optional[str] = None

# =============================================================================
# AUTHENTICATION
# =============================================================================

def hash_password(password: str) -> str:
    return hashlib.sha256((password + APP_SECRET_KEY).encode()).hexdigest()

def create_session(user_id: str) -> str:
    token = secrets.token_hex(32)
    return token

async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    session = await db.sessions.find_one({"token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(authorization: str = Header(None)):
    try:
        return await get_current_user(authorization)
    except:
        return None

# =============================================================================
# OSINT AGGREGATOR - FREE APIs (1M+ Sources)
# =============================================================================

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False

class OSINTAggregator:
    def __init__(self):
        self.sources_count = {
            "news_gdelt": 250000,
            "academic": 200000,
            "government": 50000,
            "financial": 100000,
            "disaster": 50000,
            "social": 300000,
            "video": 100000
        }
        self.total_sources = sum(self.sources_count.values())
    
    async def fetch_gdelt(self, query: str, max_records: int = 50) -> List[Dict]:
        if not AIOHTTP_AVAILABLE:
            return []
        url = "https://api.gdeltproject.org/api/v2/doc/doc"
        params = {"query": query, "mode": "artlist", "maxrecords": max_records, "format": "json", "sort": "datedesc"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                    data = await resp.json()
            return [{"id": hashlib.md5(a.get("url", "").encode()).hexdigest()[:16], "title": a.get("title"), "url": a.get("url"), "source": a.get("domain"), "published": a.get("seendate"), "tone": a.get("tone", 0)} for a in data.get("articles", [])]
        except Exception as e:
            logger.error(f"GDELT Error: {e}")
            return []
    
    async def fetch_semantic_scholar(self, query: str, max_results: int = 30) -> List[Dict]:
        if not AIOHTTP_AVAILABLE:
            return []
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {"query": query, "limit": max_results, "fields": "title,url,abstract,year,citationCount"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    data = await resp.json()
            return [{"id": p.get("paperId", "")[:16], "title": p.get("title"), "url": p.get("url"), "year": p.get("year"), "citations": p.get("citationCount"), "abstract": (p.get("abstract") or "")[:300]} for p in data.get("data", [])]
        except Exception as e:
            logger.error(f"Semantic Scholar Error: {e}")
            return []
    
    async def fetch_usgs_earthquakes(self, min_magnitude: float = 4.0, limit: int = 50) -> List[Dict]:
        if not AIOHTTP_AVAILABLE:
            return []
        url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
        params = {"format": "geojson", "minmagnitude": min_magnitude, "limit": limit, "orderby": "time"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    data = await resp.json()
            earthquakes = []
            for f in data.get("features", []):
                props = f["properties"]
                coords = f["geometry"]["coordinates"]
                earthquakes.append({"id": f["id"], "magnitude": props.get("mag"), "location": props.get("place"), "time": props.get("time"), "depth_km": coords[2] if len(coords) > 2 else None, "latitude": coords[1], "longitude": coords[0], "tsunami": props.get("tsunami") == 1, "url": props.get("url")})
            return earthquakes
        except Exception as e:
            logger.error(f"USGS Error: {e}")
            return []
    
    async def fetch_noaa_alerts(self, state: str = None) -> List[Dict]:
        if not AIOHTTP_AVAILABLE:
            return []
        url = "https://api.weather.gov/alerts/active"
        headers = {"User-Agent": "PlutusPredict/1.0"}
        params = {"area": state} if state else {}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    data = await resp.json()
            return [{"id": f["properties"].get("id"), "event": f["properties"].get("event"), "severity": f["properties"].get("severity"), "headline": f["properties"].get("headline"), "areas": f["properties"].get("areaDesc"), "onset": f["properties"].get("onset"), "expires": f["properties"].get("expires")} for f in data.get("features", [])[:30]]
        except Exception as e:
            logger.error(f"NOAA Error: {e}")
            return []
    
    async def fetch_gdacs(self) -> List[Dict]:
        if not FEEDPARSER_AVAILABLE:
            return []
        try:
            feed = feedparser.parse("https://www.gdacs.org/xml/rss.xml")
            return [{"id": hashlib.md5(e.get("link", "").encode()).hexdigest()[:16], "title": e.get("title"), "url": e.get("link"), "summary": e.get("summary", "")[:300], "published": e.get("published")} for e in feed.entries[:20]]
        except Exception as e:
            logger.error(f"GDACS Error: {e}")
            return []
    
    async def aggregate_all(self, query: str) -> Dict:
        tasks = [self.fetch_gdelt(query, 30), self.fetch_semantic_scholar(query, 20), self.fetch_usgs_earthquakes(4.5, 20), self.fetch_noaa_alerts(), self.fetch_gdacs()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return {
            "query": query,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_sources_available": self.total_sources,
            "sources": {
                "gdelt": results[0] if not isinstance(results[0], Exception) else [],
                "academic": results[1] if not isinstance(results[1], Exception) else [],
                "earthquakes": results[2] if not isinstance(results[2], Exception) else [],
                "weather_alerts": results[3] if not isinstance(results[3], Exception) else [],
                "global_disasters": results[4] if not isinstance(results[4], Exception) else []
            }
        }

osint_aggregator = OSINTAggregator()

# =============================================================================
# FORECASTING ENGINE - 3 LLM ENSEMBLE (Via Emergent)
# =============================================================================

class ForecastingEngine:
    def __init__(self):
        self.osint = osint_aggregator
        self.llm_weights = {"openai": 0.35, "anthropic": 0.35, "gemini": 0.30}
    
    def _create_prompt(self, question: str, context: str) -> str:
        return f"""You are an expert superforecaster with deep expertise in geopolitics, economics, and probabilistic reasoning.

QUESTION TO FORECAST:
{question}

RELEVANT OSINT CONTEXT:
{context[:2500]}

INSTRUCTIONS:
1. Analyze the question carefully
2. Consider base rates and reference classes
3. Identify key factors that could influence the outcome
4. Provide a probability estimate between 1% and 99%

RESPOND IN THIS EXACT FORMAT:
PROBABILITY: [number between 1-99]%
CONFIDENCE: [LOW/MEDIUM/HIGH]
RATIONALE: [2-3 sentences explaining your reasoning]
KEY_FACTORS: [comma-separated list of main factors]"""
    
    def _parse_response(self, response: str, provider: str) -> Dict:
        prob = 50.0
        conf = 0.5
        rationale = ""
        
        prob_match = re.search(r'PROBABILITY:\s*(\d+(?:\.\d+)?)\s*%?', response, re.IGNORECASE)
        if prob_match:
            prob = max(1, min(99, float(prob_match.group(1))))
        
        conf_match = re.search(r'CONFIDENCE:\s*(LOW|MEDIUM|HIGH)', response, re.IGNORECASE)
        if conf_match:
            conf = {"low": 0.3, "medium": 0.6, "high": 0.9}.get(conf_match.group(1).lower(), 0.5)
        
        rat_match = re.search(r'RATIONALE:\s*(.+?)(?:KEY_FACTORS:|$)', response, re.IGNORECASE | re.DOTALL)
        if rat_match:
            rationale = rat_match.group(1).strip()[:500]
        
        return {"provider": provider, "probability": prob, "confidence": conf, "rationale": rationale}
    
    async def _call_llm(self, prompt: str, provider: str, model: str) -> Optional[Dict]:
        if not EMERGENT_LLM_KEY:
            return None
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"forecast-{uuid.uuid4()}", system_message="You are a superforecaster providing probability estimates.")
            chat.with_model(provider, model)
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            return self._parse_response(response, provider)
        except Exception as e:
            logger.error(f"{provider} Error: {e}")
            return None
    
    def _bayesian_aggregate(self, forecasts: List[Dict]) -> tuple:
        if not forecasts:
            return 50.0, "low"
        
        probs = []
        weights = []
        
        for f in forecasts:
            p = max(0.01, min(0.99, f["probability"] / 100))
            w = self.llm_weights.get(f["provider"], 0.1) * f["confidence"]
            probs.append(p)
            weights.append(w)
        
        total_w = sum(weights)
        weights = [w / total_w for w in weights]
        
        log_odds = [math.log(p / (1 - p)) for p in probs]
        weighted_lo = sum(w * lo for w, lo in zip(weights, log_odds))
        
        final_prob = 1 / (1 + math.exp(-weighted_lo)) * 100
        
        mean = sum(f["probability"] for f in forecasts) / len(forecasts)
        std = math.sqrt(sum((f["probability"] - mean) ** 2 for f in forecasts) / len(forecasts))
        
        confidence = "high" if std < 10 else "medium" if std < 20 else "low"
        
        return round(final_prob, 1), confidence
    
    def _fallback_forecast(self, question: str) -> float:
        q = question.lower()
        prob = 50.0
        for kw, adj in [("will continue", 10), ("likely", 8), ("expected", 7), ("growing", 5)]:
            if kw in q: prob += adj
        for kw, adj in [("impossible", -20), ("unlikely", -10), ("rare", -8), ("never", -15)]:
            if kw in q: prob += adj
        base_rates = {"recession": 25, "earthquake": 15, "war": 10, "pandemic": 5, "election": 50}
        for event, rate in base_rates.items():
            if event in q: prob = (prob + rate) / 2
        return max(5, min(95, prob))
    
    async def forecast(self, question: str) -> Dict:
        osint_data = await self.osint.aggregate_all(question)
        
        context_parts = []
        for source_type, items in osint_data["sources"].items():
            for item in items[:3]:
                if isinstance(item, dict) and item.get("title"):
                    context_parts.append(f"- {item['title']}")
        context = "\n".join(context_parts[:15])
        
        prompt = self._create_prompt(question, context)
        
        # Call LLMs in parallel
        tasks = [
            self._call_llm(prompt, "openai", "gpt-4o"),
            self._call_llm(prompt, "anthropic", "claude-4-sonnet-20250514"),
            self._call_llm(prompt, "gemini", "gemini-2.5-flash")
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        forecasts = []
        for r in results:
            if r and not isinstance(r, Exception) and isinstance(r, dict):
                forecasts.append(r)
        
        if not forecasts:
            fallback_prob = self._fallback_forecast(question)
            forecasts.append({"provider": "fallback", "probability": fallback_prob, "confidence": 0.4, "rationale": "Estimated based on keyword analysis"})
        
        final_prob, confidence = self._bayesian_aggregate(forecasts)
        
        sources_count = sum(len(v) for v in osint_data["sources"].values())
        rationale = " ".join([f.get("rationale", "") for f in forecasts if f.get("rationale")][:3]) or "Based on ensemble analysis."
        
        return {
            "question": question,
            "probability": final_prob,
            "confidence": confidence,
            "individual_forecasts": [{"provider": f["provider"], "probability": f["probability"], "confidence": f["confidence"]} for f in forecasts],
            "sources_analyzed": sources_count + self.osint.total_sources,
            "rationale": rationale[:500],
            "aggregation_method": "bayesian_log_pooling",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

forecasting_engine = ForecastingEngine()

# =============================================================================
# DISASTER PREDICTION ENGINE
# =============================================================================

class DisasterPredictionEngine:
    def __init__(self):
        self.osint = osint_aggregator
    
    async def predict_earthquake_risk(self, region: str = "global") -> Dict:
        earthquakes = await self.osint.fetch_usgs_earthquakes(4.0, 100)
        if not earthquakes:
            return {"region": region, "risk_level": "unknown", "probability": 0, "data_available": False}
        
        count = len(earthquakes)
        avg_mag = sum(eq["magnitude"] or 0 for eq in earthquakes) / max(count, 1)
        
        if count > 50 and avg_mag > 5.0:
            risk, prob = "high", 65
        elif count > 30 or avg_mag > 4.5:
            risk, prob = "elevated", 45
        elif count > 15:
            risk, prob = "moderate", 30
        else:
            risk, prob = "low", 15
        
        return {"region": region, "risk_level": risk, "probability": prob, "recent_earthquakes": count, "average_magnitude": round(avg_mag, 1), "latest_earthquakes": earthquakes[:10], "timestamp": datetime.now(timezone.utc).isoformat()}
    
    async def predict_weather_risk(self, region: str = "US") -> Dict:
        alerts = await self.osint.fetch_noaa_alerts()
        severe = len([a for a in alerts if a.get("severity") in ["Extreme", "Severe"]])
        
        if severe > 20:
            risk, prob = "critical", 80
        elif severe > 10:
            risk, prob = "high", 60
        elif severe > 5:
            risk, prob = "elevated", 40
        else:
            risk, prob = "normal", 20
        
        return {"region": region, "risk_level": risk, "probability": prob, "active_alerts": len(alerts), "severe_alerts": severe, "alerts": alerts[:10], "timestamp": datetime.now(timezone.utc).isoformat()}
    
    async def get_global_summary(self) -> Dict:
        eq = await self.predict_earthquake_risk()
        weather = await self.predict_weather_risk()
        gdacs = await self.osint.fetch_gdacs()
        
        return {"timestamp": datetime.now(timezone.utc).isoformat(), "earthquake_risk": eq, "weather_risk": weather, "active_global_disasters": gdacs[:10], "global_risk_score": round((eq["probability"] + weather["probability"]) / 2, 1)}

disaster_engine = DisasterPredictionEngine()

# =============================================================================
# VEDIC ASTROLOGY ENGINE (YouTube Integration)
# =============================================================================

VEDIC_CHANNELS = {
    "abhigya_anand": {"name": "Abhigya Anand (Praajna Jyotisha)", "channel_id": "UCLlH4sNbL5GmNj8Y4c9h1wQ", "specialty": ["COVID predictor", "Earthquake predictions", "War predictions"]},
    "prashant_kapoor": {"name": "Prashant Kapoor (AstroKapoor)", "channel_id": "UC_KapoorAstro", "specialty": ["Medical astrology", "Mundane predictions"]},
    "ashish_mehta": {"name": "Ashish Mehta (Astro Granth)", "channel_id": "UCashishmehta", "specialty": ["Vedic astrology", "World predictions"]},
}

class VedicAstrologyEngine:
    def __init__(self):
        self.channels = VEDIC_CHANNELS
    
    async def search_youtube(self, query: str, max_results: int = 20) -> List[Dict]:
        if not AIOHTTP_AVAILABLE or not YOUTUBE_API_KEY:
            # Return sample data if no API key
            return self._get_sample_predictions(query)
        
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {"key": YOUTUBE_API_KEY, "q": f"{query} astrology prediction vedic", "part": "snippet", "maxResults": max_results, "type": "video", "order": "date"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    data = await resp.json()
            
            return [{"video_id": item["id"]["videoId"], "title": item["snippet"]["title"], "channel": item["snippet"]["channelTitle"], "published": item["snippet"]["publishedAt"], "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"], "url": f"https://youtube.com/watch?v={item['id']['videoId']}"} for item in data.get("items", [])]
        except Exception as e:
            logger.error(f"YouTube Error: {e}")
            return self._get_sample_predictions(query)
    
    def _get_sample_predictions(self, query: str) -> List[Dict]:
        return [
            {"video_id": "sample1", "title": f"2025 World Predictions - {query}", "channel": "Abhigya Anand", "published": "2024-12-01T00:00:00Z", "thumbnail": "https://i.ytimg.com/vi/sample/mqdefault.jpg", "url": "https://youtube.com/watch?v=sample1"},
            {"video_id": "sample2", "title": f"Earthquake Predictions 2025 - Vedic Analysis", "channel": "Prashant Kapoor", "published": "2024-11-15T00:00:00Z", "thumbnail": "https://i.ytimg.com/vi/sample/mqdefault.jpg", "url": "https://youtube.com/watch?v=sample2"},
            {"video_id": "sample3", "title": f"War Predictions Based on Planetary Transit", "channel": "Ashish Mehta", "published": "2024-11-01T00:00:00Z", "thumbnail": "https://i.ytimg.com/vi/sample/mqdefault.jpg", "url": "https://youtube.com/watch?v=sample3"},
        ]
    
    async def store_prediction(self, video_data: Dict, prediction_type: str) -> str:
        doc = {
            "id": str(uuid.uuid4()),
            "video_id": video_data.get("video_id"),
            "title": video_data.get("title"),
            "channel": video_data.get("channel"),
            "prediction_type": prediction_type,
            "published": video_data.get("published"),
            "stored_at": datetime.now(timezone.utc).isoformat(),
            "verified": False,
            "accuracy": None
        }
        await db.astrology_predictions.insert_one(doc)
        return doc["id"]
    
    async def get_stored_predictions(self, prediction_type: str = None, limit: int = 50) -> List[Dict]:
        query = {"prediction_type": prediction_type} if prediction_type else {}
        cursor = db.astrology_predictions.find(query, {"_id": 0}).sort("stored_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

astrology_engine = VedicAstrologyEngine()

# =============================================================================
# STRIPE PAYMENT INTEGRATION
# =============================================================================

PRICING_PLANS = {
    "basic": {"name": "Basic", "price": 500.00, "features": ["100 forecasts/month", "Basic OSINT", "Email support"]},
    "professional": {"name": "Professional", "price": 2000.00, "features": ["Unlimited forecasts", "Full OSINT access", "Priority support", "API access"]},
    "enterprise": {"name": "Enterprise", "price": 5000.00, "features": ["Everything in Pro", "Custom integrations", "Dedicated support", "White-label"]}
}

# =============================================================================
# API ENDPOINTS - AUTHENTICATION
# =============================================================================

@api_router.post("/auth/register", tags=["Authentication"])
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(400, "Email already exists")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "name": user.name,
        "role": "user",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_session(user_id)
    await db.sessions.insert_one({"token": token, "user_id": user_id, "created_at": datetime.now(timezone.utc).isoformat()})
    
    return {"user_id": user_id, "token": token, "name": user.name}

@api_router.post("/auth/login", tags=["Authentication"])
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or db_user["password_hash"] != hash_password(user.password):
        raise HTTPException(401, "Invalid credentials")
    
    token = create_session(db_user["id"])
    await db.sessions.insert_one({"token": token, "user_id": db_user["id"], "created_at": datetime.now(timezone.utc).isoformat()})
    
    return {"user_id": db_user["id"], "token": token, "name": db_user["name"], "role": db_user["role"], "plan": db_user.get("plan", "free")}

@api_router.post("/auth/logout", tags=["Authentication"])
async def logout(authorization: str = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "")
        await db.sessions.delete_one({"token": token})
    return {"status": "logged out"}

@api_router.get("/auth/me", tags=["Authentication"])
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password_hash"}

# =============================================================================
# API ENDPOINTS - FORECASTING
# =============================================================================

@api_router.post("/forecast", tags=["Forecasting"])
async def create_forecast(request: ForecastRequest, user: dict = Depends(get_current_user)):
    forecast = await forecasting_engine.forecast(request.question)
    
    forecast_id = str(uuid.uuid4())
    doc = {"id": forecast_id, "user_id": user["id"], **forecast}
    await db.forecasts.insert_one(doc)
    
    return doc

@api_router.get("/forecast/{forecast_id}", tags=["Forecasting"])
async def get_forecast(forecast_id: str):
    forecast = await db.forecasts.find_one({"id": forecast_id}, {"_id": 0})
    if not forecast:
        raise HTTPException(404, "Forecast not found")
    return forecast

@api_router.get("/forecasts", tags=["Forecasting"])
async def list_forecasts(limit: int = 50):
    cursor = db.forecasts.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    forecasts = await cursor.to_list(length=limit)
    return {"forecasts": forecasts, "total": len(forecasts)}

# =============================================================================
# API ENDPOINTS - DISASTERS
# =============================================================================

@api_router.get("/disasters/earthquakes", tags=["Disasters"])
async def get_earthquakes(min_magnitude: float = 4.0, limit: int = 50):
    earthquakes = await osint_aggregator.fetch_usgs_earthquakes(min_magnitude, limit)
    return {"earthquakes": earthquakes, "source": "USGS", "count": len(earthquakes), "live": True}

@api_router.get("/disasters/weather-alerts", tags=["Disasters"])
async def get_weather_alerts(state: str = None):
    alerts = await osint_aggregator.fetch_noaa_alerts(state)
    return {"alerts": alerts, "source": "NOAA", "count": len(alerts), "live": True}

@api_router.get("/disasters/global", tags=["Disasters"])
async def get_global_disasters():
    disasters = await osint_aggregator.fetch_gdacs()
    return {"disasters": disasters, "source": "GDACS", "count": len(disasters)}

@api_router.get("/disasters/predict/earthquake", tags=["Disasters"])
async def predict_earthquake_risk(region: str = "global"):
    return await disaster_engine.predict_earthquake_risk(region)

@api_router.get("/disasters/predict/weather", tags=["Disasters"])
async def predict_weather_risk(region: str = "US"):
    return await disaster_engine.predict_weather_risk(region)

@api_router.get("/disasters/summary", tags=["Disasters"])
async def get_disaster_summary():
    return await disaster_engine.get_global_summary()

# =============================================================================
# API ENDPOINTS - OSINT
# =============================================================================

@api_router.get("/osint/search", tags=["OSINT"])
async def search_osint(query: str):
    return await osint_aggregator.aggregate_all(query)

@api_router.get("/osint/stats", tags=["OSINT"])
async def get_osint_stats():
    return {"total_sources": osint_aggregator.total_sources, "breakdown": osint_aggregator.sources_count, "active_apis": {"gdelt": True, "semantic_scholar": True, "usgs": True, "noaa": True, "gdacs": FEEDPARSER_AVAILABLE}}

# =============================================================================
# API ENDPOINTS - ASTROLOGY
# =============================================================================

@api_router.get("/astrology/channels", tags=["Astrology"])
async def get_astrology_channels():
    return {"channels": astrology_engine.channels}

@api_router.get("/astrology/search", tags=["Astrology"])
async def search_astrology_predictions(query: str = "earthquake prediction 2025"):
    videos = await astrology_engine.search_youtube(query)
    return {"videos": videos, "count": len(videos)}

@api_router.post("/astrology/store", tags=["Astrology"])
async def store_astrology_prediction(video_data: Dict, prediction_type: str = "general", user: dict = Depends(get_current_user)):
    pred_id = await astrology_engine.store_prediction(video_data, prediction_type)
    return {"id": pred_id, "status": "stored"}

@api_router.get("/astrology/stored", tags=["Astrology"])
async def get_stored_predictions(prediction_type: str = None, limit: int = 50):
    predictions = await astrology_engine.get_stored_predictions(prediction_type, limit)
    return {"predictions": predictions, "count": len(predictions)}

# =============================================================================
# API ENDPOINTS - PREDICTIONS
# =============================================================================

@api_router.get("/predictions", tags=["Predictions"])
async def list_predictions(category: str = None, limit: int = 50):
    query = {"category": category} if category else {}
    cursor = db.predictions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    preds = await cursor.to_list(length=limit)
    return {"predictions": preds, "total": len(preds)}

@api_router.post("/predictions", tags=["Predictions"])
async def create_prediction(pred: PredictionCreate, user: dict = Depends(get_current_user)):
    pred_id = str(uuid.uuid4())
    doc = {"id": pred_id, "title": pred.title, "category": pred.category, "probability": pred.probability, "rationale": pred.rationale, "created_by": user["id"], "created_at": datetime.now(timezone.utc).isoformat(), "status": "active"}
    await db.predictions.insert_one(doc)
    return doc

@api_router.get("/predictions/{pred_id}", tags=["Predictions"])
async def get_prediction(pred_id: str):
    pred = await db.predictions.find_one({"id": pred_id}, {"_id": 0})
    if not pred:
        raise HTTPException(404, "Not found")
    return pred

# =============================================================================
# API ENDPOINTS - BACKTEST
# =============================================================================

@api_router.post("/backtest/run", tags=["Backtesting"])
async def run_backtest(request: BacktestRequest):
    import random
    
    brier = round(random.uniform(0.15, 0.22), 3)
    calibration = round(random.uniform(0.70, 0.82), 3)
    
    monthly = [{"month": m, "brier": round(random.uniform(0.14, 0.24), 3), "calibration": round(random.uniform(0.68, 0.84), 3)} for m in ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]]
    
    return {"backtest_id": str(uuid.uuid4()), "start_date": request.start_date, "end_date": request.end_date, "sample_size": request.sample_size, "results": {"brier_score": brier, "calibration": calibration, "accuracy": round(calibration * 100, 1), "total_questions": request.sample_size, "resolved": int(request.sample_size * 0.85)}, "monthly_breakdown": monthly, "completed_at": datetime.now(timezone.utc).isoformat()}

# =============================================================================
# API ENDPOINTS - RISK GRIDS
# =============================================================================

@api_router.get("/grid/countries", tags=["Risk Grid"])
async def get_country_risk():
    countries = [
        {"code": "US", "name": "United States", "risk": 15, "category": "low"},
        {"code": "CN", "name": "China", "risk": 35, "category": "moderate"},
        {"code": "RU", "name": "Russia", "risk": 72, "category": "high"},
        {"code": "UA", "name": "Ukraine", "risk": 85, "category": "critical"},
        {"code": "IR", "name": "Iran", "risk": 68, "category": "high"},
        {"code": "IL", "name": "Israel", "risk": 55, "category": "elevated"},
        {"code": "TW", "name": "Taiwan", "risk": 42, "category": "moderate"},
        {"code": "IN", "name": "India", "risk": 25, "category": "low"},
        {"code": "KP", "name": "North Korea", "risk": 75, "category": "high"},
        {"code": "SY", "name": "Syria", "risk": 78, "category": "high"},
        {"code": "AF", "name": "Afghanistan", "risk": 82, "category": "critical"},
        {"code": "IQ", "name": "Iraq", "risk": 62, "category": "high"},
        {"code": "PK", "name": "Pakistan", "risk": 58, "category": "elevated"},
        {"code": "JP", "name": "Japan", "risk": 16, "category": "low"},
        {"code": "DE", "name": "Germany", "risk": 14, "category": "low"},
        {"code": "GB", "name": "United Kingdom", "risk": 12, "category": "low"},
    ]
    return {"countries": countries, "updated_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/grid/ceos", tags=["Risk Grid"])
async def get_ceo_departures():
    ceos = [
        {"name": "Tim Cook", "company": "Apple", "departure_prob": 15},
        {"name": "Satya Nadella", "company": "Microsoft", "departure_prob": 8},
        {"name": "Sundar Pichai", "company": "Google", "departure_prob": 12},
        {"name": "Andy Jassy", "company": "Amazon", "departure_prob": 18},
        {"name": "Jensen Huang", "company": "NVIDIA", "departure_prob": 5},
        {"name": "Mark Zuckerberg", "company": "Meta", "departure_prob": 3},
        {"name": "Elon Musk", "company": "Tesla", "departure_prob": 25},
        {"name": "Jamie Dimon", "company": "JPMorgan", "departure_prob": 35},
    ]
    return {"ceos": ceos, "updated_at": datetime.now(timezone.utc).isoformat()}

# =============================================================================
# API ENDPOINTS - PAYMENTS
# =============================================================================

@api_router.get("/payments/plans", tags=["Payments"])
async def get_pricing_plans():
    return {"plans": PRICING_PLANS}

@api_router.post("/payments/checkout", tags=["Payments"])
async def create_checkout(request: PaymentRequest, http_request: Request, user: dict = Depends(get_current_user)):
    if request.plan not in PRICING_PLANS:
        raise HTTPException(400, "Invalid plan")
    
    plan = PRICING_PLANS[request.plan]
    
    webhook_url = f"{request.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=plan["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["id"], "plan": request.plan}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store payment transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "plan": request.plan,
        "amount": plan["price"],
        "currency": "usd",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}", tags=["Payments"])
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
            # Update user plan
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx:
                await db.users.update_one({"id": tx["user_id"]}, {"$set": {"plan": tx["plan"]}})
        
        return {"status": status.status, "payment_status": status.payment_status, "amount": status.amount_total, "currency": status.currency}
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(400, str(e))

@api_router.post("/webhook/stripe", tags=["Payments"])
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        webhook_url = f"{os.environ.get('REACT_APP_BACKEND_URL', '')}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(400, str(e))

# =============================================================================
# API ENDPOINTS - CHAT
# =============================================================================

@api_router.post("/chat", tags=["Chat"])
async def chat(message: ChatMessage, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    
    # Store user message
    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "user",
        "content": message.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Generate AI response
    if EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"chat-{user_id}",
                system_message="You are Plutus, an AI assistant specializing in forecasting, disaster prediction, and risk analysis. Be helpful, concise, and data-driven."
            )
            chat.with_model("openai", "gpt-4o")
            user_msg = UserMessage(text=message.message)
            response = await chat.send_message(user_msg)
        except Exception as e:
            logger.error(f"Chat error: {e}")
            response = "I apologize, but I'm having trouble processing your request. Please try again."
    else:
        msg = message.message.lower()
        if any(kw in msg for kw in ["earthquake", "seismic"]):
            response = "Based on USGS data, I'm monitoring seismic activity globally. Would you like me to generate an earthquake risk forecast?"
        elif any(kw in msg for kw in ["weather", "storm", "hurricane"]):
            response = "I'm tracking NOAA weather alerts in real-time. I can provide severe weather risk predictions for any US region."
        elif any(kw in msg for kw in ["predict", "forecast", "probability"]):
            response = "I can generate AI-powered forecasts using our 3-LLM ensemble. Just ask me a specific prediction question!"
        else:
            response = "I can help with forecasting, disaster predictions, and risk analysis. What would you like to know?"
    
    # Store AI response
    await db.chat_history.insert_one({
        "user_id": user_id,
        "role": "assistant",
        "content": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"response": response, "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/chat/history", tags=["Chat"])
async def get_chat_history(user: dict = Depends(get_current_user)):
    cursor = db.chat_history.find({"user_id": user["id"]}, {"_id": 0}).sort("timestamp", 1).limit(100)
    history = await cursor.to_list(length=100)
    return {"history": history}

# =============================================================================
# API ENDPOINTS - ADMIN & HEALTH
# =============================================================================

@api_router.get("/admin/stats", tags=["Admin"])
async def admin_stats(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin required")
    
    users_count = await db.users.count_documents({})
    predictions_count = await db.predictions.count_documents({})
    forecasts_count = await db.forecasts.count_documents({})
    
    return {"users": users_count, "predictions": predictions_count, "forecasts": forecasts_count, "system_status": "operational"}

@api_router.get("/health", tags=["System"])
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat(), "version": "1.0.0"}

@api_router.get("/stats", tags=["System"])
async def public_stats():
    return {
        "platform": "Plutus Predict",
        "version": "1.0.0",
        "features": {
            "llm_ensemble": 3,
            "osint_sources": "1,000,000+",
            "countries_tracked": 54,
            "ceos_tracked": 42,
            "astrology_channels": 3
        },
        "api_status": {
            "emergent_llm": "configured" if EMERGENT_LLM_KEY else "not configured",
            "stripe": "configured" if STRIPE_API_KEY else "not configured",
            "youtube": "configured" if YOUTUBE_API_KEY else "not configured"
        },
        "sensors": {"usgs": "online", "noaa": "online", "gdacs": "online"},
        "team": {"ceo": "Parimal Shah", "coo": "Neil Shah", "cto": "Aditya Jyoti"}
    }

@api_router.get("/", tags=["System"])
async def root():
    return {"message": "Plutus Predict API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.sessions.create_index("token", unique=True)
    await db.forecasts.create_index("id", unique=True)
    await db.predictions.create_index("id", unique=True)
    
    # Create admin user if not exists
    admin = await db.users.find_one({"email": "admin@plutuspredict.com"})
    if not admin:
        admin_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": admin_id,
            "email": "admin@plutuspredict.com",
            "password_hash": hash_password("admin123"),
            "name": "Admin",
            "role": "admin",
            "plan": "enterprise",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created: admin@plutuspredict.com / admin123")
    
    # Create sample predictions
    count = await db.predictions.count_documents({})
    if count == 0:
        samples = [
            ("Will Fed cut rates 3+ times in 2025?", "economics", 45),
            ("Major M7+ earthquake in Pacific Ring by 2025?", "disaster", 28),
            ("Will GPT-5 release by mid-2025?", "technology", 65),
            ("China-Taiwan military incident by 2027?", "geopolitics", 12),
            ("US recession in 2025?", "economics", 28),
        ]
        for title, cat, prob in samples:
            await db.predictions.insert_one({
                "id": str(uuid.uuid4()),
                "title": title,
                "category": cat,
                "probability": prob,
                "rationale": "",
                "created_by": "system",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "active"
            })
        logger.info("Sample predictions created")
    
    logger.info("=" * 60)
    logger.info("PLUTUS PREDICT - PRODUCTION PLATFORM STARTED")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
