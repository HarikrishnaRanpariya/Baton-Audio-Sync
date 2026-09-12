import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  X,
  Volume2,
  VolumeX,
  Crown,
  Music,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  sendAlert,
  NotificationPermissionStatus,
} from '../services/notificationService';
import { NotificationSettings } from '../types';

interface NotificationSettingsModalProps {
  onClose: () => void;
  onOpenMusicSearch?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  onClose,
  onOpenMusicSearch,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermissionStatus>(
    getNativeNotificationPermission
  );
  const [requesting, setRequesting] = useState(false);
  const [testSent, setTestSent] = useState<string | null>(null);

  useEffect(() => {
    setPermission(getNativeNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestNativeNotificationPermission();
    setPermission(result);
    setRequesting(false);

    if (result === 'granted') {
      const updated = saveNotificationSettings({ enabled: true });
      setSettings(updated);
      // Send welcoming native test alert
      sendAlert({
        title: '🔔 Notifications Enabled!',
        body: 'You will now receive native alerts when you get the DJ baton or when a new song starts.',
        type: 'baton',
      });
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const updated = saveNotificationSettings({ [key]: value });
    setSettings(updated);
  };

  const handleTestBaton = () => {
    setTestSent('baton');
    sendAlert({
      title: '👑 You Have The Baton!',
      body: 'You are now the DJ in the room. Tap to select a YouTube track or manage playback!',
      type: 'baton',
      onClick: () => {
        onClose();
        if (onOpenMusicSearch) onOpenMusicSearch();
      },
    });
    setTimeout(() => setTestSent(null), 3000);
  };

  const handleTestSong = () => {
    setTestSent('song');
    sendAlert({
      title: '🎵 Now Playing: Blinding Lights',
      body: 'The Weeknd • Queued by Jordan Beats',
      type: 'song',
      icon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      onClick: () => {
        onClose();
      },
    });
    setTimeout(() => setTestSent(null), 3000);
  };

  return (
    <div
      id="notification-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-md bg-[#0a0a12]/95 border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl relative text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Native Push Notifications
              </h2>
              <p className="text-xs text-white/50">
                Live alerts for baton handoffs & new songs
              </p>
            </div>
          </div>

          <button
            id="close-notification-modal-button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Status Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Browser Permission
            </span>
            {permission === 'granted' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Granted
              </span>
            ) : permission === 'denied' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Blocked
              </span>
            ) : permission === 'unsupported' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-500/20 text-neutral-300 border border-neutral-500/30 text-xs font-bold">
                Unsupported
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                Needs Permission
              </span>
            )}
          </div>

          {permission !== 'granted' && (
            <div>
              {permission === 'denied' ? (
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Notifications are blocked in your browser settings for this site. To enable, click the lock / tune icon in your address bar and toggle Notifications to &ldquo;Allow&rdquo;.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-white/60 leading-relaxed">
                    Allow notifications to receive background alerts even when your browser tab is minimized or inactive.
                  </p>
                  <button
                    id="request-notification-permission-button"
                    onClick={handleRequestPermission}
                    disabled={requesting}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {requesting ? 'Requesting...' : 'Enable Native Browser Notifications'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Preference Toggles */}
        <div className="mt-4 space-y-2.5">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider px-1">
            Alert Preferences
          </div>

          {/* Toggle 1: Baton Granted */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Baton Request Granted</div>
                <div className="text-[11px] text-white/50">
                  Alert immediately when you become the DJ
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alertOnBatonGranted}
                onChange={(e) => updateSetting('alertOnBatonGranted', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Toggle 2: New Song Playing */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">New Song Starts Playing</div>
                <div className="text-[11px] text-white/50">
                  Show title, artist & album art when track changes
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alertOnNewSong}
                onChange={(e) => updateSetting('alertOnNewSong', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Toggle 3: Sound Chimes */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/40" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Audio Notification Chimes</div>
                <div className="text-[11px] text-white/50">
                  Play harmonic audio tones on new events
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Live Test Notification Buttons */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wider px-1">
            Test Live Alerts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="test-baton-notification-button"
              onClick={handleTestBaton}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              {testSent === 'baton' ? 'Sent!' : 'Test Baton Alert'}
            </button>
            <button
              id="test-song-notification-button"
              onClick={handleTestSong}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pink-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Music className="w-3.5 h-3.5" />
              {testSent === 'song' ? 'Sent!' : 'Test Song Alert'}
            </button>
          </div>
        </div>

        {/* Pro-Tip footer */}
        <div className="mt-4 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[11px] text-white/60 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            Even if you switch to another tab or minimize your browser while listening, native notifications ensure you never miss your turn with the Baton or a newly queued track.
          </span>
        </div>
      </div>
    </div>
  );
};
