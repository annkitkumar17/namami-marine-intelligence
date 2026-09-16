import asyncio
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from app.schemas.connectors import SourceMetadata, CircuitBreakerState, DataModeType
from app.logging import logger

# Circuit Breaker Configuration
FAILURE_THRESHOLD = 3
RECOVERY_TIMEOUT_SEC = 30.0


class CircuitBreaker:
    def __init__(self, name: str):
        self.name = name
        self.state: CircuitBreakerState = "CLOSED"
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.success_count = 0

    def record_success(self):
        self.failure_count = 0
        if self.state == "HALF_OPEN":
            self.success_count += 1
            if self.success_count >= 2:
                self.state = "CLOSED"
                self.success_count = 0
                logger.info(f"Circuit breaker for {self.name} reset to CLOSED")

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= FAILURE_THRESHOLD:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker for {self.name} tripped to OPEN after {self.failure_count} failures")

    def can_attempt(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if self.last_failure_time and (time.time() - self.last_failure_time) > RECOVERY_TIMEOUT_SEC:
                self.state = "HALF_OPEN"
                logger.info(f"Circuit breaker for {self.name} transitioned to HALF_OPEN (trial)")
                return True
            return False
        if self.state == "HALF_OPEN":
            return True
        return False


class BaseConnector(ABC):
    def __init__(
        self,
        connector_id: str,
        name: str,
        category: str,
        provider: str,
        source_url: str,
        is_enabled: bool = True,
        api_key: Optional[str] = None,
        timeout_sec: float = 5.0,
    ):
        self.connector_id = connector_id
        self.name = name
        self.category = category
        self.provider = provider
        self.source_url = source_url
        self.is_enabled = is_enabled
        self.api_key = api_key
        self.timeout_sec = timeout_sec
        self.circuit_breaker = CircuitBreaker(connector_id)
        self._cache: Dict[str, Any] = {}
        self._last_fetch_time: Optional[datetime] = None
        self._last_latency_ms: int = 25

    def build_metadata(
        self,
        data_mode: DataModeType,
        confidence: float = 0.95,
        issued_at: Optional[str] = None,
        valid_to: Optional[str] = None,
        warning: Optional[str] = None,
    ) -> SourceMetadata:
        now = datetime.now(timezone.utc)
        freshness_mins = 0.0
        if self._last_fetch_time:
            freshness_mins = round((now - self._last_fetch_time).total_seconds() / 60.0, 1)

        return SourceMetadata(
            provider=self.provider,
            source_url=self.source_url,
            data_mode=data_mode,
            retrieved_at=now.isoformat(),
            issued_at=issued_at or now.isoformat(),
            valid_from=now.isoformat(),
            valid_to=valid_to,
            freshness_minutes=freshness_mins,
            confidence=confidence,
            warning_or_limitation=warning,
        )

    async def fetch_with_retry(
        self,
        url: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        max_retries: int = 2,
    ) -> Optional[Dict[str, Any]]:
        if not self.circuit_breaker.can_attempt():
            logger.warning(f"{self.connector_id} circuit breaker is OPEN, bypassing network call")
            return None

        start_time = time.time()
        for attempt in range(max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                    if method.upper() == "GET":
                        resp = await client.get(url, headers=headers, params=params)
                    else:
                        resp = await client.post(url, headers=headers, json=json_data)

                    resp.raise_for_status()
                    self._last_latency_ms = int((time.time() - start_time) * 1000)
                    self._last_fetch_time = datetime.now(timezone.utc)
                    self.circuit_breaker.record_success()
                    return resp.json()
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {self.connector_id}: {str(e)}")
                if attempt < max_retries:
                    await asyncio.sleep(0.3 * (2 ** attempt))
                else:
                    self.circuit_breaker.record_failure()
                    self._last_latency_ms = int((time.time() - start_time) * 1000)
                    return None

    @abstractmethod
    async def fetch_normalized(self, **kwargs) -> Any:
        pass

    @abstractmethod
    def get_demo_fixture(self, **kwargs) -> Any:
        pass
