"""Message model — per-incident real-time chat."""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class MessageType(str, enum.Enum):
    text = "text"
    system = "system"       # "Incident status changed to ACTIVE"
    ai_summary = "ai_summary"
    quick_action = "quick_action"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_type = Column(SAEnum(MessageType), default=MessageType.text)

    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender_name = Column(String(255), nullable=True)   # denormalized for speed
    sender_role = Column(String(50), nullable=True)

    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    incident = relationship("Incident", back_populates="messages")
    sender = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message #{self.id} incident={self.incident_id}>"
