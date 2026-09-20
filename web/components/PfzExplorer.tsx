'use client';

import React, { useState, useMemo } from 'react';
import { 
  FishIcon, 
  CompassIcon, 
  NavigationIcon, 
  ActivityIcon, 
  CheckCircleIcon,
  LayersIcon,
  WavesIcon,
  SparklesIcon,
  RadarIcon,
  ShieldIcon
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'catchScore' | 'distance' | 'sst' | 'depth'>('catchScore');
  const [inspectModalPfz, setInspectModalPfz] = useState<PFZNode | null>(null);

  // Extract unique sectors
  const uniqueSectors = useMemo(() => {
    const set = new Set<string>();
    PFZ_ZONES.forEach((z) => set.add(z.sector.split('(')[0].trim()));
    return Array.from(set);
  }, []);

  // Filter and sort PFZs
  const filteredPfzs = useMemo(() => {
    return PFZ_ZONES.filter((pfz) => {
      const matchSearch =
        pfz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pfz.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pfz.speciesLikely.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchSector = sectorFilter === 'ALL' || pfz.sector.includes(sectorFilter);
      return matchSearch && matchSector;
    }).sort((a, b) => {
      if (sortBy === 'catchScore') return b.catchScore - a.catchScore;
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'sst') return a.sstCelsius - b.sstCelsius;
      if (sortBy === 'depth') return a.depthM - b.depthM;
      return 0;
    });
  }, [searchQuery, sectorFilter, sortBy]);

  return (
    <div className="pfz-explorer-container">
      {/* Header */}
      <div className="pfz-header">
        <div className="pfz-title-group">
          <FishIcon size={24} className="pfz-icon-glow" />
          <div>
            <h2 className="pfz-title">INCOIS Potential Fishing Zones (PFZ) Hub</h2>
            <p className="pfz-subtitle">
              Satellite Thermal Fronts (Oceansat-3 & MODIS) • Chlorophyll-a Density • Multi-Criteria Catch Ranking
            </p>
          </div>
        </div>

        <div className="pfz-header-stats">
          <span className="stat-badge">
            <strong>{filteredPfzs.length}</strong> ACTIVE SECTORS
          </span>
          <span className="stat-badge live">
            <ActivityIcon size={12} />
            <span>INCOIS SYNCED</span>
          </span>
        </div>
      </div>

      {/* Control Toolbar: Search, Sector Filter & Sort */}
      <div className="pfz-toolbar-deck">
        <div className="pfz-search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search PFZ by zone, target species (e.g. Tuna, Mackerel), or sector..."
            className="pfz-search-input"
          />
        </div>

        <div className="pfz-filter-controls">
          <div className="filter-item">
            <span className="filter-label">Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value);
                soundFX.playBlip(800);
              }}
              className="pfz-select"
            >
              <option value="ALL">All Coastal Sectors ({PFZ_ZONES.length})</option>
              {uniqueSectors.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                soundFX.playBlip(800);
              }}
              className="pfz-select"
            >
              <option value="catchScore">🎯 Highest Catch Probability</option>
              <option value="distance">📍 Shortest Distance from Port</option>
              <option value="depth">⚓ Shallowest Depth</option>
              <option value="sst">🌡️ Sea Surface Temp (SST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of PFZ Advisory Cards */}
      <div className="pfz-cards-grid">
        {filteredPfzs.map((pfz) => {
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
                    setInspectModalPfz(pfz);
                    soundFX.playBlip(920);
                  }}
                  className="btn-inspect-pfz"
                >
                  <SparklesIcon size={14} />
                  <span>Inspect Scientific Provenance</span>
                </button>

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

      {/* PFZ Detail Scientific Provenance Modal */}
      {inspectModalPfz && (
        <div className="connector-modal-overlay" onClick={() => setInspectModalPfz(null)}>
          <div className="connector-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-tag">{inspectModalPfz.sector}</span>
                <h3 className="modal-title">{inspectModalPfz.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalPfz(null)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-pfz-grid">
                <div className="modal-stat-card">
                  <span className="m-label">Catch Probability Score</span>
                  <strong className="m-val text-green">{inspectModalPfz.catchScore}% (High Pelagic Aggregation)</strong>
                </div>
                <div className="modal-stat-card">
                  <span className="m-label">Distance & Bearing</span>
                  <strong className="m-val">{inspectModalPfz.distanceKm} km @ {inspectModalPfz.bearingDeg}° Bearing</strong>
                </div>
                <div className="modal-stat-card">
                  <span className="m-label">SST Thermal Gradient</span>
                  <strong className="m-val">{inspectModalPfz.sstCelsius}°C (Front Gradient: ±0.8°C/km)</strong>
                </div>
                <div className="modal-stat-card">
                  <span className="m-label">Chlorophyll-a Biomass</span>
                  <strong className="m-val">{inspectModalPfz.chlorophyllMgM3} mg/m³ (Optimum Phytoplankton)</strong>
                </div>
              </div>

              <div className="modal-provenance-info">
                <h4>📡 Scientific Satellite Feeds & Sensor Provenance:</h4>
                <ul>
                  <li><strong>Data Provider:</strong> {inspectModalPfz.source}</li>
                  <li><strong>Sensors:</strong> Oceansat-3 OCM-3, NOAA AVHRR, MODIS-Aqua</li>
                  <li><strong>Advisory Timestamp:</strong> {new Date(inspectModalPfz.issuedAt).toLocaleString('en-IN')}</li>
                  <li><strong>Advisory Validity:</strong> Until {new Date(inspectModalPfz.validTo).toLocaleString('en-IN')}</li>
                  <li><strong>Species Schooling:</strong> {inspectModalPfz.speciesLikely.join(', ')}</li>
                </ul>
              </div>

              <div className="modal-actions-tray">
                <button
                  type="button"
                  onClick={() => {
                    const pfz = inspectModalPfz;
                    setInspectModalPfz(null);
                    onPlanRouteToPfz(pfz);
                  }}
                  className="btn-modal-plan-route"
                >
                  <NavigationIcon size={16} />
                  <span>Compute A* Safe Route to this PFZ Ground →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

