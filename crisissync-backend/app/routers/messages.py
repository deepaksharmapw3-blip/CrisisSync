"""
Messages Router — Per-incident chat messages.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.message import Message
from app.models.incident import Incident
from app.schemas.message import MessageCreate, MessageResponse
from app.websocket.manager import manager
from typing import List

router = APIRouter()


@router.get("/incident/{incident_id}", response_model=List[MessageResponse])
async def get_messages(
    incident_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for an incident (paginated)."""
    result = await db.execute(
        select(Message)
        .where(Message.incident_id == incident_id)
        .order_by(Message.timestamp.asc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("", response_model=MessageResponse, status_code=201)
async def send_message(
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Send a message to an incident chat room. Broadcasts via WebSocket."""
    # Verify incident exists
    inc_result = await db.execute(
        select(Incident).where(Incident.id == msg_in.incident_id)
    )
    if not inc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Incident not found")

    message = Message(
        content=msg_in.content,
        message_type=msg_in.message_type,
        incident_id=msg_in.incident_id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    # Broadcast to all WS clients in this incident room
    await manager.broadcast_to_incident(
        msg_in.incident_id,
        {
            "type": "message",
            "incident_id": msg_in.incident_id,
            "data": {
                "id": message.id,
                "content": message.content,
                "sender_name": message.sender_name,
                "sender_role": message.sender_role,
                "timestamp": message.timestamp.isoformat(),
            },
        },
    )

    return message


@router.patch("/{message_id}/read", status_code=204)
async def mark_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await db.execute(
        update(Message).where(Message.id == message_id).values(is_read=True)
    )
