import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Award,
  Compass,
  ScanLine,
  UserCheck
} from 'lucide-react';
import {
  AstronautProfile,
  MissionChecklistTask,
  CmoTaskHoldNotification,
  BodySystemAssessment
} from '../types/ares';
import { NASA_BODY_SYSTEM_REGIONS } from '../data/mockAresData';
import {
  calculateAdi,
  calculateAdiLevel,
  evaluateMissionTaskAdiEligibility
} from '../utils/pfaLogic';
import { soundEngine } from '../services/audioService';

interface MissionChecklistAndHealthSectionProps {
  astronaut: AstronautProfile;
  onUpdateAstronaut: (updated: AstronautProfile) => void;
  tasks: MissionChecklistTask[];
  onToggleTaskComplete: (taskId: string, astronautId: AstronautProfile['id']) => void;
  cmoTaskHoldNotifications: CmoTaskHoldNotification[];
  onNotifyCmoTaskHold: (notification: CmoTaskHoldNotification) => void;
}

type MissionEnvironmentType =
  | 'Deep-Space Transit Spacecraft (ARES-V)'
  | 'Cislunar Orbital Space Station (Gateway)'
  | 'Pressurized Planetary Surface Rover'
  | 'Martian Surface Habitat Base';

interface AstronautAnatomySpec {
  heightCm: number;
  massKg: number;
  bodyBuild: string;
  bloodType: string;
  vo2Max: string;
  isFemaleSilhouette: boolean;
  scaleX: number;
  scaleY: number;
  accentHex: string;
}

function getAstronautAnatomySpec(astronaut: AstronautProfile): AstronautAnatomySpec {
  switch (astronaut.id) {
    case 'vance':
      return {
        heightCm: 168,
        massKg: 61.4,
        bodyBuild: 'Female Athletic Ectomorph-Mesomorph',
        bloodType: 'O Positive',
        vo2Max: '49.2 mL/kg/min',
        isFemaleSilhouette: true,
        scaleX: 0.95,
        scaleY: 0.97,
        accentHex: '#22d3ee'
      };
    case 'stone':
      return {
        heightCm: 165,
        massKg: 58.2,
        bodyBuild: 'Female Clinical Mesomorph',
        bloodType: 'AB Positive',
        vo2Max: '48.5 mL/kg/min',
        isFemaleSilhouette: true,
        scaleX: 0.94,
        scaleY: 0.95,
        accentHex: '#34d399'
      };
    case 'rossi':
      return {
        heightCm: 182,
        massKg: 79.8,
        bodyBuild: 'Male Broad-Shoulder Mesomorph',
        bloodType: 'A Positive',
        vo2Max: '53.6 mL/kg/min',
        isFemaleSilhouette: false,
        scaleX: 1.03,
        scaleY: 1.01,
        accentHex: '#38bdf8'
      };
    case 'tanaka':
      return {
        heightCm: 175,
        massKg: 69.5,
        bodyBuild: 'Male Lean Ectomorph',
        bloodType: 'B Positive',
        vo2Max: '51.0 mL/kg/min',
        isFemaleSilhouette: false,
        scaleX: 0.96,
        scaleY: 0.99,
        accentHex: '#a78bfa'
      };
    case 'captain':
    default:
      return {
        heightCm: 186,
        massKg: 84.5,
        bodyBuild: 'Male Command Heavy-Frame Mesomorph',
        bloodType: 'O Negative',
        vo2Max: '52.1 mL/kg/min',
        isFemaleSilhouette: false,
        scaleX: 1.06,
        scaleY: 1.03,
        accentHex: '#38bdf8'
      };
  }
}

