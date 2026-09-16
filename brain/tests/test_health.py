from fastapi.testclient import TestClient

from app.config import settings
from app.health import liveness_payload
from app.main import app


def test_liveness_payload_shape():
    payload = liveness_payload()
    assert payload["status"] == "ok"
    assert payload["service"] == "namami-brain"
    assert payload["data_mode"] == settings.DATA_MODE
    assert "timestamp" in payload


def test_healthz_endpoint():
    client = TestClient(app)
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "namami-brain"


def test_readyz_endpoint_non_strict():
    settings.READY_STRICT = False
    client = TestClient(app)
    res = client.get("/readyz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["checks"]["database"] == "not_checked"
    assert data["checks"]["redis"] == "not_checked"
    assert data["checks"]["minio"] == "not_checked"
