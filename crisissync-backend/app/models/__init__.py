# Import all models so SQLAlchemy registers them with Base.metadata
# Required for alembic migrations and init_db() to work correctly
from app.models.user import User, UserRole
from app.models.incident import Incident, IncidentType, IncidentStatus, IncidentSeverity
from app.models.message import Message, MessageType
from app.models.notification import Notification, NotificationType

__all__ = [
    "User", "UserRole",
    "Incident", "IncidentType", "IncidentStatus", "IncidentSeverity",
    "Message", "MessageType",
    "Notification", "NotificationType",
]
