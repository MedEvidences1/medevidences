#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class TargetedAPITester:
    def __init__(self, base_url="https://risk-intelligence.preview.emergentagent.com"):
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

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True, response
        return False, response

    def test_email_alert_status(self):
        """Test Email Alert Status API - /api/alerts/status"""
        return self.run_test("Email Alert Status API", "GET", "alerts/status", 200)

    def test_accuracy_stats(self):
        """Test Accuracy Stats API - /api/accuracy/stats"""
        return self.run_test("Accuracy Stats API", "GET", "accuracy/stats", 200)

    def test_dashboard_widgets(self):
        """Test Dashboard Widgets API - /api/dashboards/widgets"""
        return self.run_test("Dashboard Widgets API", "GET", "dashboards/widgets", 200)

    def test_astrology_search(self):
        """Test Astrology search returns real videos (not Rick Astley)"""
        success, response = self.run_test(
            "Astrology Search Real Videos", 
            "GET", 
            "astrology/search?query=earthquake prediction 2025", 
            200
        )
        
        if success and isinstance(response, dict):
            videos = response.get('videos', [])
            if videos:
                # Check if videos contain real astrology content
                real_astrology_found = False
                for video in videos[:3]:  # Check first 3 videos
                    title = video.get('title', '').lower()
                    channel = video.get('channel', '').lower()
                    
                    # Look for astrology-related keywords
                    astrology_keywords = ['astrology', 'prediction', 'vedic', 'abhigya', 'anand', 'praajna']
                    rick_astley_keywords = ['rick', 'astley', 'never gonna give you up']
                    
                    has_astrology = any(keyword in title or keyword in channel for keyword in astrology_keywords)
                    has_rick_astley = any(keyword in title or keyword in channel for keyword in rick_astley_keywords)
                    
                    if has_astrology and not has_rick_astley:
                        real_astrology_found = True
                        self.log(f"   ✅ Found real astrology video: {video.get('title', 'Unknown')}")
                        break
                
                if real_astrology_found:
                    self.log("   ✅ Astrology search returns real videos (not Rick Astley)")
                    return True, response
                else:
                    self.log("   ⚠️ No clear astrology videos found in search results")
                    return False, response
            else:
                self.log("   ⚠️ No videos returned in search results")
                return False, response
        
        return success, response

    def test_transcript_api(self):
        """Test Transcript API returns actual transcript text"""
        # First get a video from astrology search
        search_success, search_response = self.run_test(
            "Get Video for Transcript Test", 
            "GET", 
            "astrology/search?query=earthquake prediction", 
            200
        )
        
        if search_success and isinstance(search_response, dict):
            videos = search_response.get('videos', [])
            if videos:
                video_id = videos[0].get('video_id')
                if video_id:
                    # Test transcript endpoint
                    success, response = self.run_test(
                        "Transcript API Real Text",
                        "GET",
                        f"astrology/transcript/{video_id}",
                        200
                    )
                    
                    if success and isinstance(response, dict):
                        full_text = response.get('full_text', '')
                        if full_text and len(full_text) > 50:  # Reasonable transcript length
                            self.log(f"   ✅ Transcript contains {len(full_text)} characters")
                            return True, response
                        else:
                            self.log("   ⚠️ Transcript text is too short or empty")
                            return False, response
                    
                    return success, response
                else:
                    self.log("   ⚠️ No video_id found in search results")
                    return False, {}
            else:
                self.log("   ⚠️ No videos found for transcript test")
                return False, {}
        
        return False, {}

    def test_custom_dashboards_crud(self):
        """Test Custom Dashboards - create, list, delete"""
        if not self.token:
            self.log("⚠️ Skipping dashboard tests - no auth token")
            return False, {}
        
        # Test create dashboard
        dashboard_data = {
            "name": "Test Dashboard",
            "config": {
                "widgets": [
                    {"type": "predictions_list", "category": "earthquake", "limit": 10},
                    {"type": "accuracy_chart", "days": 90}
                ]
            }
        }
        
        create_success, create_response = self.run_test(
            "Create Custom Dashboard",
            "POST",
            "dashboards",
            200,
            data=dashboard_data
        )
        
        dashboard_id = None
        if create_success and isinstance(create_response, dict):
            dashboard_id = create_response.get('dashboard', {}).get('id')
        
        # Test list dashboards
        list_success, list_response = self.run_test(
            "List Custom Dashboards",
            "GET",
            "dashboards",
            200
        )
        
        # Test delete dashboard if we created one
        delete_success = True
        if dashboard_id:
            delete_success, delete_response = self.run_test(
                "Delete Custom Dashboard",
                "DELETE",
                f"dashboards/{dashboard_id}",
                200
            )
        
        return create_success and list_success and delete_success, {}

def main():
    tester = TargetedAPITester()
    
    # Test timestamp
    test_start = datetime.now()
    tester.log("🚀 Starting Targeted Plutus Predict API Tests")
    tester.log(f"🌐 Testing against: {tester.base_url}")
    
    # 1. Login with admin credentials
    tester.log("\n=== AUTHENTICATION ===")
    admin_success, admin_data = tester.test_login("admin@plutuspredict.com", "admin123")
    
    if not admin_success:
        tester.log("❌ Cannot proceed without authentication")
        return 1
    
    # 2. Test specific APIs mentioned in review request
    tester.log("\n=== NEW FEATURE APIS ===")
    
    # Email Alert Status API
    tester.test_email_alert_status()
    
    # Accuracy Stats API  
    tester.test_accuracy_stats()
    
    # Dashboard Widgets API
    tester.test_dashboard_widgets()
    
    # 3. Test Astrology Features
    tester.log("\n=== ASTROLOGY FEATURES ===")
    
    # Astrology search returns real videos (not Rick Astley)
    tester.test_astrology_search()
    
    # Transcript API returns actual transcript text
    tester.test_transcript_api()
    
    # 4. Test Custom Dashboards CRUD
    tester.log("\n=== CUSTOM DASHBOARDS ===")
    tester.test_custom_dashboards_crud()
    
    # Results Summary
    test_end = datetime.now()
    duration = (test_end - test_start).total_seconds()
    
    tester.log(f"\n{'='*50}")
    tester.log("📊 TARGETED TEST RESULTS")
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