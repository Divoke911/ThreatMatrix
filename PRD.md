# Product Requirements Document — ThreatMatrix

## 1. Project Overview

**Project Name:** ThreatMatrix
**Type:** Final Year Project (Academic, single-team, one-semester scope)
**Category:** AI-Powered Security Operations Center (SOC) Dashboard

**One-line description:** ThreatMatrix is a web-based SOC dashboard that lets security analysts monitor simulated security logs, triage alerts, manage incidents end-to-end, and get AI-assisted analysis (alert explanations, MITRE ATT&CK mapping, remediation suggestions) — all from a single role-based interface.

**Problem it solves:** Real SOCs use expensive, complex toolchains (SIEM + ticketing + threat intel feeds) that are hard to demonstrate or reproduce in an academic setting. ThreatMatrix simulates the core SOC analyst workflow (alert → investigation → incident → resolution) in a self-contained, containerized app, with an LLM standing in for a Tier-1/Tier-2 analyst's first-pass reasoning.

**Explicitly out of scope for this project (parking lot / future work):** live log ingestion from real infrastructure, Elasticsearch/Kibana, Wazuh, Sigma rule engines, real threat-intel API integrations (VirusTotal, AbuseIPDB), Slack/email delivery. These appear in Section 10 as stretch goals only — they should not affect the core timeline or architecture decisions.

---

## 2. Goals & Success Criteria

| Goal | Success Criteria |
|---|---|
| Demonstrate full-stack engineering competency | Working React + Flask + PostgreSQL app, containerized with Docker |
| Simulate realistic SOC analyst workflow | Alert → Investigate → Incident → Resolve loop fully functional |
| Show applied AI integration (not just a chatbot) | AI produces structured, actionable output tied to specific alerts (not generic chat) |
| Role-based access control done correctly | Admin/Analyst/Viewer permissions enforced server-side, not just hidden in UI |
| Presentable, demo-ready product | Seed data + demo script that tells a believable "day in the life of a SOC analyst" story |

---

## 3. User Roles & Permissions

### 3.1 Admin
- Full system access
- Manage users (create, edit roles, delete/deactivate)
- View all alerts, incidents, logs, AI reports
- Configure system settings
- Cannot be deleted if last remaining admin (business rule)

### 3.2 SOC Analyst
- View and filter alerts
- Change alert severity
- Trigger AI analysis on an alert
- Create incidents from alerts
- Assign incidents to themselves or other analysts
- Update incident status, add notes, close incidents
- Cannot manage users or system settings

### 3.3 Viewer
- Read-only access to dashboard, alerts, incidents
- Cannot change severity, create incidents, or trigger AI analysis
- Cannot access user management or settings

### 3.4 Permission Matrix

| Action | Admin | Analyst | Viewer |
|---|:---:|:---:|:---:|
| View dashboard | ✅ | ✅ | ✅ |
| View alerts/incidents | ✅ | ✅ | ✅ |
| Change alert severity | ✅ | ✅ | ❌ |
| Run AI analysis | ✅ | ✅ | ❌ |
| Create/assign/close incidents | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Edit system settings | ✅ | ❌ | ❌ |

All permission checks must be enforced in Flask route decorators/middleware, not only hidden in the React UI.

---

## 4. Application Workflow

```
Login (JWT auth)
   │
   ▼
Dashboard
   ├── Total/open alert count
   ├── Open incident count
   ├── Critical alerts widget
   ├── Threat trend chart (last 7/30 days)
   └── System health indicator
   │
   ▼
Alerts List (filter/search/sort)
   │
   ▼
Alert Details
   ├── Raw log excerpt
   ├── AI Analysis (on-demand button)
   │     ├── Plain-English explanation
   │     ├── Suggested MITRE ATT&CK technique(s)
   │     ├── Recommended next actions
   │     └── Confidence indicator
   ├── Manual severity override
   └── "Create Incident" action
   │
   ▼
Incident Details
   ├── Linked alert(s)
   ├── Assigned analyst
   ├── Status (Open → Investigating → Resolved → Closed)
   ├── Timeline (auto-logged status/assignment changes + manual notes)
   ├── Resolution notes
   └── Close incident action
```

---

## 5. Functional Requirements by Module

### 5.1 Authentication
- FR-1.1: Users log in with email + password
- FR-1.2: Passwords stored hashed (bcrypt/argon2), never plaintext
- FR-1.3: Successful login returns a JWT (access token) + refresh token
- FR-1.4: JWT payload includes `user_id`, `role`, `exp`
- FR-1.5: All protected API routes validate JWT and role before executing
- FR-1.6: Logout invalidates the refresh token (server-side blacklist or short expiry)
- FR-1.7: Failed login attempts return generic error (no user-enumeration leakage)

