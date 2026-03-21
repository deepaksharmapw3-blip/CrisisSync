"""
AI Features Router — Claude-powered endpoints.
- POST /ai/triage           → Analyze incident, return severity + actions
- POST /ai/summarize        → Summarize incident chat thread
- POST /ai/suggest-response → Smart quick-reply suggestions
- POST /ai/tags             → Auto-generate tags for an incident
- GET  /ai/risk-assessment  → Property-wide risk snapshot
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_staff
from app.models.incident import Incident
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


class TriageRequest(BaseModel):
    incident_id: int


class SummarizeRequest(BaseModel):
    incident_id: int
    include_messages: bool = True


class SuggestRequest(BaseModel):
    incident_id: int
    user_role: str = "staff"


class TagsRequest(BaseModel):
    description: str
    type: str
    location: str


class RiskRequest(BaseModel):
    property_name: Optional[str] = None


# ── Triage ────────────────────────────────────────────────────────────────────
@router.post("/triage")
async def triage_incident(
    body: TriageRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """
    Claude analyzes the incident and returns:
    - Severity score (0–1)
    - Triage summary
    - Step-by-step suggested actions
    - Risk tags
    """
    result = await db.execute(select(Incident).where(Incident.id == body.incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    triage = await ai_service.triage_incident(
        incident_type=incident.type,
        description=incident.description,
        location=incident.location,
        severity=incident.severity,
    )

    # Persist AI results
    incident.ai_triage_summary = triage.get("summary")
    incident.ai_suggested_actions = triage.get("suggested_actions", [])
    incident.ai_severity_score = triage.get("severity_score")
    incident.ai_tags = triage.get("tags", [])
    await db.commit()

    return triage


# ── Summarize Chat ────────────────────────────────────────────────────────────
@router.post("/summarize")
async def summarize_incident(
    body: SummarizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """
    Claude summarizes the incident + chat thread into a
    concise incident report paragraph for managers.
    """
    from app.models.message import Message

    result = await db.execute(select(Incident).where(Incident.id == body.incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    messages = []
    if body.include_messages:
        msg_result = await db.execute(
            select(Message)
            .where(Message.incident_id == body.incident_id)
            .order_by(Message.timestamp.asc())
            .limit(50)
        )
        messages = msg_result.scalars().all()

    summary = await ai_service.summarize_incident(incident, messages)
    return {"summary": summary}


# ── Suggest Quick Replies ─────────────────────────────────────────────────────
@router.post("/suggest-response")
async def suggest_responses(
    body: SuggestRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """
    Claude generates 5 context-aware quick-reply suggestions
    for the current incident state and user role.
    """
    from app.models.message import Message

    result = await db.execute(select(Incident).where(Incident.id == body.incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    msg_result = await db.execute(
        select(Message)
        .where(Message.incident_id == body.incident_id)
        .order_by(Message.timestamp.desc())
        .limit(10)
    )
    recent_msgs = msg_result.scalars().all()

    suggestions = await ai_service.suggest_responses(incident, recent_msgs, body.user_role)
    return {"suggestions": suggestions}


# ── Auto-tag ──────────────────────────────────────────────────────────────────
@router.post("/tags")
async def generate_tags(
    body: TagsRequest,
    current_user=Depends(get_current_staff),
):
    """Auto-generate descriptive tags for an incident description."""
    tags = await ai_service.generate_tags(body.description, body.type, body.location)
    return {"tags": tags}


# ── Property Risk Assessment ──────────────────────────────────────────────────
@router.get("/risk-assessment")
async def risk_assessment(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """
    Claude reviews recent incident patterns and provides a
    property-wide risk assessment with prevention recommendations.
    """
    from datetime import timedelta
    from datetime import datetime
    result = await db.execute(
        select(Incident)
        .where(Incident.reported_at >= datetime.utcnow() - timedelta(days=30))
        .order_by(Incident.reported_at.desc())
        .limit(50)
    )
    incidents = result.scalars().all()

    assessment = await ai_service.risk_assessment(incidents)
    return assessment
