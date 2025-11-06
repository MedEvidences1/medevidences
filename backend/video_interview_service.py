# Video Interview Service with OpenAI Whisper
from emergentintegrations.llm.chat import LlmChat, UserMessage
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
import logging
import json
import uuid

load_dotenv()

logger = logging.getLogger(__name__)

class VideoInterviewService:
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
        self.whisper_client = AsyncOpenAI(api_key=self.api_key)
    
    async def transcribe_audio(self, audio_file, language="en"):
        """Transcribe audio file using OpenAI Whisper"""
        try:
            response = await self.whisper_client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-1",
                response_format="verbose_json",
                language=language,
                temperature=0.0
            )
            
            return {
                "text": response.text,
                "duration": getattr(response, 'duration', None),
                "segments": getattr(response, 'segments', []),
                "success": True
            }
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def generate_interview_questions(self, job_description, job_title, num_questions=10):
        """Generate interview questions based on job description + mandatory health questions"""
        try:
            # Fixed mandatory health questions (1-6)
            health_questions = [
                "Can you describe your current workout routine? Please provide specific details about what exercises you do, how many minutes per day, and how many times per week.",
                "Tell us about your food habits and daily nutrition. Please note that you'll need to upload a 2-day calorie report from www.medevidences.com in your candidate profile.",
                "Do you track your gut microbiome health? Please mention if you have a gut microbiome score and be prepared to upload a screenshot from www.medevidences.com with your resume.",
                "Can you describe your current muscle mass and fitness level? Do you engage in strength training?",
                "Are you currently on any medications? Please provide details about any ongoing medical treatments or prescriptions.",
                "Tell us about your sleep habits and daily regularity. How many hours do you sleep per night, and do you maintain a consistent schedule?"
            ]
            
            # Generate job-specific questions (7-10) using AI
            prompt = f"""You are an expert interviewer for a {job_title} position at MedEvidences.com.

Job Description:
{job_description}

Generate EXACTLY 4 job-specific interview questions that assess:
1. Technical knowledge relevant to the {job_title} role
2. Problem-solving abilities in the field
3. Relevant experience and background
4. Cultural fit and motivation for this specific position

Return ONLY a JSON array of exactly 4 questions. Each question should be unique, specific, and relevant to the job. Do NOT repeat questions.

Example format:
[
  "What experience do you have with...",
  "Can you describe a challenging situation...",
  "How would you approach...",
  "What motivates you about..."
]"""
            
            # Use emergentintegrations for chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are an expert HR interviewer. Return only valid JSON array."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # response is just text from emergentintegrations
            questions_text = response
            # Extract JSON array
            start = questions_text.find('[')
            end = questions_text.rfind(']') + 1
            if start != -1 and end > start:
                job_questions = json.loads(questions_text[start:end])
            else:
                job_questions = json.loads(questions_text)
            
            # Ensure we only have 4 job-specific questions
            job_questions = job_questions[:4]
            
            # Combine: 6 health + 4 job-specific = 10 total
            all_questions = health_questions + job_questions
            
            logger.info(f"Generated {len(all_questions)} questions: {len(health_questions)} health + {len(job_questions)} job-specific")
            
            return {"success": True, "questions": all_questions}
        except Exception as e:
            logger.error(f"Question generation error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def analyze_answer(self, question, answer_transcript, job_title):
        """Analyze a single answer"""
        try:
            prompt = f"""Evaluate this interview answer for a {job_title} position.

Question: {question}
Answer: {answer_transcript}

Provide analysis in JSON:
{{
  "score": <0-100>,
  "strengths": ["strength1", "strength2"],
  "areas_to_improve": ["area1", "area2"],
  "relevance": <0-100>,
  "clarity": <0-100>,
  "depth": <0-100>
}}"""
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert interview evaluator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content
            start = analysis_text.find('{')
            end = analysis_text.rfind('}') + 1
            if start != -1 and end > start:
                analysis = json.loads(analysis_text[start:end])
            else:
                analysis = json.loads(analysis_text)
            
            return {"success": True, "analysis": analysis}
        except Exception as e:
            logger.error(f"Answer analysis error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def analyze_complete_interview(self, questions_and_answers, job_title, job_description):
        """Analyze complete interview with all Q&A including health assessment"""
        try:
            qa_text = "\n\n".join([
                f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}"
                for i, qa in enumerate(questions_and_answers)
            ])
            
            # Separate health questions (1-6) and job-specific questions (7-10)
            health_qa = questions_and_answers[:6] if len(questions_and_answers) >= 6 else []
            health_text = "\n\n".join([
                f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}"
                for i, qa in enumerate(health_qa)
            ]) if health_qa else "No health responses"
            
            prompt = f"""Analyze this complete interview for a {job_title} position at MedEvidences.com.

Job Description:
{job_description}

Interview Transcript:
{qa_text}

Provide comprehensive analysis in JSON with TWO sections:

1. OVERALL INTERVIEW ANALYSIS:
{{
  "overall_score": <0-100>,
  "communication_score": <0-100>,
  "technical_knowledge_score": <0-100>,
  "problem_solving_score": <0-100>,
  "confidence_score": <0-100>,
  "job_fit_score": <0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "key_insights": ["insight1", "insight2", "insight3"],
  "recommendation": "Highly Recommended|Recommended|Consider with Caution|Not Recommended",
  "reasoning": "<detailed explanation>",
  "hire_decision": "Strong Yes|Yes|Maybe|No|Strong No"
}}

2. HEALTH & WELLNESS ANALYSIS (Based on Questions 1-6):
{{
  "health_score": "Excellent|Good|Bad",
  "health_analysis": {{
    "exercise_routine": {{
      "assessment": "<detailed assessment>",
      "score": <0-100>,
      "frequency": "<times per week>",
      "duration": "<minutes per session>",
      "regularity": "Excellent|Good|Poor"
    }},
    "nutrition": {{
      "assessment": "<detailed assessment>",
      "calorie_tracking": "Yes|No|Not Mentioned",
      "diet_quality": "Excellent|Good|Poor",
      "score": <0-100>
    }},
    "gut_health": {{
      "microbiome_tracked": "Yes|No|Not Mentioned",
      "assessment": "<detailed assessment>",
      "score": <0-100>
    }},
    "muscle_fitness": {{
      "assessment": "<detailed assessment>",
      "strength_training": "Yes|No|Not Mentioned",
      "score": <0-100>
    }},
    "medications": {{
      "status": "Yes|No|Not Mentioned",
      "details": "<details if any>",
      "impact_assessment": "<assessment>"
    }},
    "sleep_habits": {{
      "assessment": "<based on regularity mentioned>",
      "score": <0-100>
    }},
    "overall_wellness_score": <0-100>,
    "key_strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"],
    "health_recommendation": "<detailed recommendation>"
  }}
}}

Health Score Criteria:
- "Excellent": Regular exercise (4+ times/week, 30+ min), good nutrition tracking, gut health monitoring, strength training, no major medications, good sleep habits
- "Good": Moderate exercise (2-3 times/week), some health tracking, general fitness awareness
- "Bad": Irregular exercise, poor nutrition, no health tracking, sedentary lifestyle

Be thorough, professional, and specific in your assessments."""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are a senior hiring manager, expert interviewer, and wellness consultant for medical professionals."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            analysis_text = response
            start = analysis_text.find('{')
            end = analysis_text.rfind('}') + 1
            if start != -1 and end > start:
                analysis = json.loads(analysis_text[start:end])
            else:
                analysis = json.loads(analysis_text)
            
            return {"success": True, "analysis": analysis}
        except Exception as e:
            logger.error(f"Complete analysis error: {str(e)}")
            return {"success": False, "error": str(e)}
