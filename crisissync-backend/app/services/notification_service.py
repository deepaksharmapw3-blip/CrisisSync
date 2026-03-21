"""Notification service — email + in-app notifications."""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Handles sending notifications via email (SendGrid) and
    in-app via WebSocket broadcasts.
    Extend with push notifications (FCM/APNs) as needed.
    """

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
    ) -> bool:
        """Send an email via SendGrid."""
        from app.core.config import settings

        if not settings.SENDGRID_API_KEY:
            logger.warning(f"Email not configured. Would send to {to_email}: {subject}")
            return False

        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail

            sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
            message = Mail(
                from_email=settings.FROM_EMAIL,
                to_emails=to_email,
                subject=subject,
                html_content=body_html,
            )
            sg.send(message)
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False

    async def notify_incident_created(self, incident_id: int, location: str, type: str):
        """Compose and send new incident email to managers."""
        subject = f"🚨 New {type.upper()} Incident — {location}"
        body = f"""
        <h2>New Emergency Incident Reported</h2>
        <p><strong>Type:</strong> {type.capitalize()}</p>
        <p><strong>Location:</strong> {location}</p>
        <p><a href="https://crisissync.app/dashboard">View Dashboard →</a></p>
        """
        logger.info(f"[Notification] Incident #{incident_id} created at {location}")
        # In production: fetch manager emails from DB and send
