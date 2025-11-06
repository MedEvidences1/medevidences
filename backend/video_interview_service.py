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
    
    async def generate_interview_questions(self, job_description, job_title, num_questions=5):
        """Generate interview questions based on job description"""
        try:
            prompt = f"""You are an expert interviewer for a {job_title} position.

Job Description:
{job_description}

Generate {num_questions} interview questions that assess:
1. Technical knowledge relevant to the role
2. Problem-solving abilities
3. Experience and background
4. Communication skills
5. Cultural fit and motivation

Return ONLY a JSON array of questions:
[
  "Question 1 text here",
  "Question 2 text here",
  ...
]

Make questions specific to the job description provided."""
            
            # Use emergentintegrations for chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=str(uuid.uuid4()),
                system_message="You are an expert HR interviewer."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # response is just text from emergentintegrations
            questions_text = response
            # Extract JSON array
            start = questions_text.find('[')
            end = questions_text.rfind(']') + 1
            if start != -1 and end > start:
                questions = json.loads(questions_text[start:end])
            else:
                questions = json.loads(questions_text)
            
            return {"success": True, "questions": questions}
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
        """Analyze complete interview with all Q&A"""
        try:
            qa_text = "\n\n".join([
                f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}"
                for i, qa in enumerate(questions_and_answers)
            ])
            
            prompt = f"""Analyze this complete interview for a {job_title} position.

Job Description:
{job_description}

Interview Transcript:
{qa_text}

Provide comprehensive analysis in JSON:
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

Be thorough and professional."""
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a senior hiring manager and expert interviewer."},
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
            logger.error(f"Complete analysis error: {str(e)}")
            return {"success": False, "error": str(e)}
