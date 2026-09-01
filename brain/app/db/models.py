from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
import enum
from app.db.session import Base

class SafetyVerdictEnum(str, enum.Enum):
    GO = "GO"
    CAUTION = "CAUTION"
    NO_GO = "NO_GO"

class DegradedTierEnum(str, enum.Enum):
    TIER_1_FULL = "TIER_1_FULL"
    TIER_2_PARTIAL_ENV = "TIER_2_PARTIAL_ENV"
    TIER_3_PROJECTED_PFZ = "TIER_3_PROJECTED_PFZ"
    TIER_4_REFUSAL = "TIER_4_REFUSAL"

class PFZStateEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED_BAN = "SUSPENDED_BAN"
    SUSPENDED_CYCLONE = "SUSPENDED_CYCLONE"
    SUSPENDED_HIGH_WAVES = "SUSPENDED_HIGH_WAVES"
    SUSPENDED_TSUNAMI = "SUSPENDED_TSUNAMI"

# Operational Models
class AppUser(Base):
    __tablename__ = "app_user"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=True)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

class VesselClass(Base):
    __tablename__ = "vessel_class"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    max_wave_height_m = Column(Float, nullable=False)
    max_wind_speed_knots = Column(Float, nullable=False)
    max_distance_nmi = Column(Float, nullable=False)

class Vessel(Base):
    __tablename__ = "vessel"
    id = Column(String, primary_key=True)
    registration_no = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("app_user.id"))
    vessel_class_id = Column(String, ForeignKey("vessel_class.id"))
    home_port = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class LandingCentre(Base):
    __tablename__ = "landing_centre"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=False)

class Voyage(Base):
    __tablename__ = "voyage"
    id = Column(String, primary_key=True)
    vessel_id = Column(String, ForeignKey("vessel.id"), nullable=False)
    status = Column(String, default="ARMED") # ARMED | ACTIVE | CLOSED
    departure_time = Column(DateTime, default=datetime.utcnow)
    return_time = Column(DateTime, nullable=True)
    departure_location = Column(Geometry("POINT", srid=4326))

class VesselPosition(Base):
    __tablename__ = "vessel_position"
    id = Column(String, primary_key=True)
    voyage_id = Column(String, ForeignKey("voyage.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    speed_knots = Column(Float)
    heading_deg = Column(Float)

class CatchReport(Base):
    __tablename__ = "catch_report"
    id = Column(String, primary_key=True)
    voyage_id = Column(String, ForeignKey("voyage.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(Geometry("POINT", srid=4326))
    species = Column(String)
    weight_kg = Column(Float)

# Data Products
class IngestRun(Base):
    __tablename__ = "ingest_run"
    id = Column(String, primary_key=True)
    source_id = Column(String, nullable=False)
    status = Column(String, nullable=False) # SUCCESS | FAILED | RUNNING
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    records_ingested = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)

class RasterGranule(Base):
    __tablename__ = "raster_granule"
    id = Column(String, primary_key=True)
    source_name = Column(String, nullable=False) # MOSDAC | INCOIS | OSTIA
    product_type = Column(String, nullable=False) # SST | CHLOROPHYLL | WIND
    timestamp = Column(DateTime, nullable=False, index=True)
    s3_path = Column(String, nullable=False)
    bbox = Column(Geometry("POLYGON", srid=4326))
    provenance = Column(JSON)

class PFZNode(Base):
    __tablename__ = "pfz_node"
    id = Column(String, primary_key=True)
    advisory_id = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    depth_m = Column(Float)
    sst_celsius = Column(Float)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    valid_until = Column(DateTime, nullable=False)
    state = Column(SQLEnum(PFZStateEnum), default=PFZStateEnum.ACTIVE)

class PFZAdvisory(Base):
    __tablename__ = "pfz_advisory"
    id = Column(String, primary_key=True)
    source_date = Column(DateTime, nullable=False)
    sector_name = Column(String, nullable=False)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326))
    raw_text = Column(Text)
    state = Column(SQLEnum(PFZStateEnum), default=PFZStateEnum.ACTIVE)

class ForecastField(Base):
    __tablename__ = "forecast_field"
    id = Column(String, primary_key=True)
    source = Column(String, nullable=False) # INCOIS_OSF | IMD
    parameter = Column(String, nullable=False) # WAVE_HEIGHT | SWELL | CURRENT | WIND
    timestamp = Column(DateTime, nullable=False, index=True)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

class Nowcast(Base):
    __tablename__ = "nowcast"
    id = Column(String, primary_key=True)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    hazard_type = Column(String, nullable=False) # LIGHTNING | SQUALL | RAINFALL
    severity = Column(String, nullable=False) # WARNING | ALERT | WATCH
    issued_at = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    geometry = Column(Geometry("POLYGON", srid=4326))

class ExclusionZone(Base):
    __tablename__ = "exclusion_zone"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    zone_type = Column(String, nullable=False) # MILITARY | INTERNATIONAL_BORDER | CONSERVATION
    geometry = Column(Geometry("POLYGON", srid=4326), nullable=False)

# Evidence & Audit
class Advisory(Base):
    __tablename__ = "advisory"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("app_user.id"), nullable=True)
    query_text = Column(Text, nullable=False)
    intent_type = Column(String, nullable=False) # P1 | P2 | P3 | P4 | P5
    safety_verdict = Column(SQLEnum(SafetyVerdictEnum), nullable=False)
    degraded_tier = Column(SQLEnum(DegradedTierEnum), nullable=False)
    confidence_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    narrative = Column(Text, nullable=False)

class LedgerStep(Base):
    __tablename__ = "ledger_step"
    id = Column(String, primary_key=True)
    advisory_id = Column(String, ForeignKey("advisory.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    agent_name = Column(String, nullable=False)
    kernel_name = Column(String, nullable=True)
    inputs = Column(JSON, nullable=False)
    outputs = Column(JSON, nullable=False)
    execution_time_ms = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
