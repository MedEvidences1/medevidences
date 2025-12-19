# Plutus Predict - Requirements Document

## Original Problem Statement
Build Plutus Predict - an AI Forecasting & Disaster Prediction Platform with:
- 5-LLM Ensemble Forecasting (implemented with 3 via Emergent: GPT-4, Claude, Gemini)
- 1M+ OSINT Sources (GDELT, USGS, NOAA, Semantic Scholar, GDACS)
- Real-time Disaster Prediction (earthquakes, weather, global disasters)
- Vedic Astrology YouTube Integration
- Bayesian Probability Aggregation
- Stripe Payment Integration
- User Authentication & Admin Dashboard
- Dark professional "Void Terminal" theme

## Architecture - Tasks Completed

### Backend (FastAPI + MongoDB)
- ✅ User authentication (register/login/logout)
- ✅ 3-LLM Ensemble forecasting (GPT-4, Claude, Gemini via Emergent)
- ✅ Bayesian log-pooling aggregation for forecasts
- ✅ OSINT Aggregator (1M+ sources):
  - GDELT (250K+ news sources)
  - Semantic Scholar (200M+ papers)
  - USGS (live earthquake data)
  - NOAA (live weather alerts)
  - GDACS (global disasters)
- ✅ Disaster Prediction Engine
- ✅ Vedic Astrology YouTube integration
- ✅ Country risk grid (16 countries)
- ✅ CEO departure probability grid
- ✅ Backtest simulation engine
- ✅ Chat with AI assistant
- ✅ Stripe payment integration
- ✅ MongoDB persistence

### Frontend (React + Shadcn UI)
- ✅ Dark "Void Terminal" theme (Bloomberg-style)
- ✅ Dashboard with live stats
- ✅ AI Forecast generator
- ✅ Disaster monitoring (earthquakes, weather, global)
- ✅ OSINT search
- ✅ Astrology channels & video search
- ✅ Backtest engine with charts (Recharts)
- ✅ Risk grids (countries, CEOs)
- ✅ Chat interface
- ✅ Authentication modal
- ✅ Responsive navigation

## Next Action Items

### Phase 2 - Enhancements
1. **YouTube API Integration**: Add your YouTube Data API key to enable live video search
2. **Stripe Live Keys**: Replace test keys with production Stripe keys
3. **Astrology Retrieval System**: Store and track astrology predictions for accuracy verification
4. **Daily Updates Scheduler**: Background jobs for daily disaster/war prediction updates
5. **Interactive Globe**: Add 3D globe visualization for disaster mapping
6. **Notification System**: Email/push alerts for high-risk events
7. **Multi-language Support**: Add internationalization

### Phase 3 - Advanced Features
1. Historical prediction accuracy tracking
2. Custom alert thresholds per user
3. API rate limiting and usage analytics
4. Export forecasts to PDF/CSV
5. Collaborative predictions (wisdom of crowds)

## Credentials
- Admin: admin@plutuspredict.com / admin123
- Emergent LLM Key: Configured in backend/.env
- Stripe Test Key: Pre-configured

## Tech Stack
- Backend: FastAPI, MongoDB, Emergent Integrations
- Frontend: React, Shadcn UI, Recharts, Tailwind CSS
- APIs: USGS, NOAA, GDELT, Semantic Scholar, GDACS
