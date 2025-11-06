#!/usr/bin/env python3
"""
Backend API Testing for MedEvidences Advanced Features
Tests all 5 advanced features as specified in test_result.md
"""

import requests
import json
import os
from datetime import datetime
import tempfile
import io

# Get backend URL from environment
BACKEND_URL = "https://med-ai-hiring.preview.emergentagent.com/api"

class MedEvidencesAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.candidate_token = None
        self.employer_token = None
        self.candidate_id = None
        self.employer_id = None
        self.job_id = None
        self.contract_id = None
        
    def create_test_pdf(self):
        """Create a test text file simulating a resume for upload testing"""
        resume_content = """
Dr. Sarah Johnson
Senior Medical Researcher
Email: sarah.johnson@email.com
Phone: (555) 123-4567

EDUCATION:
PhD in Medical Sciences - Harvard University (2018)
MD - Johns Hopkins University (2014)

EXPERIENCE:
Senior Research Scientist - Boston Medical Center (2020-Present)
Clinical Research Fellow - Mass General (2018-2020)

SKILLS:
Clinical Research, Data Analysis, Medical Writing
Statistical Analysis, Protocol Development, FDA Regulations

CERTIFICATIONS:
Board Certified Internal Medicine
Good Clinical Practice (GCP) Certification
"""
        buffer = io.BytesIO(resume_content.encode('utf-8'))
        return buffer
        
    def setup_test_users(self):
        """Create test candidate and employer users"""
        print("Setting up test users...")
        
        # Create candidate user
        candidate_data = {
            "email": f"test_candidate_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "candidate", 
            "full_name": "Dr. Sarah Johnson"
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=candidate_data)
        if response.status_code == 200:
            result = response.json()
            self.candidate_token = result["access_token"]
            self.candidate_id = result["user"]["id"]
            print(f"✓ Created candidate user: {candidate_data['email']}")
        else:
            print(f"✗ Failed to create candidate: {response.status_code} - {response.text}")
            return False
            
        # Create employer user
        employer_data = {
            "email": f"test_employer_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "employer",
            "full_name": "Medical Research Corp"
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=employer_data)
        if response.status_code == 200:
            result = response.json()
            self.employer_token = result["access_token"]
            self.employer_id = result["user"]["id"]
            print(f"✓ Created employer user: {employer_data['email']}")
        else:
            print(f"✗ Failed to create employer: {response.status_code} - {response.text}")
            return False
            
        return True
        
    def create_test_data(self):
        """Create necessary test data (profiles, jobs, contracts)"""
        print("Creating test data...")
        
        # Create candidate profile
        candidate_profile = {
            "specialization": "Medicine & Medical Research",
            "experience_years": 8,
            "skills": ["Clinical Research", "Data Analysis", "Medical Writing", "Statistical Analysis"],
            "education": "PhD Medical Sciences, MD",
            "bio": "Experienced medical researcher with focus on clinical trials",
            "location": "Boston, MA",
            "availability": "Full-time"
        }
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        response = self.session.post(f"{self.base_url}/candidates/profile", 
                                   json=candidate_profile, headers=headers)
        if response.status_code != 200:
            print(f"✗ Failed to create candidate profile: {response.status_code}")
            
        # Create employer profile  
        employer_profile = {
            "company_name": "Global Medical Research Institute",
            "company_type": "Research Institute", 
            "description": "Leading medical research organization",
            "location": "Boston, MA",
            "website": "https://example.com"
        }
        
        headers = {"Authorization": f"Bearer {self.employer_token}"}
        response = self.session.post(f"{self.base_url}/employers/profile",
                                   json=employer_profile, headers=headers)
        if response.status_code != 200:
            print(f"✗ Failed to create employer profile: {response.status_code}")
            
        # Create test job
        job_data = {
            "title": "Senior Medical Researcher",
            "category": "Medicine & Medical Research",
            "description": "Leading clinical research position",
            "requirements": ["PhD in Medical Sciences", "5+ years experience"],
            "skills_required": ["Clinical Research", "Data Analysis", "Medical Writing"],
            "location": "Boston, MA",
            "job_type": "Full-time",
            "salary_range": "$120,000 - $160,000",
            "experience_required": "5+ years",
            "role_overview": "Lead research projects",
            "specific_tasks": ["Design clinical trials", "Analyze data"],
            "education_requirements": "PhD required",
            "knowledge_areas": ["Clinical Research", "Statistics"],
            "work_type": "Hybrid",
            "schedule_commitment": "Full-time",
            "compensation_details": "Competitive salary + benefits",
            "terms_conditions": "Standard employment terms",
            "project_summary": "Cutting-edge medical research"
        }
        
        response = self.session.post(f"{self.base_url}/jobs", json=job_data, headers=headers)
        if response.status_code == 200:
            self.job_id = response.json()["id"]
            print(f"✓ Created test job: {self.job_id}")
        else:
            print(f"✗ Failed to create job: {response.status_code}")
            
        print("Test data setup complete")
        
    def test_resume_screening(self):
        """Test Auto Resume Screening API endpoints"""
        print("\n=== Testing Auto Resume Screening API ===")
        
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        # Test 1: POST /api/resume/parse (upload PDF resume)
        print("Testing POST /api/resume/parse...")
        
        pdf_buffer = self.create_test_pdf()
        files = {
            'resume': ('test_resume.txt', pdf_buffer, 'text/plain')
        }
        
        response = self.session.post(f"{self.base_url}/resume/parse", 
                                   files=files, headers=headers)
        
        if response.status_code == 200:
            print("✓ Resume parsing endpoint exists and responds")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Resume parsing failed: {response.status_code} - {response.text}")
            
        # Test 2: GET /api/resume/data (retrieve parsed resume data)
        print("Testing GET /api/resume/data...")
        
        response = self.session.get(f"{self.base_url}/resume/data", headers=headers)
        
        if response.status_code == 200:
            print("✓ Resume data retrieval endpoint works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Resume data retrieval failed: {response.status_code} - {response.text}")
            
    def test_ai_matching(self):
        """Test Intelligent AI Matching endpoints"""
        print("\n=== Testing Intelligent AI Matching ===")
        
        if not self.job_id:
            print("✗ No job ID available for matching tests")
            return
            
        headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: POST /api/matching/generate-scores/{job_id}
        print(f"Testing POST /api/matching/generate-scores/{self.job_id}...")
        
        response = self.session.post(f"{self.base_url}/matching/generate-scores/{self.job_id}",
                                   headers=headers)
        
        if response.status_code in [200, 201]:
            print("✓ AI matching score generation works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ AI matching generation failed: {response.status_code} - {response.text}")
            
        # Test 2: GET /api/matching/scores/{job_id}
        print(f"Testing GET /api/matching/scores/{self.job_id}...")
        
        response = self.session.get(f"{self.base_url}/matching/scores/{self.job_id}",
                                  headers=headers)
        
        if response.status_code == 200:
            print("✓ AI matching scores retrieval works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ AI matching scores retrieval failed: {response.status_code} - {response.text}")
            
    def test_feedback_collection(self):
        """Test Dynamic Feedback Collection endpoints"""
        print("\n=== Testing Dynamic Feedback Collection ===")
        
        headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: POST /api/feedback/submit
        print("Testing POST /api/feedback/submit...")
        
        feedback_data = {
            "match_id": "test_match_123",
            "candidate_id": self.candidate_id,
            "job_id": self.job_id,
            "hire_outcome": "hired",
            "employer_rating": 5,
            "employer_feedback": "Excellent candidate, great fit for the role"
        }
        
        response = self.session.post(f"{self.base_url}/feedback/submit",
                                   json=feedback_data, headers=headers)
        
        if response.status_code in [200, 201]:
            print("✓ Feedback submission works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Feedback submission failed: {response.status_code} - {response.text}")
            
        # Test 2: GET /api/feedback/analytics
        print("Testing GET /api/feedback/analytics...")
        
        response = self.session.get(f"{self.base_url}/feedback/analytics", headers=headers)
        
        if response.status_code == 200:
            print("✓ Feedback analytics retrieval works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Feedback analytics failed: {response.status_code} - {response.text}")
            
    def test_payroll_tracking(self):
        """Test Payroll Tracking System endpoints"""
        print("\n=== Testing Payroll Tracking System ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: POST /api/payroll/timesheet
        print("Testing POST /api/payroll/timesheet...")
        
        timesheet_data = {
            "contract_id": "test_contract_123",
            "period_start": "2025-01-01T00:00:00Z",
            "period_end": "2025-01-07T23:59:59Z", 
            "hours_worked": 40.0,
            "hourly_rate": 75.0,
            "description": "Weekly timesheet for research project"
        }
        
        response = self.session.post(f"{self.base_url}/payroll/timesheet",
                                   json=timesheet_data, headers=candidate_headers)
        
        payroll_id = None
        if response.status_code in [200, 201]:
            print("✓ Timesheet submission works")
            result = response.json()
            payroll_id = result.get("id")
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Timesheet submission failed: {response.status_code} - {response.text}")
            
        # Test 2: GET /api/payroll/timesheets
        print("Testing GET /api/payroll/timesheets...")
        
        response = self.session.get(f"{self.base_url}/payroll/timesheets", 
                                  headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Timesheets retrieval works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Timesheets retrieval failed: {response.status_code} - {response.text}")
            
        # Test 3: PUT /api/payroll/approve/{payroll_id}
        if payroll_id:
            print(f"Testing PUT /api/payroll/approve/{payroll_id}...")
            
            response = self.session.put(f"{self.base_url}/payroll/approve/{payroll_id}",
                                      headers=employer_headers)
            
            if response.status_code == 200:
                print("✓ Payroll approval works")
                result = response.json()
                print(f"  Response: {json.dumps(result, indent=2)}")
            else:
                print(f"✗ Payroll approval failed: {response.status_code} - {response.text}")
        
        # Test 4: POST /api/compliance/upload
        print("Testing POST /api/compliance/upload...")
        
        # Create a test compliance document
        test_doc = io.BytesIO(b"Test compliance document content")
        files = {
            'document': ('w9_form.txt', test_doc, 'text/plain')
        }
        data = {
            'contract_id': 'test_contract_123',
            'document_type': 'w9'
        }
        
        response = self.session.post(f"{self.base_url}/compliance/upload",
                                   files=files, data=data, headers=candidate_headers)
        
        if response.status_code in [200, 201]:
            print("✓ Compliance document upload works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Compliance upload failed: {response.status_code} - {response.text}")
            
        # Test 5: GET /api/compliance/documents
        print("Testing GET /api/compliance/documents...")
        
        response = self.session.get(f"{self.base_url}/compliance/documents",
                                  headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Compliance documents retrieval works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Compliance documents retrieval failed: {response.status_code} - {response.text}")
            
    def test_mercor_scraping(self):
        """Test Mercor Job Scraping endpoints"""
        print("\n=== Testing Mercor Job Scraping ===")
        
        headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: POST /api/scrape/mercor-jobs
        print("Testing POST /api/scrape/mercor-jobs...")
        
        scrape_params = {
            "category": "medical",
            "max_jobs": 10
        }
        
        response = self.session.post(f"{self.base_url}/scrape/mercor-jobs",
                                   json=scrape_params, headers=headers)
        
        if response.status_code in [200, 201]:
            print("✓ Mercor job scraping works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Mercor scraping failed: {response.status_code} - {response.text}")
            
        # Test 2: GET /api/scrape/imported-jobs
        print("Testing GET /api/scrape/imported-jobs...")
        
        response = self.session.get(f"{self.base_url}/scrape/imported-jobs", headers=headers)
        
        if response.status_code == 200:
            print("✓ Imported jobs retrieval works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Imported jobs retrieval failed: {response.status_code} - {response.text}")
            
        # Test 3: POST /api/scrape/convert-to-job/{scraped_job_id}
        scraped_job_id = "test_scraped_123"
        print(f"Testing POST /api/scrape/convert-to-job/{scraped_job_id}...")
        
        response = self.session.post(f"{self.base_url}/scrape/convert-to-job/{scraped_job_id}",
                                   headers=headers)
        
        if response.status_code in [200, 201]:
            print("✓ Job conversion works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Job conversion failed: {response.status_code} - {response.text}")
            
    def test_error_cases(self):
        """Test error handling and edge cases"""
        print("\n=== Testing Error Cases ===")
        
        # Test unauthorized access
        print("Testing unauthorized access...")
        response = self.session.get(f"{self.base_url}/resume/data")
        if response.status_code == 401:
            print("✓ Proper authentication required")
        else:
            print(f"✗ Authentication not properly enforced: {response.status_code}")
            
        # Test invalid endpoints
        print("Testing invalid endpoints...")
        headers = {"Authorization": f"Bearer {self.candidate_token}"}
        response = self.session.get(f"{self.base_url}/nonexistent/endpoint", headers=headers)
        if response.status_code == 404:
            print("✓ Proper 404 for invalid endpoints")
        else:
            print(f"✗ Invalid endpoint handling: {response.status_code}")
            
    def test_health_screening_integration(self):
        """Test Health Screening Integration for AI Interviews"""
        print("\n=== Testing Health Screening Integration ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: Health Document Upload - Calorie Report
        print("Testing POST /api/candidates/upload-calorie-report...")
        
        # Create test image file
        test_image_content = b"fake_calorie_report_image_data_from_medevidences.com"
        files = {
            'file': ('calorie_report_day1.jpg', io.BytesIO(test_image_content), 'image/jpeg')
        }
        
        response = self.session.post(f"{self.base_url}/candidates/upload-calorie-report",
                                   files=files, headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Calorie report upload works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Calorie report upload failed: {response.status_code} - {response.text}")
            
        # Test 2: Health Document Upload - Microbiome Screenshot
        print("Testing POST /api/candidates/upload-microbiome-screenshot...")
        
        test_microbiome_content = b"fake_gut_microbiome_screenshot_from_medevidences.com"
        files = {
            'file': ('microbiome_score.png', io.BytesIO(test_microbiome_content), 'image/png')
        }
        
        response = self.session.post(f"{self.base_url}/candidates/upload-microbiome-screenshot",
                                   files=files, headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Microbiome screenshot upload works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
        else:
            print(f"✗ Microbiome screenshot upload failed: {response.status_code} - {response.text}")
            
        # Test 3: AI Interview Question Generation with Health Questions
        print("Testing POST /api/video-interview/start...")
        
        if not self.job_id:
            print("✗ No job ID available for interview tests")
            return
            
        interview_data = {
            "job_id": self.job_id
        }
        
        response = self.session.post(f"{self.base_url}/video-interview/start",
                                   json=interview_data, headers=candidate_headers)
        
        interview_id = None
        if response.status_code == 200:
            print("✓ AI interview start works")
            result = response.json()
            interview_id = result.get("interview_id")
            questions = result.get("questions", [])
            
            print(f"  Interview ID: {interview_id}")
            print(f"  Total questions: {len(questions)}")
            
            # Verify health questions are included
            health_keywords = ["workout", "food", "microbiome", "muscle", "medication", "exercise"]
            health_questions_found = 0
            
            for i, question in enumerate(questions[:6]):  # First 6 should be health
                for keyword in health_keywords:
                    if keyword.lower() in question.lower():
                        health_questions_found += 1
                        break
                        
            print(f"  Health questions detected: {health_questions_found}/6")
            
            if health_questions_found >= 4:  # At least 4 health-related questions
                print("✓ Health questions properly included in interview")
            else:
                print("✗ Insufficient health questions in interview")
                
            print(f"  Sample questions:")
            for i, q in enumerate(questions[:3]):
                print(f"    Q{i+1}: {q[:80]}...")
                
        else:
            print(f"✗ AI interview start failed: {response.status_code} - {response.text}")
            
        # Test 4: Complete Interview with Health Analysis
        if interview_id:
            print(f"Testing POST /api/video-interview/complete/{interview_id}...")
            
            # Mock video paths for completion
            mock_video_paths = [
                {"question_index": 0, "path": "/tmp/mock_video_0.mp4"},
                {"question_index": 1, "path": "/tmp/mock_video_1.mp4"},
                {"question_index": 2, "path": "/tmp/mock_video_2.mp4"},
                {"question_index": 3, "path": "/tmp/mock_video_3.mp4"},
                {"question_index": 4, "path": "/tmp/mock_video_4.mp4"},
                {"question_index": 5, "path": "/tmp/mock_video_5.mp4"}
            ]
            
            # Create mock video files with health-related content
            health_answers = [
                "I work out 5 times a week, doing cardio for 45 minutes and strength training for 30 minutes each session.",
                "I follow a balanced diet with 2000 calories per day. I track my nutrition using the MedEvidences.com calorie report system.",
                "Yes, I monitor my gut microbiome health regularly. My latest score from MedEvidences.com shows excellent diversity.",
                "I have good muscle mass from regular strength training. I do weight lifting 3 times per week focusing on compound movements.",
                "I am not currently on any medications. I maintain my health through proper diet and exercise.",
                "My exercise routine includes running 3x/week for 45 minutes, weight training 3x/week for 60 minutes, and yoga 2x/week for 30 minutes."
            ]
            
            # Create mock video files
            for i, video_data in enumerate(mock_video_paths):
                video_path = video_data["path"]
                os.makedirs(os.path.dirname(video_path), exist_ok=True)
                with open(video_path, 'wb') as f:
                    # Write mock audio content that could be transcribed
                    mock_audio = f"Mock audio for health question {i+1}: {health_answers[i] if i < len(health_answers) else 'General answer'}"
                    f.write(mock_audio.encode())
            
            completion_data = {
                "video_paths": mock_video_paths
            }
            
            response = self.session.post(f"{self.base_url}/video-interview/complete/{interview_id}",
                                       json=completion_data, headers=candidate_headers)
            
            if response.status_code == 200:
                print("✓ Interview completion with health analysis works")
                result = response.json()
                
                # Check for health analysis components
                health_score = result.get("health_score")
                health_analysis = result.get("health_analysis")
                
                print(f"  Health Score: {health_score}")
                
                if health_analysis:
                    print("✓ Health analysis generated")
                    print(f"  Overall wellness score: {health_analysis.get('overall_wellness_score', 'N/A')}")
                    
                    # Check for required health analysis components
                    required_components = ["exercise_routine", "nutrition", "gut_health", "muscle_fitness", "medications", "sleep_habits"]
                    found_components = 0
                    
                    for component in required_components:
                        if component in health_analysis:
                            found_components += 1
                            
                    print(f"  Health analysis components: {found_components}/{len(required_components)}")
                    
                    if found_components >= 4:
                        print("✓ Comprehensive health analysis generated")
                    else:
                        print("✗ Incomplete health analysis")
                else:
                    print("✗ No health analysis in response")
                    
            else:
                print(f"✗ Interview completion failed: {response.status_code} - {response.text}")
                
        # Test 5: Candidate Profile with Health Data
        print("Testing GET /api/candidates/profile (health data)...")
        
        response = self.session.get(f"{self.base_url}/candidates/profile", headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Candidate profile retrieval works")
            profile = response.json()
            
            # Check for health fields
            health_fields = ["calorie_reports", "microbiome_screenshot", "health_score", "health_analysis"]
            found_fields = 0
            
            for field in health_fields:
                if field in profile:
                    found_fields += 1
                    print(f"  {field}: {'Present' if profile[field] else 'Empty'}")
                    
            print(f"  Health fields present: {found_fields}/{len(health_fields)}")
            
            if found_fields >= 3:
                print("✓ Health data properly stored in candidate profile")
            else:
                print("✗ Missing health data in candidate profile")
                
        else:
            print(f"✗ Candidate profile retrieval failed: {response.status_code} - {response.text}")

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🧪 Starting MedEvidences Advanced Features API Testing")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users, aborting tests")
            return
            
        self.create_test_data()
        
        # Run all feature tests
        self.test_resume_screening()
        self.test_ai_matching() 
        self.test_feedback_collection()
        self.test_payroll_tracking()
        self.test_mercor_scraping()
        self.test_health_screening_integration()  # NEW: Health screening tests
        self.test_error_cases()
        
        print("\n" + "=" * 60)
        print("🏁 Testing Complete")

if __name__ == "__main__":
    tester = MedEvidencesAPITester()
    tester.run_all_tests()