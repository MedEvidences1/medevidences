#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class PlutusAPITester:
    def __init__(self, base_url="https://plutuspredict.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:500]
                })
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_stats(self):
        """Test public stats endpoint"""
        return self.run_test("Public Stats", "GET", "stats", 200)

    def test_register(self, name, email, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"name": name, "email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True, response
        return False, response

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True, response
        return False, response

    def test_auth_me(self):
        """Test authenticated user info"""
        return self.run_test("Get User Info", "GET", "auth/me", 200)

    def test_earthquakes(self):
        """Test earthquake data endpoint"""
        return self.run_test("USGS Earthquakes", "GET", "disasters/earthquakes?min_magnitude=4.0&limit=10", 200)

    def test_weather_alerts(self):
        """Test weather alerts endpoint"""
        return self.run_test("NOAA Weather Alerts", "GET", "disasters/weather-alerts", 200)

    def test_disaster_summary(self):
        """Test disaster summary endpoint"""
        return self.run_test("Disaster Summary", "GET", "disasters/summary", 200)

    def test_osint_search(self):
        """Test OSINT search endpoint"""
        return self.run_test("OSINT Search", "GET", "osint/search?query=earthquake", 200)

    def test_country_risk_grid(self):
        """Test country risk grid endpoint"""
        return self.run_test("Country Risk Grid", "GET", "grid/countries", 200)

    def test_ceo_departures(self):
        """Test CEO departures endpoint"""
        return self.run_test("CEO Departures", "GET", "grid/ceos", 200)

    def test_astrology_channels(self):
        """Test astrology channels endpoint"""
        return self.run_test("Astrology Channels", "GET", "astrology/channels", 200)

    def test_forecast_creation(self):
        """Test AI forecast creation (requires auth)"""
        if not self.token:
            self.log("⚠️ Skipping forecast test - no auth token")
            return False, {}
        
        return self.run_test(
            "Create AI Forecast",
            "POST",
            "forecast",
            200,
            data={"question": "Will there be a major earthquake in Japan by 2025?"}
        )

    def test_chat(self):
        """Test chat endpoint (requires auth)"""
        if not self.token:
            self.log("⚠️ Skipping chat test - no auth token")
            return False, {}
        
        return self.run_test(
            "Chat Message",
            "POST",
            "chat",
            200,
            data={"message": "What is the current earthquake risk?"}
        )

    def test_backtest(self):
        """Test backtest endpoint"""
        return self.run_test(
            "Backtest Run",
            "POST",
            "backtest/run",
            200,
            data={
                "start_date": "2024-01-01",
                "end_date": "2024-12-01",
                "sample_size": 100
            }
        )

def main():
    tester = PlutusAPITester()
    
    # Test timestamp
    test_start = datetime.now()
    tester.log("🚀 Starting Plutus Predict API Tests")
    tester.log(f"🌐 Testing against: {tester.base_url}")
    
    # 1. Basic Health Checks
    tester.log("\n=== BASIC HEALTH CHECKS ===")
    tester.test_health_check()
    tester.test_stats()
    
    # 2. Authentication Tests
    tester.log("\n=== AUTHENTICATION TESTS ===")
    
    # Test with admin credentials
    admin_success, admin_data = tester.test_login("admin@plutuspredict.com", "admin123")
    if admin_success:
        tester.test_auth_me()
    
    # 3. Disaster Data Tests
    tester.log("\n=== DISASTER DATA TESTS ===")
    tester.test_earthquakes()
    tester.test_weather_alerts()
    tester.test_disaster_summary()
    
    # 4. OSINT Tests
    tester.log("\n=== OSINT TESTS ===")
    tester.test_osint_search()
    
    # 5. Risk Grid Tests
    tester.log("\n=== RISK GRID TESTS ===")
    tester.test_country_risk_grid()
    tester.test_ceo_departures()
    
    # 6. Astrology Tests
    tester.log("\n=== ASTROLOGY TESTS ===")
    tester.test_astrology_channels()
    
    # 7. AI Features (requires auth)
    tester.log("\n=== AI FEATURES TESTS ===")
    if tester.token:
        # Give some time for LLM processing
        tester.log("⏳ Testing AI forecast (may take 10-15 seconds)...")
        forecast_success, forecast_data = tester.test_forecast_creation()
        if forecast_success:
            time.sleep(2)  # Brief pause between AI calls
        
        tester.test_chat()
    
    # 8. Backtest
    tester.log("\n=== BACKTEST TESTS ===")
    tester.test_backtest()
    
    # Results Summary
    test_end = datetime.now()
    duration = (test_end - test_start).total_seconds()
    
    tester.log(f"\n{'='*50}")
    tester.log("📊 TEST RESULTS SUMMARY")
    tester.log(f"{'='*50}")
    tester.log(f"Total Tests: {tester.tests_run}")
    tester.log(f"Passed: {tester.tests_passed}")
    tester.log(f"Failed: {len(tester.failed_tests)}")
    tester.log(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    tester.log(f"Duration: {duration:.1f}s")
    
    if tester.failed_tests:
        tester.log(f"\n❌ FAILED TESTS:")
        for failure in tester.failed_tests:
            tester.log(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('actual', 'Unknown error'))}")
    
    if tester.passed_tests:
        tester.log(f"\n✅ PASSED TESTS:")
        for test in tester.passed_tests:
            tester.log(f"  - {test}")
    
    # Return appropriate exit code
    return 0 if len(tester.failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())