import React, { useState, useEffect } from 'react';
import { BatonState, UserProfile, RoomMember } from '../types';
import { Crown, Hand, ArrowRight, CheckCircle2, Clock, Users2, ShieldAlert, Sparkles, X, Bell, BellRing, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  NotificationPermissionStatus,
  saveNotificationSettings,
  sendAlert,
} from '../services/notificationService';

interface BatonManagerProps {
  baton: BatonState;
  currentUser: UserProfile;
  members?: RoomMember[];
  onRequestBaton: () => void;
  onCancelRequest: () => void;
  onPassBatonNext: () => void;
  onClaimBaton: () => void;
  onOpenMusicSearch: () => void;
  onOpenNotificationSettings?: () => void;
}

export const BatonManager: React.FC<BatonManagerProps> = ({
  baton,
  currentUser,
  members = [],
  onRequestBaton,
  onCancelRequest,
  onPassBatonNext,
  onClaimBaton,
  onOpenMusicSearch,
  onOpenNotificationSettings,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(
    getNativeNotificationPermission
  );

  useEffect(() => {
    setPermission(getNativeNotificationPermission());
  }, []);

  const handleEnableAlerts = async () => {
    const res = await requestNativeNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      saveNotificationSettings({ enabled: true, alertOnBatonGranted: true });
      sendAlert({
        title: '🔔 Baton Alerts Enabled!',
        body: 'You will receive an instant native notification the moment you are granted the baton.',
        type: 'baton',
      });
    }
  };

  const hasBaton = baton.currentOwnerId === currentUser.id;
  const isQueued = baton.queue.some((q) => q.userId === currentUser.id);
  const myQueueIndex = baton.queue.findIndex((q) => q.userId === currentUser.id);
  const queuePosition = myQueueIndex !== -1 ? myQueueIndex + 1 : null;

  // Check if current user is the sole member or if current owner is offline/orphaned
  const isSoloMember = members.length <= 1;
  const isOwnerActive = baton.currentOwnerId
    ? members.some((m) => m.id === baton.currentOwnerId)
    : false;
  const canInstantClaim = !hasBaton && (!baton.currentOwnerId || !isOwnerActive || isSoloMember);

  const handlePassWithConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#10b981'],
    });
    onPassBatonNext();
  };

  const nextRequester = baton.queue.length > 0 ? baton.queue[0] : null;

  return (
    <div id="baton-manager-card" className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl text-white space-y-4">
      {/* Header with FIFO Rule Highlight */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-600/10">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              The Song Baton
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                {isSoloMember ? 'Direct Control' : 'First-Come First-Served'}
              </span>
            </h3>
            <p className="text-xs text-white/50">
              {isSoloMember
                ? 'You are the only member in this room. You have full DJ control.'
                : 'Only the baton holder can select, play, and pause music for everyone.'}
            </p>
          </div>
        </div>

        {onOpenNotificationSettings && (
          <button
            id="baton-notifications-button"
            onClick={onOpenNotificationSettings}
            title="Notification Alerts Settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-purple-300 transition cursor-pointer border border-white/5 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Push Alerts</span>
          </button>
        )}
      </div>

      {/* Solo Member Banner when not yet holding baton */}
      {isSoloMember && !hasBaton && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-200 min-w-0">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate sm:whitespace-normal">
              You are the only person in this room. Claim the baton to start playing!
            </span>
          </div>
          <button
            id="claim-solo-baton-button"
            onClick={onClaimBaton}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shrink-0 transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            Take Baton Now
          </button>
        </div>
      )}

      {/* Orphaned Owner Warning Banner */}
      {!isSoloMember && !isOwnerActive && !hasBaton && baton.currentOwnerId && (
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-200 min-w-0">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              The previous baton holder left the session. The baton is ready to be claimed!
            </span>
          </div>
          <button
            id="claim-orphaned-baton-button"
            onClick={onClaimBaton}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 transition cursor-pointer shadow-md shadow-purple-600/30"
          >
            Claim Baton
          </button>
        </div>
      )}

      {/* When queued: notification reminder so user never misses their turn */}
      {isQueued && (
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-200 min-w-0">
            <BellRing className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              {permission === 'granted'
                ? 'Push alerts active: You will be notified the instant the baton is passed to you.'
                : 'Enable browser push alerts to be notified the moment it is your turn.'}
            </span>
          </div>
          {permission !== 'granted' ? (
            <button
              id="enable-queue-alerts-button"
              onClick={handleEnableAlerts}
              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 transition cursor-pointer shadow-md shadow-purple-600/30"
            >
              Turn On Alerts
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400 font-semibold shrink-0">
              ✓ Active
            </span>
          )}
        </div>
      )}

      {/* Current Baton Holder Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          hasBaton
            ? 'bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-transparent border-purple-500/50 shadow-lg shadow-purple-500/10'
            : baton.currentOwnerId && isOwnerActive
            ? 'bg-white/5 border-white/10'
            : 'bg-purple-950/20 border-purple-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md ${
              hasBaton
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold ring-2 ring-purple-400'
                : 'bg-white/10 border border-white/10'
            }`}>
              {hasBaton ? '👑' : '🎧'}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Current Baton Holder
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                {hasBaton ? (
                  <span className="text-purple-300 font-extrabold flex items-center gap-1.5">
                    You Have The Baton!
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </span>
                ) : isOwnerActive ? (
                  baton.currentOwnerName || 'Active DJ'
                ) : (
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    Nobody (Baton is Free!)
                    <Zap className="w-4 h-4 text-amber-400" />
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {hasBaton
                  ? 'You are the DJ. Pick songs, scrub, or pass to the next requester.'
                  : canInstantClaim
                  ? 'No active DJ is holding the baton. Click below to claim it now!'
                  : 'Listen to their choices or queue up to get the next turn.'}
              </p>
            </div>
          </div>

          {/* Action Trigger in Banner */}
          <div className="flex items-center gap-2">
            {hasBaton ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="pick-music-button"
                  onClick={onOpenMusicSearch}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-purple-300 font-semibold text-xs border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Choose Song
                </button>
                <button
                  id="pass-baton-button"
                  onClick={handlePassWithConfetti}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  {nextRequester
                    ? `Pass to ${nextRequester.userName} (FIFO)`
                    : 'Release Baton'}
                </button>
              </div>
            ) : canInstantClaim ? (
              <button
                id="claim-baton-button"
                onClick={onClaimBaton}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/25 transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                {isSoloMember ? 'Take Baton (You are DJ)' : 'Claim Open Baton'}
              </button>
            ) : isQueued ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  You are #{queuePosition} in Line
                </span>
                <button
                  id="cancel-baton-request-button"
                  onClick={onCancelRequest}
                  title="Leave queue"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/50 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="ask-baton-button"
                onClick={onRequestBaton}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/10"
              >
                <Hand className="w-4 h-4" />
                Ask for Baton (Queue Up)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live FIFO Queue List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-purple-400" />
            Baton Request Queue ({baton.queue.length})
          </div>
          <span className="text-[11px] text-white/40">
            Fair rotation: First in, first out
          </span>
        </div>

        {baton.queue.length === 0 ? (
          <div className="text-center py-4 px-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-white/40">
            No one is currently waiting in line. Tap &ldquo;Ask for Baton&rdquo; to be the next DJ!
          </div>
        ) : (
          <div className="space-y-2">
            {baton.queue.map((item, idx) => {
              const isMe = item.userId === currentUser.id;
              const isNext = idx === 0;

              return (
                <div
                  key={item.userId}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition ${
                    isMe
                      ? 'bg-purple-600/15 border-purple-500/40 text-purple-200'
                      : 'bg-white/5 border-white/5 text-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                        isNext
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-base">{item.avatar}</span>
                    <span className="text-xs font-semibold">
                      {item.userName} {isMe && '(You)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isNext && (
                      <span className="text-[11px] font-bold text-purple-300 bg-purple-600/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                        Up Next
                      </span>
                    )}
                    {isMe && (
                      <button
                        onClick={onCancelRequest}
                        className="text-[11px] text-white/40 hover:text-pink-400 font-medium ml-2 underline cursor-pointer"
                      >
                        Leave Queue
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
