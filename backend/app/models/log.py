from datetime import datetime
from app import db

class Log(db.Model):
    __tablename__ = 'logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    source = db.Column(db.String(100), nullable=False)
    raw_text = db.Column(db.Text, nullable=False)
    parsed = db.Column(db.JSON, nullable=True)  # Maps to JSONB in PostgreSQL
    ingested_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Log {self.id} from {self.source}>"
