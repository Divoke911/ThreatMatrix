from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def role_required(*roles):
    """
    Decorator to restrict route access to specific roles.
    Expects JWT to be verified and contain a 'role' claim.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT exists and is valid
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"msg": "Missing or invalid authentication token"}), 401

            claims = get_jwt()
            user_role = claims.get("role")

            if not user_role or user_role not in roles:
                return jsonify({"msg": "Forbidden: Insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
