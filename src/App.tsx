import React, { useState, useEffect } from 'react';
import { PodInterface } from './components/PodInterface';
import { CmoInterface } from './components/CmoInterface';
import { GroundStationInterface } from './components/GroundStationInterface';
import { LoginScreen } from './components/LoginScreen';
import { StarfieldBackground } from './components/StarfieldBackground';
import {
  AstronautProfile,
  PfaProtocolKey,
  GroundCallRecord,
  OverrideLogEntry,
  CmoEmergencyAlarm,
  MissionChecklistTask,
  CmoTaskHoldNotification
} from './types/ares';
import {
  INITIAL_ASTRONAUTS,
  PFA_PROTOCOLS,
  INITIAL_GROUND_CALLS,
  INITIAL_OVERRIDE_LOGS,
  INITIAL_MISSION_CHECKLIST_TASKS,
  INITIAL_CMO_TASK_HOLD_NOTIFICATIONS
} from './data/mockAresData';
import { soundEngine } from './services/audioService';
import { LogOut, Shield, Activity, BellRing, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Everyone has to log in first! Initial state is null.
  const [currentUser, setCurrentUser] = useState<AstronautProfile | null>(null);
  
  const [astronauts, setAstronauts] = useState<AstronautProfile[]>(INITIAL_ASTRONAUTS);
  const [activeView, setActiveView] = useState<'POD' | 'CMO' | 'GROUND'>('POD');
  
  // Ground calls and clinical stewardship audit logs
  const [groundCalls, setGroundCalls] = useState<GroundCallRecord[]>(INITIAL_GROUND_CALLS);
  const [overrideLogs, setOverrideLogs] = useState<OverrideLogEntry[]>(INITIAL_OVERRIDE_LOGS);

  // Mission Checklist tasks & Crew Medical Officer ADI task hold notifications
  const [missionTasks, setMissionTasks] = useState<MissionChecklistTask[]>(INITIAL_MISSION_CHECKLIST_TASKS);
  const [cmoTaskHoldNotifications, setCmoTaskHoldNotifications] = useState<CmoTaskHoldNotification[]>(
    INITIAL_CMO_TASK_HOLD_NOTIFICATIONS
  );

  // Active Astronaut -> CMO Emergency Call Alarm System
  const [activeCmoAlarm, setActiveCmoAlarm] = useState<CmoEmergencyAlarm | null>(null);
  const [isAlarmSirenMuted, setIsAlarmSirenMuted] = useState<boolean>(false);

  // System notification
  const [systemNotification, setSystemNotification] = useState<string>(
    'NASA Autonomous Recovery & Equilibrium System Operating System v2.6 Ready.'
  );

  // Mission Elapsed Time clock
  const [metSeconds, setMetSeconds] = useState<number>(412 * 86400 + 14 * 3600 + 22 * 60 + 10);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMetTime = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${days} Days ${hours.toString().padStart(2, '0')} Hours ${mins.toString().padStart(2, '0')} Minutes`;
  };

  // Handle successful login from LoginScreen
  const handleLoginSuccess = (authenticatedUser: AstronautProfile) => {
    setCurrentUser(authenticatedUser);

    // Strict Role-Based View Routing
    if (authenticatedUser.role === 'GROUND_STATION') {
      setActiveView('GROUND');
    } else if (authenticatedUser.role === 'CMO') {
      setActiveView('CMO');
    } else {
      // Astronaut or Flight Commander defaults to Pod Interface (Flight Commander can switch to Crew Medical Officer Console in header)
      setActiveView('POD');
    }

    const roleLabel = authenticatedUser.role === 'CMO' ? 'CREW MEDICAL OFFICER' : authenticatedUser.role;
    setSystemNotification(`Session established for ${authenticatedUser.name} (${roleLabel}).`);
  };

  // Logout handler
  const handleLogout = () => {
    soundEngine.playTone(400, 0.15);
    setCurrentUser(null);
    setActiveView('POD');
  };

  // Update astronaut
  const handleUpdateAstronaut = (updated: AstronautProfile) => {
    setAstronauts(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  // Toggle Mission Checklist Task Completion (when astronaut meets ADI criteria)
  const handleToggleTaskComplete = (taskId: string, astronautId: AstronautProfile['id']) => {
    setMissionTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const alreadyDone = task.completedByIds.includes(astronautId);
        return {
          ...task,
          completedByIds: alreadyDone
            ? task.completedByIds.filter(id => id !== astronautId)
            : [...task.completedByIds, astronautId]
        };
      })
    );
  };

  // Notify Crew Medical Officer Console when an astronaut does NOT meet ADI criteria for a Mission Checklist task
  const handleNotifyCmoTaskHold = (notification: CmoTaskHoldNotification) => {
    setCmoTaskHoldNotifications(prev => [notification, ...prev]);
    setSystemNotification(
      `CREW MEDICAL OFFICER TASK HOLD ALERT: ${notification.astronautName} blocked from "${notification.taskTitle}" (Acute Distress Index ${notification.currentAdi.toFixed(2)} exceeds ≤ ${notification.requiredMaxAdi.toFixed(2)}).`
    );
  };

  // Acknowledge a Mission Checklist ADI task hold notification on the Crew Medical Officer Console
  const handleAcknowledgeTaskHold = (notificationId: string) => {
    soundEngine.playBiometricScanPing();
    setCmoTaskHoldNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, status: 'CMO_REVIEWED' } : n))
    );
  };

  // Urgent Crew Medical Officer Call & Alarm System from Pod
  const handleAlertCmo = (reason: string) => {
    const caller = currentUser || astronauts[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Start audible medical emergency alarm siren
    setIsAlarmSirenMuted(false);
    soundEngine.startCmoEmergencyAlarm();

    const newAlarm: CmoEmergencyAlarm = {
      id: `ALARM-CMO-${Date.now().toString().slice(-4)}`,
      callerId: caller.id,
      callerName: caller.name,
      callerCallsign: caller.callsign,
      assignedPod: caller.assignedPod,
      reason,
      timestamp: nowTime,
      heartRate: caller.vitals.heartRate,
      hrv: caller.vitals.hrv,
      spo2: caller.vitals.spo2,
      active: true
    };
    setActiveCmoAlarm(newAlarm);

    setSystemNotification(`PRIORITY EMERGENCY ALARM: ${caller.name} called Crew Medical Officer: "${reason}"`);

    // Create emergency ground call record as well
    const emergencyCall: GroundCallRecord = {
      id: `CALL-${Date.now().toString().slice(-4)}`,
      patientId: caller.id,
      patientName: caller.name,
      cmoName: 'Dr. Evelyn Stone (Crew Medical Officer)',
      reason: `EMERGENCY CALL TO CREW MEDICAL OFFICER: ${reason}`,
      priority: 'CRITICAL',
      status: 'PENDING_GROUND_RESPONSE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setGroundCalls(prev => [emergencyCall, ...prev]);
  };

  // Toggle audible siren mute while keeping visual alarm active
  const handleToggleAlarmSirenMute = () => {
    if (isAlarmSirenMuted) {
      setIsAlarmSirenMuted(false);
      soundEngine.startCmoEmergencyAlarm();
    } else {
      setIsAlarmSirenMuted(true);
      soundEngine.stopCmoEmergencyAlarm();
    }
  };

  // Acknowledge and silence Crew Medical Officer Emergency Call Alarm
  const handleAcknowledgeCmoAlarm = (acknowledgedByName?: string) => {
    soundEngine.stopCmoEmergencyAlarm();
    soundEngine.playAuthGrantedChime();
    setIsAlarmSirenMuted(false);
    setActiveCmoAlarm(prev =>
      prev
        ? {
            ...prev,
            active: false,
            acknowledgedBy: acknowledgedByName || currentUser?.name || 'Dr. Evelyn Stone (Crew Medical Officer)',
            acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        : null
    );
  };

  // Add authorization audit log entry
  const handleAddOverrideLog = (entry: OverrideLogEntry) => {
    setOverrideLogs(prev => [entry, ...prev]);
    setSystemNotification(`AUDIT LOG: ${entry.category} - ${entry.status}.`);
  };

  // Create call to Ground Support from Crew Medical Officer
  const handleCreateGroundCall = (
    patientId: string, 
    patientName: string, 
    reason: string, 
    priority: 'ROUTINE' | 'URGENT' | 'CRITICAL'
  ) => {
    const newCall: GroundCallRecord = {
      id: `CALL-${Date.now().toString().slice(-4)}`,
      patientId: (patientId || 'vance') as any,
      patientName,
      cmoName: 'Dr. Evelyn Stone (Crew Medical Officer)',
      reason,
      priority,
      status: 'PENDING_GROUND_RESPONSE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setGroundCalls(prev => [newCall, ...prev]);
    setSystemNotification(`Consult request transmitted to Houston Ground Station for ${patientName}.`);
  };

  // Update Ground Call from Houston Station
  const handleUpdateGroundCall = (callId: string, status: string, groundResponse: string) => {
    setGroundCalls(prev => prev.map(c => {
      if (c.id === callId) {
        return {
          ...c,
          status: status as any,
          groundResponse,
          groundRespondedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          flightSurgeonName: 'Dr. Sarah Jenkins (NASA Johnson Space Center Flight Surgeon)'
        };
      }
      return c;
    }));
    setSystemNotification(`Houston Flight Surgeon updated Call ${callId} status to ${status}.`);
  };

  // Psychological First Aid dispatch from Crew Medical Officer
  const handleTriggerPfa = (targetAstronautId: string, protocolKey: PfaProtocolKey) => {
    const target = astronauts.find(a => a.id === targetAstronautId);
    const proto = PFA_PROTOCOLS.find(p => p.key === protocolKey);
    if (!target || !proto) return;

    setSystemNotification(`CREW MEDICAL OFFICER DISPATCH: Engaged ${proto.title} in ${target.assignedPod}`);
    soundEngine.playPfaAudio(proto.audioPath);
  };

  // 1. IF NOT LOGGED IN: Render Fullscreen Login Screen First
  if (!currentUser) {
    return (
      <>
        <StarfieldBackground />
        <LoginScreen
          astronauts={astronauts}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // 2. AUTHENTICATED EXPERIENCE
  // Role checks:
  const isGroundStation = currentUser.role === 'GROUND_STATION';
  const isCmo = currentUser.role === 'CMO';
  const isCommander = currentUser.role === 'FLIGHT_COMMANDER';
  const canAccessCmoConsole = isCmo || isCommander;
  const isAstronaut = currentUser.role === 'ASTRONAUT' || isCommander;

  const groundProfile = astronauts.find(a => a.role === 'GROUND_STATION') || astronauts[5];
  const unacknowledgedTaskHoldsCount = cmoTaskHoldNotifications.filter(n => n.status === 'ACTIVE_HOLD').length;

  const getRoleDisplayLabel = (role: AstronautProfile['role']) => {
    if (role === 'CMO') return 'CREW MEDICAL OFFICER';
    if (role === 'FLIGHT_COMMANDER') return 'FLIGHT COMMANDER';
    if (role === 'GROUND_STATION') return 'HOUSTON GROUND STATION';
    return 'ASTRONAUT';
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent relative z-10 selection:bg-cyan-500/30 selection:text-cyan-200">
      <StarfieldBackground />
      
      {/* Sci-Fi Role-Restricted In-Console Header */}
      <header className="px-4 py-2.5 bg-[#050a16]/85 border-b border-cyan-950/80 text-xs font-mono flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.65)]">
        
        {/* Left: Mission Brand & Active Operator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* NASA Vector SVG */}
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" fill="#0B3D91" stroke="#38BDF8" strokeWidth="2.5" />
              <path d="M12 55 L50 25 L88 55 L75 58 L50 40 L25 58 Z" fill="#FC3D21" />
              <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(-30 50 50)" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
              <text x="50" y="58" textAnchor="middle" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="16">NASA</text>
            </svg>
            <span className="font-bold text-white tracking-wider text-sm">ARES-V OPERATING SYSTEM</span>
          </div>

          <span className="text-slate-700">|</span>

          {/* Operator Identity Badge */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className={`w-6 h-6 rounded-full object-cover ${currentUser.role === 'GROUND_STATION' ? 'object-center' : 'object-top'} border border-cyan-500/60`}
            />
            <span className="font-bold text-slate-100">{currentUser.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-wider">
              {getRoleDisplayLabel(currentUser.role)}
            </span>
          </div>
        </div>

        {/* Center / Right: Role View Selector & Prominent Logout */}
        <div className="flex items-center gap-3">
          
          {/* Crew Medical Officer AND Flight Commander can toggle between Crew Medical Officer Console and Pod Interface */}
          {canAccessCmoConsole && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/95 border border-slate-700/80">
              <button
                onClick={() => setActiveView('CMO')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'CMO'
                    ? 'bg-rose-950 text-rose-200 border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Crew Medical Officer Console</span>
                {unacknowledgedTaskHoldsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                    {unacknowledgedTaskHoldsCount}
                  </span>
                )}
                {activeCmoAlarm?.active && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setActiveView('POD')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'POD'
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Pod Interface</span>
              </button>
            </div>
          )}

          {/* Regular Astronauts only access Pod Interface */}
          {(currentUser.role === 'ASTRONAUT') && (
            <div className="text-[11px] font-bold text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>HABITAT POD INTERFACE ACTIVE</span>
            </div>
          )}

          {/* Ground Station can only access Ground Station */}
          {isGroundStation && (
            <div className="text-[11px] font-bold text-blue-300 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/80">
              HOUSTON GROUND STATION CONSOLE
            </div>
          )}

          {/* Mission Elapsed Time Clock */}
          <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Mission Elapsed Time: <strong className="text-cyan-300">{formatMetTime(metSeconds)}</strong>
          </div>

          {/* Bigger, Easy-to-Find Logout / Lock Session Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm border border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.45)] flex items-center gap-2 transition-all cursor-pointer tracking-wider"
            title="Lock terminal and sign out"
          >
            <LogOut className="w-4 h-4" />
            <span>LOG OUT</span>
          </button>
        </div>

      </header>

      {/* SHIP-WIDE ASTRONAUT -> CREW MEDICAL OFFICER EMERGENCY CALL ALARM SYSTEM BANNER */}
      {activeCmoAlarm && activeCmoAlarm.active && (
        <div
          id="cmoEmergencyAlarmBanner"
          className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b-2 border-red-500 px-4 py-3 shadow-[0_0_35px_rgba(239,68,68,0.65)] z-30"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-600 border border-red-300 flex items-center justify-center shrink-0 animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.9)]">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-widest uppercase animate-pulse">
                    CREW MEDICAL OFFICER EMERGENCY CALL ALARM ACTIVE
                  </span>
                  <span className="text-rose-200 font-bold">
                    #{activeCmoAlarm.id} · {activeCmoAlarm.timestamp}
                  </span>
                  <span className="text-amber-300 font-bold">
                    [Heart Rate: {activeCmoAlarm.heartRate} Beats Per Minute | Heart Rate Variability: {activeCmoAlarm.hrv} Milliseconds | Blood Oxygen Saturation: {activeCmoAlarm.spo2}%]
                  </span>
                </div>
                <div className="text-white font-bold text-sm mt-0.5">
                  CALLER: {activeCmoAlarm.callerName.toUpperCase()} ({activeCmoAlarm.callerCallsign}) — {activeCmoAlarm.assignedPod}
                </div>
                <div className="text-rose-100 text-xs">
                  EMERGENCY REASON: &ldquo;{activeCmoAlarm.reason}&rdquo; — Paging Crew Medical Officer Dr. Evelyn Stone
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleAlarmSirenMute}
                className="px-3 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 border border-rose-400/70 text-rose-200 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isAlarmSirenMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />}
                <span>{isAlarmSirenMuted ? 'UNMUTE SIREN' : 'MUTE SIREN'}</span>
              </button>

              {canAccessCmoConsole && activeView !== 'CMO' && (
                <button
                  type="button"
                  onClick={() => setActiveView('CMO')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer"
                >
                  OPEN CREW MEDICAL OFFICER CONSOLE
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAcknowledgeCmoAlarm(currentUser.name)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACKNOWLEDGE &amp; SILENCE ALARM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Role-Authorized Body */}
      <main className="flex-1 p-3 sm:p-5 relative z-10">
        
        {/* Case 1: Ground Station (ONLY Ground Station Console) */}
        {isGroundStation && (
          <GroundStationInterface
            groundCalls={groundCalls}
            onUpdateGroundCall={handleUpdateGroundCall}
            astronauts={astronauts}
            groundProfile={groundProfile}
          />
        )}

        {/* Case 2: Crew Medical Officer OR Flight Commander viewing Crew Medical Officer Console */}
        {canAccessCmoConsole && activeView === 'CMO' && (
          <CmoInterface
            astronauts={astronauts}
            cmoAstronaut={currentUser}
            onTriggerPfa={handleTriggerPfa}
            groundCalls={groundCalls}
            onCreateGroundCall={handleCreateGroundCall}
            overrideLogs={overrideLogs}
            onAddOverrideLog={handleAddOverrideLog}
            activeCmoAlarm={activeCmoAlarm}
            onAcknowledgeCmoAlarm={handleAcknowledgeCmoAlarm}
            cmoTaskHoldNotifications={cmoTaskHoldNotifications}
            onAcknowledgeTaskHold={handleAcknowledgeTaskHold}
          />
        )}

        {/* Case 3: Pod Interface (For Astronaut, Flight Commander, or Crew Medical Officer in Pod view) */}
        {((isAstronaut && activeView === 'POD') || (isCmo && activeView === 'POD')) && (
          <PodInterface
            astronaut={currentUser}
            astronauts={astronauts}
            onUpdateAstronaut={handleUpdateAstronaut}
            onAlertCmo={handleAlertCmo}
            isAiVoiceEnabled={true}
            missionTime={formatMetTime(metSeconds)}
            onAddOverrideLog={handleAddOverrideLog}
            overrideLogs={overrideLogs}
            activeCmoAlarm={activeCmoAlarm}
            onAcknowledgeCmoAlarm={handleAcknowledgeCmoAlarm}
            missionTasks={missionTasks}
            onToggleTaskComplete={handleToggleTaskComplete}
            cmoTaskHoldNotifications={cmoTaskHoldNotifications}
            onNotifyCmoTaskHold={handleNotifyCmoTaskHold}
          />
        )}

      </main>

    </div>
  );
}
