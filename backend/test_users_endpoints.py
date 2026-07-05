import json
import uuid
from app import create_app, db
from app.models.user import User

# Generate unique run ID so we don't conflict with existing database states
run_id = uuid.uuid4().hex[:6]
ADMIN1_EMAIL = f"admin1_{run_id}@threatmatrix.com"
ADMIN2_EMAIL = f"admin2_{run_id}@threatmatrix.com"
ANALYST_EMAIL = f"analyst_{run_id}@threatmatrix.com"
NEW_ANALYST_EMAIL = f"newanalyst_{run_id}@threatmatrix.com"

def setup_test_users(app):
    with app.app_context():
        # Create users with unique emails for this test run
        admin1 = User(name="Admin One", email=ADMIN1_EMAIL, role="admin")
        admin1.set_password("password123")
        
        admin2 = User(name="Admin Two", email=ADMIN2_EMAIL, role="admin")
        admin2.set_password("password123")
        
        analyst = User(name="Analyst User", email=ANALYST_EMAIL, role="analyst")
        analyst.set_password("password123")
        
        db.session.add_all([admin1, admin2, analyst])
        db.session.commit()
        print(f"Test users seeded successfully under suffix: {run_id}")

def run_tests():
    app = create_app()
    setup_test_users(app)
    
    client = app.test_client()
    
    # 1. Login Admin One
    print("\n--- 1. Login Admin One ---")
    resp = client.post('/api/auth/login', json={
        "email": ADMIN1_EMAIL,
        "password": "password123"
    })
    assert resp.status_code == 200
    admin1_access = resp.get_json()['access_token']
    admin1_headers = {"Authorization": f"Bearer {admin1_access}"}
    print("Logged in successfully.")
    
    # 2. Login Analyst
    print("--- 2. Login Analyst ---")
    resp = client.post('/api/auth/login', json={
        "email": ANALYST_EMAIL,
        "password": "password123"
    })
    assert resp.status_code == 200
    analyst_access = resp.get_json()['access_token']
    analyst_headers = {"Authorization": f"Bearer {analyst_access}"}
    print("Logged in successfully.")
    
    # 3. Test Block non-admin from GET /api/users
    print("--- 3. Testing RBAC Block (Analyst accessing GET /api/users) ---")
    resp = client.get('/api/users', headers=analyst_headers)
    assert resp.status_code == 403
    print("Blocked correctly (403 Forbidden).")
    
    # 4. Test Admin listing users
    print("--- 4. Testing Admin accessing GET /api/users ---")
    resp = client.get('/api/users', headers=admin1_headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['users']) >= 3
    print("Retrieved users list successfully.")
    
    # 5. Create new user
    print("--- 5. Create new user via POST /api/users ---")
    resp = client.post('/api/users', json={
        "name": "New Analyst",
        "email": NEW_ANALYST_EMAIL,
        "role": "analyst",
        "password": "password123"
    }, headers=admin1_headers)
    assert resp.status_code == 201
    new_user_id = resp.get_json()['id']
    print(f"Created user successfully. ID: {new_user_id}")
    
    # 6. Create duplicate user (conflict check)
    print("--- 6. Attempt creating duplicate email address ---")
    resp = client.post('/api/users', json={
        "name": "Another Analyst",
        "email": NEW_ANALYST_EMAIL,
        "role": "analyst",
        "password": "password123"
    }, headers=admin1_headers)
    assert resp.status_code == 409
    print(f"Duplicate email blocked correctly with 409 Conflict. Msg: {resp.get_json()['msg']}")
    
    # 7. Demote Admin Two (This is fine, as Admin One remains active, along with existing seeded admins)
    print("--- 7. Demoting Admin Two (should succeed) ---")
    with app.app_context():
        admin2 = User.query.filter_by(email=ADMIN2_EMAIL).first()
        admin2_id = str(admin2.id)
    
    resp = client.patch(f'/api/users/{admin2_id}/role', json={"role": "analyst"}, headers=admin1_headers)
    assert resp.status_code == 200
    print("Admin Two demoted successfully.")
    
    # Let's count active admins. Note that the seeded database already has 2 active admins.
    # To test the safeguard of the "LAST active admin", we will retrieve ALL active admins except our admin1 and deactivate/demote them temporarily.
    # But wait, it's safer to check:
    # If we deactivate ADMIN1 (who is active), we still have the other active admins.
    # What if we want to verify the safeguard?
    # Let's temporarily de-activate ALL other active admins in database, verify deactivating ADMIN1 fails, and then restore them!
    print("--- 8. Testing safeguards for last remaining active admin ---")
    with app.app_context():
        admin1_obj = User.query.filter_by(email=ADMIN1_EMAIL).first()
        admin1_id = str(admin1_obj.id)
        
        # Temporarily deactivate ALL other active admins
        other_admins = User.query.filter(User.role == 'admin', User.is_active == True, User.id != admin1_obj.id).all()
        other_admin_ids = [str(x.id) for x in other_admins]
        for x in other_admins:
            x.is_active = False
        db.session.commit()
        print(f"Temporarily deactivated {len(other_admin_ids)} other active admins for isolation check.")
        
    try:
        # Now admin1 is the ONLY active admin in the database.
        # Demoting admin1 should fail!
        resp = client.patch(f'/api/users/{admin1_id}/role', json={"role": "analyst"}, headers=admin1_headers)
        assert resp.status_code == 400
        print(f"Demote safeguard triggered! Blocked correctly: {resp.get_json()['msg']}")
        
        # Deactivating admin1 should fail!
        resp = client.delete(f'/api/users/{admin1_id}', headers=admin1_headers)
        assert resp.status_code == 400
        print(f"Deactivate safeguard triggered! Blocked correctly: {resp.get_json()['msg']}")
    finally:
        # Restore other admins
        with app.app_context():
            for aid in other_admin_ids:
                u = User.query.get(aid)
                u.is_active = True
            db.session.commit()
            print("Restored other admins successfully.")

    # 10. Deactivate Analyst User (Should succeed)
    print("--- 10. Deactivating Analyst User (should succeed) ---")
    with app.app_context():
        analyst_obj = User.query.filter_by(email=ANALYST_EMAIL).first()
        analyst_id = str(analyst_obj.id)
    
    resp = client.delete(f'/api/users/{analyst_id}', headers=admin1_headers)
    assert resp.status_code == 200
    print("Analyst user deactivated successfully.")
    
    # 11. Clean up transient test users
    print("--- 11. Cleaning up transient test users ---")
    with app.app_context():
        User.query.filter(User.email.in_([ADMIN1_EMAIL, ADMIN2_EMAIL, ANALYST_EMAIL, NEW_ANALYST_EMAIL])).delete(synchronize_session=False)
        db.session.commit()
        print("Cleanup successful.")

    print("\n--- ALL TESTS COMPLETED SUCCESSFULLY! ---")

if __name__ == '__main__':
    run_tests()
