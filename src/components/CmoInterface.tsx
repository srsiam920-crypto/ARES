import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Syringe,
  BellRing,
  PhoneCall,
  ClipboardCheck
} from 'lucide-react';
import {
  AstronautProfile,
  PfaProtocolKey,
  GroundCallRecord,
  OverrideLogEntry,
  CmoEmergencyAlarm,
  CmoTaskHoldNotification
} from '../types/ares';
import { INITIAL_CMO_TASK_HOLD_NOTIFICATIONS } from '../data/mockAresData';
import { soundEngine } from '../services/audioService';
import { EmergencyAntiPsychoticModal } from './EmergencyAntiPsychoticModal';
import { CinematicEarthHeaderBg } from './CinematicEarthHeaderBg';
import { calculateAdi as calcVitalsAdi, calculateAdiLevel as calcVitalsAdiLevel } from '../utils/pfaLogic';

interface CmoInterfaceProps {
  astronauts: AstronautProfile[];
  cmoAstronaut: AstronautProfile;
  onTriggerPfa: (targetId: string, protocolKey: PfaProtocolKey) => void;
  groundCalls: GroundCallRecord[];
  onCreateGroundCall: (patientId: string, patientName: string, reason: string, priority: 'ROUTINE' | 'URGENT' | 'CRITICAL') => void;
  overrideLogs: OverrideLogEntry[];
  onAddOverrideLog: (entry: OverrideLogEntry) => void;
  activeCmoAlarm?: CmoEmergencyAlarm | null;
  onAcknowledgeCmoAlarm?: (acknowledgedByName?: string) => void;
  cmoTaskHoldNotifications?: CmoTaskHoldNotification[];
  onAcknowledgeTaskHold?: (notificationId: string) => void;
}

