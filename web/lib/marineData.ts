export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PFZNode {
  id: string;
  name: string;
  sector: string;
  lat: number;
  lng: number;
  depthM: number;
  sstCelsius: number;
  chlorophyllMgM3: number;
  distanceKm: number;
  bearingDeg: number;
  status: 'ACTIVE' | 'CAUTION' | 'SUSPENDED';
  speciesLikely: string[];
  catchScore: number; // 0-100
  fuelIndex: string;
  issuedAt: string;
  validTo: string;
  source: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'IMBL' | 'MPA' | 'RESTRICTED' | 'CYCLONE_WARNING';
  color: string;
  warningDistanceKm: number;
  points: Coordinates[];
  restrictions: string;
  state: 'ALERT' | 'CLEAR' | 'CAUTION';
}

export interface VesselProfile {
  id: string;
  name: string;
  type: string;
  lengthMeters: number;
  cruisingSpeedKnots: number;
  maxWaveHeightM: number;
  maxWindSpeedKnots: number;
  engineHp: number;
  crewCount: number;
  callSign: string;
  homePort: string;
}

export interface ConnectorHealth {
  id: string;
  name: string;
  provider: string;
  category: 'PFZ' | 'OSF' | 'WEATHER' | 'SATELLITE' | 'LANGUAGE' | 'NAVIGATION';
  url: string;
  status: 'HEALTHY' | 'DEGRADED' | 'MOCK_FIXTURE';
  latencyMs: number;
  lastFetchTime: string;
  freshnessMins: number;
  circuitBreaker: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  samplePayload: any;
}

export interface ForecastHour {
  hour: string;
  waveHeightM: number;
  windSpeedKnots: number;
  swellPeriodSec: number;
  sstCelsius: number;
  rainMm: number;
  currentKnots: number;
  safetyVerdict: 'GO' | 'CAUTION' | 'NO_GO';
}

export interface AgentStep {
  agent: string;
  role: string;
  status: 'completed' | 'running' | 'pending';
  executionTimeMs: number;
  outputSummary: string;
  details?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  language: string;
  text: string;
  translatedText?: string;
  intent?: string;
  safetyVerdict?: 'GO' | 'CAUTION' | 'NO_GO';
  suggestedChips?: string[];
  agentSteps?: AgentStep[];
  evidence?: Record<string, any>;
}

