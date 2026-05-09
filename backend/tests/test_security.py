"""Security-focused tests."""
import io


def test_upload_non_csv_rejected(client, auth_headers):
    project = client.post("/projects/", json={"name": "S"}, headers=auth_headers).json()
    resp = client.post(
        f"/projects/{project['id']}/upload",
        headers=auth_headers,
        files={"file": ("evil.sh", io.BytesIO(b"#!/bin/bash\nrm -rf /"), "application/x-sh")},
    )
    assert resp.status_code == 400


def test_unauthenticated_requests_rejected(client):
    for path, method in [
        ("/projects/", "get"),
        ("/query/", "post"),
        ("/auth/me", "get"),
    ]:
        resp = getattr(client, method)(path)
        assert resp.status_code in (401, 403, 422), f"{method.upper()} {path} should be protected"


def test_cannot_access_another_users_project(client, auth_headers):
    project = client.post("/projects/", json={"name": "Private"}, headers=auth_headers).json()
    client.post("/auth/register", json={"email": "attacker@test.com", "password": "Attack1234!"})
    atk_resp = client.post("/auth/login", json={"email": "attacker@test.com", "password": "Attack1234!"})
    atk_headers = {"Authorization": f"Bearer {atk_resp.json()['access_token']}"}
    resp = client.get(f"/projects/{project['id']}", headers=atk_headers)
    assert resp.status_code == 404


def test_invalid_jwt_rejected(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer notavalidtoken"})
    assert resp.status_code == 401
