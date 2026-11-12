// Web Audio API, Realistic NASA Telemetry Acoustics, and Automatic Pod Voice Narrator
import { AstronautProfile } from '../types/ares';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private binauralOscLeft: OscillatorNode | null = null;
  private binauralOscRight: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  private cabinHumOsc: OscillatorNode | null = null;
  private cabinHumGain: GainNode | null = null;
  private isBinauralPlaying = false;
  private isCabinHumPlaying = false;
  private currentBinauralFreq = 6; // default 6 Hz Theta

  // Soundscape noise generation
  private soundscapeSource: AudioBufferSourceNode | null = null;
  private soundscapeGain: GainNode | null = null;
  private currentSoundscape: string = 'off';
  private cmoAlarmTimer: ReturnType<typeof setInterval> | null = null;
  private isCmoAlarmSirenActive = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play PFA Protocol or VR Audio file
  public playPfaAudio(
    audioUrl: string, 
    onTimeUpdate?: (curr: number, dur: number) => void,
    onEnded?: () => void
  ): HTMLAudioElement {
    this.stopPfaAudio();
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;
    audio.crossOrigin = 'anonymous';

    if (onTimeUpdate) {
      audio.ontimeupdate = () => {
        onTimeUpdate(audio.currentTime, audio.duration || 0);
      };
    }

    if (onEnded) {
      audio.onended = () => {
        onEnded();
      };
    }

    audio.play().catch(e => {
      console.warn('Audio auto-play prevented or paused:', e);
    });

    return audio;
  }

  public stopPfaAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  public isPfaPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused);
  }

  // Realistic Subtle NASA Quindar / Hardware Telemetry Click
  public playBeep(freq = 2475, duration = 0.045, type: OscillatorType = 'sine') {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio context restricted before user gesture
    }
  }

  public playTone(freq = 440, duration = 0.15, type: OscillatorType = 'sine') {
    this.playBeep(freq, duration, type);
  }

  // Realistic Sci-Fi Biometric Retinal Scanner Pulse (No cartoonish sweep)
  public playBiometricScanPing() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // 1. Deep sub-bass biometric sensor thrum (92 Hz -> 68 Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(92, now);
      subOsc.frequency.exponentialRampToValueAtTime(68, now + 0.32);
      subGain.gain.setValueAtTime(0.09, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.35);

      // 2. Crisp NASA Quindar-style 2525 Hz telemetry intro pulse (50ms)
      const quindar = ctx.createOscillator();
      const qGain = ctx.createGain();
      quindar.type = 'sine';
      quindar.frequency.setValueAtTime(2525, now);
      qGain.gain.setValueAtTime(0.025, now);
      qGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      quindar.connect(qGain);
      qGain.connect(ctx.destination);
      quindar.start(now);
      quindar.stop(now + 0.06);
    } catch {}
  }

  // Realistic Deep-Space Airlock / Biometric Lock Confirmation (Warm Low-Pass Resonance + NASA Quindar Outro)
  public playAuthGrantedChime() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      // Warm low-pass filtered harmonic chord (110Hz A2 + 164.81Hz E3 + 220Hz A3)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, now);
      filter.connect(ctx.destination);

      [110, 164.81, 220].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.055, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        osc.stop(now + 0.9);
      });

      // Subtle NASA Quindar 2475Hz confirmation tick at +0.06s
      const confirmTick = ctx.createOscillator();
      const tickGain = ctx.createGain();
      confirmTick.type = 'sine';
      confirmTick.frequency.setValueAtTime(2475, now + 0.06);
      tickGain.gain.setValueAtTime(0.022, now + 0.06);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      confirmTick.connect(tickGain);
      tickGain.connect(ctx.destination);
      confirmTick.start(now + 0.06);
      confirmTick.stop(now + 0.15);
    } catch {}
  }

  public playAlarmPulse() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.setValueAtTime(340, now + 0.14);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  // Dual-tone NASA Medical Emergency Klaxon Burst when Astronaut calls CMO
  public playCmoEmergencySirenBurst() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1350;
      filter.connect(ctx.destination);

      // 3-pulse IEC 60601 / spacecraft high-priority medical alarm (880Hz - 660Hz - 880Hz)
      const pulses = [
        { start: 0.0, freq: 880, dur: 0.14 },
        { start: 0.18, freq: 660, dur: 0.14 },
        { start: 0.36, freq: 880, dur: 0.22 }
      ];

      pulses.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.freq, now + p.start);
        gain.gain.setValueAtTime(0.001, now + p.start);
        gain.gain.linearRampToValueAtTime(0.09, now + p.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.start + p.dur);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now + p.start);
        osc.stop(now + p.start + p.dur + 0.02);
      });
    } catch {}
  }

  // Continuous Audible Alarm Loop while Astronaut -> CMO Call Alarm is Active
  public startCmoEmergencyAlarm() {
    this.stopCmoEmergencyAlarm();
    this.isCmoAlarmSirenActive = true;
    this.playCmoEmergencySirenBurst();
    this.cmoAlarmTimer = setInterval(() => {
      if (this.isCmoAlarmSirenActive) {
        this.playCmoEmergencySirenBurst();
      }
    }, 1800);
  }

  public stopCmoEmergencyAlarm() {
    this.isCmoAlarmSirenActive = false;
    if (this.cmoAlarmTimer) {
      clearInterval(this.cmoAlarmTimer);
      this.cmoAlarmTimer = null;
    }
  }

  public isCmoAlarmRinging(): boolean {
    return this.isCmoAlarmSirenActive;
  }

  // Flexible Binaural Tone Generator (0Hz No Sound, Delta 4Hz, Theta 6Hz, Alpha 10Hz, Beta 18Hz)
  public setBinauralBeat(freqDiff: number, enable: boolean = true) {
    this.currentBinauralFreq = freqDiff;
    if (!enable || freqDiff <= 0) {
      this.stopBinaural();
      return;
    }
    this.startBinaural(freqDiff);
  }

  public startBinaural(freqDiff: number = 6) {
    if (freqDiff <= 0) {
      this.stopBinaural();
      return;
    }
    const ctx = this.initCtx();
    this.stopBinaural();

    try {
      const baseFreq = 180; // Warm 180Hz carrier frequency
      const merger = ctx.createChannelMerger(2);
      this.binauralGain = ctx.createGain();
      this.binauralGain.gain.setValueAtTime(0.05, ctx.currentTime);

      this.binauralOscLeft = ctx.createOscillator();
      this.binauralOscLeft.type = 'sine';
      this.binauralOscLeft.frequency.value = baseFreq;

      this.binauralOscRight = ctx.createOscillator();
      this.binauralOscRight.type = 'sine';
      this.binauralOscRight.frequency.value = baseFreq + freqDiff;

      this.binauralOscLeft.connect(merger, 0, 0);
      this.binauralOscRight.connect(merger, 0, 1);

      merger.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      this.binauralOscLeft.start();
      this.binauralOscRight.start();
      this.isBinauralPlaying = true;
    } catch (e) {
      console.warn('Failed to start binaural beat:', e);
    }
  }

  public stopBinaural() {
    if (this.binauralOscLeft) {
      try {
        this.binauralOscLeft.stop();
        this.binauralOscRight?.stop();
      } catch {}
    }
    this.binauralOscLeft = null;
    this.binauralOscRight = null;
    this.isBinauralPlaying = false;
  }

  // Earth & VR Soundscape Synthesizer: Rain, Forest, Ocean, Stadium Crowd, Family Gathering
  public setSoundscape(mode: string) {
    this.currentSoundscape = mode;
    const ctx = this.initCtx();
    if (this.soundscapeSource) {
      try {
        this.soundscapeSource.stop();
      } catch {}
      this.soundscapeSource = null;
    }

    if (mode === 'off' || !mode) return;

    try {
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const t = i / ctx.sampleRate;
        if (mode === 'rainforest' || mode === 'rain') {
          // Pink rainfall spectrum with gentle patter modulation
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.11;
        } else if (mode === 'ocean') {
          // Deep rhythmic ocean surf wave (0.25 Hz wave period)
          const envelope = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 0.5), 2);
          b0 = 0.992 * b0 + white * 0.045;
          output[i] = b0 * envelope * 0.24;
        } else if (mode === 'stadium') {
          // Live stadium crowd roar & match atmosphere swell
          const roarSwell = 0.6 + 0.4 * Math.sin(t * Math.PI * 0.8) * Math.cos(t * 2.1);
          b0 = 0.985 * b0 + white * 0.07;
          b1 = 0.96 * b1 + white * 0.05;
          output[i] = (b0 + b1 * 0.5) * roarSwell * 0.16;
        } else if (mode === 'family') {
          // Warm acoustic gathering murmur & gentle coastal breeze
          const warmWave = 0.5 + 0.5 * Math.sin(t * 1.5);
          b0 = 0.994 * b0 + white * 0.035;
          output[i] = b0 * warmWave * 0.14;
        } else {
          // Forest / Alpine canopy breeze
          const breeze = 0.45 + 0.55 * Math.sin(t * 0.9);
          b0 = 0.995 * b0 + white * 0.03;
          output[i] = b0 * breeze * 0.15;
        }
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const filter = ctx.createBiquadFilter();
      if (mode === 'rainforest' || mode === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 1150;
      } else if (mode === 'ocean') {
        filter.type = 'lowpass';
        filter.frequency.value = 460;
      } else if (mode === 'stadium') {
        filter.type = 'bandpass';
        filter.frequency.value = 680;
        filter.Q.value = 0.7;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 620;
      }

      this.soundscapeGain = ctx.createGain();
      this.soundscapeGain.gain.setValueAtTime(0.06, ctx.currentTime);

      noiseNode.connect(filter);
      filter.connect(this.soundscapeGain);
      this.soundscapeGain.connect(ctx.destination);

      noiseNode.start();
      this.soundscapeSource = noiseNode;
    } catch (e) {
      console.warn('Failed to start soundscape:', e);
    }
  }

  // Automatic Voice Narration when an Astronaut, Crew Medical Officer, or Flight Commander logs into the Pod
  public speakPodWelcome(astronaut: AstronautProfile) {
    let roleTitle = 'Astronaut';
    if (astronaut.role === 'CMO') {
      roleTitle = 'Crew Medical Officer';
    } else if (astronaut.role === 'FLIGHT_COMMANDER') {
      roleTitle = 'Flight Commander';
    }

    const welcomeScript = `Welcome to the ARES Habitat Pod, ${roleTitle} ${astronaut.name}. Biotelemetry, circadian phototherapy, and virtual Earth environments are online. How can I help you and the crew today?`;
    this.speakNarration(welcomeScript, 0.98);
  }

  // System Text-To-Speech Narration
  public speakNarration(text: string, rate: number = 0.98) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const triggerSpeak = () => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 0.96;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Victoria') ||
              v.name.includes('Zira') ||
              v.name.includes('Female'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferred) {
          utterance.voice = preferred;
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        triggerSpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      setTimeout(triggerSpeak, 250);
    } else {
      triggerSpeak();
    }
  }

  public stopNarration() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
