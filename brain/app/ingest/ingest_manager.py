from typing import Dict, Any, List
from datetime import datetime
from app.ingest.sources.incois_pfz import INCOISPFZAdapter
from app.ingest.sources.open_sst import OpenSSTAdapter

class IngestManager:
    def __init__(self):
        self.adapters = {
            "incois_pfz": INCOISPFZAdapter(),
            "open_sst": OpenSSTAdapter(),
        }
        self.run_history: List[Dict[str, Any]] = []

    async def trigger_source(self, source_name: str) -> Dict[str, Any]:
        if source_name not in self.adapters:
            raise ValueError(f"Unknown source: {source_name}. Available: {list(self.adapters.keys())}")
        
        adapter = self.adapters[source_name]
        result = await adapter.run_ingestion()
        
        run_record = {
            "run_id": f"ingest_{int(datetime.utcnow().timestamp())}",
            "source_id": result["source_id"],
            "status": result["status"],
            "started_at": result["started_at"],
            "completed_at": result["completed_at"],
            "records_ingested": result.get("records_ingested", 0),
            "error_log": result.get("error_log")
        }
        self.run_history.insert(0, run_record)
        return result

    def get_history(self) -> List[Dict[str, Any]]:
        return self.run_history

ingest_manager = IngestManager()
