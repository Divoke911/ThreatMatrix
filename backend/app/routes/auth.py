from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    decode_token
)
from app import db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    # Generic error message to prevent user-enumeration security leaks (FR-1.7)
    if not user or not user.check_password(password):
        return jsonify({"msg": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"msg": "User account is deactivated"}), 403

    # Generate tokens with role claim directly in access token payload (satisfies NFR-2)
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    additional_claims = {"role": role_str}

    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": role_str
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Blacklist the current access token JTI
    access_jti = get_jwt()['jti']
    db.session.add(TokenBlacklist(jti=access_jti, token_type='access'))

    # Optionally blacklist the refresh token JTI if passed in JSON body
    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token')
    if refresh_token:
        try:
            decoded_refresh = decode_token(refresh_token)
            if decoded_refresh.get('type') == 'refresh':
                refresh_jti = decoded_refresh['jti']
                db.session.add(TokenBlacklist(jti=refresh_jti, token_type='refresh'))
        except Exception:
            pass  # Ignore invalid refresh token structures

    db.session.commit()
    return jsonify({"msg": "Successfully logged out"}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    if not user or not user.is_active:
        return jsonify({"msg": "User is inactive or does not exist"}), 401

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    additional_claims = {"role": role_str}

    new_access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    return jsonify({"access_token": new_access_token}), 200



