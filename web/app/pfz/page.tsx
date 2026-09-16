'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { PfzExplorer } from '../../components/PfzExplorer';
import { 
  FishIcon, 
  BotIcon, 
  RadarIcon, 
  ShieldIcon, 
  NavigationIcon 
} from '../../components/Icons';
import { VESSEL_PROFILES, PFZ_ZONES, VesselProfile, PFZNode } from '../../lib/marineData';

export default function PfzPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const [selectedPfz, setSelectedPfz] = useState<PFZNode | null>(PFZ_ZONES[0]);
  const nearestImblDistanceKm = 14.8;

  const handlePlanRoute = (pfz: PFZNode) => {
    setSelectedPfz(pfz);
    router.push('/route');
  };

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
          <div className="solution-badge pfz">
            <FishIcon size={18} />
            <span>INCOIS Oceansat-3 & AVHRR Satellite Feeds • SST & Chlorophyll-a Gradients</span>
          </div>
          <h1 className="page-solution-title">Potential Fishing Zones (PFZ) & Thermal Fronts</h1>
          <p className="page-solution-desc">
            Identify high-catch pelagic zones, verify sea surface temperature (SST) thermal fronts, and plan fuel-efficient voyages.
          </p>
        </div>

        <div className="banner-quick-links">
          <Link href="/" className="btn-banner-link copilot">
            <BotIcon size={16} /> <span>Ask Copilot</span>
          </Link>
          <Link href="/map" className="btn-banner-link radar">
            <RadarIcon size={16} /> <span>View on Map</span>
          </Link>
          <Link href="/safety" className="btn-banner-link safety">
            <ShieldIcon size={16} /> <span>Check Safety</span>
          </Link>
          <Link href="/route" className="btn-banner-link route">
            <NavigationIcon size={16} /> <span>Safe Route</span>
          </Link>
        </div>
      </div>

      <main className="main-view-container">
        <PfzExplorer
          selectedPfz={selectedPfz}
          onSelectPfz={setSelectedPfz}
          onPlanRouteToPfz={handlePlanRoute}
        />
      </main>
    </div>
  );
}