### 5.2 Dashboard
- FR-2.1: Show total alerts, open alerts, critical alerts, open incidents as summary cards
- FR-2.2: Show a time-series chart of alert volume (last 7/30 days, filterable)
- FR-2.3: Show a severity breakdown chart (pie/bar: Low/Medium/High/Critical)
- FR-2.4: Show 5 most recent alerts and 5 most recent incidents as clickable lists
- FR-2.5: Show a simple system health indicator (mocked service status: API, DB, AI service)

### 5.3 Alert Management
- FR-3.1: Paginated alert list with columns: timestamp, source, type, severity, status
- FR-3.2: Filter by severity, status, date range, source
- FR-3.3: Free-text search across alert title/description/source IP
- FR-3.4: Analyst/Admin can manually change severity (Low/Medium/High/Critical)
- FR-3.5: Alert detail view shows full raw log payload (formatted, not raw JSON dump)
- FR-3.6: "Run AI Analysis" button calls AI Analyst module and stores result against the alert

### 5.4 Incident Management
- FR-4.1: Create incident from one or more alerts, with auto-filled title/description
- FR-4.2: Incident has status: Open, Investigating, Resolved, Closed
- FR-4.3: Assign incident to a specific analyst (dropdown of Analyst/Admin users)
- FR-4.4: Timeline auto-records: creation, assignment changes, status changes, note additions (who + when)
- FR-4.5: Free-text resolution notes field, required before status can move to "Resolved"
- FR-4.6: Closing an incident is a distinct, final action from "Resolved" (soft-lock further edits)

### 5.5 AI Analyst
- FR-5.1: "Explain this alert" — plain-English summary of what the alert means and why it might matter
- FR-5.2: "Suggest MITRE ATT&CK technique(s)" — return technique ID + name + short rationale
- FR-5.3: "Recommend actions" — 2-4 concrete next steps for the analyst
- FR-5.4: "Summarize logs" — condense a batch of related log lines into a short narrative
- FR-5.5: All AI outputs are persisted as structured "AI Reports" linked to the alert (not regenerated every view)
- FR-5.6: AI output must be schema-validated (JSON) before being stored/rendered — never render raw/unstructured model text directly into UI fields expecting structure
- FR-5.7: UI must clearly label AI output as AI-generated and allow analyst override

### 5.6 User Management (Admin only)
- FR-6.1: List all users with role and status (active/inactive)
- FR-6.2: Add new user (email, name, role, temp password or invite flow)
- FR-6.3: Edit a user's role
- FR-6.4: Deactivate/delete a user (soft delete preferred, keeps audit trail intact)
- FR-6.5: Prevent deleting/demoting the last remaining Admin

### 5.7 Settings
- FR-7.1: Profile: view/edit own name, avatar, email
- FR-7.2: Change password (requires current password)
- FR-7.3: System configuration (Admin only): e.g. AI provider/model selection, alert retention period (mocked/simple key-value config table is fine for this scope)

---

## 6. Non-Functional Requirements

- **NFR-1 Security:** JWT secrets and any AI API keys in environment variables, never hardcoded or committed. Passwords hashed. Role checks server-side.
- **NFR-2 Performance:** Alert list should paginate (never load full table); target <500ms for typical list/filter queries on seeded demo dataset (~5–10k rows).
- **NFR-3 Usability:** Role-appropriate UI — Viewers should not see disabled buttons for actions they can't perform; hide rather than disable-and-confuse.
- **NFR-4 Reliability:** AI Analyst calls must handle failure/timeout gracefully (show error state, allow retry) — never crash the alert detail page if the AI provider is down.
- **NFR-5 Portability:** Entire stack (frontend, backend, DB) must run via a single `docker-compose up`.
- **NFR-6 Auditability:** Incident timeline entries are immutable once written (append-only).

---

## 7. Database Schema (Detailed)

### 7.1 `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID / serial PK | |
| name | varchar | |
| email | varchar, unique | |
| password_hash | varchar | |
| role | enum(admin, analyst, viewer) | |
| is_active | boolean | default true |
| created_at | timestamp | |

### 7.2 `alerts`
| Field | Type | Notes |
|---|---|---|
| id | UUID / serial PK | |
| title | varchar | |
| description | text | |
| source | varchar | e.g. firewall, IDS, endpoint |
| source_ip | varchar | nullable |
| severity | enum(low, medium, high, critical) | |
| status | enum(new, in_review, escalated, closed) | |
| raw_log | text/jsonb | original simulated log payload |
| created_at | timestamp | |
| updated_at | timestamp | |

### 7.3 `incidents`
| Field | Type | Notes |
|---|---|---|
| id | UUID / serial PK | |
| title | varchar | |
| description | text | |
| status | enum(open, investigating, resolved, closed) | |
| assigned_to | FK → users.id | nullable |
| resolution_notes | text | nullable until resolved |
| created_by | FK → users.id | |
| created_at | timestamp | |
| updated_at | timestamp | |

