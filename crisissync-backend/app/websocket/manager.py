"""
WebSocket Connection Manager
Manages per-incident rooms + global broadcast channel.
"""

import json
import logging
from collections import defaultdict
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # incident_id → set of active WebSocket connections
        self._incident_rooms: Dict[int, Set[WebSocket]] = defaultdict(set)
        # all connected clients (for global broadcasts)
        self._global: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, incident_id: int | None = None):
        await websocket.accept()
        self._global.add(websocket)
        if incident_id is not None:
            self._incident_rooms[incident_id].add(websocket)
        logger.info(f"WS connected. incident={incident_id}, total={len(self._global)}")

    def disconnect(self, websocket: WebSocket, incident_id: int | None = None):
        self._global.discard(websocket)
        if incident_id is not None:
            self._incident_rooms[incident_id].discard(websocket)
        logger.info(f"WS disconnected. incident={incident_id}, total={len(self._global)}")

    async def broadcast_to_incident(self, incident_id: int, payload: dict):
        """Send a message to all clients watching a specific incident."""
        dead = set()
        for ws in self._incident_rooms.get(incident_id, set()):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._incident_rooms[incident_id].discard(ws)
            self._global.discard(ws)

    async def broadcast_global(self, payload: dict):
        """Send a message to ALL connected clients (e.g. new incident alert)."""
        dead = set()
        for ws in self._global.copy():
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._global.discard(ws)

    def room_size(self, incident_id: int) -> int:
        return len(self._incident_rooms.get(incident_id, set()))

    def total_connections(self) -> int:
        return len(self._global)


# Singleton — imported everywhere
manager = ConnectionManager()
