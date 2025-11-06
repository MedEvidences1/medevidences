"""
Job aggregator service for importing jobs from multiple sources
Uses jobdata API and JSearch (RapidAPI)
"""
import httpx
import logging
import os
from typing import List, Dict, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class JobAggregatorService:
    """Service for importing jobs from multiple aggregator APIs"""
    
    def __init__(self):
        # jobdata API (free tier available)
        self.jobdata_api_key = os.getenv('JOBDATA_API_KEY', '')
        
        # JSearch via RapidAPI
        self.jsearch_api_key = os.getenv('JSEARCH_RAPIDAPI_KEY', '')
        self.jsearch_host = "jsearch.p.rapidapi.com"
        
        self.timeout = 30.0
    
    async def import_jobs_from_all_sources(self, keywords: str = "medical research") -> Dict:
        """Import jobs from all available sources"""
        results = {
            'jobdata': {'jobs': [], 'count': 0, 'success': False},
            'jsearch': {'jobs': [], 'count': 0, 'success': False}
        }
        
        # Try jobdata API
        if self.jobdata_api_key:
            try:
                jobdata_jobs = await self.import_from_jobdata(keywords)
                results['jobdata']['jobs'] = jobdata_jobs
                results['jobdata']['count'] = len(jobdata_jobs)
                results['jobdata']['success'] = True
            except Exception as e:
                logger.error(f"jobdata API error: {e}")
        else:
            logger.warning("JOBDATA_API_KEY not configured - skipping jobdata import")
        
        # Try JSearch API
        if self.jsearch_api_key:
            try:
                jsearch_jobs = await self.import_from_jsearch(keywords)
                results['jsearch']['jobs'] = jsearch_jobs
                results['jsearch']['count'] = len(jsearch_jobs)
                results['jsearch']['success'] = True
            except Exception as e:
                logger.error(f"JSearch API error: {e}")
        else:
            logger.warning("JSEARCH_RAPIDAPI_KEY not configured - skipping JSearch import")
        
        return results
    
    async def import_from_jobdata(self, keywords: str = "medical", limit: int = 50) -> List[Dict]:
        """Import jobs from jobdata API"""
        url = "https://jobdataapi.com/api/jobs/"
        
        headers = {
            "Authorization": f"Api-Key {self.jobdata_api_key}"
        }
        
        params = {
            "title": keywords,
            "limit": limit
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            raw_jobs = data.get('data', [])
            normalized_jobs = [self._normalize_jobdata_job(job) for job in raw_jobs]
            
            logger.info(f"Imported {len(normalized_jobs)} jobs from jobdata API")
            return normalized_jobs
    
    async def import_from_jsearch(self, query: str = "medical research", num_pages: int = 1) -> List[Dict]:
        """Import jobs from JSearch API (via RapidAPI)"""
        url = "https://jsearch.p.rapidapi.com/search"
        
        headers = {
            "x-rapidapi-key": self.jsearch_api_key,
            "x-rapidapi-host": self.jsearch_host
        }
        
        params = {
            "query": query,
            "page": "1",
            "num_pages": str(num_pages)
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            raw_jobs = data.get('data', [])
            normalized_jobs = [self._normalize_jsearch_job(job) for job in raw_jobs]
            
            logger.info(f"Imported {len(normalized_jobs)} jobs from JSearch API")
            return normalized_jobs
    
    def _normalize_jobdata_job(self, raw_job: Dict) -> Dict:
        """Normalize jobdata API response to standard format"""
        return {
            'external_id': str(raw_job.get('id', '')),
            'source': 'jobdata',
            'title': raw_job.get('title', ''),
            'description': raw_job.get('description', ''),
            'company_name': raw_job.get('company', ''),
            'company_website': raw_job.get('company_url', ''),
            'location': raw_job.get('location', 'Remote'),
            'country': raw_job.get('country', 'USA'),
            'is_remote': raw_job.get('remote', False),
            'job_type': raw_job.get('employment_type', 'Full-time'),
            'salary_range': self._extract_salary(raw_job),
            'category': self._categorize_job(raw_job.get('title', '')),
            'apply_url': raw_job.get('url', ''),
            'posted_date': raw_job.get('date_posted'),
        }
    
    def _normalize_jsearch_job(self, raw_job: Dict) -> Dict:
        """Normalize JSearch API response to standard format"""
        salary_min = raw_job.get('job_min_salary')
        salary_max = raw_job.get('job_max_salary')
        salary_currency = raw_job.get('job_salary_currency', 'USD')
        
        salary_range = None
        if salary_min and salary_max:
            salary_range = f"${salary_min:,} - ${salary_max:,} {salary_currency}"
        elif salary_min:
            salary_range = f"${salary_min:,}+ {salary_currency}"
        
        return {
            'external_id': str(raw_job.get('job_id', '')),
            'source': 'jsearch',
            'title': raw_job.get('job_title', ''),
            'description': raw_job.get('job_description', ''),
            'company_name': raw_job.get('employer_name', ''),
            'company_website': raw_job.get('employer_website', ''),
            'location': raw_job.get('job_city', 'Remote'),
            'country': raw_job.get('job_country', 'USA'),
            'is_remote': raw_job.get('job_is_remote', False),
            'job_type': raw_job.get('job_employment_type', 'FULLTIME'),
            'salary_range': salary_range,
            'category': self._categorize_job(raw_job.get('job_title', '')),
            'apply_url': raw_job.get('job_apply_link', ''),
            'posted_date': raw_job.get('job_posted_at_datetime_utc'),
        }
    
    def _extract_salary(self, job_data: Dict) -> Optional[str]:
        """Extract and format salary information"""
        # jobdata API may have salary info in different fields
        # This is a placeholder for custom extraction logic
        return None
    
    def _categorize_job(self, title: str) -> str:
        """Categorize job based on title keywords"""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['doctor', 'physician', 'surgeon', 'md']):
            return 'Doctors/Physicians'
        elif any(word in title_lower for word in ['research', 'scientist', 'medical research']):
            return 'Medicine & Medical Research'
        elif any(word in title_lower for word in ['nutrition', 'dietitian', 'nutritionist']):
            return 'Nutrition & Dietetics'
        elif any(word in title_lower for word in ['physics', 'physicist']):
            return 'Physics'
        elif any(word in title_lower for word in ['consult', 'advisor']):
            return 'Consulting'
        elif any(word in title_lower for word in ['teach', 'professor', 'lecturer', 'academic']):
            return 'Teaching & Academia'
        elif any(word in title_lower for word in ['chemistry', 'chemist']):
            return 'Chemistry'
        elif any(word in title_lower for word in ['tutor', 'tutoring']):
            return 'Medical Tutoring'
        elif any(word in title_lower for word in ['behavior', 'psychology', 'psychologist']):
            return 'Behavioral Science'
        elif any(word in title_lower for word in ['math', 'statistics', 'statistician']):
            return 'Mathematics'
        else:
            return 'Scientific Research'
    
    async def search_by_company(self, company_name: str) -> List[Dict]:
        """Search for jobs from a specific company"""
        all_jobs = []
        
        # Try jobdata
        if self.jobdata_api_key:
            try:
                jobs = await self.import_from_jobdata(keywords=company_name, limit=20)
                # Filter by company name
                company_jobs = [j for j in jobs if company_name.lower() in j['company_name'].lower()]
                all_jobs.extend(company_jobs)
            except Exception as e:
                logger.error(f"Error searching jobdata for {company_name}: {e}")
        
        # Try JSearch
        if self.jsearch_api_key:
            try:
                jobs = await self.import_from_jsearch(query=f"{company_name} jobs")
                company_jobs = [j for j in jobs if company_name.lower() in j['company_name'].lower()]
                all_jobs.extend(company_jobs)
            except Exception as e:
                logger.error(f"Error searching JSearch for {company_name}: {e}")
        
        return all_jobs

# Global instance
job_aggregator_service = JobAggregatorService()
