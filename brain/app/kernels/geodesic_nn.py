import math
from app.kernels.contracts import GeodesicNNInput, GeodesicNNResult, Point2D

EARTH_RADIUS_KM = 6371.0088

def compute_haversine_distance_and_bearing(lat1: float, lon1: float, lat2: float, lon2: float):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_km = EARTH_RADIUS_KM * c

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing_deg = (math.degrees(math.atan2(y, x)) + 360.0) % 360.0

    return round(distance_km, 3), round(bearing_deg, 2)

def geodesic_nn_kernel(inputs: GeodesicNNInput) -> GeodesicNNResult:
    if not inputs.candidates:
        raise ValueError("Candidates list cannot be empty")

    best_idx = -1
    min_dist = float('inf')
    best_bearing = 0.0

    for idx, cand in enumerate(inputs.candidates):
        dist, bearing = compute_haversine_distance_and_bearing(
            inputs.origin.latitude, inputs.origin.longitude,
            cand.latitude, cand.longitude
        )
        if dist < min_dist:
            min_dist = dist
            best_bearing = bearing
            best_idx = idx

    return GeodesicNNResult(
        nearest_point=inputs.candidates[best_idx],
        distance_km=min_dist,
        bearing_deg=best_bearing,
        candidate_index=best_idx
    )
