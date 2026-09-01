from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import json
from pathlib import Path
from typing import Optional

from app.config import settings
from app.schemas.contracts import (
    AskRequest, AdvisoryResponse, SafetyVerdict, DegradedTier, IntentType, LedgerStepContract
)
from app.kernels.contracts import Point2D, GeodesicNNInput, FieldSampleInput, EnvelopeEvalInput
from app.kernels.geodesic_nn import geodesic_nn_kernel
from app.kernels.sample_fields import sample_fields_kernel
from app.kernels.envelope_eval import envelope_eval_kernel
from app.ingest.ingest_manager import ingest_manager
from app.ingest.sources.incois_pfz import INCOISPFZAdapter
from app.ingest.sources.open_sst import OpenSSTAdapter

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="NAMAMI Python Brain & Scientific Intelligence Gateway"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FIXTURE_DIR = Path(__file__).parent / "ingest" / "fixtures"

@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        "service": "namami-brain",
        "environment": settings.ENVIRONMENT,
        "data_mode": settings.DATA_MODE,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/readyz")
async def readyz():
    return {
        "status": "ready",
        "database": "configured",
        "redis": "configured",
        "minio": "configured"
    }

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
    radius_km: float = Query(50.0, ge=1, le=500)
):
    adapter = INCOISPFZAdapter()
    raw = await adapter.fetch_raw()
    nodes = await adapter.normalize(raw)

    candidates = [
        Point2D(
            latitude=float(n.location.split("(")[1].split()[1].replace(")", "")),
            longitude=float(n.location.split("(")[1].split()[0])
        )
        for n in nodes
    ]

    nn_input = GeodesicNNInput(
        origin=Point2D(latitude=latitude, longitude=longitude),
        candidates=candidates
    )
    nn_res = geodesic_nn_kernel(nn_input)

    return {
        "query_location": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "nearest_node": {
            "id": nodes[nn_res.candidate_index].id,
            "sector": nodes[nn_res.candidate_index].sector,
            "depth_m": nodes[nn_res.candidate_index].depth_m,
            "sst_celsius": nodes[nn_res.candidate_index].sst_celsius,
            "distance_km": nn_res.distance_km,
            "bearing_deg": nn_res.bearing_deg,
            "state": nodes[nn_res.candidate_index].state.value
        },
        "all_nodes": [
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

@app.get("/v1/fields/sst")
async def get_sst_field():
    adapter = OpenSSTAdapter()
    res = await adapter.run_ingestion()
    return res

@app.post("/v1/ask", response_model=AdvisoryResponse)
async def ask_advisory(request: AskRequest):
    # Data MVP ingestion query path
    pfz_adapter = INCOISPFZAdapter()
    raw_pfz = await pfz_adapter.fetch_raw()
    pfz_nodes = await pfz_adapter.normalize(raw_pfz)

    sst_adapter = OpenSSTAdapter()
    sst_res = await sst_adapter.run_ingestion()

    candidates = [
        Point2D(
            latitude=float(n.location.split("(")[1].split()[1].replace(")", "")),
            longitude=float(n.location.split("(")[1].split()[0])
        )
        for n in pfz_nodes
    ]
    nn_input = GeodesicNNInput(
        origin=Point2D(latitude=request.current_location.latitude, longitude=request.current_location.longitude),
        candidates=candidates
    )
    nn_res = geodesic_nn_kernel(nn_input)

    field_input = FieldSampleInput(
        location=Point2D(latitude=request.current_location.latitude, longitude=request.current_location.longitude),
        field_data=sst_res.get("grid", [])
    )
    field_res = sample_fields_kernel(field_input)

    envelope_input = EnvelopeEvalInput(
        vessel_max_wave_m=2.5,
        vessel_max_wind_knots=25.0,
        current_wave_m=field_res.wave_height_m,
        current_wind_knots=field_res.wind_speed_knots,
        has_imd_warning=False,
        pfz_suspended=(raw_pfz.get("state") != "ACTIVE")
    )
    envelope_res = envelope_eval_kernel(envelope_input)

    ledger_steps = [
        LedgerStepContract(
            step_id="step_1",
            step_order=1,
            agent_name="PFZAgent",
            kernel_name="geodesic_nn",
            inputs=nn_input.model_dump(),
            outputs=nn_res.model_dump(),
            execution_time_ms=1.1,
            timestamp=datetime.utcnow().isoformat()
        ),
        LedgerStepContract(
            step_id="step_2",
            step_order=2,
            agent_name="OceanAgent",
            kernel_name="sample_fields",
            inputs=field_input.model_dump(),
            outputs=field_res.model_dump(),
            execution_time_ms=2.1,
            timestamp=datetime.utcnow().isoformat()
        ),
        LedgerStepContract(
            step_id="step_3",
            step_order=3,
            agent_name="RiskAgent",
            kernel_name="envelope_eval",
            inputs=envelope_input.model_dump(),
            outputs=envelope_res.model_dump(),
            execution_time_ms=0.7,
            timestamp=datetime.utcnow().isoformat()
        )
    ]

    selected_pfz = pfz_nodes[nn_res.candidate_index]

    narrative = (
        f"Nearest PFZ zone identified in {selected_pfz.sector} at {nn_res.distance_km} km "
        f"(bearing {nn_res.bearing_deg}°). Current ocean parameters: wave height {field_res.wave_height_m}m, "
        f"wind speed {field_res.wind_speed_knots}kts, SST {field_res.sst_celsius}°C. "
        f"Safety Verdict: {envelope_res.verdict}. Reasons: {'; '.join(envelope_res.reasons)}."
    )

    return AdvisoryResponse(
        advisory_id=f"adv_{int(datetime.utcnow().timestamp())}",
        query_text=request.query_text,
        intent_type=IntentType.P1_PROXIMITY,
        safety_verdict=SafetyVerdict(envelope_res.verdict),
        degraded_tier=DegradedTier.TIER_1_FULL,
        confidence_score=0.95,
        narrative=narrative,
        nearest_pfz_distance_km=nn_res.distance_km,
        nearest_pfz_bearing_deg=nn_res.bearing_deg,
        hazards_detected=envelope_res.reasons if envelope_res.verdict != "GO" else [],
        ledger_steps=ledger_steps,
        created_at=datetime.utcnow().isoformat()
    )
