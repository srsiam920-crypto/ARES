import { 
  AstronautProfile, 
  PfaProtocol, 
  AiDisorderDiagnosis, 
  EarthUplinkMedia,
  SpacecraftNavigationTelemetry,
  GroundCallRecord,
  OverrideLogEntry,
  ChatMessage,
  VrEarthEnvironment,
  MissionChecklistTask,
  CmoTaskHoldNotification,
  BodySystemAssessment
} from '../types/ares';

export const INITIAL_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'vance',
    username: 'vance',
    name: 'Elena Vance',
    callsign: 'ASTRONAUT-03',
    specialty: 'Lead Mission Specialist · Habitat Systems',
    role: 'ASTRONAUT',
    avatarUrl: '/assets/aistudio/Change_astronaut_face_2K_20261027165858_536e2f98.jpg',
    podThemeBg: 'linear-gradient(135deg, #050a14 0%, #091529 45%, #0c1f3d 100%)',
    podColorAccent: 'cyan',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.92, 0.45, 0.78, 0.88, 0.65, 0.94, 0.51, 0.83],
    cumulativeRadiationMsv: 42.4,
    missionDay: 184,
    assignedPod: 'HABITAT POD ALPHA [01]',
    lastTimeOfSleep: '09 Hours 15 Minutes Ago',
    activeDisorder: 'Mild Habituation Strain & Circadian Drift',
    disorderSeverity: 'ELEVATED',
    aiSuggestedAction: 'Acute Distress Index in lower yellow band (0.47). Evening 1800 Kelvin circadian phototherapy and 6 Hertz binaural wind-down recommended.',
    biomarkerCause: 'Moderate sympathetic elevation (Heart Rate 84 Beats Per Minute, Heart Rate Variability 43 Milliseconds) & 5.5 hours sleep cycle.',
    isDesignatedEmergencyOverrideAstronaut: true, // Designated Contingency Guardian Astronaut
    vitals: {
      heartRate: 84,
      hrv: 43,
      spo2: 99,
      respirationRate: 16,
      coreTempCelsius: 36.8,
      skinConductanceUs: 6.8,
      cortisolIndex: 38,
      sleepHoursLast24: 5.5,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 124,
      bloodPressureDiastolic: 82,
      bloodSugarMgDl: 96,
      moodState: 'Mildly Fatigued',
      boneDensityDeltaPercent: -1.4,
      immuneStatus: 'Mild Cytokine Shift'
    }
  },
  {
    id: 'rossi',
    username: 'rossi',
    name: 'Marco Rossi',
    callsign: 'VECTOR-02',
    specialty: 'Propulsion & Deep-Space Navigation Engineer',
    role: 'ASTRONAUT',
    avatarUrl: '/assets/aistudio/image_04c875e3.png',
    podThemeBg: 'linear-gradient(135deg, #090c15 0%, #141829 50%, #070a12 100%)',
    podColorAccent: 'amber',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.77, 0.89, 0.63, 0.95, 0.82, 0.71, 0.93, 0.84],
    cumulativeRadiationMsv: 56.1,
    missionDay: 184,
    assignedPod: 'HABITAT POD ENGINEERING [02]',
    lastTimeOfSleep: '04 Hours 20 Minutes Ago',
    activeDisorder: 'Optimal Autonomic Equilibrium',
    disorderSeverity: 'LOW',
    aiSuggestedAction: 'Perfect Acute Distress Index baseline (0.08). Maintain standard habitat telemetry monitoring.',
    biomarkerCause: 'Perfect autonomic baseline. Parasympathetic vagal tone optimal (Heart Rate 62 Beats Per Minute, Heart Rate Variability 72 Milliseconds).',
    isDesignatedEmergencyOverrideAstronaut: false,
    vitals: {
      heartRate: 62,
      hrv: 72,
      spo2: 99,
      respirationRate: 13,
      coreTempCelsius: 36.7,
      skinConductanceUs: 3.4,
      cortisolIndex: 14,
      sleepHoursLast24: 7.9,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 116,
      bloodPressureDiastolic: 74,
      bloodSugarMgDl: 89,
      moodState: 'Focused & Calm',
      boneDensityDeltaPercent: -0.8,
      immuneStatus: 'Optimal Leukocyte Balance'
    }
  },
  {
    id: 'tanaka',
    username: 'tanaka',
    name: 'Dr. Kenji Tanaka',
    callsign: 'SPECTRA-04',
    specialty: 'Chief Astrobiology & Payload Scientist',
    role: 'ASTRONAUT',
    avatarUrl: '/assets/aistudio/nasa_portrait_tanaka.jpg',
    podThemeBg: 'linear-gradient(135deg, #080917 0%, #131633 45%, #060813 100%)',
    podColorAccent: 'purple',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.85, 0.72, 0.84, 0.79, 0.68, 0.90, 0.75, 0.88],
    cumulativeRadiationMsv: 49.3,
    missionDay: 184,
    assignedPod: 'HABITAT POD SCIENCE [03]',
    lastTimeOfSleep: '03 Hours 50 Minutes Ago',
    activeDisorder: 'Optimal Autonomic Equilibrium',
    disorderSeverity: 'LOW',
    aiSuggestedAction: 'Perfect Acute Distress Index baseline (0.06). Circadian rhythm fully synchronized.',
    biomarkerCause: 'Perfect autonomic baseline. Full 8.0 hours restorative sleep cycle completed (Heart Rate 60 Beats Per Minute, Heart Rate Variability 74 Milliseconds).',
    isDesignatedEmergencyOverrideAstronaut: false,
    vitals: {
      heartRate: 60,
      hrv: 74,
      spo2: 99,
      respirationRate: 13,
      coreTempCelsius: 36.7,
      skinConductanceUs: 3.2,
      cortisolIndex: 12,
      sleepHoursLast24: 8.0,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 114,
      bloodPressureDiastolic: 72,
      bloodSugarMgDl: 87,
      moodState: 'Focused & Calm',
      boneDensityDeltaPercent: -0.6,
      immuneStatus: 'Optimal Leukocyte Balance'
    }
  },
  {
    id: 'stone',
    username: 'stone',
    name: 'Dr. Evelyn Stone',
    callsign: 'ASCLEPIUS-MEDICAL',
    specialty: 'Crew Medical Officer · Space Medicine',
    role: 'CMO',
    avatarUrl: '/assets/aistudio/nasa_portrait_stone.jpg',
    podThemeBg: 'linear-gradient(135deg, #040d14 0%, #081e26 45%, #041218 100%)',
    podColorAccent: 'emerald',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.81, 0.67, 0.91, 0.54, 0.76, 0.85, 0.62, 0.79],
    cumulativeRadiationMsv: 38.9,
    missionDay: 184,
    assignedPod: 'HABITAT POD MEDICAL [CREW MEDICAL OFFICER]',
    lastTimeOfSleep: '04 Hours 10 Minutes Ago',
    activeDisorder: 'Optimal Autonomic Equilibrium',
    disorderSeverity: 'LOW',
    aiSuggestedAction: 'Perfect Acute Distress Index baseline (0.07). Supervising fleet biotelemetry. Dual-Key Medical Key: CMO00.',
    biomarkerCause: 'Perfect autonomic baseline. Vitals stable and nominal (Heart Rate 61 Beats Per Minute, Heart Rate Variability 73 Milliseconds).',
    isDesignatedEmergencyOverrideAstronaut: false,
    vitals: {
      heartRate: 61,
      hrv: 73,
      spo2: 99,
      respirationRate: 13,
      coreTempCelsius: 36.7,
      skinConductanceUs: 3.3,
      cortisolIndex: 13,
      sleepHoursLast24: 7.9,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 115,
      bloodPressureDiastolic: 74,
      bloodSugarMgDl: 88,
      moodState: 'Focused & Calm',
      boneDensityDeltaPercent: -0.7,
      immuneStatus: 'Optimal Leukocyte Balance'
    }
  },
  {
    id: 'captain',
    username: 'captain',
    name: 'Captain Marcus Walker',
    callsign: 'PROMETHEUS-01',
    specialty: 'Flight Commander · ARES-V Deep Space Vessel',
    role: 'FLIGHT_COMMANDER',
    avatarUrl: '/assets/aistudio/nasa_portrait_captain.jpg',
    podThemeBg: 'linear-gradient(135deg, #080c18 0%, #111b36 50%, #050914 100%)',
    podColorAccent: 'rose',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.94, 0.81, 0.75, 0.69, 0.88, 0.92, 0.79, 0.85],
    cumulativeRadiationMsv: 44.8,
    missionDay: 184,
    assignedPod: 'HABITAT POD COMMAND [BRIDGE]',
    lastTimeOfSleep: '04 Hours 30 Minutes Ago',
    activeDisorder: 'Optimal Autonomic Equilibrium',
    disorderSeverity: 'LOW',
    aiSuggestedAction: 'Perfect Acute Distress Index baseline (0.09). Commander dual authorization active. Flight Commander Dual Key: CAP99.',
    biomarkerCause: 'Perfect command readiness baseline (Heart Rate 63 Beats Per Minute, Heart Rate Variability 71 Milliseconds).',
    isDesignatedEmergencyOverrideAstronaut: false,
    vitals: {
      heartRate: 63,
      hrv: 71,
      spo2: 99,
      respirationRate: 14,
      coreTempCelsius: 36.7,
      skinConductanceUs: 3.5,
      cortisolIndex: 15,
      sleepHoursLast24: 7.8,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      bloodSugarMgDl: 90,
      moodState: 'Focused & Calm',
      boneDensityDeltaPercent: -0.8,
      immuneStatus: 'Optimal Leukocyte Balance'
    }
  },
  {
    id: 'ground',
    username: 'ground',
    name: 'Houston Ground Operations',
    callsign: 'FLIGHT-DIRECTOR',
    specialty: 'NASA Johnson Space Center Flight Surgeon & Mission Directorate',
    role: 'GROUND_STATION',
    avatarUrl: '/assets/aistudio/Gemini_Generated_Image_o9gkhxo9gkhxo9gk_d25da4af.jpg',
    podThemeBg: 'linear-gradient(135deg, #050914 0%, #0d172a 50%, #040710 100%)',
    podColorAccent: 'cyan',
    bioSecurityPin: 'Ares@2026',
    faceHashVector: [0.88, 0.75, 0.81, 0.64, 0.90, 0.82, 0.70, 0.86],
    cumulativeRadiationMsv: 0,
    missionDay: 184,
    assignedPod: 'HOUSTON JOHNSON SPACE CENTER [EARTH]',
    lastTimeOfSleep: '04 Hours 00 Minutes Ago',
    isDesignatedEmergencyOverrideAstronaut: false,
    vitals: {
      heartRate: 62,
      hrv: 72,
      spo2: 99,
      respirationRate: 13,
      coreTempCelsius: 36.7,
      skinConductanceUs: 3.2,
      cortisolIndex: 12,
      sleepHoursLast24: 8.0,
      circadianPhase: 'PHASE_ALPHA',
      bloodPressureSystolic: 116,
      bloodPressureDiastolic: 74,
      bloodSugarMgDl: 88,
      moodState: 'Focused & Calm',
      boneDensityDeltaPercent: 0,
      immuneStatus: 'Optimal Leukocyte Balance'
    }
  }
];

