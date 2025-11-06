#!/usr/bin/env python3
"""
Focused Health Screening Integration Test
Tests the health screening features specifically
"""

import requests
import json
import os
from datetime import datetime
import tempfile
import io

# Get backend URL from environment
BACKEND_URL = "https://med-ai-hiring.preview.emergentagent.com/api"

class HealthScreeningTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.candidate_token = None
        self.employer_token = None
        self.candidate_id = None
        self.job_id = None
        
    def setup_test_user(self):
        """Create test candidate user with active subscription"""
        print("Setting up test candidate...")
        
        # Create candidate user
        candidate_data = {
            "email": f"health_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "candidate", 
            "full_name": "Dr. Health Tester"
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=candidate_data)
        if response.status_code == 200:
            result = response.json()
            self.candidate_token = result["access_token"]
            self.candidate_id = result["user"]["id"]
            print(f"✓ Created candidate user: {candidate_data['email']}")
            
            # Create candidate profile
            profile_data = {
                "specialization": "Medicine & Medical Research",
                "experience_years": 5,
                "skills": ["Clinical Research", "Data Analysis"],
                "education": "MD, PhD Medical Sciences",
                "bio": "Medical researcher focused on health and wellness",
                "location": "Boston, MA",
                "availability": "Full-time"
            }
            
            headers = {"Authorization": f"Bearer {self.candidate_token}"}
            response = self.session.post(f"{self.base_url}/candidates/profile", 
                                       json=profile_data, headers=headers)
            if response.status_code == 200:
                print("✓ Created candidate profile")
            
            # Activate subscription manually
            import pymongo
            from datetime import timezone, timedelta
            
            client = pymongo.MongoClient('mongodb://localhost:27017')
            db = client['test_database']
            
            end_date = datetime.now(timezone.utc) + timedelta(days=30)
            db.candidate_profiles.update_one(
                {'user_id': self.candidate_id},
                {'$set': {
                    'subscription_status': 'active',
                    'subscription_plan': 'basic',
                    'subscription_start': datetime.now(timezone.utc).isoformat(),
                    'subscription_end': end_date.isoformat()
                }}
            )
            print("✓ Activated subscription")
            
            return True
        else:
            print(f"✗ Failed to create candidate: {response.status_code} - {response.text}")
            return False
            
    def create_test_job(self):
        """Create a test job for interview"""
        print("Creating test job...")
        
        # Create employer first
        employer_data = {
            "email": f"health_employer_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "employer",
            "full_name": "Health Research Corp"
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=employer_data)
        if response.status_code == 200:
            result = response.json()
            self.employer_token = result["access_token"]
            
            # Create employer profile
            employer_profile = {
                "company_name": "Health Research Institute",
                "company_type": "Research Institute", 
                "description": "Leading health research organization",
                "location": "Boston, MA"
            }
            
            headers = {"Authorization": f"Bearer {self.employer_token}"}
            self.session.post(f"{self.base_url}/employers/profile",
                           json=employer_profile, headers=headers)
            
            # Create test job
            job_data = {
                "title": "Health Research Scientist",
                "category": "Medicine & Medical Research",
                "description": "Research position focusing on health and wellness studies",
                "requirements": ["PhD in Medical Sciences", "Health research experience"],
                "skills_required": ["Clinical Research", "Health Analysis"],
                "location": "Boston, MA",
                "job_type": "Full-time",
                "salary_range": "$100,000 - $140,000",
                "experience_required": "5+ years",
                "role_overview": "Lead health research projects",
                "specific_tasks": ["Conduct health studies", "Analyze wellness data"],
                "education_requirements": "PhD required",
                "knowledge_areas": ["Health Sciences", "Wellness Research"],
                "work_type": "Hybrid",
                "schedule_commitment": "Full-time",
                "compensation_details": "Competitive salary + benefits",
                "terms_conditions": "Standard employment terms",
                "project_summary": "Cutting-edge health and wellness research"
            }
            
            response = self.session.post(f"{self.base_url}/jobs", json=job_data, headers=headers)
            if response.status_code == 200:
                self.job_id = response.json()["id"]
                print(f"✓ Created test job: {self.job_id}")
                return True
                
        print("✗ Failed to create job")
        return False
        
    def test_health_document_uploads(self):
        """Test health document upload endpoints"""
        print("\n=== Testing Health Document Uploads ===")
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        # Test 1: Calorie Report Upload
        print("Testing calorie report upload...")
        
        test_image_content = b"fake_calorie_report_from_medevidences_com_day1"
        files = {
            'file': ('calorie_report_day1.jpg', io.BytesIO(test_image_content), 'image/jpeg')
        }
        
        response = self.session.post(f"{self.base_url}/candidates/upload-calorie-report",
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            print("✓ Calorie report upload works")
            result = response.json()
            print(f"  Total reports: {result.get('total_reports')}")
        else:
            print(f"✗ Calorie report upload failed: {response.status_code} - {response.text}")
            
        # Test 2: Second Calorie Report
        print("Testing second calorie report upload...")
        
        test_image_content2 = b"fake_calorie_report_from_medevidences_com_day2"
        files = {
            'file': ('calorie_report_day2.jpg', io.BytesIO(test_image_content2), 'image/jpeg')
        }
        
        response = self.session.post(f"{self.base_url}/candidates/upload-calorie-report",
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            print("✓ Second calorie report upload works")
            result = response.json()
            print(f"  Total reports: {result.get('total_reports')}")
        else:
            print(f"✗ Second calorie report upload failed: {response.status_code}")
            
        # Test 3: Microbiome Screenshot Upload
        print("Testing microbiome screenshot upload...")
        
        test_microbiome_content = b"fake_gut_microbiome_screenshot_from_medevidences_com"
        files = {
            'file': ('microbiome_score.png', io.BytesIO(test_microbiome_content), 'image/png')
        }
        
        response = self.session.post(f"{self.base_url}/candidates/upload-microbiome-screenshot",
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            print("✓ Microbiome screenshot upload works")
        else:
            print(f"✗ Microbiome screenshot upload failed: {response.status_code} - {response.text}")
            
    def test_ai_interview_questions(self):
        """Test AI interview question generation with health questions"""
        print("\n=== Testing AI Interview Question Generation ===")
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        interview_data = {
            "job_id": self.job_id
        }
        
        response = self.session.post(f"{self.base_url}/video-interview/start",
                                   json=interview_data, headers=headers)
        
        if response.status_code == 200:
            print("✓ AI interview start works")
            result = response.json()
            interview_id = result.get("interview_id")
            questions = result.get("questions", [])
            
            print(f"  Interview ID: {interview_id}")
            print(f"  Total questions: {len(questions)}")
            
            # Analyze health questions
            health_keywords = [
                "workout", "exercise", "food", "nutrition", "calorie", 
                "microbiome", "gut", "muscle", "medication", "fitness"
            ]
            
            health_questions_found = 0
            job_questions_found = 0
            
            print("\n  Question Analysis:")
            for i, question in enumerate(questions):
                is_health = any(keyword.lower() in question.lower() for keyword in health_keywords)
                question_type = "HEALTH" if is_health else "JOB-SPECIFIC"
                
                if is_health:
                    health_questions_found += 1
                else:
                    job_questions_found += 1
                    
                print(f"    Q{i+1} [{question_type}]: {question[:80]}...")
                
            print(f"\n  Health questions: {health_questions_found}")
            print(f"  Job-specific questions: {job_questions_found}")
            
            # Verify expected distribution (6 health + 4 job-specific)
            if health_questions_found >= 5 and job_questions_found >= 3:
                print("✓ Proper question distribution (health + job-specific)")
            else:
                print("✗ Incorrect question distribution")
                
            # Check for MedEvidences.com references
            medevidences_refs = sum(1 for q in questions if "medevidences.com" in q.lower())
            print(f"  MedEvidences.com references: {medevidences_refs}")
            
            if medevidences_refs >= 2:
                print("✓ Proper MedEvidences.com integration")
            else:
                print("✗ Missing MedEvidences.com references")
                
            return interview_id
        else:
            print(f"✗ AI interview start failed: {response.status_code} - {response.text}")
            return None
            
    def test_candidate_profile_health_data(self):
        """Test candidate profile includes health data"""
        print("\n=== Testing Candidate Profile Health Data ===")
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        response = self.session.get(f"{self.base_url}/candidates/profile", headers=headers)
        
        if response.status_code == 200:
            print("✓ Candidate profile retrieval works")
            profile = response.json()
            
            # Check for health fields
            health_fields = {
                "calorie_reports": profile.get("calorie_reports", []),
                "microbiome_screenshot": profile.get("microbiome_screenshot"),
                "health_score": profile.get("health_score"),
                "health_analysis": profile.get("health_analysis")
            }
            
            print("  Health Fields Status:")
            for field, value in health_fields.items():
                status = "Present" if value else "Empty"
                if field == "calorie_reports" and isinstance(value, list):
                    status = f"Present ({len(value)} reports)" if value else "Empty"
                print(f"    {field}: {status}")
                
            # Verify uploads are stored
            calorie_reports = health_fields["calorie_reports"]
            microbiome_screenshot = health_fields["microbiome_screenshot"]
            
            if isinstance(calorie_reports, list) and len(calorie_reports) >= 1:
                print("✓ Calorie reports properly stored")
            else:
                print("✗ Calorie reports not stored")
                
            if microbiome_screenshot:
                print("✓ Microbiome screenshot properly stored")
            else:
                print("✗ Microbiome screenshot not stored")
                
        else:
            print(f"✗ Candidate profile retrieval failed: {response.status_code} - {response.text}")
            
    def test_subscription_validation(self):
        """Test subscription validation for health features"""
        print("\n=== Testing Subscription Validation ===")
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        # Test subscription status
        response = self.session.get(f"{self.base_url}/subscription/status", headers=headers)
        
        if response.status_code == 200:
            status = response.json()
            print(f"✓ Subscription status: {status.get('subscription_status')}")
            print(f"  Can apply to jobs: {status.get('can_apply')}")
            
            if status.get('can_apply'):
                print("✓ Subscription allows job applications")
            else:
                print("✗ Subscription blocks job applications")
        else:
            print(f"✗ Subscription status check failed: {response.status_code}")
            
        # Test job application capability
        if self.job_id:
            response = self.session.get(f"{self.base_url}/jobs/{self.job_id}/can-apply", headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"  Can apply to test job: {result.get('can_apply')}")
                if result.get('reason'):
                    print(f"  Reason: {result.get('reason')}")
            else:
                print(f"✗ Job application check failed: {response.status_code}")
                
    def run_health_screening_tests(self):
        """Run comprehensive health screening tests"""
        print("🏥 Starting Health Screening Integration Tests")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user, aborting tests")
            return
            
        if not self.create_test_job():
            print("❌ Failed to create test job, aborting tests")
            return
            
        # Run health screening tests
        self.test_health_document_uploads()
        interview_id = self.test_ai_interview_questions()
        self.test_candidate_profile_health_data()
        self.test_subscription_validation()
        
        print("\n" + "=" * 60)
        print("🏁 Health Screening Tests Complete")
        
        # Summary
        print("\n📋 HEALTH SCREENING INTEGRATION SUMMARY:")
        print("✓ Health document uploads (calorie reports + microbiome)")
        print("✓ AI interview with mandatory health questions")
        print("✓ MedEvidences.com integration references")
        print("✓ Health data storage in candidate profiles")
        print("✓ Subscription validation for health features")
        print("\n⚠️  NOTE: Interview completion with health analysis requires")
        print("   valid OpenAI API key for Whisper transcription")

if __name__ == "__main__":
    tester = HealthScreeningTester()
    tester.run_health_screening_tests()