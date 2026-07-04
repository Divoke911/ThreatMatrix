import json
from app import create_app, db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist

def setup_test_users(app):
    with app.app_context():
        # Clear existing users and blacklists
        User.query.delete()
        TokenBlacklist.query.delete()
        db.session.commit()
        
        # Create users
        admin = User(name="Admin User", email="admin@threatmatrix.com", role="admin")
        admin.set_password("password123")
        
        analyst = User(name="Analyst User", email="analyst@threatmatrix.com", role="analyst")
        analyst.set_password("password123")
        
        viewer = User(name="Viewer User", email="viewer@threatmatrix.com", role="viewer")
        viewer.set_password("password123")
        
        db.session.add_all([admin, analyst, viewer])
        db.session.commit()
        print("Test users seeded successfully!")

def run_tests():
    app = create_app()
    setup_test_users(app)
    
    client = app.test_client()
    
    # 1. Test Login - Admin
    print("\n--- Testing Login (Admin) ---")
    resp = client.post('/api/auth/login', json={
        "email": "admin@threatmatrix.com",
        "password": "password123"
    })
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200
    admin_data = resp.get_json()
    admin_access = admin_data['access_token']
    admin_refresh = admin_data['refresh_token']
    print("Login successful! Tokens received.")
    
    # 2. Test Login - Invalid Credentials (FR-1.7 Generic Errors)
    print("\n--- Testing Login (Invalid Password) ---")
    resp = client.post('/api/auth/login', json={
        "email": "admin@threatmatrix.com",
        "password": "wrongpassword"
    })
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_json()}")
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.get_json()["msg"]
    
    # 3. Test RBAC Access - Admin Token accessing Admin Route
    print("\n--- Testing RBAC (Admin accessing Admin Route) ---")
    headers = {"Authorization": f"Bearer {admin_access}"}
    resp = client.get('/api/auth/test-admin', headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_json()}")
    assert resp.status_code == 200
    
    # 4. Test RBAC Access - Admin Token accessing Analyst Route (Should be Forbidden 403)
    print("\n--- Testing RBAC (Admin accessing Analyst Route - Should fail 403) ---")
    resp = client.get('/api/auth/test-analyst', headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_json()}")
    assert resp.status_code == 403
    
    # 5. Test Refresh Token
    print("\n--- Testing Token Refresh ---")
    refresh_headers = {"Authorization": f"Bearer {admin_refresh}"}
    resp = client.post('/api/auth/refresh', headers=refresh_headers)
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200
    new_access = resp.get_json()['access_token']
    print("Token refresh successful!")
    
    # 6. Test Logout (Blacklist)
    print("\n--- Testing Logout (Blacklist) ---")
    resp = client.post('/api/auth/logout', headers=headers, json={"refresh_token": admin_refresh})
    print(f"Status: {resp.status_code}")
    assert resp.status_code == 200
    
    # 7. Test accessing route after logout (Should fail 401 due to blacklisted access token)
    print("\n--- Testing access using blacklisted access token (Should fail 401) ---")
    resp = client.get('/api/auth/test-admin', headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_json()}")
    assert resp.status_code == 401
    
    # 8. Test refresh using blacklisted refresh token (Should fail 401 due to blacklisted refresh token)
    print("\n--- Testing refresh using blacklisted refresh token (Should fail 401) ---")
    resp = client.post('/api/auth/refresh', headers=refresh_headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.get_json()}")
    assert resp.status_code == 401
    
    print("\nALL TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