// Translations for 7 Indian Languages
export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    appTitle: "NAMAMI Marine Intelligence",
    appSubtitle: "Autonomous Ocean Safety & Advisory Network (SIH 2026)",
    mapTab: "Tactical Map & Radar",
    copilotTab: "Agentic Copilot",
    riskTab: "Deterministic Safety Risk",
    pfzTab: "PFZ Fisheries Hub",
    routeTab: "Safe Navigation (A*)",
    geofenceTab: "Geofence & IMBL Alerts",
    voyageTab: "Armed Voyage & Offline Pack",
    connectorsTab: "Admin Connectors",
    liveTelemetry: "Live Telemetry",
    vessel: "Vessel",
    homePort: "Home Port",
    statusGo: "SAFE FOR SAILING",
    statusCaution: "CAUTION ADVISED",
    statusNoGo: "NO-GO (CRITICAL HAZARD)",
    nearestPfz: "Nearest PFZ",
    distanceToImbl: "Distance to IMBL",
    waveHeight: "Wave Height",
    windSpeed: "Wind Speed",
    sst: "Sea Temp (SST)",
    armingVoyage: "Arm Voyage",
    offlinePackReady: "Offline Pack Ready",
    sirenToggle: "Audio Siren",
    airplaneMode: "Simulate Offline Mode",
  },
  hi: {
    appTitle: "नमामि समुद्री खुफिया मंच",
    appSubtitle: "स्वायत्त महासागर सुरक्षा एवं परामर्श नेटवर्क (SIH 2026)",
    mapTab: "सामरिक नक्शा और रडार",
    copilotTab: "एआई कोपायलट",
    riskTab: "सुरक्षा जोखिम मूल्यांकन",
    pfzTab: "मत्स्य क्षेत्र (PFZ)",
    routeTab: "सुरक्षित मार्ग (A*)",
    geofenceTab: "अंतर्राष्ट्रीय सीमा चेतावनी",
    voyageTab: "सशस्त्र यात्रा और ऑफलाइन पैक",
    connectorsTab: "कनेक्टर स्थिति",
    liveTelemetry: "सक्रिय टेलीमेट्री",
    vessel: "नाव / जहाज",
    homePort: "गृह बंदरगाह",
    statusGo: "सुरक्षित (जाने योग्य)",
    statusCaution: "सावधानी बरतें",
    statusNoGo: "खतरा (समुद्र में न जाएं)",
    nearestPfz: "निकटतम मत्स्य क्षेत्र",
    distanceToImbl: "अंतर्राष्ट्रीय सीमा से दूरी",
    waveHeight: "लहरों की ऊंचाई",
    windSpeed: "हवा की गति",
    sst: "समुद्र का तापमान",
    armingVoyage: "यात्रा सुरक्षित करें",
    offlinePackReady: "ऑफलाइन पैक तैयार",
    sirenToggle: "अलार्म सायरन",
    airplaneMode: "ऑफलाइन मोड अनुकरण",
  },
  ta: {
    appTitle: "நமாமி கடல்சார் நுண்ணறிவு",
    appSubtitle: "தன்னியக்க கடல் பாதுகாப்பு மற்றும் ஆலோசனை நெட்வொர்க்",
    mapTab: "தந்திரோபாய வரைபடம் & ரேடார்",
    copilotTab: "AI கடல் பைலட்",
    riskTab: "பாதுகாப்பு இடர் மதிப்பீடு",
    pfzTab: "மீன்பிடி மண்டலங்கள் (PFZ)",
    routeTab: "பாதுகாப்பான வழிசெலுத்தல்",
    geofenceTab: "IMBL எல்லை எச்சரிக்கை",
    voyageTab: "பயண பாதுகாப்பு பேக்",
    connectorsTab: "இணைப்பான் நிலை",
    liveTelemetry: "நேரலை தரவு",
    vessel: "படகின் வகை",
    homePort: "முகப்பு துறைமுகம்",
    statusGo: "கடலுக்கு செல்ல பாதுகாப்பானது",
    statusCaution: "எச்சரிக்கையுடன் செல்லவும்",
    statusNoGo: "கடலுக்கு செல்ல வேண்டாம்",
    nearestPfz: "அருகிலுள்ள PFZ மண்டலம்",
    distanceToImbl: "IMBL எல்லைக்கான தூரம்",
    waveHeight: "அலை உயரம்",
    windSpeed: "காற்றின் வேகம்",
    sst: "கடல் மேற்பரப்பு வெப்பநிலை",
    armingVoyage: "பயணத்தை செயல்படுத்து",
    offlinePackReady: "ஆஃப்லைன் பேக் தயார்",
    sirenToggle: "எச்சரிக்கை சைரன்",
    airplaneMode: "ஆஃப்லைன் பயன்முறை",
  },
  ml: {
    appTitle: "നമാമി സമുദ്ര ഇന്റലിജൻസ്",
    appSubtitle: "ഓട്ടോണമസ് സമുദ്ര സുരക്ഷാ ശൃംഖല",
    mapTab: "റഡാർ മാപ്പ്",
    copilotTab: "എഐ സഹായകൻ",
    riskTab: "സുരക്ഷാ വിശകലനം",
    pfzTab: "മത്സ്യബന്ധന മേഖല (PFZ)",
    routeTab: "സുരക്ഷിത റൂട്ട്",
    geofenceTab: "അന്താരാഷ്ട്ര അതിർത്തി അലർട്ട്",
    voyageTab: "ഓഫ്‌ലൈൻ പാക്ക്",
    connectorsTab: "കണക്ടറുകൾ",
    liveTelemetry: "തത്സമയ വിവരങ്ങൾ",
    vessel: "ബോട്ട്",
    homePort: "ഹാർബർ",
    statusGo: "കടലിൽ പോകാൻ സുരക്ഷിതം",
    statusCaution: "ശ്രദ്ധിക്കുക",
    statusNoGo: "കടലിൽ പോകരുത്",
    nearestPfz: "അടുത്തുള്ള PFZ",
    distanceToImbl: "അതിർത്തിയിലേക്കുള്ള ദൂരം",
    waveHeight: "തിരമാല ഉയരം",
    windSpeed: "കാറ്റിന്റെ വേഗത",
    sst: "താപനില",
    armingVoyage: "യാത്ര ആരംഭിക്കുക",
    offlinePackReady: "ഓഫ്‌ലൈൻ തയ്യാർ",
    sirenToggle: "സൈറൺ",
    airplaneMode: "ഓഫ്‌ലൈൻ മോഡ്",
  },
  te: {
    appTitle: "నమామి సముద్ర ఇంటెలిజెన్స్",
    appSubtitle: "సముద్ర భద్రత మరియు సలహా నెట్‌వర్క్",
    mapTab: "మ్యాప్ & రాడార్",
    copilotTab: "AI కోపైలట్",
    riskTab: "భద్రతా ప్రమాద అంచనా",
    pfzTab: "చేపల వేట జోన్ (PFZ)",
    routeTab: "సురక్షిత మార్గం",
    geofenceTab: "సరిహద్దు హెచ్చరిక (IMBL)",
    voyageTab: "ఆఫ్‌లైన్ ప్యాక్",
    connectorsTab: "కనెక్టర్లు",
    liveTelemetry: "ప్రత్యక్ష సమాచారం",
    vessel: "పడవ",
    homePort: "ఓడరేవు",
    statusGo: "వేటకు సురక్షితం",
    statusCaution: "జాగ్రత్త అవసరం",
    statusNoGo: "వేటకు వెళ్లవద్దు",
    nearestPfz: "సమీప PFZ",
    distanceToImbl: "సరిహద్దు దూరం",
    waveHeight: "అలల ఎత్తు",
    windSpeed: "గాలి వేగం",
    sst: "ఉష్ణోగ్రత",
    armingVoyage: "ప్రయాణం సిద్ధం",
    offlinePackReady: "ఆఫ్‌లైన్ సిద్ధం",
    sirenToggle: "హెచ్చరిక సైరన్",
    airplaneMode: "ఆఫ్‌లైన్ మోడ్",
  },
  bn: {
    appTitle: "নমামি সামুদ্রিক বুদ্ধিমত্তা",
    appSubtitle: "স্বায়ত্তশাসিত সমুদ্র নিরাপত্তা নেটওয়ার্ক",
    mapTab: "ম্যাপ ও রাডার",
    copilotTab: "এআই কোপাইলট",
    riskTab: "নিরাপত্তা ঝুঁকি মূল্যায়ন",
    pfzTab: "মৎস্য অঞ্চল (PFZ)",
    routeTab: "নিরাপদ রুট (A*)",
    geofenceTab: "আন্তর্জাতিক সীমানা সতর্কতা",
    voyageTab: "অফলাইন নেভিগেশন প্যাক",
    connectorsTab: "সংযোজক স্থিতি",
    liveTelemetry: "লাইভ টেলিমეტ্রি",
    vessel: "নৌকা",
    homePort: "হোম পোর্ট",
    statusGo: "সমুদ্রে যাওয়ার জন্য নিরাপদ",
    statusCaution: "সতর্কতা অবলম্বন করুন",
    statusNoGo: "বিপদ! সমুদ্রে যাবেন না",
    nearestPfz: "নিকটতম PFZ জোন",
    distanceToImbl: "আন্তর্জাতিক সীমানার দূরত্ব",
    waveHeight: "ঢেউয়ের উচ্চতা",
    windSpeed: "বাতাসের গতি",
    sst: "সমুদ্রের তাপমাত্রা",
    armingVoyage: "যাত্রা প্রস্তুত করুন",
    offlinePackReady: "অফলাইন প্যাক প্রস্তুত",
    sirenToggle: "সাইরেন",
    airplaneMode: "অফলাইন মোড",
  },
  gu: {
    appTitle: "નમામિ દરિયાઈ ગુપ્તચર મંચ",
    appSubtitle: "સ્વાયત્ત સમુદ્ર સુરક્ષા નેટવર્ક",
    mapTab: "નકશો અને રડાર",
    copilotTab: "AI કોપાયલટ",
    riskTab: "સુરક્ષા જોખમ મૂલ્યાંકન",
    pfzTab: "મત્સ્ય ઝોન (PFZ)",
    routeTab: "સલામત માર્ગ",
    geofenceTab: "આંતરરાષ્ટ્રીય સીમા ચેતવણી",
    voyageTab: "ઓફલાઇન પેક",
    connectorsTab: "કનેક્ટર સ્થિતિ",
    liveTelemetry: "લાઇવ ટેલિમેટ્રી",
    vessel: "બોટ",
    homePort: "બંદર",
    statusGo: "સફર માટે સલામત",
    statusCaution: "સાવચેતી રાખવી",
    statusNoGo: "જોખમી - દરિયામાં ન જવું",
    nearestPfz: "નજીકનું PFZ ઝોન",
    distanceToImbl: "સીમાથી અંતર",
    waveHeight: "મોજાંની ઊંચાઈ",
    windSpeed: "પવનની ગતિ",
    sst: "સમુદ્ર તાપમાન",
    armingVoyage: "યાત્રા શરૂ કરો",
    offlinePackReady: "ઓફલાઇન પેક તૈયાર",
    sirenToggle: "સાયરન",
    airplaneMode: "ઓફલાઇન મોડ",
  }
};

