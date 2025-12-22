#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class P0IssueTester:
    def __init__(self, base_url="https://ai-forecast-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details="", expected=None, actual=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            if expected and actual:
                print(f"   Expected: {expected}, Got: {actual}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "expected": expected,
            "actual": actual
        })

    def login(self):
        """Login to get authentication token"""
        try:
            response = requests.post(f"{self.api_url}/auth/login", 
                                   json={"email": "admin@plutuspredict.com", "password": "admin123"},
                                   timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                print(f"🔐 Logged in as: {data.get('name', 'Unknown')}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Login exception: {str(e)}")
            return False

    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def test_p0_issue_1_year_extraction_2026(self):
        """
        P0 Issue 1: AI Forecast Year Bug
        Test that when user asks for 2026 forecast, response includes target_year:2026 and forecast_period:2026
        """
        if not self.token:
            self.log_result("P0 Issue 1 - Year Extraction 2026", False, "No authentication token")
            return False

        test_questions = [
            "Will there be a major earthquake in Japan by 2026?",
            "What is the probability of a recession in 2026?", 
            "Will Bitcoin reach $200,000 by 2026?",
            "Will there be a pandemic in 2026?"
        ]

        successful_tests = 0
        total_tests = len(test_questions)

        for i, question in enumerate(test_questions):
            try:
                print(f"\n   Testing question {i+1}: {question}")
                
                # Test judgmental forecast endpoint
                response = requests.post(f"{self.api_url}/judgmental-forecast", 
                                       json={"question": question},
                                       headers=self.get_headers(),
                                       timeout=45)
                
                if response.status_code == 200:
                    data = response.json()
                    target_year = data.get("target_year")
                    forecast_period = data.get("forecast_period")
                    
                    print(f"   Response target_year: {target_year}")
                    print(f"   Response forecast_period: {forecast_period}")
                    
                    # Check if 2026 is correctly extracted
                    year_correct = (target_year == 2026 or target_year == "2026" or 
                                  forecast_period == 2026 or forecast_period == "2026" or
                                  "2026" in str(forecast_period))
                    
                    if year_correct:
                        successful_tests += 1
                        print(f"   ✅ Year 2026 correctly extracted")
                    else:
                        print(f"   ❌ Year 2026 NOT extracted correctly")
                        print(f"   Expected: 2026, Got target_year: {target_year}, forecast_period: {forecast_period}")
                else:
                    print(f"   ❌ API call failed: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Exception: {str(e)}")

        success = successful_tests >= (total_tests // 2)  # At least half should work
        self.log_result("P0 Issue 1 - Year Extraction 2026", success, 
                      f"{successful_tests}/{total_tests} questions correctly extracted 2026")
        return success

    def test_p0_issue_1_disaster_forecast_2026(self):
        """
        P0 Issue 1: Test disaster forecast endpoint with 2026 timeframe
        """
        if not self.token:
            self.log_result("P0 Issue 1 - Disaster Forecast 2026", False, "No authentication token")
            return False

        try:
            print(f"\n   Testing disaster forecast with timeframe 2026")
            
            response = requests.post(f"{self.api_url}/judgmental-forecast/disaster", 
                                   json={
                                       "disaster_type": "earthquake",
                                       "location": "California",
                                       "timeframe": "2026",
                                       "severity": "major"
                                   },
                                   headers=self.get_headers(),
                                   timeout=45)
            
            if response.status_code == 200:
                data = response.json()
                target_year = data.get("target_year")
                forecast_period = data.get("forecast_period")
                
                print(f"   Response target_year: {target_year}")
                print(f"   Response forecast_period: {forecast_period}")
                
                # Check if 2026 is correctly extracted
                year_correct = (target_year == 2026 or target_year == "2026" or 
                              forecast_period == 2026 or forecast_period == "2026" or
                              "2026" in str(forecast_period))
                
                success = year_correct
                self.log_result("P0 Issue 1 - Disaster Forecast 2026", success, 
                              f"target_year: {target_year}, forecast_period: {forecast_period}")
                return success
            else:
                self.log_result("P0 Issue 1 - Disaster Forecast 2026", False, 
                              f"API call failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("P0 Issue 1 - Disaster Forecast 2026", False, f"Exception: {str(e)}")
            return False

    def test_p1_issue_4_investment_dashboard_performance(self):
        """
        P1 Issue 4: IB Suite Performance
        Test that /api/investment/dashboard loads faster (target: under 15 seconds)
        """
        try:
            print(f"\n   Testing investment dashboard performance...")
            
            start_time = time.time()
            response = requests.get(f"{self.api_url}/investment/dashboard", 
                                  headers=self.get_headers(),
                                  timeout=20)
            end_time = time.time()
            
            load_time = end_time - start_time
            print(f"   Load time: {load_time:.2f} seconds")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                
                # Check if load time is under 15 seconds (target)
                performance_good = load_time < 15.0
                
                if performance_good:
                    print(f"   ✅ Performance target met (< 15s)")
                else:
                    print(f"   ⚠️  Performance target missed (>= 15s)")
                
                success = response.status_code == 200 and performance_good
                self.log_result("P1 Issue 4 - Investment Dashboard Performance", success, 
                              f"Load time: {load_time:.2f}s (target: <15s)")
                return success
            else:
                self.log_result("P1 Issue 4 - Investment Dashboard Performance", False, 
                              f"API call failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("P1 Issue 4 - Investment Dashboard Performance", False, f"Exception: {str(e)}")
            return False

    def test_investment_ma_deals_api(self):
        """
        Test M&A deals API to ensure data is available for frontend drill-down
        """
        try:
            print(f"\n   Testing M&A deals API...")
            
            response = requests.get(f"{self.api_url}/investment/ma-deals", 
                                  headers=self.get_headers(),
                                  timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                deals = data.get("deals", [])
                countries = data.get("countries", [])
                
                print(f"   Total deals: {len(deals)}")
                print(f"   Countries available: {len(countries)}")
                
                if countries:
                    print(f"   Sample countries: {countries[:5]}")
                
                # Check if we have deals and countries for drill-down
                has_data = len(deals) > 0 and len(countries) > 0
                
                success = has_data
                self.log_result("M&A Deals API Data", success, 
                              f"Deals: {len(deals)}, Countries: {len(countries)}")
                return success
            else:
                self.log_result("M&A Deals API Data", False, 
                              f"API call failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("M&A Deals API Data", False, f"Exception: {str(e)}")
            return False

    def test_forecast_response_structure(self):
        """
        Test that forecast responses include the new target_year and forecast_period fields
        """
        if not self.token:
            self.log_result("Forecast Response Structure", False, "No authentication token")
            return False

        try:
            print(f"\n   Testing forecast response structure...")
            
            # Test with a simple question that should work
            response = requests.post(f"{self.api_url}/judgmental-forecast", 
                                   json={"question": "Will there be a major earthquake in California by 2025?"},
                                   headers=self.get_headers(),
                                   timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for required fields
                has_target_year = "target_year" in data
                has_forecast_period = "forecast_period" in data
                has_probability = "probability" in data
                
                print(f"   Has target_year: {has_target_year}")
                print(f"   Has forecast_period: {has_forecast_period}")
                print(f"   Has probability: {has_probability}")
                
                if has_target_year or has_forecast_period:
                    print(f"   target_year value: {data.get('target_year')}")
                    print(f"   forecast_period value: {data.get('forecast_period')}")
                
                success = has_probability and (has_target_year or has_forecast_period)
                self.log_result("Forecast Response Structure", success, 
                              f"target_year: {has_target_year}, forecast_period: {has_forecast_period}")
                return success
            else:
                self.log_result("Forecast Response Structure", False, 
                              f"API call failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Forecast Response Structure", False, f"Exception: {str(e)}")
            return False

    def run_p0_tests(self):
        """Run all P0 issue tests"""
        print("🚀 Starting P0 Issue Tests for Plutus Predict")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without authentication")
            return False
        
        print("\n🔥 P0 Issue 1: AI Forecast Year Bug (2026 extraction)")
        self.test_p0_issue_1_year_extraction_2026()
        self.test_p0_issue_1_disaster_forecast_2026()
        self.test_forecast_response_structure()
        
        print("\n🔥 P1 Issue 4: IB Suite Performance")
        self.test_p1_issue_4_investment_dashboard_performance()
        
        print("\n🔥 P0 Issue 2: M&A Deals Data (for frontend drill-down)")
        self.test_investment_ma_deals_api()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 P0 RESULTS: {self.tests_passed}/{self.tests_run} tests passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
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
    tester = P0IssueTester()
    success = tester.run_p0_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())