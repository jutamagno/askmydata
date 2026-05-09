"""Tests for projects CRUD and CSV upload."""
import io


def _create_project(client, headers, name="Test Project"):
    resp = client.post("/projects/", json={"name": name}, headers=headers)
    assert resp.status_code == 200
    return resp.json()


def test_create_project(client, auth_headers):
    data = _create_project(client, auth_headers)
    assert data["name"] == "Test Project"
    assert "id" in data


def test_list_projects(client, auth_headers):
    _create_project(client, auth_headers, "P1")
    _create_project(client, auth_headers, "P2")
    resp = client.get("/projects/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_project(client, auth_headers):
    project = _create_project(client, auth_headers)
    resp = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == project["id"]


def test_delete_project(client, auth_headers):
    project = _create_project(client, auth_headers)
    resp = client.delete(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get(f"/projects/{project['id']}", headers=auth_headers)
    assert resp.status_code == 404


def test_upload_csv(client, auth_headers):
    project = _create_project(client, auth_headers)
    csv_content = b"name,value\nAlice,10\nBob,20\n"
    resp = client.post(
        f"/projects/{project['id']}/upload",
        headers=auth_headers,
        files={"file": ("data.csv", io.BytesIO(csv_content), "text/csv")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "data.csv"
    assert data["row_count"] == 2


def test_upload_non_csv_rejected(client, auth_headers):
    project = _create_project(client, auth_headers)
    resp = client.post(
        f"/projects/{project['id']}/upload",
        headers=auth_headers,
        files={"file": ("data.txt", io.BytesIO(b"not a csv"), "text/plain")},
    )
    assert resp.status_code == 400


def test_project_not_found_for_other_user(client, auth_headers):
    project = _create_project(client, auth_headers)
    # Register a second user
    client.post("/auth/register", json={"email": "other@test.com", "password": "OtherPass1!"})
    resp2 = client.post("/auth/login", json={"email": "other@test.com", "password": "OtherPass1!"})
    other_headers = {"Authorization": f"Bearer {resp2.json()['access_token']}"}
    resp = client.get(f"/projects/{project['id']}", headers=other_headers)
    assert resp.status_code == 404
