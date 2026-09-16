from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime, timezone

DataModeType = Literal["live", "cached", "demo", "unavailable", "fallback"]
CircuitBreakerState = Literal["CLOSED", "OPEN", "HALF_OPEN"]


class SourceMetadata(BaseModel):
    provider: str
    source_url: str
    data_mode: DataModeType = "demo"
    retrieved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    issued_at: Optional[str] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    freshness_minutes: float = 0.0
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    warning_or_limitation: Optional[str] = None


class PFZNodeData(BaseModel):
    id: str
    sector: str
    latitude: float
    longitude: float
    depth_m: float
    sst_celsius: float
    chlorophyll_mg_m3: float
    catch_score: int
    bearing_deg: Optional[float] = None
    distance_km: Optional[float] = None
    species_likely: List[str] = []
    status: str = "ACTIVE"
    metadata: SourceMetadata


class HourlyOceanForecast(BaseModel):
    hour: str
    wave_height_m: float
    wind_speed_knots: float
    swell_period_sec: float
    sst_celsius: float
    current_knots: float
    tide_m: float
    safety_verdict: str


class OceanStateObservation(BaseModel):
    location: Dict[str, float]
    wave_height_m: float
    wind_speed_knots: float
    swell_period_sec: float
    sst_celsius: float
    current_knots: float
    tide_m: float
    hourly_forecast: List[HourlyOceanForecast] = []
    metadata: SourceMetadata


class IMDHazardAlert(BaseModel):
    id: str
    hazard_type: str  # CYCLONE, SQUALL, HEAVY_RAIN, LIGHTNING, HIGH_WAVES
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "LOW", "NIL"]
    warning_color: Literal["RED", "ORANGE", "YELLOW", "GREEN"]
    affected_sector: str
    headline: str
    description: str
    geometry: Dict[str, Any] = {}
    valid_from: str
    valid_to: str
    metadata: SourceMetadata


class BhoonidhiProduct(BaseModel):
    product_id: str
    sensor: str  # NISAR, Oceansat-3, Resourcesat-2A
    product_type: str  # SAR_ROUGHNESS, CHLOROPHYLL_OCM, SST_AATSR
    observation_time: str
    resolution_m: float
    scene_url: Optional[str] = None
    metadata: SourceMetadata


class BhashiniResult(BaseModel):
    source_text: Optional[str] = None
    transcript: Optional[str] = None
    detected_language: str = "en"
    translated_text: str
    target_language: str
    audio_output_url: Optional[str] = None
    metadata: SourceMetadata


class ConnectorHealthStatus(BaseModel):
    id: str
    name: str
    category: str
    provider: str
    url: str
    status: Literal["HEALTHY", "DEGRADED", "MOCK_FIXTURE", "DISABLED"]
    latency_ms: int
    last_fetch_time: str
    freshness_minutes: float
    circuit_breaker: CircuitBreakerState
    data_mode: DataModeType
    sample_payload: Optional[Dict[str, Any]] = None
