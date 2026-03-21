"""
Incidents Router — Full CRUD + Status Updates + AI Triage
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, get_current_staff
from app.models.incident import Incident, IncidentStatus, IncidentType
from app.models.notification import Notification, NotificationType
from app.schemas.incident import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    IncidentListResponse, StatusUpdate
)
from app.services.ai_service import AIService
from app.services.notification_service import NotificationService
from app.websocket.manager import manager

router = APIRouter()


async def _broadcast_incident_update(incident: Incident):
    """Push incident update to all WS clients in this incident room."""
    await manager.broadcast_to_incident(
        incident.id,
        {
            "type": "incident_update",
            "incident_id": incident.id,
            "data": {
                "status": incident.status,
                "severity": incident.severity,
                "assignee_id": incident.assignee_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        },
    )


# ── GET /incidents ────────────────────────────────────────────────────────────
@router.get("", response_model=IncidentListResponse)
async def list_incidents(
    status: Optional[IncidentStatus] = None,
    type: Optional[IncidentType] = None,
    search: Optional[str] = Query(None, max_length=200),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List incidents with optional filtering. Public endpoint (guests can report)."""
    query = select(Incident).order_by(Incident.reported_at.desc())

    if status:
        query = query.where(Incident.status == status)
    if type:
        query = query.where(Incident.type == type)
    if search:
        term = f"%{search}%"
        query = query.where(
            Incident.location.ilike(term) |
            Incident.description.ilike(term) |
            Incident.title.ilike(term)
        )

    # Fetch all for counts (no filter applied to counts)
    all_result = await db.execute(select(Incident))
    all_incidents = all_result.scalars().all()

    total = len(all_incidents)
    active = sum(1 for i in all_incidents if i.status == IncidentStatus.active)
    pending = sum(1 for i in all_incidents if i.status == IncidentStatus.pending)
    resolved = sum(1 for i in all_incidents if i.status == IncidentStatus.resolved)

    result = await db.execute(query.offset(skip).limit(limit))
    incidents = result.scalars().all()

    return IncidentListResponse(
        incidents=incidents,
        total=total,
        active=active,
        pending=pending,
        resolved=resolved,
    )


# ── POST /incidents ───────────────────────────────────────────────────────────
@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident_in: IncidentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Report a new incident.
    Triggers AI triage in background and notifies all staff via WebSocket.
    """
    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        type=incident_in.type,
        status=IncidentStatus.pending,
        severity=incident_in.severity,
        location=incident_in.location,
        floor=incident_in.floor,
        room_number=incident_in.room_number,
        reporter_id=current_user.id,
        reporter_name=incident_in.reporter_name or current_user.full_name,
        is_drill=incident_in.is_drill,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        property_name=incident_in.property_name or current_user.property_name,
        image_urls=incident_in.image_urls,
    )
    db.add(incident)
    await db.flush()
    await db.refresh(incident)

    # Background: run AI triage + send notifications
    background_tasks.add_task(_run_ai_triage, incident.id)
    background_tasks.add_task(_notify_staff_new_incident, incident.id)

    # Broadcast to all connected WS clients
    await manager.broadcast_global({
        "type": "incident_new",
        "incident_id": incident.id,
        "data": {
            "type": incident.type,
            "location": incident.location,
            "severity": incident.severity,
            "reported_at": incident.reported_at.isoformat(),
        },
    })

    return incident


# ── GET /incidents/{id} ───────────────────────────────────────────────────────
@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Incident).where(Incident.id == incident_id)
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


# ── PATCH /incidents/{id} ─────────────────────────────────────────────────────
@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    update_in: IncidentUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """Update incident fields (staff/responder/manager only)."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    for field, value in update_in.model_dump(exclude_none=True).items():
        setattr(incident, field, value)

    await db.flush()
    await db.refresh(incident)
    background_tasks.add_task(_broadcast_incident_update, incident)
    return incident


# ── PATCH /incidents/{id}/status ──────────────────────────────────────────────
@router.patch("/{incident_id}/status", response_model=IncidentResponse)
async def update_status(
    incident_id: int,
    body: StatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """Transition incident status with timestamp tracking."""
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.now(timezone.utc)
    incident.status = body.status

    if body.status == IncidentStatus.active and not incident.acknowledged_at:
        incident.acknowledged_at = now
    elif body.status == IncidentStatus.resolved and not incident.resolved_at:
        incident.resolved_at = now

    await db.flush()
    await db.refresh(incident)
    background_tasks.add_task(_broadcast_incident_update, incident)
    return incident


# ── DELETE /incidents/{id} ────────────────────────────────────────────────────
@router.delete("/{incident_id}", status_code=204)
async def delete_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    await db.delete(incident)


# ── Background Tasks ──────────────────────────────────────────────────────────
async def _run_ai_triage(incident_id: int):
    """Run AI triage and persist results."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Incident).where(Incident.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            return

        ai = AIService()
        triage = await ai.triage_incident(
            incident_type=incident.type,
            description=incident.description,
            location=incident.location,
            severity=incident.severity,
        )

        incident.ai_triage_summary = triage.get("summary")
        incident.ai_suggested_actions = triage.get("suggested_actions", [])
        incident.ai_severity_score = triage.get("severity_score")
        incident.ai_tags = triage.get("tags", [])
        await db.commit()

        # Broadcast updated AI info
        await manager.broadcast_to_incident(incident_id, {
            "type": "ai_triage_ready",
            "incident_id": incident_id,
            "data": triage,
        })


async def _notify_staff_new_incident(incident_id: int):
    """Create in-app notifications for all staff users."""
    from app.core.database import AsyncSessionLocal
    from app.models.user import User, UserRole
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Incident).where(Incident.id == incident_id))
        incident = result.scalar_one_or_none()
        if not incident:
            return

        staff_result = await db.execute(
            select(User).where(
                User.role.in_([UserRole.staff, UserRole.responder, UserRole.manager]),
                User.is_active == True,
            )
        )
        staff_users = staff_result.scalars().all()

        for user in staff_users:
            notif = Notification(
                user_id=user.id,
                incident_id=incident_id,
                notification_type=NotificationType.incident_new,
                title=f"🚨 New {incident.type.upper()} Incident",
                body=f"{incident.location} — {incident.description[:100]}",
            )
            db.add(notif)
        await db.commit()