// Major Indian Coastal Ports
export const PORTS = [
  { id: 'kochi', name: 'Kochi Port (Cochin)', state: 'Kerala', lat: 9.96, lng: 76.24, maxDepth: 14.5 },
  { id: 'mumbai', name: 'Mumbai Harbor', state: 'Maharashtra', lat: 18.94, lng: 72.85, maxDepth: 12.0 },
  { id: 'chennai', name: 'Chennai Port (Kasimedu)', state: 'Tamil Nadu', lat: 13.12, lng: 80.30, maxDepth: 16.0 },
  { id: 'vizag', name: 'Visakhapatnam Port', state: 'Andhra Pradesh', lat: 17.69, lng: 83.30, maxDepth: 18.1 },
  { id: 'porbandar', name: 'Porbandar Port', state: 'Gujarat', lat: 21.64, lng: 69.60, maxDepth: 10.5 },
  { id: 'kanyakumari', name: 'Kanyakumari / Colachel', state: 'Tamil Nadu', lat: 8.08, lng: 77.55, maxDepth: 9.0 },
  { id: 'mangalore', name: 'New Mangalore Port', state: 'Karnataka', lat: 12.92, lng: 74.81, maxDepth: 13.5 },
  { id: 'paradip', name: 'Paradip Port', state: 'Odisha', lat: 20.26, lng: 86.67, maxDepth: 15.0 },
];

