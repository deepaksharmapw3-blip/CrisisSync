"""
Analytics Router — Response time trends, incident distribution,
team performance metrics. Powers the Analytics page charts.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_staff
from app.models.incident import Incident, IncidentStatus, IncidentType

router = APIRouter()


class DailyStats(BaseModel):
    date: str
    incidents: int
    resolved: int
    avg_response_time: Optional[float] = None


class IncidentTypeStats(BaseModel):
    type: str
    count: int
    percentage: float


class ResolutionStats(BaseModel):
    average_response_time: str
    total_incidents: int
    resolved_incidents: int
    resolution_rate: float
    avg_resolution_time_minutes: Optional[float]


class AnalyticsSummary(BaseModel):
    daily_stats: List[DailyStats]
    incident_type_stats: List[IncidentTypeStats]
    resolution_stats: ResolutionStats
    severity_breakdown: dict
    hourly_heatmap: List[dict]


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    days: int = Query(14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """
    Full analytics summary — daily stats, type distribution,
    resolution metrics, hourly heatmap.
    Powers ALL charts on the analytics page.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(Incident).where(Incident.reported_at >= since)
    )
    incidents = result.scalars().all()

    # ── Daily stats ──────────────────────────────────────────────────────────
    daily: dict[str, dict] = {}
    for i in range(days):
        day = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily[day] = {"date": day, "incidents": 0, "resolved": 0, "response_times": []}

    for inc in incidents:
        day_key = inc.reported_at.strftime("%Y-%m-%d")
        if day_key in daily:
            daily[day_key]["incidents"] += 1
            if inc.status in (IncidentStatus.resolved, IncidentStatus.closed):
                daily[day_key]["resolved"] += 1
            if inc.response_time_minutes is not None:
                daily[day_key]["response_times"].append(inc.response_time_minutes)

    daily_stats = []
    for v in daily.values():
        rt = v["response_times"]
        daily_stats.append(DailyStats(
            date=v["date"],
            incidents=v["incidents"],
            resolved=v["resolved"],
            avg_response_time=round(sum(rt) / len(rt), 2) if rt else None,
        ))

    # ── Incident type distribution ────────────────────────────────────────────
    type_counts: dict[str, int] = {t.value: 0 for t in IncidentType}
    for inc in incidents:
        type_counts[inc.type] += 1
    total_typed = sum(type_counts.values()) or 1

    type_stats = [
        IncidentTypeStats(
            type=k.capitalize(),
            count=v,
            percentage=round(v / total_typed * 100, 1),
        )
        for k, v in type_counts.items()
    ]

    # ── Resolution stats ──────────────────────────────────────────────────────
    resolved = [i for i in incidents if i.status in (IncidentStatus.resolved, IncidentStatus.closed)]
    response_times = [i.response_time_minutes for i in incidents if i.response_time_minutes]
    resolution_times = [i.resolution_time_minutes for i in resolved if i.resolution_time_minutes]
    avg_rt = round(sum(response_times) / len(response_times), 2) if response_times else 0
    avg_res = round(sum(resolution_times) / len(resolution_times), 2) if resolution_times else None
    resolution_rate = round(len(resolved) / len(incidents) * 100, 1) if incidents else 0

    resolution_stats = ResolutionStats(
        average_response_time=f"{avg_rt} min",
        total_incidents=len(incidents),
        resolved_incidents=len(resolved),
        resolution_rate=resolution_rate,
        avg_resolution_time_minutes=avg_res,
    )

    # ── Severity breakdown ────────────────────────────────────────────────────
    severity_counts: dict[str, int] = {}
    for inc in incidents:
        severity_counts[inc.severity] = severity_counts.get(inc.severity, 0) + 1

    # ── Hourly heatmap (0–23 hours) ────────────────────────────────────────────
    hour_counts = [0] * 24
    for inc in incidents:
        hour_counts[inc.reported_at.hour] += 1
    heatmap = [{"hour": h, "count": hour_counts[h]} for h in range(24)]

    return AnalyticsSummary(
        daily_stats=daily_stats,
        incident_type_stats=type_stats,
        resolution_stats=resolution_stats,
        severity_breakdown=severity_counts,
        hourly_heatmap=heatmap,
    )


@router.get("/leaderboard")
async def responder_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_staff),
):
    """Top responders by resolution count + avg response time."""
    from app.models.user import User
    result = await db.execute(
        select(
            User.id, User.full_name, User.department,
            func.count(Incident.id).label("total_handled"),
        )
        .join(Incident, Incident.assignee_id == User.id)
        .where(Incident.status == IncidentStatus.resolved)
        .group_by(User.id)
        .order_by(func.count(Incident.id).desc())
        .limit(10)
    )
    rows = result.all()
    return [
        {
            "user_id": r.id,
            "full_name": r.full_name,
            "department": r.department,
            "total_handled": r.total_handled,
        }
        for r in rows
    ]
