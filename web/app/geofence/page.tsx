'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { GeofenceMonitor } from '../../components/GeofenceMonitor';
import { 
  ShieldAlertIcon, 
  BotIcon, 
  RadarIcon, 
  NavigationIcon, 
  ShipIcon 
} from '../../components/Icons';
import { VESSEL_PROFILES, VesselProfile } from '../../lib/marineData';

export default function GeofencePage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const nearestImblDistanceKm = 14.8;

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
          <div className="solution-badge boundary">
            <ShieldAlertIcon size={18} />
            <span>PostGIS Geofence Engine • 5 km Safety Buffer • Indo-Sri Lanka & Pakistan IMBL</span>
          </div>
          <h1 className="page-solution-title">International Maritime Boundary Line (IMBL) Guard</h1>
          <p className="page-solution-desc">
            Continuous acoustic siren warning system, real-time distance telemetry to sovereign borders, and Coast Guard VHF emergency frequencies.
          </p>
        </div>

        <div className="banner-quick-links">
          <Link href="/" className="btn-banner-link copilot">
            <BotIcon size={16} /> <span>Ask Copilot</span>
          </Link>
          <Link href="/map" className="btn-banner-link radar">
            <RadarIcon size={16} /> <span>Radar View</span>
          </Link>
          <Link href="/route" className="btn-banner-link route">
            <NavigationIcon size={16} /> <span>Safe Route</span>
          </Link>
          <Link href="/voyage" className="btn-banner-link voyage">
            <ShipIcon size={16} /> <span>Arm Voyage</span>
          </Link>
        </div>
      </div>

      <main className="main-view-container">
        <GeofenceMonitor
          vesselPos={vesselPos}
          onUpdateVesselPos={setVesselPos}
          nearestImblDistanceKm={nearestImblDistanceKm}
          selectedVessel={selectedVessel}
        />
      </main>
    </div>
  );
}
