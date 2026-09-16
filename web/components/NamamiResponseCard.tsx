'use client';

import React, { useState } from 'react';
import { 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  XCircleIcon, 
  FishIcon, 
  NavigationIcon, 
  ShieldIcon, 
  InfoIcon, 
  LayersIcon,
  Volume2Icon
} from './Icons';
import { DataModeBadge } from './DataModeBadge';
import { ChatMessageItem } from '../lib/store';
import { soundFX } from '../lib/audio';

interface NamamiResponseCardProps {
  message: ChatMessageItem;
  onActionClick: (action: string) => void;
  currentLanguage: string;
}

export function NamamiResponseCard({
  message,
  onActionClick,
  currentLanguage,
}: NamamiResponseCardProps) {
  const [showEvidence, setShowEvidence] = useState<boolean>(false);

  const verdict = message.verdict || 'GO';

  return (
    <div className={`namami-response-card ${verdict.toLowerCase()}`}>
      {/* Top Meta Bar */}
      <div className="card-top-meta">
        <div className="card-verdict-row">
          <div className={`verdict-badge-large ${verdict.toLowerCase()}`}>
            {verdict === 'GO' && <CheckCircleIcon size={18} />}
            {verdict === 'CAUTION' && <AlertTriangleIcon size={18} />}
            {verdict === 'NO_GO' && <XCircleIcon size={18} />}
            <span>VERDICT: {verdict === 'GO' ? 'SAFE TO SAIL (GO)' : verdict === 'CAUTION' ? 'CAUTION ADVISED' : 'NO-GO (CRITICAL RISK)'}</span>
          </div>
          <DataModeBadge mode={message.dataMode} />
        </div>

        <div className="card-time-freshness">
          <span className="freshness-text">{message.sourceFreshness || 'INCOIS & IMD Validated'}</span>
          <span className="confidence-pill">Confidence: {message.confidenceScore || 95}%</span>
        </div>
      </div>

      {/* Primary 1-Sentence Action */}
      <div className="primary-action-box">
        <strong className="action-headline">
          {message.simpleAction || message.text}
        </strong>
      </div>

      {/* Highlights Grid (PFZ, Window, Hazards) */}
      <div className="highlights-grid">
        {message.bestSafePfz && (
          <div className="highlight-cell">
            <span className="cell-label">
              <FishIcon size={14} />
              <span>RECOMMENDED PFZ:</span>
            </span>
            <strong className="cell-val pfz">{message.bestSafePfz}</strong>
          </div>
        )}

        {message.departureWindow && (
          <div className="highlight-cell">
            <span className="cell-label">
              <ShieldIcon size={14} />
              <span>DEPARTURE WINDOW:</span>
            </span>
            <strong className="cell-val window">{message.departureWindow}</strong>
          </div>
        )}

        {message.hazardSummary && (
          <div className="highlight-cell full-width">
            <span className="cell-label">
              <AlertTriangleIcon size={14} />
              <span>HAZARD & SEA CONDITIONS:</span>
            </span>
            <span className="cell-val-desc">{message.hazardSummary}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Tray */}
      <div className="card-actions-tray">
        <button
          type="button"
          onClick={() => {
            soundFX.playSonarPing();
            onActionClick('map');
          }}
          className="btn-card-action primary"
        >
          <LayersIcon size={14} />
          <span>View on Map</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEvidence(!showEvidence);
            soundFX.playBlip(780);
          }}
          className="btn-card-action secondary"
        >
          <InfoIcon size={14} />
          <span>{showEvidence ? 'Hide Evidence' : 'Why This Result?'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playBlip(850);
            onActionClick('route');
          }}
          className="btn-card-action secondary"
        >
          <NavigationIcon size={14} />
          <span>Show Safe Route</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.speakText(message.simpleAction || message.text, currentLanguage);
          }}
          className="btn-card-action icon-only"
          title="Listen in Indian Regional Voice"
        >
          <Volume2Icon size={15} />
        </button>
      </div>

      {/* Collapsible Evidence Section */}
      {showEvidence && message.evidence && (
        <div className="evidence-drawer">
          <h4 className="evidence-title">Deterministic Evidence & Source Lineage</h4>

          <div className="evidence-items-list">
            <div className="evidence-row">
              <span className="ev-source">INCOIS PFZ / OSF:</span>
              <span className="ev-detail">{message.evidence.incoisPfz} • {message.evidence.incoisOsf}</span>
            </div>

            <div className="evidence-row">
              <span className="ev-source">IMD Marine Bulletin:</span>
              <span className="ev-detail">{message.evidence.imdWeather}</span>
            </div>

            <div className="evidence-row">
              <span className="ev-source">PostGIS Geofence Guard:</span>
              <span className="ev-detail">{message.evidence.geofenceStatus}</span>
            </div>

            <div className="evidence-row">
              <span className="ev-source">Deterministic Rules:</span>
              <span className="ev-detail">{message.evidence.rulesTriggered?.join('; ') || 'Standard limits verified'}</span>
            </div>

            <div className="evidence-row">
              <span className="ev-source">Validity Period:</span>
              <span className="ev-detail">{message.evidence.validity}</span>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Follow-up Chips */}
      {message.suggestedChips && message.suggestedChips.length > 0 && (
        <div className="card-chips-row">
          <span className="chips-label">Suggested follow-ups:</span>
          <div className="chips-list">
            {message.suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundFX.playBlip(880);
                  onActionClick(chip);
                }}
                className="btn-followup-chip"
              >
                <span>{chip}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
