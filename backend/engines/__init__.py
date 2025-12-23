"""
Plutus Predict Engine Modules

This package contains the core engine classes for the Plutus Predict platform.
Each engine handles a specific domain of functionality.

Engines:
- JudgmentalForecastEngine: AI-powered judgmental forecasting with multi-LLM ensemble
- DisasterPredictionEngine: Real-time disaster prediction and monitoring
- ComprehensiveDisasterEngine: Extended disaster analysis with satellite/IoT data
- AviationTurbulenceSystem: Real-time aircraft turbulence forecasting
- VedicAstrologyEngine: Vedic astrology predictions and analysis
- SpaceHazardsEngine: Space weather and asteroid monitoring
- OSINTAggregator: OSINT data aggregation from 1M+ sources
- TournamentSystem: Public prediction tournament validation

Note: Engines are currently defined in server.py and will be gradually 
migrated to this package for better code organization.
"""

# Engine imports will be added as they are migrated
# from .forecasting import JudgmentalForecastEngine
# from .disasters import DisasterPredictionEngine, ComprehensiveDisasterEngine
# from .aviation import AviationTurbulenceSystem
# from .astrology import VedicAstrologyEngine
# from .space import SpaceHazardsEngine
# from .osint import OSINTAggregator
# from .tournament import TournamentSystem

__all__ = [
    'JudgmentalForecastEngine',
    'DisasterPredictionEngine', 
    'ComprehensiveDisasterEngine',
    'AviationTurbulenceSystem',
    'VedicAstrologyEngine',
    'SpaceHazardsEngine',
    'OSINTAggregator',
    'TournamentSystem'
]
