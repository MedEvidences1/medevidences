#!/usr/bin/env python3
"""
Test imported jobs specifically to verify Mercor masking
"""

import requests
import json

BACKEND_URL = "https://medevidence-jobs.preview.emergentagent.com/api"

def test_imported_jobs():
    print("=== Testing Imported Jobs and Mercor Masking ===")
    
    # Get all jobs
    response = requests.get(f"{BACKEND_URL}/jobs")
    
    if response.status_code == 200:
        jobs = response.json()
        
        # Find imported jobs
        imported_jobs = []
        for job in jobs:
            if (job.get('source') == 'imported' or 
                job.get('import_source') or
                job.get('company_name') == 'M'):
                imported_jobs.append(job)
        
        print(f"Found {len(imported_jobs)} imported jobs")
        
        if imported_jobs:
            # Test first few imported jobs
            for i, job in enumerate(imported_jobs[:5]):
                job_id = job.get('id')
                print(f"\nTesting imported job {i+1}: {job_id}")
                print(f"  Title: {job.get('title')}")
                print(f"  Company (listing): {job.get('company_name')}")
                
                # Get job details
                detail_response = requests.get(f"{BACKEND_URL}/jobs/{job_id}")
                
                if detail_response.status_code == 200:
                    detail = detail_response.json()
                    print(f"  Company (details): {detail.get('company_name')}")
                    
                    # Check masking
                    if detail.get('company_name') == 'M':
                        print(f"  ✓ Properly masked as 'M'")
                    else:
                        print(f"  ✗ Not properly masked: '{detail.get('company_name')}'")
                    
                    # Check other fields
                    print(f"  Posted: {detail.get('posted_at', 'N/A')}")
                    print(f"  Requirements: {len(detail.get('requirements', []))} items")
                    print(f"  Skills: {len(detail.get('skills_required', []))} items")
                    
                else:
                    print(f"  ✗ Failed to get details: {detail_response.status_code}")
        else:
            print("No imported jobs found")
    else:
        print(f"Failed to get jobs: {response.status_code}")

if __name__ == "__main__":
    test_imported_jobs()