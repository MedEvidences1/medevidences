"""
Route modules for Plutus Predict API
Gradually migrating routes from server.py to modular files.
"""
from .auth import router as auth_router
from .disasters import router as disasters_router
from .investment import router as investment_router
from .astrology import router as astrology_router
from .forecasting import router as forecasting_router
from .aviation import router as aviation_router

__all__ = [
    'auth_router',
    'disasters_router', 
    'investment_router',
    'astrology_router',
    'forecasting_router',
    'aviation_router'
]
