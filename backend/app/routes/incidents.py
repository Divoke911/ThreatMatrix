import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.incident import Incident, incident_alerts
from app.models.alert import Alert
from app.models.timeline import IncidentTimeline
from app.models.user import User
from app.utils.decorators import role_required

incidents_bp = Blueprint('incidents', __name__, url_prefix='/api/incidents')

@incidents_bp.route('/analysts', methods=['GET'])
@jwt_required()
def get_analysts():
    """Returns a list of admins and analysts eligible for assignment."""
    users = User.query.filter(User.role.in_(['admin', 'analyst'])).all()
    users_data = []
    for u in users:
        users_data.append({
            'id': str(u.id),
            'name': u.name,
            'email': u.email,
            'role': u.role.value if hasattr(u.role, 'value') else str(u.role)
        })
    return jsonify(users_data), 200

@incidents_bp.route('', methods=['GET'])
@jwt_required()
def get_incidents():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    assigned_to = request.args.get('assigned_to')
    search = request.args.get('search')

    query = Incident.query

    if status:
        status_list = [s.strip().lower() for s in status.split(',')]
        query = query.filter(Incident.status.in_(status_list))

    if assigned_to:
        if assigned_to == 'unassigned':
            query = query.filter(Incident.assigned_to == None)
        else:
            try:
                assigned_uuid = uuid.UUID(assigned_to)
                query = query.filter(Incident.assigned_to == assigned_uuid)
            except ValueError:
                pass

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Incident.title.ilike(search_pattern)) |
            (Incident.description.ilike(search_pattern))
        )

    # Order by newest incident first
    query = query.order_by(Incident.created_at.desc())

    pagination = query.paginate(page=page, per_page=limit, error_out=False)

    incidents_data = []
    for inc in pagination.items:
        # Resolve assignee name
        assignee_name = "Unassigned"
        assignee_email = ""
        if inc.assigned_to:
            user_obj = User.query.get(inc.assigned_to)
            if user_obj:
                assignee_name = user_obj.name
                assignee_email = user_obj.email

        incidents_data.append({
            'id': str(inc.id),
            'title': inc.title,
            'description': inc.description,
            'status': inc.status.value if hasattr(inc.status, 'value') else str(inc.status),
            'assigned_to': str(inc.assigned_to) if inc.assigned_to else None,
            'assignee_name': assignee_name,
            'assignee_email': assignee_email,
            'alerts_count': len(inc.alerts),
            'created_at': inc.created_at.isoformat(),
            'updated_at': inc.updated_at.isoformat()
        })

    return jsonify({
        'incidents': incidents_data,
        'pagination': {
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'limit': pagination.per_page
        }
    }), 200

@incidents_bp.route('/<uuid:incident_id>', methods=['GET'])
@jwt_required()
def get_incident_detail(incident_id):
    incident = Incident.query.get_or_404(incident_id)

    # Fetch assignee details
    assignee_name = "Unassigned"
    assignee_email = ""
    if incident.assigned_to:
        user_obj = User.query.get(incident.assigned_to)
        if user_obj:
            assignee_name = user_obj.name
            assignee_email = user_obj.email

    # Fetch creator details
    creator_name = "System"
    creator_email = ""
    creator_obj = User.query.get(incident.created_by)
    if creator_obj:
        creator_name = creator_obj.name
        creator_email = creator_obj.email

    # Fetch linked alerts
    linked_alerts = []
    for a in incident.alerts:
        linked_alerts.append({
            'id': str(a.id),
            'title': a.title,
            'source': a.source.value if hasattr(a.source, 'value') else str(a.source),
            'source_ip': a.source_ip,
            'severity': a.severity.value if hasattr(a.severity, 'value') else str(a.severity),
            'status': a.status.value if hasattr(a.status, 'value') else str(a.status),
            'created_at': a.created_at.isoformat()
        })

    # Fetch chronological timeline (oldest first for progression)
    timeline_events = IncidentTimeline.query.filter_by(incident_id=incident.id).order_by(IncidentTimeline.created_at.asc()).all()
    timeline_data = []
    for e in timeline_events:
        actor_name = "System"
        actor_role = "system"
        actor_obj = User.query.get(e.actor_id)
        if actor_obj:
            actor_name = actor_obj.name
            actor_role = actor_obj.role.value if hasattr(actor_obj.role, 'value') else str(actor_obj.role)

        timeline_data.append({
            'id': str(e.id),
            'actor_id': str(e.actor_id),
            'actor_name': actor_name,
            'actor_role': actor_role,
            'event_type': e.event_type.value if hasattr(e.event_type, 'value') else str(e.event_type),
            'detail': e.detail,
            'created_at': e.created_at.isoformat()
        })

    return jsonify({
        'id': str(incident.id),
        'title': incident.title,
        'description': incident.description,
        'status': incident.status.value if hasattr(incident.status, 'value') else str(incident.status),
        'assigned_to': str(incident.assigned_to) if incident.assigned_to else None,
        'assignee_name': assignee_name,
        'assignee_email': assignee_email,
        'created_by': str(incident.created_by),
        'creator_name': creator_name,
        'creator_email': creator_email,
        'resolution_notes': incident.resolution_notes,
        'created_at': incident.created_at.isoformat(),
        'updated_at': incident.updated_at.isoformat(),
        'alerts': linked_alerts,
        'timeline': timeline_data
    }), 200