// Potential Fishing Zones (INCOIS PFZ Adviories)
export const PFZ_ZONES: PFZNode[] = [
  {
    id: 'PFZ-SW-042',
    name: 'Alappuzha-Kochi Thermal Front Alpha',
    sector: 'Kerala Coast (SW Sector 4)',
    lat: 9.68,
    lng: 75.82,
    depthM: 42,
    sstCelsius: 28.4,
    chlorophyllMgM3: 1.85,
    distanceKm: 46.2,
    bearingDeg: 242,
    status: 'ACTIVE',
    speciesLikely: ['Indian Mackerel', 'Yellowfin Tuna', 'Oil Sardine'],
    catchScore: 94,
    fuelIndex: 'Optimal (28 L)',
    issuedAt: '2026-09-16T04:30:00Z',
    validTo: '2026-09-17T18:00:00Z',
    source: 'INCOIS PFZ Multichannel AVHRR/MODIS',
  },
  {
    id: 'PFZ-SW-045',
    name: 'Wadge Bank Pelagic Cluster',
    sector: 'Kanyakumari-Wadge Bank (Sector 7)',
    lat: 7.75,
    lng: 77.20,
    depthM: 68,
    sstCelsius: 27.9,
    chlorophyllMgM3: 2.12,
    distanceKm: 88.5,
    bearingDeg: 195,
    status: 'ACTIVE',
    speciesLikely: ['Skipjack Tuna', 'Kingfish (Seer)', 'Carangids'],
    catchScore: 98,
    fuelIndex: 'High Yield (54 L)',
    issuedAt: '2026-09-16T04:30:00Z',
    validTo: '2026-09-17T18:00:00Z',
    source: 'INCOIS PFZ & Oceansat-3 OCM',
  },
  {
    id: 'PFZ-SE-019',
    name: 'Palk Strait North-East Front',
    sector: 'Tamil Nadu Palk Bay (Caution Zone)',
    lat: 9.72,
    lng: 79.45,
    depthM: 18,
    sstCelsius: 29.1,
    chlorophyllMgM3: 1.45,
    distanceKm: 32.1,
    bearingDeg: 78,
    status: 'CAUTION',
    speciesLikely: ['Blue Swimming Crab', 'Squid', 'Silver Pomfret'],
    catchScore: 78,
    fuelIndex: 'Close Proximity (16 L)',
    issuedAt: '2026-09-16T04:30:00Z',
    validTo: '2026-09-17T18:00:00Z',
    source: 'INCOIS PFZ & Landsat-9 OLI',
  },
  {
    id: 'PFZ-NW-088',
    name: 'Veraval Offing Deep Front',
    sector: 'Saurashtra Coast (Sector 2)',
    lat: 20.65,
    lng: 69.95,
    depthM: 55,
    sstCelsius: 26.8,
    chlorophyllMgM3: 1.95,
    distanceKm: 64.0,
    bearingDeg: 215,
    status: 'ACTIVE',
    speciesLikely: ['Ribbon Fish', 'Croaker', 'Cuttlefish'],
    catchScore: 89,
    fuelIndex: 'Moderate (42 L)',
    issuedAt: '2026-09-16T04:30:00Z',
    validTo: '2026-09-17T18:00:00Z',
    source: 'INCOIS PFZ & Bhoonidhi EOS-06',
  },
  {
    id: 'PFZ-EC-053',
    name: 'Coromandel Eddy Front',
    sector: 'Puducherry-Chennai Offing',
    lat: 12.35,
    lng: 80.55,
    depthM: 85,
    sstCelsius: 28.7,
    chlorophyllMgM3: 1.62,
    distanceKm: 52.8,
    bearingDeg: 120,
    status: 'ACTIVE',
    speciesLikely: ['Barracuda', 'Sailfish', 'Mahi Mahi (Dorado)'],
    catchScore: 91,
    fuelIndex: 'Optimal (34 L)',
    issuedAt: '2026-09-16T04:30:00Z',
    validTo: '2026-09-17T18:00:00Z',
    source: 'INCOIS PFZ Advisory',
  },
];