export const INITIAL_MISSION_CHECKLIST_TASKS: MissionChecklistTask[] = [
  {
    id: 'TASK-EVA-01',
    title: 'Extravehicular Activity (Spacewalk): Solar Truss & Radiation Shield Inspection',
    category: 'Extra-Vehicular Spacewalk',
    description: 'Two-person 6-hour spacewalk outside the pressurized hull to inspect external micrometeoroid Whipple shielding and replace Starboard array shunt regulators.',
    hazardExposed: 'Space Radiation & Vacuum',
    maxAllowedAdi: 0.35, // Requires Optimal Green ADI <= 0.35
    durationMinutes: 360,
    healthEngagementPoints: 150,
    safetyHoldExplanation: 'Extravehicular Spacewalk requires optimal autonomic stability (Acute Distress Index ≤ 0.35) to prevent suit hyperventilation, carbon dioxide retention, or spatial disorientation in vacuum.',
    instructions: '1. Complete 45-minute pure oxygen pre-breathe protocol. 2. Verify suit pressure at 29.6 kilopascals. 3. Confirm Acute Distress Index is ≤ 0.35 before airlock depressurization.',
    completedByIds: ['rossi']
  },
  {
    id: 'TASK-FIRE-02',
    title: 'Emergency Fire Suppression & Cabin Atmospheric Purge Drill',
    category: 'Fire Suppression Drill',
    description: 'High-intensity crew response drill simulating an avionics bay electrical smoke event, portable breathing apparatus donning, and Environmental Control isolation.',
    hazardExposed: 'Hostile Closed Environment',
    maxAllowedAdi: 0.40, // Requires Optimal Green ADI <= 0.40
    durationMinutes: 45,
    healthEngagementPoints: 100,
    safetyHoldExplanation: 'Fire Suppression Drill involves high cognitive load under simulated smoke alarms and requires Acute Distress Index ≤ 0.40 so sympathetic stress does not escalate.',
    instructions: '1. Don quick-don oxygen mask within 15 seconds. 2. Isolate avionics bus Alpha. 3. Verify carbon monoxide and particulate scrubbers return to zero.',
    completedByIds: ['captain', 'rossi']
  },
  {
    id: 'TASK-MED-03',
    title: 'Crew Medical Emergency & Autonomous Trauma Resuscitation Drill',
    category: 'Medical Emergency Drill',
    description: 'Autonomous crew medical simulation practicing microgravity cardiopulmonary restraint, point-of-care ultrasound imaging, and intravenous fluid line stabilization.',
    hazardExposed: 'Distance from Earth Autonomy',
    maxAllowedAdi: 0.42, // Requires Optimal Green ADI <= 0.42
    durationMinutes: 60,
    healthEngagementPoints: 110,
    safetyHoldExplanation: 'Precision clinical resuscitation drills require steady motor control and low vocal/autonomic tremor (Acute Distress Index ≤ 0.42).',
    instructions: '1. Deploy microgravity medical restraint table. 2. Perform thoracic ultrasound fast-scan. 3. Log blood pressure, glucose, and electrocardiogram telemetry.',
    completedByIds: ['stone']
  },
  {
    id: 'TASK-BIO-04',
    title: 'Microgravity Astrobiology & Cellular Radiation Repair Experiment',
    category: 'Biological Experiment',
    description: 'Precision pipetting and confocal microscopy assay measuring human leukocyte Deoxyribonucleic Acid (DNA) double-strand break repair under galactic cosmic ray exposure.',
    hazardExposed: 'Space Radiation & Vacuum',
    maxAllowedAdi: 0.44, // Requires Green ADI <= 0.44
    durationMinutes: 90,
    healthEngagementPoints: 120,
    safetyHoldExplanation: 'Bio-containment glovebox handling of live cell cultures requires Green-tier readiness (Acute Distress Index ≤ 0.44) to prevent sample contamination or pipetting error.',
    instructions: '1. Seal Biosafety Level-2 microgravity glovebox. 2. Run flow cytometry immune cell count. 3. Upload spectral fluorescence curves to onboard medical archive.',
    completedByIds: ['tanaka']
  },
  {
    id: 'TASK-ROB-05',
    title: 'Robotic Arm Grapple & Logistics Module Berthing Calibration',
    category: 'Robotic Payload Operation',
    description: 'Six-degree-of-freedom tele-robotic manipulator alignment with sub-millimeter clearance tolerances around external radiator panels.',
    hazardExposed: 'Altered Gravity Fields',
    maxAllowedAdi: 0.38, // Requires Green ADI <= 0.38
    durationMinutes: 75,
    healthEngagementPoints: 115,
    safetyHoldExplanation: 'Tele-robotic arm operations near pressurized modules require full circadian alertness and Acute Distress Index ≤ 0.38.',
    instructions: '1. Calibrate stereoscopic depth cameras. 2. Execute soft-capture latch test. 3. Confirm zero structural torque load.',
    completedByIds: []
  },
  {
    id: 'TASK-HAB-06',
    title: 'Resistive Exercise & Bone Density Countermeasure Session (ARED)',
    category: 'Habitat Life Support & Routine',
    description: 'Daily 60-minute Advanced Resistive Exercise Device (ARED) and treadmill bone-loading session to counteract microgravity osteoclastic bone loss and cardiovascular deconditioning.',
    hazardExposed: 'Altered Gravity Fields',
    maxAllowedAdi: 0.58, // Permissible in Yellow ADI (Vance at 0.47 CAN complete this!)
    durationMinutes: 60,
    healthEngagementPoints: 90,
    safetyHoldExplanation: 'Permissible in both Green and Moderate Yellow triage zones (Acute Distress Index ≤ 0.58) to support endorphin release and bone mineral preservation.',
    instructions: '1. Set vacuum cylinder resistance load. 2. Complete 4 sets of squats and deadlifts. 3. Record post-exercise heart rate and blood pressure recovery.',
    completedByIds: ['vance', 'rossi', 'tanaka']
  },
  {
    id: 'TASK-HAB-07',
    title: 'Hydroponic Nutritional Greens Harvest & Micronutrient Assay',
    category: 'Habitat Life Support & Routine',
    description: 'Tending Veggie Chamber red romaine lettuce and dwarf tomatoes to supplement crew antioxidants, Vitamin K, and fresh dietary fiber.',
    hazardExposed: 'Isolation & Confinement',
    maxAllowedAdi: 0.65, // Permissible in Yellow ADI (Vance at 0.47 CAN complete this!)
    durationMinutes: 40,
    healthEngagementPoints: 80,
    safetyHoldExplanation: 'Therapeutic horticultural task permissible up to Acute Distress Index ≤ 0.65; actively reduces isolation stress and supports crew nutrition.',
    instructions: '1. Measure root-zone moisture and electrical conductivity. 2. Harvest mature leaves for crew meal. 3. Log caloric and nutritional intake.',
    completedByIds: ['vance']
  }
];

