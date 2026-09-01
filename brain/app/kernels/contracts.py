from pydantic import BaseModel, Field
from typing import List, Optional

class Point2D(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

# geodesic_nn kernel contracts
class GeodesicNNInput(BaseModel):
    origin: Point2D
    candidates: List[Point2D]

class GeodesicNNResult(BaseModel):
    nearest_point: Point2D
    distance_km: float = Field(..., ge=0.0)
    bearing_deg: float = Field(..., ge=0.0, le=360.0)
    candidate_index: int

# sample_fields kernel contracts
class FieldSampleInput(BaseModel):
    location: Point2D
    field_data: List[dict] # gridded point records [{lat, lon, wave_height_m, wind_speed_knots, sst_c}]

class FieldSampleResult(BaseModel):
    wave_height_m: float
    wind_speed_knots: float
    sst_celsius: float
    data_age_hours: float
    is_valid: bool

# envelope_eval kernel contracts
class EnvelopeEvalInput(BaseModel):
    vessel_max_wave_m: float
    vessel_max_wind_knots: float
    current_wave_m: float
    current_wind_knots: float
    has_imd_warning: bool = False
    pfz_suspended: bool = False

class EnvelopeEvalResult(BaseModel):
    verdict: str # GO | CAUTION | NO_GO
    wave_safety_margin_m: float
    wind_safety_margin_knots: float
    reasons: List[str]
