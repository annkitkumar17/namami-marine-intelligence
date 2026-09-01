import pytest
import sys
from pathlib import Path

# Add brain directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "brain"))

from app.schemas.contracts import AskRequest, AdvisoryResponse, SafetyVerdict, DegradedTier, IntentType, Coordinates

def test_ask_request_validation():
    req = AskRequest(
        query_text="Is it safe to fish?",
        current_location=Coordinates(latitude=9.22, longitude=79.35)
    )
    assert req.query_text == "Is it safe to fish?"
    assert req.current_location.latitude == 9.22
    assert req.current_location.longitude == 79.35

def test_invalid_coordinates():
    with pytest.raises(ValueError):
        Coordinates(latitude=105.0, longitude=79.35)

def test_advisory_response_schema():
    adv = AdvisoryResponse(
        advisory_id="adv_1001",
        query_text="Nearest PFZ zone?",
        intent_type=IntentType.P1_PROXIMITY,
        safety_verdict=SafetyVerdict.GO,
        degraded_tier=DegradedTier.TIER_1_FULL,
        confidence_score=0.98,
        narrative="Safe operating conditions",
        hazards_detected=[],
        ledger_steps=[],
        created_at="2026-09-01T23:55:00Z"
    )
    assert adv.safety_verdict == SafetyVerdict.GO
    assert adv.degraded_tier == DegradedTier.TIER_1_FULL
