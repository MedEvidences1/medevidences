# Job Crawler Service using Apify
import os
import logging
from datetime import datetime, timezone
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class JobCrawlerService:
    def __init__(self):
        self.apify_token = os.getenv('APIFY_API_TOKEN')
        if not self.apify_token:
            raise ValueError("APIFY_API_TOKEN not found in environment")
        
        self.client = ApifyClient(self.apify_token)
    
    async def scrape_github_jobs(self, keywords=None, limit=50):
        """Scrape jobs from GitHub"""
        try:
            logger.info(f"Scraping GitHub jobs with keywords: {keywords}")
            
            # Use GitHub scraper actor
            run_input = {
                "queries": keywords or ["medical researcher", "healthcare", "physician"],
                "maxItems": limit,
                "proxyConfiguration": {"useApifyProxy": True}
            }
            
            # Run the actor
            run = self.client.actor("apify/github-jobs-scraper").call(run_input=run_input)
            
            # Fetch results
            results = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                job = self._normalize_github_job(item)
                if job:
                    results.append(job)
            
            logger.info(f"Scraped {len(results)} jobs from GitHub")
            return {"success": True, "jobs": results, "source": "GitHub"}
            
        except Exception as e:
            logger.error(f"GitHub scraping error: {str(e)}")
            return {"success": False, "error": str(e), "jobs": []}
    
    async def scrape_linkedin_jobs(self, keywords=None, location=None, limit=50):
        """Scrape jobs from LinkedIn"""
        try:
            logger.info(f"Scraping LinkedIn jobs: {keywords}, location: {location}")
            
            # Use LinkedIn Jobs scraper
            run_input = {
                "keywords": keywords or ["medical", "healthcare", "physician"],
                "location": location or "United States",
                "maxItems": limit,
                "proxyConfiguration": {"useApifyProxy": True}
            }
            
            run = self.client.actor("apify/linkedin-jobs-scraper").call(run_input=run_input)
            
            results = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                job = self._normalize_linkedin_job(item)
                if job:
                    results.append(job)
            
            logger.info(f"Scraped {len(results)} jobs from LinkedIn")
            return {"success": True, "jobs": results, "source": "LinkedIn"}
            
        except Exception as e:
            logger.error(f"LinkedIn scraping error: {str(e)}")
            return {"success": False, "error": str(e), "jobs": []}
    
    async def scrape_twitter_jobs(self, hashtags=None, limit=50):
        """Scrape job postings from Twitter"""
        try:
            logger.info(f"Scraping Twitter jobs with hashtags: {hashtags}")
            
            # Use Twitter scraper for job hashtags
            run_input = {
                "searchTerms": hashtags or ["#medicaljobs", "#healthcarejobs", "#hiring"],
                "maxTweets": limit,
                "proxyConfiguration": {"useApifyProxy": True}
            }
            
            run = self.client.actor("apify/twitter-scraper").call(run_input=run_input)
            
            results = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                job = self._normalize_twitter_job(item)
                if job:
                    results.append(job)
            
            logger.info(f"Scraped {len(results)} job posts from Twitter")
            return {"success": True, "jobs": results, "source": "Twitter"}
            
        except Exception as e:
            logger.error(f"Twitter scraping error: {str(e)}")
            return {"success": False, "error": str(e), "jobs": []}
    
    async def scrape_portfolio_website(self, url):
        """Scrape candidate info from portfolio website"""
        try:
            logger.info(f"Scraping portfolio: {url}")
            
            # Use web scraper
            run_input = {
                "startUrls": [{"url": url}],
                "linkSelector": "a[href]",
                "pageFunction": """
                async function pageFunction(context) {
                    const $ = context.jQuery;
                    return {
                        title: $('title').text(),
                        content: $('body').text().substring(0, 5000),
                        skills: $('li, .skill, .technology').text(),
                        contact: $('a[href^="mailto:"]').attr('href')
                    };
                }
                """,
                "maxRequestsPerCrawl": 5
            }
            
            run = self.client.actor("apify/web-scraper").call(run_input=run_input)
            
            results = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                results.append(item)
            
            return {"success": True, "data": results}
            
        except Exception as e:
            logger.error(f"Portfolio scraping error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _normalize_github_job(self, item):
        """Normalize GitHub job data"""
        try:
            return {
                "title": item.get("title", ""),
                "company": item.get("company", ""),
                "location": item.get("location", "Remote"),
                "description": item.get("description", ""),
                "url": item.get("url", ""),
                "posted_date": item.get("created_at", datetime.now(timezone.utc).isoformat()),
                "job_type": item.get("type", "Full-time"),
                "salary": item.get("salary_range"),
                "source": "GitHub",
                "scraped_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Error normalizing GitHub job: {str(e)}")
            return None
    
    def _normalize_linkedin_job(self, item):
        """Normalize LinkedIn job data"""
        try:
            return {
                "title": item.get("title", ""),
                "company": item.get("company", {}).get("name", ""),
                "location": item.get("location", "Remote"),
                "description": item.get("description", ""),
                "url": item.get("link", ""),
                "posted_date": item.get("listedAt", datetime.now(timezone.utc).isoformat()),
                "job_type": item.get("employmentType", "Full-time"),
                "salary": None,
                "source": "LinkedIn",
                "scraped_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Error normalizing LinkedIn job: {str(e)}")
            return None
    
    def _normalize_twitter_job(self, item):
        """Extract job info from Twitter post"""
        try:
            text = item.get("text", "")
            
            # Simple extraction (can be enhanced with GPT)
            return {
                "title": text[:100],  # First 100 chars as title
                "company": item.get("author", {}).get("userName", ""),
                "location": "Remote",
                "description": text,
                "url": item.get("url", ""),
                "posted_date": item.get("createdAt", datetime.now(timezone.utc).isoformat()),
                "job_type": "Full-time",
                "salary": None,
                "source": "Twitter",
                "scraped_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Error normalizing Twitter job: {str(e)}")
            return None
