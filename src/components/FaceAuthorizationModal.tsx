import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  ShieldCheck, 
  Camera, 
  KeyRound, 
  X, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Fingerprint,
  RefreshCw,
  Eye
} from 'lucide-react';
import { AstronautProfile } from '../types/ares';
import { soundEngine } from '../services/audioService';

interface FaceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronauts: AstronautProfile[];
  currentAstronaut: AstronautProfile;
  onAuthenticate: (astronaut: AstronautProfile) => void;
}

export const FaceAuthorizationModal: React.FC<FaceAuthModalProps> = ({
  isOpen,
  onClose,
  astronauts,
  currentAstronaut,
  onAuthenticate
}) => {
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(currentAstronaut.id);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'FAILED'>('IDLE');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Align face with biometric reticle');
  const [pinInput, setPinInput] = useState<string>('Ares@2026');
  const [pinError, setPinError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedAstronaut = astronauts.find(a => a.id === selectedAstronautId) || currentAstronaut;

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const toggleLiveCamera = async () => {
    if (useLiveCamera) {
      stopCamera();
      setUseLiveCamera(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setCameraStream(stream);
        setUseLiveCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable, using cybernetic scan simulation:', err);
        setUseLiveCamera(false);
        setStatusMessage('Camera offline. Using synthetic ocular simulation.');
      }
    }
  };

  // Futuristic Canvas Render Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scanY = 0;
    let scanDirection = 1;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      angle += 0.015;

      // Outer dashed tech ring
      ctx.strokeStyle = scanState === 'VERIFIED' ? '#10b981' : '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 110, angle, angle + Math.PI * 1.8);
      ctx.stroke();

      // Inner counter-rotating ring
      ctx.strokeStyle = scanState === 'VERIFIED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 95, -angle * 1.4, -angle * 1.4 + Math.PI * 1.5);
      ctx.stroke();

      // Corner bracket reticles
      const boxSize = 125;
      ctx.setLineDash([]);
      ctx.strokeStyle = scanState === 'VERIFIED' ? '#34d399' : '#22d3ee';
      ctx.lineWidth = 2;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(-boxSize, -boxSize + 25);
      ctx.lineTo(-boxSize, -boxSize);
      ctx.lineTo(-boxSize + 25, -boxSize);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(boxSize - 25, -boxSize);
      ctx.lineTo(boxSize, -boxSize);
      ctx.lineTo(boxSize, -boxSize + 25);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(-boxSize, boxSize - 25);
      ctx.lineTo(-boxSize, boxSize);
      ctx.lineTo(-boxSize + 25, boxSize);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(boxSize - 25, boxSize);
      ctx.lineTo(boxSize, boxSize);
      ctx.lineTo(boxSize, boxSize - 25);
      ctx.stroke();

      if (!useLiveCamera) {
        // Face outline polygon
        ctx.strokeStyle = scanState === 'VERIFIED' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(6, 182, 212, 0.35)';
        ctx.fillStyle = scanState === 'VERIFIED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.04)';
        ctx.lineWidth = 1.2;

        const facePts = [
          [-55, -45], [0, -85], [55, -45],
          [68, 5], [45, 60], [0, 85], [-45, 60], [-68, 5]
        ];

        ctx.beginPath();
        facePts.forEach(([px, py], idx) => {
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eye targets
        const drawEyeTarget = (ex: number, ey: number) => {
          ctx.strokeStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(ex, ey, 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fill();
        };
        drawEyeTarget(-32, -18);
        drawEyeTarget(32, -18);

        // Nose line & mouth
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 18);
        ctx.lineTo(8, 24);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-22, 45);
        ctx.quadraticCurveTo(0, 50, 22, 45);
        ctx.stroke();

        // 68-point landmark dots
        const landmarkGrid = [
          [-50, -35], [-30, -50], [-10, -55], [10, -55], [30, -50], [50, -35],
          [-20, 0], [20, 0], [-10, 12], [10, 12],
          [-35, 30], [-15, 38], [0, 40], [15, 38], [35, 30],
          [-28, 65], [0, 72], [28, 65]
        ];
        ctx.fillStyle = scanState === 'VERIFIED' ? '#34d399' : '#00f0ff';
        landmarkGrid.forEach(([lx, ly]) => {
          ctx.beginPath();
          ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();

      // Scanning sweep line if scanning
      if (scanState === 'SCANNING') {
        scanY += scanDirection * 2.8;
        if (scanY > height - 40 || scanY < 40) {
          scanDirection *= -1;
        }

        const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(centerX - 130, scanY - 15, 260, 30);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 125, scanY);
        ctx.lineTo(centerX + 125, scanY);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, scanState, useLiveCamera]);

  const startBiometricScan = () => {
    setScanState('SCANNING');
    setScanProgress(0);
    setStatusMessage('Acquiring ocular fiducials & depth triangulation...');
    soundEngine.playBiometricScanPing();

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setScanProgress(Math.min(100, step * 7));

      if (step === 4) {
        setStatusMessage('Extracting 68-point neural biometric tensor...');
        soundEngine.playBeep(1200, 0.05);
      } else if (step === 9) {
        setStatusMessage('Anti-spoof liveness: micro-vascular pulse verified (72 bpm)');
        soundEngine.playBeep(1440, 0.05);
      } else if (step >= 14) {
        clearInterval(interval);
        setScanProgress(100);
        setScanState('VERIFIED');
        setStatusMessage(`Identity Confirmed: ${selectedAstronaut.name} (@${selectedAstronaut.username})`);
        soundEngine.playAuthGrantedChime();

        setTimeout(() => {
          stopCamera();
          onAuthenticate(selectedAstronaut);
          onClose();
        }, 1100);
      }
    }, 110);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'Ares@2026' || pinInput.trim() === selectedAstronaut.bioSecurityPin) {
      setPinError('');
      setScanState('VERIFIED');
      soundEngine.playAuthGrantedChime();
      setTimeout(() => {
        stopCamera();
        onAuthenticate(selectedAstronaut);
        onClose();
      }, 500);
    } else {
      setPinError('Invalid Password/PIN. (Default password: Ares@2026)');
      soundEngine.playAlarmPulse();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#080d19] border border-cyan-500/40 rounded-lg shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-cyan-400/50 bg-cyan-950/40 flex items-center justify-center text-cyan-400">
              <Scan className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold tracking-wider text-slate-100 flex items-center gap-2">
                ARES BIOMETRIC FACE AUTHORIZATION
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-950/40">
                  ARES OS v2.6
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Biometric account verification & astronaut habitat environment synchronization
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Face Scanner Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            <div className="relative w-full aspect-[4/3] max-w-[420px] rounded border border-cyan-500/50 bg-slate-950 overflow-hidden shadow-inner scanline-effect">
              {useLiveCamera && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {!useLiveCamera && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <img
                    src={selectedAstronaut.avatarUrl}
                    alt="Astronaut face"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover filter grayscale contrast-125"
                  />
                </div>
              )}

              <canvas
                ref={canvasRef}
                width={420}
                height={315}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 text-[10px] font-mono text-cyan-400">
                <span className="px-1.5 py-0.5 rounded bg-black/60 border border-cyan-500/30">
                  CAM: {useLiveCamera ? 'WEBCAM_ACTIVE' : 'SYNTHETIC_OCULAR'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/60 border border-cyan-500/30">
                  USER: @{selectedAstronaut.username}
                </span>
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded border backdrop-blur-sm ${
                  scanState === 'VERIFIED'
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/70'
                    : 'border-cyan-500/30 text-cyan-300 bg-black/70'
                }`}>
                  MATCH: {scanState === 'VERIFIED' ? '99.4% [VERIFIED]' : `${Math.round(scanProgress * 0.9)}%`}
                </span>
                <span className="px-2 py-0.5 rounded border border-cyan-500/30 text-slate-300 bg-black/70">
                  FPS: 60.0
                </span>
              </div>
            </div>

            <div className="w-full max-w-[420px] mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{statusMessage}</span>
                <span className="text-cyan-400 font-bold">{scanProgress}%</span>
              </div>

              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-150 ${
                    scanState === 'VERIFIED' ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${scanProgress}%` }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startBiometricScan}
                  disabled={scanState === 'SCANNING'}
                  className="flex-1 py-2.5 px-4 rounded text-xs font-semibold font-display tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{scanState === 'SCANNING' ? 'SCANNING BIOMETRICS...' : 'EXECUTE FACE AUTHORIZATION'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleLiveCamera}
                  title="Toggle WebCam"
                  className={`p-2.5 rounded border text-xs transition-colors ${
                    useLiveCamera 
                      ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40' 
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 bg-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Crew Roster in ARES OS v2.6 (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 pt-4 lg:pt-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                  Select User Account
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">PASSWORD: Ares@2026</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {astronauts.map(astronaut => {
                  const isSelected = astronaut.id === selectedAstronautId;
                  return (
                    <button
                      key={astronaut.id}
                      type="button"
                      onClick={() => {
                        setSelectedAstronautId(astronaut.id);
                        setScanState('IDLE');
                        setScanProgress(0);
                        setStatusMessage(`Biometric template loaded: ${astronaut.name}`);
                      }}
                      className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                          : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={astronaut.avatarUrl}
                          alt={astronaut.name}
                          referrerPolicy="no-referrer"
                          className={`w-9 h-9 rounded object-cover border ${
                            isSelected ? 'border-cyan-400' : 'border-slate-700'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100">{astronaut.name}</span>
                            <span className="text-[10px] font-mono text-cyan-400">@{astronaut.username}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{astronaut.role}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        astronaut.disorderSeverity === 'CRITICAL' ? 'bg-rose-950 text-rose-300' :
                        astronaut.disorderSeverity === 'ELEVATED' ? 'bg-amber-950 text-amber-300' :
                        'bg-emerald-950 text-emerald-300'
                      }`}>
                        {astronaut.disorderSeverity || 'NOMINAL'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Login Fallback (Ares@2026) */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <form onSubmit={handlePinSubmit} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    Account Password (Ares@2026)
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter password"
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded px-3 py-1.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded border border-slate-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
                {pinError && <p className="text-[11px] text-rose-400 font-mono">{pinError}</p>}
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
