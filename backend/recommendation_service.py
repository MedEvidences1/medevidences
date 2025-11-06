"""
Smart Candidate Recommendation Service for Employers
Recommends top candidates based on job requirements and candidate profiles
"""
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
import logging
from typing import Dict, List
import uuid

logger = logging.getLogger(__name__)

class RecommendationService:
    """Service for recommending candidates to employers"""
    
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
    
    async def get_top_candidates_for_job(
        self,
        job: Dict,
        all_candidates: List[Dict],
        top_n: int = 10
    ) -> List[Dict]:
        """Get top N candidates for a specific job using AI ranking"""
        
        if not all_candidates:
            return []
        
        # Pre-filter candidates
        filtered_candidates = self._pre_filter_candidates(job, all_candidates)
        
        if not filtered_candidates:
            return []
        
        # Batch candidates for AI analysis (max 20 at a time for performance)
        batch_size = min(20, len(filtered_candidates))
        candidate_batch = filtered_candidates[:batch_size]
        
        # Get AI rankings
        rankings = await self._rank_candidates_with_ai(job, candidate_batch)
        
        # Sort by score and return top N
        sorted_candidates = sorted(rankings, key=lambda x: x['match_score'], reverse=True)
        return sorted_candidates[:top_n]
    
    def _pre_filter_candidates(self, job: Dict, candidates: List[Dict]) -> List[Dict]:
        """Pre-filter candidates based on basic criteria"""
        filtered = []
        
        job_category = job.get('category', '').lower()
        required_experience = job.get('experience_required', '0')
        
        # Extract experience years from string (e.g., "5+ years" -> 5)
        try:
            exp_required = int(''.join(filter(str.isdigit, str(required_experience))) or '0')
        except:
            exp_required = 0
        
        for candidate in candidates:
            # Filter by specialization match
            specialization = candidate.get('specialization', '').lower()
            if not any(word in specialization for word in ['medical', 'research', 'science', 'clinical', 'health']):
                continue
            
            # Filter by minimum experience (allow 80% of required)
            candidate_exp = candidate.get('experience_years', 0)
            if exp_required > 0 and candidate_exp < (exp_required * 0.8):
                continue
            
            # Filter by profile completion
            if not candidate.get('bio') or not candidate.get('skills'):
                continue
            
            # Must have completed interview or have AI vetting score
            if not candidate.get('interview_completed') and not candidate.get('ai_vetting_score'):
                continue
            
            filtered.append(candidate)
        
        return filtered
    
    async def _rank_candidates_with_ai(
        self,
        job: Dict,
        candidates: List[Dict]
    ) -> List[Dict]:
        """Rank candidates using AI analysis"""
        
        # Prepare candidate summaries
        candidate_summaries = []
        for i, candidate in enumerate(candidates):
            summary = {
                'id': candidate.get('id'),
                'index': i,
                'specialization': candidate.get('specialization', 'Not specified'),
                'experience_years': candidate.get('experience_years', 0),
                'skills': ', '.join(candidate.get('skills', [])[:10]),  # Limit to 10 skills
                'education': candidate.get('education', 'Not specified'),
                'ai_score': candidate.get('ai_vetting_score', 0),
                'health_score': candidate.get('health_score', 'N/A'),
                'interview_completed': candidate.get('interview_completed', False)
            }
            candidate_summaries.append(summary)
        
        prompt = f"""Rank these {len(candidates)} candidates for the following job position.

JOB DETAILS:
Title: {job.get('title')}
Category: {job.get('category')}
Description: {job.get('description', '')[:500]}...
Experience Required: {job.get('experience_required', 'Not specified')}
Skills Required: {', '.join(job.get('skills_required', []))}

CANDIDATES:
{json.dumps(candidate_summaries, indent=2)}

Analyze each candidate and provide a match score (0-100) based on:
1. Specialization relevance (30%)
2. Experience level (25%)
3. Skills match (25%)
4. AI vetting score (10%)
5. Health & wellness (5%)
6. Education relevance (5%)

Return ONLY a JSON array with rankings:
[
  {{
    "candidate_index": 0,
    "match_score": 95,
    "ranking_reason": "Brief 1-sentence reason"
  }},
  ...
]

Order by match_score descending."""
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are an expert talent matching AI for medical/scientific recruitment."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Extract JSON
            rankings_text = response
            start = rankings_text.find('[')
            end = rankings_text.rfind(']') + 1
            if start != -1 and end > start:
                rankings = json.loads(rankings_text[start:end])
            else:
                rankings = json.loads(rankings_text)
            
            # Merge rankings with candidate data
            result = []
            for ranking in rankings:
                idx = ranking['candidate_index']
                if 0 <= idx < len(candidates):
                    candidate_data = candidates[idx].copy()
                    candidate_data['match_score'] = ranking['match_score']
                    candidate_data['ranking_reason'] = ranking['ranking_reason']
                    result.append(candidate_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error ranking candidates: {e}")
            # Fallback: simple scoring
            return self._fallback_ranking(job, candidates)
    
    def _fallback_ranking(self, job: Dict, candidates: List[Dict]) -> List[Dict]:
        """Fallback ranking based on simple criteria"""
        for candidate in candidates:
            score = 0
            
            # Experience match
            exp_years = candidate.get('experience_years', 0)
            if exp_years >= 5:
                score += 30
            elif exp_years >= 3:
                score += 20
            elif exp_years >= 1:
                score += 10
            
            # AI vetting score
            ai_score = candidate.get('ai_vetting_score', 0)
            score += min(30, ai_score * 0.3)
            
            # Skills
            if candidate.get('skills'):
                score += min(20, len(candidate.get('skills', [])) * 2)
            
            # Interview completed
            if candidate.get('interview_completed'):
                score += 20
            
            candidate['match_score'] = int(score)
            candidate['ranking_reason'] = 'Matched based on experience and skills'
        
        return candidates

# Global instance
recommendation_service = RecommendationService()
