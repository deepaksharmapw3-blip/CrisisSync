"""
Visitor Tracking Middleware
Automatically logs every request to the user_activities table
and maintains visitor sessions.
"""

import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy import select, update
from user_agents import parse as ua_parse

from app.core.database import AsyncSessionLocal
from app.models.visitor import VisitorSession, UserActivity

logger = logging.getLogger(__name__)

# Paths to skip tracking (health checks, static files, docs)
SKIP_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/favicon.ico"}

SESSION_COOKIE_NAME = "crisissync_visitor_id"


class VisitorTrackingMiddleware(BaseHTTPMiddleware):
    """Tracks visitor sessions and per-request activity."""

    async def dispatch(self, request: Request, call_next):
        # Skip health/docs endpoints
        if request.url.path in SKIP_PATHS or request.url.path.startswith("/static"):
            return await call_next(request)

        start_time = time.perf_counter()

        # Get or create session ID from cookie
        visitor_id = request.cookies.get(SESSION_COOKIE_NAME)
        new_session = False
        if not visitor_id:
            visitor_id = str(uuid.uuid4())
            new_session = True

        # Process the request
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Log activity in the background (don't block the response)
        try:
            await self._log_activity(request, response, visitor_id, new_session, duration_ms)
        except Exception as e:
            logger.warning(f"Failed to log visitor activity: {e}")

        # Set session cookie
        if new_session:
            response.set_cookie(
                SESSION_COOKIE_NAME,
                visitor_id,
                max_age=60 * 60 * 24 * 365,  # 1 year
                httponly=True,
                samesite="lax",
            )

        return response

    async def _log_activity(
        self,
        request: Request,
        response: Response,
        visitor_id: str,
        new_session: bool,
        duration_ms: float,
    ):
        """Persist session + activity to the database."""
        async with AsyncSessionLocal() as db:
            try:
                # ── Parse user agent ──────────────────────────────────────
                raw_ua = request.headers.get("user-agent", "")
                ua = ua_parse(raw_ua)
                browser = f"{ua.browser.family} {ua.browser.version_string}"
                os_name = f"{ua.os.family} {ua.os.version_string}"
                device_type = "mobile" if ua.is_mobile else "tablet" if ua.is_tablet else "desktop"

                # ── Client IP ─────────────────────────────────────────────
                ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                if not ip:
                    ip = request.client.host if request.client else None

                # ── Get or create visitor session ─────────────────────────
                result = await db.execute(
                    select(VisitorSession).where(VisitorSession.session_id == visitor_id)
                )
                session = result.scalar_one_or_none()

                # Extract user_id from auth header if present
                user_id = None
                try:
                    from app.core.security import decode_token
                    auth_header = request.headers.get("authorization", "")
                    if auth_header.startswith("Bearer "):
                        token = auth_header.split(" ")[1]
                        payload = decode_token(token)
                        user_id = int(payload.get("sub", 0)) or None
                except Exception:
                    pass

                if session is None:
                    # Parse referrer and UTM params
                    referrer = request.headers.get("referer", None)
                    utm_source = request.query_params.get("utm_source")
                    utm_medium = request.query_params.get("utm_medium")
                    utm_campaign = request.query_params.get("utm_campaign")

                    session = VisitorSession(
                        session_id=visitor_id,
                        ip_address=ip,
                        user_agent=raw_ua,
                        browser=browser,
                        os=os_name,
                        device_type=device_type,
                        referrer=referrer,
                        utm_source=utm_source,
                        utm_medium=utm_medium,
                        utm_campaign=utm_campaign,
                        user_id=user_id,
                        total_page_views=1,
                        is_authenticated=user_id is not None,
                    )
                    db.add(session)
                    await db.flush()
                else:
                    # Update existing session
                    session.total_page_views += 1
                    if user_id and not session.user_id:
                        session.user_id = user_id
                        session.is_authenticated = True
                    await db.flush()

                # ── Log the activity ──────────────────────────────────────
                activity = UserActivity(
                    session_id=session.id,
                    method=request.method,
                    path=request.url.path,
                    full_url=str(request.url),
                    status_code=response.status_code,
                    response_time_ms=round(duration_ms, 2),
                    user_id=user_id,
                )
                db.add(activity)

                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.warning(f"Visitor tracking DB error: {e}")
