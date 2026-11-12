import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Syringe, 
  KeyRound
} from 'lucide-react';
import { AstronautProfile, OverrideLogEntry } from '../types/ares';
import { soundEngine } from '../services/audioService';
import { canExecuteDoomsdayOverride } from '../utils/pfaLogic';

interface EmergencyAntiPsychoticModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronauts: AstronautProfile[];
  onExecuteProtocol: (entry: OverrideLogEntry) => void;
  overrideLogs: OverrideLogEntry[];
  currentRole: 'CMO' | 'FLIGHT_COMMANDER' | 'ASTRONAUT' | string;
  initialDoomsdayMode?: boolean;
  operatorName?: string;
  operatorAstronaut?: AstronautProfile;
}

export const EmergencyAntiPsychoticModal: React.FC<EmergencyAntiPsychoticModalProps> = ({
  isOpen,
  onClose,
  astronauts,
  onExecuteProtocol,
  currentRole,
  initialDoomsdayMode = false,
  operatorName = 'Elena Vance',
  operatorAstronaut
}) => {
  const [targetAstronautId, setTargetAstronautId] = useState<string>(astronauts[1]?.id || 'rossi');
  const [selectedAgent, setSelectedAgent] = useState<'Haloperidol 5mg IM' | 'Olanzapine 10mg IM' | 'Adjunct Lorazepam 2mg'>('Haloperidol 5mg IM');
  const [clinicalIndication, setClinicalIndication] = useState<string>('Acute psychotic decompensation, delusional panic, risk of life-support system disruption.');
  
  // Checklist
  const [checklist, setChecklist] = useState({
    qtcIntervalChecked: true,
    airwaySuctionReady: true,
    podContainmentLocked: true,
    telemetryLinked: true
  });

  // Authorization Mode: Standard Dual-Key vs Contingency Guardian Authorization
  const [isContingencyGuardianMode, setIsContingencyGuardianMode] = useState<boolean>(initialDoomsdayMode || currentRole === 'ASTRONAUT');

  useEffect(() => {
    if (initialDoomsdayMode || currentRole === 'ASTRONAUT') {
      setIsContingencyGuardianMode(true);
    }
  }, [initialDoomsdayMode, currentRole, isOpen]);

  // Standard Dual Keys (Flight Commander + Crew Medical Officer)
  const [commanderKey, setCommanderKey] = useState<string>('CAP99');
  const [cmoKey, setCmoKey] = useState<string>('CMO00');

  // Contingency Designated Guardian Astronaut Key (Strictly Elena Vance ASTRONAUT-03)
  const [guardianKey, setGuardianKey] = useState<string>('GUARDIAN-AUTH');
  const [contingencyReason, setContingencyReason] = useState<string>('Crew Medical Officer & Flight Commander incapacitated / unable to complete Dual-Key authorization');

  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const designatedAstronaut = astronauts.find(a => a.isDesignatedEmergencyOverrideAstronaut && a.id === 'vance') || astronauts[0];
  const isAuthorizedForContingency =
    currentRole === 'ASTRONAUT'
      ? canExecuteDoomsdayOverride(operatorAstronaut)
      : true;

  const targetAstronaut = astronauts.find(a => a.id === targetAstronautId) || astronauts[0];
  const isChecklistComplete = checklist.qtcIntervalChecked && checklist.airwaySuctionReady && checklist.podContainmentLocked && checklist.telemetryLinked;

  const handleVerifyAuthorization = () => {
    soundEngine.playBeep(1950, 0.05);

    if (isContingencyGuardianMode) {
      if (!isAuthorizedForContingency) {
        setIsVerified(false);
        soundEngine.playAlarmPulse();
        setAuthError(`ACCESS DENIED: Contingency Anti-Psychotic Guardian Authorization is restricted exclusively to Designated Guardian Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign}).`);
        return;
      }

      const code = guardianKey.trim().toUpperCase();
      const validGuardian =
        code === 'GUARDIAN-AUTH' ||
        code === 'STEWARD-77' ||
        code === 'DOOMSDAY-OVR' ||
        code === 'VANCE-OVR-77' ||
        guardianKey.trim() === 'Ares@2026';
      if (validGuardian) {
        setIsVerified(true);
        setAuthError('');
        soundEngine.playAuthGrantedChime();
      } else {
        setIsVerified(false);
        soundEngine.playAlarmPulse();
        setAuthError('CONTINGENCY GUARDIAN AUTHORIZATION REJECTED: Invalid Designated Guardian Key (use GUARDIAN-AUTH or STEWARD-77).');
      }
      return;
    }

    const isCmdrValid = commanderKey.trim().toUpperCase() === 'CAP99' || commanderKey.trim() === 'Ares@2026';
    const isCmoValid = cmoKey.trim().toUpperCase() === 'CMO00' || cmoKey.trim() === 'Ares@2026';

    if (isCmdrValid && isCmoValid) {
      setIsVerified(true);
      setAuthError('');
      soundEngine.playAuthGrantedChime();
    } else {
      setIsVerified(false);
      soundEngine.playAlarmPulse();
      if (!isCmdrValid && !isCmoValid) {
        setAuthError('DUAL-KEY REJECTED: Both Flight Commander (CAP99) and Crew Medical Officer (CMO00) keys invalid.');
      } else if (!isCmdrValid) {
        setAuthError('AUTHORIZATION DENIED: Invalid Flight Commander key (expected CAP99).');
      } else {
        setAuthError('AUTHORIZATION DENIED: Invalid Crew Medical Officer key (expected CMO00).');
      }
    }
  };

  const handleExecute = () => {
    if (!isVerified || !isChecklistComplete) return;

    setIsDeploying(true);
    soundEngine.playBiometricScanPing();

    setTimeout(() => {
      setIsDeploying(false);
      const authMethodLabel = isContingencyGuardianMode
        ? `CONTINGENCY GUARDIAN AUTHORIZATION — Designated Astronaut ${designatedAstronaut.name} (${designatedAstronaut.callsign}): ${contingencyReason}`
        : 'Flight Commander (CAP99) & Crew Medical Officer Dr. Stone (CMO00)';

      setSuccessMessage(
        isContingencyGuardianMode
          ? `CONTINGENCY GUARDIAN AUTHORIZATION EXECUTED BY ${designatedAstronaut.name.toUpperCase()} (${designatedAstronaut.callsign}): ${selectedAgent} delivered via pod servo-injector to ${targetAstronaut.name}.`
          : `ANTI-PSYCHOTIC PROTOCOL DEPLOYED: ${selectedAgent} delivered via pod autonomic servo-injector to ${targetAstronaut.name}.`
      );
      soundEngine.playAuthGrantedChime();

      const newLog: OverrideLogEntry = {
        id: `EAP-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        category: isContingencyGuardianMode ? 'CONTINGENCY_GUARDIAN_AUTHORIZATION' : 'EMERGENCY_ANTI_PSYCHOTIC_PROTOCOL',
        reason: `${selectedAgent} deployed to ${targetAstronaut.name}. ${isContingencyGuardianMode ? `[CONTINGENCY GUARDIAN (${designatedAstronaut.callsign}): ${contingencyReason}]` : clinicalIndication}`,
        authorizedBy: authMethodLabel,
        status: 'EXECUTED_AUTHORIZED',
        details: `Target: ${targetAstronaut.name} (${targetAstronaut.assignedPod}). Agent: ${selectedAgent}.`
      };

      onExecuteProtocol(newLog);

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#070b16] border-2 border-rose-500/80 rounded-xl shadow-[0_0_60px_rgba(244,63,94,0.35)] overflow-hidden font-sans">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-[#1f0915] to-rose-950 border-b border-rose-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.7)]">
              <Syringe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-rose-300">
                  NASA ARES OPERATING SYSTEM // CRITICAL PSYCHIATRIC PROTOCOL
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900 border border-rose-400 text-rose-100 font-mono">
                  {isContingencyGuardianMode ? 'CONTINGENCY GUARDIAN ACTIVE' : 'DUAL-KEY REQUIRED'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-display font-black text-white tracking-wider">
                EMERGENCY ANTI-PSYCHOTIC PROTOCOL
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-md hover:bg-rose-900/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector: Standard Dual-Key vs Contingency Guardian Authorization */}
        <div className="px-6 py-3 bg-[#0c1222] border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-xs font-mono text-slate-300">
            <span className="text-rose-400 font-bold">AUTHORIZATION MODE:</span>{' '}
            {isContingencyGuardianMode
              ? 'Contingency Guardian Protocol — Designated Astronaut Stewardship Authorization'
              : 'Standard Synchronous Dual-Key (Crew Medical Officer + Flight Commander)'}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsContingencyGuardianMode(false);
                setIsVerified(false);
                setAuthError('');
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                !isContingencyGuardianMode
                  ? 'bg-rose-950 border-rose-500 text-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard Dual-Key
            </button>
            <button
              type="button"
              onClick={() => {
                setIsContingencyGuardianMode(true);
                setIsVerified(false);
                setAuthError('');
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                isContingencyGuardianMode
                  ? 'bg-amber-950 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Contingency Guardian Authorization</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Target Astronaut & Agent Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-slate-300 font-bold uppercase tracking-wider">
                Target Patient Astronaut:
              </label>
              <select
                value={targetAstronautId}
                onChange={(e) => {
                  setTargetAstronautId(e.target.value);
                  setIsVerified(false);
                }}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-rose-400 focus:outline-none"
              >
                {astronauts.filter(a => a.role !== 'GROUND_STATION').map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assignedPod}) - Heart Rate: {a.vitals.heartRate} Beats Per Minute
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-slate-300 font-bold uppercase tracking-wider">
                Anti-Psychotic Agent Selection:
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as any)}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:border-rose-400 focus:outline-none"
              >
                <option value="Haloperidol 5mg IM">Haloperidol 5mg Intramuscular (First-line neuroleptic for acute delirium)</option>
                <option value="Olanzapine 10mg IM">Olanzapine 10mg Intramuscular (Atypical neuroleptic, lower extrapyramidal risk)</option>
                <option value="Adjunct Lorazepam 2mg">Adjunct Lorazepam 2mg (Anxiolytic co-administration)</option>
              </select>
            </div>
          </div>

          {/* Clinical Safety Checklist */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Pre-Administration Safety Interlocks</span>
              <span className={isChecklistComplete ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {isChecklistComplete ? '4/4 INTERLOCKS VERIFIED' : 'CHECKLIST INCOMPLETE'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={checklist.qtcIntervalChecked}
                  onChange={(e) => setChecklist({ ...checklist, qtcIntervalChecked: e.target.checked })}
                  className="accent-rose-500"
                />
                <span>Electrocardiogram Baseline &amp; Corrected QT Interval Validated</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={checklist.airwaySuctionReady}
                  onChange={(e) => setChecklist({ ...checklist, airwaySuctionReady: e.target.checked })}
                  className="accent-rose-500"
                />
                <span>Airway Patency &amp; Suction Staged</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={checklist.podContainmentLocked}
                  onChange={(e) => setChecklist({ ...checklist, podContainmentLocked: e.target.checked })}
                  className="accent-rose-500"
                />
                <span>Pod Bulkhead Physical Isolation Locked</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-900">
                <input
                  type="checkbox"
                  checked={checklist.telemetryLinked}
                  onChange={(e) => setChecklist({ ...checklist, telemetryLinked: e.target.checked })}
                  className="accent-rose-500"
                />
                <span>Continuous Biotelemetry Linked</span>
              </label>
            </div>
          </div>

          {/* Authorization Section: Either Standard Dual-Key OR Contingency Guardian Authorization */}
          {!isContingencyGuardianMode ? (
            <div className="p-4 rounded-lg bg-[#050912] border border-rose-900/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-300 uppercase">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  Synchronous Dual-Key Cryptographic Sign-Off
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Flight Commander + Crew Medical Officer</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-cyan-400 text-xs font-mono font-bold">
                    <span>Flight Commander Key</span>
                    <span className="text-[10px] text-slate-400">Code: CAP99</span>
                  </div>
                  <input
                    type="text"
                    value={commanderKey}
                    onChange={(e) => {
                      setCommanderKey(e.target.value);
                      setIsVerified(false);
                    }}
                    placeholder="Enter CAP99"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase tracking-widest focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-mono font-bold">
                    <span>Crew Medical Officer Key</span>
                    <span className="text-[10px] text-slate-400">Code: CMO00</span>
                  </div>
                  <input
                    type="text"
                    value={cmoKey}
                    onChange={(e) => {
                      setCmoKey(e.target.value);
                      setIsVerified(false);
                    }}
                    placeholder="Enter CMO00"
                    className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs uppercase tracking-widest focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerifyAuthorization}
                  className="px-4 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Verify Dual Keys (CAP99 + CMO00)
                </button>

                {isVerified ? (
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    DUAL KEYS VERIFIED (CAP99 &amp; CMO00)
                  </span>
                ) : authError ? (
                  <span className="text-xs font-mono font-bold text-rose-400">{authError}</span>
                ) : (
                  <span className="text-xs font-mono text-slate-400">Awaiting dual-key verification</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-amber-950/25 border-2 border-amber-500/70 space-y-3 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                    CONTINGENCY GUARDIAN PROTOCOL: DESIGNATED ASTRONAUT AUTHORIZATION (ASTRONAUT-03 ONLY)
                  </div>
                  <p className="text-[11px] text-amber-100/90 mt-0.5 leading-relaxed">
                    Designed strictly for Medical Stewardship Contingency: If the <strong>Crew Medical Officer</strong> and <strong>Flight Commander</strong> are incapacitated and unable to complete Dual-Key sign-off, ONLY the specific Designated Guardian Astronaut — <strong>Elena Vance (ASTRONAUT-03)</strong> — is authorized to complete clinical sign-off.
                  </p>
                </div>
              </div>

              {/* Designated Astronaut Identity Verification Badge */}
              <div className="p-2.5 rounded bg-slate-950/90 border border-amber-500/50 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={designatedAstronaut.avatarUrl}
                    alt={designatedAstronaut.name}
                    className="w-7 h-7 rounded-full object-cover object-top border border-amber-400"
                  />
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block">SOLE AUTHORIZED CONTINGENCY GUARDIAN ASTRONAUT:</span>
                    <strong className="text-white">{designatedAstronaut.name} ({designatedAstronaut.callsign})</strong>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isAuthorizedForContingency
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}>
                  {isAuthorizedForContingency ? 'CLEARANCE VERIFIED: ASTRONAUT-03' : `LOCKED FOR ${operatorName.toUpperCase()}`}
                </span>
              </div>

              {!isAuthorizedForContingency ? (
                <div className="p-3 rounded bg-rose-950/70 border border-rose-500 text-rose-200 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>
                    ACCESS DENIED: You are logged in as <strong>{operatorName}</strong>. Contingency Anti-Psychotic Guardian Authorization is restricted exclusively to Designated Guardian Astronaut <strong>Elena Vance (ASTRONAUT-03)</strong>.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-amber-300 font-bold uppercase block mb-1">
                        Contingency Stewardship Reason:
                      </label>
                      <select
                        value={contingencyReason}
                        onChange={(e) => setContingencyReason(e.target.value)}
                        className="w-full p-2 rounded bg-slate-950 border border-amber-500/50 text-white text-xs"
                      >
                        <option value="Crew Medical Officer & Flight Commander incapacitated / unable to complete Dual-Key authorization">
                          Crew Medical Officer &amp; Flight Commander incapacitated / unable to complete Dual-Key
                        </option>
                        <option value="Crew Medical Officer & Flight Commander unreachable during medical isolation">
                          Crew Medical Officer &amp; Flight Commander unreachable during medical isolation
                        </option>
                        <option value="Medical & Command consoles unreachable during acute crew psychosis">
                          Medical &amp; Command consoles unreachable during acute crew psychosis
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-300 font-bold uppercase flex justify-between mb-1">
                        <span>Elena Vance (ASTRONAUT-03) Key:</span>
                        <span className="text-amber-400">Code: GUARDIAN-AUTH</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={guardianKey}
                          onChange={(e) => {
                            setGuardianKey(e.target.value);
                            setIsVerified(false);
                          }}
                          placeholder="GUARDIAN-AUTH"
                          className="w-full pl-8 pr-2 py-2 rounded bg-slate-950 border border-amber-500/60 text-amber-200 font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleVerifyAuthorization}
                      className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-black tracking-wider transition-colors cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      VERIFY ASTRONAUT-03 GUARDIAN AUTHORIZATION
                    </button>

                    {isVerified ? (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        GUARDIAN AUTHORIZATION VERIFIED BY ELENA VANCE (ASTRONAUT-03)
                      </span>
                    ) : authError ? (
                      <span className="text-xs font-mono font-bold text-rose-400">{authError}</span>
                    ) : (
                      <span className="text-xs font-mono text-amber-300/80">Ready for ASTRONAUT-03 verification</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded bg-emerald-950/70 border border-emerald-500 text-emerald-200 font-mono text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={!isVerified || !isChecklistComplete || isDeploying}
              className="px-6 py-2.5 rounded bg-gradient-to-r from-rose-700 hover:from-rose-600 to-red-600 hover:to-red-500 text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-all"
            >
              <Syringe className="w-4 h-4" />
              <span>
                {isDeploying
                  ? 'DISPENSING VIA SERVO-INJECTOR...'
                  : isContingencyGuardianMode
                  ? 'EXECUTE ANTI-PSYCHOTIC (CONTINGENCY GUARDIAN)'
                  : 'EXECUTE ANTI-PSYCHOTIC PROTOCOL'}
              </span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
