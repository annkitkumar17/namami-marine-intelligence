'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  RadarIcon, 
  ShipIcon, 
  Volume2Icon, 
  VolumeXIcon, 
  RadioIcon, 
  SatelliteIcon, 
  ShieldAlertIcon,
  ActivityIcon,
  BotIcon,
  ShieldIcon,
  FishIcon,
  NavigationIcon,
  ServerIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { TRANSLATIONS, VesselProfile, VESSEL_PROFILES } from '../lib/marineData';

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedVessel: VesselProfile;
  onVesselChange: (vessel: VesselProfile) => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  vesselPos: { lat: number; lng: number };
  nearestImblDistanceKm: number;
}

export function Header({
  currentLanguage,
  onLanguageChange,
  selectedVessel,
  onVesselChange,
  offlineMode,
  onToggleOffline,
  vesselPos,
  nearestImblDistanceKm,
}: HeaderProps) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [sirenActive, setSirenActive] = useState<boolean>(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const handleSoundToggle = () => {
    const next = !sirenActive;
    setSirenActive(next);
    soundFX.soundEnabled = next;
    if (next) soundFX.playBlip(1040);
  };

  const isImblDanger = nearestImblDistanceKm <= 5.0;

  const navLinks = [
    { href: '/', label: 'AI Copilot', icon: <BotIcon size={16} />, color: 'copilot' },
    { href: '/map', label: 'Tactical Radar & Map', icon: <RadarIcon size={16} />, color: 'radar' },
    { href: '/safety', label: 'Safety Forecast', icon: <ShieldIcon size={16} />, color: 'safety' },
    { href: '/pfz', label: 'PFZ Thermal Hub', icon: <FishIcon size={16} />, color: 'pfz' },
    { href: '/route', label: 'A* Safe Route', icon: <NavigationIcon size={16} />, color: 'route' },
    { href: '/geofence', label: 'IMBL Boundary', icon: <ShieldAlertIcon size={16} />, color: 'geofence' },
    { href: '/voyage', label: 'Armed Voyage', icon: <ShipIcon size={16} />, color: 'voyage' },
  ];

  return (
    <header className="tactical-header">
      {/* Top Banner / Telemetry Ticker */}
      <div className="header-top-bar">
        <div className="telemetry-pill-group">
          <div className={`status-pill ${offlineMode ? 'offline' : 'online'}`}>
            <span className="pulsing-dot" />
            <span>{offlineMode ? 'OFFLINE VOYAGE PACK (GPS-ONLY)' : 'LIVE SATELLITE & IOT MESH'}</span>
          </div>

          <div className="status-pill navic">
            <SatelliteIcon size={14} className="icon-spin-subtle" />
            <span>NavIC (IRNSS): 8 SATS LOCKED (±2.1m)</span>
          </div>

          <div className="status-pill ocean">
            <ActivityIcon size={14} />
            <span>INCOIS OSF / IMD RADAR: ACTIVE</span>
          </div>

          {isImblDanger && (
            <div className="status-pill danger-glow">
              <ShieldAlertIcon size={14} className="hazard-pulse" />
              <span>GEOFENCE ALERT: {nearestImblDistanceKm.toFixed(1)} KM TO IMBL!</span>
            </div>
          )}
        </div>

        <div className="header-time-coords">
          <span className="coord-chip">
            LAT: <strong>{vesselPos.lat.toFixed(4)}°N</strong> | LNG: <strong>{vesselPos.lng.toFixed(4)}°E</strong>
          </span>
          <span className="clock-chip">{currentTime}</span>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="header-main-bar">
        {/* Brand */}
        <Link href="/" className="brand-container-link">
          <div className="brand-container">
            <div className="brand-icon-wrapper">
              <RadarIcon size={28} className="radar-sweep-icon" />
              <span className="radar-ping-ring" />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-title">NAMAMI</h1>
                <span className="brand-devanagari">नामामि</span>
                <span className="brand-badge">SIH 2026</span>
              </div>
              <p className="brand-tagline">
                Autonomous Marine Intelligence, PFZ Analytics & Go/No-Go Safety System
              </p>
            </div>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="header-controls">
          {/* Vessel Selector */}
          <div className="control-group">
            <label className="control-label">
              <ShipIcon size={14} />
              <span>{t.vessel}:</span>
            </label>
            <select 
              value={selectedVessel.id}
              onChange={(e) => {
                const found = VESSEL_PROFILES.find(v => v.id === e.target.value);
                if (found) {
                  onVesselChange(found);
                  soundFX.playBlip(750);
                }
              }}
              className="tactical-select vessel-select"
            >
              {VESSEL_PROFILES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.type.split('(')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="control-group">
            <label className="control-label">
              <RadioIcon size={14} />
              <span>BHASHINI Lang:</span>
            </label>
            <select
              value={currentLanguage}
              onChange={(e) => {
                onLanguageChange(e.target.value);
                soundFX.playBlip(880);
              }}
              className="tactical-select lang-select"
            >
              <option value="en">English (Global)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
            </select>
          </div>

          {/* Sound FX Toggle */}
          <button 
            type="button"
            onClick={handleSoundToggle}
            className={`btn-tactical-icon ${sirenActive ? 'active' : 'muted'}`}
            title={sirenActive ? "Mute Acoustic Sirens & Sonar Pings" : "Enable Acoustic Sirens & Sonar"}
          >
            {sirenActive ? <Volume2Icon size={18} /> : <VolumeXIcon size={18} />}
          </button>

          {/* Offline Mode Toggle */}
          <button 
            type="button"
            onClick={() => {
              onToggleOffline();
              soundFX.playBlip(offlineMode ? 600 : 900);
            }}
            className={`btn-tactical-pill ${offlineMode ? 'btn-offline-active' : 'btn-online'}`}
            title="Simulate Airplane / Zero-Cellular GPS Mode"
          >
            <span className="pill-dot" />
            {offlineMode ? 'OFFLINE ACTIVE' : 'SIMULATE OFFLINE'}
          </button>
        </div>
      </div>

      {/* Multi-Page Multi-Solution Navigation Bar */}
      <nav className="header-nav-solutions-bar">
        <div className="nav-solutions-track">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => soundFX.playBlip(800)}
                className={`solution-nav-link ${link.color} ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-box">{link.icon}</span>
                <span className="nav-label-text">{link.label}</span>
                {isActive && <span className="active-motion-indicator" />}
              </Link>
            );
          })}
        </div>

        <div className="nav-system-links">
          <Link
            href="/settings/data-sources"
            onClick={() => soundFX.playBlip(800)}
            className={`solution-nav-link system ${pathname === '/settings/data-sources' ? 'active' : ''}`}
          >
            <ServerIcon size={15} />
            <span>Sources</span>
          </Link>

          <Link
            href="/admin"
            onClick={() => soundFX.playBlip(800)}
            className={`solution-nav-link admin ${pathname === '/admin' ? 'active' : ''}`}
          >
            <ActivityIcon size={15} />
            <span>Mission Control</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
