export type AstronautId = 'vance' | 'rossi' | 'tanaka' | 'stone' | 'captain' | 'ground';

export type UserRole = 'ASTRONAUT' | 'CMO' | 'FLIGHT_COMMANDER' | 'GROUND_STATION';

export interface AstronautVitals {
  heartRate: number; // Beats Per Minute
  hrv: number; // Heart Rate Variability in milliseconds
  spo2: number; // Blood Oxygen Saturation percentage
  respirationRate: number; // Breaths Per Minute
  coreTempCelsius: number; // Degrees Celsius
  skinConductanceUs: number; // Microsiemens (Galvanic Skin Response)
  cortisolIndex: number; // 0-100 scale
  sleepHoursLast24: number; // Hours
  circadianPhase: 'PHASE_ALPHA' | 'PHASE_BETA' | 'PHASE_DELTA' | 'DESYNCHRONIZED';
  bloodPressureSystolic?: number; // Millimeters of Mercury (mmHg)
  bloodPressureDiastolic?: number; // Millimeters of Mercury (mmHg)
  bloodSugarMgDl?: number; // Milligrams per Deciliter (mg/dL)
  moodState?: 'Focused & Calm' | 'Motivated' | 'Mildly Fatigued' | 'Isolated / Stressed' | 'Anxious';
  boneDensityDeltaPercent?: number; // Percentage change from Earth baseline
  immuneStatus?: 'Optimal Leukocyte Balance' | 'Mild Cytokine Shift' | 'Elevated Stress Response';
}

export interface AstronautProfile {
  id: AstronautId;
  username: string;
  name: string;
  callsign: string;
  specialty: string;
  role: UserRole;
  avatarUrl: string;
  podThemeBg: string;
  podColorAccent: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  bioSecurityPin: string;
  faceHashVector: number[];
  cumulativeRadiationMsv: number;
  missionDay: number;
  assignedPod: string;
  lastTimeOfSleep: string;
  vitals: AstronautVitals;
  activeDisorder?: string;
  disorderSeverity?: 'LOW' | 'ELEVATED' | 'CRITICAL';
  aiSuggestedAction?: string;
  biomarkerCause?: string;
  isDesignatedEmergencyOverrideAstronaut?: boolean;
}

export type PfaProtocolKey = 
  | 'pfa_default_ack'
  | 'pfa_sleep_winddown'
  | 'pfa_panic_breathing'
  | 'pfa_claustrophobia'
  | 'pfa_critical_support'
  | 'winddown';

export interface PfaProtocol {
  key: PfaProtocolKey;
  id: string;
  title: string;
  description: string;
  audioPath: string;
  durationSeconds: number;
  transcript: string;
  category: 'STABILIZATION' | 'SLEEP' | 'GROUNDING' | 'CRITICAL' | 'GENERAL';
  lightingMode: 'AMBER_WARM' | 'OCEAN_CYAN' | 'CALM_BLUE' | 'EMERGENCY_SOFT_RED';
  vibroacousticPreset: 'OFF' | 'GENTLE_40HZ' | 'DEEP_GROUNDING_60HZ' | 'DELTA_SYNC_35HZ';
  suggestedForDisorders: string[];
}

export interface VrEarthEnvironment {
  id: 'rain' | 'forest' | 'ocean' | 'football' | 'family';
  name: string;
  title: string;
  subtitle: string;
  category: 'Rain' | 'Forest' | 'Ocean' | 'Football Match' | 'Family Function';
  panoramaImageUrl: string;
  videoUrl: string;
  companionVideoUrl?: string;
  audioTrackUrl?: string;
  soundscapeMode: 'rainforest' | 'forest' | 'ocean' | 'stadium' | 'family';
  binauralHz: number;
  biometricBenefit: string;
  fieldOfView: string;
  spatialCoordinates: string;
  description: string;
}

