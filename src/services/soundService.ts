/**
 * Emergency Alert Sound Generator using Web Audio API
 * Generates an authoritative emergency dispatch chime / siren beep.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playEmergencyAlertSound(isMuted = false): void {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play a sequence of 3 rapid high-urgency beeps (880Hz -> 1174Hz)
    const playBeep = (startTime: number, freq1: number, freq2: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq1, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, startTime + duration * 0.7);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Staccato dual-tone alert sequence
    playBeep(now, 880, 1174, 0.18);
    playBeep(now + 0.22, 880, 1174, 0.18);
    playBeep(now + 0.44, 987, 1318, 0.28);
  } catch {
    // Graceful fallback if audio context not allowed
  }
}

export function playSuccessChime(isMuted = false): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24); // G5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Ignore audio errors
  }
}

// Continuous Emergency Siren Alarm for RED:Critical Safety Reports
let continuousAlarmTimer: number | null = null;
let isAlarmRunning = false;
let isAlarmMuted = false;

export function startContinuousCriticalAlarm(isMuted = false): void {
  isAlarmMuted = isMuted;

  if (isAlarmRunning) {
    return;
  }
  isAlarmRunning = true;

  const playPulse = () => {
    if (!isAlarmRunning || isAlarmMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Tone 1: High-urgency ascending sweep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(950, now);
      osc1.frequency.exponentialRampToValueAtTime(1300, now + 0.22);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: Descending response tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1300, now + 0.26);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.50);

      gain2.gain.setValueAtTime(0.001, now + 0.26);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.28);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.26);
      osc2.stop(now + 0.53);
    } catch {
      // Audio fallback
    }
  };

  playPulse();
  if (continuousAlarmTimer !== null) {
    clearInterval(continuousAlarmTimer);
  }
  continuousAlarmTimer = window.setInterval(playPulse, 1300);
}

export function updateContinuousAlarmMute(isMuted: boolean): void {
  isAlarmMuted = isMuted;
}

export function stopContinuousCriticalAlarm(): void {
  isAlarmRunning = false;
  if (continuousAlarmTimer !== null) {
    clearInterval(continuousAlarmTimer);
    continuousAlarmTimer = null;
  }
}

export function isCriticalAlarmActive(): boolean {
  return isAlarmRunning && !isAlarmMuted;
}
