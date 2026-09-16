'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { VoyageArming } from '../../components/VoyageArming';
import { 
  ShipIcon, 
  BotIcon, 
  RadarIcon, 
  ShieldIcon, 
  ShieldAlertIcon 
} from '../../components/Icons';
import { VESSEL_PROFILES, VesselProfile } from '../../lib/marineData';

export default function VoyagePage() {
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
          <div className="solution-badge voyage">
            <ShipIcon size={18} />
            <span>Zero-Cellular Deep Sea Offline Pack • MapLibre PMTiles • SOS Distress Beacon</span>
          </div>
          <h1 className="page-solution-title">Armed Voyage & Offline Survival Pack</h1>
          <p className="page-solution-desc">
            Download offline coastal tile packs, cache deterministic rules for zero-connectivity fishing trips, and arm emergency beacon monitoring.
          </p>
        </div>

        <div className="banner-quick-links">
          <Link href="/" className="btn-banner-link copilot">
            <BotIcon size={16} /> <span>Ask Copilot</span>
          </Link>
          <Link href="/map" className="btn-banner-link radar">
            <RadarIcon size={16} /> <span>Radar View</span>
          </Link>
          <Link href="/safety" className="btn-banner-link safety">
            <ShieldIcon size={16} /> <span>Safety Limits</span>
          </Link>
          <Link href="/geofence" className="btn-banner-link boundary">
            <ShieldAlertIcon size={16} /> <span>Boundary Check</span>
          </Link>
        </div>
      </div>

      <main className="main-view-container">
        <VoyageArming
          selectedVessel={selectedVessel}
          offlineMode={offlineMode}
          onToggleOffline={() => setOfflineMode(!offlineMode)}
        />
      </main>
    </div>
  );
}
