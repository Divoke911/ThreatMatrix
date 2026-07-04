import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.alert import Alert
from app.models.ai_report import AIReport
from app.models.timeline import IncidentTimeline
from app.utils.decorators import role_required

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
@jwt_required()
def get_alerts():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    severity = request.args.get('severity')
    status = request.args.get('status')
    source = request.args.get('source')
    search = request.args.get('search')
    sort = request.args.get('sort', 'created_at_desc')

    query = Alert.query

    if severity:
        severity_list = [s.strip().lower() for s in severity.split(',')]
        query = query.filter(Alert.severity.in_(severity_list))

    if status:
        status_list = [s.strip().lower() for s in status.split(',')]
        query = query.filter(Alert.status.in_(status_list))

    if source:
        source_list = [s.strip().lower() for s in source.split(',')]
        query = query.filter(Alert.source.in_(source_list))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Alert.title.ilike(search_pattern)) | 
            (Alert.source_ip.ilike(search_pattern))
        )

    # Custom weights sorting for severity values: low < medium < high < critical
    if sort == 'created_at_asc':
        query = query.order_by(Alert.created_at.asc())
    elif sort == 'created_at_desc':
        query = query.order_by(Alert.created_at.desc())
    elif sort == 'severity_asc':
        query = query.order_by(
            db.case(
                (Alert.severity == 'low', 1),
                (Alert.severity == 'medium', 2),
                (Alert.severity == 'high', 3),
                (Alert.severity == 'critical', 4),
                else_=5
            ).asc()
        )
    elif sort == 'severity_desc':
        query = query.order_by(
            db.case(
                (Alert.severity == 'low', 1),
                (Alert.severity == 'medium', 2),
                (Alert.severity == 'high', 3),
                (Alert.severity == 'critical', 4),
                else_=5
            ).desc()
        )
    else:
        query = query.order_by(Alert.created_at.desc())

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    alerts_data = []
    for a in pagination.items:
        alerts_data.append({
            'id': str(a.id),
            'title': a.title,
            'source': a.source.value if hasattr(a.source, 'value') else str(a.source),
            'source_ip': a.source_ip,
            'severity': a.severity.value if hasattr(a.severity, 'value') else str(a.severity),
            'status': a.status.value if hasattr(a.status, 'value') else str(a.status),
            'created_at': a.created_at.isoformat(),
            'updated_at': a.updated_at.isoformat()
        })

    return jsonify({
        'alerts': alerts_data,
        'pagination': {
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages,
            'limit': pagination.per_page
        }
    }), 200

@alerts_bp.route('/<uuid:alert_id>', methods=['GET'])
@jwt_required()
def get_alert_detail(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    
    # Map associated incidents via backref 'incidents'
    linked_incidents = []
    for inc in alert.incidents:
        linked_incidents.append({
            'id': str(inc.id),
            'title': inc.title,
            'status': inc.status.value if hasattr(inc.status, 'value') else str(inc.status)
        })

    # Fetch AI reports linked to this alert
    ai_reports_data = []
    for r in alert.ai_reports:
        ai_reports_data.append({
            'id': str(r.id),
            'report_type': r.report_type.value if hasattr(r.report_type, 'value') else str(r.report_type),
            'content': r.content,
            'model_used': r.model_used,
            'created_at': r.created_at.isoformat()
        })

    return jsonify({
        'id': str(alert.id),
        'title': alert.title,
        'description': alert.description,
        'source': alert.source.value if hasattr(alert.source, 'value') else str(alert.source),
        'source_ip': alert.source_ip,
        'severity': alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
        'status': alert.status.value if hasattr(alert.status, 'value') else str(alert.status),
        'raw_log': alert.raw_log,
        'created_at': alert.created_at.isoformat(),
        'updated_at': alert.updated_at.isoformat(),
        'incidents': linked_incidents,
        'ai_reports': ai_reports_data
    }), 200

@alerts_bp.route('/<uuid:alert_id>', methods=['PATCH'])
@jwt_required()
@role_required('admin', 'analyst')
def update_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    data = request.get_json() or {}

    allowed_statuses = ['new', 'in_review', 'escalated', 'closed']
    allowed_severities = ['low', 'medium', 'high', 'critical']

    status_changed = False
    severity_changed = False

    if 'status' in data:
        new_status = data['status'].lower().strip()
        if new_status not in allowed_statuses:
            return jsonify({'msg': f"Invalid status. Must be one of {allowed_statuses}."}), 400
        if alert.status != new_status:
            alert.status = new_status
            status_changed = True

    if 'severity' in data:
        new_severity = data['severity'].lower().strip()
        if new_severity not in allowed_severities:
            return jsonify({'msg': f"Invalid severity. Must be one of {allowed_severities}."}), 400
        if alert.severity != new_severity:
            alert.severity = new_severity
            severity_changed = True

    if status_changed or severity_changed:
        alert.updated_at = datetime.utcnow()
        
        # Log audit notes to linked incidents (if any)
        try:
            actor_id = uuid.UUID(get_jwt().get('sub'))
            for inc in alert.incidents:
                change_msg = f"status updated to '{alert.status}'" if status_changed else f"severity updated to '{alert.severity}'"
                timeline_event = IncidentTimeline(
                    incident_id=inc.id,
                    actor_id=actor_id,
                    event_type="note_added",
                    detail={
                        "message": f"Associated alert [{alert.title}] modified: {change_msg}",
                        "alert_id": str(alert.id)
                    },
                    created_at=datetime.utcnow()
                )
                db.session.add(timeline_event)
        except Exception as e:
            # Guard against potential formatting errors with JWT token claims
            print("Timeline logging error:", e)

        db.session.commit()

    return jsonify({
        'id': str(alert.id),
        'title': alert.title,
        'source': alert.source.value if hasattr(alert.source, 'value') else str(alert.source),
        'source_ip': alert.source_ip,
        'severity': alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity),
        'status': alert.status.value if hasattr(alert.status, 'value') else str(alert.status),
        'created_at': alert.created_at.isoformat(),
        'updated_at': alert.updated_at.isoformat()
    }), 200
