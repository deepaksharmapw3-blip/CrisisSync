"""
Visitor & User Activity Tracking Models
Tracks every person who uses the CrisisSync website.
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    ForeignKey, Float, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class VisitorSession(Base):
    """Tracks unique visitor sessions on the website."""
    __tablename__ = "visitor_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), unique=True, index=True, nullable=False)

    # Visitor identification
    ip_address = Column(String(45), nullable=True)           # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    browser = Column(String(100), nullable=True)             # Chrome, Firefox, etc.
    os = Column(String(100), nullable=True)                  # Windows, macOS, etc.
    device_type = Column(String(50), nullable=True)          # desktop, mobile, tablet

    # Geo information (derived from IP)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Referral & campaign info
    referrer = Column(Text, nullable=True)                   # where the visitor came from
    utm_source = Column(String(255), nullable=True)
    utm_medium = Column(String(255), nullable=True)
    utm_campaign = Column(String(255), nullable=True)

    # Linked user (if they log in during this session)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Session timing
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    total_page_views = Column(Integer, default=0)
    is_authenticated = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", backref="visitor_sessions")
    activities = relationship("UserActivity", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VisitorSession {self.session_id} [{self.ip_address}]>"


class UserActivity(Base):
    """Logs every page view / API call made by a visitor."""
    __tablename__ = "user_activity_logs"  # renamed to avoid collision

    id = Column(Integer, primary_key=True, index=True)

    # Link to session
    session_id = Column(Integer, ForeignKey("visitor_sessions.id"), nullable=False)

    # Request details
    method = Column(String(10), nullable=False)              # GET, POST, etc.
    path = Column(String(500), nullable=False)               # /api/v1/incidents
    full_url = Column(Text, nullable=True)
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=True)          # how long the request took

    # Linked user (if authenticated)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Extra context
    request_body_size = Column(Integer, nullable=True)
    response_body_size = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("VisitorSession", back_populates="activities")
    user = relationship("User", backref="activities")

    # Manual index names to avoid collisions
    __table_args__ = (
        Index("idx_ual_path", "path"),
        Index("idx_ual_user_id", "user_id"),
        Index("idx_ual_timestamp", "timestamp"),
    )

    def __repr__(self):
        return f"<UserActivity {self.method} {self.path} @ {self.timestamp}>"
