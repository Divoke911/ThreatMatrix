import uuid
from datetime import datetime
from app import db

# Association Table for Incident <-> Alert relationship
incident_alerts = db.Table(
    'incident_alerts',
    db.Column('incident_id', db.Uuid, db.ForeignKey('incidents.id', ondelete='CASCADE'), primary_key=True),
    db.Column('alert_id', db.Uuid, db.ForeignKey('alerts.id', ondelete='CASCADE'), primary_key=True)
)

class Incident(db.Model):
    __tablename__ = 'incidents'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('open', 'investigating', 'resolved', 'closed', name='incident_statuses', native_enum=True),
        nullable=False,
        default='open'
    )
    assigned_to = db.Column(db.Uuid, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Uuid, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    alerts = db.relationship('Alert', secondary=incident_alerts, backref=db.backref('incidents', lazy=True), lazy=True)
    timeline_events = db.relationship('IncidentTimeline', backref='incident', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Incident {self.title} ({self.status})>"
