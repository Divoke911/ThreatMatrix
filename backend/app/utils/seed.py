import random
import uuid
from datetime import datetime, timedelta
from app import db
from app.models import User, Alert, Incident, incident_alerts, IncidentTimeline, AIReport, Log, TokenBlacklist

def clear_db():
    print("Clearing existing data...")
    # Safe delete order to prevent Foreign Key violations
    db.session.query(TokenBlacklist).delete()
    db.session.query(IncidentTimeline).delete()
    db.session.execute(incident_alerts.delete())
    db.session.query(Incident).delete()
    db.session.query(AIReport).delete()
    db.session.query(Alert).delete()
    db.session.query(Log).delete()
    db.session.query(User).delete()
    db.session.commit()
    print("Cleanup completed.")

# Helper values for realistic generation
IPS = [f"192.168.1.{i}" for i in range(10, 250)] + [f"10.0.0.{i}" for i in range(5, 100)] + ["185.190.140.10", "198.51.100.42", "203.0.113.15"]
DEST_IPS = ["10.0.2.15", "10.0.2.16", "172.16.42.100", "172.16.42.101"]
USERNAMES = ["jsmith", "amiller", "twilson", "hrodriguez", "kchen", "sapatel", "service_account"]
PROCESSES = ["cmd.exe", "powershell.exe", "whoami.exe", "curl.exe", "nginx", "python3", "sqlmap.py", "mimikatz.exe", "schtasks.exe"]
PORTS = [80, 443, 22, 3389, 8080, 5432]
IDS_SIGNATURES = [
    {"id": 2001234, "name": "ET SCAN Possible SQL Injection Attempt", "severity": "high"},
    {"id": 2011432, "name": "ET ATTACK SSH Brute Force Attempt", "severity": "medium"},
    {"id": 2000543, "name": "ET MALWARE Known C2 Beacon Activity", "severity": "critical"},
    {"id": 2009811, "name": "ET EXPLOIT Remote Code Execution Vulnerability Scanned", "severity": "high"},
    {"id": 2010888, "name": "ET POLICY Cryptomining Traffic Detected", "severity": "medium"}
]

def generate_raw_log(timestamp):
    log_type = random.choice(["firewall", "ids", "endpoint", "auth"])
    source_ip = random.choice(IPS)
    
    if log_type == "firewall":
        action = random.choices(["ALLOW", "DENY"], weights=[85, 15])[0]
        payload = {
            "timestamp": timestamp.isoformat(),
            "source_ip": source_ip,
            "destination_ip": random.choice(DEST_IPS),
            "destination_port": random.choice(PORTS),
            "protocol": random.choice(["TCP", "UDP"]),
            "action": action,
            "bytes_transferred": random.randint(40, 50000)
        }
        raw_text = f"{timestamp.strftime('%b %d %H:%M:%S')} firewall: src={payload['source_ip']} dst={payload['destination_ip']} dport={payload['destination_port']} proto={payload['protocol']} action={payload['action']} size={payload['bytes_transferred']}"
    
    elif log_type == "ids":
        sig = random.choice(IDS_SIGNATURES)
        payload = {
            "timestamp": timestamp.isoformat(),
            "signature_id": sig["id"],
            "signature_name": sig["name"],
            "alert_severity": sig["severity"],
            "source_ip": source_ip,
            "destination_ip": random.choice(DEST_IPS)
        }
        raw_text = f"{timestamp.strftime('%b %d %H:%M:%S')} snort[{random.randint(100, 999)}]: [1:{payload['signature_id']}:1] {payload['signature_name']} [Classification: Attempted Intrusion] [Priority: 1] TCP {payload['source_ip']} -> {payload['destination_ip']}"
        
    elif log_type == "endpoint":
        username = random.choice(USERNAMES)
        process = random.choice(PROCESSES)
        action = random.choice(["execute", "file_modify", "registry_key_create"])
        payload = {
            "timestamp": timestamp.isoformat(),
            "hostname": f"WS-ENG-{random.randint(100, 199)}",
            "username": username,
            "process_name": process,
            "process_id": random.randint(1000, 9000),
            "action": action,
            "details": f"Ran process {process} with parent explorer.exe" if action == "execute" else f"Modified file in C:\\Users\\{username}\\AppData"
        }
        raw_text = f"{timestamp.isoformat()} sysmon: Host={payload['hostname']} User={payload['username']} Process={payload['process_name']} PID={payload['process_id']} Action={payload['action']} Details={payload['details']}"

    else: # auth log
        username = random.choice(USERNAMES)
        status = random.choices(["success", "failed"], weights=[80, 20])[0]
        service = random.choice(["SSH", "Web Portal", "RDP"])
        payload = {
            "timestamp": timestamp.isoformat(),
            "username": username,
            "source_ip": source_ip,
            "status": status,
            "auth_service": service
        }
        raw_text = f"{timestamp.strftime('%b %d %H:%M:%S')} sshd[{random.randint(1000, 9000)}]: {'Accepted' if status == 'success' else 'Failed'} password for {payload['username']} from {payload['source_ip']} port {random.randint(1024, 65535)} ssh2"

    return Log(source=log_type, raw_text=raw_text, parsed=payload, ingested_at=timestamp)

