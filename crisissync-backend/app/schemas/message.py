"""Pydantic schemas for Messages and Notifications."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.message import MessageType
from app.models.notification import NotificationType


class MessageCreate(BaseModel):
    content: str
    incident_id: int
    message_type: MessageType = MessageType.text


class MessageResponse(BaseModel):
    id: int
    content: str
    message_type: MessageType
    incident_id: int
    sender_id: Optional[int] = None
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    is_read: bool
    timestamp: datetime

    model_config = {"from_attributes": True}


class WebSocketMessage(BaseModel):
    """Payload shape for WS broadcasts."""
    type: str                       # "message" | "incident_update" | "user_joined"
    incident_id: int
    data: dict


class NotificationResponse(BaseModel):
    id: int
    notification_type: NotificationType
    title: str
    body: str
    is_read: bool
    created_at: datetime
    incident_id: Optional[int] = None

    model_config = {"from_attributes": True}
