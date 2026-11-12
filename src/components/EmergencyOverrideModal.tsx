import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Key, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Terminal,
  History,
  Clock
} from 'lucide-react';
import { verifyCommanderCmoOverride } from '../utils/pfaLogic';
import { soundEngine } from '../services/audioService';
import { OverrideLogEntry } from '../types/ares';

interface EmergencyOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteOverride: (category: string, reason: string) => void;
  overrideLogs: OverrideLogEntry[];
}

export const EmergencyOverrideModal: React.FC<EmergencyOverrideModalProps> = ({
  isOpen,
  onClose,
  onExecuteOverride,
  overrideLogs
}) => {
  const [cmdrKey, setCmdrKey] = useState<string>('CAP99');
  const [cmoKey, setCmoKey] = useState<string>('CMO00');
  const [overrideCategory, setOverrideCategory] = useState<string>('NEURO_SEDATIVE_DISPENSE');
  const [reason, setReason] = useState<string>('Acute unmanageable sensory decompensation requiring immediate pharmacological stabilization.');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(300);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showConfirmStep, setShowConfirmStep] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    setErrorMessage('');

    const verification = verifyCommanderCmoOverride(cmdrKey, cmoKey);
    if (!verification.valid) {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      soundEngine.playAlarmPulse();

      if (nextFailed >= 3) {
        setIsLockedOut(true);
        setErrorMessage('SECURITY LOCKOUT: 3 failed attempts detected. Terminal locked for 5 minutes.');
      } else {
        setErrorMessage(`${verification.message} (Attempt ${nextFailed}/3 before 5-minute security lock)`);
      }
      return;
    }

    // Keys valid: prompt confirmation
    setShowConfirmStep(true);
    soundEngine.playBiometricScanPing();
  };

  const handleFinalConfirm = () => {
    setIsAuthorizing(true);
    soundEngine.playBiometricScanPing();

    setTimeout(() => {
      setIsAuthorizing(false);
      setIsSuccess(true);
      soundEngine.playAuthGrantedChime();

      setTimeout(() => {
        onExecuteOverride(overrideCategory, reason);
        setIsSuccess(false);
        setShowConfirmStep(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#090b14] border-2 border-rose-600/70 rounded-lg shadow-[0_0_50px_rgba(244,63,94,0.3)] overflow-hidden">
        
        {/* Warning Banner */}
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-rose-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wider flex items-center gap-2">
                FLIGHT COMMANDER · CMO DUAL EMERGENCY OVERRIDE
              </h2>
              <p className="text-xs text-rose-200">
                ARES OS v2.6 Cryptographic Safety Interlock Protocol (CAP99 / CMO00)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded hover:bg-rose-900/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!showConfirmStep ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs">
            
            <div className="p-3 rounded bg-rose-950/30 border border-rose-900/50 flex items-start gap-2.5 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                DUAL KEY LOCK: Requires Flight Commander key (<strong>CAP99</strong>) and Chief Medical Officer key (<strong>CMO00</strong>).
                3 failed attempts triggers a 5-minute hardware lockout.
              </span>
            </div>

            {/* Dual Keys Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Key className="w-3.5 h-3.5" />
                    Captain Key
                  </span>
                  <span className="text-[10px] text-slate-500">Demo: CAP99</span>
                </div>
                <input
                  type="text"
                  required
                  value={cmdrKey}
                  onChange={(e) => setCmdrKey(e.target.value)}
                  placeholder="Enter Captain Key"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-1.5 text-slate-100 outline-none uppercase"
                />
              </div>

              <div className="p-3.5 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Key className="w-3.5 h-3.5" />
                    CMO Key
                  </span>
                  <span className="text-[10px] text-slate-500">Demo: CMO00</span>
                </div>
                <input
                  type="text"
                  required
                  value={cmoKey}
                  onChange={(e) => setCmoKey(e.target.value)}
                  placeholder="Enter CMO Key"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded px-3 py-1.5 text-slate-100 outline-none uppercase"
                />
              </div>

            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-bold">
                Select Subsystem to Override
              </label>
              <select
                value={overrideCategory}
                onChange={(e) => setOverrideCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 outline-none focus:border-rose-500"
              >
                <option value="NEURO_SEDATIVE_DISPENSE">
                  PHARMACOLOGICAL: Dispense Level-2 Medical Neuro-Sedative
                </option>
                <option value="FULL_AUTONOMY_BYPASS">
                  AI CORE: Full Autonomy Safety Interlock Bypass
                </option>
                <option value="CONTAINMENT_RELEASE">
                  ENVIRONMENTAL: Habitat Airlock Isolation Release
                </option>
                <option value="LIFE_SUPPORT_PURGE">
                  ECLSS: Atmospheric Hyperbaric Flush & Manual Valve Override
                </option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5">
                Incident Justification (Archived to DSN Audit Log)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 outline-none focus:border-rose-500"
              />
            </div>

            {/* Audit Log Table Preview */}
            {overrideLogs.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1">
                  <History className="w-3 h-3" />
                  Past Override Audit Log:
                </span>
                <div className="space-y-1">
                  {overrideLogs.map(log => (
                    <div key={log.id} className="p-1.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between text-[10px] text-slate-400">
                      <span>{log.id}: {log.category}</span>
                      <span className="text-emerald-400">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-rose-400 p-2 rounded bg-rose-950/40 border border-rose-900">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={isLockedOut}
                className="px-5 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Verify Dual Keys</span>
              </button>
            </div>

          </form>
        ) : (
          /* Final Confirmation View */
          <div className="p-6 space-y-4 font-mono text-xs">
            <div className="p-4 rounded bg-rose-950/60 border border-rose-500 text-rose-200 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                FINAL CONFIRMATION REQUIRED
              </h3>
              <p>Keys validated: Captain (CAP99) + CMO (CMO00).</p>
              <p>Target System: <strong>{overrideCategory}</strong></p>
              <p>Justification: "{reason}"</p>
              <p className="text-[11px] text-rose-300">
                Are you sure you want to commit this override? This will be permanently recorded in the flight black box and transmitted to Houston.
              </p>
            </div>

            {isSuccess && (
              <div className="p-3 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>OVERRIDE EXECUTED: Subsystem unlocked. Safety limits bypassed.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmStep(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isAuthorizing || isSuccess}
                className="px-5 py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>{isAuthorizing ? 'EXECUTING CIPHER OVERRIDE...' : 'CONFIRM & COMMIT OVERRIDE'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
