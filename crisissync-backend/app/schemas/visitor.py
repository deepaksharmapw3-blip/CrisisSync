"""Pydantic schemas for Visitor tracking & analytics."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Activity Schemas ──────────────────────────────────────────────────────────

class ActivityResponse(BaseModel):
    id: int
    method: str
    path: str
    full_url: Optional[str] = None
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    user_id: Optional[int] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


# ── Session Schemas ───────────────────────────────────────────────────────────

class VisitorSessionResponse(BaseModel):
    id: int
    session_id: str
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    device_type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    referrer: Optional[str] = None
    user_id: Optional[int] = None
    is_authenticated: bool
    first_seen: datetime
    last_seen: datetime
    total_page_views: int

    model_config = {"from_attributes": True}


class VisitorSessionDetail(VisitorSessionResponse):
    """Session with its activity list."""
    user_agent: Optional[str] = None
    region: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    activities: List[ActivityResponse] = []


# ── Dashboard / Aggregate Schemas ─────────────────────────────────────────────

class VisitorStats(BaseModel):
    """High-level visitor analytics."""
    total_visitors: int
    total_sessions: int
    total_page_views: int
    authenticated_sessions: int
    unique_countries: int
    avg_page_views_per_session: float
    top_pages: List[dict]
    top_countries: List[dict]
    top_browsers: List[dict]
    top_devices: List[dict]
    recent_visitors: List[VisitorSessionResponse]


class VisitorTimelinePoint(BaseModel):
    """A single data point in a visitor timeline."""
    date: str
    visitors: int
    page_views: int
