'use client';

import React, { useState } from 'react';
import { 
  ShipIcon, 
  DownloadIcon, 
  CheckCircleIcon, 
  RefreshCwIcon, 
  LayersIcon, 
  RadioIcon,
  ShieldIcon,
  Volume2Icon
} from './Icons';
import { soundFX } from '../lib/audio';
import { VesselProfile, EMERGENCY_PHRASES } from '../lib/marineData';

interface VoyageArmingProps {
  selectedVessel: VesselProfile;
  offlineMode: boolean;
  onToggleOffline: () => void;
}

export function VoyageArming({
  selectedVessel,
  offlineMode,
  onToggleOffline,
}: VoyageArmingProps) {
  const [departureTime, setDepartureTime] = useState<string>('2026-09-17T05:30');
  const [returnTime, setReturnTime] = useState<string>('2026-09-17T17:30');
  const [operatingSector, setOperatingSector] = useState<string>('SW Sector 4 (Kochi-Alappuzha Offing)');
  const [crewCount, setCrewCount] = useState<number>(selectedVessel.crewCount);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [packGenerated, setPackGenerated] = useState<boolean>(true);
  const [packHash, setPackHash] = useState<string>('sha256:7f8a9b2c3d4e5f60718293a4b5c6d7e8');

  const handleArmVoyage = async () => {
    setIsGenerating(true);
    soundFX.playBlip(780);

    // Multi-stage pack generation simulation
    await new Promise(r => setTimeout(r, 900));

    const newHash = `sha256:${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;
    setPackHash(newHash);
    setIsGenerating(false);
    setPackGenerated(true);
    soundFX.playSonarPing();
  };

  const handleDownloadPack = () => {
    const packPayload = {
      version: "3.0.0-SIH2026",
      packId: `pack_${Date.now()}`,
      created_at: new Date().toISOString(),
      vessel: selectedVessel,
      voyage: {
        departureTime,
        returnTime,
        operatingSector,
        crewCount,
      },
      offlineMaps: {
        format: "PMTiles v3",
        bounds: [6.0, 67.0, 24.0, 90.0],
        layers: ["coastline", "bathymetry", "ports", "restricted_zones"]
      },
      geofenceBoundariesGeoJson: {
        imblPalkBay: "STRICT_5KM_BUFFER",
        mpaGulfOfMannar: "MPA_NO_TRAWL",
        navalRangeW44: "ACTIVE_FIRING_CORRIDOR"
      },
      forecastDigest48h: {
        source: "INCOIS-WW3-v4.2",
        maxWaveM: 2.4,
        maxWindKts: 22,
        tidePattern: "SEMIDIURNAL"
      },
      emergencyPhrases: EMERGENCY_PHRASES,
      sha256: packHash
    };

    const blob = new Blob([JSON.stringify(packPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NAMAMI_VOYAGE_PACK_${selectedVessel.callSign}.namami-pack`;
    a.click();
    URL.revokeObjectURL(url);
    soundFX.playBlip(1200);
  };

  return (
    <div className="voyage-arming-container">
      {/* Header */}
      <div className="voyage-header">
        <div className="voyage-title-group">
          <ShipIcon size={24} className="voyage-icon-glow" />
          <div>
            <h2 className="voyage-title">Armed Voyage & Offline Navigation Pack Builder</h2>
            <p className="voyage-subtitle">
              Zero-Connectivity GPS Guard • PMTiles Vector Map Archive • 48-Hour Forecast Digest
            </p>
          </div>
        </div>

        <div className="voyage-status-badge">
          <span className="armed-pill">
            <span className="pulsing-green-dot" />
            <span>VOYAGE STATUS: ARMED & REGISTERED</span>
          </span>
        </div>
      </div>

      {/* Grid: Voyage Form + Offline Pack Generator */}
      <div className="voyage-grid-row">
        {/* Voyage Setup Form */}
        <div className="voyage-card form-card">
          <h3 className="card-heading">
            <ShipIcon size={16} />
            <span>Voyage Manifest & Operating Envelope</span>
          </h3>

          <div className="form-fields-grid">
            <div className="form-group">
              <label className="form-label">Registered Vessel:</label>
              <input
                type="text"
                disabled
                value={`${selectedVessel.name} (${selectedVessel.callSign})`}
                className="form-input disabled"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Home Port Anchorage:</label>
              <input
                type="text"
                disabled
                value={selectedVessel.homePort}
                className="form-input disabled"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Departure (IST):</label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Port Return (IST):</label>
              <input
                type="datetime-local"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Target Operating Sector:</label>
              <input
                type="text"
                value={operatingSector}
                onChange={(e) => setOperatingSector(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Crew on Board:</label>
              <input
                type="number"
                value={crewCount}
                onChange={(e) => setCrewCount(Number(e.target.value))}
                min="1"
                max="30"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vessel Safety Wave Limit:</label>
              <input
                type="text"
                disabled
                value={`${selectedVessel.maxWaveHeightM} meters (Auto-Enforced)`}
                className="form-input disabled"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleArmVoyage}
              disabled={isGenerating}
              className="btn-arm-voyage"
            >
              {isGenerating ? (
                <RefreshCwIcon size={16} className="icon-spin" />
              ) : (
                <ShieldIcon size={16} />
              )}
              <span>{isGenerating ? 'Packaging PMTiles & Geospatial Pack...' : 'Re-Arm Voyage & Refresh Pack'}</span>
            </button>
          </div>
        </div>

        {/* Offline Pack Download & Integrity Manifest */}
        <div className="voyage-card pack-card">
          <h3 className="card-heading">
            <LayersIcon size={16} />
            <span>Offline Pack Manifest (100% Android Field-Ready)</span>
          </h3>

          <div className="pack-manifest-items">
            <div className="manifest-item">
              <CheckCircleIcon size={16} className="icon-check" />
              <div>
                <strong>MapLibre PMTiles Vector Archive</strong>
                <p>Coastal bathymetry, 50m contours, harbor lights (4.2 MB)</p>
              </div>
            </div>

            <div className="manifest-item">
              <CheckCircleIcon size={16} className="icon-check" />
              <div>
                <strong>PostGIS Geofence Boundaries (GeoJSON)</strong>
                <p>Indo-Sri Lanka IMBL, Sir Creek, Gulf of Mannar MPA</p>
              </div>
            </div>

            <div className="manifest-item">
              <CheckCircleIcon size={16} className="icon-check" />
              <div>
                <strong>48-Hour INCOIS OSF & IMD Forecast Digest</strong>
                <p>Wave height grids, squall alerts, tide charts</p>
              </div>
            </div>

            <div className="manifest-item">
              <CheckCircleIcon size={16} className="icon-check" />
              <div>
                <strong>Multilingual Audio Emergency SOS Phrases</strong>
                <p>Pre-synthesized distress audio in Hindi, Tamil, Malayalam</p>
              </div>
            </div>
          </div>

          <div className="pack-hash-box">
            <span className="hash-label">INTEGRITY SHA-256 HASH:</span>
            <code className="hash-code">{packHash}</code>
          </div>

          <div className="pack-actions">
            <button
              type="button"
              onClick={handleDownloadPack}
              className="btn-download-pack"
            >
              <DownloadIcon size={16} />
              <span>Download .namami-pack (For Mobile App)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
