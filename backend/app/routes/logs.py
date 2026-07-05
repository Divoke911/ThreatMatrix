import random
from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Log, Alert
from app.utils.decorators import role_required
from app.utils.seed import generate_raw_log

logs_bp = Blueprint('logs', __name__, url_prefix='/api/logs')

alert_templates = {
    "firewall": [
        {"title": "Firewall Outbound Rule Violation", "severity": "medium", "description": "Multiple egress connection attempts detected on unusual ports targeting suspicious destinations."},
        {"title": "Massive Inbound Probe / Port Scan", "severity": "low", "description": "Firewall logs indicate a high frequency of dropped packets from a single source IP, suggesting port scanning activity."}
    ],
    "ids": [
        {"title": "IDS Alert: Possible SQL Injection Attack", "severity": "high", "description": "An intrusion detection signature triggered based on web request payload parameters matching known SQL injection scripts."},
        {"title": "IDS Alert: Command & Control Activity Detected", "severity": "critical", "description": "Outbound DNS or HTTP connection resolved to an IP address flagged in C2 beaconing threat intelligence feeds."},
        {"title": "IDS Alert: Vulnerability Scan Detected", "severity": "medium", "description": "An anomalous host query triggered signature matching active vulnerability scanners."}
    ],
    "endpoint": [
        {"title": "Endpoint Security: Untrusted Binary Spawned", "severity": "high", "description": "A non-standard process was launched from the user AppData folder, a typical persistence pattern for malware."},
        {"title": "Endpoint Security: Credentials Harvesting Tool Detected", "severity": "critical", "description": "Sysmon logs detected execution flags suggesting attempts to dump system LSASS memory for passwords."}
    ],
    "auth": [
        {"title": "Authentication: SSH Brute Force Detected", "severity": "medium", "description": "Brute force pattern detected with high number of failed authentication requests from single source IP within a short interval."},
        {"title": "Authentication: Successful Login from Anomalous Country", "severity": "high", "description": "Geographical location checks detected successful authentication using administrative credentials from outside local regions."}
    ]
}

@logs_bp.route('/simulate', methods=['POST'])
@jwt_required()
@role_required('admin')
def simulate_traffic():
    # 1. Generate single raw log
    now = datetime.utcnow()
    log = generate_raw_log(now)
    db.session.add(log)
    db.session.commit()
    
    alert_created = False
    alert_details = None
    
    # 2. 30% probability of triggering an alert
    if random.random() < 0.30:
        source = log.source
        templates = alert_templates[source]
        template = random.choice(templates)
        
        alert = Alert(
            title=template["title"],
            description=f"{template['description']} [Reference Log: {log.raw_text[:120]}...]",
            source=source,
            source_ip=log.parsed.get("source_ip") if isinstance(log.parsed, dict) else None,
            severity=template["severity"],
            status="new",
            raw_log=log.parsed,
            created_at=log.ingested_at,
            updated_at=log.ingested_at
        )
        db.session.add(alert)
        db.session.commit()
        
        alert_created = True
        alert_details = {
            "id": str(alert.id),
            "title": alert.title,
            "severity": alert.severity
        }
        
    return jsonify({
        "msg": "Log simulation run complete.",
        "log_created": {
            "id": str(log.id),
            "source": log.source,
            "raw_text": log.raw_text
        },
        "alert_triggered": alert_created,
        "alert": alert_details
    }), 201