export interface CmoEmergencyAlarm {
  id: string;
  callerId: AstronautId;
  callerName: string;
  callerCallsign: string;
  assignedPod: string;
  reason: string;
  timestamp: string;
  heartRate: number;
  hrv: number;
  spo2: number;
  active: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface MissionChecklistTask {
  id: string;
  title: string;
  category:
    | 'Extra-Vehicular Spacewalk'
    | 'Medical Emergency Drill'
    | 'Fire Suppression Drill'
    | 'Biological Experiment'
    | 'Robotic Payload Operation'
    | 'Habitat Life Support & Routine';
  description: string;
  hazardExposed:
    | 'Space Radiation & Vacuum'
    | 'Altered Gravity Fields'
    | 'Hostile Closed Environment'
    | 'Isolation & Confinement'
    | 'Distance from Earth Autonomy';
  maxAllowedAdi: number; // Astronaut's Acute Distress Index must be <= maxAllowedAdi
  durationMinutes: number;
  healthEngagementPoints: number;
  safetyHoldExplanation: string;
  instructions: string;
  completedByIds: AstronautId[];
}

export interface CmoTaskHoldNotification {
  id: string;
  astronautId: AstronautId;
  astronautName: string;
  astronautCallsign: string;
  assignedPod: string;
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  currentAdi: number;
  requiredMaxAdi: number;
  timestamp: string;
  status: 'ACTIVE_HOLD' | 'CMO_REVIEWED';
  reason: string;
  cmoGuidance?: string;
}

export interface BodySystemAssessment {
  id: 'brain' | 'heart' | 'bones' | 'muscles' | 'immune' | 'metabolic';
  name: string;
  anatomicalSubtitle: string;
  primarySpaceHazards: string[];
  physiologicalFunction: string;
  spaceflightRiskExplanation: string;
  inSpaceMeasurementMethod: string;
  whyExamNeeded: string;
  whenToAlertCmoOrFlightSurgeon: string;
  preventiveCountermeasures: string[];
  currentMetricLabel: string;
  currentMetricValue: string;
  triageStatus: 'GREEN' | 'YELLOW' | 'RED';
}

export interface AiDisorderDiagnosis {
  id: string;
  disorderName: string;
  astronautId: AstronautId;
  astronautName: string;
  severity: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  confidencePercentage: number;
  detectedAt: string;
  primaryBiomarkers: string[];
  aiAnalysis: string;
  clinicalRecommendations: string[];
  recommendedPfaKey: PfaProtocolKey;
  resolved: boolean;
}

export interface GroundCallRecord {
  id: string;
  patientId: AstronautId;
  patientName: string;
  cmoName: string;
  reason: string;
  priority: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  status: 'PENDING_GROUND_RESPONSE' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'REQUESTED' | 'IN_PROGRESS' | 'RESOLVED';
  timestamp: string;
  groundResponse?: string;
  groundRespondedAt?: string;
  flightSurgeonName?: string;
}

export interface OverrideLogEntry {
  id: string;
  timestamp: string;
  category: string;
  reason: string;
  authorizedBy: string;
  status: 'EXECUTED_AUTHORIZED' | 'LOCKED_FAILED_ATTEMPT';
  details?: string;
}

export interface EarthUplinkMedia {
  id: string;
  title: string;
  type: 'VIDEO' | 'AUDIO' | 'IMAGE';
  category: 'FAMILY_MESSAGE' | 'SPACE_ENTHUSIAST' | 'EARTH_WELLWISH';
  senderName: string;
  senderRelation: string;
  earthOriginLocation: string;
  uplinkTimestamp: string;
  dsnSignalDelay: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  transcript: string;
  personalNote: string;
  targetAstronautId: AstronautId | 'ALL_CREW';
}

export interface SpacecraftNavigationTelemetry {
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  totalTransitDistanceKm: number;
  transitProgressPercent: number;
  currentVelocityKmS: number;
  estimatedTimeToArrival: string;
  trajectoryAngleDeg: number;
  perihelionAu: number;
  aphelionAu: number;
  radiationShieldIntegrityPercent: number;
  eclssCabinPressureKpa: number;
  oxygenPercentage: number;
  co2Ppm: number;
  hullIntegrityPercent: number;
  lastTelemetryPing: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ASTRONAUT' | 'ARES_AI' | 'CMO' | 'GROUND';
  senderName: string;
  text: string;
  timestamp: string;
  audioKey?: PfaProtocolKey;
}
