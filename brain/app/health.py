from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text

from app.config import settings
from app.logging import logger


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def liveness_payload() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "namami-brain",
        "environment": settings.ENVIRONMENT,
        "data_mode": settings.DATA_MODE,
        "timestamp": utc_now(),
    }


async def _check_database() -> str:
    from app.db.session import engine

    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return "ok"


async def _check_redis() -> str:
    from redis.asyncio import from_url

    client = from_url(settings.REDIS_URL, socket_connect_timeout=1)
    try:
        pong = await client.ping()
        return "ok" if pong else "unavailable"
    finally:
        await client.aclose()


async def _check_minio() -> str:
    import asyncio
    import socket

    host, _, port = settings.MINIO_ENDPOINT.partition(":")
    port_num = int(port or "9000")

    def _connect() -> None:
        with socket.create_connection((host, port_num), timeout=1):
            return None

    await asyncio.to_thread(_connect)
    return "ok"


async def readiness_payload() -> tuple[dict[str, Any], int]:
    checks: dict[str, str] = {}
    errors: dict[str, str] = {}

    for name, checker in (
        ("database", _check_database),
        ("redis", _check_redis),
        ("minio", _check_minio),
    ):
        if not settings.READY_STRICT:
            checks[name] = "not_checked"
            continue
        try:
            checks[name] = await checker()
        except Exception as exc:
            logger.warning("readiness check failed", extra={"dependency": name, "error": str(exc)})
            checks[name] = "unavailable"
            errors[name] = str(exc)

    failed = [name for name, status in checks.items() if status == "unavailable"]
    ready = len(failed) == 0
    payload: dict[str, Any] = {
        "status": "ready" if ready else "not_ready",
        "service": "namami-brain",
        "data_mode": settings.DATA_MODE,
        "strict": settings.READY_STRICT,
        "checks": checks,
        "timestamp": utc_now(),
    }
    if errors:
        payload["errors"] = errors
    return payload, 200 if ready else 503
