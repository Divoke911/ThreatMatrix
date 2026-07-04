from datetime import datetime
from app import db

class AIReport(db.Model):
    __tablename__ = 'ai_reports'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    alert_id = db.Column(db.Uuid, db.ForeignKey('alerts.id', ondelete='CASCADE'), nullable=False)
    report_type = db.Column(
        db.Enum(
            'explanation', 'mitre_mapping', 'recommendation', 'log_summary',
            name='ai_report_types', native_enum=True
        ),
        nullable=False
    )
    content = db.Column(db.JSON, nullable=False)  # Maps to JSONB in PostgreSQL
    model_used = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<AIReport {self.report_type} for Alert {self.alert_id}>"
