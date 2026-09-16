from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.connectors.base import BaseConnector
from app.schemas.connectors import BhoonidhiProduct


class BhoonidhiConnector(BaseConnector):
    def __init__(self, api_key: Optional[str] = None, endpoint_url: str = "https://bhoonidhi.nrsc.gov.in/api/v1/search"):
        super().__init__(
            connector_id="isro-bhoonidhi",
            name="ISRO Bhoonidhi Earth Observation & NISAR",
            category="SATELLITE",
            provider="National Remote Sensing Centre (NRSC / ISRO)",
            source_url=endpoint_url,
            is_enabled=True,
            api_key=api_key,
        )

    async def fetch_normalized(self, latitude: float, longitude: float) -> List[BhoonidhiProduct]:
        return self.get_demo_fixture(latitude=latitude, longitude=longitude)

    def get_demo_fixture(self, latitude: float = 9.96, longitude: float = 76.24) -> List[BhoonidhiProduct]:
        now = datetime.now(timezone.utc)
        meta = self.build_metadata(
            data_mode="demo",
            confidence=0.96,
            issued_at=(now - timedelta(hours=4)).isoformat(),
            valid_to=(now + timedelta(hours=44)).isoformat(),
        )

        return [
            BhoonidhiProduct(
                product_id="EOS06_OCM_20260916_SW_SECTOR",
                sensor="Oceansat-3 (EOS-06) OCM-3",
                product_type="CHLOROPHYLL_OCM",
                observation_time=(now - timedelta(hours=4)).isoformat(),
                resolution_m=360.0,
                scene_url="https://bhoonidhi.nrsc.gov.in/products/EOS06_OCM_SAMPLE",
                metadata=meta,
            ),
            BhoonidhiProduct(
                product_id="NISAR_SAR_L_BAND_SW_SECTOR",
                sensor="NISAR L-band SAR",
                product_type="SAR_ROUGHNESS",
                observation_time=(now - timedelta(hours=10)).isoformat(),
                resolution_m=12.5,
                scene_url="https://bhoonidhi.nrsc.gov.in/NISAR/SAMPLE",
                metadata=meta,
            ),
        ]
