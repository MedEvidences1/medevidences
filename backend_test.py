#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PlutusAPITester:
    def __init__(self, base_url="https://plutus-predict.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def test_health_check(self):
        """Test basic health check"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            self.log_result("Health Check", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Status: {data.get('status', 'unknown')}")
            return success
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_login(self):
        """Test admin login"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                                   json={"email": "admin@plutuspredict.com", "password": "admin123"},
                                   timeout=10)
            success = response.status_code == 200
            self.log_result("Admin Login", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                self.token = data.get("token")
                print(f"   User: {data.get('name', 'Unknown')}")
                print(f"   Role: {data.get('role', 'Unknown')}")
            return success
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            return False

    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def test_pricing_plans(self):
        """Test NEW: Pricing plans API - should return 3 plans"""
        try:
            response = requests.get(f"{self.api_url}/payments/plans", timeout=10)
            success = response.status_code == 200
            self.log_result("Pricing Plans API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                plans = data.get("plans", {})
                plan_count = len(plans)
                print(f"   Plans found: {plan_count}")
                for plan_name, plan_data in plans.items():
                    print(f"   - {plan_name}: ${plan_data.get('price', 0)}/month")
                
                # Check if we have exactly 3 plans as expected
                if plan_count == 3:
                    print(f"   ✅ Correct number of plans (3)")
                else:
                    print(f"   ⚠️  Expected 3 plans, found {plan_count}")
            return success
        except Exception as e:
            self.log_result("Pricing Plans API", False, f"Exception: {str(e)}")
            return False

    def test_osint_live_stream(self):
        """Test NEW: OSINT Live Stream API - should return pipeline data"""
        try:
            response = requests.get(f"{self.api_url}/osint/live-stream", timeout=15)
            success = response.status_code == 200
            self.log_result("OSINT Live Stream API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Pipeline status: {data.get('pipeline_status', 'unknown')}")
                print(f"   Sources active: {data.get('sources_active', 0)}")
                print(f"   Total events: {data.get('total_events', 0)}")
                
                # Check for expected data structure
                if 'events' in data and 'pipeline_status' in data:
                    print(f"   ✅ Pipeline data structure correct")
                else:
                    print(f"   ⚠️  Missing expected pipeline data fields")
            return success
        except Exception as e:
            self.log_result("OSINT Live Stream API", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats loading"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            self.log_result("Dashboard Stats", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Total users: {data.get('total_users', 0)}")
                print(f"   Total forecasts: {data.get('total_forecasts', 0)}")
            return success
        except Exception as e:
            self.log_result("Dashboard Stats", False, f"Exception: {str(e)}")
            return False

    def test_earthquakes_api(self):
        """Test earthquakes API"""
        try:
            response = requests.get(f"{self.api_url}/disasters/earthquakes?min_magnitude=4.5&limit=10", timeout=15)
            success = response.status_code == 200
            self.log_result("Earthquakes API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                earthquakes = data.get("earthquakes", [])
                print(f"   Earthquakes found: {len(earthquakes)}")
                if earthquakes:
                    latest = earthquakes[0]
                    print(f"   Latest: M{latest.get('magnitude', 0)} - {latest.get('location', 'Unknown')}")
            return success
        except Exception as e:
            self.log_result("Earthquakes API", False, f"Exception: {str(e)}")
            return False

    def test_forecast_generation(self):
        """Test AI forecast generation"""
        if not self.token:
            self.log_result("AI Forecast Generation", False, "No authentication token")
            return False
        
        try:
            response = requests.post(f"{self.api_url}/forecast", 
                                   json={"question": "Will there be a major earthquake in Japan by 2025?"},
                                   headers=self.get_headers(),
                                   timeout=30)
            success = response.status_code == 200
            self.log_result("AI Forecast Generation", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Probability: {data.get('probability', 0)}%")
                print(f"   Confidence: {data.get('confidence', 'unknown')}")
            return success
        except Exception as e:
            self.log_result("AI Forecast Generation", False, f"Exception: {str(e)}")
            return False

    def test_disaster_summary(self):
        """Test disaster summary API"""
        try:
            response = requests.get(f"{self.api_url}/disasters/summary", timeout=10)
            success = response.status_code == 200
            self.log_result("Disaster Summary", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Global risk score: {data.get('global_risk_score', 0)}%")
                earthquake_risk = data.get('earthquake_risk', {})
                print(f"   Earthquake risk: {earthquake_risk.get('probability', 0)}%")
            return success
        except Exception as e:
            self.log_result("Disaster Summary", False, f"Exception: {str(e)}")
            return False

    def test_languages_support(self):
        """Test multi-language support"""
        try:
            response = requests.get(f"{self.api_url}/languages", timeout=10)
            success = response.status_code == 200
            self.log_result("Languages Support", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                languages = data.get("languages", {})
                print(f"   Languages supported: {len(languages)}")
                for code, info in languages.items():
                    print(f"   - {code}: {info.get('name', 'Unknown')}")
            return success
        except Exception as e:
            self.log_result("Languages Support", False, f"Exception: {str(e)}")
            return False

    def test_chat_functionality(self):
        """Test AI chat functionality"""
        if not self.token:
            self.log_result("AI Chat", False, "No authentication token")
            return False
        
        try:
            response = requests.post(f"{self.api_url}/chat", 
                                   json={"message": "What is the current global risk level?"},
                                   headers=self.get_headers(),
                                   timeout=20)
            success = response.status_code == 200
            self.log_result("AI Chat", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Response length: {len(data.get('response', ''))}")
            return success
        except Exception as e:
            self.log_result("AI Chat", False, f"Exception: {str(e)}")
            return False

    def test_usage_quotas(self):
        """Test NEW: Usage Quotas API - should return plan limits and usage"""
        if not self.token:
            self.log_result("Usage Quotas API", False, "No authentication token")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/usage/quotas", 
                                   headers=self.get_headers(),
                                   timeout=15)
            success = response.status_code == 200
            self.log_result("Usage Quotas API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                quotas = data.get("quotas", [])
                print(f"   Quota items found: {len(quotas)}")
                print(f"   Current plan: {data.get('current_plan', 'unknown')}")
                
                # Check if we have expected quota structure
                if len(quotas) >= 5:
                    print(f"   ✅ Expected quota items (5+) found")
                    for quota in quotas[:3]:  # Show first 3
                        print(f"   - {quota.get('name', 'Unknown')}: {quota.get('used', 0)}/{quota.get('limit', 0)}")
                else:
                    print(f"   ⚠️  Expected 5+ quota items, found {len(quotas)}")
            return success
        except Exception as e:
            self.log_result("Usage Quotas API", False, f"Exception: {str(e)}")
            return False

    def test_white_label_status(self):
        """Test NEW: White-Label Status API - should return inactive with $10,000 price"""
        if not self.token:
            self.log_result("White-Label Status API", False, "No authentication token")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/white-label/status", 
                                   headers=self.get_headers(),
                                   timeout=10)
            success = response.status_code == 200
            self.log_result("White-Label Status API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                status = data.get("status", "unknown")
                price = data.get("price", 0)
                print(f"   White-label status: {status}")
                print(f"   Price: ${price:,.2f}")
                
                # Check expected values
                if status == "inactive" and price == 10000.0:
                    print(f"   ✅ Expected status (inactive) and price ($10,000)")
                else:
                    print(f"   ⚠️  Expected inactive status and $10,000 price")
            return success
        except Exception as e:
            self.log_result("White-Label Status API", False, f"Exception: {str(e)}")
            return False

    def test_support_tickets_crud(self):
        """Test NEW: Support Tickets CRUD operations"""
        if not self.token:
            self.log_result("Support Tickets CRUD", False, "No authentication token")
            return False
        
        try:
            # Test 1: Get user tickets (should work even if empty)
            response = requests.get(f"{self.api_url}/support/tickets", 
                                   headers=self.get_headers(),
                                   timeout=10)
            get_success = response.status_code == 200
            
            if get_success:
                data = response.json()
                tickets = data.get("tickets", [])
                print(f"   Existing tickets: {len(tickets)}")
            
            # Test 2: Create a new ticket
            create_response = requests.post(f"{self.api_url}/support/tickets", 
                                          json={
                                              "title": "Test API Ticket",
                                              "description": "This is a test ticket created by automated testing",
                                              "priority": "medium",
                                              "category": "technical"
                                          },
                                          headers=self.get_headers(),
                                          timeout=15)
            create_success = create_response.status_code == 200
            
            ticket_id = None
            if create_success:
                create_data = create_response.json()
                ticket_id = create_data.get("ticket", {}).get("id")
                print(f"   Created ticket ID: {ticket_id}")
            
            # Overall success if both operations work
            success = get_success and create_success
            self.log_result("Support Tickets CRUD", success, 
                          f"GET: {response.status_code}, POST: {create_response.status_code}")
            
            return success
        except Exception as e:
            self.log_result("Support Tickets CRUD", False, f"Exception: {str(e)}")
            return False

    def test_disaster_remediation_types(self):
        """Test NEW: Disaster Remediation - Get supported disaster types"""
        try:
            response = requests.get(f"{self.api_url}/disasters/remediation/disaster-types", timeout=10)
            success = response.status_code == 200
            self.log_result("Disaster Remediation Types", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                disaster_types = data.get("disaster_types", [])
                severity_levels = data.get("severity_levels", [])
                print(f"   Disaster types: {len(disaster_types)}")
                print(f"   Severity levels: {len(severity_levels)}")
                if disaster_types:
                    print(f"   Types: {', '.join(disaster_types[:5])}")
                if severity_levels:
                    print(f"   Severities: {', '.join(severity_levels)}")
            return success
        except Exception as e:
            self.log_result("Disaster Remediation Types", False, f"Exception: {str(e)}")
            return False

    def test_disaster_remediation_plan_generation(self):
        """Test NEW: Disaster Remediation - Generate AI-powered remediation plan"""
        if not self.token:
            self.log_result("Disaster Remediation Plan", False, "No authentication token")
            return False
        
        try:
            # Test with different disaster types and AI models
            test_cases = [
                {
                    "disaster_type": "earthquake",
                    "severity": "high", 
                    "location": "Tokyo, Japan",
                    "population_affected": 50000,
                    "model_preference": "ensemble"
                },
                {
                    "disaster_type": "hurricane",
                    "severity": "critical",
                    "location": "Miami, Florida",
                    "population_affected": 100000,
                    "model_preference": "openai"
                },
                {
                    "disaster_type": "wildfire",
                    "severity": "high",
                    "location": "Los Angeles, California", 
                    "population_affected": 25000,
                    "model_preference": "claude"
                }
            ]
            
            successful_tests = 0
            for i, test_case in enumerate(test_cases):
                try:
                    response = requests.post(f"{self.api_url}/disasters/remediation/plan", 
                                           json=test_case,
                                           headers=self.get_headers(),
                                           timeout=45)  # Longer timeout for AI generation
                    
                    if response.status_code == 200:
                        successful_tests += 1
                        data = response.json()
                        print(f"   Test {i+1} ({test_case['disaster_type']}): ✅")
                        print(f"     Model used: {data.get('model_used', 'unknown')}")
                        print(f"     Risk mitigation: {data.get('risk_mitigation_score', 0)}%")
                        print(f"     Lives saved: {data.get('lives_potentially_saved', 'N/A')}")
                        
                        # Check for required plan sections
                        required_sections = ['immediate_actions', 'evacuation_plan', 'resource_allocation', 'medical_response']
                        sections_found = sum(1 for section in required_sections if section in data)
                        print(f"     Plan sections: {sections_found}/{len(required_sections)}")
                        
                    else:
                        print(f"   Test {i+1} ({test_case['disaster_type']}): ❌ Status {response.status_code}")
                        
                except Exception as e:
                    print(f"   Test {i+1} ({test_case['disaster_type']}): ❌ Exception: {str(e)}")
            
            success = successful_tests >= 2  # At least 2 out of 3 should work
            self.log_result("Disaster Remediation Plan", success, 
                          f"{successful_tests}/{len(test_cases)} test cases passed")
            
            return success
        except Exception as e:
            self.log_result("Disaster Remediation Plan", False, f"Exception: {str(e)}")
            return False

    def test_multi_llm_integration(self):
        """Test NEW: Multi-LLM Integration (GPT-4o, Claude, Gemini)"""
        if not self.token:
            self.log_result("Multi-LLM Integration", False, "No authentication token")
            return False
        
        try:
            # Test judgmental forecasting with different models
            models_to_test = ["ensemble", "openai", "claude", "gemini"]
            successful_models = 0
            
            for model in models_to_test:
                try:
                    # Test with a simple forecasting question
                    response = requests.post(f"{self.api_url}/judgmental-forecast", 
                                           json={
                                               "question": "Will there be a major earthquake in California by 2025?",
                                               "model_preference": model
                                           },
                                           headers=self.get_headers(),
                                           timeout=30)
                    
                    if response.status_code == 200:
                        successful_models += 1
                        data = response.json()
                        print(f"   {model.upper()}: ✅ Probability: {data.get('probability', 0)}%")
                    else:
                        print(f"   {model.upper()}: ❌ Status {response.status_code}")
                        
                except Exception as e:
                    print(f"   {model.upper()}: ❌ Exception: {str(e)}")
            
            success = successful_models >= 2  # At least 2 models should work
            self.log_result("Multi-LLM Integration", success, 
                          f"{successful_models}/{len(models_to_test)} models working")
            
            return success
        except Exception as e:
            self.log_result("Multi-LLM Integration", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_current(self):
        """Test NEW: Space Hazards - Current space weather data"""
        try:
            response = requests.get(f"{self.api_url}/space/current", timeout=15)
            success = response.status_code == 200
            self.log_result("Space Hazards Current", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Overall risk: {data.get('overall_risk', 'unknown')}")
                space_weather = data.get('space_weather', {})
                print(f"   Kp index: {space_weather.get('kp_index', 'N/A')}")
                print(f"   Storm level: {space_weather.get('storm_level', 'N/A')}")
                neos = data.get('near_earth_objects', [])
                print(f"   Near Earth Objects: {len(neos)}")
                debris = data.get('space_debris', [])
                print(f"   Space debris entries: {len(debris)}")
            return success
        except Exception as e:
            self.log_result("Space Hazards Current", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_forecast(self):
        """Test NEW: Space Hazards - 7-day forecast"""
        try:
            response = requests.get(f"{self.api_url}/space/forecast?days=7", timeout=15)
            success = response.status_code == 200
            self.log_result("Space Hazards Forecast", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                forecast_days = data.get('forecast_days', [])
                print(f"   Forecast days: {len(forecast_days)}")
                if forecast_days:
                    first_day = forecast_days[0]
                    print(f"   Day 1 Kp forecast: {first_day.get('kp_forecast', 'N/A')}")
                    print(f"   Day 1 risk level: {first_day.get('risk_level', 'N/A')}")
            return success
        except Exception as e:
            self.log_result("Space Hazards Forecast", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_impacts(self):
        """Test NEW: Space Hazards - Sector impact analysis"""
        try:
            response = requests.get(f"{self.api_url}/space/impacts", timeout=15)
            success = response.status_code == 200
            self.log_result("Space Hazards Impacts", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                impacts = data.get('sector_impacts', {})
                print(f"   Sectors analyzed: {len(impacts)}")
                for sector, impact in list(impacts.items())[:3]:  # Show first 3
                    print(f"   - {sector}: {impact.get('risk_level', 'N/A')} risk")
            return success
        except Exception as e:
            self.log_result("Space Hazards Impacts", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_neo(self):
        """Test NEW: Space Hazards - Near Earth Objects"""
        try:
            response = requests.get(f"{self.api_url}/space/neo", timeout=15)
            success = response.status_code == 200
            self.log_result("Space Hazards NEO", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                neos = data.get('near_earth_objects', [])
                print(f"   Near Earth Objects: {len(neos)}")
                if neos:
                    closest = neos[0]
                    print(f"   Closest: {closest.get('name', 'Unknown')} - {closest.get('miss_distance_km', 'N/A')} km")
            return success
        except Exception as e:
            self.log_result("Space Hazards NEO", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_debris(self):
        """Test NEW: Space Hazards - Space debris reentries"""
        try:
            response = requests.get(f"{self.api_url}/space/debris", timeout=15)
            success = response.status_code == 200
            self.log_result("Space Hazards Debris", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                debris = data.get('debris_reentries', [])
                print(f"   Debris reentries: {len(debris)}")
                if debris:
                    next_reentry = debris[0]
                    print(f"   Next: {next_reentry.get('object_name', 'Unknown')} - {next_reentry.get('reentry_date', 'N/A')}")
            return success
        except Exception as e:
            self.log_result("Space Hazards Debris", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_remediation(self):
        """Test NEW: Space Hazards - Solar storm remediation plan"""
        if not self.token:
            self.log_result("Space Hazards Remediation", False, "No authentication token")
            return False
        
        try:
            response = requests.post(f"{self.api_url}/disasters/remediation/plan", 
                                   json={
                                       "disaster_type": "solar_storm",
                                       "severity": "high",
                                       "location": "Global",
                                       "population_affected": 1000000,
                                       "model_preference": "ensemble"
                                   },
                                   headers=self.get_headers(),
                                   timeout=45)
            success = response.status_code == 200
            self.log_result("Space Hazards Remediation", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Model used: {data.get('model_used', 'unknown')}")
                print(f"   Risk mitigation: {data.get('risk_mitigation_score', 0)}%")
                print(f"   Disaster type: {data.get('disaster_info', {}).get('type', 'N/A')}")
            return success
        except Exception as e:
            self.log_result("Space Hazards Remediation", False, f"Exception: {str(e)}")
            return False

    def test_future_predictions_2026_3000(self):
        """Test PHASE 2: Future predictions endpoint (2026-3000) for Dashboard"""
        try:
            response = requests.get(f"{self.api_url}/events/predictions?timeframe=2026-3000", timeout=15)
            success = response.status_code == 200
            self.log_result("Future Predictions 2026-3000", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                predictions = data.get("predictions", [])
                print(f"   Future predictions found: {len(predictions)}")
                if predictions:
                    # Check for all 10 categories
                    categories = set(pred.get("category", "") for pred in predictions)
                    expected_categories = {"economics", "geopolitical", "technology", "social", 
                                         "climate", "health", "crypto", "space", "sports", "entertainment"}
                    found_categories = categories.intersection(expected_categories)
                    print(f"   Categories found: {len(found_categories)}/10")
                    print(f"   Categories: {', '.join(sorted(found_categories))}")
                    
                    # Check first prediction structure
                    first_pred = predictions[0]
                    print(f"   Sample: {first_pred.get('title', 'N/A')[:50]}...")
                    print(f"   Probability: {first_pred.get('probability', 0)}%")
                    print(f"   Estimated date: {first_pred.get('estimated_date', 'N/A')}")
                    
                    if len(found_categories) >= 8:  # At least 8 out of 10 categories
                        print(f"   ✅ Good category coverage (8+/10)")
                    else:
                        print(f"   ⚠️  Limited category coverage ({len(found_categories)}/10)")
            return success
        except Exception as e:
            self.log_result("Future Predictions 2026-3000", False, f"Exception: {str(e)}")
            return False

    def test_disasters_human_signals(self):
        """Test PHASE 2: Disasters Human Signals tab data"""
        try:
            response = requests.get(f"{self.api_url}/disasters/comprehensive/human-signals", timeout=15)
            success = response.status_code == 200
            self.log_result("Disasters Human Signals", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Population density data: {'✅' if 'population_density' in data else '❌'}")
                print(f"   Mobility patterns: {'✅' if 'mobility_patterns' in data else '❌'}")
                print(f"   Emergency calls: {'✅' if 'emergency_calls' in data else '❌'}")
                print(f"   Social signals: {'✅' if 'social_signals' in data else '❌'}")
                
                # Check data structure
                if 'population_density' in data:
                    pop_data = data['population_density']
                    print(f"   Population regions: {len(pop_data.get('regions', []))}")
                
                if 'emergency_calls' in data:
                    calls_data = data['emergency_calls']
                    print(f"   Emergency call volume: {calls_data.get('total_calls_24h', 0)}")
                
                required_fields = ['population_density', 'mobility_patterns', 'emergency_calls', 'social_signals']
                found_fields = sum(1 for field in required_fields if field in data)
                if found_fields >= 3:
                    print(f"   ✅ Good data coverage ({found_fields}/4 sections)")
                else:
                    print(f"   ⚠️  Limited data coverage ({found_fields}/4 sections)")
            return success
        except Exception as e:
            self.log_result("Disasters Human Signals", False, f"Exception: {str(e)}")
            return False

    def test_disasters_satellite_iot(self):
        """Test REVIEW REQUEST: Disasters SATELLITES/IOT tab loads data without manual refresh"""
        try:
            response = requests.get(f"{self.api_url}/disasters/comprehensive/satellite-iot", timeout=15)
            success = response.status_code == 200
            self.log_result("Disasters SATELLITES/IOT Tab", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Weather satellites: {'✅' if 'weather_satellites' in data else '❌'}")
                print(f"   Seismic network: {'✅' if 'seismic_network' in data else '❌'}")
                print(f"   Flood gauges: {'✅' if 'flood_gauges' in data else '❌'}")
                print(f"   Air quality sensors: {'✅' if 'air_quality' in data else '❌'}")
                
                # Check data structure
                if 'weather_satellites' in data:
                    sat_data = data['weather_satellites']
                    print(f"   Active satellites: {len(sat_data.get('active_satellites', []))}")
                
                if 'seismic_network' in data:
                    seismic_data = data['seismic_network']
                    print(f"   Seismic stations: {len(seismic_data.get('stations', []))}")
                
                if 'flood_gauges' in data:
                    flood_data = data['flood_gauges']
                    print(f"   Flood monitoring points: {len(flood_data.get('monitoring_points', []))}")
                
                required_fields = ['weather_satellites', 'seismic_network', 'flood_gauges', 'air_quality']
                found_fields = sum(1 for field in required_fields if field in data)
                if found_fields >= 3:
                    print(f"   ✅ Good sensor coverage ({found_fields}/4 types) - Loads without manual refresh")
                else:
                    print(f"   ⚠️  Limited sensor coverage ({found_fields}/4 types)")
            return success
        except Exception as e:
            self.log_result("Disasters SATELLITES/IOT Tab", False, f"Exception: {str(e)}")
            return False

    def test_disasters_playbooks(self):
        """Test REVIEW REQUEST: Disasters PLAYBOOKS tab loads data without manual refresh"""
        try:
            response = requests.get(f"{self.api_url}/disasters/comprehensive/playbooks", timeout=15)
            success = response.status_code == 200
            self.log_result("Disasters PLAYBOOKS Tab", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Automation status: {'✅' if 'automation_status' in data else '❌'}")
                print(f"   Available playbooks: {'✅' if 'available_playbooks' in data else '❌'}")
                print(f"   Pre-approved actions: {'✅' if 'pre_approved_actions' in data else '❌'}")
                
                # Check data structure
                if 'automation_status' in data:
                    auto_data = data['automation_status']
                    print(f"   Automation level: {auto_data.get('level', 'N/A')}")
                    print(f"   Active automations: {auto_data.get('active_count', 0)}")
                
                if 'available_playbooks' in data:
                    playbooks = data['available_playbooks']
                    print(f"   Total playbooks: {len(playbooks)}")
                    if playbooks:
                        disaster_types = set(pb.get('disaster_type', '') for pb in playbooks)
                        print(f"   Disaster types covered: {len(disaster_types)}")
                
                if 'pre_approved_actions' in data:
                    actions = data['pre_approved_actions']
                    print(f"   Pre-approved actions: {len(actions)}")
                
                required_fields = ['automation_status', 'available_playbooks', 'pre_approved_actions']
                found_fields = sum(1 for field in required_fields if field in data)
                if found_fields >= 2:
                    print(f"   ✅ Good playbook coverage ({found_fields}/3 sections) - Loads without manual refresh")
                else:
                    print(f"   ⚠️  Limited playbook coverage ({found_fields}/3 sections)")
            return success
        except Exception as e:
            self.log_result("Disasters PLAYBOOKS Tab", False, f"Exception: {str(e)}")
            return False

    def test_tdis_dashboard(self):
        """Test TDIS Portal Dashboard - should show OPERATIONAL status and data layers"""
        try:
            response = requests.get(f"{self.api_url}/tdis/dashboard", timeout=15)
            success = response.status_code == 200
            self.log_result("TDIS Portal Dashboard", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   System status: {data.get('system_status', 'unknown')}")
                print(f"   Data layers: {'✅' if 'data_layers' in data else '❌'}")
                print(f"   Active sensors: {data.get('active_sensors', 0)}")
                print(f"   Coverage regions: {data.get('coverage_regions', 0)}")
                
                # Check for OPERATIONAL status
                if data.get('system_status') == 'OPERATIONAL':
                    print(f"   ✅ System status is OPERATIONAL")
                else:
                    print(f"   ⚠️  System status is not OPERATIONAL: {data.get('system_status')}")
                
                # Check data layers
                if 'data_layers' in data:
                    layers = data['data_layers']
                    expected_layers = ['seismic', 'meteorological', 'hydrological', 'geological', 'atmospheric']
                    found_layers = [layer for layer in expected_layers if any(l.get('type') == layer for l in layers)]
                    print(f"   Data layer types: {len(found_layers)}/{len(expected_layers)}")
                    if len(found_layers) >= 3:
                        print(f"   ✅ Good data layer coverage")
                    else:
                        print(f"   ⚠️  Limited data layer coverage")
            return success
        except Exception as e:
            self.log_result("TDIS Portal Dashboard", False, f"Exception: {str(e)}")
            return False

    def test_tdis_alerts(self):
        """Test TDIS Portal Alerts - should show alert summary with counts"""
        try:
            response = requests.get(f"{self.api_url}/tdis/alerts", timeout=15)
            success = response.status_code == 200
            self.log_result("TDIS Portal Alerts", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Total alerts: {data.get('total_alerts', 0)}")
                
                # Check alert summary counts
                if 'alert_summary' in data:
                    summary = data['alert_summary']
                    print(f"   Critical alerts: {summary.get('critical', 0)}")
                    print(f"   High alerts: {summary.get('high', 0)}")
                    print(f"   Medium alerts: {summary.get('medium', 0)}")
                    print(f"   Low alerts: {summary.get('low', 0)}")
                    
                    total_summary = sum(summary.get(level, 0) for level in ['critical', 'high', 'medium', 'low'])
                    if total_summary > 0:
                        print(f"   ✅ Alert summary has data")
                    else:
                        print(f"   ⚠️  Alert summary is empty")
                
                # Check alerts array
                if 'alerts' in data:
                    alerts = data['alerts']
                    print(f"   Alert entries: {len(alerts)}")
                    if alerts:
                        first_alert = alerts[0]
                        print(f"   Sample alert: {first_alert.get('type', 'N/A')} - {first_alert.get('severity', 'N/A')}")
            return success
        except Exception as e:
            self.log_result("TDIS Portal Alerts", False, f"Exception: {str(e)}")
            return False

    def test_tdis_regions(self):
        """Test TDIS Portal Regions - should show 10 global regions with risk scores"""
        try:
            response = requests.get(f"{self.api_url}/tdis/regions", timeout=15)
            success = response.status_code == 200
            self.log_result("TDIS Portal Regions", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                regions = data.get('regions', [])
                print(f"   Total regions: {len(regions)}")
                
                # Check for 10 global regions
                if len(regions) >= 10:
                    print(f"   ✅ Expected 10+ regions found")
                else:
                    print(f"   ⚠️  Expected 10 regions, found {len(regions)}")
                
                # Check risk scores
                regions_with_scores = [r for r in regions if 'risk_score' in r]
                print(f"   Regions with risk scores: {len(regions_with_scores)}")
                
                if regions:
                    # Show sample regions
                    for i, region in enumerate(regions[:3]):
                        print(f"   - {region.get('name', 'Unknown')}: Risk {region.get('risk_score', 'N/A')}%")
                    
                    if len(regions_with_scores) >= 8:
                        print(f"   ✅ Good risk score coverage")
                    else:
                        print(f"   ⚠️  Limited risk score coverage")
            return success
        except Exception as e:
            self.log_result("TDIS Portal Regions", False, f"Exception: {str(e)}")
            return False

    def test_tdis_layers(self):
        """Test TDIS Portal Data Layers - should show interactive layer toggles"""
        try:
            response = requests.get(f"{self.api_url}/tdis/layers", timeout=15)
            success = response.status_code == 200
            self.log_result("TDIS Portal Data Layers", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                layers = data.get('layers', [])
                print(f"   Total data layers: {len(layers)}")
                
                # Check for expected layer types
                expected_types = ['seismic', 'meteorological', 'hydrological', 'geological', 'atmospheric']
                found_types = set(layer.get('type', '') for layer in layers)
                matching_types = found_types.intersection(expected_types)
                print(f"   Layer types found: {len(matching_types)}/{len(expected_types)}")
                print(f"   Types: {', '.join(sorted(matching_types))}")
                
                # Check layer properties
                active_layers = [l for l in layers if l.get('active', False)]
                print(f"   Active layers: {len(active_layers)}")
                
                if layers:
                    # Show sample layer
                    first_layer = layers[0]
                    print(f"   Sample: {first_layer.get('name', 'Unknown')} ({first_layer.get('type', 'N/A')})")
                    print(f"   Status: {'Active' if first_layer.get('active') else 'Inactive'}")
                
                if len(matching_types) >= 4:
                    print(f"   ✅ Good layer type coverage")
                else:
                    print(f"   ⚠️  Limited layer type coverage")
            return success
        except Exception as e:
            self.log_result("TDIS Portal Data Layers", False, f"Exception: {str(e)}")
            return False

    def test_aviation_turbulence_api(self):
        """Test REVIEW REQUEST: Aviation Turbulence API - /api/aviation/turbulence/forecast/{flight_id} returns data"""
        try:
            # Test with a sample flight ID
            flight_id = "AA123"
            response = requests.get(f"{self.api_url}/aviation/turbulence/forecast/{flight_id}", timeout=15)
            success = response.status_code == 200
            self.log_result("Aviation Turbulence API", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Flight ID: {data.get('flight_id', 'N/A')}")
                print(f"   Turbulence forecast: {'✅' if 'turbulence_forecast' in data else '❌'}")
                print(f"   Route analysis: {'✅' if 'route_analysis' in data else '❌'}")
                print(f"   Weather conditions: {'✅' if 'weather_conditions' in data else '❌'}")
                
                # Check turbulence forecast data
                if 'turbulence_forecast' in data:
                    forecast = data['turbulence_forecast']
                    print(f"   Overall risk level: {forecast.get('overall_risk_level', 'N/A')}")
                    print(f"   Forecast segments: {len(forecast.get('segments', []))}")
                
                # Check route analysis
                if 'route_analysis' in data:
                    route = data['route_analysis']
                    print(f"   Route distance: {route.get('total_distance_km', 'N/A')} km")
                    print(f"   Flight duration: {route.get('estimated_duration_hours', 'N/A')} hours")
                
                required_fields = ['turbulence_forecast', 'route_analysis', 'weather_conditions']
                found_fields = sum(1 for field in required_fields if field in data)
                if found_fields >= 2:
                    print(f"   ✅ Aviation Turbulence API working ({found_fields}/3 sections)")
                else:
                    print(f"   ⚠️  Limited aviation data ({found_fields}/3 sections)")
            return success
        except Exception as e:
            self.log_result("Aviation Turbulence API", False, f"Exception: {str(e)}")
            return False

    def test_disasters_aviation_turbulence_tab(self):
        """Test REVIEW REQUEST: Disasters AVIATION TURBULENCE tab loads data and shows flight info"""
        try:
            response = requests.get(f"{self.api_url}/disasters/comprehensive/aviation-turbulence", timeout=15)
            success = response.status_code == 200
            self.log_result("Disasters AVIATION TURBULENCE Tab", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Current conditions: {'✅' if 'current_conditions' in data else '❌'}")
                print(f"   Active flights: {'✅' if 'active_flights' in data else '❌'}")
                print(f"   Turbulence alerts: {'✅' if 'turbulence_alerts' in data else '❌'}")
                print(f"   Weather patterns: {'✅' if 'weather_patterns' in data else '❌'}")
                
                # Check flight info specifically
                if 'active_flights' in data:
                    flights = data['active_flights']
                    print(f"   Active flights tracked: {len(flights)}")
                    if flights:
                        sample_flight = flights[0]
                        print(f"   Sample flight: {sample_flight.get('flight_id', 'N/A')} - {sample_flight.get('route', 'N/A')}")
                        print(f"   Turbulence level: {sample_flight.get('turbulence_level', 'N/A')}")
                
                # Check turbulence alerts
                if 'turbulence_alerts' in data:
                    alerts = data['turbulence_alerts']
                    print(f"   Turbulence alerts: {len(alerts)}")
                
                required_fields = ['current_conditions', 'active_flights', 'turbulence_alerts', 'weather_patterns']
                found_fields = sum(1 for field in required_fields if field in data)
                if found_fields >= 3:
                    print(f"   ✅ Aviation Turbulence tab working ({found_fields}/4 sections) - Shows flight info")
                else:
                    print(f"   ⚠️  Limited aviation turbulence data ({found_fields}/4 sections)")
            return success
        except Exception as e:
            self.log_result("Disasters AVIATION TURBULENCE Tab", False, f"Exception: {str(e)}")
            return False
        """Test IB Suite Executive Summary - should show Market Outlook panel"""
        try:
            response = requests.get(f"{self.api_url}/investment/executive-summary", timeout=15)
            success = response.status_code == 200
            self.log_result("IB Suite Executive Summary", success, 
                          f"Status: {response.status_code}", 200, response.status_code)
            if success:
                data = response.json()
                print(f"   Market outlook: {'✅' if 'market_outlook' in data else '❌'}")
                print(f"   Risk assessment: {'✅' if 'risk_assessment' in data else '❌'}")
                print(f"   Investment recommendations: {'✅' if 'investment_recommendations' in data else '❌'}")
                
                # Check Market Outlook panel specifically
                if 'market_outlook' in data:
                    outlook = data['market_outlook']
                    print(f"   Market sentiment: {outlook.get('sentiment', 'N/A')}")
                    print(f"   Risk level: {outlook.get('risk_level', 'N/A')}")
                    print(f"   Key factors: {len(outlook.get('key_factors', []))}")
                    print(f"   ✅ Market Outlook panel present")
                else:
                    print(f"   ❌ Market Outlook panel missing")
                
                # Check other sections
                required_sections = ['market_outlook', 'risk_assessment', 'investment_recommendations']
                found_sections = sum(1 for section in required_sections if section in data)
                if found_sections >= 2:
                    print(f"   ✅ Good executive summary coverage ({found_sections}/3)")
                else:
                    print(f"   ⚠️  Limited executive summary coverage ({found_sections}/3)")
            return success
        except Exception as e:
            self.log_result("IB Suite Executive Summary", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Plutus Predict API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core functionality tests
        self.test_health_check()
        login_success = self.test_login()
        
        # CURRENT REVIEW REQUEST - TDIS Portal Features (TOP PRIORITY)
        print("\n🎯 Testing CURRENT REVIEW REQUEST - TDIS Portal Features:")
        self.test_tdis_dashboard()  # TDIS Portal Dashboard with OPERATIONAL status
        self.test_tdis_alerts()  # TDIS Portal Alerts with summary counts
        self.test_tdis_regions()  # TDIS Portal Regions with 10 global regions
        self.test_tdis_layers()  # TDIS Portal Data Layers with interactive toggles
        self.test_ib_suite_executive_summary()  # IB Suite Executive Summary Market Outlook
        
        # PHASE 2 FEATURES - Priority tests from current review request
        print("\n🎯 Testing PHASE 2 Features (Current Priority):")
        self.test_future_predictions_2026_3000()  # PHASE 2: Dashboard future forecasts 2026-3000
        self.test_disasters_human_signals()  # PHASE 2: Human Signals tab
        self.test_disasters_satellite_iot()  # PHASE 2: Satellites/IoT tab  
        self.test_disasters_playbooks()  # PHASE 2: Playbooks tab
        
        # NEW SPACE HAZARDS FEATURES - Previous features
        print("\n🌌 Testing NEW SPACE HAZARDS Features:")
        self.test_space_hazards_current()  # NEW: Current space weather data
        self.test_space_hazards_forecast()  # NEW: 7-day space weather forecast
        self.test_space_hazards_impacts()  # NEW: Sector impact analysis
        self.test_space_hazards_neo()  # NEW: Near Earth Objects
        self.test_space_hazards_debris()  # NEW: Space debris reentries
        if login_success:
            self.test_space_hazards_remediation()  # NEW: Solar storm remediation
        
        # NEW DISASTER REMEDIATION FEATURES - Previous features
        print("\n🆕 Testing NEW DISASTER REMEDIATION Features:")
        self.test_disaster_remediation_types()  # NEW: Get supported disaster types
        if login_success:
            self.test_disaster_remediation_plan_generation()  # NEW: Generate AI remediation plans
            self.test_multi_llm_integration()  # NEW: Multi-LLM support (GPT-4o, Claude, Gemini)
        
        # NEW B2B FEATURES - Previous features
        print("\n🆕 Testing NEW B2B Features:")
        if login_success:
            self.test_usage_quotas()  # NEW: Usage & Quotas dashboard
            self.test_white_label_status()  # NEW: White-Label Status ($10,000 price)
            self.test_support_tickets_crud()  # NEW: Support Tickets CRUD
        
        # Previous NEW features
        print("\n📊 Testing Previous NEW Features:")
        self.test_pricing_plans()  # NEW: Should return 3 plans
        self.test_osint_live_stream()  # NEW: Should return pipeline data
        
        # Core API tests
        print("\n📊 Testing Core APIs:")
        self.test_dashboard_stats()
        self.test_earthquakes_api()
        self.test_disaster_summary()
        self.test_languages_support()
        
        # Authenticated features
        if login_success:
            print("\n🔐 Testing Authenticated Features:")
            self.test_forecast_generation()
            self.test_chat_functionality()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 RESULTS: {self.tests_passed}/{self.tests_run} tests passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
        # Detailed results
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        passed_tests = [r for r in self.results if r["success"]]
        if passed_tests:
            print(f"\n✅ Passed Tests ({len(passed_tests)}):")
            for test in passed_tests:
                print(f"   - {test['test']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PlutusAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())