export const MissionChecklistAndHealthSection: React.FC<MissionChecklistAndHealthSectionProps> = ({
  astronaut,
  tasks,
  onToggleTaskComplete,
  cmoTaskHoldNotifications,
  onNotifyCmoTaskHold
}) => {
  // Interactive Body Region Selection
  const [selectedBodyId, setSelectedBodyId] = useState<BodySystemAssessment['id']>('brain');

  // Environment Context Selector (from NASA Manual: Spacecraft, Space Station, Rover, Planetary Base)
  const [selectedEnvironment, setSelectedEnvironment] = useState<MissionEnvironmentType>(
    'Deep-Space Transit Spacecraft (ARES-V)'
  );

  // Category filter for Mission Checklist
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Feedback banner when an astronaut attempts a task
  const [checklistBanner, setChecklistBanner] = useState<{
    type: 'blocked_notified' | 'completed';
    title: string;
    detail: string;
  } | null>(null);

  const currentAdi = calculateAdi(astronaut.vitals);
  const currentAdiLevel = calculateAdiLevel(astronaut.vitals);
  const anatomySpec = getAstronautAnatomySpec(astronaut);

  const selectedBodyRegion =
    NASA_BODY_SYSTEM_REGIONS.find((b) => b.id === selectedBodyId) || NASA_BODY_SYSTEM_REGIONS[0];

  // Gamification score calculation: points from completed checklist tasks + self-assessment streak
  const completedTasksForAstronaut = tasks.filter((t) => t.completedByIds.includes(astronaut.id));
  const totalGamificationPoints =
    320 + completedTasksForAstronaut.reduce((sum, t) => sum + t.healthEngagementPoints, 0);

  const filteredTasks =
    selectedCategory === 'ALL'
      ? tasks
      : tasks.filter((t) => t.category === selectedCategory);

  // Handle when an astronaut clicks a mission checklist task
  const handleAttemptTask = (task: MissionChecklistTask) => {
    const eligibility = evaluateMissionTaskAdiEligibility(astronaut.vitals, task.maxAllowedAdi);

    if (!eligibility.eligible) {
      // Astronaut does NOT meet the Acute Distress Index criteria!
      // Block task execution and notify the Crew Medical Officer Console immediately.
      soundEngine.playAlarmPulse();

      const holdNotification: CmoTaskHoldNotification = {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        astronautId: astronaut.id,
        astronautName: astronaut.name,
        astronautCallsign: astronaut.callsign,
        assignedPod: astronaut.assignedPod,
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category,
        currentAdi: eligibility.currentAdi,
        requiredMaxAdi: task.maxAllowedAdi,
        timestamp: `Sol-${astronaut.missionDay} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Mission Elapsed Time`,
        status: 'ACTIVE_HOLD',
        reason: `Acute Distress Index Criteria Not Met: ${astronaut.name} (${astronaut.callsign}) attempted "${task.title}" with an Acute Distress Index of ${eligibility.currentAdi.toFixed(2)}, which exceeds the maximum safe limit of ≤ ${task.maxAllowedAdi.toFixed(2)}.`,
        cmoGuidance: 'Task automatically locked for astronaut safety. Crew Medical Officer notified to review telemetry and guide restorative countermeasures.'
      };

      onNotifyCmoTaskHold(holdNotification);

      setChecklistBanner({
        type: 'blocked_notified',
        title: `TASK RESTRICTED FOR ${astronaut.name.toUpperCase()} — CREW MEDICAL OFFICER CONSOLE NOTIFIED`,
        detail: `You cannot perform "${task.title}" because your current Acute Distress Index (${eligibility.currentAdi.toFixed(2)}) does not meet the required safety criterion (≤ ${task.maxAllowedAdi.toFixed(2)}). An automated safety notification (#${holdNotification.id}) has been transmitted to Crew Medical Officer Dr. Evelyn Stone.`
      });
      return;
    }

    // Astronaut meets the Acute Distress Index criteria
    soundEngine.playAuthGrantedChime();
    const alreadyCompleted = task.completedByIds.includes(astronaut.id);
    onToggleTaskComplete(task.id, astronaut.id);

    setChecklistBanner({
      type: 'completed',
      title: alreadyCompleted
        ? `TASK RE-OPENED: ${task.title.toUpperCase()}`
        : `TASK COMPLETED (+${task.healthEngagementPoints} HEALTH READINESS POINTS): ${task.title.toUpperCase()}`,
      detail: `Acute Distress Index (${eligibility.currentAdi.toFixed(2)}) verified within safe threshold (≤ ${task.maxAllowedAdi.toFixed(2)}). Telemetry logged to mission archive.`
    });
  };

  const environmentInsights: Record<MissionEnvironmentType, { gravity: string; radiation: string; medicalNote: string }> = {
    'Deep-Space Transit Spacecraft (ARES-V)': {
      gravity: '0.00g Microgravity Transit Core Module',
      radiation: '1.8 Millisieverts/day Galactic Cosmic Ray Flux',
      medicalNote: '18-minute communication delay requires autonomous crew self-assessment and automated Acute Distress Index task gating.'
    },
    'Cislunar Orbital Space Station (Gateway)': {
      gravity: '0.00g Microgravity (High Lunar Orbit)',
      radiation: '1.4 Millisieverts/day Deep-Space Magnetotail Flux',
      medicalNote: 'Elevated solar particle exposure outside Earth magnetosphere; prioritize daily resistive bone loading and dosimetry.'
    },
    'Pressurized Planetary Surface Rover': {
      gravity: '0.38g Martian Surface Gravity / Vibration Load',
      radiation: '0.7 Millisieverts/day Surface Albedo & Cosmic Rays',
      medicalNote: 'Confined cabin volume during multi-sol surface traverses increases isolation strain; monitor Heart Rate Variability and hydration.'
    },
    'Martian Surface Habitat Base': {
      gravity: '0.38g Partial Gravity Field',
      radiation: '0.4 Millisieverts/day (Regolith-Shielded Dome)',
      medicalNote: 'Perchlorate dust filtration and 24-hour 39-minute Martian Sol light cycle require strict circadian phototherapy alignment.'
    }
  };

  // Personalized outer body silhouette path (Female vs Male realistic anatomical proportions)
  const outerBodyPath = anatomySpec.isFemaleSilhouette
    ? // Realistic Female Astronaut Anatomical Silhouette (Shoulders, Tapered Waist, Iliac Hip Curve, Arms/Hands, Thighs, Calves, Feet)
      'M 160 72 C 169 72, 172 79, 174 85 C 188 88, 204 94, 210 106 C 216 118, 224 146, 232 178 C 236 194, 241 212, 244 224 C 246 230, 240 234, 235 230 C 229 224, 223 202, 217 180 C 211 158, 204 134, 198 122 C 194 142, 189 162, 191 178 C 194 196, 202 214, 200 236 C 198 262, 192 296, 189 328 C 187 354, 188 382, 186 408 L 194 422 L 173 424 L 170 406 C 169 380, 166 352, 166 326 C 166 296, 164 268, 160 250 C 156 268, 154 296, 154 326 C 154 352, 151 380, 150 406 L 147 424 L 126 422 L 134 408 C 132 382, 133 354, 131 328 C 128 296, 122 262, 120 236 C 118 214, 126 196, 129 178 C 131 162, 126 142, 122 122 C 116 134, 109 158, 103 180 C 97 202, 91 224, 85 230 C 80 234, 74 230, 76 224 C 79 212, 84 194, 88 178 C 96 146, 104 118, 110 106 C 116 94, 132 88, 146 85 C 148 79, 151 72, 160 72 Z'
    : // Realistic Male Astronaut Anatomical Silhouette (Broad Deltoid Shoulders, V-Taper Torso, Muscular Arms/Forearms, Quadriceps, Calves, Feet)
      'M 160 72 C 171 72, 175 79, 178 85 C 196 88, 214 95, 220 108 C 227 122, 234 150, 241 182 C 245 198, 249 214, 252 226 C 254 232, 247 236, 241 231 C 235 225, 229 204, 223 182 C 217 160, 211 136, 205 124 C 202 146, 198 168, 197 186 C 197 204, 201 220, 199 242 C 197 268, 193 300, 191 330 C 189 356, 190 384, 188 408 L 197 422 L 173 424 L 170 406 C 169 380, 167 352, 167 326 C 166 296, 165 268, 160 252 C 155 268, 154 296, 153 326 C 153 352, 151 380, 150 406 L 147 424 L 123 422 L 132 408 C 130 384, 131 356, 129 330 C 127 300, 123 268, 121 242 C 119 220, 123 204, 123 186 C 122 168, 118 146, 115 124 C 109 136, 103 160, 97 182 C 91 204, 85 225, 79 231 C 73 236, 66 232, 68 226 C 71 214, 75 198, 79 182 C 86 150, 93 122, 100 108 C 106 95, 124 88, 142 85 C 145 79, 149 72, 160 72 Z';

  return (
    <div id="pod-mission-checklist-health" className="space-y-6">
      {/* ================= TOP SUMMARY RIBBON: GAMIFICATION & ENVIRONMENT SELECTOR ================= */}
      <div className="p-4 rounded-xl bg-[#070d1c] border border-cyan-500/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              NASA HUMAN RESEARCH PROGRAM · MISSION CHECKLIST &amp; ANATOMICAL HEALTH EVALUATION
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl">
            Evaluate your readiness across the five spaceflight hazards (Space Radiation, Isolation &amp; Confinement, Distance from Earth, Gravity Fields, and Hostile Closed Environments). Tasks requiring lower Acute Distress Index thresholds automatically lock and notify the Crew Medical Officer Console if criteria are not met.
          </p>
        </div>

        {/* Gamification Health Streak & Environment Context */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block">Health Engagement Score</span>
              <strong className="text-sm text-white tabular-nums">{totalGamificationPoints} Points · 14-Sol Streak</strong>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700">
            <label className="text-[10px] text-cyan-300 uppercase block mb-0.5">
              Mission Environment Context:
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value as MissionEnvironmentType)}
              className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              aria-label="Mission Environment Context"
            >
              <option value="Deep-Space Transit Spacecraft (ARES-V)" className="bg-slate-950">
                Deep-Space Transit Spacecraft (ARES-V)
              </option>
              <option value="Cislunar Orbital Space Station (Gateway)" className="bg-slate-950">
                Cislunar Orbital Space Station (Gateway)
              </option>
              <option value="Pressurized Planetary Surface Rover" className="bg-slate-950">
                Pressurized Planetary Surface Rover
              </option>
              <option value="Martian Surface Habitat Base" className="bg-slate-950">
                Martian Surface Habitat Base
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Environment Context Insight Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg bg-[#091122] border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Active Environment Gravity Field</span>
          <strong className="text-cyan-300">{environmentInsights[selectedEnvironment].gravity}</strong>
        </div>
        <div className="p-3 rounded-lg bg-[#091122] border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Ambient Radiation Exposure</span>
          <strong className="text-amber-300">{environmentInsights[selectedEnvironment].radiation}</strong>
        </div>
        <div className="p-3 rounded-lg bg-[#091122] border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Environment Clinical Guidance</span>
          <span className="text-slate-200 text-[11px]">{environmentInsights[selectedEnvironment].medicalNote}</span>
        </div>
      </div>

      {/* ================= SECTION 1: ASTRONAUT MISSION CHECKLIST & ACUTE DISTRESS INDEX TASK CLEARANCE ================= */}
      <div className="graph-card border-cyan-500/40 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="graph-title text-cyan-300">
              <span>ASTRONAUT MISSION CHECKLIST &amp; ACUTE DISTRESS INDEX CLEARANCE GATE</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Active Operator: <strong className="text-white">{astronaut.name} ({astronaut.callsign})</strong> · Current Acute Distress Index:{' '}
              <strong className={currentAdiLevel === 'critical' ? 'text-rose-400' : currentAdiLevel === 'warning' ? 'text-amber-300' : 'text-emerald-400'}>
                {currentAdi.toFixed(2)} ({currentAdiLevel === 'critical' ? 'Red — Critical' : currentAdiLevel === 'warning' ? 'Yellow — Moderate Strain' : 'Green — Optimal Readiness'})
              </strong>
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Mission Tasks' },
              { id: 'Extra-Vehicular Spacewalk', label: 'Spacewalk' },
              { id: 'Medical Emergency Drill', label: 'Medical Drill' },
              { id: 'Fire Suppression Drill', label: 'Fire Drill' },
              { id: 'Biological Experiment', label: 'Biological Experiment' },
              { id: 'Habitat Life Support & Routine', label: 'Habitat & Exercise' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Action Feedback Banner (Shows when task is blocked & CMO is notified, or when task is completed) */}
        {checklistBanner && (
          <div
            id="checklistActionBanner"
            className={`p-3.5 rounded-xl border font-mono text-xs flex items-start justify-between gap-3 ${
              checklistBanner.type === 'blocked_notified'
                ? 'bg-rose-950/75 border-rose-500 text-rose-100'
                : 'bg-emerald-950/70 border-emerald-500 text-emerald-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {checklistBanner.type === 'blocked_notified' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">{checklistBanner.title}</div>
                <p className="text-xs mt-1 leading-relaxed">{checklistBanner.detail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChecklistBanner(null)}
              className="px-2 py-1 rounded bg-slate-900/80 text-slate-300 hover:text-white text-[10px] shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mission Checklist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => {
            const eligibility = evaluateMissionTaskAdiEligibility(astronaut.vitals, task.maxAllowedAdi);
            const isCompleted = task.completedByIds.includes(astronaut.id);
            const hasActiveCmoNotification = cmoTaskHoldNotifications.some(
              (n) => n.taskId === task.id && n.astronautId === astronaut.id
            );

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  !eligibility.eligible
                    ? 'bg-[#140d18]/90 border-amber-500/60'
                    : isCompleted
                    ? 'bg-emerald-950/25 border-emerald-500/60'
                    : 'bg-[#080f1e]/90 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Row: Category & ADI Eligibility Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="text-cyan-300 font-bold">
                      {task.category} · {task.durationMinutes} Minutes · +{task.healthEngagementPoints} Points
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded font-bold border ${
                        !eligibility.eligible
                          ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                          : isCompleted
                          ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                          : 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                      }`}
                    >
                      {!eligibility.eligible
                        ? `SAFETY HOLD: REQUIRES ACUTE DISTRESS INDEX ≤ ${task.maxAllowedAdi.toFixed(2)}`
                        : isCompleted
                        ? 'COMPLETED BY ASTRONAUT'
                        : `CLEARED (REQUIRED ACUTE DISTRESS INDEX ≤ ${task.maxAllowedAdi.toFixed(2)})`}
                    </span>
                  </div>

                  {/* Task Title & Description */}
                  <h4 className="text-sm sm:text-base font-bold text-white font-display">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Instructions & Spaceflight Hazard Tag */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 text-[11px] font-mono space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-slate-400">
                      <span>Primary Hazard: <strong className="text-amber-300">{task.hazardExposed}</strong></span>
                      <span>
                        Your Acute Distress Index: <strong className={eligibility.eligible ? 'text-emerald-400' : 'text-amber-300'}>{eligibility.currentAdi.toFixed(2)}</strong> / Max Allowed: <strong className="text-cyan-300">{task.maxAllowedAdi.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-cyan-300">Procedure:</strong> {task.instructions}
                    </div>
                  </div>

                  {/* If not eligible, explain why & show CMO notification status */}
                  {!eligibility.eligible && (
                    <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/50 text-[11px] font-mono text-rose-200 space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>ASTRONAUT TASK RESTRICTION ({astronaut.name.toUpperCase()}):</span>
                      </div>
                      <p>{task.safetyHoldExplanation}</p>
                      {hasActiveCmoNotification && (
                        <div className="text-emerald-300 font-bold pt-0.5">
                          ✓ Crew Medical Officer Console Notified — Task Locked Until Acute Distress Index ≤ {task.maxAllowedAdi.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  {!eligibility.eligible ? (
                    <button
                      type="button"
                      onClick={() => handleAttemptTask(task)}
                      className="w-full py-2 px-3 rounded-lg bg-amber-950/90 hover:bg-amber-900 border border-amber-500/80 text-amber-200 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {hasActiveCmoNotification
                          ? 'Task Restricted (Re-Transmit Notice to Crew Medical Officer)'
                          : 'Attempt Task (Restricted by Acute Distress Index — Notify Crew Medical Officer)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAttemptTask(task)}
                      className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isCompleted
                          ? 'bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-400 text-emerald-100'
                          : 'bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        {isCompleted
                          ? `Completed (+${task.healthEngagementPoints} Points Earned)`
                          : `Complete Mission Task (+${task.healthEngagementPoints} Readiness Points)`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 2: REALISTIC PERSONALIZED ASTRONAUT ANATOMICAL HEALTH SCANNER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 5 Columns: Personalized Realistic Astronaut Body Anatomy Bio-Scanner */}
        <div className="lg:col-span-5 graph-card border-cyan-500/40 flex flex-col justify-between space-y-3">
          <div>
            <div className="graph-title text-cyan-300">
              <span className="flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                <span>INTERACTIVE ANATOMICAL HEALTH SCANNER</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">CLICK BODY REGION</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Personalized full-body biometric morphology for <strong className="text-white">{astronaut.name} ({astronaut.callsign})</strong>. Select any anatomical system on the astronaut figure or buttons below to inspect how spaceflight hazards affect that organ system.
            </p>
          </div>

          {/* Astronaut-Specific Anthropometric Header Bar */}
          <div className="p-2.5 rounded-lg bg-[#081225] border border-cyan-500/30 flex items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <img
                src={astronaut.avatarUrl}
                alt={astronaut.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover object-top border border-cyan-400"
              />
              <div>
                <div className="text-white font-bold flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                  <span>{astronaut.name.toUpperCase()} BIO-TWIN</span>
                </div>
                <div className="text-cyan-300">{anatomySpec.bodyBuild}</div>
              </div>
            </div>
            <div className="text-right text-slate-300">
              <div><strong className="text-white">{anatomySpec.heightCm} cm</strong> · <strong className="text-white">{anatomySpec.massKg} kg</strong></div>
              <div className="text-emerald-400">VO2: {anatomySpec.vo2Max}</div>
            </div>
          </div>

          {/* Realistic Personalized SVG Human Anatomical Figure with Internal Organs, Vascular Tree & Astronaut Cranial Portrait */}
          <div className="relative bg-gradient-to-b from-[#040914] via-[#061124] to-[#040914] border border-cyan-500/35 rounded-xl p-3 flex flex-col items-center justify-center min-h-[410px] overflow-hidden">
            {/* Ambient Holographic Medical Pedestal Glow */}
            <div className="pointer-events-none absolute bottom-10 w-44 h-8 rounded-full bg-cyan-500/15 blur-xl" />

            <svg
              viewBox="0 0 320 445"
              className="w-full max-w-[295px] h-[365px] select-none"
              role="img"
              aria-label={`Realistic Anatomical Bio-Scan for ${astronaut.name}`}
            >
              <defs>
                {/* Volumetric Bio-Scan Body Gradient */}
                <linearGradient id={`bodyGrad-${astronaut.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={anatomySpec.accentHex} stopOpacity="0.28" />
                  <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.30" />
                </linearGradient>

                {/* Internal Ribcage & Skeletal Gradient */}
                <linearGradient id="boneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.22" />
                </linearGradient>

                {/* Cranial Portrait Clip Path */}
                <clipPath id={`headPortraitClip-${astronaut.id}`}>
                  <circle cx="160" cy="44" r="22" />
                </clipPath>
              </defs>

              {/* Medical Anthropometric Scale & Grid Lines */}
              <line x1="160" y1="8" x2="160" y2="430" stroke="rgba(56,189,248,0.14)" strokeDasharray="3 3" />
              <line x1="25" y1="115" x2="295" y2="115" stroke="rgba(56,189,248,0.12)" strokeDasharray="3 3" />
              <line x1="25" y1="215" x2="295" y2="215" stroke="rgba(56,189,248,0.12)" strokeDasharray="3 3" />
              <line x1="25" y1="325" x2="295" y2="325" stroke="rgba(56,189,248,0.12)" strokeDasharray="3 3" />

              {/* Height Ruler Ticks on Left */}
              {[
                { y: 22, label: `${anatomySpec.heightCm}cm` },
                { y: 115, label: 'THORAX' },
                { y: 215, label: 'PELVIS' },
                { y: 325, label: 'FEMUR' },
                { y: 422, label: '0cm' }
              ].map((tick, idx) => (
                <g key={idx}>
                  <line x1="12" y1={tick.y} x2="22" y2={tick.y} stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
                  <text x="10" y={tick.y - 3} fill="rgba(148,163,184,0.65)" fontSize="7.5" fontFamily="monospace">
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Holographic Base Pedestal Rings */}
              <ellipse cx="160" cy="425" rx="68" ry="10" fill="rgba(6,182,212,0.12)" stroke="rgba(34,211,238,0.55)" strokeWidth="1.2" />
              <ellipse cx="160" cy="425" rx="46" ry="6" fill="none" stroke="rgba(52,211,153,0.4)" strokeDasharray="4 3" />

              {/* Scaled Personalized Human Anatomy Group */}
              <g
                transform={`translate(${160 * (1 - anatomySpec.scaleX)}, ${220 * (1 - anatomySpec.scaleY)}) scale(${anatomySpec.scaleX}, ${anatomySpec.scaleY})`}
              >
                {/* 1. Outer Realistic Muscular & Dermal Silhouette */}
                <path
                  d={outerBodyPath}
                  fill={`url(#bodyGrad-${astronaut.id})`}
                  stroke={anatomySpec.accentHex}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />

                {/* 2. Cranial Contour, Helmet Bio-Ring & Astronaut's Real Portrait (Unobstructed Face) */}
                <ellipse
                  cx="160"
                  cy="44"
                  rx="24"
                  ry="28"
                  fill="rgba(8,20,40,0.92)"
                  stroke={selectedBodyId === 'brain' ? '#fbbf24' : anatomySpec.accentHex}
                  strokeWidth={selectedBodyId === 'brain' ? '2.6' : '1.8'}
                />
                <image
                  href={astronaut.avatarUrl}
                  x="136"
                  y="18"
                  width="48"
                  height="50"
                  preserveAspectRatio="xMidYMin slice"
                  clipPath={`url(#headPortraitClip-${astronaut.id})`}
                  opacity="0.92"
                />
                {/* Subtle Cranial Bio-Scan Rim */}
                <circle
                  cx="160"
                  cy="44"
                  r="22"
                  fill="none"
                  stroke={selectedBodyId === 'brain' ? '#fbbf24' : 'rgba(34,211,238,0.75)'}
                  strokeWidth={selectedBodyId === 'brain' ? '2.2' : '1.2'}
                />

                {/* 3. Anatomical Clavicles, Sternum, Ribcage, Abdominal Linea Alba & Spine */}
                {/* Clavicles & Neck Sternocleidomastoid */}
                <path
                  d="M 152 70 L 156 92 M 168 70 L 164 92 M 122 92 Q 142 97 158 95 M 198 92 Q 178 97 162 95"
                  fill="none"
                  stroke="url(#boneGrad)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Pectoralis & Abdominal Linea Alba Muscle Definition */}
                <path
                  d="M 130 118 Q 145 125 158 120 M 190 118 Q 175 125 162 120 M 146 148 Q 144 175 148 198 M 174 148 Q 176 175 172 198 M 146 162 H 174 M 146 178 H 174"
                  fill="none"
                  stroke={selectedBodyId === 'muscles' ? 'rgba(56,189,248,0.75)' : 'rgba(56,189,248,0.28)'}
                  strokeWidth="1.2"
                />
                {/* Sternum & Vertebral Column */}
                <line x1="160" y1="74" x2="160" y2="215" stroke="rgba(224,242,254,0.45)" strokeWidth="2.5" strokeDasharray="4 2" />
                {/* Thoracic Rib Pairs */}
                {[104, 114, 124, 134, 144].map((ry, rIdx) => {
                  const spread = 26 - rIdx * 1.8;
                  return (
                    <g key={rIdx} stroke={selectedBodyId === 'bones' ? '#34d399' : 'rgba(186,230,253,0.32)'} strokeWidth="1.3" fill="none">
                      <path d={`M 158 ${ry} Q ${158 - spread * 0.6} ${ry - 3} ${158 - spread} ${ry + 6}`} />
                      <path d={`M 162 ${ry} Q ${162 + spread * 0.6} ${ry - 3} ${162 + spread} ${ry + 6}`} />
                    </g>
                  );
                })}

                {/* 4. Pulmonary Lungs (Left & Right Lobes) */}
                <path
                  d="M 155 100 C 142 100, 133 114, 134 136 C 135 144, 148 145, 155 140 Z"
                  fill="rgba(56,189,248,0.16)"
                  stroke="rgba(56,189,248,0.45)"
                  strokeWidth="1"
                />
                <path
                  d="M 165 100 C 178 100, 187 114, 186 136 C 185 144, 172 145, 165 140 Z"
                  fill="rgba(56,189,248,0.16)"
                  stroke="rgba(56,189,248,0.45)"
                  strokeWidth="1"
                />

                {/* 5. Realistic Anatomical Heart & Systemic Vascular Arterial Tree */}
                <path
                  d="M 162 116 C 166 110, 175 112, 175 120 C 175 128, 166 134, 161 137 C 156 134, 152 127, 154 119 C 155 113, 160 112, 162 116 Z"
                  fill={selectedBodyId === 'heart' ? 'rgba(244,63,94,0.75)' : 'rgba(244,63,94,0.45)'}
                  stroke="#fb7185"
                  strokeWidth="1.5"
                />
                {/* Aorta, Carotid, Brachial & Femoral Arteries */}
                <path
                  d="M 163 114 C 163 98, 160 85, 160 70 M 163 102 C 142 102, 114 112, 95 168 M 163 102 C 182 102, 206 112, 225 168 M 161 136 L 160 212 M 160 212 L 144 335 M 160 212 L 176 335"
                  fill="none"
                  stroke={selectedBodyId === 'heart' ? 'rgba(251,113,133,0.75)' : 'rgba(251,113,133,0.35)'}
                  strokeWidth="1.2"
                />

                {/* 6. Hepatic, Gastric & Pancreatic Metabolic Organs */}
                <path
                  d="M 138 152 C 148 148, 162 150, 166 158 C 160 166, 144 168, 138 160 Z"
                  fill={selectedBodyId === 'metabolic' ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.22)'}
                  stroke="#34d399"
                  strokeWidth="1.2"
                />
                <path
                  d="M 164 154 C 174 152, 182 158, 179 168 C 175 175, 163 173, 161 164 Z"
                  fill={selectedBodyId === 'metabolic' ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.18)'}
                  stroke="#34d399"
                  strokeWidth="1.1"
                />

                {/* 7. Pelvic Iliac Crest & Femur / Tibia Skeletal Structure */}
                <path
                  d="M 134 202 C 138 192, 150 196, 160 202 C 170 196, 182 192, 186 202 C 188 214, 176 226, 160 226 C 144 226, 132 214, 134 202 Z"
                  fill="rgba(186,230,253,0.12)"
                  stroke={selectedBodyId === 'bones' ? '#34d399' : 'rgba(186,230,253,0.38)'}
                  strokeWidth="1.4"
                />
                {/* Left & Right Femur & Tibia Bones */}
                <path
                  d="M 142 222 L 144 316 M 178 222 L 176 316 M 144 326 L 143 402 M 176 326 L 177 402"
                  stroke={selectedBodyId === 'bones' ? '#34d399' : 'rgba(224,242,254,0.42)'}
                  strokeWidth={selectedBodyId === 'bones' ? '4.5' : '3.2'}
                  strokeLinecap="round"
                />
                {/* Knee Patella Nodes */}
                <circle cx="144" cy="321" r="4" fill="rgba(186,230,253,0.35)" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="176" cy="321" r="4" fill="rgba(186,230,253,0.35)" stroke="#38bdf8" strokeWidth="1" />

                {/* 8. Muscular Contour Striations (Deltoids, Biceps, Forearms, Quadriceps, Calves) */}
                <path
                  d="M 106 114 Q 98 138 102 158 M 214 114 Q 222 138 218 158 M 92 168 Q 86 190 88 212 M 228 168 Q 234 190 232 212 M 136 248 Q 132 280 138 308 M 184 248 Q 188 280 182 308 M 135 340 Q 131 368 136 392 M 185 340 Q 189 368 184 392"
                  fill="none"
                  stroke={selectedBodyId === 'muscles' ? '#38bdf8' : 'rgba(56,189,248,0.4)'}
                  strokeWidth={selectedBodyId === 'muscles' ? '2.4' : '1.3'}
                />

                {/* ================= INTERACTIVE CLICKABLE ORGAN SYSTEM HOTSPOTS ================= */}
                {/* 1. BRAIN, OCULAR & VESTIBULAR (Crown node so astronaut's face is 100% clear) */}
                <g
                  onClick={() => {
                    setSelectedBodyId('brain');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="182"
                    cy="24"
                    r={selectedBodyId === 'brain' ? 9 : 7}
                    fill={selectedBodyId === 'brain' ? 'rgba(251,191,36,0.85)' : 'rgba(251,191,36,0.45)'}
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                  <line x1="189" y1="24" x2="232" y2="26" stroke="#fbbf24" strokeWidth="1.2" />
                  <rect x="232" y="16" width="78" height="18" rx="4" fill="rgba(6,13,28,0.92)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="271" y="28" textAnchor="middle" fill="#fde68a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    BRAIN &amp; OCULAR
                  </text>
                </g>

                {/* 2. IMMUNE & HEMATOLOGIC (THYMUS / LYMPHATIC) */}
                <g
                  onClick={() => {
                    setSelectedBodyId('immune');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="144"
                    cy="98"
                    r={selectedBodyId === 'immune' ? 13 : 10}
                    fill={selectedBodyId === 'immune' ? 'rgba(56,189,248,0.6)' : 'rgba(56,189,248,0.28)'}
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <line x1="132" y1="98" x2="82" y2="84" stroke="#38bdf8" strokeWidth="1.2" />
                  <rect x="12" y="74" width="70" height="18" rx="4" fill="rgba(6,13,28,0.9)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="47" y="86" textAnchor="middle" fill="#bae6fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    IMMUNE ({astronaut.cumulativeRadiationMsv}mSv)
                  </text>
                </g>

                {/* 3. CARDIOVASCULAR & HEART */}
                <g
                  onClick={() => {
                    setSelectedBodyId('heart');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="166"
                    cy="124"
                    r={selectedBodyId === 'heart' ? 14 : 11}
                    fill={selectedBodyId === 'heart' ? 'rgba(244,63,94,0.65)' : 'rgba(16,185,129,0.32)'}
                    stroke={selectedBodyId === 'heart' ? '#fb7185' : '#10b981'}
                    strokeWidth="2"
                  />
                  <line x1="178" y1="124" x2="232" y2="112" stroke="#10b981" strokeWidth="1.2" />
                  <rect x="232" y="102" width="78" height="18" rx="4" fill="rgba(6,13,28,0.9)" stroke="#10b981" strokeWidth="1" />
                  <text x="271" y="114" textAnchor="middle" fill="#a7f3d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    HEART ({astronaut.vitals.heartRate} BPM)
                  </text>
                </g>

                {/* 4. MUSCULAR SYSTEM */}
                <g
                  onClick={() => {
                    setSelectedBodyId('muscles');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="102"
                    cy="146"
                    r={selectedBodyId === 'muscles' ? 13 : 10}
                    fill={selectedBodyId === 'muscles' ? 'rgba(56,189,248,0.6)' : 'rgba(56,189,248,0.28)'}
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <line x1="90" y1="146" x2="72" y2="146" stroke="#38bdf8" strokeWidth="1.2" />
                  <rect x="10" y="137" width="62" height="18" rx="4" fill="rgba(6,13,28,0.9)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="41" y="149" textAnchor="middle" fill="#bae6fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    MUSCULATURE
                  </text>
                </g>

                {/* 5. METABOLIC & BLOOD SUGAR */}
                <g
                  onClick={() => {
                    setSelectedBodyId('metabolic');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="156"
                    cy="162"
                    r={selectedBodyId === 'metabolic' ? 14 : 11}
                    fill={selectedBodyId === 'metabolic' ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.28)'}
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <line x1="168" y1="162" x2="226" y2="168" stroke="#10b981" strokeWidth="1.2" />
                  <rect x="226" y="159" width="84" height="18" rx="4" fill="rgba(6,13,28,0.9)" stroke="#10b981" strokeWidth="1" />
                  <text x="268" y="171" textAnchor="middle" fill="#a7f3d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    GLUCOSE ({astronaut.vitals.bloodSugarMgDl || 92}mg/dL)
                  </text>
                </g>

                {/* 6. SKELETAL & BONE DENSITY */}
                <g
                  onClick={() => {
                    setSelectedBodyId('bones');
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx="143"
                    cy="272"
                    r={selectedBodyId === 'bones' ? 14 : 11}
                    fill={selectedBodyId === 'bones' ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.28)'}
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <line x1="130" y1="272" x2="84" y2="272" stroke="#10b981" strokeWidth="1.2" />
                  <rect x="10" y="263" width="74" height="18" rx="4" fill="rgba(6,13,28,0.9)" stroke="#10b981" strokeWidth="1" />
                  <text x="47" y="275" textAnchor="middle" fill="#a7f3d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    BONE ({astronaut.vitals.boneDensityDeltaPercent ?? -1.0}%)
                  </text>
                </g>
              </g>
            </svg>

            {/* Quick Organ Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full mt-2">
              {NASA_BODY_SYSTEM_REGIONS.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => {
                    setSelectedBodyId(region.id);
                    soundEngine.playBeep(2100, 0.04);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold border text-left transition-all cursor-pointer truncate ${
                    selectedBodyId === region.id
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {region.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Selected Body Region Clinical Guidance & NASA HRP Education */}
        <div className="lg:col-span-7 graph-card border-cyan-500/40 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  {selectedBodyRegion.anatomicalSubtitle}
                </span>
                <h3 className="text-base sm:text-lg font-display font-bold text-white mt-0.5">
                  {selectedBodyRegion.name} — {astronaut.name}
                </h3>
              </div>

              <span
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                  selectedBodyRegion.triageStatus === 'YELLOW'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                    : 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                }`}
              >
                {selectedBodyRegion.currentMetricLabel}: {selectedBodyRegion.currentMetricValue}
              </span>
            </div>

            {/* Associated Spaceflight Hazards */}
            <div className="text-xs font-mono text-slate-300">
              <span className="text-slate-400">NASA Spaceflight Hazards Affecting Region: </span>
              <strong className="text-amber-300">{selectedBodyRegion.primarySpaceHazards.join(' · ')}</strong>
            </div>

            {/* Educational Grid answering the NASA Challenge Manual Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#081020] border border-slate-800 space-y-1">
                <div className="font-mono text-[10px] text-cyan-300 font-bold uppercase">
                  1. Physiological Function &amp; Spaceflight Effect
                </div>
                <p className="text-slate-200 leading-relaxed">{selectedBodyRegion.physiologicalFunction}</p>
                <p className="text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                  {selectedBodyRegion.spaceflightRiskExplanation}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#081020] border border-slate-800 space-y-1">
                <div className="font-mono text-[10px] text-emerald-300 font-bold uppercase">
                  2. In-Space Measurement &amp; Why Exam Is Needed
                </div>
                <p className="text-slate-200 leading-relaxed">
                  <strong>Measurement Method:</strong> {selectedBodyRegion.inSpaceMeasurementMethod}
                </p>
                <p className="text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80">
                  <strong>Why Exam Needed:</strong> {selectedBodyRegion.whyExamNeeded}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/25 border border-amber-500/40 text-xs space-y-1">
              <div className="font-mono text-[10px] text-amber-300 font-bold uppercase">
                3. When Result Warrants Crew Medical Officer or Ground Flight Surgeon Attention
              </div>
              <p className="text-slate-200">{selectedBodyRegion.whenToAlertCmoOrFlightSurgeon}</p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/40 text-xs space-y-1.5">
              <div className="font-mono text-[10px] text-emerald-300 font-bold uppercase">
                4. Preventive Actions &amp; Treatments to Prevent Critical Conditions
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-200">
                {selectedBodyRegion.preventiveCountermeasures.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
