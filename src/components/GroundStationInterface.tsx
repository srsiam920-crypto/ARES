import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { AstronautProfile, GroundCallRecord } from '../types/ares';
import { soundEngine } from '../services/audioService';
import { CinematicEarthHeaderBg } from './CinematicEarthHeaderBg';
import { calculateAdi as calcVitalsAdi } from '../utils/pfaLogic';

interface GroundStationInterfaceProps {
  astronauts: AstronautProfile[];
  groundCalls: GroundCallRecord[];
  onUpdateGroundCall: (callId: string, status: string, groundResponse: string) => void;
  groundProfile: AstronautProfile;
}

export const GroundStationInterface: React.FC<GroundStationInterfaceProps> = ({
  astronauts,
  groundCalls,
  onUpdateGroundCall,
  groundProfile
}) => {
  const [responseInputs, setResponseInputs] = useState<{ [callId: string]: string }>({
    'CALL-8801': 'Houston received telemetry. Ground concurs with Deep Touch Grounding (18 kPa) and Pacific Ocean VR immersion. Pre-clearing neuroleptic dispensary if unresolved.'
  });
  const [statusInputs, setStatusInputs] = useState<{ [callId: string]: string }>({
    'CALL-8801': 'ACKNOWLEDGED'
  });

  const openCallsCount = groundCalls.filter(c => c.status !== 'RESOLVED').length;

  const handleSaveResponse = (callId: string) => {
    const resp = responseInputs[callId] || '';
    const stat = statusInputs[callId] || 'ACKNOWLEDGED';
    onUpdateGroundCall(callId, stat, resp);
    soundEngine.playBiometricScanPing();
  };

  return (
    <div id="groundInterface" className="w-full max-w-7xl mx-auto space-y-4">
      
      {/* ================= GROUND STATION HEADER ================= */}
      <header className="ares-header relative overflow-hidden min-h-[148px] border-cyan-500/50 bg-[#040914]">
        <CinematicEarthHeaderBg variant="ground" />
        <div className="relative z-10 w-full lg:max-w-[66%] flex flex-col gap-3">
          <div className="profile-block">
            <div className="avatar border-cyan-400 bg-cyan-950/40 relative">
              <img 
                src={groundProfile.avatarUrl} 
                alt={groundProfile.name}
                referrerPolicy="no-referrer"
                className="object-center"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="ares-sys-tag text-cyan-400">
                  NASA JSC HOUSTON // MISSION CONTROL
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500 text-cyan-200 font-mono">
                  GROUND OPERATORS ONLY
                </span>
              </div>
              <h2 className="ares-subject-id text-white">
                {groundProfile.name.toUpperCase()} [{groundProfile.callsign.toUpperCase()}]
              </h2>
              <div className="profile-sub text-slate-300">
                Mission Flight Director &amp; Space Medicine Division &middot; DSN Telemetry ~22m simulated light-delay
              </div>
            </div>
          </div>

          <div className="ares-status-pills">
            <div className="ares-badge bg-[#091122]/90">
              <span className="ares-badge-dot" />
              <span>LINK: <strong>DSN GOLDSTONE 70M</strong></span>
            </div>
            <div className="ares-badge bg-[#091122]/90">
              <span>OPEN CALLS: <strong className="text-amber-300">{openCallsCount}</strong></span>
            </div>
          </div>
        </div>
      </header>

      <div className="ares-main-grid">
        
        {/* ================= INCOMING SUPPORT CALLS FROM THE VESSEL ================= */}
        <div className="graph-card border-cyan-500/40">
          <div className="graph-title text-cyan-300 mb-2 flex items-center justify-between">
            <span>INCOMING SUPPORT CALLS FROM ARES-V DEEP SPACE VESSEL</span>
            <span className="text-[10px] font-mono text-slate-400">DSN UPLINK: ACTIVE</span>
          </div>

          <div className="space-y-3 mt-2">
            {groundCalls.length === 0 ? (
              <span className="muted">No calls currently active. All habitats reporting nominal.</span>
            ) : (
              groundCalls.map((c) => {
                const currentResp = responseInputs[c.id] ?? (c.groundResponse || '');
                const currentStat = statusInputs[c.id] ?? c.status;

                return (
                  <div key={c.id} className={`call-card prio-${c.priority.toLowerCase()}`}>
                    <div className="ctrl-row">
                      <span className="font-bold text-white">
                        #{c.id} &middot; {c.priority} &middot; Patient: {c.patientName}
                      </span>
                      <span className={`status-pill ${c.status === 'RESOLVED' ? 'ok' : 'in_progress'}`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="muted text-xs mt-1">
                      {c.timestamp} &middot; Escalated by Crew Medical Officer: {c.cmoName}
                    </div>

                    <div className="text-xs text-slate-200 mt-2 font-mono bg-[#0e121d] p-2 rounded border border-[#232736]">
                      {c.reason}
                    </div>

                    <div className="mt-3 space-y-2 border-t border-[#232736] pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 font-semibold">Response Status:</span>
                        <select
                          value={currentStat}
                          onChange={(e) => setStatusInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="ares-select text-xs py-1"
                        >
                          <option value="ACKNOWLEDGED">ACKNOWLEDGED (Houston received)</option>
                          <option value="DISPATCHED">DISPATCHED (Medical guidance transmitted)</option>
                          <option value="IN_PROGRESS">IN_PROGRESS (Surgeon reviewing)</option>
                          <option value="RESOLVED">RESOLVED (Telemetry stabilized)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-slate-300 font-semibold block">Houston Flight Surgeon Guidance:</span>
                        <textarea
                          value={currentResp}
                          onChange={(e) => setResponseInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Type flight surgeon recommendations..."
                          className="field w-full text-xs h-16"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveResponse(c.id)}
                        className="ares-tab-btn is-active text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmit Guidance to Vessel via DSN</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= DOWNLINKED CREW STATUS RECAP ================= */}
        <div className="graph-card">
          <div className="graph-title mb-2">DOWNLINKED FLEET TELEMETRY MATRIX</div>
          <p className="muted my-1">
            Asynchronous 22-minute delayed bio-telemetry packets received from the ARES-V Deep Space Vessel.
          </p>

          <div className="assess-list mt-3">
            {astronauts.filter(a => a.role !== 'GROUND_STATION').map((c) => {
              const adi = calculateAdi(c);
              const level = adi >= 0.70 ? 'critical' : adi >= 0.45 ? 'warning' : 'ok';

              return (
                <div key={c.id} className={`assess-card sev-${level}`}>
                  <div className="ctrl-row">
                    <span className="flex items-center gap-2">
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
                    Downlink Synchronized &middot; ADI Score: {adi.toFixed(2)} &middot; LTS: {c.lastTimeOfSleep} &middot; {c.assignedPod}
                  </div>

                  <div className="muted text-xs mt-1">
                    {c.biomarkerCause || 'Autonomic sympathetic-parasympathetic tone within nominal limits.'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

function calculateAdi(a: AstronautProfile): number {
  return calcVitalsAdi(a.vitals);
}

