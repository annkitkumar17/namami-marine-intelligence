'use client';

import React from 'react';
import { DataMode } from '../lib/store';

interface DataModeBadgeProps {
  mode: DataMode;
  showTooltip?: boolean;
  className?: string;
}

export function DataModeBadge({ mode, showTooltip = true, className = '' }: DataModeBadgeProps) {
  let label = 'DEMO / SIMULATED DATA';
  let pillClass = 'badge-demo';
  let dotClass = 'dot-demo';
  let tooltip = 'Displaying pre-configured official Indian marine fixtures for demonstration and testing.';

  switch (mode) {
    case 'LIVE':
      label = 'LIVE DATA';
      pillClass = 'badge-live';
      dotClass = 'dot-live';
      tooltip = 'Real-time verified data fetched directly from official Indian marine/weather APIs.';
      break;
    case 'CACHED':
      label = 'CACHED DATA';
      pillClass = 'badge-cached';
      dotClass = 'dot-cached';
      tooltip = 'Recently synchronized and validated marine data stored in local/redis cache.';
      break;
    case 'DEMO':
      label = 'DEMO / SIMULATED DATA';
      pillClass = 'badge-demo';
      dotClass = 'dot-demo';
      tooltip = 'Displaying calibrated official fixture datasets. Configure API keys in Settings to enable Live mode.';
      break;
    case 'UNAVAILABLE':
      label = 'DATA UNAVAILABLE';
      pillClass = 'badge-unavailable';
      dotClass = 'dot-unavailable';
      tooltip = 'The official provider endpoint could not be reached. Safety cannot be unconditionally guaranteed.';
      break;
  }

  return (
    <span
      className={`data-mode-badge ${pillClass} ${className}`}
      title={showTooltip ? tooltip : undefined}
    >
      <span className={`badge-dot ${dotClass}`} />
      <span className="badge-text">{label}</span>
    </span>
  );
}
