import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.ingest.sources.base_adapter import BaseSourceAdapter
from app.db.models import PFZNode, PFZStateEnum, IngestRun
from app.config import settings

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "ingest" / "fixtures" / "incois_pfz_sample.json"

class INCOISPFZAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__("INCOIS_PFZ")

    async def fetch_raw(self) -> Dict[str, Any]:
        # Priority 1 INCOIS source fetcher with fixture fallback
        if settings.DATA_MODE == "REAL" and settings.FEATURE_INCOIS and settings.INCOIS_PFZ_API_URL:
            # Placeholder for live INCOIS HTTP client call
            pass
        with open(FIXTURE_PATH, "r") as f:
            return json.load(f)

    async def normalize(self, raw_data: Dict[str, Any]) -> List[PFZNode]:
        nodes = []
        raw_state = raw_data.get("state", "ACTIVE")
        state_enum = PFZStateEnum[raw_state] if raw_state in PFZStateEnum.__members__ else PFZStateEnum.ACTIVE
        valid_until = datetime.utcnow() + timedelta(days=2)

        for rec in raw_data.get("records", []):
            node = PFZNode(
                id=rec["id"],
                advisory_id=raw_data.get("source", "INCOIS_PFZ_001"),
                sector=rec["sector"],
                depth_m=rec.get("depth_m"),
                sst_celsius=rec.get("sst_celsius"),
                location=f"SRID=4326;POINT({rec['longitude']} {rec['latitude']})",
                valid_until=valid_until,
                state=state_enum
            )
            nodes.append(node)
        return nodes

    async def run_ingestion(self) -> Dict[str, Any]:
        started_at = datetime.utcnow()
        try:
            raw_data = await self.fetch_raw()
            nodes = await self.normalize(raw_data)
            completed_at = datetime.utcnow()
            
            return {
                "source_id": self.source_id,
                "status": "SUCCESS",
                "started_at": started_at.isoformat(),
                "completed_at": completed_at.isoformat(),
                "records_ingested": len(nodes),
                "nodes": [
                    {
                        "id": n.id,
                        "sector": n.sector,
                        "depth_m": n.depth_m,
                        "sst_celsius": n.sst_celsius,
                        "latitude": float(n.location.split("(")[1].split()[1].replace(")", "")),
                        "longitude": float(n.location.split("(")[1].split()[0]),
                        "state": n.state.value
                    }
                    for n in nodes
                ]
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
