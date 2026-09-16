from typing import Optional
from datetime import datetime, timezone, timedelta

from app.connectors.base import BaseConnector
from app.schemas.connectors import OceanStateObservation, HourlyOceanForecast


class OpenMeteoConnector(BaseConnector):
    def __init__(self, endpoint_url: str = "https://marine-api.open-meteo.com/v1/marine"):
        super().__init__(
            connector_id="open-meteo",
            name="Open-Meteo Marine Forecast (Fallback)",
            category="OSF_FALLBACK",
            provider="Open-Meteo Public Marine API",
            source_url=endpoint_url,
            is_enabled=True,
            api_key="public-no-key",
        )

    async def fetch_normalized(self, latitude: float, longitude: float) -> OceanStateObservation:
        raw = await self.fetch_with_retry(
            self.source_url,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "hourly": "wave_height,wind_speed_10m,wave_period",
            },
        )

        now = datetime.now(timezone.utc)
        meta = self.build_metadata(
            data_mode="fallback",
            confidence=0.85,
            issued_at=now.isoformat(),
            valid_to=(now + timedelta(hours=24)).isoformat(),
            warning="FALLBACK DATA: Open-Meteo used because official INCOIS feed is unconfigured. Not an official Indian advisory.",
        )

        if raw and "hourly" in raw:
            hourly_waves = raw["hourly"].get("wave_height", [1.5])
            hourly_winds = raw["hourly"].get("wind_speed_10m", [13.0])
            hourly_periods = raw["hourly"].get("wave_period", [9.0])

            current_wave = float(hourly_waves[0] or 1.5) if hourly_waves else 1.5
            current_wind = float(hourly_winds[0] or 13.0) if hourly_winds else 13.0
            current_period = float(hourly_periods[0] or 9.0) if hourly_periods else 9.0

            hourly = [
                HourlyOceanForecast(
                    hour=f"{h:02d}:00",
                    wave_height_m=float(hourly_waves[idx] if idx < len(hourly_waves) and hourly_waves[idx] is not None else 1.5),
                    wind_speed_knots=float(hourly_winds[idx] if idx < len(hourly_winds) and hourly_winds[idx] is not None else 13.0),
                    swell_period_sec=float(hourly_periods[idx] if idx < len(hourly_periods) and hourly_periods[idx] is not None else 9.0),
                    sst_celsius=28.2,
                    current_knots=1.0,
                    tide_m=0.4,
                    safety_verdict="GO" if (float(hourly_waves[idx] if idx < len(hourly_waves) and hourly_waves[idx] is not None else 1.5)) < 2.5 else "CAUTION",
                )
                for idx, h in enumerate(range(6, 22, 2))
            ]

            return OceanStateObservation(
                location={"latitude": latitude, "longitude": longitude},
                wave_height_m=current_wave,
                wind_speed_knots=current_wind,
                swell_period_sec=current_period,
                sst_celsius=28.2,
                current_knots=1.0,
                tide_m=0.4,
                hourly_forecast=hourly,
                metadata=meta,
            )

        return self.get_demo_fixture(latitude=latitude, longitude=longitude)

    def get_demo_fixture(self, latitude: float = 9.96, longitude: float = 76.24) -> OceanStateObservation:
        now = datetime.now(timezone.utc)
        meta = self.build_metadata(
            data_mode="fallback",
            confidence=0.80,
            warning="FALLBACK DATA: Open-Meteo simulated response.",
        )

        return OceanStateObservation(
            location={"latitude": latitude, "longitude": longitude},
            wave_height_m=1.5,
            wind_speed_knots=13.0,
            swell_period_sec=9.2,
            sst_celsius=28.2,
            current_knots=1.0,
            tide_m=0.4,
            hourly_forecast=[],
            metadata=meta,
        )
