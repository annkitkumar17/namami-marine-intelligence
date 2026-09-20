'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { MarineMapLibre } from '../../components/MarineMapLibre';
import { LiveWeatherPanel } from '../../components/LiveWeatherPanel';
import { RegionalPfzExplorer } from '../../components/RegionalPfzExplorer';
import { 
  RadarIcon, 
  FishIcon, 
  NavigationIcon, 
  ShieldAlertIcon,
  BotIcon,
  MapPinIcon,
  RefreshCwIcon,
  CompassIcon,
  SparklesIcon,
  ActivityIcon
} from '../../components/Icons';
import { soundFX } from '../../lib/audio';
import { 
  VESSEL_PROFILES, 
  PORTS, 
  VesselProfile, 
  PFZNode,
  getPfzZonesAroundLocation 
} from '../../lib/marineData';
import { fetchRealTimeMarineWeather, LiveMarineWeather } from '../../lib/weatherApi';

export default function MapPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Active Location state
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const [locationLabel, setLocationLabel] = useState<string>('Kochi Port (Cochin)');
  const [selectedPortId, setSelectedPortId] = useState<string>('kochi');
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Active View Tab: 'map' | 'weather' | 'pfz'
  const [activeTab, setActiveTab] = useState<'map' | 'weather' | 'pfz'>('map');

  // Dynamic PFZ list around current location
  const [regionalPfzs, setRegionalPfzs] = useState<PFZNode[]>(() => getPfzZonesAroundLocation(9.96, 76.24));
  const [selectedPfz, setSelectedPfz] = useState<PFZNode | null>(regionalPfzs[0] || null);

  // Real-time Live Weather state
  const [weatherData, setWeatherData] = useState<LiveMarineWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  // Active Navigation Route
  const [activeRoute, setActiveRoute] = useState<any>({
    origin: { lat: 9.96, lng: 76.24, name: 'Kochi Port (Cochin)' },
    destination: { lat: 9.68, lng: 75.82, name: 'Alappuzha-Kochi Thermal Front Alpha' },
    waypoints: [
      { lat: 9.96, lng: 76.24, step: 'Departure: Kochi Port', waveM: 0.8, windKts: 8 },
      { lat: 9.88, lng: 76.08, step: 'Waypoint 1: Clearing Harbor Channel', waveM: 1.2, windKts: 11 },
      { lat: 9.78, lng: 75.92, step: 'Waypoint 2: Deep Sea Fairway Corridor', waveM: 1.6, windKts: 14 },
      { lat: 9.68, lng: 75.82, step: 'Arrival: Alappuzha-Kochi Thermal Front Alpha', waveM: 1.8, windKts: 15 },
    ],
    totalDistanceKm: 46.2,
    etaMinutes: 195,
    riskScore: 12,
  });

  const nearestImblDistanceKm = 14.8;

  // Load Real-time Weather
  const loadWeather = useCallback(async (lat: number, lng: number) => {
    setWeatherLoading(true);
    try {
      const data = await fetchRealTimeMarineWeather(
        lat, 
        lng, 
        selectedVessel.maxWaveHeightM, 
        selectedVessel.maxWindSpeedKnots
      );
      setWeatherData(data);
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setWeatherLoading(false);
    }
  }, [selectedVessel]);

  // Initial Load
  useEffect(() => {
    loadWeather(vesselPos.lat, vesselPos.lng);
  }, [vesselPos.lat, vesselPos.lng, loadWeather]);

  // Handle Location Change (from Click, Port, or GPS)
  const handleUpdateLocation = (pos: { lat: number; lng: number }, name?: string) => {
    setVesselPos(pos);
    const label = name || `Custom Location (${pos.lat.toFixed(2)}°N, ${pos.lng.toFixed(2)}°E)`;
    setLocationLabel(label);

    // Recalculate PFZs around new location
    const updatedPfzs = getPfzZonesAroundLocation(pos.lat, pos.lng);
    setRegionalPfzs(updatedPfzs);
    if (updatedPfzs.length > 0) {
      setSelectedPfz(updatedPfzs[0]);
    }

    // Refresh weather for new location
    loadWeather(pos.lat, pos.lng);
  };

  // Handle Port Selection
  const handleSelectPort = (portId: string) => {
    setSelectedPortId(portId);
    const port = PORTS.find(p => p.id === portId);
    if (port) {
      handleUpdateLocation({ lat: port.lat, lng: port.lng }, port.name);
      setGpsStatusMessage(`📍 Location set to ${port.name} (${port.state})`);
      soundFX.playSonarPing();
    }
  };

  // Handle Browser GPS Live Location Detection
  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusMessage('⚠️ Geolocation is not supported by your browser. Defaulting to coastal port.');
      return;
    }

    setIsGpsLocating(true);
    setGpsStatusMessage('📡 Acquiring real-time GPS coordinates...');
    soundFX.playBlip(900);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const roundedLat = Number(latitude.toFixed(4));
        const roundedLng = Number(longitude.toFixed(4));

        handleUpdateLocation({ lat: roundedLat, lng: roundedLng }, `Live GPS Location (${roundedLat}°N, ${roundedLng}°E)`);
        setIsGpsLocating(false);
        setGpsStatusMessage(`✅ Live Location Acquired: ${roundedLat}°N, ${roundedLng}°E`);
        soundFX.playSonarPing();
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsGpsLocating(false);
        setGpsStatusMessage('⚠️ GPS Permission not granted. You can select any Indian port from the dropdown below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Plan Route from current location to selected PFZ
  const handlePlanRouteToPfz = (pfz: PFZNode) => {
    setSelectedPfz(pfz);
    setActiveRoute({
      origin: { lat: vesselPos.lat, lng: vesselPos.lng, name: locationLabel },
      destination: { lat: pfz.lat, lng: pfz.lng, name: pfz.name },
      waypoints: [
        { lat: vesselPos.lat, lng: vesselPos.lng, step: `Departure: ${locationLabel}`, waveM: 0.8, windKts: 9 },
        { lat: Number(((vesselPos.lat + pfz.lat) / 2).toFixed(4)), lng: Number(((vesselPos.lng + pfz.lng) / 2).toFixed(4)), step: 'Mid-Corridor Safe Waypoint', waveM: 1.4, windKts: 12 },
        { lat: pfz.lat, lng: pfz.lng, step: `Arrival: ${pfz.name}`, waveM: 1.6, windKts: 14 }
      ],
      totalDistanceKm: pfz.distanceKm,
      etaMinutes: Math.round((pfz.distanceKm / (selectedVessel.cruisingSpeedKnots * 1.852)) * 60),
      riskScore: pfz.status === 'ACTIVE' ? 8 : 28,
    });
    setActiveTab('map');
    soundFX.playSonarPing();
  };

  return (
    <div className="namami-app-shell">
      {/* 1. Header with Language, Vessel Selector & Offline Toggle */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        selectedVessel={selectedVessel}
        onVesselChange={setSelectedVessel}
        offlineMode={offlineMode}
        onToggleOffline={() => setOfflineMode(!offlineMode)}
        vesselPos={vesselPos}
        nearestImblDistanceKm={nearestImblDistanceKm}
      />

      {/* 2. Tactical Live Location Control Deck */}
      <section className="location-control-deck">
        <div className="location-deck-wrapper">
          <div className="location-deck-left">
            <div className="live-gps-badge">
              <span className="gps-radar-beacon" />
              <span>LIVE GEOSPATIAL INTELLIGENCE</span>
            </div>
            <h1 className="location-hero-title">
              {locationLabel}
            </h1>
            <p className="location-hero-subtitle">
              Interactive MapLibre WebGL vector map, live Open-Meteo marine wave forecast, and INCOIS potential fishing zones.
            </p>
          </div>

          <div className="location-deck-actions">
            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleDetectGpsLocation}
              disabled={isGpsLocating}
              className={`btn-detect-gps ${isGpsLocating ? 'detecting' : ''}`}
            >
              <MapPinIcon size={18} />
              <span>{isGpsLocating ? 'Acquiring GPS Signal...' : '📍 Detect My Live Location'}</span>
            </button>

            {/* Quick Port Selector */}
            <div className="port-quick-picker">
              <span className="picker-label">⚓ Quick Port:</span>
              <select
                value={selectedPortId}
                onChange={(e) => handleSelectPort(e.target.value)}
                className="select-port-hero"
              >
                {PORTS.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name} ({port.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GPS Status Notice Bar */}
        {gpsStatusMessage && (
          <div className="gps-status-notification-bar">
            <span>{gpsStatusMessage}</span>
            <button 
              type="button" 
              onClick={() => setGpsStatusMessage(null)} 
              className="btn-dismiss-status"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Section Tabs (Map / Live Weather / Fishing Zones) */}
        <div className="map-view-tabs-row">
          <button
            type="button"
            onClick={() => { setActiveTab('map'); soundFX.playBlip(750); }}
            className={`view-tab-pill ${activeTab === 'map' ? 'active' : ''}`}
          >
            <RadarIcon size={16} />
            <span>🗺️ Clear Tactical Map</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('weather'); soundFX.playBlip(750); }}
            className={`view-tab-pill ${activeTab === 'weather' ? 'active' : ''}`}
          >
            <ActivityIcon size={16} />
            <span>🌦️ Real-Time Weather Forecast {weatherData?.current ? `(${weatherData.current.tempC}°C • ${weatherData.current.waveHeightM}m Hs)` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('pfz'); soundFX.playBlip(750); }}
            className={`view-tab-pill ${activeTab === 'pfz' ? 'active' : ''}`}
          >
            <FishIcon size={16} />
            <span>🐟 Fishing Zones around Location ({regionalPfzs.length})</span>
          </button>
        </div>
      </section>

      {/* 3. Main View Container (Switches cleanly between Map, Weather, and Regional PFZs) */}
      <main className="main-view-container">
        {activeTab === 'map' && (
          <div className="map-full-screen-deck">
            <MarineMapLibre
              vesselPos={vesselPos}
              onUpdateVesselPos={handleUpdateLocation}
              selectedPfz={selectedPfz}
              onSelectPfz={setSelectedPfz}
              selectedVessel={selectedVessel}
              nearestImblDistanceKm={nearestImblDistanceKm}
              activeRoute={activeRoute}
              onSelectDestination={(dest) => {
                setActiveRoute({
                  origin: { lat: vesselPos.lat, lng: vesselPos.lng, name: locationLabel },
                  destination: dest,
                  waypoints: [
                    { lat: vesselPos.lat, lng: vesselPos.lng, step: `Departure: ${locationLabel}`, waveM: 0.8, windKts: 9 },
                    { lat: dest.lat, lng: dest.lng, step: `Arrival: ${dest.name}`, waveM: 1.6, windKts: 14 }
                  ],
                  totalDistanceKm: 42.0,
                  etaMinutes: 180,
                  riskScore: 10
                });
              }}
              selectedPortId={selectedPortId}
              onSelectPort={handleSelectPort}
              isGpsLocating={isGpsLocating}
              onDetectGpsLocation={handleDetectGpsLocation}
              locationLabel={locationLabel}
            />
          </div>
        )}

        {activeTab === 'weather' && (
          <LiveWeatherPanel
            weatherData={weatherData}
            isLoading={weatherLoading}
            onRefresh={() => loadWeather(vesselPos.lat, vesselPos.lng)}
            selectedVessel={selectedVessel}
            locationName={locationLabel}
          />
        )}

        {activeTab === 'pfz' && (
          <RegionalPfzExplorer
            pfzList={regionalPfzs}
            selectedPfz={selectedPfz}
            onSelectPfz={setSelectedPfz}
            onPlanRouteToPfz={handlePlanRouteToPfz}
            baseLocationName={locationLabel}
          />
        )}
      </main>
    </div>
  );
}
