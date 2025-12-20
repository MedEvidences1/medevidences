#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Plutus Predict
Testing all features: Admin Panels, Conversational AI Chat, Multi-language Support
"""

import requests
import sys
import json
from datetime import datetime
import time

class PlutusAPITester:
    def __init__(self, base_url="https://disaster-forecast.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test credentials from review request
        self.admin_email = "admin@plutuspredict.com"
        self.admin_password = "admin123"

    def log_test(self, name, success, response_data=None, error=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {error}")
            self.failed_tests.append({
                "test": name,
                "error": error,
                "response": response_data
            })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
                if success:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
            except:
                response_data = {"text": response.text[:200]}

            self.log_test(name, success, response_data, 
                         f"Expected {expected_status}, got {response.status_code}")
            
            return success, response_data

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            print(f"   Error: {error_msg}")
            self.log_test(name, False, {}, error_msg)
            return False, {}

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n" + "="*60)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*60)
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def get_admin_headers(self):
        """Get headers with admin token"""
        return {'Authorization': f'Bearer {self.admin_token}'} if self.admin_token else {}

    def test_language_apis(self):
        """Test multi-language support APIs"""
        print("\n" + "="*60)
        print("TESTING MULTI-LANGUAGE SUPPORT")
        print("="*60)
        
        # Test GET /api/languages - should return 6 supported languages
        success, response = self.run_test(
            "Get Supported Languages",
            "GET", 
            "languages",
            200
        )
        
        if success:
            languages = response.get('languages', {})
            expected_langs = ['en', 'es', 'fr', 'ar', 'id', 'sw']
            found_langs = list(languages.keys())
            
            if len(found_langs) == 6 and all(lang in found_langs for lang in expected_langs):
                print(f"   ✅ All 6 languages found: {found_langs}")
            else:
                print(f"   ❌ Expected 6 languages {expected_langs}, got {found_langs}")
        
        # Test translations for each language
        for lang in ['es', 'fr', 'ar', 'id', 'sw']:
            success, response = self.run_test(
                f"Get {lang.upper()} Translations",
                "GET",
                f"translations/{lang}",
                200
            )
            
            if success:
                translations = response.get('translations', {})
                if len(translations) > 0:
                    print(f"   ✅ {lang.upper()} has {len(translations)} translations")
                else:
                    print(f"   ❌ {lang.upper()} has no translations")

    def test_owner_availability(self):
        """Test owner availability API"""
        print("\n" + "="*60)
        print("TESTING OWNER AVAILABILITY")
        print("="*60)
        
        success, response = self.run_test(
            "Get Owner Availability",
            "GET",
            "owner/availability",
            200
        )
        
        if success:
            available_slots = response.get('available_slots', 0)
            max_owners = response.get('max_owners', 0)
            print(f"   Available slots: {available_slots}/{max_owners}")
            
            if max_owners == 3:
                print(f"   ✅ Correct max owners limit: {max_owners}")
            else:
                print(f"   ❌ Expected max_owners=3, got {max_owners}")

    def test_admin_organization_apis(self):
        """Test admin organization management APIs"""
        print("\n" + "="*60)
        print("TESTING ADMIN ORGANIZATION MANAGEMENT")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available for organization tests")
            return
        
        headers = self.get_admin_headers()
        
        # Test create enterprise organization
        org_data = {
            "name": "Test Enterprise Corp",
            "description": "Test organization for API testing",
            "max_employees": 10
        }
        
        success, response = self.run_test(
            "Create Enterprise Organization",
            "POST",
            "admin/organization/create",
            201,
            data=org_data,
            headers=headers
        )
        
        org_id = None
        if success:
            org_id = response.get('organization', {}).get('id')
            print(f"   Created organization ID: {org_id}")
        
        # Test get organization employees (if org created)
        if org_id:
            success, response = self.run_test(
                "Get Organization Employees",
                "GET",
                f"admin/organization/{org_id}/employees",
                200,
                headers=headers
            )
            
            if success:
                employees = response.get('employees', [])
                max_employees = response.get('max_employees', 0)
                print(f"   Employees: {len(employees)}/{max_employees}")
                
                if max_employees == 10:
                    print(f"   ✅ Correct employee limit: {max_employees}")
                else:
                    print(f"   ❌ Expected max_employees=10, got {max_employees}")

    def test_admin_document_apis(self):
        """Test admin document management APIs"""
        print("\n" + "="*60)
        print("TESTING ADMIN DOCUMENT MANAGEMENT")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available for document tests")
            return
        
        headers = self.get_admin_headers()
        
        # Test save document
        doc_data = {
            "title": "Test Document",
            "content": "This is a test document for API testing",
            "category": "general"
        }
        
        success, response = self.run_test(
            "Save Document",
            "POST",
            "admin/documents",
            201,
            data=doc_data,
            headers=headers
        )
        
        # Test get documents
        success, response = self.run_test(
            "Get User Documents",
            "GET",
            "admin/documents",
            200,
            headers=headers
        )
        
        if success:
            documents = response.get('documents', [])
            print(f"   Found {len(documents)} documents")

    def test_admin_settings_apis(self):
        """Test admin settings APIs"""
        print("\n" + "="*60)
        print("TESTING ADMIN SETTINGS")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available for settings tests")
            return
        
        headers = self.get_admin_headers()
        
        # Test get email settings
        success, response = self.run_test(
            "Get Email Settings",
            "GET",
            "admin/email-settings",
            200,
            headers=headers
        )
        
        # Test get payment history
        success, response = self.run_test(
            "Get Payment History",
            "GET",
            "admin/payments/history",
            200,
            headers=headers
        )

    def test_chat_apis(self):
        """Test conversational AI chat APIs"""
        print("\n" + "="*60)
        print("TESTING CONVERSATIONAL AI CHAT")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available for chat tests")
            return
        
        headers = self.get_admin_headers()
        
        # Test basic chat
        chat_data = {
            "message": "What is Plutus Predict and how does it work?"
        }
        
        success, response = self.run_test(
            "Basic AI Chat",
            "POST",
            "chat",
            200,
            data=chat_data,
            headers=headers
        )
        
        if success:
            ai_response = response.get('response', '')
            if len(ai_response) > 0:
                print(f"   ✅ AI responded with {len(ai_response)} characters")
                print(f"   Response preview: {ai_response[:100]}...")
            else:
                print(f"   ❌ Empty AI response")
        
        # Test interactive chat with context
        interactive_data = {
            "message": "Tell me about disaster prediction capabilities",
            "context": "investment analysis"
        }
        
        success, response = self.run_test(
            "Interactive Context-Aware Chat",
            "POST",
            "chat/interactive",
            200,
            data=interactive_data,
            headers=headers
        )
        
        if success:
            ai_response = response.get('response', '')
            if len(ai_response) > 0:
                print(f"   ✅ Interactive AI responded with {len(ai_response)} characters")
                print(f"   Response preview: {ai_response[:100]}...")
            else:
                print(f"   ❌ Empty interactive AI response")

    def test_core_functionality(self):
        """Test core forecasting functionality"""
        print("\n" + "="*60)
        print("TESTING CORE FUNCTIONALITY")
        print("="*60)
        
        # Test basic endpoints without auth
        endpoints_to_test = [
            ("Get Stats", "GET", "stats", 200),
            ("Get Languages", "GET", "languages", 200),
            ("Get Disasters Summary", "GET", "disasters/summary", 200),
            ("Get Earthquakes", "GET", "disasters/earthquakes?limit=5", 200),
        ]
        
        for name, method, endpoint, expected_status in endpoints_to_test:
            self.run_test(name, method, endpoint, expected_status)

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Plutus Predict API Testing")
        print(f"Backend URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        start_time = time.time()
        
        # Test core functionality first
        self.test_core_functionality()
        
        # Test admin authentication
        if self.test_admin_login():
            # Test all admin features
            self.test_owner_availability()
            self.test_admin_organization_apis()
            self.test_admin_document_apis()
            self.test_admin_settings_apis()
            self.test_chat_apis()
        
        # Test multi-language support
        self.test_language_apis()
        
        end_time = time.time()
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"Total Time: {end_time - start_time:.2f} seconds")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['test']}: {test['error']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PlutusAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())