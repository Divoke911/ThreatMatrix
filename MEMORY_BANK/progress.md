# Project Progress

## Phase 1: Foundation — Auth + DB schema + Dashboard skeleton
- [x] Initialize project scaffolding and MEMORY_BANK
- [x] Set up Docker configuration (docker-compose + backend & frontend Dockerfiles done)
- [x] Define PostgreSQL DB schema using SQLAlchemy & generate migrations
- [x] Implement JWT authentication (Flask-JWT-Extended)
- [x] Create basic React dashboard skeleton

## Phase 2: Core SOC Workflow
- [x] Implement Alert monitoring dashboard (filters, pagination, overrides)
- [x] Build Incident management views (TIMELINES, modal creations, unlinking)
- [x] Enable role-based access control enforcement (Viewer checks, Closed incident soft-locks)
- [x] Integrate SOC Dashboard telemetry metrics charts (Recharts volume trend line/donut/bars, 7D/30D filter)

## Phase 3: AI Analyst
- [x] Integrate server-side Groq LLM API (OpenAI SDK + env keys setup)
- [x] Implement JSON schema validation and retry checks for AI outputs
- [x] Display AI insights (explanations, MITRE ATT&CK, recommendations, log summary) on drawer
- [x] Implement dynamic drawer reload, caching, and manual "Force Refresh" overrides

## Phase 4: Packaging & Polish
- [ ] Upgrade User Administration page (frontend page UI + backend admin-only CRUD routes)
- [ ] Upgrade Console Settings page (profile settings edits, password rotation)
- [ ] Polish UI/UX layout styles and aesthetics
- [ ] TODO: remove test-only auth endpoints before final packaging (`/test-admin`, `/test-analyst`, `/test-viewer`)
