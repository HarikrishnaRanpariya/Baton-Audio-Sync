import React, { useState, useEffect } from 'react';
import { subscribeToInAppAlerts, InAppAlert } from '../services/notificationService';
import { Crown, Music, X, Bell, AlertCircle, ListMusic } from 'lucide-react';

interface InAppNotificationToastProps {
  onOpenMusicSearch?: () => void;
}

export const InAppNotificationToast: React.FC<InAppNotificationToastProps> = ({
  onOpenMusicSearch,
}) => {
  const [currentAlert, setCurrentAlert] = useState<InAppAlert | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToInAppAlerts((alert) => {
      setCurrentAlert(alert);
      const timer = setTimeout(() => {
        setCurrentAlert((prev) => (prev?.id === alert.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!currentAlert) return null;

  return (
    <aside
      aria-label="Room Alert Notification"
      id="in-app-notification-toast"
      className="fixed top-18 right-4 md:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div
        onClick={() => {
          if (currentAlert.type === 'baton' && onOpenMusicSearch) {
            onOpenMusicSearch();
          }
          setCurrentAlert(null);
        }}
        className="cursor-pointer p-4 rounded-2xl bg-[#0e0e18]/95 border border-purple-500/30 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl text-white flex items-start gap-3.5 hover:border-purple-500/50 transition relative group"
      >
        {/* Glow accent */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition pointer-events-none" />

        {/* Leading icon or track art */}
        <div className="relative shrink-0">
          {currentAlert.icon ? (
            <img
              src={currentAlert.icon}
              alt=""
              className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : currentAlert.type === 'warning' ? (
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-md">
              <AlertCircle className="w-5 h-5" />
            </div>
          ) : currentAlert.type === 'queue' ? (
            <div className="w-11 h-11 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shadow-md">
              <ListMusic className="w-5 h-5" />
            </div>
          ) : currentAlert.type === 'baton' ? (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Crown className="w-5 h-5 fill-current" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-md">
              <Music className="w-5 h-5" />
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-[#0e0e18] flex items-center justify-center text-[9px]">
            <Bell className="w-2.5 h-2.5 text-white" />
          </span>
        </div>

        {/* Alert Body */}
        <div className="flex-1 min-w-0 pr-4 relative">
          <div className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
            {currentAlert.title}
          </div>
          <p className="text-[11px] text-white/70 mt-0.5 line-clamp-2 leading-relaxed">
            {currentAlert.body}
          </p>
          <span className="inline-block mt-1.5 text-[9px] font-mono font-medium text-purple-400/90 uppercase tracking-wider">
            {currentAlert.type === 'baton' ? 'Tap to choose next track' : 'Baton Audio Sync'}
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentAlert(null);
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
