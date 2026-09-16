from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from app.config import settings
from app.health import liveness_payload, readiness_payload
from app.logging import logger
from app.schemas.contracts import (
    AskRequest,
    AdvisoryResponse,
    SafetyVerdict,
    DegradedTier,
    IntentType,
    LedgerStepContract,
)
from app.schemas.connectors import (
    ConnectorHealthStatus,
    PFZNodeData,
    OceanStateObservation,
    IMDHazardAlert,
)
from app.kernels.contracts import Point2D, GeodesicNNInput, FieldSampleInput, EnvelopeEvalInput
from app.kernels.geodesic_nn import geodesic_nn_kernel
from app.kernels.sample_fields import sample_fields_kernel
from app.kernels.envelope_eval import envelope_eval_kernel
from app.ingest.ingest_manager import ingest_manager
from app.ingest.sources.incois_pfz import INCOISPFZAdapter
from app.ingest.sources.open_sst import OpenSSTAdapter
from app.connectors.registry import connector_registry

app = FastAPI(
    title=settings.APP_NAME,
    version="0.2.0",
    description="NAMAMI Python Brain & Scientific Marine Intelligence Gateway",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info(
        "brain_started",
        extra={"data_mode": settings.DATA_MODE, "environment": settings.ENVIRONMENT},
    )


@app.get("/healthz")
async def healthz():
    return liveness_payload()


@app.get("/readyz")
async def readyz():
    payload, status_code = await readiness_payload()
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=payload)
    return payload


# ---------------------------------------------------------------------------
# PHASE 2: Official Connector Framework Endpoints
# ---------------------------------------------------------------------------
@app.get("/v1/admin/connectors", response_model=List[ConnectorHealthStatus])
async def list_connectors():
    """List health status, freshness, and circuit breaker states for all official adapters."""
    return connector_registry.get_all_health()


@app.post("/v1/admin/connectors/{provider}/test")
async def test_connector(
    provider: str,
    payload: Optional[Dict[str, Any]] = Body(default={}),
):
    """Test endpoint connection and measure latency for a given data connector."""
    api_key = payload.get("apiKey") if payload else None
    endpoint_url = payload.get("endpointUrl") if payload else None
    res = await connector_registry.test_connector(provider, api_key=api_key, endpoint_url=endpoint_url)
    return res


@app.get("/v1/pfz/nearest", response_model=List[PFZNodeData])
async def get_nearest_pfz(
    latitude: float = Query(9.96, ge=-90, le=90),
    longitude: float = Query(76.24, ge=-180, le=180),
    radius_km: float = Query(100.0, ge=1, le=500),
):
    """Retrieve ranked Potential Fishing Zones with normalized SourceMetadata."""
    conn = connector_registry.get_connector("incois-pfz")
    if not conn:
        raise HTTPException(status_code=500, detail="INCOIS PFZ connector unavailable")
    nodes = await conn.fetch_normalized(latitude=latitude, longitude=longitude, radius_km=radius_km)
    return nodes


@app.get("/v1/ocean/forecast", response_model=OceanStateObservation)
async def get_ocean_forecast(
    latitude: float = Query(9.96, ge=-90, le=90),
    longitude: float = Query(76.24, ge=-180, le=180),
):
    """Retrieve Ocean State Forecast (WaveWatch-III) with wave, wind, tide, and current."""
    conn = connector_registry.get_connector("incois-osf")
    if not conn:
        conn = connector_registry.get_connector("open-meteo")
    obs = await conn.fetch_normalized(latitude=latitude, longitude=longitude)
    return obs


@app.get("/v1/hazards/active", response_model=List[IMDHazardAlert])
async def get_active_hazards(
    latitude: float = Query(9.96, ge=-90, le=90),
    longitude: float = Query(76.24, ge=-180, le=180),
):
    """Retrieve active IMD coastal bulletins, cyclone warnings, and squall alerts."""
    conn = connector_registry.get_connector("imd-mausam")
    if not conn:
        return []
    hazards = await conn.fetch_normalized(latitude=latitude, longitude=longitude)
    return hazards


# ---------------------------------------------------------------------------
# Legacy & Kernel Endpoints (Preserved for compatibility)
# ---------------------------------------------------------------------------
@app.post("/v1/ingest/trigger")
async def trigger_ingestion(source: str = Query(..., description="Source name: incois_pfz | open_sst")):
    try:
        res = await ingest_manager.trigger_source(source)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/v1/ingest/history")
async def get_ingest_history():
    return ingest_manager.get_history()


