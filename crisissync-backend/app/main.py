"""
CrisisSync Backend — FastAPI Application
Rapid Crisis Response Platform for Hospitality
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.routers import auth, incidents, messages, analytics, ai_features, users, websocket_router
from app.websocket.manager import ConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global WebSocket connection manager
manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚨 CrisisSync API starting up...")
    try:
        await init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        logger.warning("⚠️ App starting without database! Fix connection variables in Railway.")
    yield
    logger.info("🛑 CrisisSync API shutting down...")

app = FastAPI(
    title="CrisisSync API",
    description="""
## 🚨 CrisisSync — Rapid Crisis Response Platform

A real-time emergency management system for hospitality properties.

### Features
- **Incident Management** — Report, track, and resolve emergencies
- **Real-time Communication** — WebSocket-powered live chat per incident
- **AI-Powered** — Claude-driven triage, summaries, and smart suggestions
- **Analytics** — Response time trends, heatmaps, performance metrics
- **Role-Based Access** — Guest, Staff, Responder, Manager roles
""",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/v1/auth",      tags=["Auth"])
app.include_router(users.router,        prefix="/api/v1/users",     tags=["Users"])
app.include_router(incidents.router,    prefix="/api/v1/incidents", tags=["Incidents"])
app.include_router(messages.router,     prefix="/api/v1/messages",  tags=["Messages"])
app.include_router(analytics.router,    prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(ai_features.router,  prefix="/api/v1/ai",        tags=["AI Features"])
app.include_router(websocket_router.router, prefix="/ws",           tags=["WebSocket"])

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "CrisisSync API",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "database": "connected"}
