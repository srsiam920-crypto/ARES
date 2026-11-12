import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePsychologicalStressScore,
  calculateAdi,
  calculateAdiLevel,
  diagnoseDisordersFromVitals,
  validateBiometricFaceVectors,
  verifyCommanderCmoOverride,
  calculateDsnTelemetry,
  canExecuteDoomsdayOverride,
  verifyDoomsdayAstronautOverride,
  computeClinicalLeadIIVoltage,
  sampleConsistentEcgPoint,
  computeSteadyEegBands,
  evaluateMissionTaskAdiEligibility
} from './pfaLogic.ts';
import { AstronautVitals } from '../types/ares.ts';
import { INITIAL_ASTRONAUTS, INITIAL_MISSION_CHECKLIST_TASKS } from '../data/mockAresData.ts';

const mockNominalVitals: AstronautVitals = {
  heartRate: 68,
  hrv: 62,
  spo2: 99,
  respirationRate: 14,
  coreTempCelsius: 36.8,
  skinConductanceUs: 4.2,
  cortisolIndex: 18,
  sleepHoursLast24: 7.5,
  circadianPhase: 'PHASE_ALPHA'
};

const mockPanicVitals: AstronautVitals = {
  heartRate: 128,
  hrv: 14,
  spo2: 97,
  respirationRate: 26,
  coreTempCelsius: 37.1,
  skinConductanceUs: 16.5,
  cortisolIndex: 88,
  sleepHoursLast24: 5.0,
  circadianPhase: 'PHASE_BETA'
};

const mockInsomniaVitals: AstronautVitals = {
  heartRate: 78,
  hrv: 38,
  spo2: 98,
  respirationRate: 15,
  coreTempCelsius: 36.7,
  skinConductanceUs: 6.0,
  cortisolIndex: 45,
  sleepHoursLast24: 2.1,
  circadianPhase: 'DESYNCHRONIZED'
};

test('calculatePsychologicalStressScore gives low score for nominal vitals', () => {
  const score = calculatePsychologicalStressScore(mockNominalVitals);
  assert.ok(score < 25, `Expected score < 25, got ${score}`);
});

test('calculatePsychologicalStressScore gives high critical score for panic vitals', () => {
  const score = calculatePsychologicalStressScore(mockPanicVitals);
  assert.ok(score > 75, `Expected score > 75, got ${score}`);
});

test('diagnoseDisordersFromVitals identifies panic attack with tachypnea and tachycardia', () => {
  const diagnosis = diagnoseDisordersFromVitals(mockPanicVitals, ['chest tightness', 'cannot breathe']);
  assert.equal(diagnosis.recommendedPfaKey, 'pfa_panic_breathing');
  assert.equal(diagnosis.severity, 'CRITICAL');
  assert.ok(diagnosis.confidencePercentage >= 85);
});

test('diagnoseDisordersFromVitals identifies circadian desynchronosis and recommends sleep protocol', () => {
  const diagnosis = diagnoseDisordersFromVitals(mockInsomniaVitals, ['exhaustion', 'cannot sleep']);
  assert.equal(diagnosis.recommendedPfaKey, 'pfa_sleep_winddown');
  assert.ok(diagnosis.confidencePercentage > 80);
});

test('diagnoseDisordersFromVitals identifies claustrophobia on confined reports', () => {
  const confinedVitals: AstronautVitals = {
    ...mockNominalVitals,
    heartRate: 102,
    skinConductanceUs: 13.8
  };
  const diagnosis = diagnoseDisordersFromVitals(confinedVitals, ['the walls are closing in', 'trapped']);
  assert.equal(diagnosis.recommendedPfaKey, 'pfa_claustrophobia');
});

test('validateBiometricFaceVectors matches identical normalized vectors with 100% confidence', () => {
  const v = [0.12, 0.45, 0.88, 0.32, 0.91];
  const result = validateBiometricFaceVectors(v, v);
  assert.equal(result.match, true);
  assert.ok(result.confidence >= 99);
});

test('validateBiometricFaceVectors rejects divergent vectors', () => {
  const v1 = [1, 0, 0, 0];
  const v2 = [0, 1, 0, 0];
  const result = validateBiometricFaceVectors(v1, v2);
  assert.equal(result.match, false);
  assert.equal(result.confidence, 0);
});

test('verifyCommanderCmoOverride verifies correct dual keys', () => {
  const res = verifyCommanderCmoOverride('CAP99', 'CMO00');
  assert.equal(res.valid, true);
});

test('verifyCommanderCmoOverride rejects invalid keys', () => {
  const res1 = verifyCommanderCmoOverride('WRONG', 'CMO00');
  assert.equal(res1.valid, false);
  const res2 = verifyCommanderCmoOverride('CAP99', 'WRONG');
  assert.equal(res2.valid, false);
});

test('calculateDsnTelemetry computes accurate Mars delay and signal attenuation', () => {
  const distanceAu = 1.5; // ~Mars average
  const telemetry = calculateDsnTelemetry(distanceAu);
  assert.equal(telemetry.oneWaySeconds, Math.round(1.5 * 499));
  assert.ok(telemetry.formattedDelay.includes('12m'));
});