@incidents_bp.route('', methods=['POST'])
@jwt_required()
@role_required('admin', 'analyst')
def create_incident():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    assigned_to_val = data.get('assigned_to')
    alert_ids = data.get('alert_ids', [])

    if not title:
        return jsonify({'msg': 'Title is required to initialize an incident.'}), 400

    actor_id = uuid.UUID(get_jwt().get('sub'))

    assigned_uuid = None
    if assigned_to_val:
        try:
            assigned_uuid = uuid.UUID(assigned_to_val)
            # Verify user exists
            assignee = User.query.get(assigned_uuid)
            if not assignee or assignee.role.value not in ['admin', 'analyst']:
                return jsonify({'msg': 'Assignee must be an active Analyst or Administrator.'}), 400
        except ValueError:
            return jsonify({'msg': 'Invalid assignee ID format.'}), 400

    # Create new Incident
    incident = Incident(
        title=title,
        description=description,
        status='open',
        assigned_to=assigned_uuid,
        created_by=actor_id
    )
    db.session.add(incident)
    db.session.flush() # Flush to get incident.id

    # Append timeline 'created' event
    tl_create = IncidentTimeline(
        incident_id=incident.id,
        actor_id=actor_id,
        event_type='created',
        detail={'message': 'Incident initialized via Analyst Portal'},
        created_at=datetime.utcnow()
    )
    db.session.add(tl_create)

    # Append timeline 'assignment_change' event if assigned
    if assigned_uuid:
        tl_assign = IncidentTimeline(
            incident_id=incident.id,
            actor_id=actor_id,
            event_type='assignment_change',
            detail={
                'assigned_to': str(assigned_uuid),
                'message': f"Initial assignment set to responder"
            },
            created_at=datetime.utcnow()
        )
        db.session.add(tl_assign)

    # Link alerts if provided
    if alert_ids:
        linked_count = 0
        for aid in alert_ids:
            try:
                alert_uuid = uuid.UUID(aid)
                alert = Alert.query.get(alert_uuid)
                if alert:
                    incident.alerts.append(alert)
                    alert.status = 'escalated'
                    linked_count += 1
            except ValueError:
                pass
        
        if linked_count > 0:
            tl_link = IncidentTimeline(
                incident_id=incident.id,
                actor_id=actor_id,
                event_type='note_added',
                detail={'message': f"Linked {linked_count} alerts during initialization"},
                created_at=datetime.utcnow()
            )
            db.session.add(tl_link)

    db.session.commit()

    return jsonify({
        'id': str(incident.id),
        'title': incident.title,
        'status': incident.status,
        'assigned_to': str(incident.assigned_to) if incident.assigned_to else None,
        'created_at': incident.created_at.isoformat()
    }), 201

