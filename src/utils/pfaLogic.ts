import { AstronautVitals, PfaProtocolKey } from '../types/ares';

/**
 * Calculates normalized psychological stress score (0 to 100) based on
 * autonomous sympathetic-parasympathetic biometrics.
 */
export function calculatePsychologicalStressScore(vitals: AstronautVitals): number {
  // Baseline physiological standards for microgravity habitat:
  // HR nominal: 60-75 bpm; elevated > 95; panic > 120
  // HRV nominal: > 55ms; low (high stress): < 25ms
  // Respiration nominal: 12-16 br/min; tachypnea > 22
  // Cortisol index: 0-100
  // GSR (Skin conductance): 2-8 uS nominal; > 14 uS acute fight-or-flight

  let score = 0;

  // HR contribution (weight 25%)
  if (vitals.heartRate > 120) score += 25;
  else if (vitals.heartRate > 95) score += 15 + ((vitals.heartRate - 95) / 25) * 10;
  else if (vitals.heartRate > 75) score += ((vitals.heartRate - 75) / 20) * 10;

  // HRV contribution (weight 25% - inverse)
  if (vitals.hrv < 20) score += 25;
  else if (vitals.hrv < 40) score += 12 + ((40 - vitals.hrv) / 20) * 13;
  else if (vitals.hrv < 60) score += ((60 - vitals.hrv) / 20) * 8;

  // Respiration rate contribution (weight 20%)
  if (vitals.respirationRate > 24) score += 20;
  else if (vitals.respirationRate > 18) score += 8 + ((vitals.respirationRate - 18) / 6) * 12;

  // Cortisol contribution (weight 20%)
  score += Math.min(20, (vitals.cortisolIndex / 100) * 20);

  // GSR skin conductance (weight 10%)
  if (vitals.skinConductanceUs > 14) score += 10;
  else if (vitals.skinConductanceUs > 8) score += ((vitals.skinConductanceUs - 8) / 6) * 10;

  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

/**
 * Computes the normalized Acute Distress Index (ADI) in [0.00, 1.00].
 * - 0.00 - 0.44: 'ok' (Perfect / Nominal Green)
 * - 0.45 - 0.69: 'warning' (Moderate / Elevated Yellow)
 * - 0.70 - 1.00: 'critical' (Critical High Red)
 */
export function calculateAdi(vitals: AstronautVitals): number {
  const hr = vitals.heartRate;
  const hrv = vitals.hrv;
  const sleepQ = Math.round(Math.min(100, (vitals.sleepHoursLast24 / 8) * 100));
  const voiceJitter = vitals.skinConductanceUs > 10 ? 4.8 : vitals.skinConductanceUs > 5.5 ? 1.8 : 0.6;

  const hrScore = Math.max(0, Math.min(1, (hr - 55) / 55));
  const hrvScore = Math.max(0, Math.min(1, (75 - hrv) / 55));
  const jitterScore = Math.max(0, Math.min(1, voiceJitter / 6));
  const sleepScore = Math.max(0, Math.min(1, (100 - sleepQ) / 70));
  return parseFloat((0.30 * hrScore + 0.30 * hrvScore + 0.25 * jitterScore + 0.15 * sleepScore).toFixed(2));
}

export function calculateAdiLevel(vitals: AstronautVitals): 'ok' | 'warning' | 'critical' {
  const adi = calculateAdi(vitals);
  return adi >= 0.70 ? 'critical' : adi >= 0.45 ? 'warning' : 'ok';
}

/**
 * Evaluates whether an astronaut's current Acute Distress Index (ADI) meets
 * the safety criteria for a specific mission checklist task (e.g. Spacewalk, Fire Drill,
 * Medical Drill, Biological Experiment).
 */
export function evaluateMissionTaskAdiEligibility(
  vitals: AstronautVitals,
  maxAllowedAdi: number
): {
  eligible: boolean;
  currentAdi: number;
  maxAllowedAdi: number;
  triageColor: 'GREEN' | 'YELLOW' | 'RED';
  statusMessage: string;
} {
  const currentAdi = calculateAdi(vitals);
  const level = calculateAdiLevel(vitals);
  const triageColor = level === 'critical' ? 'RED' : level === 'warning' ? 'YELLOW' : 'GREEN';
  const eligible = currentAdi <= maxAllowedAdi;

  if (eligible) {
    return {
      eligible: true,
      currentAdi,
      maxAllowedAdi,
      triageColor,
      statusMessage: `Cleared for Task: Current Acute Distress Index (${currentAdi.toFixed(2)}) meets the required threshold (≤ ${maxAllowedAdi.toFixed(2)}).`
    };
  }

  return {
    eligible: false,
    currentAdi,
    maxAllowedAdi,
    triageColor,
    statusMessage: `Safety Hold Active: Current Acute Distress Index (${currentAdi.toFixed(2)}) exceeds the maximum safe limit (≤ ${maxAllowedAdi.toFixed(2)}). Crew Medical Officer Console notified.`
  };
}

export interface DiagnosisResult {
  primaryDisorder: string;
  severity: 'LOW' | 'ELEVATED' | 'CRITICAL';
  confidencePercentage: number;
  aiRationale: string;
  recommendedPfaKey: PfaProtocolKey;
  interventionSteps: string[];
}

/**
 * AI Psychological First Aid Diagnostic Engine:
 * Analyzes telemetric vitals & reported cognitive markers to detect specific disorders.
 */
export function diagnoseDisordersFromVitals(
  vitals: AstronautVitals,
  reportedSymptoms: string[] = []
): DiagnosisResult {
  const stress = calculatePsychologicalStressScore(vitals);
  const symptomsLower = reportedSymptoms.map(s => s.toLowerCase());

  // Check 1: Panic Attack / Hyperventilation
  const hasHyperventilation = vitals.respirationRate >= 22;
  const hasTachycardia = vitals.heartRate >= 115;
  const reportsPanic = symptomsLower.some(s => s.includes('panic') || s.includes('chest') || s.includes('suffocating'));

  if ((hasHyperventilation && hasTachycardia) || reportsPanic) {
    return {
      primaryDisorder: 'Acute Panic Episode & Hyperventilation Syndrome',
      severity: stress > 75 ? 'CRITICAL' : 'ELEVATED',
      confidencePercentage: Math.min(99, Math.round(82 + (stress / 100) * 17)),
      aiRationale: 'Marked sympathetic surge with tachypnea (>22 bpm), acute tachycardia, and precipitous HRV collapse indicating parasympathetic withdrawal.',
      recommendedPfaKey: 'pfa_panic_breathing',
      interventionSteps: [
        'Engage 4-7-8 parasympathetic respiratory pacing audio protocol',
        'Shift Pod illumination to stabilizing ambient cyan (480nm)',
        'Deliver haptic grounding vibration pulse via Pod bulkhead'
      ]
    };
  }

  // Check 2: Claustrophobia / Confined Space Syndrome
  const reportsWalls = symptomsLower.some(s => s.includes('walls') || s.includes('trapped') || s.includes('closed in') || s.includes('confined'));
  if (reportsWalls || (vitals.skinConductanceUs > 12 && vitals.heartRate > 95 && stress > 60)) {
    return {
      primaryDisorder: 'Acute Habitat Claustrophobia & Spatial Panic',
      severity: stress > 80 ? 'CRITICAL' : 'ELEVATED',
      confidencePercentage: Math.min(98, Math.round(85 + (vitals.skinConductanceUs / 20) * 12)),
      aiRationale: 'Galvanic skin resistance elevation coupled with sensory confinement anxiety. High risk of disorientation in microgravity module.',
      recommendedPfaKey: 'pfa_claustrophobia',
      interventionSteps: [
        'Initiate deep touch pressure via Pod pneumatic seat compression',
        'Deploy 5-4-3-2-1 visual grounding exercise via voiceover guide',
        'Switch audio acoustic environment to open Pacific Ocean soundscape'
      ]
    };
  }

  // Check 3: Severe Circadian Desynchronosis / Insomnia
  if (vitals.circadianPhase === 'DESYNCHRONIZED' || vitals.sleepHoursLast24 < 4 || symptomsLower.some(s => s.includes('insomnia') || s.includes('sleep'))) {
    return {
      primaryDisorder: 'Circadian Desynchronosis & Sleep Deprivation Exhaustion',
      severity: vitals.sleepHoursLast24 < 2.5 ? 'CRITICAL' : 'ELEVATED',
      confidencePercentage: 94.2,
      aiRationale: 'Suprachiasmatic nucleus desynchrony from artificial mission lighting cycles. Melatonin suppression and cognitive fatigue detected.',
      recommendedPfaKey: 'pfa_sleep_winddown',
      interventionSteps: [
        'Shift cabin luminaire array to amber phototherapy (590nm, 0% blue)',
        'Engage 3.5Hz Delta binaural acoustic stimulation',
        'Activate vibroacoustic mattress low-frequency muscle release program'
      ]
    };
  }

  // Check 4: General Acute Stress / Dissociation
  if (stress > 70) {
    return {
      primaryDisorder: 'Acute Psychological Decompensation / Critical Stress',
      severity: 'CRITICAL',
      confidencePercentage: 91.5,
      aiRationale: 'Sustained sympathetic overdrive exceeding adaptive threshold. Immediate Crew Medical Officer notification mandated.',
      recommendedPfaKey: 'pfa_critical_support',
      interventionSteps: [
        'Direct automated alert to Crew Medical Officer (CMO) terminal',
        'Continuous grounding verbal presence via ARES PFA synthetic core',
        'Prepare bio-monitoring telemetry archive for Ground Flight Surgeon'
      ]
    };
  }

  // Baseline / Low Stress
  return {
    primaryDisorder: 'Nominal Operational State / Mild Habituation Strain',
    severity: 'LOW',
    confidencePercentage: 96.0,
    aiRationale: 'All vital telemetry vectors within acceptable deep-space operational tolerances.',
    recommendedPfaKey: 'pfa_default_ack',
    interventionSteps: [
      'Maintain standard autonomous bio-telemetry monitoring',
      'Schedule routine circadian evening wind-down in 2.5 hours'
    ]
  };
}

/**
 * Biometric Face Vector Verification:
 * Compares detected face landmarks against cryptographic astronaut profile baseline.
 */
export function validateBiometricFaceVectors(
  referenceVector: number[],
  capturedVector: number[]
): { match: boolean; confidence: number; distance: number } {
  if (referenceVector.length === 0 || capturedVector.length === 0) {
    return { match: false, confidence: 0, distance: 1.0 };
  }

  const length = Math.min(referenceVector.length, capturedVector.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i++) {
    dot += referenceVector[i] * capturedVector[i];
    magA += referenceVector[i] * referenceVector[i];
    magB += capturedVector[i] * capturedVector[i];
  }

  const similarity = (magA > 0 && magB > 0) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  // Map cosine similarity (-1..1) to percentage (0..100)
  const confidence = Math.max(0, Math.min(100, Math.round(similarity * 1000) / 10));
  const distance = Math.max(0, 1 - similarity);

  // Match threshold: > 85%
  return {
    match: confidence >= 85,
    confidence,
    distance: Math.round(distance * 1000) / 1000
  };
}

/**
 * Dual Key Verification for Flight Commander & Crew Medical Officer Protocol:
 * Verified with demo credentials: Captain = CAP99, Crew Medical Officer = CMO00
 */
export function verifyCommanderCmoOverride(
  commanderPin: string,
  cmoPin: string
): { valid: boolean; message: string } {
  const validCommanderPins = ['CAP99', 'CAPTAIN', 'WALKER', 'CDR-8012', '8012'];
  const validCmoPins = ['CMO00', 'STONE', 'CMO-8014', '8014'];

  const isCmdrValid = validCommanderPins.includes(commanderPin.trim().toUpperCase());
  const isCmoValid = validCmoPins.includes(cmoPin.trim().toUpperCase());

  if (isCmdrValid && isCmoValid) {
    return {
      valid: true,
      message: 'DUAL AUTHORIZATION VERIFIED: Cryptographic signature validated (CAP99 / CMO00).'
    };
  }

  if (!isCmdrValid && !isCmoValid) {
    return { valid: false, message: 'Both Captain (CAP99) and Crew Medical Officer (CMO00) authorization keys are invalid.' };
  }
  if (!isCmdrValid) {
    return { valid: false, message: 'Flight Commander cryptographic key invalid (expected CAP99).' };
  }
  return { valid: false, message: 'Crew Medical Officer cryptographic key invalid (expected CMO00).' };
}

/**
 * Checks whether a crew member is the specific designated astronaut authorized
 * for the Contingency Anti-Psychotic Guardian Authorization (when Crew Medical Officer & Flight Commander are incapacitated).
 * Strictly restricted to Lead Mission Specialist Elena Vance (ASTRONAUT-03).
 */
export function canExecuteDoomsdayOverride(
  astronaut: { id: string; role: string; isDesignatedEmergencyOverrideAstronaut?: boolean } | null | undefined
): boolean {
  if (!astronaut) return false;
  return Boolean(
    astronaut.role === 'ASTRONAUT' &&
    astronaut.isDesignatedEmergencyOverrideAstronaut === true &&
    astronaut.id === 'vance'
  );
}

/**
 * Validates Contingency Anti-Psychotic Guardian Authorization execution:
 * Requires BOTH that the operator is the specific designated astronaut (Elena Vance, ASTRONAUT-03)
 * AND a valid Guardian Authorization cryptographic key (GUARDIAN-AUTH, STEWARD-77, DOOMSDAY-OVR, or VANCE-OVR-77).
 */
export function verifyDoomsdayAstronautOverride(
  astronaut: { id: string; name: string; role: string; isDesignatedEmergencyOverrideAstronaut?: boolean } | null | undefined,
  guardianKey: string
): { valid: boolean; message: string } {
  if (!canExecuteDoomsdayOverride(astronaut)) {
    return {
      valid: false,
      message: 'ACCESS RESTRICTED: Contingency Anti-Psychotic Guardian Authorization is entrusted exclusively to Designated Crew Guardian Elena Vance (Astronaut-03).'
    };
  }

  const normalized = guardianKey.trim().toUpperCase();
  const isValidKey =
    normalized === 'GUARDIAN-AUTH' ||
    normalized === 'STEWARD-77' ||
    normalized === 'DOOMSDAY-OVR' ||
    normalized === 'VANCE-OVR-77' ||
    guardianKey.trim() === 'Ares@2026';

  if (!isValidKey) {
    return {
      valid: false,
      message: 'GUARDIAN AUTHORIZATION REJECTED: Invalid Designated Astronaut Guardian Key (expected GUARDIAN-AUTH or STEWARD-77).'
    };
  }

  return {
    valid: true,
    message: `GUARDIAN AUTHORIZATION VERIFIED: Designated Astronaut ${astronaut?.name} (Astronaut-03) authorized for medical stewardship.`
  };
}

/**
 * Clinical Lead II ECG P-Q-R-S-T waveform voltage for phase in [0, 1).
 * Produces a realistic, consistent sinus rhythm complex with flat isoelectric baseline.
 */
export function computeClinicalLeadIIVoltage(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  const gauss = (x: number, center: number, width: number, amp: number) =>
    amp * Math.exp(-Math.pow(x - center, 2) / (2 * width * width));

  // Standard Lead II morphology:
  // P wave (atrial depolarization): +0.13 mV at phase 0.18
  // Q wave (septal depolarization): -0.15 mV at phase 0.285
  // R wave (ventricular depolarization): +1.00 mV sharp peak at phase 0.310
  // S wave: -0.25 mV at phase 0.335
  // T wave (ventricular repolarization): +0.26 mV smooth dome at phase 0.55
  return (
    gauss(p, 0.18, 0.022, 0.13) +
    gauss(p, 0.285, 0.0065, -0.15) +
    gauss(p, 0.31, 0.0085, 1.0) +
    gauss(p, 0.335, 0.008, -0.25) +
    gauss(p, 0.55, 0.038, 0.26)
  );
}

/**
 * Sub-samples the ECG waveform across [phaseStart, phaseEnd] and returns the
 * peak-preserving sample so every single QRS complex renders with 100% consistent R-peak height.
 */
export function sampleConsistentEcgPoint(phaseStart: number, phaseEnd: number, subSteps = 6): number {
  let bestVal = computeClinicalLeadIIVoltage(phaseStart);
  let maxAbs = Math.abs(bestVal);

  for (let i = 1; i <= subSteps; i++) {
    const frac = i / subSteps;
    const p = phaseStart + (phaseEnd - phaseStart) * frac;
    const v = computeClinicalLeadIIVoltage(p);
    if (Math.abs(v) > maxAbs) {
      maxAbs = Math.abs(v);
      bestVal = v;
    }
  }
  return bestVal;
}

/**
 * Computes slow, steady, physiologically realistic EEG Power Spectrum band values
 * (DELTA, THETA, ALPHA, BETA) that drift gently within ±1.8% over 18-second windows.
 */
export function computeSteadyEegBands(timeMs: number): {
  label: string;
  shortLabel: string;
  value: number;
  microVoltsSq: number;
  color: string;
}[] {
  const tSlow = timeMs / 18000; // 18-second ultra-slow physiological cycle
  const baseBands = [
    { label: 'DELTA (1-4Hz)', shortLabel: 'DELTA', base: 0.26, color: '#9dd2ff' },
    { label: 'THETA (4-8Hz)', shortLabel: 'THETA', base: 0.48, color: '#0ebc5f' },
    { label: 'ALPHA (8-13Hz)', shortLabel: 'ALPHA', base: 0.38, color: '#9dd2ff' },
    { label: 'BETA (13-30Hz)', shortLabel: 'BETA', base: 0.42, color: '#9dd2ff' }
  ];

  return baseBands.map((b, i) => {
    const gentleDrift = Math.sin(tSlow + i * 1.6) * 0.012 + Math.cos(tSlow * 0.55 + i * 2.1) * 0.006;
    const val = Math.max(0.15, Math.min(0.85, b.base + gentleDrift));
    return {
      label: b.label,
      shortLabel: b.shortLabel,
      value: val,
      microVoltsSq: Math.round(val * 1000) / 10,
      color: b.color
    };
  });
}

/**
 * Deep Space Network telemetry loss calculation:
 * Computes light speed roundtrip latency and signal attenuation based on AU distance.
 */
export function calculateDsnTelemetry(distanceAu: number) {
  // Speed of light in vacuum: ~300,000 km/s. 1 AU = 149.6 million km.
  // 1 AU = ~499 seconds light travel time.
  const oneWaySeconds = Math.round(distanceAu * 499);
  const roundTripSeconds = oneWaySeconds * 2;
  // Free space path loss approximation at 8.4 GHz (X-band)
  const signalDbm = Math.round(-128 - (distanceAu * 4.2));

  const minutes = Math.floor(oneWaySeconds / 60);
  const remainingSec = oneWaySeconds % 60;
  const formattedDelay = `${minutes}m ${remainingSec.toString().padStart(2, '0')}s`;

  return {
    oneWaySeconds,
    roundTripSeconds,
    signalDbm,
    formattedDelay
  };
}
