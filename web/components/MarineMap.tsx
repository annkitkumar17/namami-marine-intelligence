'use client';

import React, { useState } from 'react';
import { MarineMapLibre } from './MarineMapLibre';
import { PFZNode, VesselProfile } from '../lib/marineData';

interface MarineMapProps {
  vesselPos: { lat: number; lng: number };
  onUpdateVesselPos: (pos: { lat: number; lng: number }) => void;
  selectedPfz: PFZNode | null;
  onSelectPfz: (pfz: PFZNode) => void;
  selectedVessel: VesselProfile;
  nearestImblDistanceKm: number;
  activeRoute: {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    waypoints: { lat: number; lng: number; step: string; waveM: number; windKts: number }[];
    totalDistanceKm: number;
    etaMinutes: number;
    riskScore: number;
  } | null;
  onSelectDestination?: (dest: { lat: number; lng: number; name: string }) => void;
}

export function MarineMap(props: MarineMapProps) {
  return <MarineMapLibre {...props} />;
}
