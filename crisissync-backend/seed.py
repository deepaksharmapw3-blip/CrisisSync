#!/usr/bin/env python3
"""
CrisisSync — Database Seed Script
Loads demo data that mirrors the frontend mock data for hackathon demos.

Run with: python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.incident import Incident, IncidentType, IncidentStatus, IncidentSeverity
from app.models.message import Message, MessageType


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding CrisisSync database...")

        # ── Users ──────────────────────────────────────────────────────────────
        users_data = [
            {
                "email": "manager@grandhotel.com",
                "username": "manager",
                "full_name": "Sarah Chen",
                "role": UserRole.manager,
                "department": "Management",
                "property_name": "Grand Oaks Hotel",
                "is_on_duty": True,
            },
            {
                "email": "fire.team@grandhotel.com",
                "username": "fire_team_a",
                "full_name": "Fire Response Team A",
                "role": UserRole.responder,
                "department": "Fire Safety",
                "property_name": "Grand Oaks Hotel",
                "is_on_duty": True,
            },
            {
                "email": "medical@grandhotel.com",
                "username": "medical_team",
                "full_name": "Medical Response Team",
                "role": UserRole.responder,
                "department": "Medical",
                "property_name": "Grand Oaks Hotel",
                "is_on_duty": True,
            },
            {
                "email": "security@grandhotel.com",
                "username": "security_team",
                "full_name": "Security Team",
                "role": UserRole.responder,
                "department": "Security",
                "property_name": "Grand Oaks Hotel",
                "is_on_duty": True,
            },
            {
                "email": "frontdesk@grandhotel.com",
                "username": "front_desk",
                "full_name": "Front Desk",
                "role": UserRole.staff,
                "department": "Front Office",
                "property_name": "Grand Oaks Hotel",
                "is_on_duty": True,
            },
            {
                "email": "john.smith@grandhotel.com",
                "username": "john_smith",
                "full_name": "John Smith",
                "role": UserRole.staff,
                "department": "F&B",
                "property_name": "Grand Oaks Hotel",
            },
        ]

        created_users = {}
        for u_data in users_data:
            user = User(
                **u_data,
                hashed_password=hash_password("demo123"),
                is_active=True,
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
            created_users[u_data["username"]] = user
            print(f"  ✅ User: {u_data['full_name']} [{u_data['role']}]")

        now = datetime.now(timezone.utc)

        # ── Incidents (mirrors frontend mock data) ─────────────────────────────
        incidents_data = [
            {
                "title": "Kitchen Grease Fire",
                "description": "Small fire in the kitchen area. Fire suppression activated.",
                "type": IncidentType.fire,
                "status": IncidentStatus.active,
                "severity": IncidentSeverity.high,
                "location": "Kitchen - Floor 1",
                "floor": "1",
                "reporter_id": created_users["john_smith"].id,
                "reporter_name": "John Smith",
                "assignee_id": created_users["fire_team_a"].id,
                "reported_at": now - timedelta(minutes=15),
                "acknowledged_at": now - timedelta(minutes=13),
                "property_name": "Grand Oaks Hotel",
                "ai_triage_summary": "Active grease fire in kitchen. Fire suppression system engaged. Moderate risk of spread to adjacent areas. Immediate response required.",
                "ai_suggested_actions": [
                    "Confirm fire suppression system is active",
                    "Evacuate kitchen staff immediately",
                    "Prevent guests from approaching kitchen area",
                    "Contact fire department as precaution",
                    "Shut off gas supply to kitchen"
                ],
                "ai_severity_score": 0.72,
                "ai_tags": ["grease-fire", "kitchen", "floor-1", "suppression-active"],
            },
            {
                "title": "Medical Emergency — Room 405",
                "description": "Guest reporting chest pain. Medical assistance needed urgently.",
                "type": IncidentType.medical,
                "status": IncidentStatus.active,
                "severity": IncidentSeverity.critical,
                "location": "Room 405",
                "floor": "4",
                "room_number": "405",
                "reporter_id": created_users["front_desk"].id,
                "reporter_name": "Front Desk",
                "assignee_id": created_users["medical_team"].id,
                "reported_at": now - timedelta(minutes=8),
                "acknowledged_at": now - timedelta(minutes=7),
                "property_name": "Grand Oaks Hotel",
                "ai_triage_summary": "65-year-old male guest with reported chest pain and history of cardiac condition. EMS dispatched. Critical priority.",
                "ai_suggested_actions": [
                    "Dispatch medical team to Room 405 immediately",
                    "Call EMS (911) — cardiac event suspected",
                    "Retrieve AED from floor 4 station",
                    "Check guest's registration for medical history",
                    "Clear hallway for EMS access"
                ],
                "ai_severity_score": 0.95,
                "ai_tags": ["cardiac", "room-405", "ems-needed", "critical"],
                "requires_evacuation": False,
            },
            {
                "title": "Suspicious Vehicle — Parking Lot B",
                "description": "Suspicious vehicle parked for 6+ hours. Occupants observed watching entrance.",
                "type": IncidentType.security,
                "status": IncidentStatus.pending,
                "severity": IncidentSeverity.medium,
                "location": "Parking Lot B",
                "reporter_name": "Security Camera AI",
                "assignee_id": created_users["security_team"].id,
                "reported_at": now - timedelta(minutes=25),
                "property_name": "Grand Oaks Hotel",
                "ai_triage_summary": "Suspicious vehicle flagged by AI camera system. Requires security assessment before escalation.",
                "ai_suggested_actions": [
                    "Send security officer to parking lot B",
                    "Record vehicle plate number",
                    "Review camera footage for past 2 hours",
                    "Notify front desk to monitor for suspicious persons",
                    "Contact local police if activity escalates"
                ],
                "ai_severity_score": 0.45,
                "ai_tags": ["parking", "surveillance", "potential-threat"],
            },
            {
                "title": "Slip and Fall — Pool Area",
                "description": "Guest slipped near pool. Minor injury treated on-site by lifeguard.",
                "type": IncidentType.medical,
                "status": IncidentStatus.resolved,
                "severity": IncidentSeverity.low,
                "location": "Pool Area",
                "reporter_name": "Lifeguard",
                "assignee_id": created_users["medical_team"].id,
                "reported_at": now - timedelta(hours=2),
                "acknowledged_at": now - timedelta(hours=2) + timedelta(minutes=2),
                "resolved_at": now - timedelta(hours=1, minutes=30),
                "property_name": "Grand Oaks Hotel",
                "ai_tags": ["slip-fall", "pool", "minor-injury", "resolved"],
            },
            {
                "title": "Power Outage — Conference Room C",
                "description": "Complete power outage affecting AV equipment during corporate event.",
                "type": IncidentType.other,
                "status": IncidentStatus.resolved,
                "severity": IncidentSeverity.medium,
                "location": "Conference Room C",
                "reporter_name": "Event Coordinator",
                "reported_at": now - timedelta(hours=4),
                "resolved_at": now - timedelta(hours=3),
                "property_name": "Grand Oaks Hotel",
            },
            {
                "title": "Unauthorized Access Attempt",
                "description": "Access control system flagged repeated failed key card attempts.",
                "type": IncidentType.security,
                "status": IncidentStatus.resolved,
                "severity": IncidentSeverity.high,
                "location": "Main Entrance",
                "reporter_name": "Access Control System",
                "assignee_id": created_users["security_team"].id,
                "reported_at": now - timedelta(hours=6),
                "acknowledged_at": now - timedelta(hours=6) + timedelta(minutes=3),
                "resolved_at": now - timedelta(hours=5, minutes=30),
                "property_name": "Grand Oaks Hotel",
            },
        ]

        created_incidents = []
        for inc_data in incidents_data:
            incident = Incident(**inc_data)
            db.add(incident)
            await db.flush()
            await db.refresh(incident)
            created_incidents.append(incident)
            print(f"  🚨 Incident: {inc_data['title']} [{inc_data['status']}]")

        # ── Messages (mirrors frontend mock data) ──────────────────────────────
        kitchen_fire = created_incidents[0]
        medical = created_incidents[1]
        fire_team = created_users["fire_team_a"]
        med_team = created_users["medical_team"]
        hotel_mgr = created_users["manager"]
        front = created_users["front_desk"]

        messages_data = [
            # Kitchen fire thread
            {
                "content": "Fire alarm triggered in Kitchen. Investigating now.",
                "incident_id": kitchen_fire.id,
                "sender_id": fire_team.id,
                "sender_name": fire_team.full_name,
                "sender_role": "responder",
                "timestamp": now - timedelta(minutes=14),
            },
            {
                "content": "Confirmed small grease fire. Suppression system active. Situation under control.",
                "incident_id": kitchen_fire.id,
                "sender_id": fire_team.id,
                "sender_name": fire_team.full_name,
                "sender_role": "responder",
                "timestamp": now - timedelta(minutes=12),
            },
            {
                "content": "Should we evacuate the nearby dining area?",
                "incident_id": kitchen_fire.id,
                "sender_id": hotel_mgr.id,
                "sender_name": hotel_mgr.full_name,
                "sender_role": "manager",
                "timestamp": now - timedelta(minutes=10),
            },
            {
                "content": "Not necessary at this time. Fire is contained. Ventilation clearing smoke.",
                "incident_id": kitchen_fire.id,
                "sender_id": fire_team.id,
                "sender_name": fire_team.full_name,
                "sender_role": "responder",
                "timestamp": now - timedelta(minutes=8),
            },
            # Medical thread
            {
                "content": "Medical team dispatched to Room 405.",
                "incident_id": medical.id,
                "sender_id": med_team.id,
                "sender_name": med_team.full_name,
                "sender_role": "responder",
                "timestamp": now - timedelta(minutes=7),
            },
            {
                "content": "Guest is a 65-year-old male. History of heart condition per registration.",
                "incident_id": medical.id,
                "sender_id": front.id,
                "sender_name": front.full_name,
                "sender_role": "staff",
                "timestamp": now - timedelta(minutes=6),
            },
            {
                "content": "EMS has been contacted. ETA 8 minutes. Patient is conscious.",
                "incident_id": medical.id,
                "sender_id": med_team.id,
                "sender_name": med_team.full_name,
                "sender_role": "responder",
                "timestamp": now - timedelta(minutes=5),
            },
        ]

        for msg_data in messages_data:
            msg = Message(message_type=MessageType.text, **msg_data)
            db.add(msg)

        await db.commit()

        print("\n✅ Seed complete!")
        print("\n📋 Demo Login Credentials:")
        print("  Manager:   username=manager      password=demo123")
        print("  Staff:     username=front_desk   password=demo123")
        print("  Responder: username=fire_team_a  password=demo123")
        print("\n🌐 API Docs: http://localhost:8000/docs")
        print("🚨 Active incidents: 2 | Pending: 1 | Resolved: 3")


if __name__ == "__main__":
    asyncio.run(seed())
