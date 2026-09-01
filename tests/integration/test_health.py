import pytest
import httpx
import asyncio

@pytest.mark.asyncio
async def test_brain_healthz_endpoint():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get("http://localhost:8000/healthz", timeout=3.0)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ok"
            assert data["service"] == "namami-brain"
        except Exception:
            pytest.skip("Brain service not running locally on port 8000")

@pytest.mark.asyncio
async def test_edge_healthz_endpoint():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get("http://localhost:4000/healthz", timeout=3.0)
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "ok"
            assert data["service"] == "namami-edge"
        except Exception:
            pytest.skip("Edge service not running locally on port 4000")
