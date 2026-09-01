from app.kernels.contracts import FieldSampleInput, FieldSampleResult
from app.kernels.geodesic_nn import compute_haversine_distance_and_bearing

def sample_fields_kernel(inputs: FieldSampleInput) -> FieldSampleResult:
    if not inputs.field_data:
        return FieldSampleResult(
            wave_height_m=0.0,
            wind_speed_knots=0.0,
            sst_celsius=28.0,
            data_age_hours=0.0,
            is_valid=False
        )

    # Simple inverse distance weighting (IDW) interpolation
    total_weight = 0.0
    weighted_wave = 0.0
    weighted_wind = 0.0
    weighted_sst = 0.0

    for pt in inputs.field_data:
        dist_km, _ = compute_haversine_distance_and_bearing(
            inputs.location.latitude, inputs.location.longitude,
            pt['latitude'], pt['longitude']
        )
        weight = 1.0 / (dist_km + 0.01)**2
        total_weight += weight
        weighted_wave += pt.get('wave_height_m', 0.0) * weight
        weighted_wind += pt.get('wind_speed_knots', 0.0) * weight
        weighted_sst += pt.get('sst_celsius', 28.0) * weight

    return FieldSampleResult(
        wave_height_m=round(weighted_wave / total_weight, 2),
        wind_speed_knots=round(weighted_wind / total_weight, 2),
        sst_celsius=round(weighted_sst / total_weight, 2),
        data_age_hours=1.5,
        is_valid=True
    )
