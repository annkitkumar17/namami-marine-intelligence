from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime

class BaseSourceAdapter(ABC):
    def __init__(self, source_id: str):
        self.source_id = source_id

    @abstractmethod
    async def fetch_raw(self) -> Dict[str, Any]:
        """Fetch raw external API data or load fixture."""
        pass

    @abstractmethod
    async def normalize(self, raw_data: Dict[str, Any]) -> List[Any]:
        """Normalize raw payload into database model objects."""
        pass

    @abstractmethod
    async def run_ingestion(self) -> Dict[str, Any]:
        """Execute full ingestion lifecycle and return execution stats."""
        pass
