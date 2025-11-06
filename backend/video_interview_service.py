# Video Interview Service with OpenAI Whisper
from emergentintegrations.llm.openai import OpenAISpeechToText
import os
from dotenv import load_dotenv
import logging
import json

load_dotenv()

logger = logging.getLogger(__name__)

class VideoInterviewService:
    def __init__(self):
        self.stt = OpenAISpeechToText(api_key=os.getenv("EMERGENT_LLM_KEY"))
    
    async def transcribe_audio(self, audio_file, language="en"):
        """Transcribe audio file using OpenAI Whisper"""
        try:
            response = await self.stt.transcribe(
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
    
    async def analyze_interview_transcript(self, transcript, specialization, openai_client):
        """Analyze interview transcript using GPT-4o for AI vetting"""
        try:
            prompt = f"""Analyze this job interview transcript for a {specialization} position.

Transcript:
{transcript}

Provide a comprehensive analysis in JSON format:
{{
  "overall_score": <0-100>,
  "communication_score": <0-100>,
  "technical_knowledge_score": <0-100>,
  "problem_solving_score": <0-100>,
  "confidence_score": <0-100>,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "key_insights": ["insight1", "insight2", ...],
  "recommendation": "Highly Recommended|Recommended|Consider with Caution|Not Recommended",
  "reasoning": "<detailed explanation>"
}}

Be specific and professional."""
            
            response = await openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert HR interviewer and talent assessor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content
            # Extract JSON from response
            start = analysis_text.find('{')
            end = analysis_text.rfind('}') + 1
            if start != -1 and end > start:
                analysis = json.loads(analysis_text[start:end])
            else:
                analysis = json.loads(analysis_text)
            
            return {"success": True, "analysis": analysis}
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return {"success": False, "error": str(e)}