test('canExecuteDoomsdayOverride allows ONLY designated astronaut Elena Vance (vance) and denies other astronauts', () => {
  const vance = { id: 'vance', name: 'Elena Vance', role: 'ASTRONAUT', isDesignatedEmergencyOverrideAstronaut: true };
  const rossi = { id: 'rossi', name: 'Marco Rossi', role: 'ASTRONAUT', isDesignatedEmergencyOverrideAstronaut: false };
  const tanaka = { id: 'tanaka', name: 'Dr. Kenji Tanaka', role: 'ASTRONAUT', isDesignatedEmergencyOverrideAstronaut: false };

  assert.equal(canExecuteDoomsdayOverride(vance), true);
  assert.equal(canExecuteDoomsdayOverride(rossi), false);
  assert.equal(canExecuteDoomsdayOverride(tanaka), false);

  assert.equal(verifyDoomsdayAstronautOverride(vance, 'GUARDIAN-AUTH').valid, true);
  assert.equal(verifyDoomsdayAstronautOverride(rossi, 'GUARDIAN-AUTH').valid, false);
  assert.equal(verifyDoomsdayAstronautOverride(tanaka, 'GUARDIAN-AUTH').valid, false);
});

test('sampleConsistentEcgPoint preserves R-wave peak amplitude across sub-sampled windows', () => {
  const rPeakDirect = computeClinicalLeadIIVoltage(0.31);
  const rPeakSampled = sampleConsistentEcgPoint(0.295, 0.325, 8);
  assert.ok(rPeakDirect > 0.95);
  assert.ok(Math.abs(rPeakDirect - rPeakSampled) < 0.02);
});

test('computeSteadyEegBands fluctuates very slowly and remains steady over 1-second intervals', () => {
  const t0 = computeSteadyEegBands(10000);
  const t1 = computeSteadyEegBands(11000); // 1 second later
  for (let i = 0; i < t0.length; i++) {
    const delta = Math.abs(t1[i].value - t0[i].value);
    assert.ok(delta < 0.003, `EEG band ${t0[i].shortLabel} changed too rapidly in 1s: ${delta}`);
  }
});

test('Elena Vance (A. Vance) has ADI lower in the yellow and everyone else has perfect ADI', () => {
  const vance = INITIAL_ASTRONAUTS.find(a => a.id === 'vance')!;
  const vanceAdi = calculateAdi(vance.vitals);
  const vanceLevel = calculateAdiLevel(vance.vitals);
  assert.equal(vanceLevel, 'warning', `Expected Vance ADI level to be 'warning' (yellow), got ${vanceLevel}`);
  assert.ok(vanceAdi >= 0.45 && vanceAdi < 0.55, `Expected Vance ADI in lower yellow [0.45, 0.55), got ${vanceAdi}`);

  const others = INITIAL_ASTRONAUTS.filter(a => a.id !== 'vance');
  for (const crew of others) {
    const adi = calculateAdi(crew.vitals);
    const level = calculateAdiLevel(crew.vitals);
    assert.equal(level, 'ok', `Expected ${crew.name} ADI level to be 'ok' (perfect green), got ${level}`);
    assert.ok(adi <= 0.12, `Expected ${crew.name} ADI to be perfect (<= 0.12), got ${adi}`);
  }
});

test('evaluateMissionTaskAdiEligibility blocks Elena Vance (ADI 0.47) from Spacewalk, Medical Drill, Fire Drill, and Biological Experiment while clearing Marco Rossi (ADI 0.08)', () => {
  const vance = INITIAL_ASTRONAUTS.find(a => a.id === 'vance')!;
  const rossi = INITIAL_ASTRONAUTS.find(a => a.id === 'rossi')!;

  const spacewalkTask = INITIAL_MISSION_CHECKLIST_TASKS.find(t => t.id === 'TASK-EVA-01')!;
  const fireDrillTask = INITIAL_MISSION_CHECKLIST_TASKS.find(t => t.id === 'TASK-FIRE-02')!;
  const medicalDrillTask = INITIAL_MISSION_CHECKLIST_TASKS.find(t => t.id === 'TASK-MED-03')!;
  const bioExpTask = INITIAL_MISSION_CHECKLIST_TASKS.find(t => t.id === 'TASK-BIO-04')!;

  const vanceEval = evaluateMissionTaskAdiEligibility(vance.vitals, spacewalkTask.maxAllowedAdi);
  assert.equal(vanceEval.eligible, false);
  assert.equal(vanceEval.statusMessage.includes('Acute Distress Index'), true);
  assert.equal(vanceEval.statusMessage.includes('Autonomic Distress Index'), false);
  assert.equal(evaluateMissionTaskAdiEligibility(vance.vitals, fireDrillTask.maxAllowedAdi).eligible, false);
  assert.equal(evaluateMissionTaskAdiEligibility(vance.vitals, medicalDrillTask.maxAllowedAdi).eligible, false);
  assert.equal(evaluateMissionTaskAdiEligibility(vance.vitals, bioExpTask.maxAllowedAdi).eligible, false);

  const rossiEval = evaluateMissionTaskAdiEligibility(rossi.vitals, spacewalkTask.maxAllowedAdi);
  assert.equal(rossiEval.eligible, true);
  assert.equal(rossiEval.statusMessage.includes('Acute Distress Index'), true);
  assert.equal(evaluateMissionTaskAdiEligibility(rossi.vitals, fireDrillTask.maxAllowedAdi).eligible, true);
  assert.equal(evaluateMissionTaskAdiEligibility(rossi.vitals, medicalDrillTask.maxAllowedAdi).eligible, true);
  assert.equal(evaluateMissionTaskAdiEligibility(rossi.vitals, bioExpTask.maxAllowedAdi).eligible, true);
});