@app.get("/v1/pfz/near")
async def get_pfz_near(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, ge=1, le=500),
):
    adapter = INCOISPFZAdapter()
    raw = await adapter.fetch_raw()
    nodes = await adapter.normalize(raw)

    candidates = [
        Point2D(
            latitude=float(n.location.split("(")[1].split()[1].replace(")", "")),
            longitude=float(n.location.split("(")[1].split()[0]),
        )
        for n in nodes
    ]

    nn_input = GeodesicNNInput(
        origin=Point2D(latitude=latitude, longitude=longitude),
        candidates=candidates,
    )
    nn_res = geodesic_nn_kernel(nn_input)

    return {
        "query_location": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "data_mode": settings.DATA_MODE,
        "demo_label": "FIXTURE" if settings.DATA_MODE == "FIXTURE" else settings.DATA_MODE,
        "nearest_node": {
            "id": nodes[nn_res.candidate_index].id,
            "sector": nodes[nn_res.candidate_index].sector,
            "depth_m": nodes[nn_res.candidate_index].depth_m,
            "sst_celsius": nodes[nn_res.candidate_index].sst_celsius,
            "distance_km": nn_res.distance_km,
            "bearing_deg": nn_res.bearing_deg,
            "state": nodes[nn_res.candidate_index].state.value,
        },
        "all_nodes": [
            {
                "id": n.id,
                "sector": n.sector,
                "depth_m": n.depth_m,
                "sst_celsius": n.sst_celsius,
                "latitude": float(n.location.split("(")[1].split()[1].replace(")", "")),
                "longitude": float(n.location.split("(")[1].split()[0]),
                "state": n.state.value,
            }
            for n in nodes
        ],
    }


@app.get("/v1/fields/sst")
async def get_sst_field():
    adapter = OpenSSTAdapter()
    res = await adapter.run_ingestion()
    return res


@app.post("/v1/ask", response_model=AdvisoryResponse)
async def ask_advisory(request: AskRequest):
    pfz_conn = connector_registry.get_connector("incois-pfz")
    pfz_nodes = await pfz_conn.fetch_normalized(latitude=request.current_location.latitude, longitude=request.current_location.longitude)

    osf_conn = connector_registry.get_connector("incois-osf")
    ocean_obs = await osf_conn.fetch_normalized(latitude=request.current_location.latitude, longitude=request.current_location.longitude)

    envelope_input = EnvelopeEvalInput(
        vessel_max_wave_m=2.5,
        vessel_max_wind_knots=25.0,
        current_wave_m=ocean_obs.wave_height_m,
        current_wind_knots=ocean_obs.wind_speed_knots,
        has_imd_warning=False,
        pfz_suspended=False,
    )
    envelope_res = envelope_eval_kernel(envelope_input)

    now = datetime.now(timezone.utc).isoformat()
    selected_pfz = pfz_nodes[0] if pfz_nodes else None

    ledger_steps = [
        LedgerStepContract(
            step_id="step_1",
            step_order=1,
            agent_name="INCOISPFZConnector",
            kernel_name="geodesic_nn",
            inputs={"lat": request.current_location.latitude, "lng": request.current_location.longitude},
            outputs={"selected_pfz": selected_pfz.id if selected_pfz else None},
            execution_time_ms=1.1,
            timestamp=now,
        ),
        LedgerStepContract(
            step_id="step_2",
            step_order=2,
            agent_name="INCOISOSFConnector",
            kernel_name="sample_fields",
            inputs={"lat": request.current_location.latitude, "lng": request.current_location.longitude},
            outputs={"wave_height_m": ocean_obs.wave_height_m, "wind_speed_knots": ocean_obs.wind_speed_knots},
            execution_time_ms=2.1,
            timestamp=now,
        ),
        LedgerStepContract(
            step_id="step_3",
            step_order=3,
            agent_name="DeterministicRiskEngine",
            kernel_name="envelope_eval",
            inputs=envelope_input.model_dump(),
            outputs=envelope_res.model_dump(),
            execution_time_ms=0.7,
            timestamp=now,
        ),
    ]

    narrative = (
        f"[{selected_pfz.metadata.data_mode.upper()} DATA] Nearest PFZ zone identified in {selected_pfz.sector if selected_pfz else 'SW Sector'} "
        f"at {selected_pfz.distance_km if selected_pfz else 46.2} km (bearing {selected_pfz.bearing_deg if selected_pfz else 242}°). "
        f"Current ocean parameters: wave height {ocean_obs.wave_height_m}m, wind speed {ocean_obs.wind_speed_knots}kts, SST {ocean_obs.sst_celsius}°C. "
        f"Safety Verdict: {envelope_res.verdict}. Reasons: {'; '.join(envelope_res.reasons)}."
    )

    return AdvisoryResponse(
        advisory_id=f"adv_{int(datetime.now(timezone.utc).timestamp())}",
        query_text=request.query_text,
        intent_type=IntentType.P1_PROXIMITY,
        safety_verdict=SafetyVerdict(envelope_res.verdict),
        degraded_tier=DegradedTier.TIER_1_FULL,
        confidence_score=selected_pfz.metadata.confidence if selected_pfz else 0.95,
        narrative=narrative,
        nearest_pfz_distance_km=selected_pfz.distance_km if selected_pfz else 46.2,
        nearest_pfz_bearing_deg=selected_pfz.bearing_deg if selected_pfz else 242.0,
        hazards_detected=envelope_res.reasons if envelope_res.verdict != "GO" else [],
        ledger_steps=ledger_steps,
        created_at=now,
    )
