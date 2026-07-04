from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app import db
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.log import Log
from app.models.user import User

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    days = request.args.get('days', 7, type=int)
    if days not in [7, 30]:
        days = 7  # Fallback to default
        
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 1. Total Metrics
    total_logs = Log.query.count()
    total_alerts = Alert.query.count()
    active_incidents = Incident.query.filter(Incident.status.in_(['open', 'investigating'])).count()
    resolved_incidents = Incident.query.filter(Incident.status.in_(['resolved', 'closed'])).count()

    # 2. Severity Breakdown (low, medium, high, critical)
    severity_stats = db.session.query(
        Alert.severity,
        func.count(Alert.id)
    ).group_by(Alert.severity).all()
    
    severity_breakdown = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    for s, count in severity_stats:
        s_str = s.value if hasattr(s, 'value') else str(s)
        if s_str in severity_breakdown:
            severity_breakdown[s_str] = count

    # 3. Source Distribution
    source_stats = db.session.query(
        Alert.source,
        func.count(Alert.id)
    ).group_by(Alert.source).all()
    
    source_distribution = {}
    for src, count in source_stats:
        src_str = src.value if hasattr(src, 'value') else str(src)
        source_distribution[src_str] = count

    # 4. Incident Status Summary
    incident_stats = db.session.query(
        Incident.status,
        func.count(Incident.id)
    ).group_by(Incident.status).all()
    
    incident_status_breakdown = {'open': 0, 'investigating': 0, 'resolved': 0, 'closed': 0}
    for status, count in incident_stats:
        status_str = status.value if hasattr(status, 'value') else str(status)
        if status_str in incident_status_breakdown:
            incident_status_breakdown[status_str] = count

    # 5. Time-Series Trend Ingestion (7D / 30D portable date casting)
    date_field = func.cast(Alert.created_at, db.Date)
    daily_alerts = db.session.query(
        date_field.label('date'),
        func.count(Alert.id).label('count')
    ).filter(Alert.created_at >= start_date)\
     .group_by(date_field)\
     .order_by(date_field.asc())\
     .all()

    # Pre-populate empty dates dictionary to avoid line breaks or empty segments
    trend_dict = {}
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=i)).date()
        trend_dict[d.isoformat()] = 0
        
    for row in daily_alerts:
        d_str = row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date)
        if d_str in trend_dict:
            trend_dict[d_str] = row.count
            
    alerts_trend = [{'date': k, 'count': v} for k, v in sorted(trend_dict.items())]

    # 6. Recent Ingestions Split feeds (5 alerts and 5 incidents)
    recent_alerts_q = Alert.query.order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts = []
    for a in recent_alerts_q:
        recent_alerts.append({
            'id': str(a.id),
            'title': a.title,
            'severity': a.severity.value if hasattr(a.severity, 'value') else str(a.severity),
            'status': a.status.value if hasattr(a.status, 'value') else str(a.status),
            'source': a.source.value if hasattr(a.source, 'value') else str(a.source),
            'source_ip': a.source_ip,
            'created_at': a.created_at.isoformat()
        })

    recent_incidents_q = Incident.query.order_by(Incident.created_at.desc()).limit(5).all()
    recent_incidents = []
    for inc in recent_incidents_q:
        assignee_name = "Unassigned"
        if inc.assigned_to:
            user_obj = User.query.get(inc.assigned_to)
            if user_obj:
                assignee_name = user_obj.name
                
        recent_incidents.append({
            'id': str(inc.id),
            'title': inc.title,
            'status': inc.status.value if hasattr(inc.status, 'value') else str(inc.status),
            'assignee_name': assignee_name,
            'created_at': inc.created_at.isoformat()
        })

    return jsonify({
        'total_logs': total_logs,
        'total_alerts': total_alerts,
        'active_incidents': active_incidents,
        'resolved_incidents': resolved_incidents,
        'severity_breakdown': severity_breakdown,
        'source_distribution': source_distribution,
        'incident_status_breakdown': incident_status_breakdown,
        'alerts_trend': alerts_trend,
        'recent_alerts': recent_alerts,
        'recent_incidents': recent_incidents
    }), 200
