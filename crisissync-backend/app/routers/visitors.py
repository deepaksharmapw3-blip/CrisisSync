"""
Visitors Router — View all visitor data, sessions, and analytics.
Manager-only access to see who is using the website.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, distinct
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.visitor import VisitorSession, UserActivity
from app.schemas.visitor import (
    VisitorSessionResponse,
    VisitorSessionDetail,
    ActivityResponse,
    VisitorStats,
    VisitorTimelinePoint,
)

router = APIRouter()


def _require_manager(current_user: User):
    """Ensure only managers can access visitor data."""
    if current_user.role != UserRole.manager:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Manager access required")
    return current_user


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@router.get("/stats", response_model=VisitorStats)
async def get_visitor_stats(
    days: int = Query(30, ge=1, le=365, description="Lookback period in days"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get aggregate visitor statistics for the dashboard."""
    _require_manager(current_user)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Total unique visitors (by IP)
    total_visitors = (await db.execute(
        select(func.count(distinct(VisitorSession.ip_address)))
        .where(VisitorSession.first_seen >= since)
    )).scalar() or 0

    # Total sessions
    total_sessions = (await db.execute(
        select(func.count(VisitorSession.id))
        .where(VisitorSession.first_seen >= since)
    )).scalar() or 0

    # Total page views
    total_page_views = (await db.execute(
        select(func.count(UserActivity.id))
        .where(UserActivity.timestamp >= since)
    )).scalar() or 0

    # Authenticated sessions
    auth_sessions = (await db.execute(
        select(func.count(VisitorSession.id))
        .where(VisitorSession.first_seen >= since, VisitorSession.is_authenticated == True)
    )).scalar() or 0

    # Unique countries
    unique_countries = (await db.execute(
        select(func.count(distinct(VisitorSession.country)))
        .where(VisitorSession.first_seen >= since, VisitorSession.country.isnot(None))
    )).scalar() or 0

    avg_pv = round(total_page_views / max(total_sessions, 1), 1)

    # Top pages
    top_pages_q = await db.execute(
        select(UserActivity.path, func.count(UserActivity.id).label("hits"))
        .where(UserActivity.timestamp >= since)
        .group_by(UserActivity.path)
        .order_by(desc("hits"))
        .limit(10)
    )
    top_pages = [{"page": row[0], "hits": row[1]} for row in top_pages_q.all()]

    # Top countries
    top_countries_q = await db.execute(
        select(VisitorSession.country, func.count(VisitorSession.id).label("count"))
        .where(VisitorSession.first_seen >= since, VisitorSession.country.isnot(None))
        .group_by(VisitorSession.country)
        .order_by(desc("count"))
        .limit(10)
    )
    top_countries = [{"country": row[0], "count": row[1]} for row in top_countries_q.all()]

    # Top browsers
    top_browsers_q = await db.execute(
        select(VisitorSession.browser, func.count(VisitorSession.id).label("count"))
        .where(VisitorSession.first_seen >= since, VisitorSession.browser.isnot(None))
        .group_by(VisitorSession.browser)
        .order_by(desc("count"))
        .limit(5)
    )
    top_browsers = [{"browser": row[0], "count": row[1]} for row in top_browsers_q.all()]

    # Top devices
    top_devices_q = await db.execute(
        select(VisitorSession.device_type, func.count(VisitorSession.id).label("count"))
        .where(VisitorSession.first_seen >= since, VisitorSession.device_type.isnot(None))
        .group_by(VisitorSession.device_type)
        .order_by(desc("count"))
        .limit(5)
    )
    top_devices = [{"device": row[0], "count": row[1]} for row in top_devices_q.all()]

    # Recent visitors (last 20)
    recent_q = await db.execute(
        select(VisitorSession)
        .order_by(desc(VisitorSession.last_seen))
        .limit(20)
    )
    recent = recent_q.scalars().all()

    return VisitorStats(
        total_visitors=total_visitors,
        total_sessions=total_sessions,
        total_page_views=total_page_views,
        authenticated_sessions=auth_sessions,
        unique_countries=unique_countries,
        avg_page_views_per_session=avg_pv,
        top_pages=top_pages,
        top_countries=top_countries,
        top_browsers=top_browsers,
        top_devices=top_devices,
        recent_visitors=recent,
    )


# ── Visitor Timeline ─────────────────────────────────────────────────────────

@router.get("/timeline", response_model=List[VisitorTimelinePoint])
async def get_visitor_timeline(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Daily visitor and page-view counts for chart rendering."""
    _require_manager(current_user)
    results = []
    now = datetime.now(timezone.utc)

    for i in range(days, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        visitors = (await db.execute(
            select(func.count(distinct(VisitorSession.ip_address)))
            .where(VisitorSession.first_seen >= day_start, VisitorSession.first_seen < day_end)
        )).scalar() or 0

        page_views = (await db.execute(
            select(func.count(UserActivity.id))
            .where(UserActivity.timestamp >= day_start, UserActivity.timestamp < day_end)
        )).scalar() or 0

        results.append(VisitorTimelinePoint(
            date=day_start.strftime("%Y-%m-%d"),
            visitors=visitors,
            page_views=page_views,
        ))

    return results


# ── List All Sessions ─────────────────────────────────────────────────────────

@router.get("/sessions", response_model=List[VisitorSessionResponse])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    authenticated_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all visitor sessions, newest first."""
    _require_manager(current_user)
    query = select(VisitorSession).order_by(desc(VisitorSession.last_seen))
    if authenticated_only:
        query = query.where(VisitorSession.is_authenticated == True)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ── Session Detail ────────────────────────────────────────────────────────────

@router.get("/sessions/{session_id}", response_model=VisitorSessionDetail)
async def get_session_detail(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single session with all its activity log."""
    _require_manager(current_user)
    result = await db.execute(
        select(VisitorSession).where(VisitorSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch activities
    activities_q = await db.execute(
        select(UserActivity)
        .where(UserActivity.session_id == session.id)
        .order_by(desc(UserActivity.timestamp))
    )
    session.activities = activities_q.scalars().all()
    return session


# ── Activity Log ──────────────────────────────────────────────────────────────

@router.get("/activities", response_model=List[ActivityResponse])
async def list_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    path_filter: Optional[str] = Query(None, description="Filter by URL path prefix"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List raw activity log entries."""
    _require_manager(current_user)
    query = select(UserActivity).order_by(desc(UserActivity.timestamp))
    if path_filter:
        query = query.where(UserActivity.path.startswith(path_filter))
    if user_id:
        query = query.where(UserActivity.user_id == user_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ── Per-User Activity ─────────────────────────────────────────────────────────

@router.get("/users/{target_user_id}", response_model=List[ActivityResponse])
async def get_user_activity(
    target_user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all activity for a specific registered user."""
    _require_manager(current_user)
    result = await db.execute(
        select(UserActivity)
        .where(UserActivity.user_id == target_user_id)
        .order_by(desc(UserActivity.timestamp))
        .offset(skip).limit(limit)
    )
    return result.scalars().all()
