/**
 * Emergency Alert Sound Generator & Custom Notification Audio Player
 * Path: /notification/notification-alert.m4a
 */

export const NOTIFICATION_ALERT_AUDIO_PATH = '/notification/notification-alert.m4a';

let audioCtx: AudioContext | null = null;
let notificationAudioElement: HTMLAudioElement | null = null;

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

/**
 * Primary notification alert sound using the user's custom audio file
 * Path: public/notification/notification-alert.m4a
 */
export function playNotificationAlertSound(isMuted = false): void {
  if (isMuted || typeof window === 'undefined') return;

  try {
    if (!notificationAudioElement) {
      notificationAudioElement = new Audio(NOTIFICATION_ALERT_AUDIO_PATH);
      notificationAudioElement.preload = 'auto';
    }
    notificationAudioElement.currentTime = 0;
    notificationAudioElement.volume = 1.0;
    const playPromise = notificationAudioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Direct notification-alert.m4a playback notice:', err);
        playFallbackBeepAlert();
      });
    }
  } catch {
    playFallbackBeepAlert();
  }
}

/**
 * Emergency alert sound: plays the official notification-alert.m4a sound
 */
export function playEmergencyAlertSound(isMuted = false): void {
  playNotificationAlertSound(isMuted);
}

/**
 * Web Audio API fallback in case media audio element is blocked by browser policy
 */
function playFallbackBeepAlert(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play rapid high-urgency chime
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

    playBeep(now, 880, 1174, 0.18);
    playBeep(now + 0.22, 880, 1174, 0.18);
    playBeep(now + 0.44, 987, 1318, 0.28);
  } catch {
    // Graceful fallback
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

// Persistent Continuous Agency Sound Alarm (Requirement 4)
let persistentAgencyAudioElement: HTMLAudioElement | null = null;
let persistentAgencyTimer: number | null = null;
let isPersistentAgencyAlarmRunning = false;
let isPersistentAgencyAlarmMuted = false;

/**
 * Requirement 4: Persistent Agency Sound Alerts
 * Continuous alarm that plays /notification/notification-alert.m4a in a loop
 * until manually dismissed by Agency Admin or authorized user.
 */
export function startPersistentAgencyAlarm(isMuted = false): void {
  isPersistentAgencyAlarmMuted = isMuted;
  if (isPersistentAgencyAlarmRunning) {
    if (persistentAgencyAudioElement && !isMuted) {
      persistentAgencyAudioElement.muted = false;
      persistentAgencyAudioElement.play().catch(() => {});
    }
    return;
  }

  isPersistentAgencyAlarmRunning = true;
  if (typeof window === 'undefined') return;

  try {
    if (!persistentAgencyAudioElement) {
      persistentAgencyAudioElement = new Audio(NOTIFICATION_ALERT_AUDIO_PATH);
      persistentAgencyAudioElement.preload = 'auto';
    }
    persistentAgencyAudioElement.loop = true;
    persistentAgencyAudioElement.volume = 1.0;
    persistentAgencyAudioElement.muted = isMuted;

    if (!isMuted) {
      const p = persistentAgencyAudioElement.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('Persistent agency alarm autoplay note, falling back to pulse interval:', err);
          startPersistentPulseInterval();
        });
      }
    }
  } catch (err) {
    console.warn('Persistent agency audio error:', err);
    startPersistentPulseInterval();
  }

  // Backup loop timer: ensures continuous repeating sound every 2.2s even if loop state was interrupted
  if (persistentAgencyTimer !== null) {
    clearInterval(persistentAgencyTimer);
  }
  persistentAgencyTimer = window.setInterval(() => {
    if (!isPersistentAgencyAlarmRunning) {
      if (persistentAgencyTimer !== null) {
        clearInterval(persistentAgencyTimer);
        persistentAgencyTimer = null;
      }
      return;
    }
    if (!isPersistentAgencyAlarmMuted) {
      if (persistentAgencyAudioElement) {
        if (persistentAgencyAudioElement.paused || persistentAgencyAudioElement.ended) {
          persistentAgencyAudioElement.currentTime = 0;
          persistentAgencyAudioElement.play().catch(() => playFallbackBeepAlert());
        }
      } else {
        playFallbackBeepAlert();
      }
    }
  }, 2200);
}

function startPersistentPulseInterval(): void {
  if (persistentAgencyTimer !== null) return;
  persistentAgencyTimer = window.setInterval(() => {
    if (!isPersistentAgencyAlarmRunning) return;
    if (!isPersistentAgencyAlarmMuted) {
      playFallbackBeepAlert();
    }
  }, 1800);
}

export function updatePersistentAgencyAlarmMute(isMuted: boolean): void {
  isPersistentAgencyAlarmMuted = isMuted;
  if (persistentAgencyAudioElement) {
    persistentAgencyAudioElement.muted = isMuted;
  }
}

export function stopPersistentAgencyAlarm(): void {
  isPersistentAgencyAlarmRunning = false;
  if (persistentAgencyTimer !== null) {
    clearInterval(persistentAgencyTimer);
    persistentAgencyTimer = null;
  }
  if (persistentAgencyAudioElement) {
    try {
      persistentAgencyAudioElement.pause();
      persistentAgencyAudioElement.currentTime = 0;
      persistentAgencyAudioElement.loop = false;
    } catch {}
  }
}

export function isPersistentAgencyAlarmActive(): boolean {
  return isPersistentAgencyAlarmRunning && !isPersistentAgencyAlarmMuted;
}