def seed_data():
    clear_db()
    
    # 1. Seed Users (8 users)
    password = "password123"
    users_data = [
        {"name": "System Administrator", "email": "admin@threatmatrix.com", "role": "admin"},
        {"name": "Lead Analyst Alice", "email": "analyst1@threatmatrix.com", "role": "analyst"},
        {"name": "Analyst Bob", "email": "analyst2@threatmatrix.com", "role": "analyst"},
        {"name": "Viewer Officer Chief", "email": "viewer1@threatmatrix.com", "role": "viewer"}
    ]
    
    users = []
    for ud in users_data:
        user = User(name=ud["name"], email=ud["email"], role=ud["role"])
        user.set_password(password)
        db.session.add(user)
        users.append(user)
    
    db.session.commit()
    print(f"Seeded {len(users)} users.")
    
    # Filter users by role
    admins_analysts = [u for u in users if u.role in ["admin", "analyst"]]
    analysts = [u for u in users if u.role == "analyst"]
    
    # 2. Seed Raw Logs (750 total entries spread over 30 days)
    base_time = datetime.utcnow()
    logs = []
    print("Generating simulated raw logs...")
    for i in range(750):
        seconds_offset = random.randint(0, 30 * 24 * 3600)
        timestamp = base_time - timedelta(seconds=seconds_offset)
        log = generate_raw_log(timestamp)
        db.session.add(log)
        logs.append(log)
        
    db.session.commit()
    print(f"Seeded {len(logs)} logs.")
    
    # 3. Seed Alerts (250 total entries)
    print("Generating alerts from logs...")
    alert_logs = random.sample(logs, 250)
    alerts = []
    
    statuses = ["new", "in_review", "escalated", "closed"]
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
    
    for log in alert_logs:
        source = log.source
        templates = alert_templates[source]
        template = random.choice(templates)
        
        status = random.choices(statuses, weights=[40, 20, 20, 20])[0]
        severity = template["severity"]
        
        alert = Alert(
            title=template["title"],
            description=f"{template['description']} [Reference Log: {log.raw_text[:120]}...]",
            source=source,
            source_ip=log.parsed.get("source_ip"),
            severity=severity,
            status=status,
            raw_log=log.parsed,
            created_at=log.ingested_at,
            updated_at=log.ingested_at + timedelta(minutes=random.randint(5, 120))
        )
        db.session.add(alert)
        alerts.append(alert)
        
    db.session.commit()
    print(f"Seeded {len(alerts)} alerts.")
    
    # 4. Seed Incidents (40 incidents)
    print("Generating incidents...")
    escalated_alerts = [a for a in alerts if a.status in ["escalated", "closed"]]
    if len(escalated_alerts) < 80:
        escalated_alerts = random.sample(alerts, min(120, len(alerts)))
        
    incident_statuses = ["open", "investigating", "resolved", "closed"]
    incident_templates = [
        {"title": "Brute Force Campaign & User Compromise", "description": "Multiple failed authentications from a single host followed by a successful credential authorization and shell execution."},
        {"title": "SQL Injection & Data Extraction Pattern", "description": "Web service logs indicate repetitive exploitation attempts targeting backend relational database queries."},
        {"title": "Anomalous Command Line Activity & Credential Dumping", "description": "Endpoint execution indicators suggest execution of administrative commands and memory reading tools on developer server."},
        {"title": "Internal Malware Propagation beaconing out to C2", "description": "Host exhibiting traffic to known bad external IPs indicating malware containment breach."}
    ]
    
    incidents = []
    used_alerts_count = 0
    
    for i in range(40):
        template = random.choice(incident_templates)
        status = random.choice(incident_statuses)
        
        creator = random.choice(admins_analysts)
        assignee = random.choice(analysts) if status != "open" else None
        
        # Incident base time matched to linked alert
        base_alert = escalated_alerts[used_alerts_count % len(escalated_alerts)]
        created_at = base_alert.created_at + timedelta(minutes=random.randint(5, 30))
        
        resolution_notes = None
        if status in ["resolved", "closed"]:
            resolution_notes = f"Analyzed incident logs. Isolated the source IP at the firewall and performed system credentials rotation for affected users. Checked logs and verified no further activity. Remediated on {created_at + timedelta(hours=3)}."
            
        incident = Incident(
            title=f"INC-{1000 + i}: {template['title']}",
            description=template["description"],
            status=status,
            assigned_to=assignee.id if assignee else None,
            created_by=creator.id,
            resolution_notes=resolution_notes,
            created_at=created_at,
            updated_at=created_at + timedelta(hours=random.randint(1, 10))
        )
        
        # Link 1 to 3 alerts
        num_links = random.randint(1, 3)
        linked_alerts = []
        for _ in range(num_links):
            alert = escalated_alerts[used_alerts_count % len(escalated_alerts)]
            linked_alerts.append(alert)
            used_alerts_count += 1
            
        incident.alerts = linked_alerts
        db.session.add(incident)
        incidents.append((incident, linked_alerts))
        
    db.session.commit()
    print(f"Seeded {len(incidents)} incidents.")
    
    # 5. Seed Incident Timelines (sequentially chronological)
    print("Generating incident timelines...")
    for incident, linked_alerts in incidents:
        # Event 1: Creation (matches creation timestamp)
        tl_created = IncidentTimeline(
            incident_id=incident.id,
            actor_id=incident.created_by,
            event_type="created",
            detail={"message": "Incident created from linked alerts", "alerts_linked": len(linked_alerts)},
            created_at=incident.created_at
        )
        db.session.add(tl_created)
        
        current_time = incident.created_at
        
        # Event 2: Assignment change (if assigned)
        if incident.assigned_to:
            current_time += timedelta(minutes=random.randint(5, 15))
            tl_assign = IncidentTimeline(
                incident_id=incident.id,
                actor_id=incident.created_by,
                event_type="assignment_change",
                detail={"assigned_to": str(incident.assigned_to), "message": "Incident assigned to analyst"},
                created_at=current_time
            )
            db.session.add(tl_assign)
            
        # Event 3: Status change to investigating
        if incident.status in ["investigating", "resolved", "closed"]:
            current_time += timedelta(minutes=random.randint(10, 30))
            tl_status = IncidentTimeline(
                incident_id=incident.id,
                actor_id=incident.assigned_to or incident.created_by,
                event_type="status_change",
                detail={"from": "open", "to": "investigating", "message": "Analyst began investigation"},
                created_at=current_time
            )
            db.session.add(tl_status)
            
        # Event 4: Note Added (50% chance)
        if random.random() > 0.5:
            current_time += timedelta(hours=random.randint(1, 2))
            tl_note = IncidentTimeline(
                incident_id=incident.id,
                actor_id=incident.assigned_to or incident.created_by,
                event_type="note_added",
                detail={"note": "Investigating connection parameters. Validated source IP is associated with known anonymizing VPN service.", "message": "Note added"},
                created_at=current_time
            )
            db.session.add(tl_note)
            
        # Event 5: Resolution / Closure (sequential timing)
        if incident.status in ["resolved", "closed"]:
            current_time += timedelta(hours=random.randint(2, 5))
            tl_resolve = IncidentTimeline(
                incident_id=incident.id,
                actor_id=incident.assigned_to or incident.created_by,
                event_type="status_change",
                detail={"from": "investigating", "to": "resolved", "message": incident.resolution_notes},
                created_at=current_time
            )
            db.session.add(tl_resolve)
            
            if incident.status == "closed":
                current_time += timedelta(minutes=random.randint(15, 45))
                tl_close = IncidentTimeline(
                    incident_id=incident.id,
                    actor_id=incident.created_by,
                    event_type="closed",
                    detail={"from": "resolved", "to": "closed", "message": "Incident review completed. Closed successfully."},
                    created_at=current_time
                )
                db.session.add(tl_close)
                
    db.session.commit()
    print("Seeded incident timeline trails.")
    
    # 6. Seed AI Reports (8 reports linked to random alerts)
    print("Generating pre-seeded AI reports...")
    ai_reports_data = [
        {
            "report_type": "explanation",
            "content": {
                "summary": "This alert indicates a volume-based port scan attempt from a single source host IP. Multiple destination ports were targeted within a brief timeframe, indicating reconnaissance activity.",
                "details": "Packets blocked across firewall interfaces targeting services such as SSH (22), RDP (3389), and HTTP (80). No active connections succeeded."
            },
            "model_used": "Claude-3.5-Sonnet"
        },
        {
            "report_type": "mitre_mapping",
            "content": {
                "techniques": [
                    {"id": "T1046", "name": "Network Service Discovery", "tactic": "Discovery", "rationale": "Attacker scanning for open ports to identify live network services."},
                    {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access", "rationale": "Reconnaissance scan attempting to find exposed services to exploit."}
                ]
            },
            "model_used": "Claude-3.5-Sonnet"
        },
        {
            "report_type": "recommendation",
            "content": {
                "steps": [
                    "Block the offending source IP at the external firewall perimeter.",
                    "Verify internal server logs to ensure no egress traffic occurred back to this IP.",
                    "Disable port 22/3389 routing rules from public web interfaces.",
                    "Confirm external threat intelligence lists for matching reputation details."
                ]
            },
            "model_used": "GPT-4o"
        },
        {
            "report_type": "log_summary",
            "content": {
                "summary": "Multiple connection attempts from 185.190.140.10. Sequence shows 45 failed logins within 90 seconds, followed by an immediate host scan detection from the firewall.",
                "indicators": ["185.190.140.10", "sshd_failed_login", "scan_activity"]
            },
            "model_used": "GPT-4o"
        }
    ]
    
    report_alerts = random.sample(alerts, 8)
    for idx, alert in enumerate(report_alerts):
        template = ai_reports_data[idx % len(ai_reports_data)]
        report = AIReport(
            alert_id=alert.id,
            report_type=template["report_type"],
            content=template["content"],
            model_used=template["model_used"],
            created_at=alert.created_at + timedelta(minutes=random.randint(1, 5))
        )
        db.session.add(report)
        
    db.session.commit()
    print("Seeded pre-generated AI reports.")
    
    # Print Credentials Summary for Demo/Testing
    print("\n" + "="*60)
    print("             THREATMATRIX DATABASE SEED CREDENTIALS")
    print("="*60)
    print(f"{'Role':<15} | {'Email':<30} | {'Password':<15}")
    print("-"*60)
    for u in users:
        role_str = u.role.value if hasattr(u.role, 'value') else str(u.role)
        print(f"{role_str:<15} | {u.email:<30} | {password:<15}")
    print("="*60 + "\n")
