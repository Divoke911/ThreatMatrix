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


@alerts_bp.route('/<uuid:alert_id>/ai-analysis', methods=['POST'])
@jwt_required()
@role_required(['admin', 'analyst'])
def trigger_ai_analysis(alert_id):
    import os
    import json
    from openai import OpenAI

    alert = Alert.query.get_or_404(alert_id)
    
    # Check if AI reports already exist
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    existing_reports = AIReport.query.filter_by(alert_id=alert.id).all()
    
    if existing_reports and not force_refresh:
        return jsonify({
            'msg': 'AI reports already resolved for this alert.',
            'cached': True
        }), 200

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return jsonify({
            'msg': 'Groq API Key (GROQ_API_KEY) is not configured in backend environment parameters.',
            'error': 'Missing environment keys'
        }), 500
        
    model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Initialize client
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key
    )

    log_preview = str(alert.raw_log)

    system_prompt = (
        "You are an expert Security Analyst. Analyse the security alert and respond ONLY with a valid JSON object matching the following structure:\n"
        "{\n"
        "  \"explanation\": {\n"
        "    \"summary\": \"Plain English summary of the alert.\",\n"
        "    \"details\": \"In-depth explanation of what the alert means and why it might matter.\"\n"
        "  },\n"
        "  \"recommendation\": {\n"
        "    \"steps\": [\n"
        "      \"First containment or investigation step.\",\n"
        "      \"Second containment or investigation step.\"\n"
        "    ]\n"
        "  },\n"
        "  \"mitre_mapping\": {\n"
        "    \"techniques\": [\n"
        "      {\n"
        "        \"id\": \"MITRE ATT&CK technique ID (e.g. T1059)\",\n"
        "        \"name\": \"MITRE ATT&CK technique name\",\n"
        "        \"tactic\": \"MITRE ATT&CK tactic name (e.g. Execution)\",\n"
        "        \"rationale\": \"Why this technique maps to the alert description.\"\n"
        "      }\n"
        "    ]\n"
        "  },\n"
        "  \"log_summary\": {\n"
        "    \"summary\": \"Condensed narrative summarizing the raw log details.\",\n"
        "    \"indicators\": [\n"
        "      \"Extracted indicator of compromise (IOC) such as an IP address, user, command string, or filename.\"\n"
        "    ]\n"
        "  }\n"
        "}\n"
        "Do not include any conversational markdown framing (like ```json). Just output raw valid JSON."
    )

    user_prompt = f"Alert Title: {alert.title}\nSeverity: {alert.severity}\nSource: {alert.source}\nSource IP: {alert.source_ip}\nRaw Log: {log_preview}"

    attempts = 2
    success = False
    parsed_json = None
    last_error = ""

    for attempt in range(attempts):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=model_name,
                response_format={"type": "json_object"},
                temperature=0.2,
                timeout=25.0
            )
            raw_content = chat_completion.choices[0].message.content
            parsed_json = json.loads(raw_content)

            # Simple Schema Validation
            required_keys = ['explanation', 'recommendation', 'mitre_mapping', 'log_summary']
            if all(key in parsed_json for key in required_keys):
                if (
                    isinstance(parsed_json['explanation'], dict) and
                    isinstance(parsed_json['recommendation'], dict) and
                    isinstance(parsed_json['mitre_mapping'], dict) and
                    isinstance(parsed_json['log_summary'], dict) and
                    'summary' in parsed_json['explanation'] and
                    'details' in parsed_json['explanation'] and
                    'steps' in parsed_json['recommendation'] and
                    'techniques' in parsed_json['mitre_mapping'] and
                    'summary' in parsed_json['log_summary'] and
                    'indicators' in parsed_json['log_summary']
                ):
                    success = True
                    break
                else:
                    last_error = "Parsed JSON fields or types did not match the expected schema structure."
            else:
                last_error = f"Parsed JSON was missing one of the required schema categories: {required_keys}"
        except json.JSONDecodeError as jde:
            last_error = f"JSON Decode Error: {str(jde)}"
        except Exception as e:
            last_error = f"Groq API connection error: {str(e)}"

    if not success:
        return jsonify({
            'msg': 'AI Analyst agent failed to generate a schema-valid response.',
            'error': last_error
        }), 502

    # Clear old reports to prevent duplicate categories
    AIReport.query.filter_by(alert_id=alert.id).delete()

    # Save 4 separate AIReport rows
    reports_to_add = [
        AIReport(
            alert_id=alert.id,
            report_type='explanation',
            content=parsed_json['explanation'],
            model_used=model_name,
            created_at=datetime.utcnow()
        ),
        AIReport(
            alert_id=alert.id,
            report_type='recommendation',
            content=parsed_json['recommendation'],
            model_used=model_name,
            created_at=datetime.utcnow()
        ),
        AIReport(
            alert_id=alert.id,
            report_type='mitre_mapping',
            content=parsed_json['mitre_mapping'],
            model_used=model_name,
            created_at=datetime.utcnow()
        ),
        AIReport(
            alert_id=alert.id,
            report_type='log_summary',
            content=parsed_json['log_summary'],
            model_used=model_name,
            created_at=datetime.utcnow()
        )
    ]

    for rep in reports_to_add:
        db.session.add(rep)

    db.session.commit()

    return jsonify({
        'msg': 'AI reports successfully generated and persisted.',
        'cached': False
    }), 201