export const INITIAL_CMO_TASK_HOLD_NOTIFICATIONS: CmoTaskHoldNotification[] = [
  {
    id: 'HOLD-901',
    astronautId: 'vance',
    astronautName: 'Elena Vance',
    astronautCallsign: 'ASTRONAUT-03',
    assignedPod: 'HABITAT POD ALPHA [01]',
    taskId: 'TASK-EVA-01',
    taskTitle: 'Extravehicular Activity (Spacewalk): Solar Truss & Radiation Shield Inspection',
    taskCategory: 'Extra-Vehicular Spacewalk',
    currentAdi: 0.47,
    requiredMaxAdi: 0.35,
    timestamp: 'Sol-184 14:18 Mission Elapsed Time',
    status: 'ACTIVE_HOLD',
    reason: 'Automated Safety Interlock: Elena Vance (Astronaut-03) has an Acute Distress Index of 0.47 (Yellow / Moderate Strain), which exceeds the ≤ 0.35 Green threshold required for Extravehicular Spacewalk.',
    cmoGuidance: 'Task automatically restricted for Elena Vance. Recommend 1800 Kelvin Amber Phototherapy + rest cycle before re-evaluating spacewalk clearance.'
  }
];

export const NASA_BODY_SYSTEM_REGIONS: BodySystemAssessment[] = [
  {
    id: 'brain',
    name: 'Brain, Ocular & Vestibular System',
    anatomicalSubtitle: 'Central Nervous System · Spaceflight-Associated Neuro-Ocular Syndrome (SANS)',
    primarySpaceHazards: ['Isolation & Confinement', 'Altered Gravity Fields', 'Space Radiation'],
    physiologicalFunction: 'Regulates circadian sleep-wake rhythms, spatial orientation, executive decision-making, mood stability, and intracranial fluid pressure.',
    spaceflightRiskExplanation: 'Microgravity shifts cephalad fluids toward the head, flattening the posterior globe of the eye (SANS). Isolation, confinement, and altered light cycles disrupt melatonin and elevate the Acute Distress Index.',
    inSpaceMeasurementMethod: 'Electroencephalogram (EEG) headband, Retinal Optical Coherence Tomography (OCT), Ocular Ultrasound, and Daily Sleep & Mood Self-Log.',
    whyExamNeeded: 'Detects optic disc edema, circadian desynchronosis, and early cognitive or behavioral fatigue before mission-critical operations.',
    whenToAlertCmoOrFlightSurgeon: 'When sleep drops below 5 hours/24h, Acute Distress Index enters Yellow (≥ 0.45) or Red (≥ 0.70), or visual acuity changes occur.',
    preventiveCountermeasures: [
      '1800 Kelvin Blue-Depleted Amber Phototherapy before sleep',
      '6 Hertz Theta Binaural Acoustic & Virtual Reality Earth Nature Immersion',
      'Lower-Body Negative Pressure (LBNP) suit to draw fluid away from cranium'
    ],
    currentMetricLabel: 'Sleep & Neural Coherence',
    currentMetricValue: '94.8% Coherence · 5.5–8.0 Hours Sleep',
    triageStatus: 'YELLOW'
  },
  {
    id: 'heart',
    name: 'Cardiovascular & Autonomic System',
    anatomicalSubtitle: 'Myocardium · Baroreceptor Reflex · Vascular Endothelium',
    primarySpaceHazards: ['Altered Gravity Fields', 'Space Radiation', 'Isolation & Confinement'],
    physiologicalFunction: 'Maintains arterial blood pressure, tissue oxygenation (SpO2), and sympathetic-parasympathetic Heart Rate Variability (HRV).',
    spaceflightRiskExplanation: 'Without Earth gravity pulling blood downward, cardiac stroke volume initially rises and then plasma volume contracts by ~15%, risking orthostatic intolerance, arrhythmias, and radiation-induced vascular stiffening.',
    inSpaceMeasurementMethod: 'Lead II Electrocardiogram (ECG), Automated Brachial Blood Pressure Cuff (mmHg), and Pulse Oximetry (SpO2 %).',
    whyExamNeeded: 'Evaluates QTc interval stability, Heart Rate Variability (rMSSD), and blood pressure regulation prior to Extravehicular Activity (Spacewalk).',
    whenToAlertCmoOrFlightSurgeon: 'Systolic Blood Pressure > 140 mmHg or < 90 mmHg, Resting Heart Rate > 95 Beats Per Minute, or Heart Rate Variability < 30 Milliseconds.',
    preventiveCountermeasures: [
      'Lower-Body Negative Pressure (LBNP) Vascular Conditioning Protocol',
      '4-7-8 Parasympathetic Respiratory Pacing Protocol',
      'Aerobic cycle ergometer & isotonic fluid-electrolyte loading'
    ],
    currentMetricLabel: 'Blood Pressure & Heart Rate',
    currentMetricValue: '124/82 mmHg · 84 Beats Per Minute',
    triageStatus: 'GREEN'
  },
  {
    id: 'bones',
    name: 'Skeletal System & Bone Mineral Density',
    anatomicalSubtitle: 'Lumbar Spine · Femoral Neck · Calcium Metabolism',
    primarySpaceHazards: ['Altered Gravity Fields', 'Hostile Closed Environment'],
    physiologicalFunction: 'Provides structural load-bearing support, protects marrow hematopoiesis, and regulates systemic calcium-phosphorus homeostasis.',
    spaceflightRiskExplanation: 'In microgravity, astronauts can lose 1% to 1.5% of weight-bearing bone mineral density per month due to osteoclastic resorption, increasing fracture risk and renal stone formation from hypercalciuria.',
    inSpaceMeasurementMethod: 'Quantitative Calcaneal Ultrasound Densitometry and Urinary Calcium/Collagen Crosslink Biomarker Strip.',
    whyExamNeeded: 'Tracks trabecular bone loss in the hip and spine and screens for elevated urinary calcium before renal calculi develop.',
    whenToAlertCmoOrFlightSurgeon: 'Bone mineral density loss exceeding -2.5% from pre-flight baseline or flank pain with hematuria.',
    preventiveCountermeasures: [
      '60 Minutes Daily Advanced Resistive Exercise Device (ARED) Loading',
      'Vitamin D3 (2000 IU/day) & Vitamin K2 Supplementation',
      'High-fluid hydration (> 2.5 Liters/day) with potassium citrate'
    ],
    currentMetricLabel: 'Bone Density Delta (Sol 184)',
    currentMetricValue: '-1.4% Lumbar / Femoral Baseline',
    triageStatus: 'GREEN'
  },
  {
    id: 'muscles',
    name: 'Muscular System & Postural Core',
    anatomicalSubtitle: 'Antigravity Slow-Twitch Fibers · Paraspinal Musculature',
    primarySpaceHazards: ['Altered Gravity Fields', 'Distance from Earth'],
    physiologicalFunction: 'Generates locomotion force, stabilizes the vertebral column, and supports Extravehicular Activity spacesuit mobility.',
    spaceflightRiskExplanation: 'Unloaded postural muscles atrophy rapidly in 0g, with Type I slow-twitch fibers converting toward fast-fatiguing fibers and spinal lengthening causing lower-back pain.',
    inSpaceMeasurementMethod: 'Ultrasound Muscle Cross-Sectional Area Scan & Handgrip Dynamometer Force Test.',
    whyExamNeeded: 'Ensures sufficient upper- and lower-body strength for emergency egress and 6-hour pressurized spacewalk tasks.',
    whenToAlertCmoOrFlightSurgeon: ' > 15% drop in isometric grip force or acute intervertebral disc herniation symptoms.',
    preventiveCountermeasures: [
      'Harness-Loaded Treadmill Running & Resistive Squats',
      '40 Hertz Vibroacoustic Bed Neuromuscular Stimulation',
      'High-leucine essential amino acid nutrition post-exercise'
    ],
    currentMetricLabel: 'Muscle Mass & Force Retention',
    currentMetricValue: '96.2% of Earth Pre-Flight Strength',
    triageStatus: 'GREEN'
  },
  {
    id: 'immune',
    name: 'Immune & Hematologic System',
    anatomicalSubtitle: 'T-Lymphocytes · Natural Killer Cells · Radiation Dosimetry',
    primarySpaceHazards: ['Space Radiation', 'Isolation & Confinement', 'Hostile Closed Environment'],
    physiologicalFunction: 'Defends against opportunistic pathogens, latent viral reactivation, and repairs cosmic-ray cellular damage.',
    spaceflightRiskExplanation: 'Galactic Cosmic Rays (GCR), Solar Particle Events, chronic cortisol elevation, and closed-loop cabin microbes dysregulate T-cell function and can reactivate latent herpesviruses.',
    inSpaceMeasurementMethod: 'Capillary Fingerstick Micro-Flow Cytometry, Salivary Cortisol Assay, and Personal Active Radiation Dosimeter (mSv).',
    whyExamNeeded: 'Identifies radiation-induced lymphopenia, cytokine shifts, or early infection in a closed habitat 148 million kilometers from Earth.',
    whenToAlertCmoOrFlightSurgeon: 'Cumulative radiation > 150 Millisieverts, body temperature > 37.8 °C, or persistent leukocyte suppression.',
    preventiveCountermeasures: [
      'Polyethylene & Water-Wall Storm Shelter during Solar Particle Events',
      'Antioxidant-rich hydroponic diet (Astaxanthin, Vitamin C & E)',
      'Stress-lowering restorative sleep & family uplink connection'
    ],
    currentMetricLabel: 'Cumulative Dose & Immune Tone',
    currentMetricValue: '42.4 Millisieverts · Mild Cytokine Shift',
    triageStatus: 'YELLOW'
  },
  {
    id: 'metabolic',
    name: 'Metabolic, Nutrition & Blood Sugar',
    anatomicalSubtitle: 'Glucose Homeostasis · Hepatic & Renal Function · Microbiome',
    primarySpaceHazards: ['Hostile Closed Environment', 'Altered Gravity Fields', 'Distance from Earth'],
    physiologicalFunction: 'Regulates blood sugar (glucose in mg/dL), caloric energy balance, hydration status, and gut microbiome diversity.',
    spaceflightRiskExplanation: 'Microgravity induces subclinical insulin resistance, altered gut motility, and menu fatigue that can lead to caloric deficit and micronutrient depletion over long Mars transits.',
    inSpaceMeasurementMethod: 'Continuous Interstitial / Capillary Blood Glucose Meter (mg/dL), Core Body Temperature Sensor (°C), and Bio-Impedance Hydration Scan.',
    whyExamNeeded: 'Prevents hypoglycemia during long tasks, screens for spaceflight insulin resistance, and verifies adequate caloric/water intake.',
    whenToAlertCmoOrFlightSurgeon: 'Fasting Blood Sugar > 125 mg/dL or < 70 mg/dL, Core Temperature > 37.5 °C, or > 3% body mass loss.',
    preventiveCountermeasures: [
      'Fresh Hydroponic Leafy Greens & Low-Glycemic Nutrient Packs',
      'Scheduled electrolyte hydration reminders every 2 hours',
      'Pre-task blood sugar verification before Spacewalk or Drills'
    ],
    currentMetricLabel: 'Blood Sugar & Core Temperature',
    currentMetricValue: '96 mg/dL · 36.8 °C Nominal',
    triageStatus: 'GREEN'
  }
];

