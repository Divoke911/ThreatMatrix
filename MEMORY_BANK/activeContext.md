# Active Context

## Current Phase
**Phase 1: Foundation — Auth + DB schema + Dashboard skeleton**

## Current Focus
- Docker containerization configuration (creating Dockerfiles, configuring Compose setup).
- Implementing JWT authentication and user session management.

## Recent Changes
- Defined SQLAlchemy database models for all 7 tables matching the PRD specification (including composite PKs, db indexes, and native ENUM constraints).
- Created application entry point and configuration files in `backend/app/config.py`, `backend/app/__init__.py`, `backend/run.py`.
- Initialized database migrations via Flask-Migrate and generated the initial Alembic migration scripts.
- Added root `.gitignore` to keep the workspace clean of local environment and db artifacts.
