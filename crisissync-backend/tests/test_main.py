"""
CrisisSync — Test Suite
Tests for auth, incidents, messages, and AI endpoints.
Run with: pytest tests/ -v
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User, UserRole

# ── In-memory SQLite for tests ────────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        yield session
        await session.commit()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    async with TestSession() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db):
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def staff_user(db):
    existing = await db.execute(select(User).where(User.username == "teststaff"))
    user = existing.scalar_one_or_none()
    if user:
        return user

    user = User(
        email="staff@crisissync.example",
        username="teststaff",
        full_name="Test Staff",
        hashed_password=hash_password("testpass123"),
        role=UserRole.staff,
        property_name="Test Hotel",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def staff_token(client, staff_user):
    resp = await client.post("/api/v1/auth/token", data={
        "username": "teststaff",
        "password": "testpass123",
    })
    return resp.json()["access_token"]


# ── Auth Tests ────────────────────────────────────────────────────────────────
class TestAuth:
    async def test_register(self, client):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "securepass123",
            "role": "staff",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@test.com"
        assert "hashed_password" not in data

    async def test_register_duplicate_email(self, client, staff_user):
        resp = await client.post("/api/v1/auth/register", json={
            "email": "staff@crisissync.example",
            "username": "other",
            "full_name": "Other",
            "password": "pass12345",
        })
        assert resp.status_code == 400

    async def test_login(self, client, staff_user):
        resp = await client.post("/api/v1/auth/token", data={
            "username": "teststaff",
            "password": "testpass123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()
        assert "refresh_token" in resp.json()

    async def test_login_wrong_password(self, client, staff_user):
        resp = await client.post("/api/v1/auth/token", data={
            "username": "teststaff",
            "password": "wrongpass",
        })
        assert resp.status_code == 401

    async def test_me(self, client, staff_token):
        resp = await client.get("/api/v1/auth/me",
                                headers={"Authorization": f"Bearer {staff_token}"})
        assert resp.status_code == 200
        assert resp.json()["username"] == "teststaff"


# ── Incident Tests ────────────────────────────────────────────────────────────
class TestIncidents:
    async def test_list_incidents_empty(self, client):
        resp = await client.get("/api/v1/incidents")
        assert resp.status_code == 200
        assert resp.json()["incidents"] == []

    async def test_create_incident(self, client, staff_token):
        resp = await client.post("/api/v1/incidents",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "title": "Kitchen Fire",
                "description": "Small grease fire in kitchen",
                "type": "fire",
                "location": "Kitchen - Floor 1",
                "severity": "high",
            })
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "fire"
        assert data["status"] == "pending"
        assert data["location"] == "Kitchen - Floor 1"
        return data["id"]

    async def test_get_incident(self, client, staff_token):
        # Create first
        create_resp = await client.post("/api/v1/incidents",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "title": "Medical Emergency",
                "description": "Guest unconscious in room",
                "type": "medical",
                "location": "Room 302",
                "severity": "critical",
            })
        inc_id = create_resp.json()["id"]

        resp = await client.get(f"/api/v1/incidents/{inc_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == inc_id

    async def test_update_status(self, client, staff_token):
        create_resp = await client.post("/api/v1/incidents",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "title": "Security Alert",
                "description": "Suspicious person",
                "type": "security",
                "location": "Lobby",
            })
        inc_id = create_resp.json()["id"]

        resp = await client.patch(f"/api/v1/incidents/{inc_id}/status",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={"status": "active"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"
        assert resp.json()["acknowledged_at"] is not None

    async def test_filter_by_type(self, client, staff_token):
        resp = await client.get("/api/v1/incidents?type=fire")
        assert resp.status_code == 200

    async def test_search_incidents(self, client):
        resp = await client.get("/api/v1/incidents?search=kitchen")
        assert resp.status_code == 200

    async def test_404_incident(self, client):
        resp = await client.get("/api/v1/incidents/99999")
        assert resp.status_code == 404


# ── Message Tests ─────────────────────────────────────────────────────────────
class TestMessages:
    async def test_send_and_list_messages(self, client, staff_token):
        # Create incident
        inc = await client.post("/api/v1/incidents",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={
                "title": "Test", "description": "Test",
                "type": "other", "location": "Lobby",
            })
        inc_id = inc.json()["id"]

        # Send message
        resp = await client.post("/api/v1/messages",
            headers={"Authorization": f"Bearer {staff_token}"},
            json={"content": "En route to location", "incident_id": inc_id})
        assert resp.status_code == 201
        assert resp.json()["content"] == "En route to location"

        # List messages
        list_resp = await client.get(f"/api/v1/messages/incident/{inc_id}")
        assert resp.status_code == 200
        assert len(list_resp.json()) >= 1


# ── Analytics Tests ───────────────────────────────────────────────────────────
class TestAnalytics:
    async def test_summary(self, client, staff_token):
        resp = await client.get("/api/v1/analytics/summary",
                                headers={"Authorization": f"Bearer {staff_token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "daily_stats" in data
        assert "incident_type_stats" in data
        assert "resolution_stats" in data
        assert "hourly_heatmap" in data

    async def test_leaderboard(self, client, staff_token):
        resp = await client.get("/api/v1/analytics/leaderboard",
                                headers={"Authorization": f"Bearer {staff_token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ── Health Tests ──────────────────────────────────────────────────────────────
class TestHealth:
    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert resp.json()["service"] == "CrisisSync API"

    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
