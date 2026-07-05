from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    
    return jsonify({
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'role': role_str,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat()
    }), 200

@settings_bp.route('/profile', methods=['PATCH'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    
    if not name or not email:
        return jsonify({'msg': 'Name and email are required parameters.'}), 400
        
    # Check if another user is already registered with this email address
    existing = User.query.filter(User.email == email, User.id != user.id).first()
    if existing:
        return jsonify({'msg': 'Email address already in use.'}), 409
        
    user.name = name
    user.email = email
    db.session.commit()
    
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    
    return jsonify({
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'role': role_str,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat()
    }), 200

@settings_bp.route('/password', methods=['PATCH'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    
    if not current_password or not new_password:
        return jsonify({'msg': 'Current and new password are required fields.'}), 400
        
    if len(new_password) < 6:
        return jsonify({'msg': 'New password must be at least 6 characters long.'}), 400
        
    # Verify current password credentials
    if not user.check_password(current_password):
        return jsonify({'msg': 'Current password is incorrect.'}), 401
        
    # Apply new password
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({'msg': 'Password successfully rotated.'}), 200
