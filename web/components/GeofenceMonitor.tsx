'use client';

import React, { useState } from 'react';
import { 
  ShieldAlertIcon, 
  ShieldIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  Volume2Icon, 
  NavigationIcon, 
  ActivityIcon,
  LayersIcon
} from './Icons';
import { soundFX } from '../lib/audio';
import { GEOFENCE_ZONES, GeofenceZone, VesselProfile } from '../lib/marineData';

interface GeofenceMonitorProps {
  vesselPos: { lat: number; lng: number };
  onUpdateVesselPos: (pos: { lat: number; lng: number }) => void;
  nearestImblDistanceKm: number;
  selectedVessel: VesselProfile;
}

export function GeofenceMonitor({
  vesselPos,
  onUpdateVesselPos,
  nearestImblDistanceKm,
  selectedVessel,
}: GeofenceMonitorProps) {
  const [alertLogs, setAlertLogs] = useState<{
    id: string;
    timestamp: string;
    zoneName: string;
    distanceKm: number;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    channel: string;
    status: string;
  }[]>([
    {
      id: 'log-001',
      timestamp: '11:42:10 IST',
      zoneName: 'Indo-Sri Lanka IMBL (Palk Bay)',
      distanceKm: 4.8,
      severity: 'WARNING',
      channel: 'NavIC Broadcast / FCM Push',
      status: 'DELIVERED & ACKNOWLEDGED',
    },
    {
      id: 'log-002',
      timestamp: '09:15:30 IST',
      zoneName: 'Gulf of Mannar Marine National Park',
      distanceKm: 8.2,
      severity: 'INFO',
      channel: 'Local Offline Pack GPS Guard',
      status: 'LOGGED LOCAL',
    },
  ]);

  const isCritical = nearestImblDistanceKm <= 3.0;
  const isWarning = nearestImblDistanceKm <= 5.0 && !isCritical;

  const handleSimulateBoundaryApproach = () => {
    // Relocate vessel close to Palk Bay IMBL (Lat 9.80, Lng 79.48) ~ 3.4 km from boundary
    onUpdateVesselPos({ lat: 9.80, lng: 79.48 });
    soundFX.playEmergencySiren();

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString() + ' IST',
      zoneName: 'Indo-Sri Lanka IMBL (Palk Bay)',
      distanceKm: 3.4,
      severity: 'CRITICAL' as const,
      channel: 'Acoustic Siren + SMS Emergency Guard',
      status: 'IMMEDIATE ALARM TRIGGERED',
    };

    setAlertLogs((prev) => [newLog, ...prev]);
  };

  const handleResetToSafeWaters = () => {
    onUpdateVesselPos({ lat: 9.96, lng: 76.24 });
    soundFX.playSonarPing();
  };

  return (
    <div className="geofence-monitor-container">
      {/* Header */}
      <div className="geofence-header">
        <div className="geofence-title-group">
          <ShieldAlertIcon size={24} className="geofence-icon-glow" />
          <div>
            <h2 className="geofence-title">Proactive Geofence & Boundary Warning System</h2>
            <p className="geofence-subtitle">
              PostGIS Spatial Proximity Guard • 0-Tolerance IMBL Protection • Multi-Channel Alert Dispatch
            </p>
          </div>
        </div>

        <div className="geofence-actions">
          <button
            type="button"
            onClick={handleSimulateBoundaryApproach}
            className="btn-test-boundary-danger"
          >
            <ShieldAlertIcon size={16} />
            <span>Simulate Approaching IMBL (Trigger Alarm)</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSafeWaters}
            className="btn-reset-safe"
          >
            <span>Return to Safe Waters</span>
          </button>
        </div>
      </div>

      {/* Real-time Distance Status Banner */}
      <div className={`boundary-alert-banner ${isCritical ? 'critical' : isWarning ? 'warning' : 'safe'}`}>
        <div className="banner-icon-col">
          {isCritical || isWarning ? <AlertTriangleIcon size={32} className="hazard-pulse" /> : <CheckCircleIcon size={32} />}
        </div>
        <div className="banner-content">
          <h3 className="banner-title">
            {isCritical
              ? 'CRITICAL WARNING: VESSEL WITHIN 3 KM OF INTERNATIONAL BOUNDARY LINE (IMBL)!'
              : isWarning
              ? 'CAUTION: VESSEL ENTERING 5 KM IMBL WARNING BUFFER!'
              : 'GEOFENCE STATUS: VESSEL OPERATING SAFELY IN INDIAN EXCLUSIVE ECONOMIC ZONE (EEZ)'}
          </h3>
          <p className="banner-desc">
            Current distance to Indo-Sri Lanka IMBL is <strong>{nearestImblDistanceKm.toFixed(1)} km</strong>.
            {isWarning || isCritical
              ? ' Immediate action required: Alter course to 270° (West) towards Indian territorial waters to avoid international arrest/seizure.'
              : ' Maintain designated fishing corridors and avoid Marine Protected Area boundaries.'}
          </p>
        </div>
        <div className="banner-distance-pill">
          <span className="dist-num">{nearestImblDistanceKm.toFixed(1)}</span>
          <span className="dist-unit">KM TO IMBL</span>
        </div>
      </div>

      {/* Geofence Zones Grid */}
      <div className="geofence-grid-row">
        {/* Monitored Zones List */}
        <div className="geofence-card zones-list-card">
          <h3 className="card-heading">
            <LayersIcon size={16} />
            <span>Monitored Geospatial Geofence Zones</span>
          </h3>

          <div className="zones-list">
            {GEOFENCE_ZONES.map((zone) => (
              <div key={zone.id} className="zone-item-row">
                <div className="zone-color-indicator" style={{ backgroundColor: zone.color }} />
                <div className="zone-info-block">
                  <div className="zone-name-row">
                    <strong className="zone-name">{zone.name}</strong>
                    <span className="zone-type-badge">{zone.type}</span>
                  </div>
                  <p className="zone-restrictions">{zone.restrictions}</p>
                  <span className="zone-threshold">Buffer Warning Distance: {zone.warningDistanceKm} km</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proactive Delivery Attempts & Audit Logs */}
        <div className="geofence-card logs-card">
          <h3 className="card-heading">
            <ActivityIcon size={16} />
            <span>Alert Delivery Attempts & Audit Trail</span>
          </h3>

          <div className="logs-list">
            {alertLogs.map((log) => (
              <div key={log.id} className={`log-entry-row ${log.severity.toLowerCase()}`}>
                <div className="log-top">
                  <span className="log-time">{log.timestamp}</span>
                  <span className={`log-severity ${log.severity.toLowerCase()}`}>{log.severity}</span>
                </div>
                <strong className="log-zone">{log.zoneName}</strong>
                <div className="log-footer">
                  <span className="log-channel">{log.channel}</span>
                  <span className="log-status">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
