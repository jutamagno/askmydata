"""Tests for query endpoint."""
import io
import json
from unittest.mock import AsyncMock, MagicMock, patch


def _setup_project_with_csv(client, headers):
    project = client.post("/projects/", json={"name": "Q Test"}, headers=headers).json()
    csv_content = b"category,amount\nA,100\nB,200\nA,150\n"
    csv_resp = client.post(
        f"/projects/{project['id']}/upload",
        headers=headers,
        files={"file": ("data.csv", io.BytesIO(csv_content), "text/csv")},
    ).json()
    return project, csv_resp


def test_query_sql_path(client, auth_headers):
    project, csv_file = _setup_project_with_csv(client, auth_headers)
    mock_provider = MagicMock()
    mock_provider.chat.return_value = "SELECT category, SUM(amount) FROM read_csv_auto('/tmp/x') GROUP BY 1"

    with patch("backend.modules.query.llm.get_provider", return_value=mock_provider), \
         patch("backend.modules.query.llm.format_answer", return_value="Category A has 250, B has 200"):
        resp = client.post(
            "/query/",
            headers=auth_headers,
            json={
                "question": "Total por categoria?",
                "project_id": project["id"],
                "csv_file_id": csv_file["id"],
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["engine"] in ("sql", "pandas", "error")


def test_query_history_saved(client, auth_headers):
    project, csv_file = _setup_project_with_csv(client, auth_headers)
    mock_provider = MagicMock()
    mock_provider.chat.return_value = "SELECT 1"

    with patch("backend.modules.query.llm.get_provider", return_value=mock_provider), \
         patch("backend.modules.query.llm.format_answer", return_value="The answer"):
        client.post(
            "/query/",
            headers=auth_headers,
            json={"question": "Teste?", "project_id": project["id"], "csv_file_id": csv_file["id"]},
        )

    msgs = client.get(f"/messages/{project['id']}", headers=auth_headers).json()
    assert any(m["role"] == "user" for m in msgs)
    assert any(m["role"] == "assistant" for m in msgs)


def test_query_error_on_bad_sql(client, auth_headers):
    project, csv_file = _setup_project_with_csv(client, auth_headers)
    mock_provider = MagicMock()
    mock_provider.chat.return_value = "INVALID SQL !!"

    with patch("backend.modules.query.llm.get_provider", return_value=mock_provider), \
         patch("backend.modules.query.pandas_agent.run_pandas_agent", new_callable=AsyncMock, side_effect=Exception("fail")):
        resp = client.post(
            "/query/",
            headers=auth_headers,
            json={"question": "Algo?", "project_id": project["id"], "csv_file_id": csv_file["id"]},
        )
    assert resp.status_code == 200
    assert resp.json()["engine"] == "error"
    assert resp.json()["success"] is False
