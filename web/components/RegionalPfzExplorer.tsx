'use client';

import React from 'react';
import { 
  FishIcon, 
  MapPinIcon, 
  CompassIcon, 
  NavigationIcon, 
  ActivityIcon,
  SparklesIcon 
} from './Icons';
import { PFZNode } from '../lib/marineData';
import { soundFX } from '../lib/audio';

interface RegionalPfzExplorerProps {
  pfzList: PFZNode[];
  selectedPfz: PFZNode | null;
  onSelectPfz: (pfz: PFZNode) => void;
  onPlanRouteToPfz: (pfz: PFZNode) => void;
  baseLocationName: string;
}

export function RegionalPfzExplorer({
  pfzList,
  selectedPfz,
  onSelectPfz,
  onPlanRouteToPfz,
  baseLocationName,
}: RegionalPfzExplorerProps) {
  return (
    <div className="regional-pfz-container">
      <div className="regional-pfz-header">
        <div className="regional-header-info">
          <div className="pfz-badge-row">
            <span className="pfz-incois-badge">
              <FishIcon size={14} /> <span>INCOIS OCEANSAT-3 & AVHRR ADVISORIES</span>
            </span>
            <span className="pfz-count-tag">{pfzList.length} Active Pelagic Hotspots</span>
          </div>
          <h3 className="regional-pfz-title">
            Potential Fishing Zones (PFZ) around {baseLocationName}
          </h3>
          <p className="regional-pfz-desc">
            Calculated distance, magnetic compass bearing, chlorophyll-a concentration, and sea surface temperature fronts relative to your location.
          </p>
        </div>
      </div>

      <div className="regional-pfz-grid">
        {pfzList.map((pfz) => {
          const isSelected = selectedPfz?.id === pfz.id;
          return (
            <div
              key={pfz.id}
              className={`pfz-regional-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelectPfz(pfz);
                soundFX.playBlip(1080);
              }}
            >
              <div className="card-top-row">
                <div className="pfz-id-tag">{pfz.id}</div>
                <div className={`pfz-status-pill ${pfz.status.toLowerCase()}`}>
                  {pfz.status === 'ACTIVE' ? '🟢 HIGH YIELD FRONT' : '🟡 CAUTION ZONE'}
                </div>
              </div>

              <h4 className="pfz-card-title">{pfz.name}</h4>
              <p className="pfz-card-sector">📍 {pfz.sector}</p>

              <div className="pfz-metrics-matrix">
                <div className="matrix-item">
                  <span className="matrix-label">Catch Score</span>
                  <span className="matrix-val score">{pfz.catchScore}%</span>
                </div>
                <div className="matrix-item">
                  <span className="matrix-label">Distance</span>
                  <span className="matrix-val distance">{pfz.distanceKm} km</span>
                </div>
                <div className="matrix-item">
                  <span className="matrix-label">Bearing</span>
                  <span className="matrix-val">{pfz.bearingDeg}°</span>
                </div>
                <div className="matrix-item">
                  <span className="matrix-label">SST Temp</span>
                  <span className="matrix-val">{pfz.sstCelsius}°C</span>
                </div>
                <div className="matrix-item">
                  <span className="matrix-label">Chlorophyll</span>
                  <span className="matrix-val">{pfz.chlorophyllMgM3} mg/m³</span>
                </div>
                <div className="matrix-item">
                  <span className="matrix-label">Water Depth</span>
                  <span className="matrix-val">{pfz.depthM} m</span>
                </div>
              </div>

              <div className="pfz-species-row">
                <span className="species-tag-label">Target Species:</span>
                <span className="species-list">{pfz.speciesLikely.join(', ')}</span>
              </div>

              <div className="pfz-card-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanRouteToPfz(pfz);
                    soundFX.playSonarPing();
                  }}
                  className="btn-card-plan-route"
                >
                  <NavigationIcon size={14} />
                  <span>Plot Route to this PFZ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
