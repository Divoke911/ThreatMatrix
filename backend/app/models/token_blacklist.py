from datetime import datetime
from app import db

class TokenBlacklist(db.Model):
    __tablename__ = 'token_blacklist'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(10), nullable=False)  # 'access' or 'refresh'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TokenBlacklist jti={self.jti} type={self.token_type}>"
