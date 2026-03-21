"""Pydantic schemas for Incidents."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.incident import IncidentType, IncidentStatus, IncidentSeverity


class IncidentCreate(BaseModel):
    title: str
    description: str
    type: IncidentType
    location: str
    floor: Optional[str] = None
    room_number: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.medium
    reporter_name: Optional[str] = None        # guest reports (no login)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_drill: bool = False
    property_name: Optional[str] = None
    image_urls: Optional[List[str]] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IncidentStatus] = None
    severity: Optional[IncidentSeverity] = None
    assignee_id: Optional[int] = None
    requires_evacuation: Optional[bool] = None
    external_services_called: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None


class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    type: IncidentType
    status: IncidentStatus
    severity: IncidentSeverity
    location: str
    floor: Optional[str] = None
    room_number: Optional[str] = None
    reporter_id: Optional[int] = None
    reporter_name: Optional[str] = None
    assignee_id: Optional[int] = None
    reported_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    response_time_minutes: Optional[float] = None
    resolution_time_minutes: Optional[float] = None
    is_drill: bool = False
    requires_evacuation: bool = False
    ai_triage_summary: Optional[str] = None
    ai_suggested_actions: Optional[List[str]] = None
    ai_severity_score: Optional[float] = None
    ai_tags: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    property_name: Optional[str] = None

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    incidents: List[IncidentResponse]
    total: int
    active: int
    pending: int
    resolved: int


class StatusUpdate(BaseModel):
    status: IncidentStatus
    note: Optional[str] = None
