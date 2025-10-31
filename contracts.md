# Gut Microbiome Score Calculator - Backend Integration Contracts

## API Contracts

### 1. POST /api/calculate
**Purpose**: Calculate gut microbiome score and save to database

**Request Body**:
```json
{
  "fiber": "little" | "medium" | "much",
  "fatType": "saturated" | "unsaturated",
  "fruits": "0-1" | "2-3" | ">3",
  "vegetables": "0-1" | "2-3" | ">3",
  "sugar": "low" | "medium" | "high",
  "processedFood": "barely" | "few" | "everyday",
  "fermentedFood": "barely" | "few" | "everyday",
  "nsaids": "special" | "monthly" | "daily",
  "alcohol": "none" | "monthly" | "weekly",
  "water": "low" | "medium" | "high",
  "activity": "none" | "few" | "everyday",
  "goodSleep": boolean,
  "stressed": boolean,
  "smoker": boolean,
  "antibiotics": boolean,
  "probiotics": boolean
}
```

**Response**:
```json
{
  "id": "uuid",
  "totalScore": 75,
  "dietScore": 80,
  "lifestyleScore": 70,
  "medicationScore": 75,
  "recommendations": [...],
  "timestamp": "2025-01-31T10:00:00Z"
}
```

### 2. GET /api/results/{id}
**Purpose**: Get a saved calculation result

**Response**: Same as POST /api/calculate

### 3. GET /api/results
**Purpose**: Get all saved results (optional - for history feature)

**Response**: Array of calculation results

### 4. GET /api/share/{id}
**Purpose**: Generate shareable link for a result

**Response**:
```json
{
  "shareUrl": "https://app.com/shared/abc123",
  "shareId": "abc123"
}
```

## Data to Replace from Mock

Currently in `mockData.js`:
- `calculateGutScore()` function - scoring logic will move to backend
- `generateRecommendations()` function - recommendation logic will move to backend
- `educationalContent` - will remain frontend-only (static content)

## Database Schema

### Collection: `gut_assessments`
```python
{
  "id": str (uuid),
  "formData": {
    "fiber": str,
    "fatType": str,
    "fruits": str,
    "vegetables": str,
    "sugar": str,
    "processedFood": str,
    "fermentedFood": str,
    "nsaids": str,
    "alcohol": str,
    "water": str,
    "activity": str,
    "goodSleep": bool,
    "stressed": bool,
    "smoker": bool,
    "antibiotics": bool,
    "probiotics": bool
  },
  "results": {
    "totalScore": int,
    "dietScore": int,
    "lifestyleScore": int,
    "medicationScore": int,
    "recommendations": [
      {
        "category": str,
        "issue": str,
        "suggestion": str,
        "priority": str
      }
    ]
  },
  "timestamp": datetime,
  "shareId": str (optional),
  "ipAddress": str (optional for tracking)
}
```

## Backend Implementation Plan

1. **Create scoring module** (`/backend/scoring.py`):
   - Port `calculateGutScore()` logic from mockData.js
   - Port `generateRecommendations()` logic
   - Ensure identical scoring algorithm

2. **Create API endpoints** (in `/backend/server.py`):
   - POST /api/calculate - Calculate and save
   - GET /api/results/{id} - Retrieve saved result
   - GET /api/share/{id} - Generate share link

3. **Database models** (in `/backend/models.py`):
   - GutAssessment model matching schema above
   - Methods for save, retrieve, update

4. **Frontend Integration**:
   - Update `CalculatorPage.jsx`:
     - Replace mock `calculateGutScore()` with API call to POST /api/calculate
     - Update handleSave() to save to backend
   - Update `ResultsDisplay.jsx`:
     - Implement actual save functionality
     - Implement share link generation
   - Add loading states and error handling

## Scoring Algorithm (Backend Implementation)

The scoring system assigns points based on:

**Positive Factors** (increase score):
- High fiber intake (10 pts)
- Unsaturated fats (10 pts)
- High fruit intake (8 pts)
- High vegetable intake (8 pts)
- Low sugar (8 pts)
- Minimal processed foods (7 pts)
- Regular fermented foods (7 pts)
- Good hydration (8 pts)
- Regular exercise (8 pts)
- Good sleep (6 pts)
- Low stress (4 pts)
- Non-smoker (4 pts)
- Minimal NSAIDs (6 pts)
- No/minimal alcohol (6 pts)
- Minimal antibiotics (3 pts)
- Probiotic use (3 pts)

**Maximum Score**: 100 points

## Share Feature Implementation

1. Generate unique shareId on save
2. Create public endpoint GET /shared/{shareId} for viewing results
3. Implement copy-to-clipboard functionality
4. Optional: Add social media share buttons
