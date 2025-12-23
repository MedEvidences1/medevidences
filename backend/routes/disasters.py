"""
Disaster Routes for Plutus Predict
Extracted from server.py for better code organization
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/disasters", tags=["Disasters"])

# Note: This file contains route definitions.
# The actual implementation remains in server.py until full migration.
# Routes are gradually being moved here for better organization.

# Example route structure (actual routes still in server.py):
# @router.get("/earthquakes")
# async def get_earthquakes(min_magnitude: float = 2.5, limit: int = 50):
#     return await disaster_engine.get_earthquakes(min_magnitude, limit)