// Geofence & Boundary Zones
export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'IMBL-PALK-SRILANKA',
    name: 'Indo-Sri Lanka International Maritime Boundary Line (IMBL)',
    type: 'IMBL',
    color: '#ef4444',
    warningDistanceKm: 5.0,
    restrictions: 'STRICT GEOFENCE: 0 tolerance crossing. Arrest & seizure risk under Sri Lanka Fisheries Act. Stay >5 km west.',
    state: 'ALERT',
    points: [
      { lat: 10.08, lng: 79.86 },
      { lat: 9.85, lng: 79.52 },
      { lat: 9.50, lng: 79.38 },
      { lat: 9.10, lng: 79.55 },
      { lat: 8.85, lng: 79.90 },
    ],
  },
  {
    id: 'IMBL-SIR-CREEK',
    name: 'India-Pakistan Maritime Boundary (Sir Creek / Kutch)',
    type: 'IMBL',
    color: '#ef4444',
    warningDistanceKm: 7.0,
    restrictions: 'HIGH SENSITIVITY DEFENSE SECTOR: Indian Coast Guard & Pakistan MSA surveillance. No unauthorized transit.',
    state: 'ALERT',
    points: [
      { lat: 23.65, lng: 68.05 },
      { lat: 23.30, lng: 67.80 },
      { lat: 22.80, lng: 67.35 },
      { lat: 22.20, lng: 66.80 },
    ],
  },
  {
    id: 'MPA-GULF-OF-MANNAR',
    name: 'Gulf of Mannar Marine National Park (UNESCO Biosphere)',
    type: 'MPA',
    color: '#06b6d4',
    warningDistanceKm: 3.0,
    restrictions: 'ECOLOGICALLY SENSITIVE: Bottom trawling, coral harvesting, and gillnetting strictly prohibited by Wildlife Protection Act.',
    state: 'CAUTION',
    points: [
      { lat: 9.25, lng: 79.15 },
      { lat: 9.15, lng: 79.30 },
      { lat: 8.80, lng: 78.85 },
      { lat: 8.95, lng: 78.60 },
    ],
  },
  {
    id: 'RESTRICTED-NAVAL-EXERCISE',
    name: 'Southern Naval Command Firing Range (W-44)',
    type: 'RESTRICTED',
    color: '#f59e0b',
    warningDistanceKm: 4.0,
    restrictions: 'ACTIVE NOTAM / NAVAREA VIII: Live naval gunnery practice scheduled 06:00-14:00 hrs. All civilian vessels must divert.',
    state: 'ALERT',
    points: [
      { lat: 9.40, lng: 75.50 },
      { lat: 9.40, lng: 75.80 },
      { lat: 9.10, lng: 75.80 },
      { lat: 9.10, lng: 75.50 },
    ],
  },
  {
    id: 'IMD-HAZARD-CYCLONE-CONE',
    name: 'IMD Deep Depression Warning Corridor (Bay of Bengal)',
    type: 'CYCLONE_WARNING',
    color: '#dc2626',
    warningDistanceKm: 15.0,
    restrictions: 'IMD RED ALERT: Deep depression gusting to 48 kts. Wave heights exceeding 4.2m. Total fishery suspension.',
    state: 'ALERT',
    points: [
      { lat: 14.50, lng: 82.00 },
      { lat: 15.80, lng: 83.50 },
      { lat: 15.10, lng: 84.80 },
      { lat: 13.80, lng: 83.20 },
    ],
  },
];

