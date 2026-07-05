# ThreatMatrix SOC Incident Management & Analysis Console

ThreatMatrix is a modern Security Operations Center (SOC) dashboard built to aggregate system logs, manage security threats, track containment timelines, and leverage AI analysis for triage recommendations.

---

## Technical Stack
* **Frontend**: React (Vite, TailwindCSS, Recharts, Lucide Icons) served via **Nginx** reverse proxy.
* **Backend**: Flask REST API (SQLAlchemy, Flask-Migrate, Flask-JWT-Extended) served via **Gunicorn**.
* **Database**: PostgreSQL 15.
* **Inference**: Groq API integration (OpenAI-compatible) for automated log explanations, MITRE ATT&CK mappings, and remediation containment playbooks.

---

## Quick Start (Docker Compose)

Follow these steps to build and run the entire production-style containerized stack:

### 1. Environment Configuration
Copy the template configuration file in the project root:
```bash
cp .env.example .env
```
Open `.env` and fill in the parameters, specifically:
- `GROQ_API_KEY`: Your Groq API key for live AI analysis completions.

### 2. Build and Launch Containers
Run the Docker Compose startup command. Nginx, Gunicorn, and PostgreSQL services will boot:
```bash
docker-compose up -d --build
```
*The backend container automatically waits for PostgreSQL connection sockets to be fully responsive using healthchecks (`pg_isready`) before launching Gunicorn.*

### 3. Initialize Database Migrations
Create database tables and apply schema migrations:
```bash
docker-compose exec backend flask db upgrade
```

### 4. Seed Demo Records
Populate the database with synthetic system logs, telemetry threat metrics, alerts, and user accounts:
```bash
docker-compose exec backend flask seed-db
```

### 5. Access the Web Application
Open your browser and navigate to:
* **Interface URL**: [http://localhost:3000](http://localhost:3000)

---

## Seeded User Credentials (Passwords: `password123`)

| Name / Privilege | Email Address | Description |
|---|---|---|
| **System Administrator** | `admin@threatmatrix.com` | full control, adds users, edits roles |
| **Lead Analyst Alice** | `analyst1@threatmatrix.com` | triage threats, links incidents, timelines notes, runs AI |
| **Analyst Bob** | `analyst2@threatmatrix.com` | triage threats, links incidents, timelines notes, runs AI |
| **Viewer Officer Chief** | `viewer1@threatmatrix.com` | read-only dashboard tracking, cannot modify or run AI |

---

## Verification & Automated Testing

To run backend integration test suites (verifying authentication scopes, RBAC, soft-deactivations, and last admin safeguards):
```bash
docker-compose exec backend python run_all_tests.py
```
