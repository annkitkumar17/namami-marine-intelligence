'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Map as MapLibreMap, Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  RadarIcon, 
  LayersIcon, 
  CompassIcon, 
  PlayIcon, 
  PauseIcon, 
  ShieldAlertIcon, 
  FishIcon, 
  MapPinIcon,
  NavigationIcon,
  InfoIcon,
  ActivityIcon,
  SparklesIcon,
  Volume2Icon,
  RefreshCwIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { 
  PORTS, 
  PFZ_ZONES, 
  GEOFENCE_ZONES, 
  PFZNode, 
  VesselProfile,
  getPfzZonesAroundLocation 
} from '../lib/marineData';

interface MarineMapLibreProps {
  vesselPos: { lat: number; lng: number };
  onUpdateVesselPos: (pos: { lat: number; lng: number }, name?: string) => void;
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
  onSelectDestination?: (dest: { lat: number; lng: number; name: string }) => void;
  selectedPortId?: string;
  onSelectPort?: (portId: string) => void;
  isGpsLocating?: boolean;
  onDetectGpsLocation?: () => void;
  locationLabel?: string;
}

// Guaranteed High-Performance Raster Basemap Styles (Zero CORS, 100% Instant Load)
const BASEMAP_STYLES = [
  {
    id: 'dark-matter',
    name: 'Tactical Dark',
    icon: '🛰️',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  {
    id: 'satellite',
    name: 'Satellite Ocean',
    icon: '🌍',
    style: {
      version: 8,
      sources: {
        'esri-imagery': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'esri-imagery-layer',
          type: 'raster',
          source: 'esri-imagery'
        }
      ]
    }
  },
  {
    id: 'positron',
    name: 'Nautical Light',
    icon: '🗺️',
    style: {
      version: 8,
      sources: {
        'carto-light': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }
      },
      layers: [
        {
          id: 'carto-light-layer',
          type: 'raster',
          source: 'carto-light',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  {
    id: 'osm-standard',
    name: 'OpenSea Standard',
    icon: '⚓',
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles'
        }
      ]
    }
  }
];