### 7.4 `incident_alerts` (join table, incident ↔ many alerts)
| Field | Type | Notes |
|---|---|---|
| incident_id | FK → incidents.id | |
| alert_id | FK → alerts.id | |

### 7.5 `incident_timeline`
| Field | Type | Notes |
|---|---|---|
| id | serial PK | |
| incident_id | FK → incidents.id | |
| actor_id | FK → users.id | |
| event_type | enum(created, status_change, assignment_change, note_added, closed) | |
| detail | text/jsonb | e.g. {"from":"open","to":"investigating"} |
| created_at | timestamp | |

### 7.6 `ai_reports`
| Field | Type | Notes |
|---|---|---|
| id | serial PK | |
| alert_id | FK → alerts.id | |
| report_type | enum(explanation, mitre_mapping, recommendation, log_summary) | |
| content | jsonb | structured AI output |
| model_used | varchar | |
| created_at | timestamp | |

### 7.7 `logs` (simulated raw log store, feeds alert generation)
| Field | Type | Notes |
|---|---|---|
| id | serial PK | |
| source | varchar | |
| raw_text | text | |
| parsed | jsonb | nullable |
| ingested_at | timestamp | |

---

## 8. API Endpoints (Draft)

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/dashboard/summary

GET    /api/alerts?severity=&status=&search=&page=
GET    /api/alerts/:id
PATCH  /api/alerts/:id/severity
POST   /api/alerts/:id/ai-analysis

GET    /api/incidents?status=&assigned_to=
POST   /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id/status
PATCH  /api/incidents/:id/assign
POST   /api/incidents/:id/notes
POST   /api/incidents/:id/close

GET    /api/users            (admin only)
POST   /api/users            (admin only)
PATCH  /api/users/:id/role   (admin only)
DELETE /api/users/:id        (admin only)

GET    /api/settings/profile
PATCH  /api/settings/profile
PATCH  /api/settings/password
GET    /api/settings/system   (admin only)
PATCH  /api/settings/system   (admin only)
```

All routes except `/api/auth/login` require `Authorization: Bearer <JWT>`.

---

## 9. Pages / Routes (Frontend)

```
/login
/dashboard
/alerts
/alerts/:id
/incidents
/incidents/:id
/ai-assistant        (optional standalone view of recent AI reports)
/users                (admin only)
/settings
/settings/profile
*                     → 404
```

---

## 10. Tech Stack

- **Frontend:** React (with a charting library — Recharts or Chart.js), React Router, Axios/fetch
- **Backend:** Flask, Flask-JWT-Extended, SQLAlchemy
- **Database:** PostgreSQL
- **AI Integration:** LLM API call (e.g. Claude or OpenAI) via backend service layer — never call the AI API directly from frontend (protects API key, allows validation/caching)
- **Containerization:** Docker + docker-compose (separate services: frontend, backend, db)
- **Auth:** JWT (access + refresh token pattern)

---

## 11. Data Seeding Strategy

Since there's no live log ingestion, build a **seed script** that generates realistic synthetic data:
- 5–10 users across all 3 roles
- 200–500 alerts with varied sources (firewall, IDS, endpoint, auth logs), severities, and timestamps spread over ~30 days
- 30–50 incidents in varying statuses, some closed with resolution notes, some open/assigned
- A handful of pre-generated AI reports (so the demo doesn't depend on live API calls if internet/API is unavailable during the defense)

This seed data is what makes the dashboard charts and lists look like a "real" SOC during your demo.

---

## 12. Milestones (Single Semester)

**Phase 1 — Foundation**
- Auth (JWT, roles), DB schema, Dashboard skeleton with seeded data charts

**Phase 2 — Core SOC Workflow**
- Alerts: list, filter, search, severity change
- Incidents: create, assign, status, timeline, notes, close

**Phase 3 — AI Analyst**
- Alert explanation, MITRE suggestion, recommended actions, log summary
- Structured JSON output + storage as AI Reports

**Phase 4 — Packaging & Polish**
- User management, Settings
- Docker Compose for full stack
- Seed data + demo script
- Final UI polish pass

---

## 13. Future Work (Explicitly Out of Scope)

- Live log ingestion pipeline
- Elasticsearch + Kibana integration
- Wazuh agent integration
- Sigma rule engine
- Real threat-intel enrichment (VirusTotal, AbuseIPDB)
- Email / Slack alert delivery
- Multi-tenant support

---

## 14. Notes for AI-Assisted Development

When feeding this PRD to an AI coding assistant, it's most effective to work module-by-module rather than asking for the whole app at once:
1. DB schema + migrations first
2. Auth module (backend + frontend) end-to-end, test it works
3. Dashboard + seed data
4. Alerts module
5. Incidents module
6. AI Analyst module (mock the AI response first, wire in the real API call last)
7. User management + Settings
8. Dockerize last, once everything runs locally
