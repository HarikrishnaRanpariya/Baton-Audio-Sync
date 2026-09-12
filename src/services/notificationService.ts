import { NotificationSettings } from '../types';

const STORAGE_KEY_SETTINGS = 'baton_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  alertOnBatonGranted: true,
  alertOnNewSong: true,
  soundEnabled: true,
};

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  type: 'baton' | 'song' | 'queue' | 'warning' | 'info';
  icon?: string;
  timestamp: number;
}

// In-app alert listeners
type AlertListener = (alert: InAppAlert) => void;
const listeners = new Set<AlertListener>();

export function subscribeToInAppAlerts(listener: AlertListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitInAppAlert(alert: InAppAlert) {
  listeners.forEach((listener) => {
    try {
      listener(alert);
    } catch (e) {
      console.error('Error in alert listener', e);
    }
  });
}

// Local storage settings
export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save notification settings', e);
  }
  return updated;
}

// Check native Notification API permission
export function getNativeNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return window.Notification.permission as NotificationPermissionStatus;
}

// Request permission from browser
export async function requestNativeNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    // In modern browsers, Notification.requestPermission() returns a Promise
    const permission = await window.Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (err) {
    // Fallback for older Safari or callback-based browsers
    try {
      return new Promise<NotificationPermissionStatus>((resolve) => {
        window.Notification.requestPermission((status) => {
          resolve(status as NotificationPermissionStatus);
        });
      });
    } catch (callbackErr) {
      console.warn('Notification permission request failed or restricted in this frame:', callbackErr);
      return 'unsupported';
    }
  }
}

// Audio synthesizer for notification chimes (gentle harmonic cues)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationChime(type: 'baton' | 'song' | 'queue' | 'warning' | 'info') {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'baton') {
      // Ascending triumphant harp chord (C5, E5, G5, C6) for receiving the DJ Baton
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } else {
      // Warm modern two-note marimba chime (A4, C#5) for new song
      const notes = [440, 554.37];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    }
  } catch (e) {
    console.warn('Audio chime playback suppressed by browser policy:', e);
  }
}

export interface SendAlertParams {
  title: string;
  body: string;
  type: 'baton' | 'song' | 'queue' | 'warning' | 'info';
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function sendAlert({ title, body, type, icon, tag, onClick }: SendAlertParams) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  // Check specific category preference
  if (type === 'baton' && !settings.alertOnBatonGranted) return;
  if (type === 'song' && !settings.alertOnNewSong) return;

  // Play audio chime if enabled
  if (settings.soundEnabled) {
    playNotificationChime(type);
  }

  // Always emit an in-app alert banner
  emitInAppAlert({
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    type,
    icon,
    timestamp: Date.now(),
  });

  // Native Browser Notification
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (window.Notification.permission === 'granted') {
        const notification = new window.Notification(title, {
          body,
          icon: icon || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=192&auto=format&fit=crop&q=80',
          badge: icon || undefined,
          tag: tag || `baton-${type}`,
          // Some browsers support vibrate array
          ...(typeof navigator !== 'undefined' && 'vibrate' in navigator
            ? { vibrate: type === 'baton' ? [200, 100, 200] : [100, 50, 100] }
            : {}),
        } as any);

        notification.onclick = (event) => {
          try {
            window.focus();
          } catch {}
          if (onClick) onClick();
          notification.close();
        };
      }
    } catch (err) {
      console.warn('Native notification failed or restricted by browser:', err);
    }
  }
}
