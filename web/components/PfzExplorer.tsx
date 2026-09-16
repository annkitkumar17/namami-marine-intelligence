'use client';

import React from 'react';
import { 
  FishIcon, 
  CompassIcon, 
  NavigationIcon, 
  ActivityIcon, 
  CheckCircleIcon,
  LayersIcon,
  WavesIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { PFZ_ZONES, PFZNode } from '../lib/marineData';

interface PfzExplorerProps {
  selectedPfz: PFZNode | null;
  onSelectPfz: (pfz: PFZNode) => void;
  onPlanRouteToPfz: (pfz: PFZNode) => void;
}

export function PfzExplorer({
  selectedPfz,
  onSelectPfz,
  onPlanRouteToPfz,
}: PfzExplorerProps) {
  return (
    <div className="pfz-explorer-container">
      {/* Header */}
      <div className="pfz-header">
        <div className="pfz-title-group">
          <FishIcon size={24} className="pfz-icon-glow" />
          <div>
            <h2 className="pfz-title">INCOIS Potential Fishing Zones (PFZ) Hub</h2>
            <p className="pfz-subtitle">
              Satellite Thermal Fronts (Oceansat-3 & MODIS) • Chlorophyll-a Density • Multi-Criteria Ranking
            </p>
          </div>
        </div>

        <div className="pfz-header-stats">
          <span className="stat-badge">
            <strong>{PFZ_ZONES.length}</strong> ACTIVE SECTORS
          </span>
          <span className="stat-badge live">
            <ActivityIcon size={12} />
            <span>INCOIS SYNCED</span>
          </span>
        </div>
      </div>

      {/* Grid of PFZ Advisory Cards */}
      <div className="pfz-cards-grid">
        {PFZ_ZONES.map((pfz) => {
          const isSelected = selectedPfz?.id === pfz.id;
          return (
            <div
              key={pfz.id}
              onClick={() => {
                onSelectPfz(pfz);
                soundFX.playBlip(1050);
              }}
              className={`pfz-card ${isSelected ? 'selected' : ''} ${pfz.status.toLowerCase()}`}
            >
              {/* Top Row */}
              <div className="pfz-card-top">
                <div>
                  <span className="pfz-sector-badge">{pfz.sector}</span>
                  <h3 className="pfz-card-name">{pfz.name}</h3>
                </div>
                <div className="pfz-catch-score">
                  <span className="score-val">{pfz.catchScore}%</span>
                  <span className="score-label">CATCH PROB</span>
                </div>
              </div>

              {/* Coordinates & Navigation Meta */}
              <div className="pfz-meta-row">
                <div className="meta-item">
                  <CompassIcon size={14} />
                  <span>{pfz.distanceKm} km @ {pfz.bearingDeg}°</span>
                </div>
                <div className="meta-item">
                  <NavigationIcon size={14} />
                  <span>{pfz.lat.toFixed(2)}°N, {pfz.lng.toFixed(2)}°E</span>
                </div>
                <div className="meta-item">
                  <span>Depth: {pfz.depthM} m</span>
                </div>
              </div>

              {/* Oceanographic Front Metrics */}
              <div className="pfz-ocean-metrics">
                <div className="ocean-metric-col">
                  <span className="metric-label">SEA SURFACE TEMP (SST)</span>
                  <span className="metric-val temp">{pfz.sstCelsius} °C</span>
                </div>
                <div className="ocean-metric-col">
                  <span className="metric-label">CHLOROPHYLL-A</span>
                  <span className="metric-val chloro">{pfz.chlorophyllMgM3} mg/m³</span>
                </div>
                <div className="ocean-metric-col">
                  <span className="metric-label">EST. FUEL BURN</span>
                  <span className="metric-val fuel">{pfz.fuelIndex}</span>
                </div>
              </div>

              {/* Pelagic Species Tag List */}
              <div className="pfz-species-tray">
                <span className="species-tray-label">Target Pelagic Species:</span>
                <div className="species-tags-group">
                  {pfz.speciesLikely.map((sp, idx) => (
                    <span key={idx} className="species-tag">
                      🐟 {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pfz-card-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanRouteToPfz(pfz);
                    soundFX.playSonarPing();
                  }}
                  className="btn-plan-route"
                >
                  <NavigationIcon size={14} />
                  <span>Calculate Safe Route (A*)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
