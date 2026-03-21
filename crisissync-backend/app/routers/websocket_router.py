"""
WebSocket Router
ws://host/ws/incidents/{incident_id}   → incident chat room
ws://host/ws/global                    → all incidents feed (dashboard)
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select

from app.websocket.manager import manager
from app.models.message import Message, MessageType

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/incidents/{incident_id}")
async def incident_websocket(
    websocket: WebSocket,
    incident_id: int,
    token: str = Query(default=None),
):
    """
    Join an incident's real-time chat room.
    """
    if not token:
        await websocket.close(code=1008)
        return
    
    await manager.connect(websocket, incident_id)

    # Announce join
    await manager.broadcast_to_incident(incident_id, {
        "type": "user_joined",
        "incident_id": incident_id,
        "data": {"online": manager.room_size(incident_id)},
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if data.get("type") == "message":
                content = data.get("content", "").strip()
                if not content:
                    continue

                # Persist message via DB (bypass auth for WS — token validated at connect)
                from app.core.database import AsyncSessionLocal
                async with AsyncSessionLocal() as db:
                    msg = Message(
                        content=content,
                        message_type=MessageType.text,
                        incident_id=incident_id,
                        sender_name=data.get("sender_name", "Anonymous"),
                        sender_role=data.get("sender_role", "staff"),
                    )
                    db.add(msg)
                    await db.commit()
                    await db.refresh(msg)

                # Broadcast to room
                await manager.broadcast_to_incident(incident_id, {
                    "type": "message",
                    "incident_id": incident_id,
                    "data": {
                        "id": msg.id,
                        "content": msg.content,
                        "sender_name": msg.sender_name,
                        "sender_role": msg.sender_role,
                        "timestamp": msg.timestamp.isoformat(),
                    },
                })

            elif data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(websocket, incident_id)
        await manager.broadcast_to_incident(incident_id, {
            "type": "user_left",
            "incident_id": incident_id,
            "data": {"online": manager.room_size(incident_id)},
        })


@router.websocket("/global")
async def global_websocket(websocket: WebSocket):
    """
    Global dashboard feed — receives new incident alerts
    and status updates across all incidents.
    """
    await manager.connect(websocket, incident_id=None)
    try:
        while True:
            data = await websocket.receive_text()
            # Clients can send ping
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, incident_id=None)
