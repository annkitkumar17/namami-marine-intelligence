'use client';

import React from 'react';
import { 
  ActivityIcon, 
  RefreshCwIcon, 
  CompassIcon, 
  MapPinIcon, 
  WavesIcon, 
  WindIcon, 
  ShieldIcon 
} from './Icons';
import { LiveMarineWeather } from '../lib/weatherApi';
import { VesselProfile } from '../lib/marineData';

interface LiveWeatherPanelProps {
  weatherData: LiveMarineWeather | null;
  isLoading: boolean;
  onRefresh: () => void;
  selectedVessel: VesselProfile;
  locationName?: string;
}

export function LiveWeatherPanel({
  weatherData,
  isLoading,
  onRefresh,
  selectedVessel,
  locationName,
}: LiveWeatherPanelProps) {
  if (!weatherData) {
    return (
      <div className="weather-standalone-card loading-state">
        <div className="weather-loading-spinner">
          <RefreshCwIcon size={24} className="icon-spin-subtle" />
          <span>Fetching Real-Time Marine Weather Telemetry from Open-Meteo & INCOIS...</span>
        </div>
      </div>
    );
  }

  const cur = weatherData.current;
  const safety = weatherData.marineSafety;

  return (
    <div className="weather-standalone-card">
      {/* 1. Header Bar */}
      <div className="weather-standalone-header">
        <div className="weather-header-info">
          <div className="weather-location-title-row">
            <span className="weather-pulse-beacon" />
            <h3 className="weather-location-title">
              {locationName || weatherData.location.name || `${weatherData.location.lat}°N, ${weatherData.location.lng}°E`}
            </h3>
            <span className="live-api-pill">
              {weatherData.isLive ? '🟢 LIVE METEOROLOGICAL TELEMETRY' : '🟡 INCOIS CALIBRATED FORECAST'}
            </span>
          </div>
          <p className="weather-time-meta">
            GPS: {weatherData.location.lat.toFixed(4)}°N, {weatherData.location.lng.toFixed(4)}°E • Last Synced: {weatherData.fetchedAt} IST
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-weather-refresh"
          title="Refresh real-time weather API"
        >
          <RefreshCwIcon size={14} className={isLoading ? 'icon-spin-subtle' : ''} />
          <span>{isLoading ? 'Syncing...' : 'Sync Live Weather'}</span>
        </button>
      </div>

      {/* 2. Safety Verdict Alert Banner */}
      <div className={`weather-verdict-banner ${safety.verdict.toLowerCase()}`}>
        <div className="verdict-banner-left">
          <span className="verdict-icon">
            {safety.verdict === 'GO' ? '🟢' : safety.verdict === 'CAUTION' ? '🟡' : '🔴'}
          </span>
          <div>
            <div className="verdict-headline">
              MARINE SAFETY VERDICT: {safety.verdict === 'GO' ? 'SAFE TO VENTURE (GO)' : safety.verdict === 'CAUTION' ? 'MODERATE RISK (CAUTION)' : 'HIGH RISK (NO-GO)'}
            </div>
            <div className="verdict-explanation">{safety.summary}</div>
          </div>
        </div>

        <div className="verdict-banner-right">
          <span className="vessel-envelope-tag">
            Vessel Limit: {selectedVessel.maxWaveHeightM}m wave / {selectedVessel.maxWindSpeedKnots} kts wind
          </span>
        </div>
      </div>

      {/* 3. Primary Marine Weather Cards Grid */}
      <div className="weather-primary-grid">
        {/* Air & Sea Temperature */}
        <div className="marine-metric-box">
          <div className="metric-box-header">
            <span>🌡️ Temperature & Skies</span>
            <span className="metric-badge">{cur.weatherDescription}</span>
          </div>
          <div className="metric-hero-val">
            <span className="weather-big-emoji">{cur.weatherIcon}</span>
            <div className="metric-val-unit">
              <span className="hero-number">{cur.tempC}°</span>
              <span className="hero-sub">Air Temp (Feels {cur.apparentTempC}°C)</span>
            </div>
          </div>
          <div className="metric-footer-stats">
            <span>Water SST: <strong>{cur.waterTempC}°C</strong></span>
            <span>Humidity: <strong>{cur.humidity}%</strong></span>
          </div>
        </div>

        {/* Significant Wave Height (Hs) */}
        <div className="marine-metric-box">
          <div className="metric-box-header">
            <span>🌊 Wave Height (Hs)</span>
            <span className={`metric-badge ${cur.waveHeightM > selectedVessel.maxWaveHeightM ? 'badge-danger' : 'badge-safe'}`}>
              {cur.seaCondition}
            </span>
          </div>
          <div className="metric-hero-val">
            <div className="metric-val-unit">
              <span className="hero-number">{cur.waveHeightM}</span>
              <span className="hero-unit">Meters</span>
            </div>
          </div>
          <div className="metric-bar-track">
            <div 
              className={`metric-bar-fill ${cur.waveHeightM > selectedVessel.maxWaveHeightM ? 'danger' : ''}`}
              style={{ width: `${Math.min(100, (cur.waveHeightM / selectedVessel.maxWaveHeightM) * 100)}%` }}
            />
          </div>
          <div className="metric-footer-stats">
            <span>Wave Period: <strong>{cur.wavePeriodSec}s</strong></span>
            <span>Limit: <strong>{selectedVessel.maxWaveHeightM}m</strong></span>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="marine-metric-box">
          <div className="metric-box-header">
            <span>💨 Wind Speed & Gusts</span>
            <span className="metric-badge">{cur.windCompass} ({cur.windDirectionDeg}°)</span>
          </div>
          <div className="metric-hero-val">
            <div className="metric-val-unit">
              <span className="hero-number">{cur.windSpeedKnots}</span>
              <span className="hero-unit">Knots ({cur.windSpeedKmh} km/h)</span>
            </div>
          </div>
          <div className="metric-bar-track">
            <div 
              className={`metric-bar-fill ${cur.windSpeedKnots > selectedVessel.maxWindSpeedKnots ? 'danger' : ''}`}
              style={{ width: `${Math.min(100, (cur.windSpeedKnots / selectedVessel.maxWindSpeedKnots) * 100)}%` }}
            />
          </div>
          <div className="metric-footer-stats">
            <span>Gusts: <strong>{cur.windGustsKnots} kts</strong></span>
            <span>Limit: <strong>{selectedVessel.maxWindSpeedKnots} kts</strong></span>
          </div>
        </div>

        {/* Ocean Swell & Barometer */}
        <div className="marine-metric-box">
          <div className="metric-box-header">
            <span>🌊 Deep Ocean Swell</span>
            <span className="metric-badge">Period {cur.swellPeriodSec}s</span>
          </div>
          <div className="metric-hero-val">
            <div className="metric-val-unit">
              <span className="hero-number">{cur.swellHeightM}</span>
              <span className="hero-unit">Meters Swell</span>
            </div>
          </div>
          <div className="metric-bar-track">
            <div className="metric-bar-fill swell" style={{ width: '50%' }} />
          </div>
          <div className="metric-footer-stats">
            <span>Pressure: <strong>{cur.pressureHpa} hPa</strong></span>
            <span>Direction: <strong>{cur.swellDirectionDeg}°</strong></span>
          </div>
        </div>
      </div>

      {/* 4. 24-Hour Hourly Sea Forecast Timeline */}
      <div className="weather-hourly-section">
        <div className="hourly-section-header">
          <h4 className="hourly-section-title">24-Hour Sea State & Wave Forecast Timeline</h4>
          <span className="hourly-section-legend">
            <span className="legend-dot go" /> Safe (GO)
            <span className="legend-dot caution" /> Moderate (Caution)
            <span className="legend-dot no_go" /> High Risk (No-Go)
          </span>
        </div>

        <div className="hourly-forecast-grid-scroll">
          {weatherData.hourly.map((hour, idx) => (
            <div key={idx} className={`hourly-forecast-pill verdict-${hour.verdict.toLowerCase()}`}>
              <span className="pill-hour">{hour.hourLabel}</span>
              <span className="pill-icon">{hour.weatherIcon}</span>
              <span className="pill-temp">{hour.tempC}°C</span>
              <span className="pill-wave">{hour.waveHeightM}m</span>
              <span className="pill-wind">{hour.windKnots} kts</span>
              <span className={`pill-status-dot ${hour.verdict.toLowerCase()}`} title={hour.verdict} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
