"""
Email service using SendGrid for MedEvidences.com
"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending notifications via SendGrid"""
    
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@medevidences.com')
        self.client = None
        
        if self.api_key:
            try:
                self.client = SendGridAPIClient(self.api_key)
                logger.info("SendGrid client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid client: {e}")
        else:
            logger.warning("SENDGRID_API_KEY not found - emails will be mocked")
    
    def _send_email(self, to_email: str, subject: str, html_content: str, plain_content: Optional[str] = None) -> bool:
        """Internal method to send email"""
        if not self.client:
            logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}")
            return True
        
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_content or ""
            )
            
            response = self.client.send(message)
            logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
            return response.status_code in [200, 202]
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_subscription_confirmation(self, to_email: str, plan_name: str, expiry_date: str) -> bool:
        """Send subscription confirmation email"""
        subject = f"Welcome to MedEvidences.com - {plan_name} Plan Activated"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">🎉 Your Subscription is Active!</h2>
                    
                    <p>Thank you for subscribing to MedEvidences.com!</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Plan:</strong> {plan_name}</p>
                        <p><strong>Status:</strong> Active</p>
                        <p><strong>Valid Until:</strong> {expiry_date}</p>
                    </div>
                    
                    <p>You can now:</p>
                    <ul>
                        <li>Apply to unlimited medical and scientific jobs</li>
                        <li>Complete AI-powered video interviews</li>
                        <li>Upload your health screening documents</li>
                        <li>Get matched with top employers</li>
                    </ul>
                    
                    <p>
                        <a href="https://medevidences.com/jobs" 
                           style="display: inline-block; background-color: #2563eb; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            Browse Jobs Now
                        </a>
                    </p>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        Need help? Contact us at support@medevidences.com
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_content)
    
    def send_application_notification_to_employer(
        self, 
        employer_email: str, 
        candidate_name: str, 
        job_title: str,
        candidate_email: str,
        cover_letter: Optional[str] = None
    ) -> bool:
        """Notify employer about new job application"""
        subject = f"New Application for {job_title}"
        
        cover_letter_section = ""
        if cover_letter:
            cover_letter_section = f"""
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <h4>Cover Letter:</h4>
                <p>{cover_letter}</p>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">📋 New Job Application Received</h2>
                    
                    <p>A candidate has applied for your position: <strong>{job_title}</strong></p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Candidate:</strong> {candidate_name}</p>
                        <p><strong>Email:</strong> {candidate_email}</p>
                    </div>
                    
                    {cover_letter_section}
                    
                    <p>
                        <a href="https://medevidences.com/received-applications" 
                           style="display: inline-block; background-color: #2563eb; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            View Application
                        </a>
                    </p>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        Log in to your MedEvidences.com dashboard to review the full application, 
                        view the candidate's profile, resume, and AI interview results.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(employer_email, subject, html_content)
    
    def send_job_offer_notification(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        company_name: str,
        salary_offered: str
    ) -> bool:
        """Notify candidate about job offer"""
        subject = f"🎉 Job Offer from {company_name}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">🎉 Congratulations, {candidate_name}!</h2>
                    
                    <p>You've received a job offer from <strong>{company_name}</strong>!</p>
                    
                    <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <p><strong>Position:</strong> {job_title}</p>
                        <p><strong>Company:</strong> {company_name}</p>
                        <p><strong>Offered Salary:</strong> {salary_offered}</p>
                    </div>
                    
                    <p>
                        <a href="https://medevidences.com/job-offers" 
                           style="display: inline-block; background-color: #10b981; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            View Offer Details
                        </a>
                    </p>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        Log in to your MedEvidences.com dashboard to view the complete offer details 
                        and respond to the employer.
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(candidate_email, subject, html_content)
    
    def send_application_status_update(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        new_status: str
    ) -> bool:
        """Notify candidate about application status change"""
        status_colors = {
            'reviewed': '#3b82f6',
            'shortlisted': '#10b981',
            'rejected': '#ef4444',
            'accepted': '#059669'
        }
        
        status_messages = {
            'reviewed': 'Your application has been reviewed by the employer.',
            'shortlisted': 'Great news! You\'ve been shortlisted for the next round.',
            'rejected': 'Thank you for your interest. Unfortunately, the employer has decided to move forward with other candidates.',
            'accepted': 'Congratulations! Your application has been accepted!'
        }
        
        color = status_colors.get(new_status, '#6b7280')
        message = status_messages.get(new_status, f'Your application status has been updated to: {new_status}')
        
        subject = f"Application Update: {job_title}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: {color};">Application Status Update</h2>
                    
                    <p>Hi {candidate_name},</p>
                    
                    <p>{message}</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {color};">
                        <p><strong>Position:</strong> {job_title}</p>
                        <p><strong>Status:</strong> {new_status.title()}</p>
                    </div>
                    
                    <p>
                        <a href="https://medevidences.com/my-applications" 
                           style="display: inline-block; background-color: {color}; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                            View Application
                        </a>
                    </p>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                        Keep applying to more positions on MedEvidences.com to increase your chances!
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self._send_email(candidate_email, subject, html_content)

# Global email service instance
email_service = EmailService()
