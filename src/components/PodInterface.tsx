import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Send,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Music,
  Globe,
  Navigation as NavigationIcon,
  Compass,
  Maximize2,
  Eye,
  RotateCcw,
  Sliders,
  Paperclip,
  Lock,
  BellRing,
  Video,
  HeartPulse
} from 'lucide-react';
import { 
  AstronautProfile, 
  PfaProtocol, 
  EarthUplinkMedia, 
  SpacecraftNavigationTelemetry, 
  ChatMessage,
  OverrideLogEntry,
  VrEarthEnvironment,
  CmoEmergencyAlarm,
  MissionChecklistTask,
  CmoTaskHoldNotification
} from '../types/ares';
import { 
  PFA_PROTOCOLS, 
  INITIAL_EARTH_UPLINK_MESSAGES, 
  SPACECRAFT_NAVIGATION_TELEMETRY,
  INITIAL_CHAT_MESSAGES,
  VR_EARTH_ENVIRONMENTS,
  INITIAL_ASTRONAUTS,
  INITIAL_MISSION_CHECKLIST_TASKS,
  INITIAL_CMO_TASK_HOLD_NOTIFICATIONS
} from '../data/mockAresData';
import { soundEngine } from '../services/audioService';
import { EmergencyAntiPsychoticModal } from './EmergencyAntiPsychoticModal';
import { CinematicEarthHeaderBg } from './CinematicEarthHeaderBg';
import { MissionChecklistAndHealthSection } from './MissionChecklistAndHealthSection';
import {
  canExecuteDoomsdayOverride,
  sampleConsistentEcgPoint,
  computeSteadyEegBands,
  calculateAdi,
  calculateAdiLevel
} from '../utils/pfaLogic';

interface PodInterfaceProps {
  astronaut: AstronautProfile;
  astronauts?: AstronautProfile[];
  onUpdateAstronaut: (updated: AstronautProfile) => void;
  onAlertCmo: (reason: string) => void;
  isAiVoiceEnabled: boolean;
  missionTime: string;
  onAddOverrideLog?: (entry: OverrideLogEntry) => void;
  overrideLogs?: OverrideLogEntry[];
  activeCmoAlarm?: CmoEmergencyAlarm | null;
  onAcknowledgeCmoAlarm?: (acknowledgedByName?: string) => void;
  missionTasks?: MissionChecklistTask[];
  onToggleTaskComplete?: (taskId: string, astronautId: AstronautProfile['id']) => void;
  cmoTaskHoldNotifications?: CmoTaskHoldNotification[];
  onNotifyCmoTaskHold?: (notification: CmoTaskHoldNotification) => void;
}

