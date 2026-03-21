"""User model — guests, staff, responders, managers."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    guest = "guest"
    staff = "staff"
    responder = "responder"
    manager = "manager"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.staff, nullable=False)
    property_name = Column(String(255), nullable=True)   # hotel / venue name
    department = Column(String(100), nullable=True)       # "Security", "Medical", etc.
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_on_duty = Column(Boolean, default=False)           # responder on-duty flag
    preferred_language = Column(String(10), default="en")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    assigned_incidents = relationship("Incident", back_populates="assignee", foreign_keys="Incident.assignee_id")
    messages = relationship("Message", back_populates="sender")
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self):
        return f"<User {self.username} [{self.role}]>"
