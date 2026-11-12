import React, { useState } from 'react';
import { 
  Radio, 
  HeartPulse, 
  Activity, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Lock,
  Headphones,
  Play,
  Square
} from 'lucide-react';
import { AstronautProfile } from '../types/ares';

interface NavigationProps {
  activeTab: 'POD' | 'CMO' | 'GROUND' | 'OVERRIDE';
  setActiveTab: (tab: 'POD' | 'CMO' | 'GROUND' | 'OVERRIDE') => void;
  currentAstronaut: AstronautProfile;
  onOpenFaceAuth: () => void;
  onOpenOverride: () => void;
  missionTime: string;
  isAiVoiceEnabled: boolean;
  onToggleAiVoice: () => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
  onSpeakCurrentScreen: () => void;
  onStopSpeech: () => void;
  isSpeaking: boolean;
  emergencyAlertCount: number;
  pendingGroundCallsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentAstronaut,
  onOpenFaceAuth,
  onOpenOverride,
  missionTime,
  isAiVoiceEnabled,
  onToggleAiVoice,
  speechRate,
  onChangeSpeechRate,
  onSpeakCurrentScreen,
  onStopSpeech,
  isSpeaking,
  emergencyAlertCount,
  pendingGroundCallsCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090b12]/95 backdrop-blur-md border-b border-[#232736] px-3 sm:px-6 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left: Brand Wordmark + System Info */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-cyan-400/50 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base tracking-wider text-slate-100">
                  ARES <span className="text-cyan-400">OS</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
                  v2.6
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                {missionTime}
              </div>
            </div>
          </div>

          {/* Mobile Profile pill */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenFaceAuth}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121624] border border-cyan-500/40 text-[11px] font-mono text-cyan-300"
            >
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>Face Auth</span>
            </button>
          </div>
        </div>

        {/* Center: Main View Navigation */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveTab('POD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'POD'
                ? 'bg-[#192967] text-cyan-300 border border-cyan-400 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-[#101420] border border-[#232736]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>POD INTERFACE</span>
          </button>

          <button
            onClick={() => setActiveTab('CMO')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'CMO'
                ? 'bg-[#192967] text-cyan-300 border border-cyan-400 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-[#101420] border border-[#232736]'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>CMO CONSOLE</span>
            {emergencyAlertCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('GROUND')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'GROUND'
                ? 'bg-[#192967] text-cyan-300 border border-cyan-400 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 bg-[#101420] border border-[#232736]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-amber-400" />
            <span>GROUND STATION</span>
            {pendingGroundCallsCount > 0 && (
              <span className="ml-1 px-1.5 text-[9px] font-mono rounded-full bg-rose-600 text-white font-bold animate-pulse">
                {pendingGroundCallsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenOverride}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-950/50 rounded border border-rose-800/60 transition-all whitespace-nowrap shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>OVERRIDE (ETP)</span>
          </button>
        </nav>

        {/* Right: Point 9 Narrator / Voice Guide Bar + Face Auth / Profile Status */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Narrator bar from template */}
          <div className="flex items-center gap-1.5 bg-[#101422] border border-[#232736] rounded-md px-2 py-1">
            <button
              onClick={onToggleAiVoice}
              title="Toggle ARES Voice Guide"
              className={`flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded transition-all ${
                isAiVoiceEnabled 
                  ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50' 
                  : 'text-slate-400 bg-slate-800/40'
              }`}
            >
              {isAiVoiceEnabled ? <Volume2 className="w-3 h-3 text-cyan-400" /> : <VolumeX className="w-3 h-3" />}
              <span className="font-semibold">{isAiVoiceEnabled ? 'GUIDE: ON' : 'GUIDE: OFF'}</span>
            </button>

            {/* Speaking dot indicator */}
            <span 
              className={`w-2 h-2 rounded-full transition-all ${isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} 
              title={isSpeaking ? 'ARES is speaking' : 'Speech idle'}
            />

            {/* Speed selector */}
            <select
              value={speechRate}
              onChange={(e) => onChangeSpeechRate(parseFloat(e.target.value))}
              className="bg-[#0b0e17] border border-[#232736] text-[10px] font-mono text-slate-300 rounded px-1 py-0.5 outline-none cursor-pointer"
              title="Narrator Speech Rate"
            >
              <option value="0.8">0.8x</option>
              <option value="1.0">1.0x</option>
              <option value="1.2">1.2x</option>
            </select>

            {/* Speak screen & Stop buttons */}
            <button
              onClick={onSpeakCurrentScreen}
              title="Narrate current view"
              className="p-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 rounded"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
            </button>
            <button
              onClick={onStopSpeech}
              title="Stop voice narration"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
            </button>
          </div>

          {/* Desktop Biometric Profile / Face Auth Trigger */}
          <button
            onClick={onOpenFaceAuth}
            className="hidden sm:flex items-center gap-2 pl-2 pr-2.5 py-1 bg-[#101422] hover:bg-[#151b2e] border border-cyan-500/40 hover:border-cyan-400 rounded-md transition-all group"
            title="Biometric Face Authentication & Profile Switch"
          >
            <div className="relative">
              <img
                src={currentAstronaut.avatarUrl}
                alt={currentAstronaut.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-cyan-400/60"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#101422]" />
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs font-mono font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {currentAstronaut.name.split(' ')[0]}
                </span>
                <Lock className="w-2.5 h-2.5 text-cyan-400" />
              </div>
              <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">
                {currentAstronaut.role}
              </span>
            </div>

            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/70 ml-0.5">
              Face Auth
            </span>
          </button>

        </div>

      </div>
    </header>
  );
};