@incidents_bp.route('/<uuid:incident_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin', 'analyst')
def update_incident(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    data = request.get_json() or {}

    current_status = incident.status.value if hasattr(incident.status, 'value') else str(incident.status)
    actor_id = uuid.UUID(get_jwt().get('sub'))
    actor_role = get_jwt().get('role')

    # Soft-lock check
    if current_status == 'closed':
        # Check if the user is Admin AND attempting to change the status (re-open)
        new_status = data.get('status')
        if actor_role == 'admin' and new_status and new_status != 'closed':
            # Admin is re-opening. Allow status update but block other edits in this request
            if len(data.keys()) > 1:
                return jsonify({'msg': 'Closed incidents are soft-locked. You can only transition status back to open/investigating.'}), 400
        else:
            # Block everything else
            return jsonify({'msg': 'This incident is closed and soft-locked. Edits are prohibited.'}), 400

    # Fields update tracking
    status_changed = False
    assignee_changed = False
    notes_added = False
    
    old_status = current_status
    old_assignee = str(incident.assigned_to) if incident.assigned_to else None

    # Apply changes
    if 'title' in data:
        incident.title = data['title'].strip()
    if 'description' in data:
        incident.description = data['description'].strip()

    if 'status' in data:
        new_status = data['status'].lower().strip()
        allowed_statuses = ['open', 'investigating', 'resolved', 'closed']
        if new_status not in allowed_statuses:
            return jsonify({'msg': f"Invalid status. Must be one of {allowed_statuses}."}), 400
        
        # Enforce resolution notes when resolving or closing
        if new_status in ['resolved', 'closed']:
            res_notes = data.get('resolution_notes', incident.resolution_notes)
            if not res_notes or not res_notes.strip():
                return jsonify({'msg': 'Resolution notes are required when status is set to resolved or closed.'}), 400
            incident.resolution_notes = res_notes.strip()

        if current_status != new_status:
            incident.status = new_status
            status_changed = True

    if 'assigned_to' in data:
        new_assignee_val = data['assigned_to']
        if new_assignee_val:
            try:
                new_assignee_uuid = uuid.UUID(new_assignee_val)
                # Verify user exists
                user_obj = User.query.get(new_assignee_uuid)
                if not user_obj or user_obj.role.value not in ['admin', 'analyst']:
                    return jsonify({'msg': 'Assignee must be an active Analyst or Administrator.'}), 400
                
                if incident.assigned_to != new_assignee_uuid:
                    incident.assigned_to = new_assignee_uuid
                    assignee_changed = True
            except ValueError:
                return jsonify({'msg': 'Invalid assignee ID format.'}), 400
        else:
            if incident.assigned_to is not None:
                incident.assigned_to = None
                assignee_changed = True

    if 'resolution_notes' in data and not status_changed:
        # Resolution notes edited without status change
        incident.resolution_notes = data['resolution_notes'].strip()
        notes_added = True

    # Audit logging to timeline
    if status_changed:
        tl_status = IncidentTimeline(
            incident_id=incident.id,
            actor_id=actor_id,
            event_type='status_change',
            detail={
                'from': old_status,
                'to': incident.status.value if hasattr(incident.status, 'value') else str(incident.status),
                'message': f"Incident status changed to {incident.status.value if hasattr(incident.status, 'value') else str(incident.status)}"
            },
            created_at=datetime.utcnow()
        )
        db.session.add(tl_status)

    if assignee_changed:
        tl_assign = IncidentTimeline(
            incident_id=incident.id,
            actor_id=actor_id,
            event_type='assignment_change',
            detail={
                'from': old_assignee,
                'to': str(incident.assigned_to) if incident.assigned_to else None,
                'message': f"Assignee modified"
            },
            created_at=datetime.utcnow()
        )
        db.session.add(tl_assign)

    if notes_added:
        tl_notes = IncidentTimeline(
            incident_id=incident.id,
            actor_id=actor_id,
            event_type='note_added',
            detail={'message': 'Resolution notes updated'},
            created_at=datetime.utcnow()
        )
        db.session.add(tl_notes)

    incident.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'id': str(incident.id),
        'title': incident.title,
        'status': incident.status.value if hasattr(incident.status, 'value') else str(incident.status),
        'assigned_to': str(incident.assigned_to) if incident.assigned_to else None,
        'updated_at': incident.updated_at.isoformat()
    }), 200

