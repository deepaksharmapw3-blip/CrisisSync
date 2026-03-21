"""Push / in-app notification model."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    incident_new = "incident_new"
    incident_assigned = "incident_assigned"
    incident_updated = "incident_updated"
    incident_resolved = "incident_resolved"
    message_received = "message_received"
    system_alert = "system_alert"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)

    notification_type = Column(SAEnum(NotificationType))
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    incident = relationship("Incident", back_populates="notifications")
