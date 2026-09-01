import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "brain"))

from app.kernels.contracts import Point2D, GeodesicNNInput, FieldSampleInput, EnvelopeEvalInput
from app.kernels.geodesic_nn import geodesic_nn_kernel
from app.kernels.sample_fields import sample_fields_kernel
from app.kernels.envelope_eval import envelope_eval_kernel

def test_geodesic_nn_kernel():
    origin = Point2D(latitude=9.22, longitude=79.35)
    candidates = [
        Point2D(latitude=9.25, longitude=79.40),
        Point2D(latitude=10.0, longitude=80.0)
    ]
    res = geodesic_nn_kernel(GeodesicNNInput(origin=origin, candidates=candidates))
    assert res.candidate_index == 0
    assert res.distance_km > 0.0

def test_sample_fields_kernel():
    location = Point2D(latitude=9.22, longitude=79.35)
    field_data = [
        {"latitude": 9.20, "longitude": 79.30, "wave_height_m": 1.0, "wind_speed_knots": 10.0, "sst_celsius": 28.0},
        {"latitude": 9.25, "longitude": 79.40, "wave_height_m": 1.2, "wind_speed_knots": 12.0, "sst_celsius": 28.2}
    ]
    res = sample_fields_kernel(FieldSampleInput(location=location, field_data=field_data))
    assert res.is_valid is True
    assert 1.0 <= res.wave_height_m <= 1.2

def test_envelope_eval_kernel_go():
    inp = EnvelopeEvalInput(
        vessel_max_wave_m=2.5,
        vessel_max_wind_knots=25.0,
        current_wave_m=1.0,
        current_wind_knots=12.0
    )
    res = envelope_eval_kernel(inp)
    assert res.verdict == "GO"

def test_envelope_eval_kernel_nogo_on_wave():
    inp = EnvelopeEvalInput(
        vessel_max_wave_m=2.5,
        vessel_max_wind_knots=25.0,
        current_wave_m=3.0,
        current_wind_knots=12.0
    )
    res = envelope_eval_kernel(inp)
    assert res.verdict == "NO_GO"
