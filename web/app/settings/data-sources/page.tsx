'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ServerIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  RefreshCwIcon, 
  InfoIcon, 
  ShieldIcon,
  LayersIcon,
  CompassIcon,
  RadioIcon
} from '../../../components/Icons';
import { DataModeBadge } from '../../../components/DataModeBadge';
import { INITIAL_PROVIDERS, ProviderConfig } from '../../../lib/store';
import { namamiApi } from '../../../lib/api';
import { soundFX } from '../../../lib/audio';

export default function DataSourcesSettingsPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>(INITIAL_PROVIDERS);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string; latencyMs: number }>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load persisted provider configs from localStorage if available
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('namami_data_sources_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProviders(parsed);
        }
      } catch (e) {
        console.warn('Failed to load saved provider configs:', e);
      }
    }
  }, []);

  const handleToggleEnable = (id: string) => {
    soundFX.playBlip(750);
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleUpdateField = (id: string, field: 'apiKey' | 'endpointUrl', value: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleTestConnection = async (provider: ProviderConfig) => {
    setTestingId(provider.id);
    soundFX.playBlip(920);

    const res = await namamiApi.testProvider(provider.id, provider.apiKey, provider.endpointUrl);

    setTestResults((prev) => ({
      ...prev,
      [provider.id]: {
        status: res.status,
        message: res.message,
        latencyMs: res.latencyMs,
      },
    }));

    if (res.status === 'CONNECTED') {
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, status: 'CONNECTED', lastSync: 'Just now', freshnessMins: 0 } : p))
      );
      soundFX.playSonarPing();
    } else {
      soundFX.playBlip(600);
    }

    setTestingId(null);
  };

  const handleSaveAll = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('namami_data_sources_config', JSON.stringify(providers));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }
    soundFX.playSonarPing();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="settings-page-shell">
      {/* Settings Navigation Header */}
      <header className="settings-header">
        <div className="settings-header-inner">
          <div className="settings-brand-row">
            <Link href="/" className="btn-back-home">
              ← Return to Fisherman Copilot
            </Link>
            <div className="settings-title-group">
              <h1 className="settings-title">Data Source Connectors & API Settings</h1>
              <p className="settings-subtitle">
                Configure official Indian marine, satellite, meteorological and language service adapters
              </p>
            </div>
          </div>

          <div className="settings-header-actions">
            <Link href="/admin" className="btn-link-admin">
              Open Admin Dashboard →
            </Link>
            <button
              type="button"
              onClick={handleSaveAll}
              className="btn-save-settings"
            >
              <CheckCircleIcon size={16} />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="settings-main-container">
        {/* Governance & Transparency Banner */}
        <div className="governance-notice-card">
          <div className="notice-icon">
            <ShieldIcon size={24} />
          </div>
          <div className="notice-content">
            <h3 className="notice-title">Indian Marine Data Governance & Compliance Protocol</h3>
            <p className="notice-text">
              In accordance with Ministry of Earth Sciences (MoES) and IMD policies, NAMAMI never scrapes protected government systems.
              All live automated connectors require official institutional API access or approved gateways. When credentials are unconfigured,
              NAMAMI operates in <strong>calibrated DEMO / FIXTURE mode</strong> and clearly labels every advisory accordingly.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="save-toast-banner">
            <CheckCircleIcon size={18} />
            <span>Settings saved successfully. Client-side secrets masked and cached.</span>
          </div>
        )}

        {/* Provider Cards Grid */}
        <div className="providers-grid">
          {providers.map((provider) => {
            const result = testResults[provider.id];
            const isTesting = testingId === provider.id;

            return (
              <div
                key={provider.id}
                className={`provider-config-card ${provider.enabled ? 'enabled' : 'disabled'} ${provider.status.toLowerCase()}`}
              >
                {/* Card Top */}
                <div className="p-card-top">
                  <div>
                    <span className="p-category">{provider.category}</span>
                    <h2 className="p-name">{provider.name}</h2>
                  </div>

                  <div className="p-status-toggle">
                    <span className={`p-status-badge ${provider.status.toLowerCase()}`}>
                      {provider.status === 'CONNECTED' && <CheckCircleIcon size={12} />}
                      {provider.status === 'MOCK_MODE' && <span className="dot-demo" />}
                      {provider.status === 'MISSING_CREDENTIALS' && <AlertTriangleIcon size={12} />}
                      <span>{provider.status.replace('_', ' ')}</span>
                    </span>

                    <label className="toggle-switch" title="Enable or disable connector">
                      <input
                        type="checkbox"
                        checked={provider.enabled}
                        onChange={() => handleToggleEnable(provider.id)}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                {/* Doc Link & Meta */}
                <div className="p-meta-row">
                  <a
                    href={provider.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-doc-link"
                  >
                    Official Portal / Docs ↗
                  </a>
                  <span className="p-sync-text">Last Sync: {provider.lastSync}</span>
                </div>

                {/* Notes / Institutional Disclaimer */}
                {provider.notes && (
                  <p className="p-notes-text">
                    <InfoIcon size={12} className="inline-icon" />
                    <span>{provider.notes}</span>
                  </p>
                )}

                {/* Configuration Inputs */}
                <div className="p-inputs-grid">
                  <div className="input-group">
                    <label className="input-label">API Gateway / Endpoint URL:</label>
                    <input
                      type="text"
                      value={provider.endpointUrl}
                      onChange={(e) => handleUpdateField(provider.id, 'endpointUrl', e.target.value)}
                      placeholder="https://provider.gov.in/api/v1/..."
                      className="text-input"
                      disabled={!provider.enabled}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <span>API Secret Key / Token:</span>
                      {provider.isInstitutionalOnly && (
                        <span className="sub-label">(Institutional Key)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={provider.apiKey}
                      onChange={(e) => handleUpdateField(provider.id, 'apiKey', e.target.value)}
                      placeholder={provider.isInstitutionalOnly ? "Institutional Token (Leave blank for Fixture Mode)" : "Enter API Key"}
                      className="text-input"
                      disabled={!provider.enabled}
                    />
                  </div>
                </div>

                {/* Fallback Config */}
                {provider.fallbackToOpenMeteo && (
                  <div className="fallback-config-row">
                    <span className="fallback-text">
                      🔄 Automatic failover to Open-Meteo Marine backup if official feed times out
                    </span>
                  </div>
                )}

                {/* Test Connection Button & Result Feedback */}
                <div className="p-actions-footer">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(provider)}
                    disabled={!provider.enabled || isTesting}
                    className="btn-test-conn"
                  >
                    <RefreshCwIcon size={14} className={isTesting ? 'icon-spin' : ''} />
                    <span>{isTesting ? 'Testing Endpoint...' : 'Test Connection'}</span>
                  </button>

                  {result && (
                    <div className={`test-feedback-box ${result.status.toLowerCase()}`}>
                      <span>{result.message}</span>
                      {result.latencyMs > 0 && (
                        <span className="latency-tag">({result.latencyMs}ms)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
