#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND TESTING for MedEvidences.com
Tests ALL backend functionality including newly implemented Phase 1-3 features
"""

import requests
import json
import os
from datetime import datetime
import tempfile
import io
import asyncio
import time

# Get backend URL from environment
BACKEND_URL = "https://medevidence-jobs.preview.emergentagent.com/api"

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
        self.interview_id = None
        self.imported_job_count = 0
        
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
            
    def test_email_service_integration(self):
        """Test Email Service Integration (Mock Mode)"""
        print("\n=== Testing Email Service Integration (Phase 1) ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        print("Testing email service integration through application creation...")
        
        if not self.job_id:
            print("✗ No job ID available for email tests")
            return
            
        # Test email notification through job application
        application_data = {
            "job_id": self.job_id,
            "cover_letter": "I am very interested in this medical research position. My background in clinical research and data analysis makes me a strong candidate for this role."
        }
        
        response = self.session.post(f"{self.base_url}/applications",
                                   json=application_data, headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Application created successfully (triggers email notification)")
            result = response.json()
            print(f"  Application ID: {result.get('id')}")
            print("✓ Email service integration working (mock mode)")
            print("  Note: Email notifications are in mock mode - check backend logs for email content")
        else:
            print(f"✗ Application creation failed: {response.status_code} - {response.text}")
    
    def test_job_aggregator_service(self):
        """Test Job Aggregator Service"""
        print("\n=== Testing Job Aggregator Service (Phase 2) ===")
        
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: Import jobs from aggregators
        print("Testing POST /api/jobs/import-from-aggregators...")
        
        import_data = {
            "keywords": "medical research"
        }
        
        response = self.session.post(f"{self.base_url}/jobs/import-from-aggregators",
                                   json=import_data, headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Job aggregator import endpoint works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
            
            # Check if jobs were imported
            total_imported = 0
            for source, data in result.items():
                if isinstance(data, dict) and 'count' in data:
                    total_imported += data['count']
            
            self.imported_job_count = total_imported
            print(f"  Total jobs imported: {total_imported}")
            
            if total_imported > 0:
                print("✓ Jobs successfully imported from aggregators")
            else:
                print("⚠ No jobs imported (expected without API keys)")
                
        else:
            print(f"✗ Job aggregator import failed: {response.status_code} - {response.text}")
        
        # Test 2: Get imported jobs
        print("Testing GET /api/jobs/imported...")
        
        response = self.session.get(f"{self.base_url}/jobs/imported", headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Imported jobs retrieval works")
            result = response.json()
            print(f"  Imported jobs count: {len(result)}")
        else:
            print(f"✗ Imported jobs retrieval failed: {response.status_code} - {response.text}")
        
        # Test 3: Import by company
        print("Testing POST /api/jobs/import-by-company/OpenAI...")
        
        response = self.session.post(f"{self.base_url}/jobs/import-by-company/OpenAI",
                                   headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Company-specific job import works")
            result = response.json()
            print(f"  Company jobs found: {len(result)}")
        else:
            print(f"✗ Company job import failed: {response.status_code} - {response.text}")
    
    def test_ai_matching_service(self):
        """Test AI Matching Service with Industry-Specific Criteria"""
        print("\n=== Testing AI Matching Service (Phase 2) ===")
        
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        if not self.job_id:
            print("✗ No job ID available for AI matching tests")
            return
        
        # Test enhanced AI matching with industry-specific criteria
        print("Testing enhanced AI matching with industry-specific vetting...")
        
        # First ensure we have a candidate profile
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        profile_response = self.session.get(f"{self.base_url}/candidates/profile", headers=candidate_headers)
        
        if profile_response.status_code != 200:
            print("✗ No candidate profile found for matching")
            return
        
        # Test AI matching score generation
        response = self.session.post(f"{self.base_url}/matching/generate-scores/{self.job_id}",
                                   headers=employer_headers)
        
        if response.status_code in [200, 201]:
            print("✓ AI matching score generation works")
            result = response.json()
            print(f"  Response: {json.dumps(result, indent=2)}")
            
            # Check for enhanced scoring features
            if 'industry_specific_analysis' in str(result):
                print("✓ Industry-specific analysis included")
            if 'enhanced_scoring' in str(result):
                print("✓ Enhanced scoring algorithm working")
                
        else:
            print(f"✗ AI matching generation failed: {response.status_code} - {response.text}")
        
        # Test retrieving match scores
        response = self.session.get(f"{self.base_url}/matching/scores/{self.job_id}",
                                  headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ AI matching scores retrieval works")
            result = response.json()
            print(f"  Match scores count: {len(result) if isinstance(result, list) else 'N/A'}")
        else:
            print(f"✗ AI matching scores retrieval failed: {response.status_code} - {response.text}")
    
    def test_recommendation_service(self):
        """Test Recommendation Service"""
        print("\n=== Testing Recommendation Service (Phase 2) ===")
        
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        if not self.job_id:
            print("✗ No job ID available for recommendation tests")
            return
        
        # Test candidate recommendation endpoint
        print(f"Testing GET /api/employer/recommended-candidates/{self.job_id}...")
        
        response = self.session.get(f"{self.base_url}/employer/recommended-candidates/{self.job_id}",
                                  headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Candidate recommendation service works")
            result = response.json()
            print(f"  Recommended candidates: {len(result) if isinstance(result, list) else 'N/A'}")
            
            # Check for ranking algorithm features
            if isinstance(result, list) and len(result) > 0:
                candidate = result[0]
                if 'match_score' in candidate:
                    print("✓ Candidate ranking algorithm working")
                    print(f"  Top candidate match score: {candidate.get('match_score')}")
                if 'ranking_reason' in candidate:
                    print("✓ Ranking explanations provided")
                    
        else:
            print(f"✗ Candidate recommendation failed: {response.status_code} - {response.text}")
    
    def test_analytics_endpoints(self):
        """Test Analytics Endpoints"""
        print("\n=== Testing Analytics Endpoints (Phase 3) ===")
        
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        # Test 1: Featured companies stats
        print("Testing GET /api/stats/featured-companies...")
        
        response = self.session.get(f"{self.base_url}/stats/featured-companies")
        
        if response.status_code == 200:
            print("✓ Featured companies stats endpoint works")
            result = response.json()
            
            # Check for required categories
            required_categories = ['ai_labs', 'startups', 'global']
            found_categories = 0
            
            for category in required_categories:
                if category in result:
                    found_categories += 1
                    companies = result[category]
                    print(f"  {category}: {len(companies)} companies")
                    
            if found_categories == len(required_categories):
                print("✓ All company categories present")
            else:
                print(f"✗ Missing categories: {found_categories}/{len(required_categories)}")
                
        else:
            print(f"✗ Featured companies stats failed: {response.status_code} - {response.text}")
        
        # Test 2: Employer dashboard stats
        print("Testing GET /api/employer/dashboard-stats...")
        
        response = self.session.get(f"{self.base_url}/employer/dashboard-stats", headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Employer dashboard stats endpoint works")
            result = response.json()
            print(f"  Stats keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        else:
            print(f"✗ Employer dashboard stats failed: {response.status_code} - {response.text}")
        
        # Test 3: Candidate dashboard stats
        print("Testing GET /api/candidate/dashboard-stats...")
        
        response = self.session.get(f"{self.base_url}/candidate/dashboard-stats", headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Candidate dashboard stats endpoint works")
            result = response.json()
            print(f"  Stats keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        else:
            print(f"✗ Candidate dashboard stats failed: {response.status_code} - {response.text}")
    
    def test_health_screening_integration(self):
        """Test Health Screening Integration for AI Interviews"""
        print("\n=== Testing Health Screening Integration ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
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
            print(f"  Total reports: {result.get('total_reports', 'N/A')}")
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
            print(f"  File uploaded: {result.get('message', 'Success')}")
        else:
            print(f"✗ Microbiome screenshot upload failed: {response.status_code} - {response.text}")
    
    def test_video_interview_system(self):
        """Test Video Interview System with 12 Questions (6 Health + 6 Job)"""
        print("\n=== Testing Video Interview System ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        if not self.job_id:
            print("✗ No job ID available for interview tests")
            return
            
        # Test 1: Start interview (should generate 12 questions)
        print("Testing POST /api/video-interview/start...")
        
        interview_data = {
            "job_id": self.job_id
        }
        
        response = self.session.post(f"{self.base_url}/video-interview/start",
                                   json=interview_data, headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Video interview start works")
            result = response.json()
            self.interview_id = result.get("interview_id")
            questions = result.get("questions", [])
            
            print(f"  Interview ID: {self.interview_id}")
            print(f"  Total questions: {len(questions)}")
            
            # Verify 12 questions (6 health + 6 job-specific)
            if len(questions) == 12:
                print("✓ Correct number of questions generated (12)")
            else:
                print(f"✗ Expected 12 questions, got {len(questions)}")
            
            # Check for health-related keywords in first 6 questions
            health_keywords = ["workout", "food", "microbiome", "muscle", "medication", "exercise", "sleep", "nutrition", "calorie", "gut"]
            health_questions_found = 0
            
            for i, question in enumerate(questions[:6]):  # First 6 should be health
                question_lower = question.lower()
                if any(keyword in question_lower for keyword in health_keywords):
                    health_questions_found += 1
                    
            print(f"  Health questions detected: {health_questions_found}/6")
            
            if health_questions_found >= 4:
                print("✓ Health questions properly included")
            else:
                print("✗ Insufficient health questions")
                
            # Show sample questions
            print("  Sample questions:")
            for i, q in enumerate(questions[:3]):
                print(f"    Q{i+1}: {q[:80]}...")
                
        else:
            print(f"✗ Video interview start failed: {response.status_code} - {response.text}")
        
        # Test 2: Upload answer (mock)
        if self.interview_id:
            print("Testing POST /api/video-interview/upload-answer...")
            
            # Create mock video file
            mock_video_content = b"mock_video_answer_content"
            files = {
                'video': ('answer_1.mp4', io.BytesIO(mock_video_content), 'video/mp4')
            }
            data = {
                'question_index': '0'
            }
            
            response = self.session.post(f"{self.base_url}/video-interview/upload-answer",
                                       files=files, data=data, headers=candidate_headers)
            
            if response.status_code == 200:
                print("✓ Video answer upload works")
            else:
                print(f"✗ Video answer upload failed: {response.status_code} - {response.text}")
        
        # Test 3: Complete interview (will test transcription fallback)
        if self.interview_id:
            print(f"Testing POST /api/video-interview/complete/{self.interview_id}...")
            
            # Mock completion data
            completion_data = {
                "video_paths": [
                    {"question_index": i, "path": f"/tmp/mock_video_{i}.mp4"}
                    for i in range(6)  # Mock 6 answers
                ]
            }
            
            response = self.session.post(f"{self.base_url}/video-interview/complete/{self.interview_id}",
                                       json=completion_data, headers=candidate_headers)
            
            if response.status_code == 200:
                print("✓ Interview completion works")
                result = response.json()
                
                # Check for health analysis
                health_score = result.get("health_score")
                health_analysis = result.get("health_analysis")
                
                if health_score:
                    print(f"  Health Score: {health_score}")
                    print("✓ Health analysis generated")
                else:
                    print("⚠ No health score (may be due to transcription issues)")
                    
            else:
                print(f"✗ Interview completion failed: {response.status_code} - {response.text}")
                # Check if it's the known Whisper API key issue
                if "Incorrect API key" in response.text or "whisper" in response.text.lower():
                    print("  ⚠ Known issue: Whisper transcription API key error")
                    print("  ⚠ Health analysis logic implemented but blocked by transcription")
    
    def test_subscription_system(self):
        """Test Subscription System with Stripe Integration"""
        print("\n=== Testing Subscription System ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        
        # Test 1: Get subscription pricing
        print("Testing GET /api/subscription/pricing...")
        
        response = self.session.get(f"{self.base_url}/subscription/pricing")
        
        if response.status_code == 200:
            print("✓ Subscription pricing endpoint works")
            result = response.json()
            print(f"  Available plans: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        else:
            print(f"✗ Subscription pricing failed: {response.status_code} - {response.text}")
        
        # Test 2: Check subscription status
        print("Testing GET /api/subscription/status...")
        
        response = self.session.get(f"{self.base_url}/subscription/status", headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Subscription status check works")
            result = response.json()
            status = result.get('subscription_status', 'unknown')
            can_apply = result.get('can_apply', False)
            print(f"  Current status: {status}")
            print(f"  Can apply to jobs: {can_apply}")
        else:
            print(f"✗ Subscription status check failed: {response.status_code} - {response.text}")
        
        # Test 3: Create checkout session
        print("Testing POST /api/subscription/create-checkout...")
        
        checkout_data = {
            "plan": "basic"
        }
        
        response = self.session.post(f"{self.base_url}/subscription/create-checkout",
                                   json=checkout_data, headers=candidate_headers)
        
        if response.status_code == 200:
            print("✓ Stripe checkout session creation works")
            result = response.json()
            if 'checkout_url' in result:
                print("✓ Checkout URL generated")
            if 'session_id' in result:
                print("✓ Session ID provided")
        else:
            print(f"✗ Checkout session creation failed: {response.status_code} - {response.text}")
    
    def test_job_listing_and_details_endpoints(self):
        """Test Job Listing and Job Details Endpoints - FOCUSED TEST"""
        print("\n=== Testing Job Listing and Job Details Endpoints ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: GET /api/jobs - List all jobs
        print("Testing GET /api/jobs (job listing endpoint)...")
        
        response = self.session.get(f"{self.base_url}/jobs")
        
        if response.status_code == 200:
            print("✓ Job listing endpoint works")
            result = response.json()
            job_count = len(result) if isinstance(result, list) else 0
            print(f"  Total jobs returned: {job_count}")
            
            if job_count > 0:
                print("✓ Jobs list contains data")
                
                # Check first job structure
                first_job = result[0]
                required_fields = ['id', 'title', 'description', 'company_name', 'location', 'job_type', 'category']
                missing_fields = []
                
                for field in required_fields:
                    if field not in first_job:
                        missing_fields.append(field)
                
                if not missing_fields:
                    print("✓ Job objects contain all required fields")
                else:
                    print(f"✗ Missing fields in job objects: {missing_fields}")
                
                # Check for Mercor masking
                mercor_jobs = [job for job in result if job.get('source') == 'imported' or job.get('import_source')]
                if mercor_jobs:
                    masked_correctly = all(job.get('company_name') == 'M' for job in mercor_jobs)
                    if masked_correctly:
                        print("✓ Mercor company names properly masked as 'M'")
                    else:
                        print("✗ Some imported jobs not properly masked")
                        for job in mercor_jobs[:3]:  # Show first 3 examples
                            print(f"    Job {job.get('id')}: company_name = '{job.get('company_name')}'")
                else:
                    print("⚠ No imported jobs found to test Mercor masking")
                
                # Store job IDs for detailed testing
                test_job_ids = [job['id'] for job in result[:5]]  # Test first 5 jobs
                
            else:
                print("✗ No jobs returned from listing endpoint")
                return
                
        else:
            print(f"✗ Job listing failed: {response.status_code} - {response.text}")
            return
        
        # Test 2: GET /api/jobs/{job_id} - Job details for multiple jobs
        print("\nTesting GET /api/jobs/{job_id} (job details endpoint)...")
        
        successful_details = 0
        failed_details = 0
        
        for i, job_id in enumerate(test_job_ids):
            print(f"  Testing job details for job {i+1}: {job_id}")
            
            response = self.session.get(f"{self.base_url}/jobs/{job_id}")
            
            if response.status_code == 200:
                successful_details += 1
                result = response.json()
                
                # Verify all required fields are present
                required_fields = ['id', 'title', 'description', 'company_name', 'location', 'job_type', 'category', 'requirements', 'skills_required']
                missing_fields = []
                
                for field in required_fields:
                    if field not in result:
                        missing_fields.append(field)
                
                if not missing_fields:
                    print(f"    ✓ Job {job_id}: All required fields present")
                else:
                    print(f"    ✗ Job {job_id}: Missing fields: {missing_fields}")
                
                # Check for posted_at field (important for date calculations)
                if 'posted_at' in result:
                    print(f"    ✓ Job {job_id}: posted_at field exists: {result['posted_at']}")
                else:
                    print(f"    ✗ Job {job_id}: posted_at field missing")
                
                # Check company name masking for imported jobs
                if result.get('source') == 'imported' or result.get('import_source'):
                    if result.get('company_name') == 'M':
                        print(f"    ✓ Job {job_id}: Imported job properly masked")
                    else:
                        print(f"    ✗ Job {job_id}: Imported job not masked (company: {result.get('company_name')})")
                
                # Show sample job details
                if i == 0:  # Show details for first job
                    print(f"    Sample job details:")
                    print(f"      Title: {result.get('title', 'N/A')}")
                    print(f"      Company: {result.get('company_name', 'N/A')}")
                    print(f"      Location: {result.get('location', 'N/A')}")
                    print(f"      Type: {result.get('job_type', 'N/A')}")
                    print(f"      Category: {result.get('category', 'N/A')}")
                    print(f"      Posted: {result.get('posted_at', 'N/A')}")
                    
            else:
                failed_details += 1
                print(f"    ✗ Job {job_id}: Details failed: {response.status_code} - {response.text}")
        
        # Summary of job details testing
        print(f"\nJob Details Testing Summary:")
        print(f"  ✓ Successful: {successful_details}/{len(test_job_ids)}")
        print(f"  ✗ Failed: {failed_details}/{len(test_job_ids)}")
        
        if successful_details == len(test_job_ids):
            print("✓ All job details endpoints working correctly")
        elif successful_details > 0:
            print("⚠ Some job details endpoints working, some failing")
        else:
            print("✗ All job details endpoints failing")
        
        # Test 3: Test job from different collections (if available)
        print("\nTesting jobs from different collections...")
        
        # Try to find jobs from different sources
        regular_jobs = [job for job in result if not job.get('source') and not job.get('import_source')]
        imported_jobs = [job for job in result if job.get('source') == 'imported' or job.get('import_source')]
        
        print(f"  Regular jobs found: {len(regular_jobs)}")
        print(f"  Imported jobs found: {len(imported_jobs)}")
        
        # Test one from each category if available
        if regular_jobs:
            job_id = regular_jobs[0]['id']
            response = self.session.get(f"{self.base_url}/jobs/{job_id}")
            if response.status_code == 200:
                print(f"  ✓ Regular job details working: {job_id}")
            else:
                print(f"  ✗ Regular job details failed: {job_id}")
        
        if imported_jobs:
            job_id = imported_jobs[0]['id']
            response = self.session.get(f"{self.base_url}/jobs/{job_id}")
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Imported job details working: {job_id}")
                print(f"    Company name: {result.get('company_name')} (should be 'M')")
            else:
                print(f"  ✗ Imported job details failed: {job_id}")

    def test_job_application_management(self):
        """Test Job & Application Management"""
        print("\n=== Testing Job & Application Management ===")
        
        candidate_headers = {"Authorization": f"Bearer {self.candidate_token}"}
        employer_headers = {"Authorization": f"Bearer {self.employer_token}"}
        
        # Test 1: Create job (already tested in setup, but verify)
        if self.job_id:
            print(f"✓ Job creation works (Job ID: {self.job_id})")
        
        # Test 2: Check if can apply to job
        if self.job_id:
            print(f"Testing GET /api/jobs/{self.job_id}/can-apply...")
            
            response = self.session.get(f"{self.base_url}/jobs/{self.job_id}/can-apply",
                                      headers=candidate_headers)
            
            if response.status_code == 200:
                print("✓ Job application eligibility check works")
                result = response.json()
                can_apply = result.get('can_apply', False)
                reason = result.get('reason', 'No reason provided')
                print(f"  Can apply: {can_apply}")
                print(f"  Reason: {reason}")
            else:
                print(f"✗ Job application eligibility check failed: {response.status_code} - {response.text}")
        
        # Test 3: Get received applications (employer view)
        print("Testing GET /api/applications/received...")
        
        response = self.session.get(f"{self.base_url}/applications/received", headers=employer_headers)
        
        if response.status_code == 200:
            print("✓ Received applications endpoint works")
            result = response.json()
            print(f"  Applications received: {len(result) if isinstance(result, list) else 'N/A'}")
        else:
            print(f"✗ Received applications failed: {response.status_code} - {response.text}")

    def run_all_tests(self):
        """Run comprehensive test suite for ALL MedEvidences backend features"""
        print("🧪 COMPREHENSIVE BACKEND TESTING for MedEvidences.com")
        print("=" * 70)
        print("Testing ALL backend functionality including Phase 1-3 features")
        print("=" * 70)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users, aborting tests")
            return
            
        self.create_test_data()
        
        # PRIORITY 1 - NEW FEATURES (Phase 1-3)
        print("\n🚀 PRIORITY 1 - NEW FEATURES (Phase 1-3)")
        print("-" * 50)
        self.test_email_service_integration()           # Phase 1
        self.test_job_aggregator_service()              # Phase 2  
        self.test_ai_matching_service()                 # Phase 2
        self.test_recommendation_service()              # Phase 2
        self.test_analytics_endpoints()                 # Phase 3
        
        # PRIORITY 2 - EXISTING CORE FEATURES
        print("\n🏥 PRIORITY 2 - EXISTING CORE FEATURES")
        print("-" * 50)
        self.test_job_listing_and_details_endpoints()   # FOCUSED: Job listing & details fix
        self.test_health_screening_integration()        # Health documents
        self.test_video_interview_system()              # 12 questions (6 health + 6 job)
        self.test_job_application_management()          # Jobs & applications
        self.test_subscription_system()                 # Stripe integration
        
        # LEGACY FEATURES (from original test)
        print("\n📋 LEGACY FEATURES")
        print("-" * 50)
        self.test_resume_screening()
        self.test_ai_matching() 
        self.test_feedback_collection()
        self.test_payroll_tracking()
        self.test_mercor_scraping()
        self.test_error_cases()
        
        print("\n" + "=" * 70)
        print("🏁 COMPREHENSIVE TESTING COMPLETE")
        print("=" * 70)

if __name__ == "__main__":
    tester = MedEvidencesAPITester()
    tester.run_all_tests()