'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  BotIcon, 
  MicIcon, 
  SendIcon, 
  Volume2Icon, 
  VolumeXIcon, 
  ActivityIcon, 
  CheckCircleIcon, 
  InfoIcon, 
  ShieldAlertIcon, 
  FishIcon, 
  NavigationIcon, 
  CompassIcon 
} from './Icons';
import { soundFX } from '../lib/audio';
import { ChatMessage, AgentStep, TRANSLATIONS, VesselProfile, PFZNode } from '../lib/marineData';

interface AgentCopilotProps {
  currentLanguage: string;
  selectedVessel: VesselProfile;
  vesselPos: { lat: number; lng: number };
  nearestImblDistanceKm: number;
  onNavigateToTab: (tabId: string) => void;
  onSelectPfz: (pfz: PFZNode) => void;
}

export function AgentCopilot({
  currentLanguage,
  selectedVessel,
  vesselPos,
  nearestImblDistanceKm,
  onNavigateToTab,
  onSelectPfz,
}: AgentCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      timestamp: 'Just now',
      language: currentLanguage,
      text: "Namaste! I am NAMAMI Marine Copilot powered by BHASHINI & Agentic AI. Ask me about nearest PFZ fishing grounds, Go/Caution/No-Go safety forecasts, safe navigation routes, or IMBL boundary proximity in your preferred language.",
      translatedText: "नमस्ते! मैं नमामि समुद्री कोपायलट हूँ। मुझसे निकटतम मत्स्य क्षेत्र, मौसम सुरक्षा, सुरक्षित मार्ग या अंतर्राष्ट्रीय सीमा के बारे में पूछें।",
      safetyVerdict: 'GO',
      suggestedChips: [
        "Nearest PFZ today?",
        "Is it safe to go tomorrow morning?",
        "Show safe route to PFZ",
        "Am I near international boundary (IMBL)?"
      ],
      agentSteps: [
        { agent: "Language Agent", role: "BHASHINI IndicTrans2", status: "completed", executionTimeMs: 42, outputSummary: "Detected English / Hindi" },
        { agent: "Context Agent", role: "Vessel & Location Resolution", status: "completed", executionTimeMs: 12, outputSummary: `Resolved lat: ${vesselPos.lat}°N, lng: ${vesselPos.lng}°E` },
        { agent: "Planner Agent", role: "DAG Constructor", status: "completed", executionTimeMs: 25, outputSummary: "Created multi-agent task workflow" },
      ]
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [activeWorkflowDag, setActiveWorkflowDag] = useState<AgentStep[] | null>(null);
  const [selectedLedgerStep, setSelectedLedgerStep] = useState<AgentStep | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Execute Agentic Orchestration DAG
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    soundFX.playBlip(920);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: currentLanguage,
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // Build Execution DAG Steps
    const dagSteps: AgentStep[] = [
      {
        agent: "Language Agent (BHASHINI)",
        role: "ASR / NMT Translation & Intent Extraction",
        status: "running",
        executionTimeMs: 65,
        outputSummary: `Detected language [${currentLanguage.toUpperCase()}], normalized query`,
        details: { model: "IndicTrans2-v1", confidence: 0.98 }
      },
      {
        agent: "Context Agent",
        role: "Geodesic Anchor & Vessel Limits Resolver",
        status: "pending",
        executionTimeMs: 18,
        outputSummary: `Vessel: ${selectedVessel.name} (Max Wave: ${selectedVessel.maxWaveHeightM}m, Speed: ${selectedVessel.cruisingSpeedKnots}kts)`,
        details: { lat: vesselPos.lat, lng: vesselPos.lng, homePort: selectedVessel.homePort }
      },
      {
        agent: "Planner Agent",
        role: "LangGraph Dynamic Task Execution Planner",
        status: "pending",
        executionTimeMs: 34,
        outputSummary: "Parallel Fan-Out [Marine, Weather, Geofence, PFZ, Provenance]",
        details: { dagNodes: 5, parallelism: "true" }
      },
      {
        agent: "Marine Agent",
        role: "INCOIS OSF Wave, Wind & SST Extractor",
        status: "pending",
        executionTimeMs: 142,
        outputSummary: "Wave: 1.6m, Wind: 14 kts, SST: 28.4°C, Tide: +0.4m",
        details: { source: "INCOIS-WW3-v4.2", gridRes: "0.05 deg" }
      },
      {
        agent: "Weather Agent",
        role: "IMD Mausam & Cyclone Desk Sync",
        status: "pending",
        executionTimeMs: 185,
        outputSummary: "No active cyclone warning in SW Kerala sector. Moderate breeze.",
        details: { bulletin: "IMD-SW-BULLETIN-20260916", alertColor: "GREEN" }
      },
      {
        agent: "Geofence Agent",
        role: "PostGIS Spatial Proximity Engine",
        status: "pending",
        executionTimeMs: 48,
        outputSummary: `Distance to IMBL: ${nearestImblDistanceKm.toFixed(1)} km (Buffer: 5.0 km)`,
        details: { nearestZone: "Indo-Sri Lanka IMBL", status: nearestImblDistanceKm > 5 ? "SAFE" : "CAUTION" }
      },
      {
        agent: "PFZ Agent",
        role: "Thermal Front & Chlorophyll Catch Scorer",
        status: "pending",
        executionTimeMs: 110,
        outputSummary: "Top PFZ: Alappuzha-Kochi Thermal Front (Catch Score: 94/100)",
        details: { species: "Yellowfin Tuna, Mackerel", distanceKm: 46.2, bearingDeg: 242 }
      },
      {
        agent: "Deterministic Risk Engine",
        role: "Deterministic Safety Rules & Threshold Verification",
        status: "pending",
        executionTimeMs: 22,
        outputSummary: "Calculated Safety Verdict: GO (All thresholds satisfied)",
        details: { waveCheck: "PASS", windCheck: "PASS", geofenceCheck: "PASS", imdCheck: "PASS" }
      },
      {
        agent: "Route Optimizer Agent",
        role: "A* Least-Risk Navigation Graph",
        status: "pending",
        executionTimeMs: 85,
        outputSummary: "Generated 4-waypoint route avoiding restricted areas (ETA: 3h 15m)",
        details: { fuelSavingPercent: 14.2, obstacleClearanceKm: 8.5 }
      },
      {
        agent: "Visualization Agent",
        role: "GeoJSON Map & Multilingual Response Generator",
        status: "pending",
        executionTimeMs: 40,
        outputSummary: "Synthesized UI payload with follow-up action chips",
        details: { cards: ["PFZ Summary", "Safety Meter", "Route Geometry"] }
      }
    ];

    setActiveWorkflowDag(dagSteps);

    // Simulate multi-agent real-time progression
    for (let i = 0; i < dagSteps.length; i++) {
      await new Promise(r => setTimeout(r, 140));
      dagSteps[i].status = "completed";
      if (i + 1 < dagSteps.length) {
        dagSteps[i + 1].status = "running";
      }
      setActiveWorkflowDag([...dagSteps]);
    }

    // Determine tailored response based on user query
    let responseText = "";
    let verdict: 'GO' | 'CAUTION' | 'NO_GO' = 'GO';
    let chips: string[] = [];

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('pfz') || lowerQuery.includes('fish') || lowerQuery.includes('मत्स्य')) {
      responseText = `🐟 **Top Recommended Potential Fishing Zone (PFZ):**\n\n- **Target Zone:** Alappuzha-Kochi Thermal Front Alpha (Sector 4)\n- **Coordinates:** 9.68°N, 75.82°E (46.2 km @ Bearing 242°)\n- **Ocean Conditions:** SST 28.4°C, Chlorophyll 1.85 mg/m³, Depth 42m\n- **Predicted Species:** Yellowfin Tuna, Indian Mackerel, Oil Sardine\n- **Catch Probability:** 94/100 (High Pelagic Schooling Density)\n- **Safety Status:** **GO (Safe)**. Current waves (1.6m) are well within your ${selectedVessel.name}'s limit (${selectedVessel.maxWaveHeightM}m).`;
      chips = ["Show safe route to PFZ", "Check 24h wave forecast", "Arm voyage & download offline pack"];
      verdict = 'GO';
    } else if (lowerQuery.includes('safe') || lowerQuery.includes('tomorrow') || lowerQuery.includes('weather') || lowerQuery.includes('मौसम') || lowerQuery.includes('सुरक्षित')) {
      responseText = `🛡️ **Deterministic Marine Safety Assessment:**\n\n- **Safety Verdict:** **GO (SAFE FOR SAILING)**\n- **Live Ocean State:** Wave Height 1.6m (Limit: ${selectedVessel.maxWaveHeightM}m) | Wind Speed 14 kts (Limit: ${selectedVessel.maxWindSpeedKnots} kts)\n- **Optimal Departure Window:** Tomorrow 06:00 - 14:00 hrs IST.\n- **IMD Advisory:** Yellow Watch for evening squall after 18:00 hrs. Recommend returning before sunset.\n- **Data Freshness:** INCOIS OSF synced 5m ago (Confidence: 96%).`;
      chips = ["Nearest PFZ today?", "Inspect 24h departure window chart", "Am I near international boundary?"];
      verdict = 'GO';
    } else if (lowerQuery.includes('boundary') || lowerQuery.includes('imbl') || lowerQuery.includes('border') || lowerQuery.includes('सीमा')) {
      const isClose = nearestImblDistanceKm <= 5.0;
      verdict = isClose ? 'CAUTION' : 'GO';
      responseText = `🛑 **Geofence & Boundary Analysis:**\n\n- **Current Position:** ${vesselPos.lat.toFixed(4)}°N, ${vesselPos.lng.toFixed(4)}°E\n- **Nearest Boundary:** Indo-Sri Lanka International Maritime Boundary Line (IMBL)\n- **Distance to IMBL:** **${nearestImblDistanceKm.toFixed(1)} km**\n- **Status:** ${isClose ? '⚠️ **CAUTION:** You are within the 5 km warning buffer! Maintain westerly course.' : '✅ **SAFE:** You are at a safe distance (>5 km) from the international maritime boundary.'}\n- **Active PostGIS Rule:** Strict boundary avoidance with acoustic sirens.`;
      chips = ["Show on tactical map", "Generate emergency return route", "Check nearest PFZ"];
    } else {
      responseText = `🧭 **Marine Advisory Response:**\n\nBased on your location (${vesselPos.lat.toFixed(2)}°N, ${vesselPos.lng.toFixed(2)}°E) and vessel profile (${selectedVessel.name}):\n- **Marine Verdict:** **GO (Normal Operations)**\n- **Wave & Wind:** 1.6m Hs / 14 kts wind\n- **Nearest PFZ:** 46.2 km west off Kochi\n- **Boundary Status:** Clear of IMBL and Marine Protected Areas.`;
      chips = ["Nearest PFZ today?", "Is it safe tomorrow morning?", "Show safe route"];
      verdict = 'GO';
    }

    const agentMsg: ChatMessage = {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: currentLanguage,
      text: responseText,
      safetyVerdict: verdict,
      suggestedChips: chips,
      agentSteps: dagSteps,
    };

    setMessages((prev) => [...prev, agentMsg]);
    setIsProcessing(false);
    soundFX.playSonarPing();
  };

  const handleSimulateMic = () => {
    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }
    setIsListeningMic(true);
    soundFX.playBlip(660);

    setTimeout(() => {
      setIsListeningMic(false);
      handleSendMessage("Nearest PFZ today?");
    }, 2200);
  };

  return (
    <div className="agent-copilot-container">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div className="copilot-title-row">
          <div className="copilot-avatar">
            <BotIcon size={22} className="bot-icon-glow" />
            <span className="copilot-live-dot" />
          </div>
          <div>
            <h2 className="copilot-title">BHASHINI Agentic Marine Copilot</h2>
            <span className="copilot-subtitle">
              Multi-Agent LangGraph DAG • INCOIS & IMD Data Fusion • Multilingual Voice
            </span>
          </div>
        </div>

        <div className="copilot-badge-group">
          <span className="copilot-chip-live">
            <ActivityIcon size={12} />
            <span>DAG ENGINE ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Split View: Chat Stream + Live Agent DAG Trace */}
      <div className="copilot-body-split">
        {/* Chat Stream Column */}
        <div className="chat-stream-panel">
          <div className="chat-messages-scroll">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.sender === 'user' ? 'user-msg' : 'agent-msg'}`}>
                {msg.sender === 'agent' && (
                  <div className="msg-avatar-badge">
                    <BotIcon size={16} />
                  </div>
                )}

                <div className="msg-bubble">
                  {msg.safetyVerdict && (
                    <div className={`verdict-pill ${msg.safetyVerdict.toLowerCase()}`}>
                      <CheckCircleIcon size={12} />
                      <span>VERDICT: {msg.safetyVerdict}</span>
                    </div>
                  )}

                  <div className="msg-text-content">
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} className="msg-paragraph">
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Audio TTS Button for Agent Message */}
                  {msg.sender === 'agent' && (
                    <div className="msg-footer-bar">
                      <button
                        type="button"
                        onClick={() => soundFX.speakText(msg.text.replace(/[*#]/g, ''), currentLanguage)}
                        className="btn-tts-listen"
                        title="Listen in Indian Voice (BHASHINI TTS)"
                      >
                        <Volume2Icon size={14} />
                        <span>Listen Voice</span>
                      </button>
                      <span className="msg-timestamp">{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Suggested Action Chips */}
                  {msg.suggestedChips && msg.suggestedChips.length > 0 && (
                    <div className="suggested-chips-tray">
                      {msg.suggestedChips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => {
                            if (chip.includes('route')) onNavigateToTab('route');
                            else if (chip.includes('map')) onNavigateToTab('map');
                            else if (chip.includes('offline') || chip.includes('pack')) onNavigateToTab('voyage');
                            else handleSendMessage(chip);
                          }}
                          className="action-chip"
                        >
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="chat-message-row agent-msg">
                <div className="msg-avatar-badge">
                  <BotIcon size={16} className="icon-pulse" />
                </div>
                <div className="msg-bubble processing-bubble">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="processing-text">
                    Orchestrating Marine Agents (INCOIS, IMD, PostGIS, Risk Engine)...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick PRD Prompts Bar */}
          <div className="quick-prompts-bar">
            <button
              type="button"
              onClick={() => handleSendMessage("Nearest PFZ today?")}
              className="quick-prompt-btn"
            >
              🐟 Nearest PFZ today?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Is it safe to go tomorrow morning?")}
              className="quick-prompt-btn"
            >
              🛡️ Safe tomorrow morning?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Show safe route to PFZ avoiding restricted zones")}
              className="quick-prompt-btn"
            >
              🧭 Safe route to PFZ
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Am I near the international boundary (IMBL)?")}
              className="quick-prompt-btn"
            >
              🛑 Check IMBL Boundary
            </button>
          </div>

          {/* Message Input Box */}
          <div className="chat-input-row">
            <button
              type="button"
              onClick={handleSimulateMic}
              className={`btn-mic ${isListeningMic ? 'mic-listening' : ''}`}
              title="Voice Mic Input (BHASHINI Speech-to-Text)"
            >
              <MicIcon size={20} />
              {isListeningMic && <span className="mic-pulse-ring" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputText);
              }}
              placeholder={`Ask NAMAMI in ${currentLanguage.toUpperCase()} (e.g. "Where is the nearest fishing zone?")`}
              className="chat-text-input"
            />

            <button
              type="button"
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isProcessing}
              className="btn-send-msg"
            >
              <SendIcon size={18} />
            </button>
          </div>
        </div>

        {/* Real-time Agent DAG Execution Trace Panel */}
        <div className="agent-dag-panel">
          <div className="dag-panel-header">
            <h3 className="dag-header-title">Multi-Agent Execution DAG (LangGraph)</h3>
            <span className="dag-header-badge">Deterministic Ledger</span>
          </div>

          <div className="dag-steps-list">
            {(activeWorkflowDag || messages[0].agentSteps || []).map((step, sIdx) => {
              const isSelected = selectedLedgerStep?.agent === step.agent;
              return (
                <div
                  key={sIdx}
                  onClick={() => {
                    setSelectedLedgerStep(step);
                    soundFX.playBlip(750);
                  }}
                  className={`dag-step-card ${step.status} ${isSelected ? 'selected' : ''}`}
                >
                  <div className="step-card-top">
                    <span className="step-number">#{sIdx + 1}</span>
                    <strong className="step-agent-name">{step.agent}</strong>
                    <span className={`step-status-tag ${step.status}`}>
                      {step.status.toUpperCase()} ({step.executionTimeMs}ms)
                    </span>
                  </div>

                  <p className="step-role-desc">{step.role}</p>
                  <div className="step-output-box">
                    <span>{step.outputSummary}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ledger Step Details Modal / Drawer */}
          {selectedLedgerStep && selectedLedgerStep.details && (
            <div className="dag-details-drawer">
              <div className="drawer-header">
                <strong>{selectedLedgerStep.agent} Contract Input/Output</strong>
                <button
                  type="button"
                  onClick={() => setSelectedLedgerStep(null)}
                  className="btn-close-drawer"
                >
                  ✕
                </button>
              </div>
              <pre className="ledger-json-code">
                {JSON.stringify(selectedLedgerStep.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
