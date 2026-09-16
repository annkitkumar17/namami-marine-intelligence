import pytest
from app.connectors.incois import INCOISPFZConnector, INCOISOSFConnector
from app.connectors.imd import IMDHazardConnector
from app.connectors.bhoonidhi import BhoonidhiConnector
from app.connectors.bhashini import BhashiniConnector
from app.connectors.open_meteo import OpenMeteoConnector
from app.connectors.registry import connector_registry


@pytest.mark.asyncio
async def test_incois_pfz_connector():
    conn = INCOISPFZConnector()
    nodes = await conn.fetch_normalized(latitude=9.96, longitude=76.24)
    assert len(nodes) > 0
    top_node = nodes[0]
    assert top_node.id == "PFZ-SW-042"
    assert top_node.distance_km is not None
    assert top_node.bearing_deg is not None
    assert top_node.metadata.provider == "Indian National Centre for Ocean Information Services (MoES)"
    assert top_node.metadata.data_mode in ["live", "demo"]


@pytest.mark.asyncio
async def test_incois_osf_connector():
    conn = INCOISOSFConnector()
    obs = await conn.fetch_normalized(latitude=9.96, longitude=76.24)
    assert obs.wave_height_m > 0
    assert obs.wind_speed_knots > 0
    assert len(obs.hourly_forecast) > 0
    assert obs.metadata.confidence >= 0.90


@pytest.mark.asyncio
async def test_imd_hazard_connector():
    conn = IMDHazardConnector()
    hazards = await conn.fetch_normalized(latitude=9.96, longitude=76.24)
    assert len(hazards) > 0
    assert hazards[0].severity in ["CRITICAL", "HIGH", "MODERATE", "LOW", "NIL"]
    assert hazards[0].metadata.provider == "India Meteorological Department (IMD)"


@pytest.mark.asyncio
async def test_bhoonidhi_connector():
    conn = BhoonidhiConnector()
    products = await conn.fetch_normalized(latitude=9.96, longitude=76.24)
    assert len(products) >= 2
    assert products[0].sensor.startswith("Oceansat-3") or products[0].sensor.startswith("NISAR")


@pytest.mark.asyncio
async def test_bhashini_connector():
    conn = BhashiniConnector()
    res = await conn.translate_text(text="Nearest PFZ is 46.2 km west.", target_lang="hi")
    assert res.target_language == "hi"
    assert res.translated_text != ""


@pytest.mark.asyncio
async def test_open_meteo_fallback_connector():
    conn = OpenMeteoConnector()
    fixture = conn.get_demo_fixture(latitude=9.96, longitude=76.24)
    assert fixture.metadata.data_mode == "fallback"
    assert fixture.metadata.confidence <= 0.85


@pytest.mark.asyncio
async def test_circuit_breaker_and_registry():
    conn = INCOISPFZConnector()
    assert conn.circuit_breaker.state == "CLOSED"

    # Simulate failures
    conn.circuit_breaker.record_failure()
    conn.circuit_breaker.record_failure()
    conn.circuit_breaker.record_failure()
    assert conn.circuit_breaker.state == "OPEN"
    assert conn.circuit_breaker.can_attempt() is False

    # Test registry health aggregation
    health_list = connector_registry.get_all_health()
    assert len(health_list) >= 6

    # Test connector connection test API
    test_res = await connector_registry.test_connector("open-meteo")
    assert test_res["status"] in ["CONNECTED", "MOCK_MODE"]
