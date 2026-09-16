'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ServerIcon, 
  ActivityIcon, 
  LayersIcon, 
  ShieldIcon, 
  CompassIcon, 
  BotIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  RefreshCwIcon,
  RadioIcon
} from '../../components/Icons';
import { DataModeBadge } from '../../components/DataModeBadge';
import { CONNECTOR_REGISTRY, ConnectorHealth } from '../../lib/marineData';
import { soundFX } from '../../lib/audio';

export default function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<'connectors' | 'traces' | 'voyages' | 'alerts'>('connectors');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorHealth | null>(null);

  const mockAgentTraces = [
    {
      id: 'trace_001',
      query: 'Where is the nearest PFZ today?',
      user: 'IND-KL-07-MM-4421 (Matsya Prabha)',
      timestamp: '12:15:30 IST',
      durationMs: 420,
      dagSteps: [
        { agent: 'Language Agent', status: 'OK', latencyMs: 45, output: 'Detected EN; normalized intent: P1_PROXIMITY' },
        { agent: 'Context Agent', status: 'OK', latencyMs: 15, output: 'Resolved coords (9.96°N, 76.24°E), Class: Trawler' },
        { agent: 'Planner Agent', status: 'OK', latencyMs: 25, output: 'Spawned fan-out: [Marine, Weather, Geofence, PFZ]' },
        { agent: 'Marine Agent', status: 'OK', latencyMs: 140, output: 'Fetched OSF WW3: 1.6m Hs, 14 kts wind' },
        { agent: 'PFZ Agent', status: 'OK', latencyMs: 110, output: 'Ranked candidate PFZ-SW-042 (Score: 94%)' },
        { agent: 'Deterministic Risk Engine', status: 'OK', latencyMs: 18, output: 'Verdict: GO (All safety limits met)' },
        { agent: 'Visualization Agent', status: 'OK', latencyMs: 35, output: 'Synthesized MapLibre layers & speech payload' },
      ]
    },
    {
      id: 'trace_002',
      query: 'Am I near the international boundary?',
      user: 'IND-TN-02-LL-9988 (Sagar Kripa)',
      timestamp: '11:58:10 IST',
      durationMs: 280,
      dagSteps: [
        { agent: 'Language Agent', status: 'OK', latencyMs: 38, output: 'Intent: P5_GEOFENCE_CHECK' },
        { agent: 'Geofence Agent', status: 'OK', latencyMs: 65, output: 'PostGIS distance: 14.8 km to IMBL-PALK-SRILANKA' },
        { agent: 'Deterministic Risk Engine', status: 'OK', latencyMs: 22, output: 'Verdict: GO (Buffer clearance > 5km)' },
      ]
    }
  ];

  return (
    <div className="admin-page-shell">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand-group">
            <Link href="/" className="btn-back-home">
              ← Return to Fisherman Copilot
            </Link>
            <div>
              <div className="admin-title-row">
                <h1 className="admin-title">NAMAMI Mission Control & Research Console</h1>
                <span className="admin-badge">Admin / Research Role</span>
              </div>
              <p className="admin-subtitle">
                Real-time telemetry, connector circuit breakers, multi-agent LangGraph traces & audit logs
              </p>
            </div>
          </div>

          <div className="admin-header-actions">
            <Link href="/settings/data-sources" className="btn-settings-link">
              Data Source Settings ⚙️
            </Link>
          </div>
        </div>

        {/* Section Tabs */}
        <nav className="admin-subnav">
          <button
            type="button"
            onClick={() => { setActiveSection('connectors'); soundFX.playBlip(750); }}
            className={`admin-nav-btn ${activeSection === 'connectors' ? 'active' : ''}`}
          >
            <ServerIcon size={16} />
            <span>Connector Health & Registry</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('traces'); soundFX.playBlip(750); }}
            className={`admin-nav-btn ${activeSection === 'traces' ? 'active' : ''}`}
          >
            <BotIcon size={16} />
            <span>Agent Workflow Traces (LangGraph)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('voyages'); soundFX.playBlip(750); }}
            className={`admin-nav-btn ${activeSection === 'voyages' ? 'active' : ''}`}
          >
            <CompassIcon size={16} />
            <span>Active Armed Voyages</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('alerts'); soundFX.playBlip(750); }}
            className={`admin-nav-btn ${activeSection === 'alerts' ? 'active' : ''}`}
          >
            <ActivityIcon size={16} />
            <span>Alert Delivery Audit Trail</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="admin-main-container">
        {/* SECTION 1: CONNECTORS */}
        {activeSection === 'connectors' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Official External Connectors Registry</h2>
              <span className="section-meta">7 Official & Fallback Adapters Active</span>
            </div>

            <div className="admin-grid-cards">
              {CONNECTOR_REGISTRY.map((conn) => (
                <div
                  key={conn.id}
                  onClick={() => {
                    setSelectedConnector(conn);
                    soundFX.playBlip(850);
                  }}
                  className="admin-connector-card"
                >
                  <div className="c-card-top">
                    <span className="c-cat">{conn.category}</span>
                    <span className="c-status healthy">
                      <CheckCircleIcon size={12} />
                      <span>{conn.status}</span>
                    </span>
                  </div>

                  <h3 className="c-name">{conn.name}</h3>
                  <p className="c-provider">{conn.provider}</p>

                  <div className="c-metrics-grid">
                    <div>
                      <span className="c-metric-k">LATENCY:</span>
                      <span className="c-metric-v">{conn.latencyMs} ms</span>
                    </div>
                    <div>
                      <span className="c-metric-k">FRESHNESS:</span>
                      <span className="c-metric-v">{conn.lastFetchTime}</span>
                    </div>
                    <div>
                      <span className="c-metric-k">CIRCUIT:</span>
                      <span className="c-metric-v safe">{conn.circuitBreaker}</span>
                    </div>
                  </div>

                  <span className="c-inspect-text">Inspect Raw Normalized Schema →</span>
                </div>
              ))}
            </div>

            {/* Modal */}
            {selectedConnector && (
              <div className="connector-modal-overlay" onClick={() => setSelectedConnector(null)}>
                <div className="connector-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <span className="modal-tag">{selectedConnector.category}</span>
                      <h3 className="modal-title">{selectedConnector.name}</h3>
                    </div>
                    <button type="button" onClick={() => setSelectedConnector(null)} className="btn-close-modal">✕</button>
                  </div>
                  <div className="modal-body">
                    <pre className="json-code">{JSON.stringify(selectedConnector.samplePayload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: AGENT TRACES */}
        {activeSection === 'traces' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Multi-Agent Execution DAG Traces</h2>
              <span className="section-meta">Deterministic State & Timing Audit</span>
            </div>

            <div className="traces-list">
              {mockAgentTraces.map((trace) => (
                <div key={trace.id} className="trace-card">
                  <div className="trace-header">
                    <div>
                      <span className="trace-id">{trace.id}</span>
                      <strong className="trace-query">&ldquo;{trace.query}&rdquo;</strong>
                      <span className="trace-user">{trace.user}</span>
                    </div>
                    <span className="trace-duration">{trace.durationMs} ms total</span>
                  </div>

                  <div className="trace-steps-table">
                    {trace.dagSteps.map((s, idx) => (
                      <div key={idx} className="trace-step-row">
                        <span className="step-num">#{idx + 1}</span>
                        <strong className="step-name">{s.agent}</strong>
                        <span className="step-latency">{s.latencyMs}ms</span>
                        <span className="step-output">{s.output}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: VOYAGES */}
        {activeSection === 'voyages' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Armed Coastal Voyages</h2>
              <span className="section-meta">Active Monitoring Schedulers</span>
            </div>

            <div className="voyages-table-box">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vessel</th>
                    <th>Operating Area</th>
                    <th>Departure</th>
                    <th>Safety Status</th>
                    <th>Offline Pack</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>M/V Matsya Prabha (IND-KL-07-MM-4421)</td>
                    <td>SW Sector 4 (Kochi Offing)</td>
                    <td>Tomorrow 05:30 IST</td>
                    <td><span className="badge-safe">ARMED & SAFE (GO)</span></td>
                    <td><code>sha256:7f8a9b2c3d4e</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: ALERTS */}
        {activeSection === 'alerts' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Proactive Alert Dispatch Logs</h2>
              <span className="section-meta">100% Delivery Audit Trail</span>
            </div>

            <div className="alerts-table-box">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event / Zone</th>
                    <th>Severity</th>
                    <th>Delivery Channel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>11:42:10 IST</td>
                    <td>Indo-Sri Lanka IMBL (Palk Bay)</td>
                    <td><span className="badge-warn">WARNING</span></td>
                    <td>NavIC Broadcast / FCM</td>
                    <td>DELIVERED & ACKNOWLEDGED</td>
                  </tr>
                  <tr>
                    <td>09:15:30 IST</td>
                    <td>Gulf of Mannar Marine National Park</td>
                    <td><span className="badge-info">INFO</span></td>
                    <td>Local Offline GPS Guard</td>
                    <td>LOGGED LOCAL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
