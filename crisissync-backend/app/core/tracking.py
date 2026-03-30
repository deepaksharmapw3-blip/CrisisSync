"""
Visitor Tracking Middleware
Automatically logs every request to the user_activities table
and maintains visitor sessions.
"""

import time
import uuid
import logging
import asyncio
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


class VisitorTrackingMiddleware:
    """Tracks visitor sessions and per-request activity (ASGI version for WS safety)."""
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        if path in SKIP_PATHS or path.startswith("/static") or path.startswith("/ws"):
            return await self.app(scope, receive, send)

        # GET COOKIE FROM SCOPE HEADERS (NOT FROM REQUEST OBJECT)
        headers = {k.decode("latin1").lower(): v.decode("latin1") for k, v in scope.get("headers", [])}
        cookie_header = headers.get("cookie", "")
        
        visitor_id = None
        if SESSION_COOKIE_NAME in cookie_header:
            import re
            match = re.search(f"{SESSION_COOKIE_NAME}=([^;]+)", cookie_header)
            if match:
                visitor_id = match.group(1)

        new_session = False
        if not visitor_id:
            visitor_id = str(uuid.uuid4())
            new_session = True

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                if new_session:
                    msg_headers = list(message.get("headers", []))
                    cookie = f"{SESSION_COOKIE_NAME}={visitor_id}; HttpOnly; Max-Age=31536000; Path=/; SameSite=lax"
                    msg_headers.append((b"set-cookie", cookie.encode()))
                    message["headers"] = msg_headers
            await send(message)

        return await self.app(scope, receive, send_wrapper)

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
