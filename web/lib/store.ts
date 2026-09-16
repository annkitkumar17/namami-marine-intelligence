import { Coordinates, VesselProfile, VESSEL_PROFILES, PFZNode, PFZ_ZONES } from './marineData';

export type DataMode = 'LIVE' | 'CACHED' | 'DEMO' | 'UNAVAILABLE';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  language: string;
  text: string;
  dataMode: DataMode;
  verdict?: 'GO' | 'CAUTION' | 'NO_GO';
  simpleAction?: string;
  bestSafePfz?: string;
  departureWindow?: string;
  hazardSummary?: string;
  confidenceScore?: number;
  sourceFreshness?: string;
  evidence?: {
    incoisPfz?: string;
    incoisOsf?: string;
    imdWeather?: string;
    bhoonidhiSat?: string;
    geofenceStatus?: string;
    rulesTriggered?: string[];
    validity?: string;
  };
  suggestedChips?: string[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  category: string;
  docUrl: string;
  status: 'CONNECTED' | 'MISSING_CREDENTIALS' | 'DISABLED' | 'ERROR' | 'MOCK_MODE';
  enabled: boolean;
  apiKey: string;
  endpointUrl: string;
  lastSync: string;
  freshnessMins: number;
  isInstitutionalOnly?: boolean;
  notes?: string;
  fallbackToOpenMeteo?: boolean;
}

export const INITIAL_PROVIDERS: ProviderConfig[] = [
  {
    id: 'incois-pfz',
    name: 'INCOIS Potential Fishing Zone (PFZ)',
    category: 'Fisheries Advisory',
    docUrl: 'https://incois.gov.in/MarineFisheries/TextDataHome',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://incois.gov.in/api/v1/pfz',
    lastSync: '10 mins ago',
    freshnessMins: 10,
    isInstitutionalOnly: true,
    notes: 'Official MoES integration. Requires institutional MoU for live automated endpoint access.',
  },
  {
    id: 'incois-osf',
    name: 'INCOIS Ocean State Forecast (OSF)',
    category: 'Wave & Wind Forecast',
    docUrl: 'https://incois.gov.in/site/services/osf.jsp',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://incois.gov.in/api/v1/osf',
    lastSync: '15 mins ago',
    freshnessMins: 15,
    isInstitutionalOnly: true,
    fallbackToOpenMeteo: true,
    notes: 'High-resolution WaveWatch-III modeling for Indian EEZ.',
  },
  {
    id: 'imd-mausam',
    name: 'IMD Mausam Marine & Cyclone Desk',
    category: 'Cyclone & Weather Warning',
    docUrl: 'https://mausam.imd.gov.in/',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://mausam.imd.gov.in/api/marine',
    lastSync: '25 mins ago',
    freshnessMins: 25,
    isInstitutionalOnly: true,
    notes: 'IMD Coastal Warning bulletins and Nowcasts.',
  },
  {
    id: 'imd-cap',
    name: 'IMD CAP / WIS2 Global Warning Feed',
    category: 'Machine-Readable Alert Broker',
    docUrl: 'https://wis2boxstdby.imd.gov.in/',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://wis2boxstdby.imd.gov.in/oapi/collections',
    lastSync: '30 mins ago',
    freshnessMins: 30,
    notes: 'WMO Standard OASIS-CAP XML/JSON alert discovery.',
  },
  {
    id: 'isro-bhoonidhi',
    name: 'ISRO Bhoonidhi Earth Observation & NISAR',
    category: 'Satellite Imagery & SAR',
    docUrl: 'https://bhoonidhi.nrsc.gov.in/NISAR/',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://bhoonidhi.nrsc.gov.in/api/v1/search',
    lastSync: '1 hour ago',
    freshnessMins: 60,
    isInstitutionalOnly: true,
    notes: 'NRSC/ISRO data portal for Oceansat-3, Resourcesat, and NISAR.',
  },
  {
    id: 'bhashini',
    name: 'BHASHINI Indic Language AI (MeitY)',
    category: 'Speech & Translation AI',
    docUrl: 'https://bhashini.gov.in/ulca',
    status: 'MOCK_MODE',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
    lastSync: '5 mins ago',
    freshnessMins: 5,
    notes: 'National Language Translation Mission ASR/NMT/TTS APIs.',
  },
  {
    id: 'open-meteo',
    name: 'Open-Meteo Marine Forecast (Fallback)',
    category: 'Public Marine Forecast Backup',
    docUrl: 'https://open-meteo.com/en/docs/marine-weather-api',
    status: 'CONNECTED',
    enabled: true,
    apiKey: 'public-no-key-required',
    endpointUrl: 'https://marine-api.open-meteo.com/v1/marine',
    lastSync: 'Just now',
    freshnessMins: 0,
    notes: 'Free public marine backup. Clearly labeled as FALLBACK when used.',
  },
  {
    id: 'map-tiles',
    name: 'MapLibre Vector Map Tiles & PMTiles',
    category: 'Geospatial Basemap',
    docUrl: 'https://maplibre.org/',
    status: 'CONNECTED',
    enabled: true,
    apiKey: '',
    endpointUrl: 'https://demotiles.maplibre.org/style.json',
    lastSync: 'Active',
    freshnessMins: 0,
    notes: 'Offline-ready vector bathymetry and coastline basemap.',
  },
  {
    id: 'firebase-fcm',
    name: 'Firebase Cloud Messaging (FCM)',
    category: 'Proactive Push Notifications',
    docUrl: 'https://firebase.google.com/docs/cloud-messaging',
    status: 'MOCK_MODE',
    enabled: false,
    apiKey: '',
    endpointUrl: 'https://fcm.googleapis.com/v1/projects/',
    lastSync: 'Disabled',
    freshnessMins: 0,
    notes: 'Proactive alert dispatch for armed voyages entering hazard zones.',
  },
];
