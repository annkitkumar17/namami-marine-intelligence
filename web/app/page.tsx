'use client';

import React, { useState } from 'react';
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
  ActivityIcon,
  SparklesIcon,
  ChevronRightIcon
} from '../components/Icons';
import { soundFX } from '../lib/audio';
import { 
  VESSEL_PROFILES, 
  VesselProfile 
} from '../lib/marineData';
import { ChatMessageItem, DataMode } from '../lib/store';
import { namamiApi } from '../lib/api';

export default function ConversationalCopilotPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile>(VESSEL_PROFILES[0]);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [vesselPos, setVesselPos] = useState<{ lat: number; lng: number }>({ lat: 9.96, lng: 76.24 });
  const nearestImblDistanceKm = 14.8;

  // Conversational Messages State
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      timestamp: '12:00 IST',
      language: 'en',
      text: 'Namaste! I am NAMAMI, your autonomous marine intelligence co-pilot. How can I assist your voyage today?',
      dataMode: 'LIVE',
      verdict: 'GO',
      simpleAction: 'Favorable sea conditions today off Kochi. Best fishing departure window is tomorrow 06:00 - 14:00 IST.',
      bestSafePfz: 'Alappuzha-Kochi Thermal Front Alpha (Sector 4)',
      departureWindow: 'Tomorrow 06:00 - 14:00 IST',
      hazardSummary: 'Wave: 1.6m (Within 2.8m limit) • Wind: 14 kts • No active cyclone warnings',
      confidenceScore: 96,
      sourceFreshness: 'INCOIS OSF / IMD Mausam (5m ago)',
      evidence: {
        incoisPfz: 'Oceansat-3 & AVHRR Thermal Front (Catch Score: 94%)',
        incoisOsf: 'WW3-v4.2: 1.6m wave height < 2.8m vessel threshold',
        imdWeather: 'IMD Coastal Warning: Green Category (Normal)',
        geofenceStatus: '14.8 km clearance from Indo-Sri Lanka IMBL',
        rulesTriggered: ['Rule V4.2: Wave threshold satisfied', 'Rule G1: Boundary clearance confirmed'],
        validity: 'Valid for next 24 Hours',
      },
      suggestedChips: [
        'Nearest Safe PFZ today?',
        'Is it safe to venture into sea tomorrow morning?',
        'Show safe route avoiding restricted zones',
        'Am I near the International Maritime Boundary Line?',
      ],
    }
  ]);

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

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
  };

  const handleMicClick = () => {
    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }
    setIsListeningMic(true);
    soundFX.playBlip(680);

    setTimeout(() => {
      setIsListeningMic(false);
      handleSendMessage('Nearest Safe PFZ today?');
    }, 2200);
  };

  const handleSpeakTTS = (msgId: string, text: string) => {
    if (activeSpeakingId === msgId) {
      setActiveSpeakingId(null);
      return;
    }
    setActiveSpeakingId(msgId);
    soundFX.playBlip(1040);
    setTimeout(() => {
      setActiveSpeakingId(null);
    }, 3500);
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
        nearestImblDistanceKm={nearestImblDistanceKm}
      />

      {/* 2. Conversational Hero Section */}
      <section className="copilot-hero-deck">
        <div className="copilot-hero-wrapper">
          <div className="copilot-badge-row">
            <span className="copilot-agent-badge">
              <SparklesIcon size={14} /> <span>Autonomous Agentic Marine AI</span>
            </span>
            <span className="copilot-bhashini-tag">
              10 Indian Marine Dialects (BHASHINI)
            </span>
          </div>

          <h1 className="copilot-hero-headline">
            Where would you like to venture today?
          </h1>
          <p className="copilot-hero-subhead">
            Ask voice or text queries on nearest high-catch PFZ, sea safety, wave forecasts, least-risk routing, and IMBL border guards.
          </p>

          {/* 4 Solution Launcher Cards (Click to Redirect) */}
          <div className="solution-launchers-grid">
            <Link href="/pfz" className="solution-launcher-card pfz">
              <div className="s-card-icon pfz"><FishIcon size={22} /></div>
              <div className="s-card-body">
                <div className="s-card-title">
                  <span>Nearest Safe PFZ</span>
                  <ChevronRightIcon size={16} />
                </div>
                <p>High-yield thermal fronts & catch score</p>
              </div>
            </Link>

            <Link href="/safety" className="solution-launcher-card safety">
              <div className="s-card-body">
                <div className="s-card-title">
                  <span>Is It Safe Tomorrow?</span>
                  <ChevronRightIcon size={16} />
                </div>
                <p>24-hr wave & wind Go/No-Go limits</p>
              </div>
              <div className="s-card-icon safety"><ShieldIcon size={22} /></div>
            </Link>

            <Link href="/route" className="solution-launcher-card route">
              <div className="s-card-icon route"><NavigationIcon size={22} /></div>
              <div className="s-card-body">
                <div className="s-card-title">
                  <span>A* Safe Route</span>
                  <ChevronRightIcon size={16} />
                </div>
                <p>Least-risk corridor avoiding hazards</p>
              </div>
            </Link>

            <Link href="/geofence" className="solution-launcher-card boundary">
              <div className="s-card-body">
                <div className="s-card-title">
                  <span>Check Boundary</span>
                  <ChevronRightIcon size={16} />
                </div>
                <p>IMBL 5km proximity & audio alarm</p>
              </div>
              <div className="s-card-icon boundary"><ShieldAlertIcon size={22} /></div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Main Conversational Platform UI */}
      <main className="conversation-platform-container">
        <div className="conversation-stream-deck">
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
                      {msg.sender === 'user' ? 'Fisherman / Vessel Operator' : 'NAMAMI Marine Co-pilot'}
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
                        <span>{activeSpeakingId === msg.id ? 'Speaking Audio...' : 'Listen in Audio'}</span>
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
                      Evaluating INCOIS OSF, IMD Mausam, and PostGIS geofence envelopes...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Prompt Chips */}
          <div className="chat-preset-chips-deck">
            <span className="preset-label">Suggested Prompts:</span>
            <button
              type="button"
              onClick={() => handleSendMessage('Nearest Safe PFZ today?')}
              className="prompt-chip"
            >
              🐟 Nearest Safe PFZ
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Is it safe to venture into sea tomorrow morning?')}
              className="prompt-chip"
            >
              🛡️ Tomorrow Morning Safety
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Show safe route to PFZ avoiding restricted zones')}
              className="prompt-chip"
            >
              🧭 Safe Route & Fuel Savings
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Am I near the International Maritime Boundary Line?')}
              className="prompt-chip"
            >
              🚨 Check Boundary Clearance
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
                placeholder="Ask NAMAMI anything in your language (e.g. 'Is sea safe tomorrow?', 'Nearest PFZ?')..."
                className="chat-primary-text-input"
              />

              <div className="chat-input-buttons-row">
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`btn-chat-mic ${isListeningMic ? 'listening-active' : ''}`}
                  title="Voice Query (BHASHINI 10 Languages)"
                >
                  <MicIcon size={20} />
                  {isListeningMic && <span className="mic-soundwave" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVesselPos({ lat: 9.96, lng: 76.24 });
                    soundFX.playBlip(1020);
                  }}
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
