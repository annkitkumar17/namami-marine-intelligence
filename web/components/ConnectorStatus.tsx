'use client';

import React, { useState } from 'react';
import { 
  ActivityIcon, 
  ServerIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  RefreshCwIcon, 
  InfoIcon, 
  ExternalLinkIcon,
  SatelliteIcon 
} from './Icons';
import { soundFX } from '../lib/audio';
import { CONNECTOR_REGISTRY, ConnectorHealth } from '../lib/marineData';

export function ConnectorStatus() {
  const [connectors, setConnectors] = useState<ConnectorHealth[]>(CONNECTOR_REGISTRY);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    soundFX.playBlip(980);
    await new Promise(r => setTimeout(r, 700));

    setConnectors((prev) =>
      prev.map((c) => ({
        ...c,
        latencyMs: Math.floor(Math.random() * 120) + 40,
        lastFetchTime: 'Just now',
        freshnessMins: 0,
      }))
    );
    setIsRefreshing(false);
    soundFX.playSonarPing();
  };

  return (
    <div className="connector-registry-container">
      {/* Header */}
      <div className="connector-header">
        <div className="connector-title-group">
          <ServerIcon size={24} className="server-icon-glow" />
          <div>
            <h2 className="connector-title">External Marine Data Connectors & Provider Registry</h2>
            <p className="connector-subtitle">
              INCOIS • IMD Mausam • ISRO Bhoonidhi • BHASHINI AI • NavIC Ephemeris
            </p>
          </div>
        </div>

        <div className="connector-actions">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="btn-refresh-connectors"
          >
            <RefreshCwIcon size={16} className={isRefreshing ? 'icon-spin' : ''} />
            <span>{isRefreshing ? 'Pinging Endpoints...' : 'Ping All Connectors'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Connectors */}
      <div className="connector-grid">
        {connectors.map((conn) => (
          <div
            key={conn.id}
            onClick={() => {
              setSelectedConnector(conn);
              soundFX.playBlip(850);
            }}
            className={`connector-card ${conn.status.toLowerCase()}`}
          >
            <div className="conn-card-top">
              <div>
                <span className="conn-category-tag">{conn.category}</span>
                <h3 className="conn-name">{conn.name}</h3>
              </div>
              <span className={`conn-status-badge ${conn.status.toLowerCase()}`}>
                <CheckCircleIcon size={12} />
                <span>{conn.status}</span>
              </span>
            </div>

            <p className="conn-provider">{conn.provider}</p>

            <div className="conn-metrics-row">
              <div className="metric-pill">
                <span className="pill-label">LATENCY</span>
                <span className="pill-val">{conn.latencyMs} ms</span>
              </div>
              <div className="metric-pill">
                <span className="pill-label">FRESHNESS</span>
                <span className="pill-val">{conn.lastFetchTime}</span>
              </div>
              <div className="metric-pill">
                <span className="pill-label">CIRCUIT BREAKER</span>
                <span className="pill-val closed">{conn.circuitBreaker}</span>
              </div>
            </div>

            <div className="conn-card-footer">
              <span className="conn-inspect-link">Click to Inspect JSON Payload & Schema →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Payload Modal / Drawer */}
      {selectedConnector && (
        <div className="connector-modal-overlay" onClick={() => setSelectedConnector(null)}>
          <div className="connector-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-tag">{selectedConnector.category}</span>
                <h3 className="modal-title">{selectedConnector.name}</h3>
                <p className="modal-provider">{selectedConnector.provider}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConnector(null)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-meta-grid">
                <div>
                  <span className="meta-k">Endpoint URL:</span>
                  <a href={selectedConnector.url} target="_blank" rel="noreferrer" className="meta-v link">
                    {selectedConnector.url}
                  </a>
                </div>
                <div>
                  <span className="meta-k">Circuit Breaker:</span>
                  <span className="meta-v">{selectedConnector.circuitBreaker}</span>
                </div>
                <div>
                  <span className="meta-k">Ping Latency:</span>
                  <span className="meta-v">{selectedConnector.latencyMs} ms</span>
                </div>
                <div>
                  <span className="meta-k">Data Mode:</span>
                  <span className="meta-v">FIXTURE / OFFICIAL ADAPTER ACTIVE</span>
                </div>
              </div>

              <div className="json-viewer-box">
                <div className="json-viewer-header">
                  <span>Normalized Output Payload Schema</span>
                </div>
                <pre className="json-code">
                  {JSON.stringify(selectedConnector.samplePayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
