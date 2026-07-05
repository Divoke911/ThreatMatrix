"""
Test M-1 Fix: Deactivated users should not appear in /api/incidents/analysts
and should not be assignable when creating or updating incidents.
"""
import uuid
from app import create_app, db
from app.models.user import User
from app.models.incident import Incident
from app.models.timeline import IncidentTimeline

run_id = uuid.uuid4().hex[:6]
ADMIN_EMAIL   = f"admin_m1_{run_id}@tm.com"
ANALYST_EMAIL = f"analyst_m1_{run_id}@tm.com"   # will be deactivated mid-test

def setup(app):
    with app.app_context():
        admin = User(name="Admin M1", email=ADMIN_EMAIL, role="admin")
        admin.set_password("pass123")
        analyst = User(name="Analyst M1", email=ANALYST_EMAIL, role="analyst")
        analyst.set_password("pass123")
        db.session.add_all([admin, analyst])
        db.session.commit()
        print(f"[setup] Created admin+analyst with suffix: {run_id}")

def cleanup(app, analyst_id):
    with app.app_context():
        # Remove timeline events first (FK), then incidents, then users
        db.session.query(IncidentTimeline).filter(
            IncidentTimeline.actor_id.in_([analyst_id])
        ).delete(synchronize_session=False)
        Incident.query.filter(Incident.created_by == analyst_id).delete(synchronize_session=False)
        User.query.filter(User.email.in_([ADMIN_EMAIL, ANALYST_EMAIL])).delete(synchronize_session=False)
        db.session.commit()
        print("[cleanup] Done.")

def run():
    app = create_app()
    setup(app)
    client = app.test_client()

    # ── 1. Login admin ──────────────────────────────────────────────────────
    resp = client.post('/api/auth/login', json={"email": ADMIN_EMAIL, "password": "pass123"})
    assert resp.status_code == 200
    admin_token = resp.get_json()['access_token']
    admin_hdrs = {"Authorization": f"Bearer {admin_token}"}

    # ── 2. Login analyst ────────────────────────────────────────────────────
    resp = client.post('/api/auth/login', json={"email": ANALYST_EMAIL, "password": "pass123"})
    assert resp.status_code == 200
    analyst_token = resp.get_json()['access_token']
    analyst_hdrs = {"Authorization": f"Bearer {analyst_token}"}

    # Get analyst id
    with app.app_context():
        analyst_obj = User.query.filter_by(email=ANALYST_EMAIL).first()
        analyst_id = analyst_obj.id

    # ── 3. Analyst ACTIVE → should appear in /analysts list ────────────────
    print("\n--- 1. Checking active analyst appears in /analysts ---")
    resp = client.get('/api/incidents/analysts', headers=admin_hdrs)
    assert resp.status_code == 200
    analyst_ids = [u['id'] for u in resp.get_json()]
    assert str(analyst_id) in analyst_ids, "Active analyst should be in list"
    print("Active analyst visible in dropdown ✅")

    # ── 4. Deactivate the analyst via /api/users/:id ────────────────────────
    print("--- 2. Deactivating analyst account ---")
    resp = client.delete(f'/api/users/{analyst_id}', headers=admin_hdrs)
    assert resp.status_code == 200
    print("Analyst deactivated ✅")

    # ── 5. Deactivated analyst must NOT appear in /analysts ─────────────────
    print("--- 3. Checking deactivated analyst is excluded from /analysts ---")
    resp = client.get('/api/incidents/analysts', headers=admin_hdrs)
    assert resp.status_code == 200
    analyst_ids_after = [u['id'] for u in resp.get_json()]
    assert str(analyst_id) not in analyst_ids_after, "Deactivated analyst must NOT be in list"
    print("Deactivated analyst absent from dropdown ✅")

    # ── 6. Attempt to assign deactivated analyst via create_incident ─────────
    print("--- 4. Attempt to assign deactivated user in POST /incidents ---")
    resp = client.post('/api/incidents', headers=admin_hdrs, json={
        "title": "Test Incident M1",
        "description": "Testing deactivated assignee block",
        "assigned_to": str(analyst_id)
    })
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.get_json()}"
    print(f"Blocked correctly: {resp.get_json()['msg']} ✅")

    # ── 7. Create incident with NO assignee first, then attempt PATCH assign ─
    print("--- 5. Create incident with no assignee, then PATCH with deactivated user ---")
    resp = client.post('/api/incidents', headers=admin_hdrs, json={
        "title": "Unassigned Test Incident M1",
        "description": "Will try patching with deactivated user"
    })
    assert resp.status_code == 201
    inc_id = resp.get_json()['id']

    resp = client.patch(f'/api/incidents/{inc_id}', headers=admin_hdrs, json={
        "status": "open",
        "assigned_to": str(analyst_id)
    })
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.get_json()}"
    print(f"PATCH also blocked correctly: {resp.get_json()['msg']} ✅")

    cleanup(app, analyst_id)
    print("\n--- M-1 FIX TEST PASSED: Deactivated user assignment blocked at all 3 points! ---")

if __name__ == '__main__':
    run()