export const VR_EARTH_ENVIRONMENTS: VrEarthEnvironment[] = [
  {
    id: 'rain',
    name: 'Rain',
    title: 'Pacific Northwest Rainstorm & Meadow',
    subtitle: '360° Spatial Acoustic Rainfall & Barometric Petrichor Simulation',
    category: 'Rain',
    panoramaImageUrl: '/assets/aistudio/Gemini_Generated_Image_nb6vkfnb6vkfnb6v_78fe1f34.jpg',
    videoUrl: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125705_6da57595.mp4',
    companionVideoUrl: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125204_916f9217.mp4',
    audioTrackUrl: '/assets/aistudio/pfa_sleep_winddown.mp3_e55511f2.mp3',
    soundscapeMode: 'rainforest',
    binauralHz: 6,
    biometricBenefit: 'Reduces sympathetic skin conductance (-34% Galvanic Skin Response) & slows respiratory rate via pink-spectrum acoustic rain.',
    fieldOfView: '210° Binocular Head-Mounted Display // 8K Stereoscopic',
    spatialCoordinates: '47.7511° North, 120.7401° West (Olympic Peninsula, Earth)',
    description: 'Immerse yourself in a cool overcast afternoon rainfall across a quiet Pacific Northwest country trail and wooden shelter.'
  },
  {
    id: 'forest',
    name: 'Forest',
    title: 'Old-Growth Woodland Canopy & Rain Trail',
    subtitle: 'Phytoncide Visual Biophilia & 6 Hertz Theta Woodland Breeze',
    category: 'Forest',
    panoramaImageUrl: '/assets/aistudio/Gemini_Generated_Image_nb6vkfnb6vkfnb6v_78fe1f34.jpg',
    videoUrl: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125204_916f9217.mp4',
    companionVideoUrl: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125705_6da57595.mp4',
    audioTrackUrl: '/assets/aistudio/winddown.mp3_01467306.mp3',
    soundscapeMode: 'forest',
    binauralHz: 6,
    biometricBenefit: 'Restores Heart Rate Variability (+18 Milliseconds) and counters deep-space sensory monotony.',
    fieldOfView: '210° Binocular Head-Mounted Display // 8K Stereoscopic',
    spatialCoordinates: '41.2132° North, 124.0046° West (Redwood National Park, Earth)',
    description: 'Walk along a moss-lined woodland path surrounded by towering trees, mist, and gentle canopy wind.'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    title: 'Open Pacific Ocean Horizon & Rhythmic Surf',
    subtitle: '0.1 Hertz Mayer-Wave Synchronized Swell & Horizon De-Confinement',
    category: 'Ocean',
    panoramaImageUrl: '/assets/aistudio/Gemini_Generated_Image_xfg3wixfg3wixfg3_da3e5266.jpg',
    videoUrl: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125705_6da57595.mp4',
    companionVideoUrl: '/assets/aistudio/earth_821cc96d.mp4',
    audioTrackUrl: '/assets/aistudio/pfa_claustrophobia.mp3_ee8488ae.mp3',
    soundscapeMode: 'ocean',
    binauralHz: 4,
    biometricBenefit: 'Directly counteracts habitat claustrophobia by expanding visual infinity focus and pacing 6-breaths-per-minute tidal waves.',
    fieldOfView: '210° Binocular Head-Mounted Display // Infinite Horizon Lock',
    spatialCoordinates: '21.3069° North, 157.8583° West (North Pacific Swell, Earth)',
    description: 'Gaze across an unbroken 360-degree horizon under atmospheric clouds and rolling rhythmic surf.'
  },
  {
    id: 'football',
    name: 'Football Match',
    title: 'Live Championship Stadium & Global Crowd Roar',
    subtitle: '80,000-Spectator Spatial Crowd Roar & Pitch Floodlight Immersion',
    category: 'Football Match',
    panoramaImageUrl: '/assets/aistudio/cloud_1__1__42fc6367.jpg',
    videoUrl: '/assets/aistudio/Students_cheer_for_Mars_crew_1080p_20261026132228_ca3b7221.mp4',
    companionVideoUrl: '/assets/aistudio/Students_cheer_for_Mars_crew_1080p_20261026132228_ca3b7221.mp4',
    soundscapeMode: 'stadium',
    binauralHz: 10,
    biometricBenefit: 'Elevates social connectedness, dopamine tone, and Earth community morale during long-duration transit isolation.',
    fieldOfView: '210° Binocular Head-Mounted Display // Club Tier Midfield Seat',
    spatialCoordinates: '40.4530° North, 3.6883° West (Championship Stadium, Earth)',
    description: 'Experience the electric atmosphere of cheering crowds and stadium energy from Earth.'
  },
  {
    id: 'family',
    name: 'Family Function',
    title: 'Warm Earth Family Gathering & Celebration',
    subtitle: 'Personal Kinship Anchor & Multi-Generational Home Atmosphere',
    category: 'Family Function',
    panoramaImageUrl: '/assets/aistudio/downloaded-image_b3238e83.png',
    videoUrl: '/assets/aistudio/Family_cheering_for_space_mission_1080p_20261026130845_86edd96e.mp4',
    companionVideoUrl: '/assets/aistudio/Family_cheering_for_space_mission_1080p_20261026130845_86edd96e.mp4',
    audioTrackUrl: '/assets/aistudio/winddown.mp3_01467306.mp3',
    soundscapeMode: 'family',
    binauralHz: 6,
    biometricBenefit: 'Oxytocin-mediated vagal stabilization; lowers cortisol index and reinforces emotional tether to home.',
    fieldOfView: '210° Binocular Head-Mounted Display // Warm Golden-Hour Render',
    spatialCoordinates: '29.5586° North, 95.0899° West (Clear Lake Coastline, Houston, Earth)',
    description: 'Join a warm family celebration with loved ones cheering and waving from home.'
  }
];

