import uuid
from datetime import datetime
from app import db

class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    source = db.Column(db.String(100), nullable=False)
    source_ip = db.Column(db.String(45), nullable=True)  # Supports both IPv4 and IPv6
    severity = db.Column(
        db.Enum('low', 'medium', 'high', 'critical', name='alert_severities', native_enum=True),
        nullable=False,
        index=True
    )
    status = db.Column(
        db.Enum('new', 'in_review', 'escalated', 'closed', name='alert_statuses', native_enum=True),
        nullable=False,
        default='new',
        index=True
    )
    raw_log = db.Column(db.JSON, nullable=False)  # Maps to JSONB in PostgreSQL
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ai_reports = db.relationship('AIReport', backref='alert', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Alert {self.title} ({self.severity})>"