// Vessel Preset Classes
export const VESSEL_PROFILES: VesselProfile[] = [
  {
    id: 'vessel-trawler-45',
    name: 'M/V Matsya Prabha (IND-KL-07-MM-4421)',
    type: 'Mechanized Trawler (45 ft Steel Hull)',
    lengthMeters: 13.8,
    cruisingSpeedKnots: 8.5,
    maxWaveHeightM: 2.8,
    maxWindSpeedKnots: 26.0,
    engineHp: 180,
    crewCount: 6,
    callSign: 'VT-MP44',
    homePort: 'Kochi Port (Cochin)',
  },
  {
    id: 'vessel-obm-28',
    name: 'M/V Kadalamma (IND-KL-04-OB-1109)',
    type: 'Motorized Country Craft (OBM 28 ft FRP)',
    lengthMeters: 8.5,
    cruisingSpeedKnots: 7.0,
    maxWaveHeightM: 1.8,
    maxWindSpeedKnots: 18.0,
    engineHp: 25,
    crewCount: 3,
    callSign: 'VT-KD11',
    homePort: 'Kochi Port (Cochin)',
  },
  {
    id: 'vessel-longliner-65',
    name: 'M/V Sagar Kripa (IND-TN-02-LL-9988)',
    type: 'Deep Sea Tuna Longliner (65 ft)',
    lengthMeters: 19.8,
    cruisingSpeedKnots: 10.5,
    maxWaveHeightM: 3.8,
    maxWindSpeedKnots: 35.0,
    engineHp: 320,
    crewCount: 12,
    callSign: 'VT-SK99',
    homePort: 'Chennai Port (Kasimedu)',
  },
];

