"""
Enhanced AI Matching and Scoring Service for MedEvidences.com
Industry-specific vetting, better candidate scoring, detailed matching criteria
"""
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
import logging
from typing import Dict, List, Optional
import uuid

logger = logging.getLogger(__name__)

class AIMatchingService:
    """Advanced AI service for candidate-job matching and scoring"""
    
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
    
    def _get_industry_specific_criteria(self, category: str) -> Dict:
        """Get industry-specific evaluation criteria"""
        criteria_map = {
            'Doctors/Physicians': {
                'required_skills': ['Clinical Experience', 'Patient Care', 'Medical Knowledge', 'Board Certification'],
                'key_traits': ['Empathy', 'Decision Making', 'Communication', 'Ethical Judgment'],
                'weight_experience': 40,
                'weight_skills': 30,
                'weight_education': 20,
                'weight_soft_skills': 10
            },
            'Medicine & Medical Research': {
                'required_skills': ['Research Methodology', 'Data Analysis', 'Publication Record', 'Lab Techniques'],
                'key_traits': ['Analytical Thinking', 'Attention to Detail', 'Collaboration', 'Innovation'],
                'weight_experience': 30,
                'weight_skills': 35,
                'weight_education': 25,
                'weight_soft_skills': 10
            },
            'Scientific Research': {
                'required_skills': ['Experimental Design', 'Statistical Analysis', 'Technical Writing', 'Literature Review'],
                'key_traits': ['Critical Thinking', 'Curiosity', 'Problem Solving', 'Persistence'],
                'weight_experience': 30,
                'weight_skills': 35,
                'weight_education': 25,
                'weight_soft_skills': 10
            },
            'Nutrition & Dietetics': {
                'required_skills': ['Nutritional Assessment', 'Meal Planning', 'Client Counseling', 'Evidence-Based Practice'],
                'key_traits': ['Interpersonal Skills', 'Cultural Sensitivity', 'Motivational Skills', 'Adaptability'],
                'weight_experience': 35,
                'weight_skills': 30,
                'weight_education': 20,
                'weight_soft_skills': 15
            },
            'Teaching & Academia': {
                'required_skills': ['Curriculum Development', 'Lecturing', 'Research', 'Mentoring'],
                'key_traits': ['Communication', 'Patience', 'Leadership', 'Subject Expertise'],
                'weight_experience': 30,
                'weight_skills': 25,
                'weight_education': 30,
                'weight_soft_skills': 15
            }
        }
        
        # Default criteria for unlisted categories
        return criteria_map.get(category, {
            'required_skills': ['Domain Knowledge', 'Technical Skills', 'Problem Solving'],
            'key_traits': ['Communication', 'Teamwork', 'Adaptability'],
            'weight_experience': 35,
            'weight_skills': 30,
            'weight_education': 20,
            'weight_soft_skills': 15
        })
    
    async def generate_industry_specific_questions(
        self, 
        job_title: str, 
        job_category: str,
        job_description: str,
        num_questions: int = 6
    ) -> List[str]:
        """Generate industry-specific interview questions"""
        
        criteria = self._get_industry_specific_criteria(job_category)
        
        prompt = f"""You are an expert interviewer specializing in {job_category} roles.

Job Title: {job_title}
Category: {job_category}
Description: {job_description}

Key Skills to Assess: {', '.join(criteria['required_skills'])}
Important Traits: {', '.join(criteria['key_traits'])}

Generate EXACTLY {num_questions} highly specific interview questions for this role that assess:
1. Technical competency in {job_category}
2. Relevant experience with similar challenges
3. Problem-solving in {job_category} contexts
4. Cultural fit and motivation
5. Industry-specific knowledge
6. Real-world application of skills

Requirements:
- Questions must be specific to {job_category}
- Include scenario-based questions
- Test both technical and soft skills
- Be clear and professional
- Avoid generic questions

Return ONLY a JSON array of exactly {num_questions} questions:
["Question 1...", "Question 2...", ...]"""
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message=f"You are an expert {job_category} interviewer. Return only valid JSON."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Extract JSON array
            questions_text = response
            start = questions_text.find('[')
            end = questions_text.rfind(']') + 1
            if start != -1 and end > start:
                questions = json.loads(questions_text[start:end])
            else:
                questions = json.loads(questions_text)
            
            return questions[:num_questions]
            
        except Exception as e:
            logger.error(f"Error generating industry questions: {e}")
            return []
    
    async def calculate_enhanced_match_score(
        self,
        candidate_profile: Dict,
        job: Dict,
        interview_analysis: Optional[Dict] = None
    ) -> Dict:
        """Calculate comprehensive match score with detailed breakdown"""
        
        category = job.get('category', 'Scientific Research')
        criteria = self._get_industry_specific_criteria(category)
        
        prompt = f"""Analyze the match between this candidate and job position.

CANDIDATE PROFILE:
- Specialization: {candidate_profile.get('specialization', 'Not specified')}
- Experience: {candidate_profile.get('experience_years', 0)} years
- Skills: {', '.join(candidate_profile.get('skills', []))}
- Education: {candidate_profile.get('education', 'Not specified')}
- Bio: {candidate_profile.get('bio', 'Not provided')}
- AI Vetting Score: {candidate_profile.get('ai_vetting_score', 'N/A')}
- Health Score: {candidate_profile.get('health_score', 'N/A')}

JOB REQUIREMENTS:
- Title: {job.get('title', '')}
- Category: {category}
- Description: {job.get('description', '')}
- Skills Required: {', '.join(job.get('skills_required', []))}
- Experience Required: {job.get('experience_required', 'Not specified')}

INDUSTRY-SPECIFIC CRITERIA FOR {category}:
- Required Skills: {', '.join(criteria['required_skills'])}
- Key Traits: {', '.join(criteria['key_traits'])}

SCORING WEIGHTS:
- Experience: {criteria['weight_experience']}%
- Skills: {criteria['weight_skills']}%
- Education: {criteria['weight_education']}%
- Soft Skills: {criteria['weight_soft_skills']}%

Provide a comprehensive match analysis in JSON format:
{{
  "overall_match_score": <0-100>,
  "experience_match": {{
    "score": <0-100>,
    "years_match": "<exact/close/below>",
    "relevant_experience": "<assessment>",
    "industry_fit": "<assessment>"
  }},
  "skills_match": {{
    "score": <0-100>,
    "matched_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2"],
    "transferable_skills": ["skill1", "skill2"],
    "skill_gap_severity": "<low/medium/high>"
  }},
  "education_match": {{
    "score": <0-100>,
    "qualification_level": "<assessment>",
    "relevance": "<assessment>"
  }},
  "soft_skills_assessment": {{
    "score": <0-100>,
    "communication": <0-100>,
    "leadership": <0-100>,
    "teamwork": <0-100>,
    "adaptability": <0-100>
  }},
  "health_wellness_factor": {{
    "score": <0-100>,
    "health_score": "{candidate_profile.get('health_score', 'Not assessed')}",
    "impact_on_performance": "<positive/neutral/concern>",
    "notes": "<assessment>"
  }},
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "Highly Recommended|Recommended|Consider|Not Recommended",
  "reasoning": "<detailed explanation>",
  "interview_priority": "High|Medium|Low",
  "estimated_success_probability": <0-100>
}}

Be thorough and specific to {category}."""
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are an expert talent acquisition AI specializing in medical and scientific recruitment."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Extract JSON
            analysis_text = response
            start = analysis_text.find('{')
            end = analysis_text.rfind('}') + 1
            if start != -1 and end > start:
                analysis = json.loads(analysis_text[start:end])
            else:
                analysis = json.loads(analysis_text)
            
            # Add interview analysis if available
            if interview_analysis:
                analysis['interview_results'] = {
                    'overall_score': interview_analysis.get('overall_score', 0),
                    'recommendation': interview_analysis.get('recommendation', 'Pending'),
                    'key_insights': interview_analysis.get('key_insights', [])
                }
            
            return {"success": True, "analysis": analysis}
            
        except Exception as e:
            logger.error(f"Error calculating match score: {e}")
            return {"success": False, "error": str(e)}
    
    async def generate_personalized_feedback(
        self,
        candidate_profile: Dict,
        match_analysis: Dict
    ) -> str:
        """Generate personalized feedback for candidate"""
        
        prompt = f"""Create personalized career feedback for this candidate.

CANDIDATE:
- Specialization: {candidate_profile.get('specialization', '')}
- Experience: {candidate_profile.get('experience_years', 0)} years
- Current AI Score: {candidate_profile.get('ai_vetting_score', 'Not assessed')}

MATCH ANALYSIS:
- Overall Score: {match_analysis.get('overall_match_score', 0)}/100
- Strengths: {', '.join(match_analysis.get('strengths', []))}
- Concerns: {', '.join(match_analysis.get('concerns', []))}
- Missing Skills: {', '.join(match_analysis.get('skills_match', {}).get('missing_skills', []))}

Generate encouraging, constructive feedback (200-300 words) that:
1. Acknowledges their strengths
2. Provides specific skill development suggestions
3. Recommends courses or certifications
4. Gives interview preparation tips
5. Maintains a positive, professional tone

Return only the feedback text."""
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are a career coach for medical and scientific professionals."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            feedback = await chat.send_message(user_message)
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error generating feedback: {e}")
            return "We're currently unable to generate personalized feedback. Please try again later."

# Global instance
ai_matching_service = AIMatchingService()
