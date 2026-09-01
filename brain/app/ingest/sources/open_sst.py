import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from app.ingest.sources.base_adapter import BaseSourceAdapter
from app.db.models import RasterGranule

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "ingest" / "fixtures" / "sst_sample.json"

class OpenSSTAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__("OSTIA_SST_FALLBACK")

    async def fetch_raw(self) -> Dict[str, Any]:
        with open(FIXTURE_PATH, "r") as f:
            return json.load(f)

    async def normalize(self, raw_data: Dict[str, Any]) -> RasterGranule:
        granule_id = f"granule_sst_{int(datetime.utcnow().timestamp())}"
        granule = RasterGranule(
            id=granule_id,
            source_name=raw_data.get("source", "OSTIA_SST_FALLBACK"),
            product_type="SST",
            timestamp=datetime.utcnow(),
            s3_path=f"s3://namami-cog-granules/sst/{granule_id}.tif",
            provenance={
                "provider": "OSTIA_ERDDAP",
                "resolution_km": raw_data.get("resolution_km", 5.0),
                "is_fallback": True
            }
        )
        return granule

    async def run_ingestion(self) -> Dict[str, Any]:
        started_at = datetime.utcnow()
        try:
            raw_data = await self.fetch_raw()
            granule = await self.normalize(raw_data)
            completed_at = datetime.utcnow()

            return {
                "source_id": self.source_id,
                "status": "SUCCESS",
                "started_at": started_at.isoformat(),
                "completed_at": completed_at.isoformat(),
                "records_ingested": len(raw_data.get("grid", [])),
                "granule": {
                    "id": granule.id,
                    "source_name": granule.source_name,
                    "product_type": granule.product_type,
                    "s3_path": granule.s3_path,
                    "provenance": granule.provenance
                },
                "grid": raw_data.get("grid", [])
            }
        except Exception as e:
            return {
                "source_id": self.source_id,
                "status": "FAILED",
                "started_at": started_at.isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
                "records_ingested": 0,
                "error_log": str(e)
            }