// External Data Connectors Registry (Phase 3 & 4 PRD)
export const CONNECTOR_REGISTRY: ConnectorHealth[] = [
  {
    id: 'incois-pfz',
    name: 'INCOIS Potential Fishing Zone (PFZ) Feed',
    provider: 'Indian National Centre for Ocean Information Services (MoES)',
    category: 'PFZ',
    url: 'https://incois.gov.in/MarineFisheries/TextDataHome',
    status: 'HEALTHY',
    latencyMs: 142,
    lastFetchTime: '5 mins ago',
    freshnessMins: 5,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      advisories_count: 128,
      satellites: ['NOAA-20', 'EOS-06 (Oceansat-3)', 'Suomi-NPP'],
      resolution_km: 1.0,
      validation_score: 0.96,
    },
  },
  {
    id: 'incois-osf',
    name: 'INCOIS Ocean State Forecast (OSF)',
    provider: 'INCOIS Wave & Current Modeling Division',
    category: 'OSF',
    url: 'https://incois.gov.in/site/services/osf.jsp',
    status: 'HEALTHY',
    latencyMs: 188,
    lastFetchTime: '12 mins ago',
    freshnessMins: 12,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      forecast_horizon_hrs: 72,
      grid_spacing_deg: 0.05,
      parameters: ['significant_wave_height', 'wind_speed_gust', 'surface_current', 'tide_prediction'],
      version: 'WW3-INCOIS-v4.2',
    },
  },
  {
    id: 'imd-mausam',
    name: 'IMD Mausam Marine & Cyclone Warning Desk',
    provider: 'India Meteorological Department (IMD)',
    category: 'WEATHER',
    url: 'https://mausam.imd.gov.in/imd_latest/contents/index_category.php/districtwisewarnings.php',
    status: 'HEALTHY',
    latencyMs: 215,
    lastFetchTime: '18 mins ago',
    freshnessMins: 18,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      bulletin_id: 'IMD-SW-BULLETIN-20260916',
      coastal_warning_flag: 'YELLOW_WATCH',
      squall_risk_knots: 32,
      nowcast_active: true,
    },
  },
  {
    id: 'imd-wis2-cap',
    name: 'IMD Machine-Readable CAP / WIS2 Global Broker',
    provider: 'WMO / IMD WIS2 Box Gateway',
    category: 'WEATHER',
    url: 'https://wis2boxstdby.imd.gov.in/oapi/collections/discovery-metadata/items',
    status: 'HEALTHY',
    latencyMs: 310,
    lastFetchTime: '22 mins ago',
    freshnessMins: 22,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      cap_format: 'OASIS-CAP-v1.2',
      event_type: 'MARINE_SQUALL_ALERT',
      urgency: 'Immediate',
      severity: 'Moderate',
    },
  },
  {
    id: 'isro-bhoonidhi',
    name: 'ISRO Bhoonidhi Earth Observation Catalog & NISAR SAR',
    provider: 'National Remote Sensing Centre (NRSC / ISRO)',
    category: 'SATELLITE',
    url: 'https://bhoonidhi.nrsc.gov.in/NISAR/',
    status: 'HEALTHY',
    latencyMs: 275,
    lastFetchTime: '35 mins ago',
    freshnessMins: 35,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      sensors: ['NISAR L-band SAR', 'Resourcesat-2A LISS-IV', 'EOS-04 C-band'],
      ocean_roughness_available: true,
      last_pass_timestamp: '2026-09-16T02:15:00Z',
    },
  },
  {
    id: 'bhashini-ulca',
    name: 'BHASHINI Indian Language AI Translation & Speech Engine',
    provider: 'Digital India Bhashini Division (MeitY)',
    category: 'LANGUAGE',
    url: 'https://bhashini.gov.in/ulca/model/explore-models',
    status: 'HEALTHY',
    latencyMs: 95,
    lastFetchTime: '1 min ago',
    freshnessMins: 1,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      supported_languages: 22,
      asr_models: ['IndicConformer-v2', 'Whisper-Indic-ASR'],
      nmt_models: ['IndicTrans2-v1'],
      tts_models: ['IndicTTS-FastPitch'],
    },
  },
  {
    id: 'navic-constellation',
    name: 'NavIC (IRNSS) Satellite Constellation Sync',
    provider: 'ISRO Satellite Navigation Directorate (Simulated Adapter)',
    category: 'NAVIGATION',
    url: 'https://www.isro.gov.in/SatelliteNavigationServices.html',
    status: 'HEALTHY',
    latencyMs: 45,
    lastFetchTime: '10 secs ago',
    freshnessMins: 0,
    circuitBreaker: 'CLOSED',
    samplePayload: {
      satellites_locked: 8,
      ephemeris_mode: 'L5 / S-band dual carrier',
      position_accuracy_m: 2.1,
      sub_satellite_dgps_fix: 'ACTIVE',
    },
  },
];

