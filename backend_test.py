#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class PlutusAPITester:
    def __init__(self, base_url="https://ai-forecast-3.preview.emergentagent.com"):
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

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Plutus Predict API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core functionality tests
        self.test_health_check()
        login_success = self.test_login()
        
        # NEW SPACE HAZARDS FEATURES - Priority tests from review request
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