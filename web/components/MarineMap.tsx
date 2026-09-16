'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RadarIcon, 
  LayersIcon, 
  CompassIcon, 
  PlayIcon, 
  PauseIcon, 
  RefreshCwIcon, 
  ShieldAlertIcon, 
  FishIcon, 
  MapPinIcon,
  NavigationIcon,
  InfoIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { 
  PORTS, 
  PFZ_ZONES, 
  GEOFENCE_ZONES, 
  PFZNode, 
  GeofenceZone, 
  VesselProfile 
} from '../lib/marineData';

interface MarineMapProps {
  vesselPos: { lat: number; lng: number };
  onUpdateVesselPos: (pos: { lat: number; lng: number }) => void;
  selectedPfz: PFZNode | null;
  onSelectPfz: (pfz: PFZNode) => void;
  selectedVessel: VesselProfile;
  nearestImblDistanceKm: number;
  activeRoute: {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    waypoints: { lat: number; lng: number; step: string; waveM: number; windKts: number }[];
    totalDistanceKm: number;
    etaMinutes: number;
    riskScore: number;
  } | null;
}

export function MarineMap({
  vesselPos,
  onUpdateVesselPos,
  selectedPfz,
  onSelectPfz,
  selectedVessel,
  nearestImblDistanceKm,
  activeRoute,
}: MarineMapProps) {
  // Map View Bounds: India Subcontinent Marine Region
  // Lat: 6 to 24 (18 deg), Lng: 67 to 90 (23 deg)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 11.5, lng: 77.8 });
  const [isSimulatingCruise, setIsSimulatingCruise] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Layer Visibility
  const [showPfz, setShowPfz] = useState<boolean>(true);
  const [showImbl, setShowImbl] = useState<boolean>(true);
  const [showMpa, setShowMpa] = useState<boolean>(true);
  const [showWeatherCones, setShowWeatherCones] = useState<boolean>(true);
  const [showWavesVector, setShowWavesVector] = useState<boolean>(true);
  const [showRadarSweep, setShowRadarSweep] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Convert GPS Coordinates (lat, lng) to SVG / Canvas Map Viewbox (0 to 1000 width, 0 to 750 height)
  const minLat = 6.0;
  const maxLat = 24.0;
  const minLng = 67.0;
  const maxLng = 90.0;

  const geoToMapCoords = useCallback((lat: number, lng: number) => {
    // Mercator-like normalized coordinates
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 750;
    return { x, y };
  }, []);

  const mapCoordsToGeo = useCallback((x: number, y: number) => {
    const lng = minLng + (x / 1000) * (maxLng - minLng);
    const lat = maxLat - (y / 750) * (maxLat - minLat);
    return { lat, lng };
  }, []);

  // Handle Canvas Drawing for Waves & Radar Sweep Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let waveOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Wave & Wind Flow Vectors
      if (showWavesVector) {
        ctx.strokeStyle = 'rgba(61, 214, 198, 0.18)';
        ctx.lineWidth = 1.2;
        const gridStep = 45;
        waveOffset += 0.04;

        for (let x = 40; x < canvas.width; x += gridStep) {
          for (let y = 40; y < canvas.height; y += gridStep) {
            // Mask out deep land regions approximately
            if (x > 320 && x < 800 && y < 480 && !(x < 420 && y > 380)) {
              // rough land area
              continue;
            }

            const currentAngle = Math.sin(x * 0.01 + waveOffset) * 0.4 + 0.8; // SW Monsoon vector
            const length = 12 + Math.sin(y * 0.02 + waveOffset) * 4;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
              x + Math.cos(currentAngle) * length,
              y + Math.sin(currentAngle) * length
            );
            ctx.stroke();

            // Arrow tip
            ctx.fillStyle = 'rgba(61, 214, 198, 0.35)';
            ctx.beginPath();
            ctx.arc(
              x + Math.cos(currentAngle) * length,
              y + Math.sin(currentAngle) * length,
              1.2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }

      // 2. Draw Radar Scanner Sweep from Boat Position
      if (showRadarSweep) {
        const boatMapPos = geoToMapCoords(vesselPos.lat, vesselPos.lng);
        const radius = 180;
        angle += 0.035;

        // Radar Cone
        const gradient = ctx.createRadialGradient(
          boatMapPos.x, boatMapPos.y, 0,
          boatMapPos.x, boatMapPos.y, radius
        );
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        gradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.08)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(boatMapPos.x, boatMapPos.y);
        ctx.arc(boatMapPos.x, boatMapPos.y, radius, angle - 0.45, angle);
        ctx.closePath();
        ctx.fill();

        // Sweep Line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(boatMapPos.x, boatMapPos.y);
        ctx.lineTo(
          boatMapPos.x + Math.cos(angle) * radius,
          boatMapPos.y + Math.sin(angle) * radius
        );
        ctx.stroke();

        // Concentric Range Rings around vessel
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        [60, 120, 180].forEach(r => {
          ctx.beginPath();
          ctx.arc(boatMapPos.x, boatMapPos.y, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showWavesVector, showRadarSweep, vesselPos, geoToMapCoords]);

  // Autopilot Cruise Simulation Loop
  useEffect(() => {
    if (!isSimulatingCruise || !activeRoute || activeRoute.waypoints.length === 0) return;

    const interval = setInterval(() => {
      setSimStep((prev) => {
        const next = (prev + 1) % activeRoute.waypoints.length;
        const pt = activeRoute.waypoints[next];
        onUpdateVesselPos({ lat: pt.lat, lng: pt.lng });
        
        // Audio ping
        if (next % 3 === 0) soundFX.playSonarPing();
        
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulatingCruise, activeRoute, onUpdateVesselPos]);

  // Map Click to Relocate Vessel
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 1000;
    const svgY = ((e.clientY - rect.top) / rect.height) * 750;

    const geo = mapCoordsToGeo(svgX, svgY);
    onUpdateVesselPos({
      lat: Number(geo.lat.toFixed(4)),
      lng: Number(geo.lng.toFixed(4)),
    });
    soundFX.playBlip(1020);
  };

  const boatCoords = geoToMapCoords(vesselPos.lat, vesselPos.lng);

  return (
    <div className="tactical-map-container">
      {/* Map Control Overlay Bar */}
      <div className="map-toolbar">
        <div className="layer-pill-group">
          <button
            type="button"
            onClick={() => { setShowPfz(!showPfz); soundFX.playBlip(700); }}
            className={`layer-chip ${showPfz ? 'active-pfz' : ''}`}
          >
            <FishIcon size={14} />
            <span>INCOIS PFZ</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowImbl(!showImbl); soundFX.playBlip(700); }}
            className={`layer-chip ${showImbl ? 'active-imbl' : ''}`}
          >
            <ShieldAlertIcon size={14} />
            <span>IMBL Boundary (5km Buffer)</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowMpa(!showMpa); soundFX.playBlip(700); }}
            className={`layer-chip ${showMpa ? 'active-mpa' : ''}`}
          >
            <LayersIcon size={14} />
            <span>MPA & Coral Reefs</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowWeatherCones(!showWeatherCones); soundFX.playBlip(700); }}
            className={`layer-chip ${showWeatherCones ? 'active-hazard' : ''}`}
          >
            <InfoIcon size={14} />
            <span>IMD Cyclone Cones</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowWavesVector(!showWavesVector); soundFX.playBlip(700); }}
            className={`layer-chip ${showWavesVector ? 'active-waves' : ''}`}
          >
            <span>🌊 OSF Wave Currents</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowRadarSweep(!showRadarSweep); soundFX.playBlip(700); }}
            className={`layer-chip ${showRadarSweep ? 'active-radar' : ''}`}
          >
            <RadarIcon size={14} />
            <span>Tactical Radar</span>
          </button>
        </div>

        {/* Cruise Simulation & Teleport Helper */}
        <div className="map-actions-group">
          <button
            type="button"
            onClick={() => {
              setIsSimulatingCruise(!isSimulatingCruise);
              soundFX.playBlip(isSimulatingCruise ? 500 : 950);
            }}
            className={`btn-cruise-sim ${isSimulatingCruise ? 'sim-active' : ''}`}
          >
            {isSimulatingCruise ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
            <span>{isSimulatingCruise ? 'PAUSE CRUISE' : 'SIMULATE CRUISE'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Reset to Kochi
              onUpdateVesselPos({ lat: 9.96, lng: 76.24 });
              soundFX.playSonarPing();
            }}
            className="btn-recenter"
            title="Recenter boat to Home Port (Kochi)"
          >
            <CompassIcon size={14} />
            <span>Recenter Home</span>
          </button>
        </div>
      </div>

      {/* Main Map Canvas + SVG Container */}
      <div className="marine-map-canvas-wrapper">
        {/* Animated Flow & Radar Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={750}
          className="marine-canvas-layer"
        />

        {/* Vector SVG Geospatial Overlays */}
        <svg
          viewBox="0 0 1000 750"
          className="marine-svg-layer"
          onClick={handleMapClick}
        >
          <defs>
            {/* Gradients */}
            <radialGradient id="pfzGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#dc2626" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3dd6c6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Vessel Marker Pattern */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Indian Subcontinent Landmass SVG Path */}
          <path
            d="M 120,50 L 160,80 L 130,140 L 95,210 L 130,280 L 195,330 L 220,380 L 270,420 L 320,470 L 360,530 L 410,590 L 430,640 L 450,670 L 455,675 L 470,660 L 510,610 L 560,530 L 610,460 L 670,390 L 740,330 L 810,270 L 860,200 L 920,120 L 980,80 L 990,10 L 120,10 Z"
            className="landmass-path"
          />

          {/* Sri Lanka Landmass */}
          <path
            d="M 505,620 C 530,620 545,645 540,675 C 530,705 500,715 485,690 C 475,665 485,625 505,620 Z"
            className="landmass-path srilanka"
          />

          {/* Lakshadweep Archipelago */}
          <g className="island-group">
            <circle cx="340" cy="580" r="3.5" fill="#334155" />
            <circle cx="348" cy="605" r="4.0" fill="#334155" />
            <circle cx="355" cy="635" r="3.0" fill="#334155" />
            <circle cx="360" cy="660" r="3.5" fill="#334155" />
            <text x="310" y="630" className="map-label-subtle">Lakshadweep</text>
          </g>

          {/* Andaman & Nicobar Archipelago */}
          <g className="island-group">
            <circle cx="890" cy="460" r="4" fill="#334155" />
            <circle cx="895" cy="495" r="4.5" fill="#334155" />
            <circle cx="905" cy="540" r="4" fill="#334155" />
            <circle cx="920" cy="610" r="3.5" fill="#334155" />
            <text x="830" y="520" className="map-label-subtle">Andaman & Nicobar</text>
          </g>

          {/* Major Sea Labels */}
          <text x="210" y="490" className="map-sea-label">ARABIAN SEA</text>
          <text x="710" y="470" className="map-sea-label">BAY OF BENGAL</text>
          <text x="430" y="730" className="map-sea-label">INDIAN OCEAN</text>

          {/* 2. Major Ports */}
          {PORTS.map((port) => {
            const p = geoToMapCoords(port.lat, port.lng);
            return (
              <g key={port.id} className="port-marker-group">
                <circle cx={p.x} cy={p.y} r="5" className="port-dot" />
                <circle cx={p.x} cy={p.y} r="8" className="port-dot-pulse" />
                <text x={p.x + 8} y={p.y + 3} className="port-label">
                  {port.name.split('(')[0].trim()}
                </text>
              </g>
            );
          })}

          {/* 3. Geofence Zones (IMBL, MPA, Hazard Cones) */}
          {GEOFENCE_ZONES.map((zone) => {
            if (zone.type === 'IMBL' && !showImbl) return null;
            if (zone.type === 'MPA' && !showMpa) return null;
            if (zone.type === 'RESTRICTED' && !showMpa) return null;
            if (zone.type === 'CYCLONE_WARNING' && !showWeatherCones) return null;

            const polyPoints = zone.points.map(pt => {
              const c = geoToMapCoords(pt.lat, pt.lng);
              return `${c.x},${c.y}`;
            }).join(' ');

            if (zone.type === 'IMBL') {
              // Draw IMBL Line + Buffer corridor
              return (
                <g key={zone.id} className="geofence-imbl-group">
                  {/* Caution Corridor Buffer (5km) */}
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="18"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Strict Line */}
                  <polyline
                    points={polyPoints}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.8"
                    strokeDasharray="8 4"
                    className="imbl-stroke"
                  />
                  {zone.points.length > 0 && (
                    <text
                      x={geoToMapCoords(zone.points[1].lat, zone.points[1].lng).x + 12}
                      y={geoToMapCoords(zone.points[1].lat, zone.points[1].lng).y}
                      className="imbl-warning-text"
                    >
                      🛑 {zone.name.split('(')[0]} (5km Buffer)
                    </text>
                  )}
                </g>
              );
            }

            return (
              <g key={zone.id} className="geofence-polygon-group">
                <polygon
                  points={polyPoints}
                  fill={zone.color}
                  fillOpacity={zone.type === 'CYCLONE_WARNING' ? '0.22' : '0.15'}
                  stroke={zone.color}
                  strokeWidth="2"
                  strokeDasharray={zone.type === 'RESTRICTED' ? '6 3' : undefined}
                />
                <text
                  x={geoToMapCoords(zone.points[0].lat, zone.points[0].lng).x + 8}
                  y={geoToMapCoords(zone.points[0].lat, zone.points[0].lng).y + 14}
                  className="zone-label-text"
                  fill={zone.color}
                >
                  {zone.name.split('(')[0]}
                </text>
              </g>
            );
          })}

          {/* 4. Active Navigation Route (A*) */}
          {showRoute && activeRoute && (
            <g className="route-layer-group">
              {/* Waypoint Path */}
              <polyline
                points={activeRoute.waypoints.map(w => {
                  const c = geoToMapCoords(w.lat, w.lng);
                  return `${c.x},${c.y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animated-route-line"
              />

              {/* Waypoints */}
              {activeRoute.waypoints.map((w, idx) => {
                const c = geoToMapCoords(w.lat, w.lng);
                return (
                  <g key={idx} className="waypoint-node">
                    <circle cx={c.x} cy={c.y} r="4" fill="#3dd6c6" stroke="#071018" strokeWidth="2" />
                    {idx > 0 && idx < activeRoute.waypoints.length - 1 && (
                      <text x={c.x + 6} y={c.y - 6} className="waypoint-label">
                        WP{idx} ({w.waveM}m)
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* 5. PFZ Hotspots */}
          {showPfz && PFZ_ZONES.map((pfz) => {
            const c = geoToMapCoords(pfz.lat, pfz.lng);
            const isSelected = selectedPfz?.id === pfz.id;
            return (
              <g
                key={pfz.id}
                className="pfz-hotspot-group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPfz(pfz);
                  soundFX.playBlip(1100);
                }}
                onMouseEnter={() => setHoveredEntity(pfz.id)}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                {/* Glowing Thermal Circle */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? 26 : 18}
                  fill="url(#pfzGlow)"
                  className="pfz-glow-circle"
                />

                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? 9 : 6}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Fish Icon / Label */}
                <text
                  x={c.x + 12}
                  y={c.y + 4}
                  className={`pfz-node-label ${isSelected ? 'selected' : ''}`}
                >
                  🐟 {pfz.name.split(' ')[0]} ({pfz.catchScore}%)
                </text>
              </g>
            );
          })}

          {/* 6. Live Vessel Marker */}
          <g
            className="vessel-marker-group"
            transform={`translate(${boatCoords.x}, ${boatCoords.y})`}
            filter="url(#glowFilter)"
          >
            {/* Pulsing ring */}
            <circle cx="0" cy="0" r="16" className="vessel-ping-ring" />
            <circle cx="0" cy="0" r="8" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />

            {/* Boat Heading Triangle */}
            <polygon points="0,-14 6,4 0,0 -6,4" fill="#38bdf8" />

            {/* Vessel Label */}
            <text x="12" y="4" className="vessel-map-label">
              ⛵ {selectedVessel.name.split(' ')[1]} ({selectedVessel.cruisingSpeedKnots} kts)
            </text>
          </g>
        </svg>

        {/* Map Legend Overlay */}
        <div className="map-tactical-hud">
          <div className="hud-metric">
            <span className="hud-label">BOAT POSITION:</span>
            <span className="hud-val">{vesselPos.lat.toFixed(4)}°N, {vesselPos.lng.toFixed(4)}°E</span>
          </div>

          <div className="hud-metric">
            <span className="hud-label">NEAREST IMBL:</span>
            <span className={`hud-val ${nearestImblDistanceKm <= 5 ? 'danger-val' : 'safe-val'}`}>
              {nearestImblDistanceKm.toFixed(1)} KM {nearestImblDistanceKm <= 5 ? '(CAUTION!)' : '(SAFE)'}
            </span>
          </div>

          {selectedPfz && (
            <div className="hud-metric">
              <span className="hud-label">LOCKED PFZ:</span>
              <span className="hud-val pfz-val">{selectedPfz.name.split(' ')[0]} ({selectedPfz.distanceKm} km @ {selectedPfz.bearingDeg}°)</span>
            </div>
          )}

          <div className="hud-metric">
            <span className="hud-label">WAVE / WIND:</span>
            <span className="hud-val">1.6m Hs / 14 kts (Within {selectedVessel.maxWaveHeightM}m limit)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