// 24-Hour Ocean Forecast Time Series
export const HOURLY_FORECAST: ForecastHour[] = [
  { hour: '06:00', waveHeightM: 1.4, windSpeedKnots: 11, swellPeriodSec: 9.2, sstCelsius: 28.2, rainMm: 0.0, currentKnots: 0.8, safetyVerdict: 'GO' },
  { hour: '08:00', waveHeightM: 1.5, windSpeedKnots: 13, swellPeriodSec: 9.5, sstCelsius: 28.4, rainMm: 0.0, currentKnots: 0.9, safetyVerdict: 'GO' },
  { hour: '10:00', waveHeightM: 1.7, windSpeedKnots: 15, swellPeriodSec: 10.1, sstCelsius: 28.8, rainMm: 0.2, currentKnots: 1.1, safetyVerdict: 'GO' },
  { hour: '12:00', waveHeightM: 1.9, windSpeedKnots: 17, swellPeriodSec: 10.4, sstCelsius: 29.1, rainMm: 0.5, currentKnots: 1.3, safetyVerdict: 'GO' },
  { hour: '14:00', waveHeightM: 2.1, windSpeedKnots: 19, swellPeriodSec: 10.8, sstCelsius: 29.0, rainMm: 1.2, currentKnots: 1.5, safetyVerdict: 'GO' },
  { hour: '16:00', waveHeightM: 2.4, windSpeedKnots: 22, swellPeriodSec: 11.2, sstCelsius: 28.6, rainMm: 3.4, currentKnots: 1.8, safetyVerdict: 'CAUTION' },
  { hour: '18:00', waveHeightM: 2.7, windSpeedKnots: 25, swellPeriodSec: 11.8, sstCelsius: 28.3, rainMm: 6.8, currentKnots: 2.1, safetyVerdict: 'CAUTION' },
  { hour: '20:00', waveHeightM: 3.1, windSpeedKnots: 28, swellPeriodSec: 12.4, sstCelsius: 28.0, rainMm: 12.0, currentKnots: 2.4, safetyVerdict: 'NO_GO' },
  { hour: '22:00', waveHeightM: 3.4, windSpeedKnots: 31, swellPeriodSec: 13.0, sstCelsius: 27.8, rainMm: 15.5, currentKnots: 2.6, safetyVerdict: 'NO_GO' },
  { hour: '00:00', waveHeightM: 3.0, windSpeedKnots: 27, swellPeriodSec: 12.2, sstCelsius: 27.7, rainMm: 8.0, currentKnots: 2.2, safetyVerdict: 'NO_GO' },
  { hour: '02:00', waveHeightM: 2.3, windSpeedKnots: 20, swellPeriodSec: 10.9, sstCelsius: 27.9, rainMm: 2.1, currentKnots: 1.6, safetyVerdict: 'CAUTION' },
  { hour: '04:00', waveHeightM: 1.6, windSpeedKnots: 14, swellPeriodSec: 9.8, sstCelsius: 28.1, rainMm: 0.0, currentKnots: 1.0, safetyVerdict: 'GO' },
];

// Offline Emergency Phrases
export const EMERGENCY_PHRASES = [
  { en: "MAYDAY MAYDAY: Engine failure at coordinates", hi: "मेडे मेडे: इन निर्देशांकों पर इंजन खराब हो गया है", ta: "மேடே மேடே: இந்த ஆயத்தொலைவுகளில் எஞ்சின் பழுது" },
  { en: "Medical emergency on board, requesting coast guard pickup", hi: "नाव पर चिकित्सा आपातकाल, तटरक्षक सहायता की आवश्यकता है", ta: "படகில் மருத்துவ அவசரநிலை, கடலோரக் காவல் படை உதவி தேவை" },
  { en: "Net entangled in underwater obstruction", hi: "जाल पानी के भीतर रुकावट में फंस गया है", ta: "வலை நீருக்கடியில் தடையுடன் சிக்கியுள்ளது" },
  { en: "Approaching international boundary line, returning to port", hi: "अंतर्राष्ट्रीय सीमा के पास पहुंच रहे हैं, बंदरगाह लौट रहे हैं", ta: "சர்வதேச எல்லைக் கோட்டை நெருங்குகிறது, துறைமுகத்திற்குத் திரும்புகிறது" },
];
