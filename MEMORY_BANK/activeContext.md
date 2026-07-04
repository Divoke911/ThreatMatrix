# Active Context

## Current Phase
**Phase 1: Foundation — Auth + DB schema + Dashboard skeleton**

## Current Focus
- React frontend project initialization and creating the basic Dashboard skeleton.
- Finalizing the remaining Docker configuration for the frontend service.

## Recent Changes
- Implemented full JWT authentication and RBAC backend module:
  - Added password hashing/verification utilities to the `User` model using `bcrypt`.
  - Added `TokenBlacklist` table and integrated full token invalidation for both access and refresh tokens on logout.
  - Implemented `@role_required` decorator that extracts role claims directly from JWT payload without database lookups.
  - Added endpoints `/api/auth/login` (generic errors), `/api/auth/logout`, `/api/auth/refresh`.
  - Added and applied migrations for the new `token_blacklist` table in the PostgreSQL Docker service.
  - Created a comprehensive integration test suite `test_auth_flow.py` and successfully ran it inside the backend Docker container (all tests passed!).
- Implemented database seeding engine (`flask seed-db` CLI command):
  - Idempotent cleanup of old rows in correct database constraint order.
  - Generates 8 users, 750 raw logs, 250 alerts, 40 incidents, chronologically consistent timeline audits, and 8 pre-seeded AI reports.
  - Prints a credential log summary at completion.
