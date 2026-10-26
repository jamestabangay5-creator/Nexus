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
