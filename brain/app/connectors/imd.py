from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.connectors.base import BaseConnector
from app.schemas.connectors import IMDHazardAlert


class IMDHazardConnector(BaseConnector):
    def __init__(self, api_key: Optional[str] = None, endpoint_url: str = "https://mausam.imd.gov.in/api/marine"):
        super().__init__(
            connector_id="imd-mausam",
            name="IMD Mausam Marine & Cyclone Warning Desk",
            category="WEATHER",
            provider="India Meteorological Department (IMD)",
            source_url=endpoint_url,
            is_enabled=True,
            api_key=api_key,
        )

    async def fetch_normalized(self, latitude: float, longitude: float) -> List[IMDHazardAlert]:
        return self.get_demo_fixture(latitude=latitude, longitude=longitude)

    def get_demo_fixture(self, latitude: float = 9.96, longitude: float = 76.24) -> List[IMDHazardAlert]:
        now = datetime.now(timezone.utc)
        meta = self.build_metadata(
            data_mode="demo",
            confidence=0.95,
            issued_at=now.isoformat(),
            valid_to=(now + timedelta(hours=24)).isoformat(),
            warning="IMD Mausam coastal bulletin active.",
        )

        return [
            IMDHazardAlert(
                id="IMD-SW-BULLETIN-20260916",
                hazard_type="SQUALL",
                severity="MODERATE",
                warning_color="YELLOW",
                affected_sector="South Kerala Coast (Kochi to Alappuzha)",
                headline="Yellow Watch: Squally weather with wind speed 25-35 kts expected post-18:00 hrs IST",
                description="Fishermen are advised to exercise caution and avoid deep sea operations beyond 50m depth after evening.",
                geometry={
                    "type": "Polygon",
                    "coordinates": [
                        [[75.50, 9.40], [75.80, 9.40], [75.80, 9.10], [75.50, 9.10], [75.50, 9.40]]
                    ],
                },
                valid_from=now.isoformat(),
                valid_to=(now + timedelta(hours=24)).isoformat(),
                metadata=meta,
            )
        ]
