"""Initial migration — create all CrisisSync tables

Revision ID: 001_initial
Create Date: 2026-03-20
"""

from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Users
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('guest','staff','responder','manager', name='userrole'), nullable=False),
        sa.Column('property_name', sa.String(255), nullable=True),
        sa.Column('department', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_on_duty', sa.Boolean(), default=False),
        sa.Column('preferred_language', sa.String(10), default='en'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email',    'users', ['email'],    unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    # Incidents
    op.create_table('incidents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('type', sa.Enum('fire','medical','security','other', name='incidenttype'), nullable=False),
        sa.Column('status', sa.Enum('pending','active','resolved','closed', name='incidentstatus'), nullable=False),
        sa.Column('severity', sa.Enum('low','medium','high','critical', name='incidentseverity'), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('floor', sa.String(50), nullable=True),
        sa.Column('room_number', sa.String(50), nullable=True),
        sa.Column('reporter_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('assignee_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('reporter_name', sa.String(255), nullable=True),
        sa.Column('ai_triage_summary', sa.Text(), nullable=True),
        sa.Column('ai_suggested_actions', sa.JSON(), nullable=True),
        sa.Column('ai_severity_score', sa.Float(), nullable=True),
        sa.Column('ai_tags', sa.JSON(), nullable=True),
        sa.Column('reported_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('image_urls', sa.JSON(), nullable=True),
        sa.Column('is_drill', sa.Boolean(), default=False),
        sa.Column('requires_evacuation', sa.Boolean(), default=False),
        sa.Column('external_services_called', sa.JSON(), nullable=True),
        sa.Column('property_id', sa.Integer(), nullable=True),
        sa.Column('property_name', sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_incidents_type',        'incidents', ['type'])
    op.create_index('ix_incidents_status',      'incidents', ['status'])
    op.create_index('ix_incidents_reported_at', 'incidents', ['reported_at'])

    # Messages
    op.create_table('messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.Enum('text','system','ai_summary','quick_action', name='messagetype'), nullable=False),
        sa.Column('incident_id', sa.Integer(), sa.ForeignKey('incidents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('sender_name', sa.String(255), nullable=True),
        sa.Column('sender_role', sa.String(50), nullable=True),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_messages_incident_id', 'messages', ['incident_id'])
    op.create_index('ix_messages_timestamp',   'messages', ['timestamp'])

    # Notifications
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('incident_id', sa.Integer(), sa.ForeignKey('incidents.id', ondelete='CASCADE'), nullable=True),
        sa.Column('notification_type', sa.Enum(
            'incident_new','incident_assigned','incident_updated',
            'incident_resolved','message_received','system_alert',
            name='notificationtype'), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])


def downgrade():
    op.drop_table('notifications')
    op.drop_table('messages')
    op.drop_table('incidents')
    op.drop_table('users')
