import json
import uuid
from app import create_app, db
from app.models.user import User

# Generate unique run ID so we don't conflict with existing database states
run_id = uuid.uuid4().hex[:6]
USER1_EMAIL = f"user1_{run_id}@threatmatrix.com"
USER2_EMAIL = f"user2_{run_id}@threatmatrix.com"

def setup_test_users(app):
    with app.app_context():
        # Create users
        user1 = User(name="Test User One", email=USER1_EMAIL, role="analyst")
        user1.set_password("password123")
        
        user2 = User(name="Test User Two", email=USER2_EMAIL, role="viewer")
        user2.set_password("password123")
        
        db.session.add_all([user1, user2])
        db.session.commit()
        print(f"Test users seeded successfully under suffix: {run_id}")

def run_tests():
    app = create_app()
    setup_test_users(app)
    
    client = app.test_client()
    
    # 1. Login User One
    print("\n--- 1. Login User One ---")
    resp = client.post('/api/auth/login', json={
        "email": USER1_EMAIL,
        "password": "password123"
    })
    assert resp.status_code == 200
    user1_access = resp.get_json()['access_token']
    user1_headers = {"Authorization": f"Bearer {user1_access}"}
    print("Logged in successfully.")
    
    # 2. GET Settings Profile
    print("--- 2. GET Profile Settings details ---")
    resp = client.get('/api/settings/profile', headers=user1_headers)
    assert resp.status_code == 200
    profile_data = resp.get_json()
    assert profile_data['name'] == "Test User One"
    assert profile_data['role'] == "analyst"
    print("Profile retrieval asserted successfully.")
    
    # 3. PATCH Settings Profile (Update Name)
    print("--- 3. PATCH Profile Settings Name/Email ---")
    resp = client.patch('/api/settings/profile', json={
        "name": "Updated Name One",
        "email": f"updated_{USER1_EMAIL}",
        "role": "admin" # Attempting to change role (must be ignored/rejected silently)
    }, headers=user1_headers)
    assert resp.status_code == 200
    updated_data = resp.get_json()
    assert updated_data['name'] == "Updated Name One"
    assert updated_data['email'] == f"updated_{USER1_EMAIL}"
    assert updated_data['role'] == "analyst" # Assert role is UNCHANGED
    print("Name/Email updated. Role lock safeguard verified.")
    
    # 4. PATCH Profile Duplicate Email (409 Conflict)
    print("--- 4. PATCH Profile Duplicate Email conflict ---")
    resp = client.patch('/api/settings/profile', json={
        "name": "Updated Name One",
        "email": USER2_EMAIL # Attempting to claim User Two's email
    }, headers=user1_headers)
    assert resp.status_code == 409
    print(f"Duplicate email blocked correctly with 409 Conflict. Msg: {resp.get_json()['msg']}")
    
    # 5. PATCH Password Incorrect Current Password (401)
    print("--- 5. Rotate Password incorrect credentials ---")
    resp = client.patch('/api/settings/password', json={
        "current_password": "wrongpassword",
        "new_password": "newpassword123"
    }, headers=user1_headers)
    assert resp.status_code == 401
    print(f"Incorrect current password rejected correctly with 401. Msg: {resp.get_json()['msg']}")
    
    # 6. PATCH Password Correct credentials (200)
    print("--- 6. Rotate Password correct credentials ---")
    resp = client.patch('/api/settings/password', json={
        "current_password": "password123",
        "new_password": "newpassword123"
    }, headers=user1_headers)
    assert resp.status_code == 200
    print("Password successfully updated.")
    
    # 7. Login using new password
    print("--- 7. Login check using rotated password ---")
    resp = client.post('/api/auth/login', json={
        "email": f"updated_{USER1_EMAIL}",
        "password": "newpassword123"
    })
    assert resp.status_code == 200
    print("Logged in successfully using rotated password credentials.")
    
    # Cleanup test users
    print("--- 8. Cleaning up settings test users ---")
    with app.app_context():
        User.query.filter(User.email.in_([USER1_EMAIL, USER2_EMAIL, f"updated_{USER1_EMAIL}"])).delete(synchronize_session=False)
        db.session.commit()
        print("Cleanup completed.")
        
    print("\n--- ALL SETTINGS TESTS PASSED SUCCESSFULLY! ---")

if __name__ == '__main__':
    run_tests()