export function MarineMapLibre({
  vesselPos,
  onUpdateVesselPos,
  selectedPfz,
  onSelectPfz,
  selectedVessel,
  nearestImblDistanceKm,
  activeRoute,
  onSelectDestination,
  selectedPortId,
  onSelectPort,
  isGpsLocating,
  onDetectGpsLocation,
  locationLabel
}: MarineMapLibreProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const vesselMarkerRef = useRef<Marker | null>(null);
  const pfzMarkersRef = useRef<Marker[]>([]);
  const portMarkersRef = useRef<Marker[]>([]);

  // Map state
  const [selectedBasemap, setSelectedBasemap] = useState<string>('dark-matter');
  const [isSimulatingCruise, setIsSimulatingCruise] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Layer Toggles
  const [showPfz, setShowPfz] = useState<boolean>(true);
  const [showImbl, setShowImbl] = useState<boolean>(true);
  const [showMpa, setShowMpa] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [showPorts, setShowPorts] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);

  // Dynamic PFZs around current position
  const regionalPfzs = getPfzZonesAroundLocation(vesselPos.lat, vesselPos.lng);

  const onUpdateVesselPosRef = useRef(onUpdateVesselPos);
  onUpdateVesselPosRef.current = onUpdateVesselPos;
  const vesselPosInitRef = useRef(vesselPos);

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const basemapConfig = BASEMAP_STYLES.find(b => b.id === selectedBasemap) || BASEMAP_STYLES[0];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapConfig.style as any,
      center: [vesselPosInitRef.current.lng, vesselPosInitRef.current.lat],
      zoom: 7.2,
      pitch: 25,
      bearing: 0,
      attributionControl: false
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new FullscreenControl(), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      map.resize();
      renderGeoJsonLayers(map);
    });

    // Resize observer to ensure full container fit
    const resizeTimer = setTimeout(() => {
      if (map) map.resize();
    }, 400);

    // Map Click Handler: Teleport Vessel / Select Location
    map.on('click', (e: any) => {
      const { lng, lat } = e.lngLat;
      const roundedLat = Number(lat.toFixed(4));
      const roundedLng = Number(lng.toFixed(4));

      onUpdateVesselPosRef.current({ lat: roundedLat, lng: roundedLng }, `Custom Point (${roundedLat}°N, ${roundedLng}°E)`);
      soundFX.playBlip(1020);
    });

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBasemap]);

  // Handle Fly-To when vessel position changes externally (e.g. GPS or Port change)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [vesselPos.lng, vesselPos.lat],
      duration: 1000
    });
  }, [vesselPos.lat, vesselPos.lng]);

  // Render Vector GeoJSON Layers (IMBL boundary, MPAs, A* route)
  const renderGeoJsonLayers = (map: MapLibreMap) => {
    if (!map.isStyleLoaded()) return;

    // 1. IMBL Boundary Line & 5km Buffer Polygon
    const imblZones = GEOFENCE_ZONES.filter(z => z.type === 'IMBL');
    if (imblZones.length > 0) {
      const imblFeatures = imblZones.map(z => ({
        type: 'Feature' as const,
        properties: { name: z.name, id: z.id },
        geometry: {
          type: 'LineString' as const,
          coordinates: z.points.map(p => [p.lng, p.lat])
        }
      }));

      if (!map.getSource('imbl-source')) {
        map.addSource('imbl-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: imblFeatures
          }
        });

        // IMBL Buffer Glow / Caution Corridor
        map.addLayer({
          id: 'imbl-buffer-layer',
          type: 'line',
          source: 'imbl-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#f59e0b',
            'line-width': 18,
            'line-opacity': 0.35
          }
        });

        // Strict IMBL Line
        map.addLayer({
          id: 'imbl-line-layer',
          type: 'line',
          source: 'imbl-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ef4444',
            'line-width': 3.5,
            'line-dasharray': [3, 2]
          }
        });
      }
    }

    // 2. Marine Protected Areas (MPA) Polygons
    const mpaZones = GEOFENCE_ZONES.filter(z => z.type === 'MPA' || z.type === 'RESTRICTED');
    if (mpaZones.length > 0) {
      const mpaFeatures = mpaZones.map(z => ({
        type: 'Feature' as const,
        properties: { name: z.name, color: z.color, restrictions: z.restrictions },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [z.points.map(p => [p.lng, p.lat])]
        }
      }));

      if (!map.getSource('mpa-source')) {
        map.addSource('mpa-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: mpaFeatures
          }
        });

        map.addLayer({
          id: 'mpa-fill-layer',
          type: 'fill',
          source: 'mpa-source',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.22
          }
        });

        map.addLayer({
          id: 'mpa-line-layer',
          type: 'line',
          source: 'mpa-source',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }
    }

    // 3. A* Navigation Route
    if (activeRoute && activeRoute.waypoints.length > 1) {
      const routeGeoJson = {
        type: 'Feature' as const,
        properties: { distanceKm: activeRoute.totalDistanceKm },
        geometry: {
          type: 'LineString' as const,
          coordinates: activeRoute.waypoints.map(w => [w.lng, w.lat])
        }
      };

      if (!map.getSource('route-source')) {
        map.addSource('route-source', {
          type: 'geojson',
          data: routeGeoJson
        });

        map.addLayer({
          id: 'route-glow-layer',
          type: 'line',
          source: 'route-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#0d9488',
            'line-width': 8,
            'line-opacity': 0.4
          }
        });

        map.addLayer({
          id: 'route-line-layer',
          type: 'line',
          source: 'route-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#0284c7',
            'line-width': 3.5
          }
        });
      } else {
        const src: any = map.getSource('route-source');
        src.setData(routeGeoJson);
      }
    }
  };

  // Sync Layer Visibility on MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('imbl-line-layer')) {
      map.setLayoutProperty('imbl-line-layer', 'visibility', showImbl ? 'visible' : 'none');
    }
    if (map.getLayer('imbl-buffer-layer')) {
      map.setLayoutProperty('imbl-buffer-layer', 'visibility', showImbl ? 'visible' : 'none');
    }
    if (map.getLayer('mpa-fill-layer')) {
      map.setLayoutProperty('mpa-fill-layer', 'visibility', showMpa ? 'visible' : 'none');
    }
    if (map.getLayer('mpa-line-layer')) {
      map.setLayoutProperty('mpa-line-layer', 'visibility', showMpa ? 'visible' : 'none');
    }
    if (map.getLayer('route-line-layer')) {
      map.setLayoutProperty('route-line-layer', 'visibility', showRoute ? 'visible' : 'none');
    }
    if (map.getLayer('route-glow-layer')) {
      map.setLayoutProperty('route-glow-layer', 'visibility', showRoute ? 'visible' : 'none');
    }
  }, [showImbl, showMpa, showRoute, mapLoaded]);

  // Manage Vessel Marker (Draggable, Pulse, Telemetry Popup)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!vesselMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'maplibre-vessel-marker';
      el.innerHTML = `
        <div class="vessel-ping-radar ${showRadar ? 'radar-active' : ''}"></div>
        <div class="vessel-boat-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
          </svg>
        </div>
        <div class="vessel-tag-chip">
          ⛵ ${selectedVessel.name.split(' ')[1]} (${selectedVessel.cruisingSpeedKnots} kts)
        </div>
      `;

      const popup = new Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="maplibre-popup-content vessel-popup">
          <div class="popup-title">⛵ ${selectedVessel.name}</div>
          <div class="popup-meta">Status: <strong>Active Telemetry</strong></div>
          <div class="popup-meta">Position: <strong>${vesselPos.lat.toFixed(4)}°N, ${vesselPos.lng.toFixed(4)}°E</strong></div>
          <div class="popup-meta">Max Wave Safety: <strong>${selectedVessel.maxWaveHeightM}m</strong></div>
          <div class="popup-hint">Drag marker or click anywhere to move position</div>
        </div>
      `);

      const marker = new Marker({ element: el, draggable: true })
        .setLngLat([vesselPos.lng, vesselPos.lat])
        .setPopup(popup)
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onUpdateVesselPos(
          { lat: Number(lngLat.lat.toFixed(4)), lng: Number(lngLat.lng.toFixed(4)) },
          `Relocated Point (${lngLat.lat.toFixed(2)}°N, ${lngLat.lng.toFixed(2)}°E)`
        );
        soundFX.playBlip(1040);
      });

      vesselMarkerRef.current = marker;
    } else {
      vesselMarkerRef.current.setLngLat([vesselPos.lng, vesselPos.lat]);
    }
  }, [vesselPos, selectedVessel, showRadar, onUpdateVesselPos]);

  // Manage Dynamic PFZ Zone Markers around current location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    pfzMarkersRef.current.forEach(m => m.remove());
    pfzMarkersRef.current = [];

    if (!showPfz) return;

    regionalPfzs.forEach((pfz) => {
      const isSelected = selectedPfz?.id === pfz.id;
      const el = document.createElement('div');
      el.className = `maplibre-pfz-marker ${isSelected ? 'pfz-selected' : ''}`;
      el.innerHTML = `
        <div class="pfz-thermal-glow"></div>
        <div class="pfz-core-dot">
          <span>🐟</span>
        </div>
        <div class="pfz-label-tag">
          ${pfz.name.split(' ')[0]} (${pfz.catchScore}%)
        </div>
      `;

      const popup = new Popup({ offset: 20 }).setHTML(`
        <div class="maplibre-popup-content pfz-popup">
          <div class="popup-badge pfz-badge">INCOIS PFZ ADVISORY</div>
          <div class="popup-title">${pfz.name}</div>
          <div class="popup-stats-grid">
            <div class="stat-box">
              <span class="stat-label">Catch Yield</span>
              <span class="stat-val score">${pfz.catchScore}%</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Distance</span>
              <span class="stat-val">${pfz.distanceKm} km</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">SST Water</span>
              <span class="stat-val">${pfz.sstCelsius}°C</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Bearing</span>
              <span class="stat-val">${pfz.bearingDeg}°</span>
            </div>
          </div>
          <div class="popup-species">
            <strong>Target Species:</strong> ${pfz.speciesLikely.join(', ')}
          </div>
          <button class="popup-btn-nav" id="btn-lock-pfz-${pfz.id}">
            🧭 Set Route to this PFZ
          </button>
        </div>
      `);

      popup.on('open', () => {
        const btn = document.getElementById(`btn-lock-pfz-${pfz.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectPfz(pfz);
            if (onSelectDestination) {
              onSelectDestination({ lat: pfz.lat, lng: pfz.lng, name: pfz.name });
            }
            soundFX.playSonarPing();
          };
        }
      });

      const marker = new Marker({ element: el })
        .setLngLat([pfz.lng, pfz.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        onSelectPfz(pfz);
        soundFX.playBlip(1100);
      });

      pfzMarkersRef.current.push(marker);
    });
  }, [showPfz, selectedPfz, regionalPfzs, onSelectPfz, onSelectDestination]);

  // Manage Port Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    portMarkersRef.current.forEach(m => m.remove());
    portMarkersRef.current = [];

    if (!showPorts) return;

    PORTS.forEach((port) => {
      const isSelected = selectedPortId === port.id;
      const el = document.createElement('div');
      el.className = `maplibre-port-marker ${isSelected ? 'port-active' : ''}`;
      el.innerHTML = `
        <div class="port-icon-anchor">⚓</div>
        <div class="port-name-label">${port.name.split('(')[0].trim()}</div>
      `;

      const popup = new Popup({ offset: 15 }).setHTML(`
        <div class="maplibre-popup-content port-popup">
          <div class="popup-badge port-badge">INDIAN HARBOR</div>
          <div class="popup-title">${port.name}</div>
          <div class="popup-meta">State: <strong>${port.state}</strong> • Depth: <strong>${port.depthM}m</strong></div>
          <div class="popup-meta">VHF: <strong>CH 16 / 12</strong></div>
          <button class="popup-btn-nav" id="btn-port-teleport-${port.id}">
            ⛵ Move Location to ${port.name.split('(')[0]}
          </button>
        </div>
      `);

      popup.on('open', () => {
        const btn = document.getElementById(`btn-port-teleport-${port.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectPort) onSelectPort(port.id);
            onUpdateVesselPos({ lat: port.lat, lng: port.lng }, port.name);
            soundFX.playSonarPing();
            map.flyTo({ center: [port.lng, port.lat], zoom: 8.5, speed: 1.2 });
          };
        }
      });

      const marker = new Marker({ element: el })
        .setLngLat([port.lng, port.lat])
        .setPopup(popup)
        .addTo(map);

      portMarkersRef.current.push(marker);
    });
  }, [showPorts, selectedPortId, onSelectPort, onUpdateVesselPos]);

  // Autopilot Cruise Simulation Loop along Route
  useEffect(() => {
    if (!isSimulatingCruise || !activeRoute || activeRoute.waypoints.length === 0) return;

    const interval = setInterval(() => {
      setSimStep((prev) => {
        const next = (prev + 1) % activeRoute.waypoints.length;
        const pt = activeRoute.waypoints[next];
        onUpdateVesselPos({ lat: pt.lat, lng: pt.lng }, `Waypoint ${next}: ${pt.step}`);
        
        if (mapRef.current) {
          mapRef.current.easeTo({
            center: [pt.lng, pt.lat],
            duration: 1200
          });
        }

        if (next % 2 === 0) soundFX.playSonarPing();
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isSimulatingCruise, activeRoute, onUpdateVesselPos]);

  return (
    <div className="tactical-maplibre-container">
      {/* 1. Tactical Map Header Toolbar */}
      <div className="maplibre-toolbar">
        {/* Location & GPS Quick Controls */}
        <div className="map-toolbar-primary-group">
          {/* GPS Live Location Detect Button */}
          {onDetectGpsLocation && (
            <button
              type="button"
              onClick={onDetectGpsLocation}
              disabled={isGpsLocating}
              className={`btn-toolbar-gps ${isGpsLocating ? 'locating' : ''}`}
              title="Detect your live browser GPS location"
            >
              <MapPinIcon size={14} />
              <span>{isGpsLocating ? 'Detecting GPS...' : '📍 Use Live Location'}</span>
            </button>
          )}

          {/* Port Dropdown Quick Selector */}
          <div className="port-selector-dropdown-wrapper">
            <span className="selector-icon">⚓</span>
            <select
              value={selectedPortId || ''}
              onChange={(e) => {
                const port = PORTS.find(p => p.id === e.target.value);
                if (port) {
                  if (onSelectPort) onSelectPort(port.id);
                  onUpdateVesselPos({ lat: port.lat, lng: port.lng }, port.name);
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [port.lng, port.lat], zoom: 8.5, speed: 1.2 });
                  }
                  soundFX.playSonarPing();
                }
              }}
              className="port-select-element"
            >
              <option value="" disabled>Select Coastal Port...</option>
              {PORTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Layer Chips */}
        <div className="layer-pill-group">
          <button
            type="button"
            onClick={() => { setShowPfz(!showPfz); soundFX.playBlip(700); }}
            className={`layer-chip ${showPfz ? 'active-pfz' : ''}`}
          >
            <FishIcon size={13} />
            <span>INCOIS PFZ ({regionalPfzs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowImbl(!showImbl); soundFX.playBlip(700); }}
            className={`layer-chip ${showImbl ? 'active-imbl' : ''}`}
          >
            <ShieldAlertIcon size={13} />
            <span>IMBL 5km Buffer</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowMpa(!showMpa); soundFX.playBlip(700); }}
            className={`layer-chip ${showMpa ? 'active-mpa' : ''}`}
          >
            <LayersIcon size={13} />
            <span>MPA & Reefs</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowRoute(!showRoute); soundFX.playBlip(700); }}
            className={`layer-chip ${showRoute ? 'active-route' : ''}`}
          >
            <NavigationIcon size={13} />
            <span>A* Route</span>
          </button>

          <button
            type="button"
            onClick={() => { setShowPorts(!showPorts); soundFX.playBlip(700); }}
            className={`layer-chip ${showPorts ? 'active-ports' : ''}`}
          >
            <span>⚓ Ports</span>
          </button>
        </div>

        {/* Basemap Switcher & Simulation Controls */}
        <div className="maplibre-actions-group">
          {/* Basemap Dropdown */}
          <div className="basemap-selector-pill">
            {BASEMAP_STYLES.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setSelectedBasemap(b.id);
                  soundFX.playBlip(800);
                }}
                className={`btn-basemap ${selectedBasemap === b.id ? 'active' : ''}`}
                title={b.name}
              >
                <span>{b.icon}</span>
                <span className="basemap-name-text">{b.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Autopilot Cruise Sim */}
          <button
            type="button"
            onClick={() => {
              setIsSimulatingCruise(!isSimulatingCruise);
              soundFX.playBlip(isSimulatingCruise ? 500 : 950);
            }}
            className={`btn-cruise-sim ${isSimulatingCruise ? 'sim-active' : ''}`}
          >
            {isSimulatingCruise ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
            <span>{isSimulatingCruise ? 'PAUSE' : 'CRUISE SIM'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main 100% Unobstructed Map Canvas */}
      <div className="maplibre-canvas-wrapper">
        <div id="map" ref={mapContainerRef} className="maplibre-gl-map" />

        {/* Tactical HUD Header Overlays */}
        <div className="map-tactical-hud">
          <div className="hud-metric">
            <span className="hud-label">LOCATION:</span>
            <span className="hud-val">{locationLabel || `${vesselPos.lat.toFixed(4)}°N, ${vesselPos.lng.toFixed(4)}°E`}</span>
          </div>

          <div className="hud-metric">
            <span className="hud-label">IMBL BUFFER:</span>
            <span className={`hud-val ${nearestImblDistanceKm <= 5 ? 'danger-val' : 'safe-val'}`}>
              {nearestImblDistanceKm.toFixed(1)} KM {nearestImblDistanceKm <= 5 ? '(5KM ALERT!)' : '(CLEAR)'}
            </span>
          </div>

          {selectedPfz && (
            <div className="hud-metric">
              <span className="hud-label">LOCKED PFZ:</span>
              <span className="hud-val pfz-val">{selectedPfz.name.split(' ')[0]} ({selectedPfz.distanceKm} km • {selectedPfz.catchScore}%)</span>
            </div>
          )}
        </div>

        {/* Clean Floating Quick Legend */}
        <div className="map-corner-legend">
          <span className="legend-item"><span className="legend-dot vessel" /> Active Boat</span>
          <span className="legend-item"><span className="legend-dot pfz" /> PFZ Thermal Front</span>
          <span className="legend-item"><span className="legend-dot imbl" /> IMBL 5km Zone</span>
          <span className="legend-item"><span className="legend-dot port" /> Major Harbor</span>
        </div>
      </div>
    </div>
  );
}