export const PFA_PROTOCOLS: PfaProtocol[] = [
  {
    key: 'pfa_default_ack',
    id: 'PROTO-PFA-00',
    title: 'Therapeutic Matrix Continuous Monitoring',
    description: 'Autonomous Psychological First Aid baseline acknowledgment, status check-in, and therapeutic readiness probe.',
    audioPath: '/assets/aistudio/pfa_default_ack.mp3_f4da9f59.mp3',
    durationSeconds: 12,
    transcript: 'Acknowledged. I am adjusting the therapeutic matrix and maintaining continuous monitoring. Tell me more about how you feel right now, and let me know if you would like me to request a medical check-in.',
    category: 'GENERAL',
    lightingMode: 'CALM_BLUE',
    vibroacousticPreset: 'OFF',
    suggestedForDisorders: ['Nominal Operational State', 'Mild Habituation Strain', 'Routine Evening Scan']
  },
  {
    key: 'pfa_panic_breathing',
    id: 'PROTO-PFA-01',
    title: '4-7-8 Parasympathetic Respiratory Pacing',
    description: 'Paced breathwork regulation for acute panic attacks, hyperventilation, and tachycardia surges.',
    audioPath: '/assets/aistudio/pfa_panic_breathing.mp3_047acfe9.mp3',
    durationSeconds: 16,
    transcript: 'Let us pace a 4-7-8 rhythm together. Inhale deeply for four seconds. Hold for seven, and slowly exhale for eight. I am adjusting the lighting and acoustic tones to assist your steady rhythm.',
    category: 'STABILIZATION',
    lightingMode: 'OCEAN_CYAN',
    vibroacousticPreset: 'GENTLE_40HZ',
    suggestedForDisorders: ['Acute Panic Episode', 'Hyperventilation Syndrome', 'Tachypnea Surge']
  },
  {
    key: 'pfa_claustrophobia',
    id: 'PROTO-PFA-02',
    title: 'Deep Touch Grounding & 3-Point Sensory Anchor',
    description: 'Confinement mitigation with deep pneumatic seat compression and Pacific Ocean soundscape.',
    audioPath: '/assets/aistudio/pfa_claustrophobia.mp3_ee8488ae.mp3',
    durationSeconds: 14,
    transcript: 'Understood. I am elevating seat pressure for deep touch grounding, and switching the soundscape to Pacific Ocean surf. Look at the furthest point you can see in the module, and name three things you notice around you.',
    category: 'GROUNDING',
    lightingMode: 'OCEAN_CYAN',
    vibroacousticPreset: 'DEEP_GROUNDING_60HZ',
    suggestedForDisorders: ['Acute Habitat Claustrophobia', 'Confined Space Syndrome', 'Sensory Dissociation']
  },
  {
    key: 'pfa_sleep_winddown',
    id: 'PROTO-PFA-03',
    title: 'Amber Phototherapy & Delta Binaural Induction',
    description: 'Circadian entrainment with 590-nanometer blue-depleted light and 3.5 Hertz Delta audio waves.',
    audioPath: '/assets/aistudio/pfa_sleep_winddown.mp3_e55511f2.mp3',
    durationSeconds: 17,
    transcript: 'Sleep is a priority. I am shifting lighting to amber phototherapy, activating delta binaural tones, and initiating the vibroacoustic bed. Close your eyes, release the tension in your body, and allow yourself to rest.',
    category: 'SLEEP',
    lightingMode: 'AMBER_WARM',
    vibroacousticPreset: 'DELTA_SYNC_35HZ',
    suggestedForDisorders: ['Circadian Desynchronosis', 'Prolonged Insomnia', 'Restless Habitat Syndrome']
  },
  {
    key: 'pfa_critical_support',
    id: 'PROTO-PFA-04',
    title: 'Acute Crisis De-escalation & Crew Medical Officer Link',
    description: 'Autonomous calming protocol for severe distress with immediate Crew Medical Officer alert dispatch.',
    audioPath: '/assets/aistudio/pfa_critical_support.mp3_a69c7764.mp3',
    durationSeconds: 15,
    transcript: 'I hear you, and you are not alone in this module. I am prioritizing your safety, softly dimming ambient stimulation, and alerting Dr. Stone. Focus on my voice and breathe with me.',
    category: 'CRITICAL',
    lightingMode: 'EMERGENCY_SOFT_RED',
    vibroacousticPreset: 'DEEP_GROUNDING_60HZ',
    suggestedForDisorders: ['Severe Agitation Crisis', 'Disorientation Paranoia', 'Acute Psychosis Precursor']
  }
];

