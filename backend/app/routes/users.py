from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.user import User
from app.utils.decorators import role_required

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('', methods=['GET'])
@jwt_required()
@role_required('admin')
def get_users():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    pagination = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    
    users_data = []
    for u in pagination.items:
        users_data.append({
            'id': str(u.id),
            'name': u.name,
            'email': u.email,
            'role': u.role.value if hasattr(u.role, 'value') else str(u.role),
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat()
        })
        
    return jsonify({
        'users': users_data,
        'pagination': {
            'total': pagination.total,
            'pages': pagination.pages,
            'page': page,
            'limit': limit
        }
    }), 200

@users_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin')
def create_user():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    role = data.get('role', '').strip().lower()
    password = data.get('password', '')
    
    if not name or not email or not role or not password:
        return jsonify({'msg': 'Name, email, role, and password are required.'}), 400
        
    if role not in ['admin', 'analyst', 'viewer']:
        return jsonify({'msg': "Invalid role. Must be 'admin', 'analyst', or 'viewer'."}), 400
        
    # Check for duplicate email address to prevent constraint violations
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'msg': 'Email address already registered.'}), 409
        
    new_user = User(
        name=name,
        email=email,
        role=role,
        is_active=True,
        created_at=datetime.utcnow()
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'id': str(new_user.id),
        'name': new_user.name,
        'email': new_user.email,
        'role': new_user.role.value if hasattr(new_user.role, 'value') else str(new_user.role),
        'is_active': new_user.is_active,
        'created_at': new_user.created_at.isoformat()
    }), 201

@users_bp.route('/<uuid:user_id>/role', methods=['PATCH'])
@jwt_required()
@role_required('admin')
def update_user_role(user_id):
    data = request.get_json() or {}
    new_role = data.get('role', '').strip().lower()
    
    if not new_role or new_role not in ['admin', 'analyst', 'viewer']:
        return jsonify({'msg': "Invalid role. Must be 'admin', 'analyst', or 'viewer'."}), 400
        
    user = User.query.get_or_404(user_id)
    
    # Safeguard: if changing role AWAY from admin, verify not last remaining active admin
    current_role = (user.role.value if hasattr(user.role, 'value') else str(user.role)).lower().strip()
    if current_role == 'admin' and new_role != 'admin' and user.is_active:
        active_users = User.query.filter_by(is_active=True).all()
        active_admins_count = sum(
            1 for u in active_users 
            if (u.role.value if hasattr(u.role, 'value') else str(u.role)).lower().strip() == 'admin'
        )
        if active_admins_count <= 1:
            return jsonify({'msg': 'Cannot remove the last remaining admin.'}), 400
            
    user.role = new_role
    db.session.commit()
    
    return jsonify({
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'role': user.role.value if hasattr(user.role, 'value') else str(user.role),
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat()
    }), 200

@users_bp.route('/<uuid:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('admin')
def deactivate_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if not user.is_active:
        return jsonify({'msg': 'User is already deactivated.'}), 400
        
    # Safeguard: if active admin, verify not last remaining active admin
    current_role = (user.role.value if hasattr(user.role, 'value') else str(user.role)).lower().strip()
    if current_role == 'admin':
        active_users = User.query.filter_by(is_active=True).all()
        active_admins_count = sum(
            1 for u in active_users 
            if (u.role.value if hasattr(u.role, 'value') else str(u.role)).lower().strip() == 'admin'
        )
        if active_admins_count <= 1:
            return jsonify({'msg': 'Cannot remove the last remaining admin.'}), 400
            
    user.is_active = False
    db.session.commit()
    
    return jsonify({
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'role': user.role.value if hasattr(user.role, 'value') else str(user.role),
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat(),
        'msg': 'User successfully deactivated.'
    }), 200
