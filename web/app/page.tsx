'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../components/Header';
import { NamamiResponseCard } from '../components/NamamiResponseCard';
import { 
  RadarIcon, 
  BotIcon, 
  ShieldIcon, 
  FishIcon, 
  NavigationIcon, 
  ShieldAlertIcon, 
  ShipIcon, 
  ServerIcon,
  MicIcon, 
  SendIcon, 
  MapPinIcon, 
  Volume2Icon, 
  VolumeXIcon,
  ActivityIcon, 
  SparklesIcon, 
  ChevronRightIcon,
  CompassIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  LayersIcon,
  InfoIcon
} from '../components/Icons';
import { soundFX } from '../lib/audio';
import { bhashiniVoice } from '../lib/voice';
import { 
  VESSEL_PROFILES, 
  PORTS,
  VesselProfile,
  PortLocation,
  getLocationDossier,
  LocationDossier,
  PFZNode,
  TRANSLATIONS
} from '../lib/marineData';
import { ChatMessageItem, DataMode } from '../lib/store';
import { namamiApi } from '../lib/api';

export default function ConversationalCopilotPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  
  // Location State
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const [selectedPortId, setSelectedPortId] = useState<string>('kochi');
  const [locationLabel, setLocationLabel] = useState<string>('Kochi Port (Cochin), Kerala');
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  // Active Location Dossier
  const [locationDossier, setLocationDossier] = useState<LocationDossier>(() => 
    getLocationDossier(9.96, 76.24, VESSEL_PROFILES[0])
  );

  // Conversational Messages State
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Update Dossier whenever location or vessel changes
  useEffect(() => {
    const dossier = getLocationDossier(vesselPos.lat, vesselPos.lng, selectedVessel);
    setLocationDossier(dossier);
  }, [vesselPos, selectedVessel]);

  // Setup Voice Engine callbacks
  const handleSendMessageRef = useRef<(query: string) => void>(() => {});
  handleSendMessageRef.current = (query: string) => {
    handleSendMessage(query);
  };

  useEffect(() => {
    bhashiniVoice.setCallbacks({
      onTranscript: (transcript: string, isFinal: boolean) => {
        setInputQuery(transcript);
        if (isFinal) {
          handleSendMessageRef.current(transcript);
        }
      },
      onListeningState: (listening: boolean) => {
        setIsListeningMic(listening);
        if (listening) {
          setVoiceNotice(`🎙️ Listening in ${currentLanguage.toUpperCase()}... Speak your question clearly.`);
        } else {
          setTimeout(() => setVoiceNotice(null), 2500);
        }
      },
      onSpeakingState: (speaking: boolean) => {
        if (!speaking) setActiveSpeakingId(null);
      },
      onError: (err: string) => {
        console.warn('Voice engine error notice:', err);
        setVoiceNotice(err);
        setTimeout(() => setVoiceNotice(null), 4000);
      }
    });
    bhashiniVoice.setLanguage(currentLanguage);
  }, [currentLanguage]);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      timestamp: '12:00 IST',
      language: 'en',
      text: 'Namaste! I am NAMAMI, your autonomous marine intelligence co-pilot powered by BHASHINI Indic AI. Speak into the microphone or choose an inquiry below to get real-time PFZ coordinates, wave safety forecasts, A* safe routing, and border warnings in your language.',
      dataMode: 'LIVE',
      verdict: 'GO',
      simpleAction: 'Favorable sea conditions off Kochi today. Optimal departure window is tomorrow 06:00 - 14:00 IST.',
      bestSafePfz: 'Alappuzha-Kochi Thermal Front Alpha (Sector 4)',
      departureWindow: 'Tomorrow 06:00 - 14:00 IST',
      hazardSummary: 'Wave: 1.6m (Within 2.8m limit) • Wind: 14 kts • No active cyclone alerts',
      confidenceScore: 96,
      sourceFreshness: 'BHASHINI AI • INCOIS OSF / IMD Mausam (Just now)',
      evidence: {
        incoisPfz: 'Oceansat-3 & AVHRR Thermal Front (Catch Score: 94%)',
        incoisOsf: 'WW3-v4.2: 1.6m wave height < 2.8m vessel threshold',
        imdWeather: 'IMD Coastal Warning: Green Category (Normal)',
        geofenceStatus: '14.8 km clearance from Indo-Sri Lanka IMBL',
        rulesTriggered: ['Rule V4.2: Wave threshold satisfied', 'Rule G1: Boundary clearance confirmed'],
        validity: 'Valid for next 24 Hours',
      },
      suggestedChips: [
        'Where is the nearest Potential Fishing Zone (PFZ) today?',
        'Is it safe to venture into the sea tomorrow morning?',
        'What are the tide, weather, and sea conditions near my fishing location?',
        'What is the safest route for a fishing vessel considering weather and sea-state conditions?',
      ],
    }
  ]);

  // Handle Location Change (from Port Dropdown)
  const handleSelectPort = (portId: string) => {
    setSelectedPortId(portId);
    const port = PORTS.find(p => p.id === portId);
    if (port) {
      setVesselPos({ lat: port.lat, lng: port.lng });
      setLocationLabel(`${port.name}, ${port.state}`);
      setGpsNotification(`📍 Location updated to ${port.name} (${port.state})`);
      soundFX.playSonarPing();
      setTimeout(() => setGpsNotification(null), 3000);
    }
  };

  // Handle Live Browser GPS Location Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsNotification('⚠️ Geolocation is not supported by your browser. Please select a port from the list.');
      setTimeout(() => setGpsNotification(null), 4000);
      return;
    }

    setIsGpsLocating(true);
    setGpsNotification('📡 Acquiring real-time GPS coordinates via satellite...');
    soundFX.playBlip(880);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const roundedLat = Number(latitude.toFixed(4));
        const roundedLng = Number(longitude.toFixed(4));

        setVesselPos({ lat: roundedLat, lng: roundedLng });
        setLocationLabel(`Live GPS (${roundedLat}°N, ${roundedLng}°E)`);
        setIsGpsLocating(false);
        setGpsNotification(`✅ Live GPS Acquired: ${roundedLat}°N, ${roundedLng}°E`);
        soundFX.playSonarPing();
        setTimeout(() => setGpsNotification(null), 3500);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsGpsLocating(false);
        setGpsNotification('⚠️ GPS Permission not granted or unavailable. Defaulted to Kochi Port.');
        setTimeout(() => setGpsNotification(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    bhashiniVoice.stopListening();
    soundFX.playBlip(920);
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      language: currentLanguage,
      text: queryText,
      dataMode: 'LIVE',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    const response = await namamiApi.askChat({
      query: queryText,
      language: currentLanguage,
      location: vesselPos,
      vessel: selectedVessel,
    });

    setMessages((prev) => [...prev, response]);
    setIsProcessing(false);
    soundFX.playSonarPing();

    // Automatically speak the response using Bhashini Voice Synthesizer
    handleSpeakTTS(response.id, response.text);
  };

  const handleMicClick = () => {
    if (isListeningMic) {
      bhashiniVoice.stopListening();
      setIsListeningMic(false);
      return;
    }

    soundFX.playBlip(680);
    setIsListeningMic(true);
    bhashiniVoice.startListening(currentLanguage);
  };

  const handleSpeakTTS = async (msgId: string, text: string) => {
    if (activeSpeakingId === msgId) {
      bhashiniVoice.stopSpeaking();
      setActiveSpeakingId(null);
      return;
    }
    setActiveSpeakingId(msgId);
    soundFX.playBlip(1040);

    // Attempt Bhashini TTS
    const ttsRes = await namamiApi.bhashiniTTS(text, currentLanguage);
    await bhashiniVoice.speakText(text, currentLanguage, ttsRes.audioBase64);
  };

  const handleSpeakLocationBriefing = () => {
    const brief = locationDossier.briefing[currentLanguage] || locationDossier.briefing.en;
    handleSpeakTTS('briefing-active', brief);
  };

  const handleActionRedirect = (actionKey: string) => {
    if (actionKey === 'map') router.push('/map');
    else if (actionKey === 'route') router.push('/route');
    else if (actionKey === 'pfz') router.push('/pfz');
    else if (actionKey === 'safety' || actionKey === 'risk') router.push('/safety');
    else if (actionKey === 'boundary' || actionKey === 'geofence') router.push('/geofence');
    else handleSendMessage(actionKey);
  };

  return (
    <div className="namami-app-shell">
      {/* 1. Tactical Top Header with Solution Links */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        selectedVessel={selectedVessel}
        onVesselChange={setSelectedVessel}
        offlineMode={offlineMode}
        onToggleOffline={() => setOfflineMode(!offlineMode)}
        vesselPos={vesselPos}
        nearestImblDistanceKm={locationDossier.geofence.distanceKm}
      />

      {/* 2. Interactive Location Selector & Dossier Section */}
      <section className="location-intelligence-hero-section">
        <div className="location-hero-container">
          <div className="location-picker-bar">
            <div className="picker-title-group">
              <span className="live-radar-dot" />
              <div>
                <h2 className="location-picker-heading">Select Coastal Port or Detect Live GPS</h2>
                <p className="location-picker-sub">Instantly aggregates PFZ fish zones, 24h wave safety, tides, IMBL borders & weather</p>
              </div>
            </div>

            <div className="picker-controls-row">
              {/* GPS Live Locate Button */}
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isGpsLocating}
                className={`btn-hero-gps ${isGpsLocating ? 'locating' : ''}`}
                title="Acquire live GPS coordinates from your device"
              >
                <MapPinIcon size={16} />
                <span>{isGpsLocating ? 'Acquiring GPS...' : '📍 Detect Live GPS'}</span>
              </button>

              {/* 12 Major Indian Coastal Ports Dropdown */}
              <div className="port-select-wrapper">
                <span className="port-select-icon">⚓</span>
                <select
                  value={selectedPortId}
                  onChange={(e) => handleSelectPort(e.target.value)}
                  className="port-select-dropdown"
                >
                  {PORTS.map((port) => (
                    <option key={port.id} value={port.id}>
                      {port.name} — {port.state} ({port.region.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GPS Status Notification Toast */}
          {gpsNotification && (
            <div className="gps-toast-banner">
              <span>{gpsNotification}</span>
              <button type="button" onClick={() => setGpsNotification(null)} className="btn-close-toast">✕</button>
            </div>
          )}

          {/* Comprehensive Location Intelligence Dossier Card */}
          <div className="location-dossier-card">
            <div className="dossier-header-row">
              <div className="dossier-port-meta">
                <span className="dossier-tag">ACTIVE SECTOR DOSSIER</span>
                <h3 className="dossier-port-name">{locationDossier.port.name}</h3>
                <span className="dossier-coords">
                  {vesselPos.lat.toFixed(2)}°N, {vesselPos.lng.toFixed(2)}°E • Depth: {locationDossier.port.depthM}m
                </span>
              </div>

              <div className="dossier-actions-group">
                <button
                  type="button"
                  onClick={handleSpeakLocationBriefing}
                  className={`btn-briefing-audio ${activeSpeakingId === 'briefing-active' ? 'speaking' : ''}`}
                >
                  <Volume2Icon size={16} />
                  <span>{activeSpeakingId === 'briefing-active' ? 'Speaking Briefing...' : 'Listen Audio Briefing'}</span>
                </button>

                <Link href="/map" className="btn-dossier-map">
                  <RadarIcon size={15} /> <span>Open Radar Map</span>
                </Link>
              </div>
            </div>

            {/* 4 Key Intelligence Grid Blocks */}
            <div className="dossier-intelligence-grid">
              {/* 1. Nearest PFZ Ground */}
              <div className="dossier-tile pfz">
                <div className="tile-icon pfz"><FishIcon size={20} /></div>
                <div className="tile-content">
                  <span className="tile-label">Top Fishing Zone (PFZ)</span>
                  <strong className="tile-value">{locationDossier.nearestPfz.name}</strong>
                  <div className="tile-subgrid">
                    <span>📏 Distance: <strong>{locationDossier.nearestPfz.distanceKm} km</strong> ({locationDossier.nearestPfz.bearingDeg}°)</span>
                    <span>⭐ Catch Score: <strong className="highlight-green">{locationDossier.nearestPfz.catchScore}/100</strong></span>
                    <span>🌡️ SST: {locationDossier.seaState.sstCelsius}°C • Chl: {locationDossier.seaState.chlorophyllMgM3} mg/m³</span>
                    <span>🐟 Species: {locationDossier.port.primarySpecies.slice(0, 2).join(', ')}</span>
                  </div>
                  <Link href="/route" className="tile-action-link">
                    Plan A* Route to this PFZ →
                  </Link>
                </div>
              </div>

              {/* 2. Sea State & Tides */}
              <div className="dossier-tile weather">
                <div className="tile-icon weather"><ActivityIcon size={20} /></div>
                <div className="tile-content">
                  <span className="tile-label">Sea State & Tides</span>
                  <strong className="tile-value">{locationDossier.seaState.waveHeightM}m Significant Wave (Hs)</strong>
                  <div className="tile-subgrid">
                    <span>💨 Wind: <strong>{locationDossier.seaState.windSpeedKnots} kts</strong> ({locationDossier.seaState.windDirection})</span>
                    <span>🌊 Swell Period: {locationDossier.seaState.swellPeriodSec}s</span>
                    <span>🔺 High Tide: {locationDossier.seaState.highTideTime}</span>
                    <span>🔻 Low Tide: {locationDossier.seaState.lowTideTime}</span>
                  </div>
                  <Link href="/safety" className="tile-action-link">
                    Inspect 24h Scrubber →
                  </Link>
                </div>
              </div>

              {/* 3. Safety Verdict */}
              <div className="dossier-tile safety">
                <div className="tile-icon safety"><ShieldIcon size={20} /></div>
                <div className="tile-content">
                  <span className="tile-label">Safety Forecast ({selectedVessel.name.split(' ')[1] || 'Vessel'})</span>
                  <div className="verdict-banner-row">
                    <span className={`verdict-pill-hero ${locationDossier.safety.verdict.toLowerCase()}`}>
                      <CheckCircleIcon size={14} /> <span>VERDICT: {locationDossier.safety.verdict}</span>
                    </span>
                    <span className="confidence-pill">{locationDossier.safety.confidenceScore}% Confidence</span>
                  </div>
                  <p className="dossier-safety-text">{locationDossier.safety.actionText}</p>
                  <span className="dossier-window">🕒 Window: <strong>{locationDossier.safety.departureWindow}</strong></span>
                </div>
              </div>

              {/* 4. Geofence & Boundary Proximity */}
              <div className="dossier-tile boundary">
                <div className="tile-icon boundary"><ShieldAlertIcon size={20} /></div>
                <div className="tile-content">
                  <span className="tile-label">Boundary Clearance & Alert</span>
                  <strong className="tile-value">{locationDossier.geofence.distanceKm} km from {locationDossier.geofence.nearestBoundaryName.split('(')[0]}</strong>
                  <div className="tile-subgrid">
                    <span>🛡️ Status: <strong className={locationDossier.geofence.status === 'SAFE' ? 'highlight-green' : 'highlight-amber'}>{locationDossier.geofence.status} (&gt;5km buffer)</strong></span>
                    <span>🚨 Siren Guard: <strong>ACTIVE</strong></span>
                    <span>📻 Emergency Channel: VHF 16 / ICG 1554</span>
                  </div>
                  <Link href="/geofence" className="tile-action-link">
                    Boundary Alert Console →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Conversational Platform UI */}
      <main className="conversation-platform-container">
        <div className="conversation-stream-deck">
          {/* Section Header */}
          <div className="copilot-stream-header">
            <div className="stream-header-left">
              <span className="bot-avatar-chip"><BotIcon size={18} /></span>
              <div>
                <h3 className="stream-title">BHASHINI Multilingual AI Co-Pilot</h3>
                <span className="stream-subtitle">Ask questions via voice or text in 10 Indian coastal languages</span>
              </div>
            </div>

            <div className="language-selector-pill">
              <span className="lang-label">Language:</span>
              <select
                value={currentLanguage}
                onChange={(e) => {
                  setCurrentLanguage(e.target.value);
                  bhashiniVoice.setLanguage(e.target.value);
                  soundFX.playBlip(750);
                }}
                className="select-lang-hero"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
              </select>
            </div>
          </div>

          {/* Voice Notification Banner */}
          {voiceNotice && (
            <div className="voice-active-banner">
              <span className="mic-pulse-dot" />
              <span>{voiceNotice}</span>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="conversation-messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`conversation-message-bubble-row ${msg.sender === 'user' ? 'user-side' : 'agent-side'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="copilot-avatar-icon">
                    <BotIcon size={20} />
                  </div>
                )}

                <div className={`message-content-wrapper ${msg.sender === 'user' ? 'user-style' : 'agent-style'}`}>
                  <div className="message-header-meta">
                    <span className="sender-name">
                      {msg.sender === 'user' ? 'Fisherman / Vessel Operator' : 'NAMAMI Marine Intelligence AI'}
                    </span>
                    <span className="msg-timestamp">{msg.timestamp}</span>
                  </div>

                  <p className="message-text-body">{msg.text}</p>

                  {/* Rich Solution Response Card */}
                  {msg.sender === 'agent' && msg.verdict && (
                    <div className="copilot-embedded-card">
                      <NamamiResponseCard
                        message={msg}
                        onActionClick={handleActionRedirect}
                        currentLanguage={currentLanguage}
                      />
                    </div>
                  )}

                  {/* Message Footer with TTS Button */}
                  {msg.sender === 'agent' && (
                    <div className="message-action-footer">
                      <button
                        type="button"
                        onClick={() => handleSpeakTTS(msg.id, msg.text)}
                        className={`btn-msg-audio ${activeSpeakingId === msg.id ? 'speaking' : ''}`}
                        title="Play Indic Voice Audio (BHASHINI)"
                      >
                        <Volume2Icon size={15} />
                        <span>{activeSpeakingId === msg.id ? 'Speaking Audio...' : 'Listen Voice Audio'}</span>
                      </button>

                      {/* Quick Navigation Redirect Pills */}
                      <div className="msg-deep-links-group">
                        <Link href="/map" className="msg-deep-link radar">
                          <RadarIcon size={13} /> <span>Open Radar</span>
                        </Link>
                        <Link href="/safety" className="msg-deep-link safety">
                          <ShieldIcon size={13} /> <span>Safety Details</span>
                        </Link>
                        <Link href="/pfz" className="msg-deep-link pfz">
                          <FishIcon size={13} /> <span>PFZ Grounds</span>
                        </Link>
                        <Link href="/route" className="msg-deep-link route">
                          <NavigationIcon size={13} /> <span>A* Route</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="conversation-message-bubble-row agent-side">
                <div className="copilot-avatar-icon processing">
                  <BotIcon size={20} className="icon-spin-subtle" />
                </div>
                <div className="message-content-wrapper agent-style processing-card">
                  <div className="processing-indicator">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                    <span className="processing-text">
                      Synthesizing INCOIS OSF, Oceansat-3, IMD Mausam, and PostGIS geofence envelopes...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Prompt Chips (All 8 PRD Questions) */}
          <div className="chat-preset-chips-deck">
            <span className="preset-label">Typical Inquiries (Click to Ask):</span>
            <button
              type="button"
              onClick={() => handleSendMessage('Where is the nearest Potential Fishing Zone (PFZ) today?')}
              className="prompt-chip"
            >
              🐟 1. Nearest PFZ Today
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Is it safe to venture into the sea tomorrow morning?')}
              className="prompt-chip"
            >
              🛡️ 2. Tomorrow Morning Safety
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('What are the tide, weather, and sea conditions near my fishing location?')}
              className="prompt-chip"
            >
              🌊 3. Tide, Weather & Sea State
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Are there any lightning or cyclone alerts in my area?')}
              className="prompt-chip"
            >
              ⚡ 4. Lightning & Cyclone Alerts
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Which regions show high chlorophyll concentration and favourable sea surface temperature?')}
              className="prompt-chip"
            >
              🛰️ 5. Chlorophyll & SST Gradients
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('What is the safest route for a fishing vessel considering weather and sea-state conditions?')}
              className="prompt-chip"
            >
              🧭 6. A* Safest Navigational Route
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Why has fish productivity declined in a particular coastal region?')}
              className="prompt-chip"
            >
              🔬 7. Fishery Shift & Decline Reason
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Which fishing zones should be avoided due to hazardous marine conditions or geofencing restrictions?')}
              className="prompt-chip"
            >
              🛑 8. Hazard & Geofence Avoidance
            </button>
          </div>

          {/* Sticky Bottom Input Bar */}
          <div className="chat-sticky-bottom-bar">
            <div className="chat-input-pill-wrapper">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputQuery);
                }}
                placeholder={`Ask NAMAMI in ${currentLanguage.toUpperCase()} (e.g. 'Is sea safe tomorrow?', 'Nearest PFZ?')...`}
                className="chat-primary-text-input"
              />

              <div className="chat-input-buttons-row">
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`btn-chat-mic ${isListeningMic ? 'listening-active' : ''}`}
                  title="Voice Query (BHASHINI Speech-to-Text)"
                >
                  <MicIcon size={20} />
                  {isListeningMic && <span className="mic-soundwave-anim" />}
                </button>

                <button
                  type="button"
                  onClick={handleDetectGps}
                  className="btn-chat-gps"
                  title="GPS Locate Vessel"
                >
                  <MapPinIcon size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage(inputQuery)}
                  disabled={!inputQuery.trim() || isProcessing}
                  className="btn-chat-submit"
                >
                  <SendIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