export const PodInterface: React.FC<PodInterfaceProps> = ({
  astronaut,
  astronauts = INITIAL_ASTRONAUTS,
  onUpdateAstronaut,
  onAlertCmo,
  missionTime,
  onAddOverrideLog = () => {},
  overrideLogs = [],
  activeCmoAlarm = null,
  missionTasks = INITIAL_MISSION_CHECKLIST_TASKS,
  onToggleTaskComplete = () => {},
  cmoTaskHoldNotifications = INITIAL_CMO_TASK_HOLD_NOTIFICATIONS,
  onNotifyCmoTaskHold = () => {}
}) => {
  // Navigation Tabs (includes Mission Checklist & Health Assessment and Virtual Reality Earth Environments)
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'mission_checklist' | 'therapeutics' | 'pfa' | 'vr_environments' | 'family_media' | 'navigation_safety'
  >('telemetry');

  // Old-Style Therapeutic Matrix State (Matches image_917e2069.png)
  const [photoPreset, setPhotoPreset] = useState<'wake' | 'sleep'>('sleep');
  const [photoBrightness, setPhotoBrightness] = useState<number>(15);
  const [binauralFreq, setBinauralFreq] = useState<number>(6); // 6 Hz Theta
  const [soundscapeMode, setSoundscapeMode] = useState<string>('rainforest');
  const [vibroFreq, setVibroFreq] = useState<number>(40); // 40 Hz
  const [seatPressure, setSeatPressure] = useState<number>(12); // 12 kPa

  // Live PFA Audio Player
  const [activeVoiceover, setActiveVoiceover] = useState<PfaProtocol | null>(null);
  const [isVoiceoverPlaying, setIsVoiceoverPlaying] = useState<boolean>(false);
  const [voiceoverTime, setVoiceoverTime] = useState<number>(0);
  const [voiceoverDuration, setVoiceoverDuration] = useState<number>(16);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VR Earth Environments State (Rain, Forest, Ocean, Football Match, Family Function)
  const [selectedVrEnvId, setSelectedVrEnvId] = useState<'rain' | 'forest' | 'ocean' | 'football' | 'family'>('rain');
  const [isVrPlaying, setIsVrPlaying] = useState<boolean>(true);
  const [vrStereoMode, setVrStereoMode] = useState<boolean>(false);
  const [vrYawDeg, setVrYawDeg] = useState<number>(0);
  const [isDraggingVr, setIsDraggingVr] = useState<boolean>(false);
  const vrDragStartX = useRef<number>(0);
  const vrMainVideoRef = useRef<HTMLVideoElement>(null);
  const vrCompanionVideoRef = useRef<HTMLVideoElement>(null);

  // Earth Uplink Media (Family & Space Enthusiasts)
  const [uplinkMessages] = useState<EarthUplinkMedia[]>(INITIAL_EARTH_UPLINK_MESSAGES);
  const [selectedUplinkId, setSelectedUplinkId] = useState<string>(INITIAL_EARTH_UPLINK_MESSAGES[0].id);
  const [isMediaPlaying, setIsMediaPlaying] = useState<boolean>(true);

  // Spacecraft Navigation & Interactive Heliocentric Trajectory Radar State
  const [navTelemetry] = useState<SpacecraftNavigationTelemetry>(SPACECRAFT_NAVIGATION_TELEMETRY);
  const [inspectedSol, setInspectedSol] = useState<number>(184); // 0 to 248 Sol Hohmann transit
  const [selectedOrbitNode, setSelectedOrbitNode] = useState<'ARES-V' | 'EARTH' | 'MARS' | 'SUN'>('ARES-V');
  const [radarZoom, setRadarZoom] = useState<number>(1.0);

  // Emergency Call CMO Modal State
  const [isCmoCallPromptOpen, setIsCmoCallPromptOpen] = useState<boolean>(false);
  const [cmoCallReason, setCmoCallReason] = useState<string>('Acute sensory distress & elevated heart rate');
  const [cmoAlertSuccess, setCmoAlertSuccess] = useState<string>('');

  // Doomsday Anti-Psychotic Override Modal (Astronaut Emergency Override ONLY for bypassing Dual-Key in Anti-Psychotic Protocol)
  const [isDoomsdayEapOpen, setIsDoomsdayEapOpen] = useState<boolean>(false);

  // Canvas refs
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const eegCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);
  const vrCanvasRef = useRef<HTMLCanvasElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  const selectedVrEnv: VrEarthEnvironment =
    VR_EARTH_ENVIRONMENTS.find(e => e.id === selectedVrEnvId) || VR_EARTH_ENVIRONMENTS[0];

  // AUTOMATIC VOICE NARRATION ON POD LOGIN (No Button, starts automatically when Astronaut, CMO, or Flight Commander enters Pod)
  useEffect(() => {
    soundEngine.speakPodWelcome(astronaut);
    return () => {
      soundEngine.stopNarration();
      soundEngine.setSoundscape('off');
      soundEngine.stopBinaural();
    };
  }, [astronaut.id]);

  // Compute ADI (Acute Distress Index)
  const hr = astronaut.vitals.heartRate;
  const hrv = astronaut.vitals.hrv;
  const spo2 = astronaut.vitals.spo2;
  const sleepQ = Math.round(Math.min(100, (astronaut.vitals.sleepHoursLast24 / 8) * 100));
  const voiceJitter = astronaut.vitals.skinConductanceUs > 10 ? 4.8 : astronaut.vitals.skinConductanceUs > 5.5 ? 1.8 : 0.6;

  const adiScore = calculateAdi(astronaut.vitals);
  const adiLevel = calculateAdiLevel(astronaut.vitals);
  const adiLabel = adiScore >= 0.70 ? 'CRITICAL HIGH' : adiScore >= 0.45 ? 'MODERATE (YELLOW)' : 'PERFECT NOMINAL';

  // Self-Health Indicator Check-In & Dynamic 7-Sol Trend Chart State (Moved to Top of Biometrics & Waveforms)
  const [bpSystolic, setBpSystolic] = useState<number>(astronaut.vitals.bloodPressureSystolic || 122);
  const [bpDiastolic, setBpDiastolic] = useState<number>(astronaut.vitals.bloodPressureDiastolic || 80);
  const [bloodSugar, setBloodSugar] = useState<number>(astronaut.vitals.bloodSugarMgDl || 94);
  const [bodyTemp, setBodyTemp] = useState<number>(astronaut.vitals.coreTempCelsius || 36.8);
  const [sleepHours, setSleepHours] = useState<number>(astronaut.vitals.sleepHoursLast24 || 6.0);
  const [heartRateInput, setHeartRateInput] = useState<number>(astronaut.vitals.heartRate || 78);
  const [moodInput, setMoodInput] = useState<AstronautProfile['vitals']['moodState']>(
    astronaut.vitals.moodState || 'Focused & Calm'
  );
  const [ultrasoundCheck, setUltrasoundCheck] = useState<string>(
    'Normal Optic Nerve Sheath & Cardiac Ejection Fraction'
  );
  const [assessmentSavedMsg, setAssessmentSavedMsg] = useState<string>('');
  const [trendMetric, setTrendMetric] = useState<'adi' | 'bloodSugar' | 'systolicBp' | 'sleep'>('adi');

  useEffect(() => {
    setBpSystolic(astronaut.vitals.bloodPressureSystolic || 122);
    setBpDiastolic(astronaut.vitals.bloodPressureDiastolic || 80);
    setBloodSugar(astronaut.vitals.bloodSugarMgDl || 94);
    setBodyTemp(astronaut.vitals.coreTempCelsius || 36.8);
    setSleepHours(astronaut.vitals.sleepHoursLast24 || 6.0);
    setHeartRateInput(astronaut.vitals.heartRate || 78);
    setMoodInput(astronaut.vitals.moodState || 'Focused & Calm');
  }, [astronaut.id]);

  const handleSaveSelfAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playBiometricScanPing();

    const updatedAstronaut: AstronautProfile = {
      ...astronaut,
      vitals: {
        ...astronaut.vitals,
        heartRate: heartRateInput,
        coreTempCelsius: bodyTemp,
        sleepHoursLast24: sleepHours,
        bloodPressureSystolic: bpSystolic,
        bloodPressureDiastolic: bpDiastolic,
        bloodSugarMgDl: bloodSugar,
        moodState: moodInput
      }
    };

    onUpdateAstronaut(updatedAstronaut);
    const updatedAdi = calculateAdi(updatedAstronaut.vitals);
    setAssessmentSavedMsg(
      `Self-Assessment Logged: Blood Pressure ${bpSystolic}/${bpDiastolic} mmHg, Blood Sugar ${bloodSugar} mg/dL, Body Temperature ${bodyTemp.toFixed(1)} °C, Sleep ${sleepHours.toFixed(1)} Hours. Updated Acute Distress Index: ${updatedAdi.toFixed(2)}.`
    );
    setTimeout(() => setAssessmentSavedMsg(''), 6000);
  };

  const trendSols = ['Sol 178', 'Sol 179', 'Sol 180', 'Sol 181', 'Sol 182', 'Sol 183', 'Sol 184 (Today)'];
  const getTrendSeries = () => {
    if (trendMetric === 'adi') {
      return {
        label: 'Acute Distress Index (0.00 – 1.00)',
        unit: 'Index',
        thresholdLabel: 'Green Optimal < 0.45 · Yellow Moderate 0.45–0.69 · Red Critical ≥ 0.70',
        values:
          astronaut.id === 'vance'
            ? [0.24, 0.28, 0.33, 0.39, 0.42, 0.45, adiScore]
            : [0.11, 0.10, 0.09, 0.08, 0.09, 0.08, adiScore],
        maxScale: 1.0,
        minScale: 0.0,
        color: adiScore >= 0.45 ? '#fbbf24' : '#10b981'
      };
    }
    if (trendMetric === 'bloodSugar') {
      return {
        label: 'Capillary Blood Sugar (Milligrams per Deciliter)',
        unit: 'mg/dL',
        thresholdLabel: 'Nominal Fasting Range: 70 – 105 mg/dL',
        values: [88, 91, 90, 94, 92, 95, bloodSugar],
        maxScale: 140,
        minScale: 60,
        color: '#38bdf8'
      };
    }
    if (trendMetric === 'systolicBp') {
      return {
        label: 'Systolic Arterial Blood Pressure (Millimeters of Mercury)',
        unit: 'mmHg',
        thresholdLabel: 'Nominal Microgravity Target: 110 – 128 mmHg',
        values: [116, 118, 119, 121, 120, 122, bpSystolic],
        maxScale: 160,
        minScale: 80,
        color: '#818cf8'
      };
    }
    return {
      label: 'Daily Circadian Sleep Duration (Hours per 24 Hours)',
      unit: 'Hours',
      thresholdLabel: 'Target Restorative Sleep: 7.0 – 8.5 Hours',
      values:
        astronaut.id === 'vance'
          ? [7.4, 7.1, 6.8, 6.4, 6.0, 5.8, sleepHours]
          : [7.8, 8.0, 7.9, 8.1, 7.8, 8.0, sleepHours],
      maxScale: 10,
      minScale: 0,
      color: '#34d399'
    };
  };
  const trendData = getTrendSeries();

  const selectedUplink = uplinkMessages.find(m => m.id === selectedUplinkId) || uplinkMessages[0];

  // Play PFA Audio
  const playPfaVoice = (proto: PfaProtocol) => {
    setActiveVoiceover(proto);
    setVoiceoverDuration(proto.durationSeconds);
    setVoiceoverTime(0);
    setIsVoiceoverPlaying(true);

    soundEngine.playPfaAudio(
      proto.audioPath,
      (curr, dur) => {
        setVoiceoverTime(curr);
        if (dur) setVoiceoverDuration(dur);
      },
      () => {
        setIsVoiceoverPlaying(false);
        setVoiceoverTime(0);
      }
    );
  };

  const toggleVoiceoverPlayback = () => {
    if (isVoiceoverPlaying) {
      soundEngine.stopPfaAudio();
      setIsVoiceoverPlaying(false);
    } else if (activeVoiceover) {
      playPfaVoice(activeVoiceover);
    }
  };

  // Send AI PFA chat message
  const handleSendPfa = () => {
    if (!chatInput.trim()) return;
    soundEngine.playBeep(1950, 0.04);

    const userMsg: ChatMessage = {
      id: `USR-${Date.now()}`,
      sender: 'ASTRONAUT',
      senderName: astronaut.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInputText = chatInput.toLowerCase();
    setChatInput('');

    setTimeout(() => {
      let matchedProto = PFA_PROTOCOLS[0];
      let aiResponse = "Acknowledged. I am maintaining continuous biotelemetry monitoring and optimizing your pod's circadian lighting and acoustic matrix.";

      if (currentInputText.includes('panic') || currentInputText.includes('breathe') || currentInputText.includes('heart')) {
        matchedProto = PFA_PROTOCOLS[1];
        aiResponse = "Let us pace a 4-7-8 respiratory rhythm together. Inhale for 4 seconds, hold for 7, and exhale slowly for 8. Shifting soundscape to soothing rainfall.";
      } else if (currentInputText.includes('walls') || currentInputText.includes('trapped') || currentInputText.includes('tight') || currentInputText.includes('claustro')) {
        matchedProto = PFA_PROTOCOLS[2];
        setSeatPressure(18);
        setSoundscapeMode('ocean');
        aiResponse = "Elevating somatosensory deep-pressure seat to 18 kPa for grounding and switching acoustic matrix to Pacific Ocean surf.";
      } else if (currentInputText.includes('sleep') || currentInputText.includes('tired') || currentInputText.includes('insomnia')) {
        matchedProto = PFA_PROTOCOLS[3];
        setPhotoPreset('sleep');
        setPhotoBrightness(15);
        setBinauralFreq(4);
        aiResponse = "Shifting circadian array to 1800K Amber (15% intensity) and activating 4 Hz Delta binaural entrainment.";
      }

      playPfaVoice(matchedProto);

      const aiMsg: ChatMessage = {
        id: `AI-${Date.now()}`,
        sender: 'ARES_AI',
        senderName: 'ARES AI - PFA',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioKey: matchedProto.key
      };

      setChatMessages(prev => [...prev, aiMsg]);
      chatStreamRef.current?.scrollTo({ top: chatStreamRef.current.scrollHeight, behavior: 'smooth' });
    }, 600);
  };

  const handleAttachMediaToChat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg: ChatMessage = {
      id: `ATT-${Date.now()}`,
      sender: 'ASTRONAUT',
      senderName: astronaut.name,
      text: `📎 Attached biometric/voice log: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msg]);
    e.target.value = '';
  };

  // Toggle VR Environment Playback & Spatial Soundscape
  const handleSelectVrEnvironment = (env: VrEarthEnvironment) => {
    setSelectedVrEnvId(env.id);
    setVrYawDeg(0);
    soundEngine.playBeep(1850, 0.04);
    if (isVrPlaying) {
      soundEngine.setSoundscape(env.soundscapeMode);
      soundEngine.setBinauralBeat(env.binauralHz, true);
      if (env.audioTrackUrl) {
        soundEngine.playPfaAudio(env.audioTrackUrl);
      }
    }
  };

  const handleToggleVrSimulation = () => {
    const nextState = !isVrPlaying;
    setIsVrPlaying(nextState);
    if (nextState) {
      soundEngine.playBiometricScanPing();
      soundEngine.setSoundscape(selectedVrEnv.soundscapeMode);
      soundEngine.setBinauralBeat(selectedVrEnv.binauralHz, true);
      if (selectedVrEnv.audioTrackUrl) {
        soundEngine.playPfaAudio(selectedVrEnv.audioTrackUrl);
      }
      vrMainVideoRef.current?.play().catch(() => {});
      vrCompanionVideoRef.current?.play().catch(() => {});
    } else {
      soundEngine.setSoundscape('off');
      soundEngine.stopBinaural();
      soundEngine.stopPfaAudio();
      vrMainVideoRef.current?.pause();
      vrCompanionVideoRef.current?.pause();
    }
  };

  // Trigger Emergency CMO Call & Ship-Wide Medical Alarm System
  const handleConfirmCmoCall = () => {
    onAlertCmo(cmoCallReason);
    setCmoAlertSuccess(`EMERGENCY CMO ALARM ACTIVATED! Audible & visual klaxon triggered on Dr. Evelyn Stone's CMO Console with live pod biotelemetry.`);
    
    setTimeout(() => {
      setIsCmoCallPromptOpen(false);
      setCmoAlertSuccess('');
    }, 2200);
  };

  // REAL-TIME CLINICAL ECG (LEAD II) + STEADY EEG POWER SPECTRUM CANVASES
  useEffect(() => {
    if (activeTab !== 'telemetry') return;
    let animId: number;
    let sweepX = 0;
    let beatPhase = 0;
    const ecgBuffer: number[] = [];
    let smoothedEegValues: number[] = [0.28, 0.46, 0.39, 0.34];

    // Standard hospital telemetry: 25 mm/s paper speed -> ~5.5 ms per horizontal pixel
    const msPerPixel = 5.5;

    const renderTelemetry = () => {
      // 1. Consistent Real-Life Clinical Lead II ECG & HRV Rhythm
      const ecgCanvas = ecgCanvasRef.current;
      if (ecgCanvas && ecgCanvas.parentElement) {
        const w = ecgCanvas.parentElement.clientWidth || 560;
        const h = ecgCanvas.parentElement.clientHeight || 176;
        if (ecgCanvas.width !== w || ecgCanvas.height !== h) {
          ecgCanvas.width = w;
          ecgCanvas.height = h;
          ecgBuffer.length = 0;
        }
        const ctx = ecgCanvas.getContext('2d');
        if (ctx) {
          // Deep hospital monitor background
          ctx.fillStyle = '#050a12';
          ctx.fillRect(0, 0, w, h);

          // Minor 5mm & Major 25mm clinical ECG calibration grid
          ctx.lineWidth = 1;
          for (let gx = 0; gx < w; gx += 10) {
            ctx.strokeStyle = gx % 50 === 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.045)';
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
          }
          for (let gy = 0; gy < h; gy += 10) {
            ctx.strokeStyle = gy % 50 === 0 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.045)';
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
          }

          // Isoelectric baseline reference
          const midY = h * 0.62;
          const mvScale = h * 0.42; // 1.0 mV height in pixels
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, midY);
          ctx.lineTo(w, midY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Consistent R-R interval from astronaut's real heart rate with gentle, realistic RSA modulation (<1.5%)
          const nowMs = performance.now();
          const gentleRsa = Math.sin(nowMs / 4500) * 0.012;
          const effectivePeriodMs = (60000 / Math.max(48, Math.min(160, hr))) * (1 + gentleRsa);
          const dPhasePerPixel = msPerPixel / effectivePeriodMs;

          // Pre-fill full ECG trace on first render so every complex across the screen is immediately consistent
          if (ecgBuffer.length < w) {
            let initPhase = 0;
            for (let initX = 0; initX < w; initX++) {
              const nextPhase = initPhase + dPhasePerPixel;
              const v = sampleConsistentEcgPoint(initPhase, nextPhase, 8);
              ecgBuffer[initX] = midY - v * mvScale;
              initPhase = nextPhase % 1;
            }
            beatPhase = initPhase;
            sweepX = w - 1;
          }

          // Advance circular sweep head by 2 pixels per frame using peak-preserving sub-sampling
          for (let s = 0; s < 2; s++) {
            const nextPhase = beatPhase + dPhasePerPixel;
            const voltage = sampleConsistentEcgPoint(beatPhase, nextPhase, 8);
            sweepX = (sweepX + 1) % w;
            ecgBuffer[sweepX] = midY - voltage * mvScale;
            beatPhase = nextPhase % 1;
          }

          // Draw continuous Lead II ECG waveform with phosphor erase bar ahead of sweepX
          const eraseGap = 20;
          const traceColor = hr > 95 ? '#fb7185' : '#10b981';
          ctx.strokeStyle = traceColor;
          ctx.lineWidth = 2.1;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.shadowColor = hr > 95 ? '#f43f5e' : '#10b981';
          ctx.shadowBlur = 6;

          ctx.beginPath();
          let drawing = false;
          for (let x = 0; x < w; x++) {
            const distAhead = (x - sweepX + w) % w;
            if (distAhead > 0 && distAhead < eraseGap) {
              drawing = false;
              continue;
            }
            const y = ecgBuffer[x] ?? midY;
            if (!drawing) {
              ctx.moveTo(x, y);
              drawing = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Bright phosphor leading cursor dot at sweepX
          const headY = ecgBuffer[sweepX] ?? midY;
          ctx.fillStyle = '#ecfdf5';
          ctx.beginPath();
          ctx.arc(sweepX, headY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Standard 1 mV clinical calibration square pulse indicator at top-right
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w - 58, 28);
          ctx.lineTo(w - 52, 28);
          ctx.lineTo(w - 52, 12);
          ctx.lineTo(w - 40, 12);
          ctx.lineTo(w - 40, 28);
          ctx.lineTo(w - 34, 28);
          ctx.stroke();
          ctx.fillStyle = '#6ee7b7';
          ctx.font = '9px monospace';
          ctx.fillText('1mV', w - 31, 23);

          // Live R-R & HRV HUD overlay inside ECG monitor
          const liveRrMs = Math.round(60000 / Math.max(48, hr));
          ctx.fillStyle = 'rgba(7, 13, 25, 0.84)';
          ctx.fillRect(10, 8, 290, 22);
          ctx.font = '11px monospace';
          ctx.fillStyle = '#34d399';
          ctx.fillText(`LEAD II | R-R: ${liveRrMs} ms | HRV rMSSD: ${hrv} ms`, 16, 23);
        }
      }

      // 2. Slow, Steady, Realistic EEG Power Spectrum (DELTA / THETA / ALPHA / BETA)
      const eegCanvas = eegCanvasRef.current;
      if (eegCanvas && eegCanvas.parentElement) {
        const w2 = eegCanvas.parentElement.clientWidth || 320;
        const h2 = eegCanvas.parentElement.clientHeight || 176;
        if (eegCanvas.width !== w2 || eegCanvas.height !== h2) {
          eegCanvas.width = w2;
          eegCanvas.height = h2;
        }
        const c2 = eegCanvas.getContext('2d');
        if (c2) {
          c2.fillStyle = '#070b14';
          c2.fillRect(0, 0, w2, h2);

          // Subtle horizontal scale lines
          c2.strokeStyle = 'rgba(34, 211, 238, 0.08)';
          c2.lineWidth = 1;
          for (let gy = 20; gy < h2 - 24; gy += 28) {
            c2.beginPath();
            c2.moveTo(0, gy);
            c2.lineTo(w2, gy);
            c2.stroke();
          }

          const steadyBands = computeSteadyEegBands(performance.now());
          smoothedEegValues = steadyBands.map((b, idx) => {
            const prev = smoothedEegValues[idx] ?? b.value;
            return prev + (b.value - prev) * 0.04;
          });

          const barW = (w2 - 60) / 4;

          steadyBands.forEach((b, i) => {
            const val = smoothedEegValues[i] ?? b.value;
            const maxBarH = h2 - 44;
            const barH = val * maxBarH;
            const x = 14 + i * (barW + 10);
            const y = h2 - 24 - barH;

            c2.fillStyle = b.color;
            c2.fillRect(x, y, barW, barH);

            // Top steady horizon cap on each bar
            c2.fillStyle = '#ffffff';
            c2.fillRect(x, y, barW, 2);

            // MicroV power label on top of bar (1 decimal for smooth, steady clinical readout)
            c2.fillStyle = '#e2e8f0';
            c2.font = 'bold 10px monospace';
            c2.fillText(`${(val * 100).toFixed(1)}µV²`, x + 2, y - 6);

            // Band name at bottom
            c2.fillStyle = 'rgba(255, 255, 255, 0.72)';
            c2.font = '10px monospace';
            c2.fillText(b.shortLabel, x + 2, h2 - 8);
          });
        }
      }

      animId = requestAnimationFrame(renderTelemetry);
    };

    animId = requestAnimationFrame(renderTelemetry);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, hr, hrv]);

  // VR EARTH ENVIRONMENT PARTICLE & HUD OVERLAY CANVAS
  useEffect(() => {
    if (activeTab !== 'vr_environments') return;
    let animId: number;

    const particles = Array.from({ length: 65 }, (_, i) => ({
      x: (i * 37) % 800,
      y: (i * 53) % 420,
      speedY: 1.5 + (i % 5) * 0.8,
      speedX: -0.5 + (i % 3) * 0.5,
      size: 1.5 + (i % 4)
    }));

    const renderVrOverlay = () => {
      const canvas = vrCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const t = performance.now() / 1000;

          if (selectedVrEnv.id === 'rain') {
            // Animated rain streaks & water ripples
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
            ctx.lineWidth = 1.4;
            particles.forEach(p => {
              if (isVrPlaying) {
                p.y = (p.y + p.speedY * 4.5) % h;
                p.x = (p.x - 1.2 + w) % w;
              }
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p.x - 4, p.y + 16);
              ctx.stroke();
            });
          } else if (selectedVrEnv.id === 'forest') {
            // Golden woodland sunbeams & floating pollen spores
            const grad = ctx.createLinearGradient(w * 0.3, 0, w * 0.6, h);
            grad.addColorStop(0, 'rgba(253, 224, 71, 0.14)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = 'rgba(167, 243, 208, 0.65)';
            particles.slice(0, 35).forEach((p, idx) => {
              const px = (p.x + Math.sin(t + idx) * 20) % w;
              const py = (p.y + (isVrPlaying ? t * 14 : 0)) % h;
              ctx.beginPath();
              ctx.arc(px, py, 2.2, 0, Math.PI * 2);
              ctx.fill();
            });
          } else if (selectedVrEnv.id === 'ocean') {
            // Gentle horizon wave breathing guide & sea mist shimmer
            const swellRadius = 42 + Math.sin(t * 1.1) * 14;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(w / 2, h * 0.52, swellRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
            ctx.font = '11px monospace';
            ctx.fillText('TIDAL RESPIRATION LOCK: 0.1 Hz SWELL', w / 2 - 110, h * 0.52 + swellRadius + 18);
          } else if (selectedVrEnv.id === 'football') {
            // Stadium floodlight volumetric shimmer & live match telemetry HUD
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.fillRect(16, 16, 290, 32);
            ctx.strokeStyle = '#22d3ee';
            ctx.strokeRect(16, 16, 290, 32);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('LIVE EARTH STADIUM FEED // 74:18 [2 - 1]', 26, 36);
          } else if (selectedVrEnv.id === 'family') {
            // Warm golden-hour family hearth bokeh particles
            particles.slice(0, 30).forEach((p, idx) => {
              const px = (p.x + Math.cos(t * 0.6 + idx) * 25) % w;
              const py = (p.y + Math.sin(t * 0.5 + idx) * 15) % h;
              ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
              ctx.beginPath();
              ctx.arc(px, py, 3 + (idx % 4), 0, Math.PI * 2);
              ctx.fill();
            });
          }

          // Sci-Fi VR Visor Compass Tape at Top
          ctx.fillStyle = 'rgba(6, 11, 22, 0.75)';
          ctx.fillRect(w / 2 - 140, 10, 280, 24);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.strokeRect(w / 2 - 140, 10, 280, 24);
          ctx.fillStyle = '#22d3ee';
          ctx.font = '11px monospace';
          ctx.fillText(`HMD YAW: ${vrYawDeg > 0 ? `+${vrYawDeg}` : vrYawDeg}° | FOV: 210° | BIO-SYNC ACTIVE`, w / 2 - 125, 26);
        }
      }
      animId = requestAnimationFrame(renderVrOverlay);
    };

    animId = requestAnimationFrame(renderVrOverlay);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, selectedVrEnv, isVrPlaying, vrYawDeg]);

  // REALISTIC & INTERACTIVE HELIOCENTRIC ORBITAL TRAJECTORY RADAR
  useEffect(() => {
    if (activeTab !== 'navigation_safety') return;
    let animId: number;

    const renderOrbitRadar = () => {
      const canvas = orbitCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Deep-space radar background
          ctx.fillStyle = '#040812';
          ctx.fillRect(0, 0, w, h);

          const cx = w * 0.42;
          const cy = h * 0.58;
          const scale = 95 * radarZoom; // 1.0 AU in pixels

          // Polar heliocentric grid lines & concentric AU circles (0.5 AU, 1.0 AU, 1.5 AU)
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.09)';
          ctx.lineWidth = 1;
          [0.5, 1.0, 1.5, 2.0].forEach(au => {
            ctx.beginPath();
            ctx.arc(cx, cy, au * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.font = '10px monospace';
            ctx.fillText(`${au.toFixed(1)} AU`, cx + 4, cy - au * scale + 11);
          });

          // Radial azimuth spokes every 30°
          for (let deg = 0; deg < 360; deg += 30) {
            const rad = (deg * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(rad) * 2.2 * scale, cy + Math.sin(rad) * 2.2 * scale);
            ctx.stroke();
          }

          // Earth Orbit (1.000 AU)
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(cx, cy, 1.0 * scale, 0, Math.PI * 2);
          ctx.stroke();

          // Mars Orbit (1.524 AU)
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.38)';
          ctx.beginPath();
          ctx.arc(cx, cy, 1.524 * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Sun at Heliocentric Origin (0,0)
          const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 24 * radarZoom);
          sunGrad.addColorStop(0, '#fef08a');
          sunGrad.addColorStop(0.4, '#f59e0b');
          sunGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 24 * radarZoom, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = selectedOrbitNode === 'SUN' ? '#fde047' : '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText('SOL [0.00 AU]', cx - 32, cy + 18);

          // Parametric Hohmann Transfer Orbit from Earth (r1=1.0 AU, angle=15°) to Mars MOI (r2=1.524 AU, angle=-165°)
          const getHohmannPoint = (progress0to1: number) => {
            const theta = (15 * Math.PI) / 180 - progress0to1 * Math.PI;
            // Semi-major axis a = (1.0 + 1.524)/2 = 1.262 AU, eccentricity e = (1.524 - 1.0)/(1.524 + 1.0) = 0.2076
            const a = 1.262;
            const e = 0.2076;
            const nu = progress0to1 * Math.PI; // True anomaly 0 -> pi
            const rAu = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
            return {
              x: cx + Math.cos(theta) * rAu * scale,
              y: cy + Math.sin(theta) * rAu * scale,
              rAu,
              theta,
              nuDeg: Math.round((nu * 180) / Math.PI)
            };
          };

          // Draw Full Planned Hohmann Transfer Trajectory (Sol 0 -> Sol 248)
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          for (let step = 0; step <= 60; step++) {
            const pt = getHohmannPoint(step / 60);
            if (step === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Completed Trajectory Segment up to inspectedSol
          const progress = Math.max(0, Math.min(1, inspectedSol / 248));
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.8;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          for (let step = 0; step <= 60; step++) {
            const frac = (step / 60) * progress;
            const pt = getHohmannPoint(frac);
            if (step === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Earth Departure Node (Sol 0)
          const earthPt = getHohmannPoint(0);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(earthPt.x, earthPt.y, selectedOrbitNode === 'EARTH' ? 8 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = selectedOrbitNode === 'EARTH' ? '#7dd3fc' : '#94a3b8';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('EARTH [1.00 AU]', earthPt.x + 10, earthPt.y + 4);

          // Mars Rendezvous Node (Sol 248)
          const marsPt = getHohmannPoint(1);
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(marsPt.x, marsPt.y, selectedOrbitNode === 'MARS' ? 8 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = selectedOrbitNode === 'MARS' ? '#fda4af' : '#fca5a5';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('MARS MOI [1.52 AU]', marsPt.x - 55, marsPt.y - 12);

          // ARES-V Spacecraft Position at inspectedSol
          const shipPt = getHohmannPoint(progress);
          const nextPt = getHohmannPoint(Math.min(1, progress + 0.04));

          // Velocity tangent vector arrow
          const vx = nextPt.x - shipPt.x;
          const vy = nextPt.y - shipPt.y;
          const vLen = Math.hypot(vx, vy) || 1;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(shipPt.x, shipPt.y);
          ctx.lineTo(shipPt.x + (vx / vLen) * 28, shipPt.y + (vy / vLen) * 28);
          ctx.stroke();

          // Pulsing targeting reticle around ARES-V
          const pulseR = 11 + Math.sin(performance.now() / 220) * 2.5;
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(shipPt.x, shipPt.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(shipPt.x, shipPt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`▲ ARES-V [SOL ${inspectedSol}]`, shipPt.x + 14, shipPt.y - 6);
          ctx.fillStyle = '#a7f3d0';
          ctx.font = '10px monospace';
          ctx.fillText(`r=${shipPt.rAu.toFixed(3)} AU | ν=${shipPt.nuDeg}°`, shipPt.x + 14, shipPt.y + 8);
        }
      }
      animId = requestAnimationFrame(renderOrbitRadar);
    };

    animId = requestAnimationFrame(renderOrbitRadar);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, inspectedSol, selectedOrbitNode, radarZoom]);

  // Handle interactive click on the Heliocentric Orbital Trajectory Radar canvas
  const handleOrbitCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const cx = canvas.width * 0.42;
    const cy = canvas.height * 0.58;
    const scale = 95 * radarZoom;

    if (Math.hypot(clickX - cx, clickY - cy) < 22) {
      setSelectedOrbitNode('SUN');
      soundEngine.playBeep(1600, 0.04);
      return;
    }

    // Find closest point along Hohmann transfer arc (Sol 0 to Sol 248)
    let bestSol = inspectedSol;
    let minDist = Infinity;
    for (let sol = 0; sol <= 248; sol += 2) {
      const p = sol / 248;
      const theta = (15 * Math.PI) / 180 - p * Math.PI;
      const nu = p * Math.PI;
      const rAu = (1.262 * (1 - 0.2076 * 0.2076)) / (1 + 0.2076 * Math.cos(nu));
      const px = cx + Math.cos(theta) * rAu * scale;
      const py = cy + Math.sin(theta) * rAu * scale;
      const d = Math.hypot(clickX - px, clickY - py);
      if (d < minDist) {
        minDist = d;
        bestSol = sol;
      }
    }

    if (minDist < 48) {
      setInspectedSol(bestSol);
      if (bestSol <= 6) setSelectedOrbitNode('EARTH');
      else if (bestSol >= 242) setSelectedOrbitNode('MARS');
      else setSelectedOrbitNode('ARES-V');
      soundEngine.playBeep(2100, 0.04);
    }
  };

  // Compute live orbital values for the currently inspected Sol
  const solFraction = inspectedSol / 248;
  const inspectedRadiusAu = (1.262 * (1 - 0.2076 * 0.2076)) / (1 + 0.2076 * Math.cos(solFraction * Math.PI));
  const inspectedVelocityKmS = (29.78 * Math.sqrt(2 / inspectedRadiusAu - 1 / 1.262)).toFixed(2);
  const inspectedDistTraveledKm = Math.round(navTelemetry.totalTransitDistanceKm * solFraction);
  const inspectedDistRemainingKm = Math.max(0, navTelemetry.totalTransitDistanceKm - inspectedDistTraveledKm);
  const inspectedLightDelayMin = (inspectedRadiusAu * 14.2).toFixed(1);

  return (
    <div id="podInterface" className="w-full max-w-7xl mx-auto space-y-4">
      
      {/* ================= SCI-FI ARES CREW POD HEADER WITH CINEMATIC EARTH FROM SPACE BACKGROUND ================= */}
      <header className="ares-header relative overflow-hidden min-h-[168px] border-cyan-500/50 bg-[#040915] shadow-[0_0_35px_rgba(6,182,212,0.22)] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <CinematicEarthHeaderBg variant="pod" />

        {/* Left Profile & Full-Form Status Column */}
        <div className="relative z-10 w-full xl:max-w-[68%] flex flex-col gap-3">
          {/* Profile Block */}
          <div className="profile-block">
            <div className="avatar border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
              <img 
                src={astronaut.avatarUrl} 
                alt={astronaut.name}
                referrerPolicy="no-referrer"
                className="object-top"
              />
            </div>

            <div>
              <span className="ares-sys-tag drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                AUTONOMOUS RECOVERY &amp; EQUILIBRIUM SYSTEM (ARES) OPERATING SYSTEM v2.6 // CREW NEURO-TELEMETRY SUITE
              </span>
              <h2 className="ares-subject-id drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                CREW MEMBER: {astronaut.name.toUpperCase()} ({astronaut.callsign})
              </h2>
              <div className="profile-sub text-slate-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {astronaut.specialty} &middot; {astronaut.assignedPod}
              </div>
            </div>
          </div>

          {/* Full-Form Status Pills (Acute Distress Index, Last Time of Sleep, Mission Elapsed Time, Call Crew Medical Officer Alarm, and Contingency Anti-Psychotic Guardian Authorization) */}
          <div className="ares-status-pills">
            <div className="ares-badge bg-[#091122]/90 backdrop-blur-xs">
              <span className={`ares-badge-dot ${adiLevel === 'warning' ? 'warning' : adiLevel === 'critical' ? 'critical' : ''}`} />
              <span>
                ACUTE DISTRESS INDEX:{' '}
                <strong className={adiLevel === 'critical' ? 'text-rose-400' : adiLevel === 'warning' ? 'text-amber-300' : 'text-emerald-400'}>
                  {adiScore.toFixed(2)} {adiLabel}
                </strong>
              </span>
            </div>

            <div className="ares-badge border-cyan-500/40 bg-[#091122]/90 backdrop-blur-xs">
              <span>LAST TIME OF SLEEP: <strong className="text-cyan-300">{astronaut.lastTimeOfSleep.toUpperCase()}</strong></span>
            </div>

            <div className="ares-badge bg-[#091122]/90 backdrop-blur-xs">
              <span>MISSION ELAPSED TIME: <strong>{missionTime.toUpperCase()}</strong></span>
            </div>

            {/* Quick Emergency Call Crew Medical Officer Alarm Button in Pod Header */}
            <button
              id="headerCallCmoBtn"
              type="button"
              onClick={() => setIsCmoCallPromptOpen(true)}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCmoAlarm?.active
                  ? 'bg-red-600 text-white border border-white animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.8)]'
                  : 'bg-rose-950/90 hover:bg-rose-900 border border-rose-500/70 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              }`}
              title="Trigger Emergency Call & Audible Klaxon Alarm to Crew Medical Officer"
            >
              <BellRing className="w-3.5 h-3.5 text-rose-300" />
              <span>{activeCmoAlarm?.active ? 'CREW MEDICAL OFFICER ALARM ACTIVE' : 'CALL CREW MEDICAL OFFICER ALARM'}</span>
            </button>

            {/* Contingency Guardian Authorization Button: Restricted strictly to Designated Contingency Guardian Astronaut Elena Vance (ASTRONAUT-03) */}
            {canExecuteDoomsdayOverride(astronaut) ? (
              <button
                id="doomsdayOverrideBtn"
                type="button"
                onClick={() => setIsDoomsdayEapOpen(true)}
                className="px-3 py-1.5 rounded-full bg-amber-950/90 hover:bg-amber-900 border border-amber-500/70 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
                title="Designated Astronaut Contingency Protocol (Elena Vance ASTRONAUT-03 Only): Authorize Anti-Psychotic Care if Crew Medical Officer & Flight Commander are incapacitated"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>CONTINGENCY ANTI-PSYCHOTIC GUARDIAN AUTHORIZATION (ASTRONAUT-03)</span>
              </button>
            ) : (
              <div
                id="doomsdayRestrictedBadge"
                className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 font-mono text-[10px] font-bold flex items-center gap-1.5 select-none"
                title="Contingency Anti-Psychotic Guardian Authorization is restricted exclusively to Designated Guardian Astronaut Elena Vance (ASTRONAUT-03)"
              >
                <Lock className="w-3 h-3 text-slate-500" />
                <span>CONTINGENCY GUARDIAN AUTHORIZATION: ASTRONAUT-03 (ELENA VANCE) ONLY</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Transparent 3-Color Acute Distress Index Triage Scale Over Earth Graphics */}
        <div
          id="headerTriageColorLegend"
          style={{ textShadow: '0 1px 3px #000000, 0 0 9px #000000, 0 2px 14px rgba(0,0,0,0.98)' }}
          className="relative z-10 w-full xl:w-[340px] shrink-0 rounded-xl bg-transparent border border-cyan-400/35 px-3.5 py-2.5 font-mono text-[10px] space-y-1.5"
        >
          <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-200 border-b border-cyan-400/30 pb-1 flex items-center justify-between">
            <span>ACUTE DISTRESS INDEX TRIAGE SCALE</span>
            <span className="text-cyan-100/90">3-COLOR GUIDE</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] mt-1 shrink-0" />
            <div className="leading-snug text-white font-medium">
              <strong className="text-emerald-300">GREEN (0.00–0.44):</strong> Optimal Readiness — Cleared for All Mission Tasks
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] mt-1 shrink-0" />
            <div className="leading-snug text-white font-medium">
              <strong className="text-amber-300">YELLOW (0.45–0.69):</strong> Moderate Strain — Guided Self-Care &amp; High-Risk Task Hold
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] mt-1 shrink-0" />
            <div className="leading-snug text-white font-medium">
              <strong className="text-rose-300">RED (0.70–1.00):</strong> Critical Distress — Immediate Crew Medical Officer Care
            </div>
          </div>
        </div>

      </header>

      {/* ================= ACTIVE VOICEOVER BANNER ================= */}
      {activeVoiceover && (
        <div className="bg-[#0b1324] border border-cyan-500/50 rounded-xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={toggleVoiceoverPlayback}
              className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shrink-0 transition-transform hover:scale-105 shadow-[0_0_12px_rgba(6,182,212,0.5)] cursor-pointer"
              title={isVoiceoverPlaying ? 'Pause Voiceover' : 'Play Voiceover'}
            >
              {isVoiceoverPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 font-bold tracking-wide">
                  AI GUIDANCE AUDIO // {activeVoiceover.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {Math.round(voiceoverTime)}s / {voiceoverDuration}s
                </span>
              </div>
              <p className="text-xs text-slate-300 italic truncate max-w-xl">
                "{activeVoiceover.transcript}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= POD NAVIGATION BAR ================= */}
      <div className="ares-main-grid">
        <nav className="ares-nav-bar" id="podNav">
          <button 
            onClick={() => setActiveTab('telemetry')} 
            className={`ares-tab-btn ${activeTab === 'telemetry' ? 'is-active' : ''}`}
          >
            BIOMETRICS &amp; WAVEFORMS
          </button>
          <button 
            id="missionChecklistTabBtn"
            onClick={() => setActiveTab('mission_checklist')} 
            className={`ares-tab-btn ${activeTab === 'mission_checklist' ? 'is-active' : ''}`}
          >
            MISSION CHECKLIST &amp; HEALTH ASSESSMENT
          </button>
          <button 
            onClick={() => setActiveTab('therapeutics')} 
            className={`ares-tab-btn ${activeTab === 'therapeutics' ? 'is-active' : ''}`}
          >
            THERAPEUTIC MATRIX
          </button>
          <button 
            onClick={() => setActiveTab('pfa')} 
            className={`ares-tab-btn ${activeTab === 'pfa' ? 'is-active' : ''}`}
          >
            PSYCHOLOGICAL FIRST AID
          </button>
          <button 
            onClick={() => setActiveTab('vr_environments')} 
            className={`ares-tab-btn ${activeTab === 'vr_environments' ? 'is-active' : ''}`}
          >
            VIRTUAL REALITY EARTH ENVIRONMENTS
          </button>
          <button 
            onClick={() => setActiveTab('family_media')} 
            className={`ares-tab-btn ${activeTab === 'family_media' ? 'is-active' : ''}`}
          >
            FAMILY &amp; EARTH UPLINK
          </button>
          <button 
            onClick={() => setActiveTab('navigation_safety')} 
            className={`ares-tab-btn ${activeTab === 'navigation_safety' ? 'is-active' : ''}`}
          >
            SPACECRAFT NAVIGATION &amp; SAFETY
          </button>
        </nav>

        {/* ================= TAB 1: BIOMETRICS & WAVEFORMS (TOP SELF-HEALTH INDICATOR CHECK-IN + 7-SOL TREND CHART + BIOMETRICS & WAVEFORMS ONLY) ================= */}
        {activeTab === 'telemetry' && (
          <div id="pod-telemetry" className="space-y-4">
            
            {/* TOP BIOMETRIC METRIC CARDS (Includes Live Vitals + Self-Health Indicator Data) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <div className="metric-card">
                <span className="metric-label">Heart Rate</span>
                <div>
                  <span className="metric-val text-cyan-300">{hr}</span>{' '}
                  <span className="metric-unit">Beats Per Minute</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-1">
                  +4 Beats Per Minute (Nominal)
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Heart Rate Variability</span>
                <div>
                  <span className="metric-val text-slate-100">{hrv}</span>{' '}
                  <span className="metric-unit">Milliseconds</span>
                </div>
                <span className={`text-[10px] font-mono mt-1 ${hrv < 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {hrv < 40 ? '-8 Milliseconds (Depressed)' : '+2 Milliseconds (Stable)'}
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Blood Pressure</span>
                <div>
                  <span className="metric-val text-cyan-300">{bpSystolic}/{bpDiastolic}</span>{' '}
                  <span className="metric-unit">mmHg</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-1">
                  Arterial Brachial Cuff
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Blood Sugar Level</span>
                <div>
                  <span className="metric-val text-emerald-400">{bloodSugar}</span>{' '}
                  <span className="metric-unit">mg/dL</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 mt-1">
                  Capillary Glucose Nominal
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Core Body Temperature</span>
                <div>
                  <span className="metric-val text-slate-100">{bodyTemp.toFixed(1)}</span>{' '}
                  <span className="metric-unit">°C</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-1">
                  {sleepHours.toFixed(1)}h Sleep / 24h ({sleepQ}%)
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Voice Acoustic Jitter</span>
                <div>
                  <span className="metric-val text-amber-300">{voiceJitter}%</span>{' '}
                  <span className="metric-unit">Vocal Jitter</span>
                </div>
                <span className={`text-[10px] font-mono mt-1 ${voiceJitter > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {voiceJitter > 3 ? 'Elevated Stress' : 'Baseline Vocal Tone'}
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Blood Oxygen (SpO2)</span>
                <div>
                  <span className="metric-val text-cyan-300">{spo2}</span>{' '}
                  <span className="metric-unit">Percent (%)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-1">
                  Optimal Life Support O2
                </span>
              </div>

              <div className="metric-card">
                <span className="metric-label">Self-Reported Mood</span>
                <div>
                  <span className="text-sm font-bold font-mono text-amber-300 block mt-1 truncate">
                    {moodInput}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 mt-1 truncate block" title={ultrasoundCheck}>
                  Ultrasound: Verified
                </span>
              </div>
            </div>

            {/* TOP OF BIOMETRICS & WAVEFORMS: ASTRONAUT SELF-HEALTH INDICATOR CHECK-IN + DYNAMIC 7-SOL HEALTH INDICATOR TREND CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 6 Columns: Astronaut Self-Health Indicator Check-In */}
              <form
                onSubmit={handleSaveSelfAssessment}
                className="lg:col-span-6 graph-card border-cyan-500/40 space-y-3"
              >
                <div className="graph-title text-cyan-300">
                  <span>ASTRONAUT SELF-HEALTH INDICATOR CHECK-IN</span>
                  <span className="text-[10px] font-mono text-emerald-400">LIVE TELEMETRY INPUT</span>
                </div>
                <p className="text-xs text-slate-300">
                  Enter your daily health measurements below (Blood Pressure in mmHg, Blood Sugar in mg/dL, Body Temperature in °C, Heart Rate, Sleep Hours, Mood, and Point-of-Care Ultrasound).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Blood Pressure (Systolic / Diastolic mmHg):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={80}
                        max={190}
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(Number(e.target.value))}
                        aria-label="Systolic Blood Pressure mmHg"
                        className="field w-full"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        min={50}
                        max={130}
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(Number(e.target.value))}
                        aria-label="Diastolic Blood Pressure mmHg"
                        className="field w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Blood Sugar Level (mg/dL):
                    </label>
                    <input
                      type="number"
                      min={55}
                      max={220}
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(Number(e.target.value))}
                      aria-label="Blood Sugar mg/dL"
                      className="field w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Core Body Temperature (°C):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={35.0}
                      max={40.5}
                      value={bodyTemp}
                      onChange={(e) => setBodyTemp(Number(e.target.value))}
                      aria-label="Core Body Temperature Celsius"
                      className="field w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Resting Heart Rate (Beats Per Minute):
                    </label>
                    <input
                      type="number"
                      min={45}
                      max={150}
                      value={heartRateInput}
                      onChange={(e) => setHeartRateInput(Number(e.target.value))}
                      aria-label="Resting Heart Rate Beats Per Minute"
                      className="field w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Daily Sleep Duration (Hours / 24h):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={12}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      aria-label="Daily Sleep Duration Hours"
                      className="field w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      Self-Reported Mood &amp; Behavioral State:
                    </label>
                    <select
                      value={moodInput}
                      onChange={(e) => setMoodInput(e.target.value as any)}
                      aria-label="Self-Reported Mood State"
                      className="ares-select w-full"
                    >
                      <option value="Focused & Calm">Focused &amp; Calm (Optimal)</option>
                      <option value="Motivated">Motivated &amp; Engaged</option>
                      <option value="Mildly Fatigued">Mildly Fatigued</option>
                      <option value="Isolated / Stressed">Isolated / Confinement Strain</option>
                      <option value="Anxious">Anxious / Restless</option>
                    </select>
                  </div>
                </div>

                <div className="font-mono text-xs">
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Point-of-Care Diagnostic Ultrasound &amp; Dosimetry Finding:
                  </label>
                  <select
                    value={ultrasoundCheck}
                    onChange={(e) => setUltrasoundCheck(e.target.value)}
                    aria-label="Ultrasound Finding"
                    className="ares-select w-full"
                  >
                    <option value="Normal Optic Nerve Sheath & Cardiac Ejection Fraction">
                      Normal Optic Nerve Sheath (&lt; 5.0 mm) &amp; Nominal Left Ventricular Ejection Fraction
                    </option>
                    <option value="Mild Cephalad Fluid Shift — Recommend Lower Body Negative Pressure">
                      Mild Cephalad Fluid Shift — Recommend Lower Body Negative Pressure Countermeasure
                    </option>
                    <option value="Mild Calcaneal Bone Density Drift — Increase Resistive Exercise Load">
                      Mild Calcaneal Bone Density Drift — Increase Resistive Exercise Load
                    </option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="ares-tab-btn is-active flex items-center gap-1.5 cursor-pointer"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>Save Health Indicators &amp; Evaluate Status</span>
                  </button>
                </div>

                {assessmentSavedMsg && (
                  <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500 text-emerald-200 font-mono text-xs">
                    {assessmentSavedMsg}
                  </div>
                )}
              </form>

              {/* Right 6 Columns: Dynamic 7-Sol Health Indicator Trend Chart */}
              <div className="lg:col-span-6 graph-card border-cyan-500/40 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="graph-title text-cyan-300">
                      <span>DYNAMIC 7-SOL HEALTH INDICATOR TREND CHART</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {[
                        { id: 'adi', label: 'Acute Distress Index' },
                        { id: 'bloodSugar', label: 'Blood Sugar' },
                        { id: 'systolicBp', label: 'Blood Pressure' },
                        { id: 'sleep', label: 'Sleep Hours' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setTrendMetric(m.id as any)}
                          className={`px-2 py-1 rounded border cursor-pointer ${
                            trendMetric === m.id
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-white font-bold">{trendData.label}</span>
                    <span className="text-slate-400 text-[11px]">{trendData.thresholdLabel}</span>
                  </div>
                </div>

                {/* Crisp SVG Dynamic Line & Area Chart */}
                <div className="bg-[#050a15] border border-slate-800 rounded-xl p-3">
                  <svg viewBox="0 0 520 190" className="w-full h-44 overflow-visible">
                    {[0.2, 0.5, 0.8].map((frac, idx) => (
                      <line
                        key={idx}
                        x1="36"
                        y1={20 + frac * 130}
                        x2="495"
                        y2={20 + frac * 130}
                        stroke="rgba(148,163,184,0.16)"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {(() => {
                      const pts = trendData.values.map((v, i) => {
                        const x = 48 + i * ((485 - 48) / (trendData.values.length - 1));
                        const norm =
                          (v - trendData.minScale) /
                          Math.max(0.001, trendData.maxScale - trendData.minScale);
                        const y = 150 - Math.max(0, Math.min(1, norm)) * 120;
                        return { x, y, v, sol: trendSols[i] };
                      });
                      const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
                      const areaPoints = `${pts[0].x},155 ${polylinePoints} ${pts[pts.length - 1].x},155`;

                      return (
                        <>
                          <polygon points={areaPoints} fill={trendData.color} fillOpacity="0.14" />
                          <polyline
                            fill="none"
                            stroke={trendData.color}
                            strokeWidth="2.5"
                            points={polylinePoints}
                          />
                          {pts.map((p, idx) => (
                            <g key={idx}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4.5"
                                fill="#050a15"
                                stroke={trendData.color}
                                strokeWidth="2.5"
                              />
                              <text
                                x={p.x}
                                y={p.y - 10}
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="10"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {trendMetric === 'adi' ? p.v.toFixed(2) : p.v}
                              </text>
                              <text
                                x={p.x}
                                y="174"
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="9.5"
                                fontFamily="monospace"
                              >
                                {p.sol.replace(' (Today)', '*')}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                  <span>
                    Color-Coded Status Interpretation: <strong className="text-emerald-400">Green = Nominal</strong> ·{' '}
                    <strong className="text-amber-300">Yellow = Self-Care &amp; Task Hold</strong> ·{' '}
                    <strong className="text-rose-400">Red = Crew Medical Consult</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Live Waveform Graphs: Realistic Lead II Electrocardiogram + Electroencephalogram Power Spectrum */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* ECG LEAD II Canvas */}
              <div className="graph-card">
                <div className="graph-title">
                  <span>REAL-TIME ELECTROCARDIOGRAM &amp; HEART RATE VARIABILITY RHYTHM</span>
                  <span className="text-cyan-400/90 font-mono text-[11px]">LEAD II // 25 Millimeters/Second</span>
                </div>
                <div className="h-44 mt-2 rounded-lg overflow-hidden border border-cyan-900/50 bg-[#070b14]">
                  <canvas ref={ecgCanvasRef} className="w-full h-full block" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                  <span>SINUS RHYTHM // RESPIRATORY SINUS ARRHYTHMIA TRACKING ACTIVE</span>
                  <span className="text-emerald-400 font-bold">Corrected QT Interval: 412 Milliseconds (NOMINAL)</span>
                </div>
              </div>

              {/* EEG POWER SPECTRUM Canvas */}
              <div className="graph-card">
                <div className="graph-title">
                  <span>ELECTROENCEPHALOGRAM POWER SPECTRUM</span>
                  <span className="text-cyan-400/90 font-mono text-[11px]">DELTA / THETA / ALPHA / BETA</span>
                </div>
                <div className="h-44 mt-2 rounded-lg overflow-hidden border border-cyan-900/50 bg-[#070b14]">
                  <canvas ref={eegCanvasRef} className="w-full h-full block" />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                  <span>NEURAL COHERENCE: 94.8%</span>
                  <span className="text-cyan-300 font-bold">DOMINANT: THETA-ALPHA REST</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: DEDICATED MISSION CHECKLIST & NASA HEALTH ASSESSMENT ================= */}
        {activeTab === 'mission_checklist' && (
          <MissionChecklistAndHealthSection
            astronaut={astronaut}
            onUpdateAstronaut={onUpdateAstronaut}
            tasks={missionTasks}
            onToggleTaskComplete={onToggleTaskComplete}
            cmoTaskHoldNotifications={cmoTaskHoldNotifications}
            onNotifyCmoTaskHold={onNotifyCmoTaskHold}
          />
        )}

        {/* ================= TAB 2: THERAPEUTIC MATRIX (EXACT OLD 3-COLUMN STYLE FROM image_917e2069.png) ================= */}
        {activeTab === 'therapeutics' && (
          <div id="pod-therapeutics">
            <div className="controls-grid">
              
              {/* Card 1: PHOTOTHERAPY (CIRCADIAN) */}
              <div className="ctrl-group">
                <div className="ctrl-title">
                  <span>PHOTOTHERAPY (CIRCADIAN)</span>
                  <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                    {photoPreset === 'wake' ? '6500K Cyan' : '1800K Amber'}
                  </span>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Spectrum Preset</span>
                  <div className="ares-seg-group">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreset('wake');
                        setPhotoBrightness(80);
                        soundEngine.playBeep(2100, 0.04);
                      }}
                      className={`ares-seg-btn ${photoPreset === 'wake' ? 'is-active' : ''}`}
                    >
                      Wake (6500K)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreset('sleep');
                        setPhotoBrightness(15);
                        soundEngine.playBeep(1650, 0.04);
                      }}
                      className={`ares-seg-btn ${photoPreset === 'sleep' ? 'is-active' : ''}`}
                    >
                      Sleep (1800K)
                    </button>
                  </div>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Intensity Brightness</span>
                  <div className="lumi-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoBrightness}
                      onChange={(e) => setPhotoBrightness(parseInt(e.target.value, 10))}
                      className="lumi-slider"
                    />
                    <div className="lumi-slider-value">{photoBrightness}%</div>
                  </div>
                </div>
              </div>

              {/* Card 2: NEURO-ACOUSTIC ENGINE */}
              <div className="ctrl-group">
                <div className="ctrl-title">
                  <span>NEURO-ACOUSTIC ENGINE</span>
                  <span style={{ color: binauralFreq === 0 && soundscapeMode === 'off' ? 'var(--text-muted)' : 'var(--positive)', fontFamily: 'monospace' }}>
                    {binauralFreq === 0 ? 'No Sound (Muted)' : 'Active'}
                  </span>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Binaural Frequency</span>
                  <select
                    aria-label="Binaural Frequency"
                    value={binauralFreq}
                    onChange={(e) => {
                      const hz = parseFloat(e.target.value);
                      setBinauralFreq(hz);
                      soundEngine.setBinauralBeat(hz, hz > 0);
                    }}
                    className="ares-select"
                  >
                    <option value={0}>No Sound (0 Hz - Off)</option>
                    <option value={4}>4 Hz (Delta - Deep Recovery)</option>
                    <option value={6}>6 Hz (Theta - Anxiety Relief)</option>
                    <option value={10}>10 Hz (Alpha - Calm Focus)</option>
                    <option value={18}>18 Hz (Beta - Alertness)</option>
                  </select>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Earth Soundscape</span>
                  <select
                    value={soundscapeMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setSoundscapeMode(mode);
                      soundEngine.setSoundscape(mode);
                    }}
                    className="ares-select"
                  >
                    <option value="off">Muted / Silence</option>
                    <option value="rainforest">Pacific Northwest Rain</option>
                    <option value="ocean">Pacific Ocean Surf</option>
                    <option value="wind">Alpine Pine Wind</option>
                  </select>
                </div>
              </div>

              {/* Card 3: VIBROACOUSTIC & PRESSURE */}
              <div className="ctrl-group">
                <div className="ctrl-title">
                  <span>VIBROACOUSTIC &amp; PRESSURE</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>Somatosensory</span>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Bed Vibro Frequency</span>
                  <div className="lumi-slider-container">
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={vibroFreq}
                      onChange={(e) => setVibroFreq(parseInt(e.target.value, 10))}
                      className="lumi-slider"
                    />
                    <div className="lumi-slider-value">{vibroFreq} Hz</div>
                  </div>
                </div>

                <div className="ctrl-row">
                  <span className="ctrl-label">Deep-Pressure Seat</span>
                  <div className="lumi-slider-container">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={seatPressure}
                      onChange={(e) => setSeatPressure(parseInt(e.target.value, 10))}
                      className="lumi-slider"
                    />
                    <div className="lumi-slider-value">{seatPressure} kPa</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= TAB 3: AI PFA PROTOCOL (SUGGESTION CARDS DELETED AS REQUESTED) ================= */}
        {activeTab === 'pfa' && (
          <div id="pod-pfa" className="space-y-4">
            <div className="chat-card">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#080f1e] border-b border-slate-800 text-xs font-mono">
                <span className="text-cyan-300 font-bold uppercase tracking-wider">
                  ARES AI — PSYCHOLOGICAL FIRST AID (PFA) DIALOGUE STREAM
                </span>
                <span className="text-emerald-400">● AUTONOMOUS THERAPEUTIC LINK ONLINE</span>
              </div>

              <div 
                ref={chatStreamRef}
                className="chat-messages"
                id="pfaStream"
              >
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`chat-msg ${msg.sender === 'ASTRONAUT' ? 'crew' : 'ares'}`}
                  >
                    <strong>[{msg.senderName} · {msg.timestamp}]</strong>
                    <br />
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="media-input-bar">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPfa()}
                  placeholder="Type message or express feelings (e.g., 'I feel claustrophobic', 'Need help sleeping')..."
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ares-tab-btn flex items-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Audio/Media</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="audio/*,video/*,image/*"
                  onChange={handleAttachMediaToChat}
                />
                <button
                  type="button"
                  onClick={handleSendPfa}
                  className="ares-tab-btn is-active flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: VR EARTH ENVIRONMENTS (RAIN, FOREST, OCEAN, FOOTBALL MATCH, FAMILY FUNCTION) ================= */}
        {activeTab === 'vr_environments' && (
          <div id="pod-vr-environments" className="space-y-4">
            
            {/* Environment Selector Pills (5 Environments) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {VR_EARTH_ENVIRONMENTS.map((env) => {
                const isSelected = env.id === selectedVrEnvId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => handleSelectVrEnvironment(env)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/75 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-[#080d1a] border-slate-800 hover:border-slate-700 hover:bg-[#0c1426]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-cyan-300 font-bold uppercase">{env.category}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                        {env.binauralHz}Hz
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{env.title}</div>
                    <div className="text-[10px] text-cyan-300 font-mono mt-1 flex items-center gap-1 truncate">
                      <Video className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{isSelected && isVrPlaying ? '● VR VIDEO STREAMING' : '360° VR VIDEO READY'}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main 360° VR Stereoscopic Video Viewport & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left: Interactive 360° VR Headset Video Viewport (8 cols) */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#050914] border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                        ARES-V HOLODECK // 360° VR EARTH VIDEO SIMULATOR: {selectedVrEnv.category.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-white mt-0.5">
                      {selectedVrEnv.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVrStereoMode(!vrStereoMode)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                        vrStereoMode
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {vrStereoMode ? 'DUAL-LENS HMD' : 'FULL-VISOR 360°'}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleVrSimulation}
                      className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isVrPlaying
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      }`}
                    >
                      {isVrPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isVrPlaying ? 'PAUSE VR VIDEO & AUDIO' : 'PLAY VR VIDEO & AUDIO'}</span>
                    </button>
                  </div>
                </div>

                {/* 360° Interactive Pan Video Viewport */}
                <div
                  onMouseDown={(e) => {
                    setIsDraggingVr(true);
                    vrDragStartX.current = e.clientX;
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingVr) return;
                    const dx = e.clientX - vrDragStartX.current;
                    vrDragStartX.current = e.clientX;
                    setVrYawDeg(prev => Math.max(-180, Math.min(180, Math.round(prev - dx * 0.4))));
                  }}
                  onMouseUp={() => setIsDraggingVr(false)}
                  onMouseLeave={() => setIsDraggingVr(false)}
                  className="relative h-80 sm:h-96 rounded-xl overflow-hidden bg-black border border-cyan-500/40 cursor-grab active:cursor-grabbing select-none"
                >
                  {!vrStereoMode ? (
                    <video
                      ref={vrMainVideoRef}
                      key={`vr-main-${selectedVrEnv.id}`}
                      src={selectedVrEnv.videoUrl}
                      poster={selectedVrEnv.panoramaImageUrl}
                      autoPlay={isVrPlaying}
                      loop
                      muted
                      playsInline
                      style={{
                        transform: `scale(1.22) translateX(${-vrYawDeg * 0.16}%)`,
                        transition: isDraggingVr ? 'none' : 'transform 0.25s ease-out'
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Stereoscopic Dual-Eye VR HMD Split Video View */
                    <div className="grid grid-cols-2 gap-1 w-full h-full bg-black p-1">
                      <div className="relative rounded-full overflow-hidden border-2 border-cyan-500/50">
                        <video
                          key={`vr-left-${selectedVrEnv.id}`}
                          src={selectedVrEnv.videoUrl}
                          poster={selectedVrEnv.panoramaImageUrl}
                          autoPlay={isVrPlaying}
                          loop
                          muted
                          playsInline
                          style={{ transform: `scale(1.25) translateX(${-vrYawDeg * 0.16}%)` }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative rounded-full overflow-hidden border-2 border-cyan-500/50">
                        <video
                          key={`vr-right-${selectedVrEnv.id}`}
                          src={selectedVrEnv.videoUrl}
                          poster={selectedVrEnv.panoramaImageUrl}
                          autoPlay={isVrPlaying}
                          loop
                          muted
                          playsInline
                          style={{ transform: `scale(1.25) translateX(${-vrYawDeg * 0.16}%)` }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Environmental Particle & Visor HUD Canvas Overlay */}
                  <canvas
                    ref={vrCanvasRef}
                    width={720}
                    height={384}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Bottom Visor Telemetry Bar */}
                  <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-black/80 border border-cyan-500/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="text-cyan-300 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
                      <span>{selectedVrEnv.spatialCoordinates}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Drag viewport or scrub 360° Yaw:</span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={vrYawDeg}
                        onChange={(e) => setVrYawDeg(parseInt(e.target.value, 10))}
                        className="w-24 accent-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setVrYawDeg(0)}
                        className="text-cyan-400 hover:text-white underline cursor-pointer"
                      >
                        Center
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: VR Environment Video Feed & Biometric Sync Details (4 cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800 space-y-3">
                  <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                    <span>VR SCENE VIDEO &amp; TELEMETRY</span>
                    <span className="text-[10px] text-emerald-400">● 1080p HD</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedVrEnv.description}
                  </p>

                  {/* Dedicated VR Scene Video Player (Guaranteed for every VR scene) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block">
                      Active Scene Video ({selectedVrEnv.category}):
                    </span>
                    <video
                      ref={vrCompanionVideoRef}
                      key={`vr-companion-${selectedVrEnv.id}`}
                      controls
                      loop
                      playsInline
                      muted={!isVrPlaying}
                      autoPlay={isVrPlaying}
                      poster={selectedVrEnv.panoramaImageUrl}
                      src={selectedVrEnv.companionVideoUrl || selectedVrEnv.videoUrl}
                      className="w-full h-36 rounded-lg object-cover border border-cyan-500/40 bg-black"
                    />
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">OPTICAL PROJECTION:</span>
                      <strong className="text-white">{selectedVrEnv.fieldOfView}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">NEURO-ACOUSTIC COUPLING:</span>
                      <strong className="text-emerald-400">
                        {selectedVrEnv.soundscapeMode.toUpperCase()} + {selectedVrEnv.binauralHz} Hz Binaural
                      </strong>
                    </div>
                    <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/50">
                      <span className="text-cyan-400 text-[10px] font-bold block">CLINICAL BIOMETRIC EFFECT:</span>
                      <span className="text-slate-200 text-[11px]">{selectedVrEnv.biometricBenefit}</span>
                    </div>
                  </div>

                  {selectedVrEnv.audioTrackUrl && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        Environment Spatial Audio Track:
                      </span>
                      <audio
                        key={selectedVrEnv.audioTrackUrl}
                        controls
                        src={selectedVrEnv.audioTrackUrl}
                        className="w-full h-8"
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 5: FAMILY & EARTH UPLINK MEDIA ================= */}
        {activeTab === 'family_media' && (
          <div id="pod-family-media" className="space-y-4">
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#071329] via-[#091b3b] to-[#061124] border border-blue-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest">
                    EARTH DEEP SPACE NETWORK UPLINK
                  </span>
                </div>
                <h3 className="text-base font-display font-extrabold text-white mt-1">
                  Family Video Letters &amp; Earth Space Enthusiasts Uplinks
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Asynchronous transmissions sent from families and space enthusiasts on Earth over DSN Goldstone/Madrid/Canberra antennas.
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-400 shrink-0">
                <span className="text-cyan-300 font-bold">DSN Signal Latency:</span> 18m 42s
                <div className="text-[10px] text-emerald-400">● 5 Transmission Packages Buffered</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left: Active Message Media Player (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-[#060a14] border border-blue-900/60 shadow-lg space-y-3">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                        {selectedUplink.category.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white font-sans mt-0.5">
                        {selectedUplink.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-cyan-300">
                      {selectedUplink.dsnSignalDelay}
                    </span>
                  </div>

                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                    <video
                      key={selectedUplink.id}
                      controls
                      loop
                      playsInline
                      autoPlay={isMediaPlaying}
                      poster={selectedUplink.thumbnailUrl}
                      src={selectedUplink.url}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono p-2.5 rounded bg-slate-950/80 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px]">SENDER:</span>
                      <div className="text-white font-bold truncate">{selectedUplink.senderName}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">RELATION:</span>
                      <div className="text-cyan-300 font-bold truncate">{selectedUplink.senderRelation}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">EARTH ORIGIN:</span>
                      <div className="text-emerald-400 font-bold truncate">{selectedUplink.earthOriginLocation}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      Transmission Transcript:
                    </div>
                    <p className="leading-relaxed font-sans">{selectedUplink.transcript}</p>
                  </div>

                </div>
              </div>

              {/* Right: Transmission Inbox List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Earth Uplink Video Feed (5 Videos)</span>
                  <span className="text-[10px] text-emerald-400 font-normal">● All 5 Video Streams Buffered</span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {uplinkMessages.map((item) => {
                    const isSelected = item.id === selectedUplinkId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedUplinkId(item.id);
                          setIsMediaPlaying(true);
                          soundEngine.playBeep(1850, 0.04);
                        }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                            : 'bg-[#080d1a] border-slate-800 hover:border-slate-700 hover:bg-[#0c1426]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                          <span className={`px-1.5 py-0.2 rounded ${
                            item.category === 'FAMILY_MESSAGE' 
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.category === 'FAMILY_MESSAGE' ? 'FAMILY VIDEO' : 'ENTHUSIAST VIDEO'}
                          </span>
                          <span className="text-cyan-300 flex items-center gap-1">
                            <Video className="w-3 h-3 text-cyan-400" />
                            <span>1080p MP4 · {item.uplinkTimestamp}</span>
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                        <div className="text-[11px] text-cyan-300 font-mono">From: {item.senderName} ({item.senderRelation})</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{item.earthOriginLocation}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 6: SPACECRAFT NAVIGATION & SAFETY (SIMPLISTIC, REALISTIC, INTERACTIVE ORBIT RADAR) ================= */}
        {activeTab === 'navigation_safety' && (
          <div id="pod-navigation-safety" className="space-y-4">
            
            {/* Simplistic, Realistic 4-Metric Telemetry Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Distance from Earth (Sol {inspectedSol})
                </span>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                  {inspectedDistTraveledKm.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                  {((inspectedSol / 248) * 100).toFixed(1)}% of Hohmann Transfer
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Distance Remaining to Mars
                </span>
                <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                  {inspectedDistRemainingKm.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                  {Math.max(0, 248 - inspectedSol)} Sols to Orbital Insertion
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Heliocentric Velocity
                </span>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  {inspectedVelocityKmS} <span className="text-xs font-normal text-slate-400">km/s</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">
                  Radius: {inspectedRadiusAu.toFixed(3)} AU
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070c18] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  One-Way DSN Light Delay
                </span>
                <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                  {inspectedLightDelayMin} <span className="text-xs font-normal text-slate-400">min</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                  Hull &amp; ECLSS: 100% Nominal
                </span>
              </div>
            </div>

            {/* Interactive Heliocentric Orbital Trajectory Radar + Clean Safety Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Interactive Orbital Radar (8 cols) */}
              <div className="lg:col-span-8 p-4 rounded-xl bg-[#050914] border border-cyan-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <NavigationIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      INTERACTIVE HELIOCENTRIC ORBITAL TRAJECTORY RADAR
                    </span>
                  </div>

                  {/* Interactive Zoom & Reset Controls */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setRadarZoom(1.0)}
                      className={`px-2 py-0.5 rounded border cursor-pointer ${radarZoom === 1.0 ? 'bg-cyan-950 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                    >
                      1.0x
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadarZoom(1.25)}
                      className={`px-2 py-0.5 rounded border cursor-pointer ${radarZoom === 1.25 ? 'bg-cyan-950 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                    >
                      1.25x
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedSol(184);
                        setSelectedOrbitNode('ARES-V');
                        setRadarZoom(1.0);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Live (Sol 184)</span>
                    </button>
                  </div>
                </div>

                {/* Clickable Radar Canvas */}
                <div className="relative h-72 rounded-lg overflow-hidden border border-slate-800 bg-[#040812]">
                  <canvas
                    ref={orbitCanvasRef}
                    width={640}
                    height={288}
                    onClick={handleOrbitCanvasClick}
                    className="w-full h-full block cursor-crosshair"
                    title="Click anywhere along the trajectory arc or scrub the timeline below to inspect orbital telemetry"
                  />
                </div>

                {/* Interactive Trajectory Timeline Scrubber (Sol 0 -> Sol 184 -> Sol 248) */}
                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-300 font-bold">
                      TRAJECTORY SCRUBBER: SOL {inspectedSol} / 248 {inspectedSol === 184 ? '(CURRENT LIVE POSITION)' : '(SIMULATION PREVIEW)'}
                    </span>
                    <span className="text-slate-400">Click radar or drag slider</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="248"
                    value={inspectedSol}
                    onChange={(e) => setInspectedSol(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sol 0: Earth Departure (1.00 AU)</span>
                    <span className="text-cyan-400">Sol 184: Current Transit</span>
                    <span>Sol 248: Mars Insertion (1.52 AU)</span>
                  </div>
                </div>
              </div>

              {/* Simplistic Life Support & Emergency Call CMO (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                
                <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800 space-y-2.5 font-mono text-xs">
                  <div className="text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Vessel Life Support (ECLSS)</span>
                    <span className="text-[10px] text-emerald-400">● NOMINAL</span>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                      <span>Cabin Pressure:</span>
                      <strong className="text-cyan-300">{navTelemetry.eclssCabinPressureKpa} kPa</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                      <span>O2 / CO2 Balance:</span>
                      <strong className="text-cyan-300">{navTelemetry.oxygenPercentage}% / {navTelemetry.co2Ppm} ppm</strong>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                      <span>Radiation Shield:</span>
                      <strong className="text-emerald-400">{navTelemetry.radiationShieldIntegrityPercent}%</strong>
                    </div>
                  </div>
                </div>

                {/* SAFETY EMERGENCY BUTTON: CALL CMO */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-rose-950/60 to-slate-950 border-2 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.25)] space-y-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                        CREW MEDICAL SAFETY BEACON
                      </h4>
                      <p className="text-[10px] text-rose-200 font-mono">
                        Direct priority alert to Crew Medical Officer
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Trigger an immediate emergency call to Dr. Evelyn Stone (Crew Medical Officer) with live pod biotelemetry.
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsCmoCallPromptOpen(true)}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 hover:from-red-500 to-rose-700 hover:to-rose-600 text-white font-mono font-black text-xs tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>EMERGENCY: CALL CMO</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL: EMERGENCY CALL CMO PROMPT ================= */}
      {isCmoCallPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#090b14] border-2 border-red-500 rounded-xl p-5 shadow-[0_0_50px_rgba(239,68,68,0.5)] space-y-4">
            
            <div className="flex items-center gap-3 pb-3 border-b border-red-900/60 text-white">
              <PhoneCall className="w-6 h-6 text-red-500 animate-pulse" />
              <div>
                <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
                  CONFIRM EMERGENCY CALL TO CMO
                </h3>
                <p className="text-xs text-rose-300 font-mono">
                  Dr. Evelyn Stone · Crew Medical Officer
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <label className="text-slate-300 font-bold block">
                Select Medical Emergency Reason:
              </label>
              <select
                value={cmoCallReason}
                onChange={(e) => setCmoCallReason(e.target.value)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-red-400 focus:outline-none"
              >
                <option value="Acute sensory distress & elevated heart rate">Acute sensory distress &amp; elevated heart rate</option>
                <option value="Physical Injury or Traumatic Fall in Pod">Physical Injury or Traumatic Fall in Pod</option>
                <option value="Severe claustrophobia & spatial disorientation">Severe claustrophobia &amp; spatial disorientation</option>
                <option value="Severe respiratory difficulty / hyperventilation">Severe respiratory difficulty / hyperventilation</option>
                <option value="Unmanageable insomnia & perceptual distortion">Unmanageable insomnia &amp; perceptual distortion</option>
              </select>
            </div>

            {cmoAlertSuccess && (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cmoAlertSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCmoCallPromptOpen(false)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCmoCall}
                className="px-5 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer"
              >
                TRANSMIT EMERGENCY BEACON
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: DOOMSDAY PROTOCOL — ASTRONAUT ANTI-PSYCHOTIC DUAL-KEY BYPASS ================= */}
      <EmergencyAntiPsychoticModal
        isOpen={isDoomsdayEapOpen}
        onClose={() => setIsDoomsdayEapOpen(false)}
        astronauts={astronauts}
        onExecuteProtocol={onAddOverrideLog}
        overrideLogs={overrideLogs}
        currentRole={astronaut.role}
        initialDoomsdayMode={true}
        operatorName={astronaut.name}
        operatorAstronaut={astronaut}
      />

    </div>
  );
};
