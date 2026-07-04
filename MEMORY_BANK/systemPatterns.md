# System Patterns

## Architecture Patterns
- **Decoupled Client-Server**: React Single Page Application (SPA) consuming a Flask REST API.
- **Containerization**: Dockerized microservices (Frontend, Backend, DB) managed via `docker-compose`.

## Technical Decisions
- **Authentication**: JWT access + refresh pattern (using Flask-JWT-Extended).
- **Authorization**: Role-based route guards on both frontend and backend (Admin, Analyst, Viewer).
- **AI Integration**: AI output from the LLM API must be schema-validated JSON before storage or rendering to ensure predictable application behavior.
- **Data Layer**: SQLAlchemy ORM for database interactions with Alembic (Flask-Migrate) for migrations.