@incidents_bp.route('/<uuid:incident_id>/alerts', methods=['POST'])
@jwt_required()
@role_required('admin', 'analyst')
def link_alerts(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    
    # Soft-lock check
    current_status = incident.status.value if hasattr(incident.status, 'value') else str(incident.status)
    if current_status == 'closed':
        return jsonify({'msg': 'Incident is closed. Linking alerts is prohibited.'}), 400

    data = request.get_json() or {}
    alert_ids = data.get('alert_ids', [])

    if not alert_ids:
        return jsonify({'msg': 'alert_ids parameter is empty.'}), 400

    actor_id = uuid.UUID(get_jwt().get('sub'))
    linked_count = 0

    for aid in alert_ids:
        try:
            alert_uuid = uuid.UUID(aid)
            alert = Alert.query.get(alert_uuid)
            if alert and alert not in incident.alerts:
                incident.alerts.append(alert)
                alert.status = 'escalated'
                
                # Append audit note
                tl_event = IncidentTimeline(
                    incident_id=incident.id,
                    actor_id=actor_id,
                    event_type='note_added',
                    detail={
                        'message': f"Linked alert: [{alert.title}]",
                        'alert_id': str(alert.id)
                    },
                    created_at=datetime.utcnow()
                )
                db.session.add(tl_event)
                linked_count += 1
        except ValueError:
            pass

    if linked_count > 0:
        incident.updated_at = datetime.utcnow()
        db.session.commit()

    return jsonify({
        'linked_count': linked_count,
        'total_alerts': len(incident.alerts)
    }), 200

@incidents_bp.route('/<uuid:incident_id>/alerts', methods=['DELETE'])
@jwt_required()
@role_required('admin', 'analyst')
def unlink_alerts(incident_id):
    incident = Incident.query.get_or_404(incident_id)
    
    # Soft-lock check
    current_status = incident.status.value if hasattr(incident.status, 'value') else str(incident.status)
    if current_status == 'closed':
        return jsonify({'msg': 'Incident is closed. Unlinking alerts is prohibited.'}), 400

    data = request.get_json() or {}
    alert_ids = data.get('alert_ids', [])

    if not alert_ids:
        return jsonify({'msg': 'alert_ids parameter is empty.'}), 400

    actor_id = uuid.UUID(get_jwt().get('sub'))
    unlinked_count = 0

    for aid in alert_ids:
        try:
            alert_uuid = uuid.UUID(aid)
            alert = Alert.query.get(alert_uuid)
            if alert and alert in incident.alerts:
                incident.alerts.remove(alert)
                alert.status = 'in_review'
                
                # Append audit note
                tl_event = IncidentTimeline(
                    incident_id=incident.id,
                    actor_id=actor_id,
                    event_type='note_added',
                    detail={
                        'message': f"Unlinked alert: [{alert.title}]",
                        'alert_id': str(alert.id)
                    },
                    created_at=datetime.utcnow()
                )
                db.session.add(tl_event)
                unlinked_count += 1
        except ValueError:
            pass

    if unlinked_count > 0:
        incident.updated_at = datetime.utcnow()
        db.session.commit()

    return jsonify({
        'unlinked_count': unlinked_count,
        'total_alerts': len(incident.alerts)
    }), 200

@incidents_bp.route('/<uuid:incident_id>/timeline', methods=['POST'])
@jwt_required()
@role_required('admin', 'analyst')
def add_timeline_note(incident_id):
    incident = Incident.query.get_or_404(incident_id)

    # Soft-lock check
    current_status = incident.status.value if hasattr(incident.status, 'value') else str(incident.status)
    if current_status == 'closed':
        return jsonify({'msg': 'Incident is closed. Timeline comments are disabled.'}), 400

    data = request.get_json() or {}
    note = data.get('note', '').strip()

    if not note:
        return jsonify({'msg': 'Timeline note cannot be empty.'}), 400

    actor_id = uuid.UUID(get_jwt().get('sub'))

    tl_event = IncidentTimeline(
        incident_id=incident.id,
        actor_id=actor_id,
        event_type='note_added',
        detail={
            'note': note,
            'message': f"Analyst added investigation notes"
        },
        created_at=datetime.utcnow()
    )
    db.session.add(tl_event)
    
    incident.updated_at = datetime.utcnow()
    db.session.commit()

    # Get actor user info
    actor_obj = User.query.get(actor_id)

    return jsonify({
        'id': str(tl_event.id),
        'actor_name': actor_obj.name if actor_obj else 'System',
        'actor_role': (actor_obj.role.value if hasattr(actor_obj.role, 'value') else str(actor_obj.role)) if actor_obj else 'system',
        'event_type': 'note_added',
        'detail': tl_event.detail,
        'created_at': tl_event.created_at.isoformat()
    }), 201