export const CmoInterface: React.FC<CmoInterfaceProps> = ({
  astronauts,
  cmoAstronaut,
  groundCalls,
  onCreateGroundCall,
  overrideLogs,
  onAddOverrideLog,
  activeCmoAlarm = null,
  onAcknowledgeCmoAlarm = () => {},
  cmoTaskHoldNotifications = INITIAL_CMO_TASK_HOLD_NOTIFICATIONS,
  onAcknowledgeTaskHold = () => {}
}) => {
  // Selected crew member for profile viewer
  const [selectedCrewId, setSelectedCrewId] = useState<string>(astronauts[0]?.id || 'vance');

  // Alarm banner state
  const criticalCrew = astronauts.find(a => (a.vitals.heartRate > 95 || a.vitals.hrv < 30 || a.disorderSeverity === 'CRITICAL'));
  const [isAlarmAcknowledged, setIsAlarmAcknowledged] = useState<boolean>(false);

  // Ground Call form state
  const [callReason, setCallReason] = useState<string>('cmo_unable');
  const [callPatientId, setCallPatientId] = useState<string>('');
  const [callPriority, setCallPriority] = useState<'ROUTINE' | 'URGENT' | 'CRITICAL'>('URGENT');
  const [callMessage, setCallMessage] = useState<string>('');
  const [callStatusMsg, setCallStatusMsg] = useState<string>('');

  // Emergency Anti-Psychotic Protocol state
  const [isEapModalOpen, setIsEapModalOpen] = useState<boolean>(false);
  const [eapModalDoomsday, setEapModalDoomsday] = useState<boolean>(false);
  const [eapTargetId, setEapTargetId] = useState<string>(astronauts[1]?.id || 'rossi');
  const [eapAgent, setEapAgent] = useState<string>('Haloperidol 5mg IM');
  const [eapChecklist, setEapChecklist] = useState({
    qtcInterval: false,
    airwaySuction: false,
    podContainment: false,
    telemetryLinked: true
  });

  // Inline Dual-Key OR Contingency Guardian Authorization (Elena Vance ASTRONAUT-03) Mode
  const [isDoomsdayBypassMode, setIsDoomsdayBypassMode] = useState<boolean>(false);
  const [captainCode, setCaptainCode] = useState<string>('');
  const [cmoCode, setCmoCode] = useState<string>('');
  const [astronautDoomsdayCode, setAstronautDoomsdayCode] = useState<string>('');
  const [isKeysVerified, setIsKeysVerified] = useState<boolean>(false);
  const [eapStatusMsg, setEapStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Reviewed assessments tracking
  const [reviewedAssessments, setReviewedAssessments] = useState<{ [id: string]: boolean }>({});

  const selectedCrew = astronauts.find(a => a.id === selectedCrewId) || astronauts[0];
  const designatedAstronaut = astronauts.find(a => a.isDesignatedEmergencyOverrideAstronaut && a.id === 'vance') || astronauts[0];

  const isChecklistComplete = eapChecklist.qtcInterval && eapChecklist.airwaySuction && eapChecklist.podContainment && eapChecklist.telemetryLinked;
  const canVerifyKeys = isChecklistComplete && (
    isDoomsdayBypassMode
      ? astronautDoomsdayCode.trim().length > 0
      : (captainCode.trim().length > 0 && cmoCode.trim().length > 0)
  );

  // Verify Dual Keys or Designated Astronaut (Elena Vance ASTRONAUT-03) Contingency Guardian Key
  const handleVerifyKeys = () => {
    soundEngine.playBeep(1950, 0.05);
    const targetAstronaut = astronauts.find(a => a.id === eapTargetId) || astronauts[0];

    if (isDoomsdayBypassMode) {
      const code = astronautDoomsdayCode.trim().toUpperCase();
      const validGuardianKey =
        code === 'GUARDIAN-AUTH' ||
        code === 'STEWARD-77' ||
        code === 'DOOMSDAY-OVR' ||
        code === 'VANCE-OVR-77' ||
        astronautDoomsdayCode.trim() === 'Ares@2026';

      if (validGuardianKey) {
        setIsKeysVerified(true);
        setEapStatusMsg({
          text: `CONTINGENCY GUARDIAN PROTOCOL VERIFIED: Designated Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign}) Guardian Authorization accepted. Dual-Key sign-off completed via Medical Stewardship Contingency.`,
          isError: false
        });
        soundEngine.playAuthGrantedChime();

        onAddOverrideLog({
          id: `EAP-GUARD-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString(),
          category: 'CONTINGENCY_GUARDIAN_AUTHORIZATION',
          reason: `Designated Guardian Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign}) authorized care for ${targetAstronaut.name} (${eapAgent})`,
          authorizedBy: `Designated Guardian Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign} / GUARDIAN-AUTH)`,
          status: 'EXECUTED_AUTHORIZED',
          details: 'Crew Medical Officer & Flight Commander unavailable. Designated Guardian Astronaut Elena Vance authorized anti-psychotic stabilization.'
        });
      } else {
        setIsKeysVerified(false);
        setEapStatusMsg({
          text: 'CONTINGENCY GUARDIAN AUTHORIZATION DENIED: Invalid Designated Astronaut Elena Vance (ASTRONAUT-03) Guardian Key (expected GUARDIAN-AUTH).',
          isError: true
        });
        soundEngine.playAlarmPulse();
      }
      return;
    }

    const capValid = captainCode.trim().toUpperCase() === 'CAP99' || captainCode.trim() === 'Ares@2026';
    const cmoValid = cmoCode.trim().toUpperCase() === 'CMO00' || cmoCode.trim() === 'Ares@2026';

    if (capValid && cmoValid) {
      setIsKeysVerified(true);
      setEapStatusMsg({
        text: 'DUAL-KEY CONFIRMED: Flight Commander (CAP99) and Crew Medical Officer (CMO00) verified. Anti-psychotic delivery authorized.',
        isError: false
      });
      soundEngine.playAuthGrantedChime();

      onAddOverrideLog({
        id: `EAP-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        category: 'ANTI_PSYCHOTIC_DUAL_KEY_VERIFICATION',
        reason: `Dual-key verified for ${targetAstronaut.name} (${eapAgent})`,
        authorizedBy: 'Flight Commander (CAP99) & Crew Medical Officer (CMO00)',
        status: 'EXECUTED_AUTHORIZED',
        details: 'Keys validated. Ready for neuroleptic deployment.'
      });
    } else {
      setIsKeysVerified(false);
      setEapStatusMsg({
        text: 'AUTHENTICATION DENIED: Invalid dual-key credentials. Flight Commander code: CAP99, Crew Medical Officer code: CMO00.',
        isError: true
      });
      soundEngine.playAlarmPulse();

      onAddOverrideLog({
        id: `EAP-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        category: 'ANTI_PSYCHOTIC_DUAL_KEY_VERIFICATION',
        reason: `Failed authorization attempt for ${targetAstronaut.name}`,
        authorizedBy: 'REJECTED',
        status: 'LOCKED_FAILED_ATTEMPT',
        details: 'Incorrect PIN provided for dual-key.'
      });
    }
  };

  // Execute Anti-Psychotic Protocol
  const handleExecuteEap = () => {
    if (!isKeysVerified) return;
    const targetAstronaut = astronauts.find(a => a.id === eapTargetId) || astronauts[0];

    soundEngine.playBiometricScanPing();
    setEapStatusMsg({
      text: isDoomsdayBypassMode
        ? `CONTINGENCY GUARDIAN AUTHORIZATION EXECUTED BY ${designatedAstronaut.name.toUpperCase()} (${designatedAstronaut.callsign}): ${eapAgent} administered via pod autonomic port to ${targetAstronaut.name}.`
        : `ANTI-PSYCHOTIC PROTOCOL EXECUTED: ${eapAgent} administered via pod autonomic port to ${targetAstronaut.name}.`,
      isError: false
    });

    onAddOverrideLog({
      id: `EAP-EXEC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      category: isDoomsdayBypassMode ? 'CONTINGENCY_GUARDIAN_MEDICATION_DISPENSE' : 'ANTI_PSYCHOTIC_MEDICATION_DISPENSE',
      reason: `${eapAgent} deployed to ${targetAstronaut.name} for acute neuro-psychiatric stabilization`,
      authorizedBy: isDoomsdayBypassMode
        ? `Designated Guardian Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign}) Contingency Authorization`
        : 'Flight Commander (CAP99) & Crew Medical Officer Dr. Stone (CMO00)',
      status: 'EXECUTED_AUTHORIZED',
      details: `Target: ${targetAstronaut.name} (${targetAstronaut.assignedPod}). Agent: ${eapAgent}.`
    });

    setCaptainCode('');
    setCmoCode('');
    setAstronautDoomsdayCode('');
    setIsKeysVerified(false);
    setEapChecklist({ qtcInterval: false, airwaySuction: false, podContainment: false, telemetryLinked: true });
  };

  // Submit Ground Support Call
  const handleSubmitGroundCall = () => {
    const patient = astronauts.find(a => a.id === callPatientId);
    onCreateGroundCall(
      (callPatientId || 'fleet') as any,
      patient ? patient.name : 'Fleet Operations',
      callMessage.trim() || `Crew Medical Officer escalated: ${callReason.replace('_', ' ')}`,
      callPriority
    );
    setCallMessage('');
    setCallStatusMsg('Call request dispatched to Houston Johnson Space Center Mission Control.');
    soundEngine.playBiometricScanPing();
    setTimeout(() => setCallStatusMsg(''), 4000);
  };

  return (
    <div id="cmoInterface" className="w-full max-w-7xl mx-auto space-y-4">
      
      {/* ================= CREW MEDICAL OFFICER / FLIGHT COMMANDER MEDICAL HEADER ================= */}
      <header className="ares-header relative overflow-hidden min-h-[148px] border-rose-500/50 bg-[#070b18]">
        <CinematicEarthHeaderBg variant="cmo" />
        <div className="relative z-10 w-full lg:max-w-[66%] flex flex-col gap-3">
          <div className="profile-block">
            <div className="avatar border-rose-500 bg-rose-950/40">
              <img 
                src={cmoAstronaut.avatarUrl} 
                alt={cmoAstronaut.name}
                referrerPolicy="no-referrer"
                className="object-top"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="ares-sys-tag text-rose-400">
                  CREW MEDICAL OFFICER &amp; COMMAND MEDICAL CONSOLE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-200 font-mono">
                  CREW MEDICAL OFFICER &amp; FLIGHT COMMANDER AUTHORIZED
                </span>
              </div>
              <h2 className="ares-subject-id text-white">
                {cmoAstronaut.name.toUpperCase()} [{cmoAstronaut.role === 'FLIGHT_COMMANDER' ? 'FLIGHT COMMANDER' : 'CREW MEDICAL OFFICER'}]
              </h2>
              <div className="profile-sub text-slate-300">
                Clinical Neuro-Psychiatry · Continuous Telemetry Screening · Dual-Key Anti-Psychotic Protocol
              </div>
            </div>
          </div>

          <div className="ares-status-pills">
            <button
              onClick={() => {
                setEapModalDoomsday(false);
                setIsEapModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer"
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>EMERGENCY ANTI-PSYCHOTIC PROTOCOL</span>
            </button>

            <div className="ares-badge border-rose-500/40 bg-[#091122]/90">
              <span className={`ares-badge-dot ${(activeCmoAlarm?.active || (criticalCrew && !isAlarmAcknowledged)) ? 'critical' : 'nominal'}`} />
              <span>
                SYSTEM ACUTE DISTRESS INDEX ALARM: <strong>{activeCmoAlarm?.active ? 'ASTRONAUT CALL ALARM' : criticalCrew && !isAlarmAcknowledged ? 'ALARM ACTIVE' : 'ACTIVE MONITORING'}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= ASTRONAUT -> CREW MEDICAL OFFICER EMERGENCY CALL ALARM SYSTEM PANEL ================= */}
      {activeCmoAlarm && (
        <div
          id="cmoIncomingCallAlarmCard"
          className={`p-4 rounded-xl border-2 font-mono text-xs transition-all ${
            activeCmoAlarm.active
              ? 'bg-gradient-to-r from-red-950/90 via-rose-950/90 to-red-950/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
              : 'bg-emerald-950/40 border-emerald-500/60'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                activeCmoAlarm.active
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : 'bg-emerald-700 text-white'
              }`}>
                {activeCmoAlarm.active ? <BellRing className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider ${
                    activeCmoAlarm.active
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-700 text-emerald-100'
                  }`}>
                    {activeCmoAlarm.active ? 'INCOMING ASTRONAUT EMERGENCY CALL ALARM' : 'CREW MEDICAL OFFICER CALL ALARM ACKNOWLEDGED'}
                  </span>
                  <span className="text-slate-300 font-bold">
                    #{activeCmoAlarm.id} · {activeCmoAlarm.timestamp}
                  </span>
                </div>
                <div className="text-white font-bold text-sm mt-1">
                  ASTRONAUT: {activeCmoAlarm.callerName} ({activeCmoAlarm.callerCallsign}) · {activeCmoAlarm.assignedPod}
                </div>
                <div className="text-rose-200 mt-0.5">
                  REASON: &ldquo;{activeCmoAlarm.reason}&rdquo; · Vitals: Heart Rate {activeCmoAlarm.heartRate} Beats Per Minute | Heart Rate Variability {activeCmoAlarm.hrv} Milliseconds | Blood Oxygen Saturation {activeCmoAlarm.spo2}%
                </div>
                {!activeCmoAlarm.active && activeCmoAlarm.acknowledgedBy && (
                  <div className="text-emerald-300 text-[11px] mt-1">
                    ✓ Acknowledged &amp; Silenced by {activeCmoAlarm.acknowledgedBy} at {activeCmoAlarm.acknowledgedAt}
                  </div>
                )}
              </div>
            </div>

            {activeCmoAlarm.active && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCrewId(activeCmoAlarm.callerId);
                    setEapTargetId(activeCmoAlarm.callerId);
                    setCallPatientId(activeCmoAlarm.callerId);
                    onAcknowledgeCmoAlarm(cmoAstronaut.name);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACKNOWLEDGE &amp; SILENCE ASTRONAUT ALARM</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MISSION CHECKLIST ACUTE DISTRESS INDEX TASK HOLD NOTIFICATIONS ================= */}
      <div
        id="cmoTaskHoldNotificationsPanel"
        className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#0b1224] to-amber-950/30 border border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.18)] space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-800/50 font-mono">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              MISSION CHECKLIST ACUTE DISTRESS INDEX TASK HOLD NOTIFICATIONS
            </span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-950 border border-amber-500/60 text-amber-200 font-bold">
            {cmoTaskHoldNotifications.filter(n => n.status === 'ACTIVE_HOLD').length} PENDING CREW MEDICAL OFFICER REVIEW
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Automatic clinical telemetry notifications triggered when an astronaut attempts a Mission Checklist task (such as Spacewalk, Medical Drill, Fire Drill, or Biological Experiment) while exceeding the required Acute Distress Index clearance threshold.
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {cmoTaskHoldNotifications.map((notif) => {
            const isReviewedByCmo = notif.status === 'CMO_REVIEWED';
            return (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isReviewedByCmo
                    ? 'bg-slate-950/75 border-slate-800 text-slate-300'
                    : 'bg-amber-950/35 border-amber-500/70 text-amber-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isReviewedByCmo
                        ? 'bg-emerald-950 border border-emerald-600/60 text-emerald-300'
                        : 'bg-amber-500 text-slate-950 font-black'
                    }`}>
                      {isReviewedByCmo ? 'REVIEWED BY CREW MEDICAL OFFICER' : 'ACTIVE TASK SAFETY HOLD'}
                    </span>
                    <span className="text-white font-bold">
                      {notif.astronautName} ({notif.astronautCallsign}) · {notif.assignedPod}
                    </span>
                    <span className="text-slate-400 text-[11px]">{notif.timestamp}</span>
                  </div>
                  <div className="text-xs font-bold text-amber-300">
                    Blocked Task: {notif.taskTitle} ({notif.taskCategory}) — Astronaut Acute Distress Index: {notif.currentAdi.toFixed(2)} (Required ≤ {notif.requiredMaxAdi.toFixed(2)})
                  </div>
                  <div className="text-[11px] text-slate-300">{notif.reason}</div>
                </div>

                <div className="shrink-0">
                  {isReviewedByCmo ? (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeTaskHold(notif.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      Acknowledge &amp; Review Task Hold
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= ACUTE DISTRESS INDEX ALARM BANNER ================= */}
      {criticalCrew && !isAlarmAcknowledged && (
        <div className="cmo-alert-banner">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <span>
              ⚠️ ALARM: CREW MEMBER {criticalCrew.name.toUpperCase()} ACUTE DISTRESS INDEX {calculateAdi(criticalCrew).toFixed(2)} - HIGH ACUTE DISTRESS
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAlarmAcknowledged(true)}
            className="ares-tab-btn danger text-xs font-mono font-bold cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ================= SECTION 1: ALL CREW + SELECTED PROFILE ================= */}
      <div className="graph-card">
        <div className="graph-title mb-3">
          <span>ALL CREW MEMBERS BIOMETRICS &amp; ACUTE DISTRESS INDEX STATUS</span>
          <span className="text-slate-400 text-xs font-normal">Click a crew card to inspect full clinical dossier</span>
        </div>

        <div className="crew-grid">
          {astronauts.filter(a => a.role !== 'GROUND_STATION').map((c) => {
            const adi = calculateAdi(c);
            const level = adi >= 0.70 ? 'critical' : adi >= 0.45 ? 'warning' : 'ok';
            const label = adi >= 0.70 ? 'CRITICAL' : adi >= 0.45 ? 'MODERATE (YELLOW)' : 'NOMINAL (GREEN)';
            const isSelected = c.id === selectedCrewId;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCrewId(c.id);
                  setEapTargetId(c.id);
                  setCallPatientId(c.id);
                  soundEngine.playBeep(1850, 0.04);
                }}
                className={`crew-card ${level} ${isSelected ? 'selected' : ''}`}
              >
                <div className="avatar sm relative">
                  <img src={c.avatarUrl} alt={c.name} className="object-top" />
                </div>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-xs text-white truncate">
                    {c.name} ({c.callsign})
                  </div>
                  <div className="muted text-[11px] truncate">
                    Heart Rate: {c.vitals.heartRate} Beats Per Minute &middot; Sleep: {Math.round(c.vitals.sleepHoursLast24)} Hours &middot; Last Time of Sleep: {c.lastTimeOfSleep}
                  </div>
                  <div className={`mono text-xs font-semibold adi-${level}`}>
                    Acute Distress Index: {adi.toFixed(2)} ({label})
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Astronaut Clinical Dossier (Full Width) */}
      <div className="graph-card relative overflow-hidden" id="profileViewerCard">
        <CinematicEarthHeaderBg variant="compact" />
        <div className="relative z-10 graph-title mb-2">
          <span>ASTRONAUT CLINICAL BIOTELEMETRY DOSSIER</span>
          <span className="text-cyan-400 text-xs font-mono">LAST TIME OF SLEEP: {selectedCrew.lastTimeOfSleep}</span>
        </div>
        
        <div className="relative z-10 profile-viewer lg:max-w-[76%]">
          <div className="avatar lg border-cyan-400">
            <img src={selectedCrew.avatarUrl} alt={selectedCrew.name} referrerPolicy="no-referrer" className="object-top" />
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {selectedCrew.name}
                </h3>
                <div className="profile-sub">
                  Callsign: {selectedCrew.callsign} &middot; {selectedCrew.specialty} &middot; {selectedCrew.assignedPod}
                </div>
              </div>

              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-cyan-300">
                Role: {selectedCrew.role === 'CMO' ? 'CREW MEDICAL OFFICER' : selectedCrew.role}
              </span>
            </div>

            <div className="kv">
              <div>
                <span>Heart Rate</span>
                <b className="text-cyan-300">{selectedCrew.vitals.heartRate} Beats Per Minute</b>
              </div>
              <div>
                <span>Heart Rate Variability</span>
                <b>{selectedCrew.vitals.hrv} Milliseconds</b>
              </div>
              <div>
                <span>Blood Oxygen Saturation</span>
                <b className="text-cyan-300">{selectedCrew.vitals.spo2}%</b>
              </div>
              <div>
                <span>Voice Jitter</span>
                <b>{selectedCrew.vitals.skinConductanceUs > 10 ? '4.8%' : selectedCrew.vitals.skinConductanceUs > 5.5 ? '1.8%' : '0.6%'}</b>
              </div>
              <div>
                <span>Sleep Last 24 Hours</span>
                <b>{selectedCrew.vitals.sleepHoursLast24} Hours (Last Time of Sleep: {selectedCrew.lastTimeOfSleep})</b>
              </div>
              <div>
                <span>Acute Distress Index</span>
                <b className={`adi-${calculateAdiLevel(selectedCrew)}`}>
                  {calculateAdi(selectedCrew).toFixed(2)}
                </b>
              </div>
            </div>

            <div className="text-xs text-slate-300 pt-1">
              <span className="text-slate-400 font-mono">Clinical Status:</span>{' '}
              <span className={`sev-pill ${calculateAdiLevel(selectedCrew)} ml-1`}>
                {calculateAdiLevel(selectedCrew)}
              </span>{' '}
              <span className="font-semibold text-white ml-1">
                {selectedCrew.activeDisorder || 'Nominal Equilibrium'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: CLINICAL CONDITION SCREENING ================= */}
      <div className="graph-card border-amber-500/40" id="emergencySection">
        <div className="graph-title text-amber-300">
          <span>EMERGENCY SECTION &middot; CLINICAL CONDITION SCREENING</span>
        </div>
        <p className="muted my-1">
          Crew members are continuously screened from biometrics, heart rate variability, and sleep architecture.
        </p>

        <div className="assess-list">
          {astronauts.filter(a => a.role !== 'GROUND_STATION').map((c) => {
            const adi = calculateAdi(c);
            const level = calculateAdiLevel(c);
            const isReviewed = reviewedAssessments[c.id];

            return (
              <div key={c.id} className={`assess-card sev-${level}`}>
                <div className="ctrl-row">
                  <span>
                    <strong className="text-white">{c.name}</strong>{' '}
                    <span className="muted font-mono">({c.callsign})</span>
                  </span>
                  <span className={`sev-pill ${level}`}>
                    {c.disorderSeverity || level.toUpperCase()}
                  </span>
                </div>

                <h4 className="text-white font-bold text-sm mt-1">
                  {c.activeDisorder || 'Operational Equilibrium'}
                </h4>

                <div className="muted font-mono text-[11px]">
                  Acute Distress Index Score: {adi.toFixed(2)} &middot; Last Time of Sleep: {c.lastTimeOfSleep}
                </div>

                <div className="muted text-xs mt-1">
                  {c.biomarkerCause || 'Autonomic sympathetic-parasympathetic tone within nominal limits.'}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {isReviewed ? (
                    <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Reviewed by Crew Medical Officer</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewedAssessments(prev => ({ ...prev, [c.id]: true }));
                        soundEngine.playBiometricScanPing();
                      }}
                      className="ares-tab-btn text-xs py-1 px-3 cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 3 & 4: GROUND SUPPORT CALLS + EMERGENCY ANTI-PSYCHOTIC PROTOCOL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* SECTION 3: REQUEST GROUND SUPPORT */}
        <div className="graph-card">
          <div className="graph-title text-cyan-300">REQUEST HOUSTON GROUND STATION CONSULT</div>
          <p className="muted my-1">
            Dispatch medical telemetry consultation to NASA Johnson Space Center Flight Surgeon in Houston (simulated +22 Minutes latency).
          </p>

          <div className="space-y-3 mt-3">
            <div>
              <label className="step-label">REASON FOR CALL:</label>
              <select
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                className="code-input mt-1"
              >
                <option value="cmo_unable">Crew Medical Officer unable to stabilize subject autonomic vitals</option>
                <option value="psychotic_episode">Severe psychotic agitation / perceptual decompensation</option>
                <option value="persistent_panic">Persistent panic attack / hyperventilation (&gt; 20 Minutes)</option>
                <option value="circadian_failure">Circadian collapse / chronic sleep deprivation (&gt; 48 Hours)</option>
              </select>
            </div>

            <div>
              <label className="step-label">PATIENT ASTRONAUT:</label>
              <select
                value={callPatientId}
                onChange={(e) => setCallPatientId(e.target.value)}
                className="code-input mt-1"
              >
                <option value="">Select patient (or leave blank for fleet issue)...</option>
                {astronauts.filter(a => a.role !== 'GROUND_STATION').map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.callsign})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="step-label">CALL PRIORITY:</label>
              <select
                value={callPriority}
                onChange={(e) => setCallPriority(e.target.value as any)}
                className="code-input mt-1"
              >
                <option value="ROUTINE">ROUTINE (Standard Deep Space Network pass)</option>
                <option value="URGENT">URGENT (Priority bandwidth reservation)</option>
                <option value="CRITICAL">CRITICAL (Emergency telemetry downlink interrupt)</option>
              </select>
            </div>

            <div>
              <label className="step-label">CLINICAL NOTES:</label>
              <textarea
                value={callMessage}
                onChange={(e) => setCallMessage(e.target.value)}
                placeholder="Detail symptoms, vitals, and pharmacological recommendations..."
                className="field mt-1 h-20 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitGroundCall}
              className="ares-tab-btn is-active w-full cursor-pointer"
            >
              TRANSMIT CONSULT REQUEST TO HOUSTON
            </button>

            {callStatusMsg && (
              <div className="status-msg ok">
                {callStatusMsg}
              </div>
            )}
          </div>

          {/* Active Calls List */}
          <div className="mt-4 space-y-2">
            <div className="graph-title text-xs">TRANSMITTED GROUND CALLS</div>
            {groundCalls.map((call) => (
              <div key={call.id} className="p-2.5 rounded-lg bg-[#0e121d] border border-[#232736]">
                <div className="ctrl-row">
                  <span className="font-bold text-white">
                    #{call.id} &middot; {call.priority} &middot; {call.patientName}
                  </span>
                  <span className="status-pill in_progress">
                    {call.status}
                  </span>
                </div>
                <div className="muted text-[11px] mt-1">
                  {call.timestamp} &middot; By: {call.cmoName}
                </div>
                <div className="text-xs text-slate-200 mt-1">
                  {call.reason}
                </div>
                {call.groundResponse && (
                  <div className="text-xs text-cyan-300 mt-1.5 p-2 rounded bg-cyan-950/40 border border-cyan-800/40">
                    <b>Houston Flight Surgeon:</b> {call.groundResponse}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: EMERGENCY ANTI-PSYCHOTIC PROTOCOL - DUAL-KEY + CONTINGENCY GUARDIAN AUTHORIZATION */}
        <div className="graph-card border-rose-600/50">
          <div className="graph-title text-rose-400 flex flex-wrap items-center justify-between gap-2">
            <span>EMERGENCY ANTI-PSYCHOTIC PROTOCOL</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
              isDoomsdayBypassMode
                ? 'bg-amber-950 border-amber-400 text-amber-200'
                : 'bg-rose-950 border-rose-500 text-rose-200'
            }`}>
              {isDoomsdayBypassMode ? 'CONTINGENCY GUARDIAN MODE' : 'DUAL-KEY REQUIRED'}
            </span>
          </div>
          <p className="muted my-1">
            Requires Dual-Key Authorization from Flight Commander (<code className="text-cyan-300">CAP99</code>) and Crew Medical Officer (<code className="text-emerald-300">CMO00</code>). If both are unavailable or incapacitated, Designated Guardian Astronaut <strong>Elena Vance (ASTRONAUT-03)</strong> Contingency Authorization (<code className="text-amber-300">GUARDIAN-AUTH</code>) completes clinical sign-off.
          </p>

          <div className="space-y-3 mt-3">
            {/* 1. Patient Select */}
            <div>
              <label className="step-label">1. SELECT PATIENT ASTRONAUT:</label>
              <select
                value={eapTargetId}
                onChange={(e) => setEapTargetId(e.target.value)}
                className="code-input mt-1"
              >
                {astronauts.filter(a => a.role !== 'GROUND_STATION').map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.callsign})</option>
                ))}
              </select>
            </div>

            {/* 2. Select Anti-Psychotic Agent */}
            <div>
              <label className="step-label">2. SELECT ANTI-PSYCHOTIC AGENT:</label>
              <select
                value={eapAgent}
                onChange={(e) => setEapAgent(e.target.value)}
                className="code-input mt-1"
              >
                <option value="Haloperidol 5mg IM">Haloperidol 5mg Intramuscular (Acute Delirium / Violent Psychosis)</option>
                <option value="Olanzapine 10mg IM">Olanzapine 10mg Intramuscular (Atypical Neuroleptic, Lower Extrapyramidal Risk)</option>
                <option value="Adjunct Lorazepam 2mg">Adjunct Lorazepam 2mg (Synergistic Anxiolysis)</option>
              </select>
            </div>

            {/* 3. Physical Safety Checklist */}
            <div>
              <label className="step-label">3. CLINICAL PRE-ADMINISTRATION SAFETY CHECKLIST:</label>
              <div className="checklist-group bg-[#0e121d] p-2.5 rounded-lg border border-[#232736]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={eapChecklist.qtcInterval}
                    onChange={(e) => setEapChecklist(prev => ({ ...prev, qtcInterval: e.target.checked }))}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>Baseline Electrocardiogram &amp; Corrected QT Interval Checked</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={eapChecklist.airwaySuction}
                    onChange={(e) => setEapChecklist(prev => ({ ...prev, airwaySuction: e.target.checked }))}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>Airway &amp; Suction Equipment Staged</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={eapChecklist.podContainment}
                    onChange={(e) => setEapChecklist(prev => ({ ...prev, podContainment: e.target.checked }))}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>Pod Bulkhead Physical Isolation Locked</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={eapChecklist.telemetryLinked}
                    onChange={(e) => setEapChecklist(prev => ({ ...prev, telemetryLinked: e.target.checked }))}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>Continuous Biotelemetry &amp; Autonomic Port Linked</span>
                </label>
              </div>
            </div>

            {/* 4. Dual-Key Authorization OR Designated Guardian Astronaut (Elena Vance ASTRONAUT-03) Contingency Authorization */}
            <div className="dual-key-box space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="step-label text-rose-400">
                  4. {isDoomsdayBypassMode ? 'CONTINGENCY GUARDIAN AUTHORIZATION (ELENA VANCE ASTRONAUT-03 ONLY):' : 'DUAL-KEY SYNCHRONOUS AUTHORIZATION:'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setIsDoomsdayBypassMode(!isDoomsdayBypassMode);
                    setIsKeysVerified(false);
                    setEapStatusMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    isDoomsdayBypassMode
                      ? 'bg-amber-950 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-amber-950/50'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>
                    {isDoomsdayBypassMode ? 'Switch to Standard Dual-Key' : 'Contingency: Elena Vance (ASTRONAUT-03) Guardian Key'}
                  </span>
                </button>
              </div>

              {!isDoomsdayBypassMode ? (
                <>
                  <div>
                    <span className="muted text-[11px] block">FLIGHT COMMANDER CONFIDENTIAL CODE:</span>
                    <input
                      type="password"
                      value={captainCode}
                      onChange={(e) => setCaptainCode(e.target.value)}
                      placeholder="Enter CAP99"
                      maxLength={12}
                      className="code-input mt-0.5"
                    />
                  </div>

                  <div>
                    <span className="muted text-[11px] block">CREW MEDICAL OFFICER CONFIDENTIAL CODE:</span>
                    <input
                      type="password"
                      value={cmoCode}
                      onChange={(e) => setCmoCode(e.target.value)}
                      placeholder="Enter CMO00"
                      maxLength={12}
                      className="code-input mt-0.5"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyKeys}
                    disabled={!canVerifyKeys}
                    className="ares-tab-btn w-full mt-2 cursor-pointer"
                  >
                    VERIFY DUAL KEYS (CAP99 + CMO00)
                  </button>
                </>
              ) : (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/60 space-y-2">
                  <div className="text-[11px] font-mono text-amber-200 leading-relaxed">
                    <strong>CONTINGENCY GUARDIAN STEWARDSHIP (ASTRONAUT-03 ONLY):</strong> Restricted exclusively to Designated Guardian Astronaut <strong>Elena Vance (ASTRONAUT-03)</strong> if the Crew Medical Officer and Flight Commander are incapacitated.
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-amber-300 font-bold block">
                      ELENA VANCE (ASTRONAUT-03) GUARDIAN KEY:
                    </span>
                    <input
                      type="text"
                      value={astronautDoomsdayCode}
                      onChange={(e) => setAstronautDoomsdayCode(e.target.value)}
                      placeholder="Enter GUARDIAN-AUTH"
                      className="code-input mt-1 border-amber-500/60 text-amber-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyKeys}
                    disabled={!canVerifyKeys}
                    className="w-full py-2 px-3 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-mono font-black text-xs tracking-wider cursor-pointer transition-colors"
                  >
                    AUTHORIZE VIA ELENA VANCE GUARDIAN KEY (GUARDIAN-AUTH)
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleExecuteEap}
                disabled={!isKeysVerified}
                className="btn-danger mt-1 cursor-pointer"
              >
                {isKeysVerified
                  ? isDoomsdayBypassMode
                    ? 'EXECUTE ANTI-PSYCHOTIC DISPENSE (ASTRONAUT-03 GUARDIAN VERIFIED)'
                    : 'EXECUTE ANTI-PSYCHOTIC DISPENSE (DUAL-KEY MATCHED)'
                  : 'DEPLOY ANTI-PSYCHOTIC PROTOCOL (LOCKED)'}
              </button>

              {eapStatusMsg && (
                <div className={`status-msg ${eapStatusMsg.isError ? 'err' : 'ok'}`}>
                  {eapStatusMsg.text}
                </div>
              )}
            </div>

            {/* Authorization Audit Log */}
            <div>
              <div className="graph-title text-xs mt-3 mb-1">ANTI-PSYCHOTIC AUTHORIZATION AUDIT LOG</div>
              <div className="overflow-x-auto max-h-40 overflow-y-auto">
                <table className="audit" id="auditTable">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Authorized By</th>
                      <th>Category</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrideLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.timestamp}</td>
                        <td>{log.authorizedBy}</td>
                        <td className="truncate max-w-[150px]">{log.category}</td>
                        <td className={log.status === 'EXECUTED_AUTHORIZED' ? 'ok-text' : 'fail-text'}>
                          {log.status === 'EXECUTED_AUTHORIZED' ? 'OK' : 'FAIL'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Emergency Anti-Psychotic Protocol Modal */}
      <EmergencyAntiPsychoticModal
        isOpen={isEapModalOpen}
        onClose={() => setIsEapModalOpen(false)}
        astronauts={astronauts}
        onExecuteProtocol={onAddOverrideLog}
        overrideLogs={overrideLogs}
        currentRole={cmoAstronaut.role}
        initialDoomsdayMode={eapModalDoomsday}
        operatorName={cmoAstronaut.name}
        operatorAstronaut={cmoAstronaut}
      />

    </div>
  );
};

// Helper Acute Distress Index calculator
function calculateAdi(a: AstronautProfile): number {
  return calcVitalsAdi(a.vitals);
}

function calculateAdiLevel(a: AstronautProfile): 'ok' | 'warning' | 'critical' {
  return calcVitalsAdiLevel(a.vitals);
}