export const INITIAL_DIAGNOSES: AiDisorderDiagnosis[] = [
  {
    id: 'DIAG-001',
    disorderName: 'Mild Habituation Strain & Circadian Drift',
    astronautId: 'vance',
    astronautName: 'Elena Vance',
    severity: 'ELEVATED',
    confidencePercentage: 92.4,
    detectedAt: 'Sol-184 14:12 Mission Elapsed Time',
    primaryBiomarkers: ['Acute Distress Index: 0.47 (Yellow)', 'Heart Rate: 84 Beats Per Minute', 'Heart Rate Variability: 43 Milliseconds', 'Sleep Duration: 5.5 Hours'],
    aiAnalysis: 'Mild sympathetic elevation place Elena Vance in the lower Yellow triage band (0.47). High-risk Extravehicular Spacewalk and Emergency Drills are placed on automated safety hold until Acute Distress Index returns to ≤ 0.35.',
    clinicalRecommendations: [
      'Engage 1800 Kelvin Amber Phototherapy and 6 Hertz Theta Binaural entrainment',
      'Postpone Extravehicular Spacewalk until Acute Distress Index is ≤ 0.35',
      'Complete low-strain Hydroponic or Resistive Exercise countermeasure routine'
    ],
    recommendedPfaKey: 'pfa_sleep_winddown',
    resolved: false
  }
];

