import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Headphones,
  Check
} from 'lucide-react';
import { PFA_PROTOCOLS } from '../data/mockAresData';
import { soundEngine } from '../services/audioService';

interface AudioNarrationOverlayProps {
  isAiVoiceEnabled: boolean;
  onToggleAiVoice: () => void;
  systemNotification: string;
}

export const AudioNarrationOverlay: React.FC<AudioNarrationOverlayProps> = ({
  isAiVoiceEnabled,
  onToggleAiVoice,
  systemNotification
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeVoiceTitle, setActiveVoiceTitle] = useState<string>('Standing by for PFA voice commands');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handlePlayVoiceover = (title: string, path: string) => {
    setActiveVoiceTitle(title);
    soundEngine.playPfaAudio(
      path,
      undefined,
      () => setIsPlaying(false)
    );
    setIsPlaying(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full">
      <div className="bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-3 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-xs font-mono">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-cyan-500/40'}`} />
            <span className="font-bold text-cyan-300">
              ARES VOICE SYNTHESIS CORE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleAiVoice}
              className={`p-1 rounded ${isAiVoiceEnabled ? 'text-cyan-400' : 'text-slate-500'}`}
              title={isAiVoiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            >
              {isAiVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Status Line */}
        <div className="mt-2 text-[11px] text-slate-300 truncate">
          {systemNotification || activeVoiceTitle}
        </div>

        {/* Audio Visualizer Waves if playing */}
        {isPlaying && (
          <div className="flex items-center gap-1 h-3 mt-2">
            {[40, 80, 100, 60, 90, 45, 75, 95, 60, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Expanded Quick Voiceover Triggers Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Quick Voice Narrations:
            </span>
            {PFA_PROTOCOLS.map(proto => (
              <button
                key={proto.key}
                onClick={() => handlePlayVoiceover(proto.title, proto.audioPath)}
                className="w-full text-left p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition-colors"
              >
                <span className="truncate pr-2">{proto.title}</span>
                <Play className="w-3 h-3 text-cyan-400 shrink-0" />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
