from datetime import datetime
from app import db

class IncidentTimeline(db.Model):
    __tablename__ = 'incident_timeline'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    incident_id = db.Column(db.Uuid, db.ForeignKey('incidents.id', ondelete='CASCADE'), nullable=False)
    actor_id = db.Column(db.Uuid, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)  # Keep timeline event if user deleted
    event_type = db.Column(
        db.Enum(
            'created', 'status_change', 'assignment_change', 'note_added', 'closed',
            name='timeline_event_types', native_enum=True
        ),
        nullable=False
    )
    detail = db.Column(db.JSON, nullable=True)  # Store change metadata, e.g., {"from": "open", "to": "investigating"}
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<IncidentTimeline {self.event_type} for Incident {self.incident_id}>"
