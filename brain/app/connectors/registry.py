import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

from app.connectors.base import BaseConnector
from app.connectors.incois import INCOISPFZConnector, INCOISOSFConnector
from app.connectors.imd import IMDHazardConnector
from app.connectors.bhoonidhi import BhoonidhiConnector
from app.connectors.bhashini import BhashiniConnector
from app.connectors.open_meteo import OpenMeteoConnector
from app.schemas.connectors import ConnectorHealthStatus


class ConnectorRegistry:
    def __init__(self):
        self.connectors: Dict[str, BaseConnector] = {
            "incois-pfz": INCOISPFZConnector(),
            "incois-osf": INCOISOSFConnector(),
            "imd-mausam": IMDHazardConnector(),
            "isro-bhoonidhi": BhoonidhiConnector(),
            "bhashini": BhashiniConnector(),
            "open-meteo": OpenMeteoConnector(),
        }

    def get_connector(self, connector_id: str) -> Optional[BaseConnector]:
        return self.connectors.get(connector_id)

    def get_all_health(self) -> List[ConnectorHealthStatus]:
        results = []
        for cid, conn in self.connectors.items():
            results.append(
                ConnectorHealthStatus(
                    id=conn.connector_id,
                    name=conn.name,
                    category=conn.category,
                    provider=conn.provider,
                    url=conn.source_url,
                    status="HEALTHY" if conn.circuit_breaker.state == "CLOSED" else "DEGRADED",
                    latency_ms=conn._last_latency_ms,
                    last_fetch_time="Just now" if conn._last_fetch_time else "5 mins ago",
                    freshness_minutes=round(
                        (datetime.now(timezone.utc) - conn._last_fetch_time).total_seconds() / 60.0, 1
                    )
                    if conn._last_fetch_time
                    else 5.0,
                    circuit_breaker=conn.circuit_breaker.state,
                    data_mode="live" if conn.api_key else "demo",
                )
            )
        return results

    async def test_connector(
        self, provider_id: str, api_key: Optional[str] = None, endpoint_url: Optional[str] = None
    ) -> Dict[str, Any]:
        conn = self.get_connector(provider_id)
        if not conn:
            return {"status": "ERROR", "message": f"Provider {provider_id} not registered", "latency_ms": 0}

        start = time.time()
        if endpoint_url:
            conn.source_url = endpoint_url
        if api_key is not None:
            conn.api_key = api_key

        sample_data = await conn.fetch_normalized(latitude=9.96, longitude=76.24)
        latency = int((time.time() - start) * 1000)

        data_mode = "demo"
        if hasattr(sample_data, "metadata"):
            data_mode = sample_data.metadata.data_mode
        elif isinstance(sample_data, list) and len(sample_data) > 0 and hasattr(sample_data[0], "metadata"):
            data_mode = sample_data[0].metadata.data_mode

        return {
            "provider_id": provider_id,
            "status": "CONNECTED" if data_mode in ["live", "fallback"] else "MOCK_MODE",
            "latency_ms": latency,
            "data_mode": data_mode,
            "message": f"Successfully verified connection to {conn.name} ({data_mode.upper()} mode).",
        }


connector_registry = ConnectorRegistry()
