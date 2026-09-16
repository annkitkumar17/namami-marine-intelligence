'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { RiskVerdictCard } from '../../components/RiskVerdictCard';
import { 
  ShieldIcon, 
  BotIcon, 
  RadarIcon, 
  FishIcon, 
  NavigationIcon 
} from '../../components/Icons';
import { VESSEL_PROFILES, VesselProfile } from '../../lib/marineData';

export default function SafetyPage() {
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
          <div className="solution-badge safety">
            <ShieldIcon size={18} />
            <span>Deterministic Rule-Engine v4.2 • Vessel Threshold Envelope</span>
          </div>
          <h1 className="page-solution-title">Marine Safety Forecast & Go/No-Go Verdict</h1>
          <p className="page-solution-desc">
            Deterministic vessel limit calculation evaluating wave height, wind gusts, tidal surge, and IMD CAP warning polygons.
          </p>
        </div>

        <div className="banner-quick-links">
          <Link href="/" className="btn-banner-link copilot">
            <BotIcon size={16} /> <span>Ask Copilot</span>
          </Link>
          <Link href="/map" className="btn-banner-link radar">
            <RadarIcon size={16} /> <span>Tactical Map</span>
          </Link>
          <Link href="/pfz" className="btn-banner-link pfz">
            <FishIcon size={16} /> <span>Nearest PFZ</span>
          </Link>
          <Link href="/route" className="btn-banner-link route">
            <NavigationIcon size={16} /> <span>Safe Route</span>
          </Link>
        </div>
      </div>

      <main className="main-view-container">
        <RiskVerdictCard
          selectedVessel={selectedVessel}
          vesselPos={vesselPos}
          nearestImblDistanceKm={nearestImblDistanceKm}
        />
      </main>
    </div>
  );
}