export const INITIAL_EARTH_UPLINK_MESSAGES: EarthUplinkMedia[] = [
  {
    id: 'UPLINK-FAM-01',
    title: 'Family Video Letter: Sol 180 Greetings from Clear Lake',
    type: 'VIDEO',
    category: 'FAMILY_MESSAGE',
    senderName: 'Sarah, Leo & Maya Vance',
    senderRelation: 'Spouse & Children',
    earthOriginLocation: 'Clear Lake, Houston, Texas, United States',
    uplinkTimestamp: 'Sol-183 22:15 Coordinated Universal Time',
    dsnSignalDelay: '18m 42s light-delay (via Goldstone 70-Meter Antenna)',
    url: '/assets/aistudio/Family_cheering_for_space_mission_1080p_20261026130845_86edd96e.mp4',
    thumbnailUrl: '/assets/aistudio/downloaded-image_b3238e83.png',
    duration: '00:08',
    personalNote: 'Leo and Maya put on their NASA jackets in the study to send you a live cheer! We love you and watch your telemetry transit daily.',
    transcript: '"You\'re doing great, Mom! We\'re so proud! Go Mom, go! We love you!"',
    targetAstronautId: 'vance'
  },
  {
    id: 'UPLINK-FAM-02',
    title: 'Earth Message: Personal Encouragement & Spaceward Wishes',
    type: 'VIDEO',
    category: 'FAMILY_MESSAGE',
    senderName: 'Luca & Nonna Rossi',
    senderRelation: 'Brother & Family',
    earthOriginLocation: 'Florence, Tuscany, Italy',
    uplinkTimestamp: 'Sol-182 18:30 Coordinated Universal Time',
    dsnSignalDelay: '18m 40s light-delay (via Madrid Deep Space Network)',
    url: '/assets/aistudio/earth_821cc96d.mp4',
    thumbnailUrl: '/assets/aistudio/downloaded-image_b3238e83.png',
    duration: '00:05',
    personalNote: 'Recorded from home with the solar system and shuttle posters on the wall. The whole family is cheering your transit!',
    transcript: '"Whatever you\'re chasing, don\'t give up. The universe is waiting for you."',
    targetAstronautId: 'rossi'
  },
  {
    id: 'UPLINK-FAM-03',
    title: 'Countryside Rainstorm & Tranquil Meadow Video Letter',
    type: 'VIDEO',
    category: 'FAMILY_MESSAGE',
    senderName: 'Haruto & Aoi Tanaka',
    senderRelation: 'Brother & Sister',
    earthOriginLocation: 'Kyoto Highlands, Japan',
    uplinkTimestamp: 'Sol-181 11:20 Coordinated Universal Time',
    dsnSignalDelay: '18m 36s light-delay (via Canberra Deep Space Network)',
    url: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125705_6da57595.mp4',
    thumbnailUrl: '/assets/aistudio/Gemini_Generated_Image_nb6vkfnb6vkfnb6v_78fe1f34.jpg',
    duration: '00:08',
    personalNote: 'Recorded in 360° along the quiet rain-soaked country trail so you can watch and hear real Earth rainfall before sleep.',
    transcript: '"Kenji-san, we know the schedule has been demanding. Watch the raindrops falling across the green meadow and let the sound of Earth rain bring you deep rest."',
    targetAstronautId: 'tanaka'
  },
  {
    id: 'UPLINK-ENTHUSIAST-01',
    title: 'Global Youth Space Club: London, Tokyo, Washington D.C. & Seoul Cheer',
    type: 'VIDEO',
    category: 'SPACE_ENTHUSIAST',
    senderName: 'International Youth Aerospace Alliance',
    senderRelation: 'Space Enthusiasts & Science Students',
    earthOriginLocation: 'London, Tokyo, Washington D.C., Seoul',
    uplinkTimestamp: 'Sol-180 14:00 Coordinated Universal Time',
    dsnSignalDelay: '18m 28s light-delay',
    url: '/assets/aistudio/Students_cheer_for_Mars_crew_1080p_20261026132228_ca3b7221.mp4',
    thumbnailUrl: '/assets/aistudio/cloud_1__1__42fc6367.jpg',
    duration: '00:08',
    personalNote: 'Thousands of Global Youth Space Club students gathered in London, Tokyo, Washington D.C., and Seoul to wave flags for the ARES Mars Crew!',
    transcript: '"Global Youth Space Club cheering for the Mars crew! London, Tokyo, Washington D.C. — Go, go, go!"',
    targetAstronautId: 'ALL_CREW'
  },
  {
    id: 'UPLINK-ENTHUSIAST-02',
    title: 'Earth Virtual Reality Nature Society: Immersive Rain Walk & Shelter Feed',
    type: 'VIDEO',
    category: 'SPACE_ENTHUSIAST',
    senderName: 'Deep Space Biophilia Guild',
    senderRelation: 'Earth Nature & Virtual Reality Enthusiasts',
    earthOriginLocation: 'Olympic Peninsula, Washington, United States',
    uplinkTimestamp: 'Sol-178 09:15 Coordinated Universal Time',
    dsnSignalDelay: '18m 10s light-delay',
    url: '/assets/aistudio/Man_viewing_rain_VR_video_1080p_20261026125204_916f9217.mp4',
    thumbnailUrl: '/assets/aistudio/Gemini_Generated_Image_xfg3wixfg3wixfg3_da3e5266.jpg',
    duration: '00:08',
    personalNote: 'High-definition field recording of a rainy afternoon walk on Earth, sent to help the crew counter deep-space habitat confinement.',
    transcript: '"Sending the sights and sounds of a fresh Earth rainstorm across 148 million kilometers. Every human on Earth is cheering for your safe journey!"',
    targetAstronautId: 'ALL_CREW'
  }
];

