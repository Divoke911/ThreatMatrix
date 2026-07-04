import uuid
import bcrypt
from datetime import datetime
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum('admin', 'analyst', 'viewer', name='user_roles', native_enum=True),
        nullable=False
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    assigned_incidents = db.relationship('Incident', foreign_keys='Incident.assigned_to', backref='assignee', lazy=True)
    created_incidents = db.relationship('Incident', foreign_keys='Incident.created_by', backref='creator', lazy=True)
    timeline_events = db.relationship('IncidentTimeline', backref='actor', lazy=True)

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

