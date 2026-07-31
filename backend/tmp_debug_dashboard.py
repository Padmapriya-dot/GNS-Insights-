import os
import tempfile

os.environ['DATABASE_URL'] = 'sqlite:///' + tempfile.mktemp(suffix='.db')
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-not-for-production'
os.environ['ENVIRONMENT'] = 'development'
os.environ['ALLOW_PUBLIC_REGISTRATION'] = 'true'

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

register = client.post(
    '/auth/register',
    json={
        'company_name': 'TestCo',
        'full_name': 'Admin User',
        'email': 'admin@example.com',
        'password': 'Passw0rd!123',
        'role': 'Admin',
    },
)
print('register status', register.status_code)
print('register body', register.text)

login = client.post(
    '/auth/login',
    json={'email': 'admin@example.com', 'password': 'Passw0rd!123', 'role': 'Admin'},
)
print('login status', login.status_code)
print('login body', login.text)

if login.status_code == 200:
    token = login.json()['data']['access_token']
    resp = client.get('/api/erp/dashboard', headers={'Authorization': f'Bearer {token}'})
    print('dashboard status', resp.status_code)
    print('dashboard body', resp.text)
else:
    print('login did not succeed')
