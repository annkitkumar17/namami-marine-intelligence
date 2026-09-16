'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { RouteOptimizer } from '../../components/RouteOptimizer';
import { 
  NavigationIcon, 
  BotIcon, 
  RadarIcon, 
  FishIcon, 
  ShieldAlertIcon 
} from '../../components/Icons';
import { VESSEL_PROFILES, VesselProfile } from '../../lib/marineData';

export default function RoutePage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const nearestImblDistanceKm = 14.8;

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
    fuelEfficiencyPercent: 14.8,
  });

  return (
    <div className="namami-app-shell">
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

      <div className="page-solution-banner">
        <div className="banner-content">
          <div className="solution-badge route">
            <NavigationIcon size={18} />
            <span>NetworkX A* Least-Risk Marine Routing Engine • Hazard Corridor Avoidance</span>
          </div>
          <h1 className="page-solution-title">A* Least-Risk Navigation & Fuel Corridor</h1>
          <p className="page-solution-desc">
            Calculate the safest navigational corridor avoiding Marine Protected Areas, cyclone cones, and high swell cells while maximizing fuel savings.
          </p>
        </div>

        <div className="banner-quick-links">
          <Link href="/" className="btn-banner-link copilot">
            <BotIcon size={16} /> <span>Ask Copilot</span>
          </Link>
          <Link href="/map" className="btn-banner-link radar">
            <RadarIcon size={16} /> <span>Map View</span>
          </Link>
          <Link href="/pfz" className="btn-banner-link pfz">
            <FishIcon size={16} /> <span>PFZ Grounds</span>
          </Link>
          <Link href="/geofence" className="btn-banner-link boundary">
            <ShieldAlertIcon size={16} /> <span>IMBL Warning</span>
          </Link>
        </div>
      </div>

      <main className="main-view-container">
        <RouteOptimizer
          selectedVessel={selectedVessel}
          vesselPos={vesselPos}
          activeRoute={activeRoute}
          onUpdateActiveRoute={setActiveRoute}
          onNavigateToTab={(tab) => {
            if (tab === 'map') router.push('/map');
            else if (tab === 'pfz') router.push('/pfz');
          }}
        />
      </main>
    </div>
  );
}
