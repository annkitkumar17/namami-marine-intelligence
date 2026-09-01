from app.kernels.contracts import EnvelopeEvalInput, EnvelopeEvalResult

def envelope_eval_kernel(inputs: EnvelopeEvalInput) -> EnvelopeEvalResult:
    reasons = []
    verdict = "GO"

    wave_margin = inputs.vessel_max_wave_m - inputs.current_wave_m
    wind_margin = inputs.vessel_max_wind_knots - inputs.current_wind_knots

    if inputs.has_imd_warning:
        verdict = "NO_GO"
        reasons.append("IMD Weather Warning active in operational sector")

    if inputs.pfz_suspended:
        verdict = "NO_GO"
        reasons.append("PFZ advisories currently suspended due to safety ban or severe weather")

    if inputs.current_wave_m >= inputs.vessel_max_wave_m:
        verdict = "NO_GO"
        reasons.append(f"Wave height ({inputs.current_wave_m}m) exceeds vessel envelope ({inputs.vessel_max_wave_m}m)")
    elif inputs.current_wave_m >= inputs.vessel_max_wave_m * 0.8:
        if verdict != "NO_GO":
            verdict = "CAUTION"
        reasons.append(f"Wave height ({inputs.current_wave_m}m) approaching vessel threshold ({inputs.vessel_max_wave_m}m)")

    if inputs.current_wind_knots >= inputs.vessel_max_wind_knots:
        verdict = "NO_GO"
        reasons.append(f"Wind speed ({inputs.current_wind_knots}kts) exceeds vessel envelope ({inputs.vessel_max_wind_knots}kts)")
    elif inputs.current_wind_knots >= inputs.vessel_max_wind_knots * 0.8:
        if verdict != "NO_GO":
            verdict = "CAUTION"
        reasons.append(f"Wind speed ({inputs.current_wind_knots}kts) approaching vessel threshold ({inputs.vessel_max_wind_knots}kts)")

    if not reasons:
        reasons.append("Sea state and weather parameters within safe operating thresholds")

    return EnvelopeEvalResult(
        verdict=verdict,
        wave_safety_margin_m=round(wave_margin, 2),
        wind_safety_margin_knots=round(wind_margin, 2),
        reasons=reasons
    )
