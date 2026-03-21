"""
Incident model — the core entity of CrisisSync.
Maps directly to the frontend's IncidentType / IncidentStatus enums.
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    Float, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class IncidentType(str, enum.Enum):
    fire = "fire"
    medical = "medical"
    security = "security"
    other = "other"


class IncidentStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    resolved = "resolved"
    closed = "closed"


class IncidentSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(SAEnum(IncidentType), nullable=False, index=True)
    status = Column(SAEnum(IncidentStatus), default=IncidentStatus.pending, index=True)
    severity = Column(SAEnum(IncidentSeverity), default=IncidentSeverity.medium)

    # Location
    location = Column(String(255), nullable=False)
    floor = Column(String(50), nullable=True)
    room_number = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # People
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(255), nullable=True)   # for guest reports (no account)

    # AI-generated fields
    ai_triage_summary = Column(Text, nullable=True)
    ai_suggested_actions = Column(JSON, nullable=True)   # list of strings
    ai_severity_score = Column(Float, nullable=True)     # 0.0–1.0
    ai_tags = Column(JSON, nullable=True)                # auto-generated tags

    # Timing
    reported_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Media
    image_urls = Column(JSON, nullable=True)             # list of S3 URLs

    # Flags
    is_drill = Column(Boolean, default=False)
    requires_evacuation = Column(Boolean, default=False)
    external_services_called = Column(JSON, nullable=True)  # ["911", "Fire Dept"]

    # Property
    property_id = Column(Integer, nullable=True, index=True)
    property_name = Column(String(255), nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    assignee = relationship("User", back_populates="assigned_incidents", foreign_keys=[assignee_id])
    messages = relationship("Message", back_populates="incident", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="incident", cascade="all, delete-orphan")

    @property
    def response_time_minutes(self) -> float | None:
        if self.acknowledged_at and self.reported_at:
            delta = self.acknowledged_at - self.reported_at
            return round(delta.total_seconds() / 60, 2)
        return None

    @property
    def resolution_time_minutes(self) -> float | None:
        if self.resolved_at and self.reported_at:
            delta = self.resolved_at - self.reported_at
            return round(delta.total_seconds() / 60, 2)
        return None

    def __repr__(self):
        return f"<Incident #{self.id} [{self.type}] {self.status}>"
