#!/usr/bin/env python3
"""
FOCUSED TEST: Job Listing and Job Details Endpoints
Tests the specific endpoints mentioned in the review request
"""

import requests
import json
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://medevidence-jobs.preview.emergentagent.com/api"

class JobEndpointTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def test_job_listing_endpoint(self):
        """Test GET /api/jobs endpoint"""
        print("=== Testing GET /api/jobs (Job Listing Endpoint) ===")
        
        response = self.session.get(f"{self.base_url}/jobs")
        
        if response.status_code == 200:
            print("✓ Job listing endpoint responds successfully")
            
            try:
                result = response.json()
                job_count = len(result) if isinstance(result, list) else 0
                print(f"✓ Total jobs returned: {job_count}")
                
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
                    imported_jobs = []
                    for job in result:
                        if (job.get('source') == 'imported' or 
                            job.get('import_source') or 
                            'import' in str(job).lower()):
                            imported_jobs.append(job)
                    
                    if imported_jobs:
                        print(f"Found {len(imported_jobs)} imported jobs")
                        masked_correctly = 0
                        for job in imported_jobs:
                            if job.get('company_name') == 'M':
                                masked_correctly += 1
                            else:
                                print(f"  Job {job.get('id')}: company_name = '{job.get('company_name')}' (should be 'M')")
                        
                        if masked_correctly == len(imported_jobs):
                            print("✓ All imported jobs properly masked as 'M'")
                        else:
                            print(f"⚠ {masked_correctly}/{len(imported_jobs)} imported jobs properly masked")
                    else:
                        print("⚠ No imported jobs found to test Mercor masking")
                    
                    # Show sample jobs
                    print("\nSample jobs from listing:")
                    for i, job in enumerate(result[:3]):
                        print(f"  Job {i+1}:")
                        print(f"    ID: {job.get('id')}")
                        print(f"    Title: {job.get('title')}")
                        print(f"    Company: {job.get('company_name')}")
                        print(f"    Location: {job.get('location')}")
                        print(f"    Posted: {job.get('posted_at', 'N/A')}")
                    
                    return result[:10]  # Return first 10 jobs for details testing
                    
                else:
                    print("✗ No jobs returned from listing endpoint")
                    return []
                    
            except json.JSONDecodeError:
                print("✗ Invalid JSON response from job listing endpoint")
                print(f"Response: {response.text[:500]}")
                return []
                
        else:
            print(f"✗ Job listing failed: {response.status_code}")
            print(f"Response: {response.text}")
            return []
    
    def test_job_details_endpoint(self, jobs):
        """Test GET /api/jobs/{job_id} endpoint"""
        print("\n=== Testing GET /api/jobs/{job_id} (Job Details Endpoint) ===")
        
        if not jobs:
            print("✗ No jobs available for details testing")
            return
        
        successful_details = 0
        failed_details = 0
        
        for i, job in enumerate(jobs):
            job_id = job.get('id')
            if not job_id:
                print(f"  Job {i+1}: No ID found, skipping")
                continue
                
            print(f"Testing job details for: {job_id}")
            
            response = self.session.get(f"{self.base_url}/jobs/{job_id}")
            
            if response.status_code == 200:
                successful_details += 1
                
                try:
                    result = response.json()
                    
                    # Verify all required fields are present
                    required_fields = ['id', 'title', 'description', 'company_name', 'location', 'job_type', 'category', 'requirements', 'skills_required']
                    missing_fields = []
                    
                    for field in required_fields:
                        if field not in result:
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        print(f"  ✓ Job {job_id}: All required fields present")
                    else:
                        print(f"  ✗ Job {job_id}: Missing fields: {missing_fields}")
                    
                    # Check for posted_at field (important for date calculations)
                    if 'posted_at' in result:
                        print(f"  ✓ Job {job_id}: posted_at field exists: {result['posted_at']}")
                    else:
                        print(f"  ✗ Job {job_id}: posted_at field missing")
                    
                    # Check company name masking for imported jobs
                    if (result.get('source') == 'imported' or 
                        result.get('import_source') or
                        'import' in str(result).lower()):
                        if result.get('company_name') == 'M':
                            print(f"  ✓ Job {job_id}: Imported job properly masked")
                        else:
                            print(f"  ✗ Job {job_id}: Imported job not masked (company: {result.get('company_name')})")
                    
                    # Show detailed info for first job
                    if i == 0:
                        print(f"  Detailed job information:")
                        print(f"    Title: {result.get('title', 'N/A')}")
                        print(f"    Company: {result.get('company_name', 'N/A')}")
                        print(f"    Location: {result.get('location', 'N/A')}")
                        print(f"    Type: {result.get('job_type', 'N/A')}")
                        print(f"    Category: {result.get('category', 'N/A')}")
                        print(f"    Posted: {result.get('posted_at', 'N/A')}")
                        print(f"    Requirements: {len(result.get('requirements', []))} items")
                        print(f"    Skills: {len(result.get('skills_required', []))} items")
                        if result.get('source'):
                            print(f"    Source: {result.get('source')}")
                        if result.get('import_source'):
                            print(f"    Import Source: {result.get('import_source')}")
                        
                except json.JSONDecodeError:
                    print(f"  ✗ Job {job_id}: Invalid JSON response")
                    failed_details += 1
                    
            else:
                failed_details += 1
                print(f"  ✗ Job {job_id}: Details failed: {response.status_code}")
                if response.status_code == 404:
                    print(f"    Error: Job not found")
                else:
                    print(f"    Response: {response.text[:200]}")
        
        # Summary
        total_tested = successful_details + failed_details
        print(f"\nJob Details Testing Summary:")
        print(f"  ✓ Successful: {successful_details}/{total_tested}")
        print(f"  ✗ Failed: {failed_details}/{total_tested}")
        
        if successful_details == total_tested and total_tested > 0:
            print("✓ All job details endpoints working correctly")
        elif successful_details > 0:
            print("⚠ Some job details endpoints working, some failing")
        else:
            print("✗ All job details endpoints failing")
    
    def test_specific_job_collections(self):
        """Test jobs from different collections (jobs, imported_jobs, scraped_jobs)"""
        print("\n=== Testing Jobs from Different Collections ===")
        
        # Test a few specific job IDs to see if they're found across collections
        print("Testing job search across all collections...")
        
        # Get job listing first to find some IDs
        response = self.session.get(f"{self.base_url}/jobs")
        if response.status_code == 200:
            jobs = response.json()
            if jobs and len(jobs) > 0:
                # Test first few jobs
                for i, job in enumerate(jobs[:3]):
                    job_id = job.get('id')
                    if job_id:
                        print(f"\nTesting job ID: {job_id}")
                        detail_response = self.session.get(f"{self.base_url}/jobs/{job_id}")
                        
                        if detail_response.status_code == 200:
                            detail = detail_response.json()
                            print(f"  ✓ Found in collection")
                            print(f"    Title: {detail.get('title')}")
                            print(f"    Company: {detail.get('company_name')}")
                            if detail.get('source'):
                                print(f"    Source: {detail.get('source')}")
                            if detail.get('import_source'):
                                print(f"    Import Source: {detail.get('import_source')}")
                        else:
                            print(f"  ✗ Not found: {detail_response.status_code}")
            else:
                print("No jobs found in listing to test")
        else:
            print(f"Could not get job listing: {response.status_code}")
    
    def run_focused_test(self):
        """Run the focused test for job listing and details endpoints"""
        print("🎯 FOCUSED TEST: Job Listing and Job Details Endpoints")
        print("=" * 70)
        print("Testing the specific endpoints mentioned in the review request:")
        print("1. GET /api/jobs - List all jobs")
        print("2. GET /api/jobs/{job_id} - Job details")
        print("3. Verify Mercor masking (company_name = 'M')")
        print("4. Verify posted_at field exists")
        print("=" * 70)
        
        # Test 1: Job listing endpoint
        jobs = self.test_job_listing_endpoint()
        
        # Test 2: Job details endpoint
        self.test_job_details_endpoint(jobs)
        
        # Test 3: Test different collections
        self.test_specific_job_collections()
        
        print("\n" + "=" * 70)
        print("🏁 FOCUSED TEST COMPLETE")
        print("=" * 70)

if __name__ == "__main__":
    tester = JobEndpointTester()
    tester.run_focused_test()