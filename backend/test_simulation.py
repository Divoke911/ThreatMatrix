import json
import uuid
from app import create_app, db
from app.models.user import User
from app.models import Log, Alert

# Generate unique run ID so we don't conflict with existing database states
run_id = uuid.uuid4().hex[:6]
ADMIN_EMAIL = f"admin_{run_id}@threatmatrix.com"
ANALYST_EMAIL = f"analyst_{run_id}@threatmatrix.com"

def setup_test_users(app):
    with app.app_context():
        # Create users
        admin = User(name="Admin User", email=ADMIN_EMAIL, role="admin")
        admin.set_password("password123")
        
        analyst = User(name="Analyst User", email=ANALYST_EMAIL, role="analyst")
        analyst.set_password("password123")
        
        db.session.add_all([admin, analyst])
        db.session.commit()
        print(f"Test users seeded successfully under suffix: {run_id}")

def run_tests():
    app = create_app()
    setup_test_users(app)
    
    client = app.test_client()
    
    # 1. Login Analyst
    print("\n--- 1. Login Analyst User ---")
    resp = client.post('/api/auth/login', json={
        "email": ANALYST_EMAIL,
        "password": "password123"
    })
    assert resp.status_code == 200
    analyst_access = resp.get_json()['access_token']
    analyst_headers = {"Authorization": f"Bearer {analyst_access}"}
    print("Analyst logged in successfully.")
    
    # 2. Testing RBAC Block (Analyst accessing POST /api/logs/simulate)
    print("--- 2. Testing RBAC Block (Analyst hitting simulate) ---")
    resp = client.post('/api/logs/simulate', headers=analyst_headers)
    assert resp.status_code == 403
    print("Simulation request blocked correctly (403 Forbidden).")
    
    # 3. Login Admin
    print("\n--- 3. Login Admin User ---")
    resp = client.post('/api/auth/login', json={
        "email": ADMIN_EMAIL,
        "password": "password123"
    })
    assert resp.status_code == 200
    admin_access = resp.get_json()['access_token']
    admin_headers = {"Authorization": f"Bearer {admin_access}"}
    print("Admin logged in successfully.")
    
    # 4. Trigger Simulation (Admin)
    print("--- 4. Trigger Simulation (Admin) ---")
    # Query count of logs/alerts prior to simulation run
    with app.app_context():
        logs_before = Log.query.count()
        alerts_before = Alert.query.count()
        
    resp = client.post('/api/logs/simulate', headers=admin_headers)
    assert resp.status_code == 201
    res_data = resp.get_json()
    assert res_data['log_created'] is not None
    
    # Validate database state updates
    with app.app_context():
        logs_after = Log.query.count()
        alerts_after = Alert.query.count()
        
    assert logs_after == logs_before + 1
    if res_data['alert_triggered']:
        assert alerts_after == alerts_before + 1
        print(f"Simulation triggered threat alert! Title: {res_data['alert']['title']}")
    else:
        assert alerts_after == alerts_before
        print(f"Simulation created log but no threat correlated.")
        
    print("Log created in database asserted successfully.")
    
    # Cleanup test users and logs
    print("\n--- 5. Cleaning up test accounts ---")
    with app.app_context():
        User.query.filter(User.email.in_([ADMIN_EMAIL, ANALYST_EMAIL])).delete(synchronize_session=False)
        db.session.commit()
        print("Cleanup completed.")
        
    print("\n--- TRAFFIC SIMULATION ENDPOINT TEST PASSED! ---")

if __name__ == '__main__':
    run_tests()
