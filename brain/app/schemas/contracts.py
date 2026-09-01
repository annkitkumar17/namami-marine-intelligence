from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

class SafetyVerdict(str, Enum):
    GO = "GO"
    CAUTION = "CAUTION"
    NO_GO = "NO_GO"

class DegradedTier(str, Enum):
    TIER_1_FULL = "TIER_1_FULL"
    TIER_2_PARTIAL_ENV = "TIER_2_PARTIAL_ENV"
    TIER_3_PROJECTED_PFZ = "TIER_3_PROJECTED_PFZ"
    TIER_4_REFUSAL = "TIER_4_REFUSAL"

class IntentType(str, Enum):
    P1_PROXIMITY = "P1_PROXIMITY"
    P2_GO_NOGO = "P2_GO_NOGO"
    P3_FIELD_SEARCH = "P3_FIELD_SEARCH"
    P4_ROUTE = "P4_ROUTE"
    P5_DIAGNOSTIC = "P5_DIAGNOSTIC"

class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class AskRequest(BaseModel):
    user_id: Optional[str] = "demo_user"
    query_text: str = Field(..., min_length=1)
    current_location: Coordinates
    vessel_id: Optional[str] = "vessel_001"
    language: Optional[str] = "en"

class LedgerStepContract(BaseModel):
    step_id: str
    step_order: int
    agent_name: str
    kernel_name: Optional[str] = None
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    execution_time_ms: float
    timestamp: str

class AdvisoryResponse(BaseModel):
    advisory_id: str
    query_text: str
    intent_type: IntentType
    safety_verdict: SafetyVerdict
    degraded_tier: DegradedTier
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    narrative: str
    nearest_pfz_distance_km: Optional[float] = None
    nearest_pfz_bearing_deg: Optional[float] = None
    hazards_detected: List[str] = []
    ledger_steps: List[LedgerStepContract] = []
    created_at: str

class NavIC25BytePacket(BaseModel):
    packet_header: int = Field(0xAA, description="1-byte sync header")
    msg_type: int = Field(1, description="1-byte message type (1=Safety Advisory)")
    latitude_raw: int = Field(..., description="3-byte encoded latitude")
    longitude_raw: int = Field(..., description="3-byte encoded longitude")
    verdict_code: int = Field(..., description="1-byte verdict (1=GO, 2=CAUTION, 3=NO_GO)")
    wave_height_dm: int = Field(..., description="2-byte wave height in decimeters")
    wind_speed_ds: int = Field(..., description="2-byte wind speed in dms")
    hazard_flags: int = Field(..., description="2-byte bitmask of active hazards")
    timestamp_epoch_sec: int = Field(..., description="4-byte epoch timestamp")
    crc32_checksum: int = Field(..., description="4-byte CRC-32 checksum")
    raw_hex: str = Field(..., min_length=50, max_length=50, description="25-byte hex string representation")
