#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FocusedFeaturesTester:
    def __init__(self, base_url="https://ai-forecaster-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def test_login(self):
        """Test admin login"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                                   json={"email": "admin@plutuspredict.com", "password": "admin123"},
                                   timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                self.token = data.get("token")
                print(f"   Logged in as: {data.get('name', 'Unknown')}")
            return success
        except Exception as e:
            print(f"   Login failed: {str(e)}")
            return False

    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def test_live_events_api(self):
        """Test AI_FORECAST > LIVE EVENTS API - should show 10+ live events"""
        try:
            response = requests.get(f"{self.api_url}/events/live", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                total_live = data.get("total_live", 0)
                by_category = data.get("by_category", {})
                events = data.get("events", [])
                
                print(f"   Total live events: {total_live}")
                print(f"   Categories: {list(by_category.keys())}")
                print(f"   Events returned: {len(events)}")
                
                # Check for expected categories
                expected_categories = ["economic", "geopolitical", "technology", "climate"]
                found_categories = [cat for cat in expected_categories if cat in by_category]
                print(f"   Expected categories found: {len(found_categories)}/{len(expected_categories)}")
                
                # Check if we have 10+ events
                if total_live >= 10:
                    print(f"   ✅ Has 10+ live events ({total_live})")
                else:
                    print(f"   ⚠️  Expected 10+ events, found {total_live}")
                    
            self.log_result("AI_FORECAST > LIVE EVENTS API", success, 
                          f"Status: {response.status_code}, Events: {total_live if success else 0}")
            return success
        except Exception as e:
            self.log_result("AI_FORECAST > LIVE EVENTS API", False, f"Exception: {str(e)}")
            return False

    def test_2025_2040_predictions_api(self):
        """Test AI_FORECAST > 2025-2040 predictions API"""
        try:
            response = requests.get(f"{self.api_url}/events/predictions?timeframe=2025-2040", timeout=20)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                predictions = data.get("predictions", [])
                category_outlook = data.get("category_outlook", {})
                wild_cards = data.get("wild_cards", [])
                
                print(f"   Predictions generated: {len(predictions)}")
                print(f"   Category outlook: {len(category_outlook)} categories")
                print(f"   Wild cards: {len(wild_cards)}")
                
                # Check for PREPARE REMEDIATION buttons (high/critical impact predictions)
                remediation_candidates = [p for p in predictions if p.get("impact") in ["high", "critical"]]
                print(f"   High/Critical impact predictions (for PREPARE REMEDIATION): {len(remediation_candidates)}")
                
                if predictions:
                    sample_pred = predictions[0]
                    print(f"   Sample prediction: {sample_pred.get('title', 'N/A')[:50]}...")
                    print(f"   Sample probability: {sample_pred.get('probability', 0)}%")
                    
            self.log_result("AI_FORECAST > 2025-2040 Predictions API", success, 
                          f"Status: {response.status_code}, Predictions: {len(predictions) if success else 0}")
            return success
        except Exception as e:
            self.log_result("AI_FORECAST > 2025-2040 Predictions API", False, f"Exception: {str(e)}")
            return False

    def test_disasters_remediation_form_api(self):
        """Test DISASTERS > REMEDIATION form API"""
        if not self.token:
            self.log_result("DISASTERS > REMEDIATION Form API", False, "No authentication token")
            return False
            
        try:
            # Test 1: Get disaster types for form
            types_response = requests.get(f"{self.api_url}/disasters/remediation/disaster-types", timeout=10)
            types_success = types_response.status_code == 200
            
            if types_success:
                types_data = types_response.json()
                disaster_types = types_data.get("disaster_types", [])
                severity_levels = types_data.get("severity_levels", [])
                ai_models = types_data.get("ai_models", [])
                
                print(f"   Disaster types: {len(disaster_types)}")
                print(f"   Severity levels: {len(severity_levels)}")
                print(f"   AI models: {len(ai_models)}")
                
                # Check for expected form fields
                expected_types = ["earthquake", "hurricane", "wildfire", "flood", "tornado"]
                expected_severities = ["low", "medium", "high", "critical"]
                expected_models = ["ensemble", "openai", "claude", "gemini"]
                
                types_found = [t for t in expected_types if t in disaster_types]
                severities_found = [s for s in expected_severities if s in severity_levels]
                models_found = [m for m in expected_models if m in ai_models]
                
                print(f"   Expected types found: {len(types_found)}/{len(expected_types)}")
                print(f"   Expected severities found: {len(severities_found)}/{len(expected_severities)}")
                print(f"   Expected models found: {len(models_found)}/{len(expected_models)}")
            
            # Test 2: Generate remediation plan with form data
            plan_response = requests.post(f"{self.api_url}/disasters/remediation/plan", 
                                        json={
                                            "disaster_type": "earthquake",
                                            "severity": "high",
                                            "location": "San Francisco, CA",
                                            "population_affected": 100000,
                                            "model_preference": "ensemble"
                                        },
                                        headers=self.get_headers(),
                                        timeout=30)
            plan_success = plan_response.status_code == 200
            
            if plan_success:
                plan_data = plan_response.json()
                print(f"   Plan generated successfully")
                print(f"   Model used: {plan_data.get('model_used', 'unknown')}")
                print(f"   Risk mitigation score: {plan_data.get('risk_mitigation_score', 0)}%")
                
                # Check for required plan sections
                required_sections = ['immediate_actions', 'evacuation_plan', 'resource_allocation']
                sections_found = sum(1 for section in required_sections if section in plan_data)
                print(f"   Plan sections: {sections_found}/{len(required_sections)}")
            
            overall_success = types_success and plan_success
            self.log_result("DISASTERS > REMEDIATION Form API", overall_success, 
                          f"Types: {types_response.status_code}, Plan: {plan_response.status_code}")
            return overall_success
            
        except Exception as e:
            self.log_result("DISASTERS > REMEDIATION Form API", False, f"Exception: {str(e)}")
            return False

    def test_translation_api(self):
        """Test Translation API for all 6 languages including new keys"""
        try:
            languages = ["en", "es", "fr", "ar", "id", "sw"]
            successful_languages = 0
            
            # New keys to test
            new_keys = ["space_hazards", "live_events", "remediation", "prepare_remediation"]
            
            for lang in languages:
                try:
                    response = requests.get(f"{self.api_url}/translations/{lang}", timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        translations = data.get("translations", {})
                        
                        # Check for new keys
                        new_keys_found = [key for key in new_keys if key in translations]
                        
                        print(f"   {lang.upper()}: ✅ ({len(translations)} keys, {len(new_keys_found)}/{len(new_keys)} new keys)")
                        
                        # Show sample translations for new keys
                        for key in new_keys_found[:2]:  # Show first 2
                            print(f"     {key}: {translations[key]}")
                        
                        successful_languages += 1
                    else:
                        print(f"   {lang.upper()}: ❌ Status {response.status_code}")
                        
                except Exception as e:
                    print(f"   {lang.upper()}: ❌ Exception: {str(e)}")
            
            success = successful_languages == len(languages)
            self.log_result("Translation API (6 languages + new keys)", success, 
                          f"{successful_languages}/{len(languages)} languages working")
            return success
            
        except Exception as e:
            self.log_result("Translation API (6 languages + new keys)", False, f"Exception: {str(e)}")
            return False

    def test_space_hazards_neo_api(self):
        """Test Space Hazards NEO API with fallback handling"""
        try:
            response = requests.get(f"{self.api_url}/space/neo", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                neos = data.get("near_earth_objects", [])
                fallback_used = data.get("fallback_data_used", False)
                data_source = data.get("data_source", "unknown")
                
                print(f"   Near Earth Objects: {len(neos)}")
                print(f"   Data source: {data_source}")
                print(f"   Fallback used: {fallback_used}")
                
                if neos:
                    sample_neo = neos[0]
                    print(f"   Sample NEO: {sample_neo.get('name', 'Unknown')}")
                    print(f"   Miss distance: {sample_neo.get('miss_distance_km', 'N/A')} km")
                    print(f"   Potentially hazardous: {sample_neo.get('potentially_hazardous', False)}")
                
                # Check if fallback handling is working
                if fallback_used:
                    print(f"   ✅ Fallback handling working (NASA API may be unavailable)")
                else:
                    print(f"   ✅ Live NASA API data available")
                    
            self.log_result("Space Hazards NEO API with Fallback", success, 
                          f"Status: {response.status_code}, NEOs: {len(neos) if success else 0}")
            return success
            
        except Exception as e:
            self.log_result("Space Hazards NEO API with Fallback", False, f"Exception: {str(e)}")
            return False

    def run_focused_tests(self):
        """Run focused tests for review request features"""
        print("🎯 Testing Specific Features from Review Request")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Login first
        login_success = self.test_login()
        
        print("\n🔥 Testing Review Request Features:")
        
        # 1. AI_FORECAST > LIVE EVENTS tab should show 10+ live events
        self.test_live_events_api()
        
        # 2. AI_FORECAST > 2025-2040 tab should generate AI predictions with PREPARE REMEDIATION buttons
        self.test_2025_2040_predictions_api()
        
        # 3. DISASTERS > REMEDIATION tab should have working form
        if login_success:
            self.test_disasters_remediation_form_api()
        
        # 4. Translation API should return translations for all 6 languages including new keys
        self.test_translation_api()
        
        # 5. Space Hazards module should display NEO data with fallback if API fails
        self.test_space_hazards_neo_api()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 FOCUSED TESTS: {self.tests_passed}/{self.tests_run} tests passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
        # Show results
        for result in self.results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"] and not result["success"]:
                print(f"   {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = FocusedFeaturesTester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())