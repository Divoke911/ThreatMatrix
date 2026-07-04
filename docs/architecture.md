# High-Level Architecture

## Overview
ThreatMatrix uses a modern decoupled architecture with a React frontend, a Flask backend REST API, and a PostgreSQL database.

## Data Flow
1. **React ↔ Flask REST API**: The frontend communicates with the backend via RESTful API calls. JWTs are used for authentication and authorization.
2. **Flask REST API ↔ PostgreSQL**: The backend uses SQLAlchemy ORM to interact with the PostgreSQL database for storing user data, alerts, and incident states.
3. **Flask ↔ LLM API**: The backend securely communicates with an external LLM API (e.g., Claude/OpenAI) to provide the AI Analyst features.

## AI Analyst Module
- When an analyst requests AI insights for an alert, the React frontend sends a request to the Flask backend.
- The backend compiles the alert context and queries the LLM API.
- The LLM API returns an analysis (alert explanations, MITRE ATT&CK mapping, recommended actions) in a strict JSON format.
- The backend validates the JSON schema, optionally stores it in the database, and returns the structured data to the frontend for rendering.
