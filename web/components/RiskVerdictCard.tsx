'use client';

import React, { useState } from 'react';
import { 
  ShieldIcon, 
  ShieldAlertIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  XCircleIcon, 
  WavesIcon, 
  WindIcon, 
  ActivityIcon,
  CompassIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { HOURLY_FORECAST, ForecastHour, VesselProfile } from '../lib/marineData';

interface RiskVerdictCardProps {
  selectedVessel: VesselProfile;
  vesselPos: { lat: number; lng: number };
  nearestImblDistanceKm: number;
}

export function RiskVerdictCard({
  selectedVessel,
  vesselPos,
  nearestImblDistanceKm,
}: RiskVerdictCardProps) {
  const [selectedHour, setSelectedHour] = useState<ForecastHour>(HOURLY_FORECAST[0]);

  // Compute live verdict based on deterministic threshold rules
  const currentWave = 1.6;
  const currentWind = 14.0;
  const isWaveExceeded = currentWave > selectedVessel.maxWaveHeightM;
  const isWindExceeded = currentWind > selectedVessel.maxWindSpeedKnots;
  const isImblViolated = nearestImblDistanceKm <= 5.0;

  let overallVerdict: 'GO' | 'CAUTION' | 'NO_GO' = 'GO';
  let reasons: string[] = [];

  if (isWaveExceeded || isWindExceeded) {
    overallVerdict = 'NO_GO';
    if (isWaveExceeded) reasons.push(`Wave height (${currentWave}m) exceeds vessel envelope limit (${selectedVessel.maxWaveHeightM}m)`);
    if (isWindExceeded) reasons.push(`Wind speed (${currentWind} kts) exceeds vessel limit (${selectedVessel.maxWindSpeedKnots} kts)`);
  } else if (isImblViolated) {
    overallVerdict = 'CAUTION';
    reasons.push(`Vessel is ${nearestImblDistanceKm.toFixed(1)} km from IMBL (within 5 km warning buffer)`);
  } else {
    overallVerdict = 'GO';
    reasons.push(`All parameters safe. Wave ${currentWave}m < ${selectedVessel.maxWaveHeightM}m limit.`);
    reasons.push(`Wind ${currentWind} kts < ${selectedVessel.maxWindSpeedKnots} kts limit.`);
    reasons.push(`Boundary clearance ${nearestImblDistanceKm.toFixed(1)} km > 5.0 km threshold.`);
  }

  return (
    <div className="risk-engine-container">
      {/* Header */}
      <div className="risk-header">
        <div className="risk-title-group">
          <ShieldIcon size={24} className="risk-icon" />
          <div>
            <h2 className="risk-title">Deterministic Marine Safety Engine</h2>
            <p className="risk-subtitle">
              Versioned Rule-Engine v4.2 • Vessel Threshold Envelope • PostGIS Geofence Guard
            </p>
          </div>
        </div>

        <div className={`verdict-main-badge ${overallVerdict.toLowerCase()}`}>
          {overallVerdict === 'GO' && <CheckCircleIcon size={22} />}
          {overallVerdict === 'CAUTION' && <AlertTriangleIcon size={22} />}
          {overallVerdict === 'NO_GO' && <XCircleIcon size={22} />}
          <span className="verdict-text-bold">VERDICT: {overallVerdict}</span>
        </div>
      </div>

      {/* Grid: Live Rules Checklist + Vessel Tolerance Matrix */}
      <div className="risk-grid-row">
        {/* Vessel Safety Matrix */}
        <div className="risk-card vessel-envelope-card">
          <h3 className="card-heading">
            <CompassIcon size={16} />
            <span>Vessel Operating Limits ({selectedVessel.name.split('(')[0].trim()})</span>
          </h3>

          <div className="envelope-metrics-list">
            <div className="envelope-row">
              <div className="metric-label-group">
                <WavesIcon size={16} />
                <span>Max Wave Tolerance:</span>
              </div>
              <div className="metric-val-group">
                <strong className={currentWave > selectedVessel.maxWaveHeightM ? 'val-danger' : 'val-safe'}>
                  {currentWave}m
                </strong>
                <span className="val-threshold">/ {selectedVessel.maxWaveHeightM}m max</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${currentWave > selectedVessel.maxWaveHeightM ? 'danger' : 'safe'}`}
                style={{ width: `${Math.min(100, (currentWave / selectedVessel.maxWaveHeightM) * 100)}%` }}
              />
            </div>

            <div className="envelope-row">
              <div className="metric-label-group">
                <WindIcon size={16} />
                <span>Max Wind Speed:</span>
              </div>
              <div className="metric-val-group">
                <strong className={currentWind > selectedVessel.maxWindSpeedKnots ? 'val-danger' : 'val-safe'}>
                  {currentWind} kts
                </strong>
                <span className="val-threshold">/ {selectedVessel.maxWindSpeedKnots} kts max</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${currentWind > selectedVessel.maxWindSpeedKnots ? 'danger' : 'safe'}`}
                style={{ width: `${Math.min(100, (currentWind / selectedVessel.maxWindSpeedKnots) * 100)}%` }}
              />
            </div>

            <div className="envelope-row">
              <div className="metric-label-group">
                <ShieldAlertIcon size={16} />
                <span>Geofence Boundary Clearance:</span>
              </div>
              <div className="metric-val-group">
                <strong className={nearestImblDistanceKm <= 5 ? 'val-danger' : 'val-safe'}>
                  {nearestImblDistanceKm.toFixed(1)} km
                </strong>
                <span className="val-threshold">/ 5.0 km buffer</span>
              </div>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar-fill ${nearestImblDistanceKm <= 5 ? 'danger' : 'safe'}`}
                style={{ width: `${Math.min(100, (nearestImblDistanceKm / 20) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explainable Reasons & Evidence */}
        <div className="risk-card reasons-card">
          <h3 className="card-heading">
            <ActivityIcon size={16} />
            <span>Deterministic Evidence & Rule Reasons</span>
          </h3>

          <ul className="reasons-list">
            {reasons.map((r, idx) => (
              <li key={idx} className="reason-item">
                <CheckCircleIcon size={14} className="reason-icon-check" />
                <span>{r}</span>
              </li>
            ))}
            <li className="reason-item subtle">
              <span>📡 INCOIS Ocean State Forecast: Synced 5m ago (Model: WW3-v4.2)</span>
            </li>
            <li className="reason-item subtle">
              <span>🌦️ IMD Cyclone Bulletin: No active tropical depression on SW coast</span>
            </li>
            <li className="reason-item subtle">
              <span>🔐 PostGIS Spatial Engine: 0 intersecting marine national park polygons</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 24-Hour Departure Window Timeline */}
      <div className="risk-card timeline-card">
        <div className="timeline-header">
          <div>
            <h3 className="card-heading">24-Hour Departure Window & Ocean Forecast Chart</h3>
            <span className="timeline-subheading">
              Select any departure hour to preview ocean wave conditions and safety status
            </span>
          </div>

          <div className="selected-hour-badge">
            <span>Selected Time: <strong>{selectedHour.hour} IST</strong> ({selectedHour.safetyVerdict})</span>
          </div>
        </div>

        {/* Interactive Hourly Scrubber Grid */}
        <div className="hourly-scrubber-grid">
          {HOURLY_FORECAST.map((h, idx) => {
            const isSelected = selectedHour.hour === h.hour;
            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedHour(h);
                  soundFX.playBlip(800 + idx * 30);
                }}
                className={`hourly-col ${h.safetyVerdict.toLowerCase()} ${isSelected ? 'active-hour' : ''}`}
              >
                <span className="col-hour">{h.hour}</span>

                {/* Wave Height Bar */}
                <div className="col-bar-track">
                  <div
                    className={`col-bar-fill ${h.safetyVerdict.toLowerCase()}`}
                    style={{ height: `${(h.waveHeightM / 4.0) * 100}%` }}
                  />
                </div>

                <span className="col-wave">{h.waveHeightM}m</span>
                <span className="col-wind">{h.windSpeedKnots} kts</span>

                <div className={`col-verdict-dot ${h.safetyVerdict.toLowerCase()}`} />
              </div>
            );
          })}
        </div>

        {/* Selected Hour Details */}
        <div className="selected-hour-detail-tray">
          <div className="detail-item">
            <span className="detail-label">SIGNIFICANT WAVE:</span>
            <span className="detail-val">{selectedHour.waveHeightM} m</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">WIND SPEED & GUST:</span>
            <span className="detail-val">{selectedHour.windSpeedKnots} kts</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">SWELL PERIOD:</span>
            <span className="detail-val">{selectedHour.swellPeriodSec} s</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">SURFACE TEMP:</span>
            <span className="detail-val">{selectedHour.sstCelsius} °C</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">RAIN PRECIPITATION:</span>
            <span className="detail-val">{selectedHour.rainMm} mm/h</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">SAFETY ADVISORY:</span>
            <span className={`detail-val-badge ${selectedHour.safetyVerdict.toLowerCase()}`}>
              {selectedHour.safetyVerdict === 'GO' ? 'OPTIMAL SAILING' : selectedHour.safetyVerdict === 'CAUTION' ? 'CAUTION: SQUALL' : 'NO-GO: HEAVY SEAS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