export const SPACECRAFT_NAVIGATION_TELEMETRY: SpacecraftNavigationTelemetry = {
  distanceTraveledKm: 148240500, // 148.2 Million kilometers from Earth
  distanceRemainingKm: 68520300, // 68.5 Million kilometers to Mars
  totalTransitDistanceKm: 216760800, // 216.7 Million kilometers Hohmann transfer arc
  transitProgressPercent: 68.4,
  currentVelocityKmS: 24.62, // 88,632 kilometers per hour heliocentric velocity
  estimatedTimeToArrival: '64 Days 08 Hours 12 Minutes',
  trajectoryAngleDeg: 42.18,
  perihelionAu: 1.000,
  aphelionAu: 1.524,
  radiationShieldIntegrityPercent: 98.4,
  eclssCabinPressureKpa: 101.3,
  oxygenPercentage: 20.9,
  co2Ppm: 380,
  hullIntegrityPercent: 100.0,
  lastTelemetryPing: '0.4 Seconds Ago (Deep Space Telemetry Link Alpha)'
};

export const INITIAL_GROUND_CALLS: GroundCallRecord[] = [
  {
    id: 'CALL-8801',
    patientId: 'vance',
    patientName: 'Elena Vance',
    cmoName: 'Dr. Evelyn Stone (Crew Medical Officer)',
    reason: 'Routine Sol-184 Yellow-band Acute Distress Index (0.47) review & Extravehicular Activity task postponement consultation.',
    priority: 'ROUTINE',
    status: 'ACKNOWLEDGED',
    timestamp: '14:15 Mission Elapsed Time',
    flightSurgeonName: 'Dr. Sarah Jenkins (NASA Johnson Space Center Flight Surgeon)',
    groundResponse: 'Houston Johnson Space Center received telemetry. Ground concurs with postponing Extravehicular Activity while Acute Distress Index is 0.47 (Yellow) and recommends 1800 Kelvin circadian phototherapy.',
    groundRespondedAt: '14:18 Mission Elapsed Time'
  }
];

export const INITIAL_OVERRIDE_LOGS: OverrideLogEntry[] = [
  {
    id: 'AUTH-101',
    timestamp: 'T+162 Days 04:12 Mission Elapsed Time',
    category: 'ANTI_PSYCHOTIC_READINESS_DRILL',
    reason: 'Routine Dual-Key cryptographic verification drill in Medical Bay',
    authorizedBy: 'Flight Commander Walker & Crew Medical Officer Dr. Stone (CAP99 / CMO00)',
    status: 'EXECUTED_AUTHORIZED',
    details: 'Dual-key hardware safety interlock verified.'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG-01',
    sender: 'ARES_AI',
    senderName: 'Autonomous Recovery & Equilibrium System (ARES) — Psychological First Aid',
    text: 'Habitat Pod active. I am monitoring your Acute Distress Index continuously and can adjust the Therapeutic Matrix for you. How are you feeling right now?',
    timestamp: '14:20 Mission Elapsed Time',
    audioKey: 'pfa_default_ack'
  }
];
