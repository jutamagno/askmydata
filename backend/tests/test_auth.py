"""Tests for auth endpoints."""


def test_register_success(client):
    resp = client.post("/auth/register", json={"email": "user@test.com", "password": "Pass1234!"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_register_duplicate_email(client):
    client.post("/auth/register", json={"email": "user@test.com", "password": "Pass1234!"})
    resp = client.post("/auth/register", json={"email": "user@test.com", "password": "Pass1234!"})
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={"email": "user@test.com", "password": "Pass1234!"})
    resp = client.post("/auth/login", json={"email": "user@test.com", "password": "Pass1234!"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "user@test.com", "password": "Pass1234!"})
    resp = client.post("/auth/login", json={"email": "user@test.com", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post("/auth/login", json={"email": "nobody@test.com", "password": "Pass1234!"})
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 403
