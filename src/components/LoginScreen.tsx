import React, { useState } from 'react';
import { AstronautProfile } from '../types/ares';
import { soundEngine } from '../services/audioService';
import { CinematicEarthHeaderBg } from './CinematicEarthHeaderBg';
import { calculateAdi, calculateAdiLevel } from '../utils/pfaLogic';
import { ScanFace, KeyRound, Lock, CheckCircle2, AlertTriangle, Radio, Cpu } from 'lucide-react';

interface LoginScreenProps {
  astronauts: AstronautProfile[];
  onLoginSuccess: (astronaut: AstronautProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  astronauts,
  onLoginSuccess
}) => {
  const [selectedProfile, setSelectedProfile] = useState<AstronautProfile>(astronauts[0]);
  const [pinInput, setPinInput] = useState<string>('Ares@2026');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const getRoleBadge = (profile: AstronautProfile) => {
    if (profile.role === 'CMO') {
      return {
        label: 'CREW MEDICAL OFFICER',
        style: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
      };
    }
    if (profile.role === 'FLIGHT_COMMANDER') {
      return {
        label: 'FLIGHT COMMANDER',
        style: 'bg-rose-950/90 text-rose-300 border-rose-500/60'
      };
    }
    if (profile.role === 'GROUND_STATION') {
      return {
        label: 'HOUSTON GROUND STATION',
        style: 'bg-blue-950/90 text-blue-300 border-blue-500/60'
      };
    }
    return {
      label: profile.isDesignatedEmergencyOverrideAstronaut
        ? 'ASTRONAUT · CONTINGENCY GUARDIAN'
        : 'ASTRONAUT · CREW',
      style: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60'
    };
  };

  const getAccessScopeLabel = (profile: AstronautProfile) => {
    if (profile.role === 'GROUND_STATION') {
      return 'ACCESS SCOPE: HOUSTON GROUND STATION CONSOLE ONLY';
    }
    if (profile.role === 'CMO') {
      return 'ACCESS SCOPE: CREW MEDICAL OFFICER CONSOLE & POD INTERFACE (DUAL-KEY: CMO00)';
    }
    if (profile.role === 'FLIGHT_COMMANDER') {
      return 'ACCESS SCOPE: POD INTERFACE & CREW MEDICAL OFFICER CONSOLE (DUAL-KEY: CAP99)';
    }
    if (profile.isDesignatedEmergencyOverrideAstronaut) {
      return 'ACCESS SCOPE: POD INTERFACE + DESIGNATED CONTINGENCY GUARDIAN AUTHORIZATION';
    }
    return 'ACCESS SCOPE: POD INTERFACE ONLY';
  };

  const handleSelectOperator = (profile: AstronautProfile) => {
    soundEngine.playBeep(2475, 0.04);
    setSelectedProfile(profile);
    setPinInput(profile.bioSecurityPin || 'Ares@2026');
    setAuthError(null);
  };

  const handleBiometricLogin = (targetProfile?: AstronautProfile) => {
    const profileToAuth = targetProfile || selectedProfile;
    if (targetProfile) {
      setSelectedProfile(targetProfile);
    }
    setAuthError(null);

    if (pinInput.trim() !== profileToAuth.bioSecurityPin && !targetProfile) {
      soundEngine.playAlarmPulse();
      setAuthError('INVALID SECURITY PIN. ENTER AUTHORIZED ARES-V CREDENTIAL (Ares@2026).');
      return;
    }

    setIsScanning(true);
    setScanProgress(25);
    soundEngine.playBiometricScanPing();

    setTimeout(() => {
      setScanProgress(75);
    }, 180);

    setTimeout(() => {
      setScanProgress(100);
      soundEngine.playAuthGrantedChime();
      setIsScanning(false);
      onLoginSuccess(profileToAuth);
    }, 380);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500/30 z-10">
      {/* Subtle Sci-Fi Orbital Grid Overlay over Starfield */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 15%, rgba(14, 165, 233, 0.18), transparent 60%), linear-gradient(to right, rgba(30, 58, 138, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 58, 138, 0.14) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px'
        }}
      />

      {/* Top Deep-Space Telemetry Security Bar */}
      <header className="relative z-10 border-b border-cyan-950/90 bg-[#050b18]/80 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" fill="#0B3D91" stroke="#38BDF8" strokeWidth="2.5" />
            <path d="M12 55 L50 25 L88 55 L75 58 L50 40 L25 58 Z" fill="#FC3D21" />
            <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            <text x="50" y="58" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="16">NASA</text>
          </svg>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-widest text-sm">NASA ARES-V DEEP SPACE VESSEL</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                SOL-184 TRANSIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              AUTONOMOUS RECOVERY &amp; EQUILIBRIUM SYSTEM · MANDATORY BIOMETRIC TERMINAL GATEWAY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-cyan-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>DEEP SPACE NETWORK LINK: GOLDSTONE 70-METER LOCKED</span>
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>ZERO-TRUST ROLE-BASED ACCESS CONTROL ENFORCED</span>
          </span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Columns: Crew & Ground Personnel Roster */}
          <div className="lg:col-span-7 bg-[#070e1e]/75 backdrop-blur-md border border-cyan-900/60 rounded-2xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.75)] flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <span>SELECT AUTHORIZED OPERATOR PROFILE</span>
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Every operator must authenticate before accessing role-restricted ship consoles.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                  6 ACTIVE CREDENTIALS
                </span>
              </div>

              {/* 6 Crew & Station Profile Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {astronauts.map((astro) => {
                  const isSelected = selectedProfile.id === astro.id;
                  const badge = getRoleBadge(astro);
                  const adi = calculateAdi(astro.vitals);
                  const adiLvl = calculateAdiLevel(astro.vitals);
                  const isYellowAdi = adiLvl === 'warning';

                  return (
                    <div
                      key={astro.id}
                      onClick={() => handleSelectOperator(astro)}
                      className={`group rounded-xl p-3 border transition-all cursor-pointer flex items-center gap-3.5 relative ${
                        isSelected
                          ? 'bg-cyan-950/55 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.22)]'
                          : 'bg-[#0a1326]/75 border-slate-800/90 hover:border-cyan-700/60 hover:bg-[#0d1830]/85'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={astro.avatarUrl}
                          alt={astro.name}
                          referrerPolicy="no-referrer"
                          className={`w-16 h-16 rounded-xl object-cover ${
                            astro.role === 'GROUND_STATION' ? 'object-center' : 'object-top'
                          } border-2 ${
                            isSelected ? 'border-cyan-400' : 'border-slate-700 group-hover:border-cyan-500/60'
                          }`}
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#070e1e] ${
                            isYellowAdi ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-emerald-400'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] text-cyan-400 font-bold tracking-wider">
                            {astro.callsign}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              isYellowAdi
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                            }`}
                          >
                            Acute Distress Index: {adi.toFixed(2)} {isYellowAdi ? 'YELLOW' : 'OPTIMAL'}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-white truncate mt-0.5">
                          {astro.name}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Access Partition Matrix Summary */}
            <div className="mt-4 pt-3 border-t border-slate-800/90 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-cyan-300 font-bold">POD INTERFACE</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Astronauts, Crew Medical Officer &amp; Flight Commander only.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-emerald-300 font-bold">CREW MEDICAL OFFICER CONSOLE</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Crew Medical Officer (Dr. Stone) &amp; Flight Commander only.
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-blue-300 font-bold">GROUND CONSOLE</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Houston Ground Station exclusively. Isolated from ship pods.
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Biometric Retinal & PIN Verification Terminal */}
          <div className="lg:col-span-5 bg-[#070e1e]/80 backdrop-blur-md border border-cyan-800/70 rounded-2xl p-5 shadow-[0_0_45px_rgba(6,182,212,0.14)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 font-bold">
                  <ScanFace className="w-4 h-4 text-cyan-400" />
                  <span>BIOMETRIC RETINAL &amp; PIN VERIFICATION</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                  TERMINAL READY
                </span>
              </div>

              {/* Selected Operator Portrait & Retinal Target Frame with Cinematic Earth from Space Background */}
              <div className="bg-[#040914] border border-cyan-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.2)]">
                <CinematicEarthHeaderBg variant="compact" />
                <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0">
                  <img
                    src={selectedProfile.avatarUrl}
                    alt={selectedProfile.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      selectedProfile.role === 'GROUND_STATION' ? 'object-center' : 'object-top'
                    }`}
                  />
                  {/* Sci-Fi Retinal Target Reticle Overlay */}
                  <div className="pointer-events-none absolute inset-0 border border-cyan-300/30 bg-gradient-to-t from-cyan-950/50 via-transparent to-transparent" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-full h-1 bg-cyan-300 shadow-[0_0_12px_#22d3ee] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex-1 text-center sm:text-left font-mono">
                  <div className="text-[11px] text-cyan-300 font-bold tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    {selectedProfile.callsign} // {selectedProfile.assignedPod}
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    {selectedProfile.name}
                  </h2>
                  <p className="text-xs text-slate-200 mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    {selectedProfile.specialty}
                  </p>
                  <div className="mt-2 inline-block px-2.5 py-1 rounded bg-slate-950/85 border border-cyan-700/70 text-[10px] text-cyan-200 font-bold">
                    {getAccessScopeLabel(selectedProfile)}
                  </div>
                </div>
              </div>

              {/* Biometric Hash & Security PIN Input */}
              <div className="mt-4 space-y-3 font-mono">
                <div className="bg-[#050b17] border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>BIOMETRIC EIGEN-VECTOR SIGNATURE</span>
                    <span className="text-emerald-400 font-bold">99.8% MATCH</span>
                  </div>
                  <div className="text-xs text-cyan-300 truncate">
                    [{selectedProfile.faceHashVector.map(v => v.toFixed(2)).join(' · ')}]
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SECURITY ACCESS PIN</span>
                    </span>
                    <span className="text-[11px] text-cyan-400">Default PIN: Ares@2026</span>
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter Security PIN (Ares@2026)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040812] border border-cyan-800/80 text-white text-sm font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {isScanning && (
                  <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/60 text-cyan-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span>VERIFYING BIOMETRIC TELEMETRY...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-150"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Authenticate & Enter Action Button */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleBiometricLogin()}
                disabled={isScanning}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-600 hover:from-cyan-500 hover:to-sky-400 text-slate-950 font-black font-mono text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2.5 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  AUTHENTICATE &amp; ENTER {selectedProfile.role === 'GROUND_STATION' ? 'GROUND STATION' : selectedProfile.role === 'CMO' ? 'CREW MEDICAL OFFICER CONSOLE' : 'POD INTERFACE'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="relative z-10 border-t border-slate-900 bg-[#040812]/90 px-6 py-2.5 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>NASA HUMAN RESEARCH PROGRAM · ARES-V AUTONOMOUS MEDICAL &amp; HABITAT OPERATING SYSTEM</span>
        <span>DUAL-KEY ANTI-PSYCHOTIC INTERLOCK: CAP99 (FLIGHT COMMANDER) + CMO00 (CREW MEDICAL OFFICER)</span>
      </footer>
    </div>
  );
};
