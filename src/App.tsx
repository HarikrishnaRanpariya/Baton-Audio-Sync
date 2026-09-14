import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserProfile,
  RoomData,
  PlaybackState,
  SongItem,
  DeviceMode,
} from './types';
import { AudioPlayer } from './components/AudioPlayer';
import { BatonManager } from './components/BatonManager';
import { MusicSearchModal } from './components/MusicSearchModal';
import { GroupMembersModal } from './components/GroupMembersModal';
import { ReactNativeExportModal } from './components/ReactNativeExportModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginModal } from './components/LoginModal';
import { MobileDeviceSimulator } from './components/MobileDeviceSimulator';
import { ChatAndReactions } from './components/ChatAndReactions';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { InAppNotificationToast } from './components/InAppNotificationToast';
import { AmbientBackground } from './components/AmbientBackground';
import { MasterQueueView } from './components/MasterQueueView';
import {
  sendAlert,
  getNativeNotificationPermission,
  NotificationPermissionStatus,
} from './services/notificationService';
import {
  Radio,
  Users,
  Smartphone,
  Apple,
  Monitor,
  Code2,
  Share2,
  Sparkles,
  Crown,
  LogOut,
  ShieldAlert,
  Search,
  Bell,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_KEY_USER = 'baton_audio_user_profile';

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Target room from URL or default
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'groove-402';
  });

  // Room authoritative state
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Device Frame View
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('responsive');

  // Modals
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [musicSearchTab, setMusicSearchTab] = useState<'search' | 'local' | 'url' | 'ai' | 'playlists'>('search');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(!currentUser);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermissionStatus>(
    getNativeNotificationPermission
  );

  // Ambient Background Mode State
  const [ambientMode, setAmbientMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('baton_ambient_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAmbientMode = useCallback(() => {
    setAmbientMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('baton_ambient_mode', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: 'A' to toggle ambient mode, 'Escape' to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showMusicSearch ||
        showMembersModal ||
        showExportModal ||
        showLoginModal ||
        showNotificationModal
      ) {
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        toggleAmbientMode();
      } else if (e.key === 'Escape' && ambientMode) {
        setAmbientMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ambientMode, toggleAmbientMode, showMusicSearch, showMembersModal, showExportModal, showLoginModal, showNotificationModal]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // References to detect state changes for native push notifications
  const prevBatonOwnerRef = useRef<string | null>(null);
  const prevSongKeyRef = useRef<string | null>(null);
  const isInitialSyncRef = useRef<boolean>(true);

  // Refresh permission status when modal opens/closes
  useEffect(() => {
    setNotificationPerm(getNativeNotificationPermission());
  }, [showNotificationModal]);

  // Monitor room changes for native push notifications
  useEffect(() => {
    if (!roomData || !currentUser) return;

    // 1. Alert when Baton Request is Granted to the current user
    const currentBatonOwnerId = roomData.baton.currentOwnerId;
    if (
      prevBatonOwnerRef.current !== null &&
      prevBatonOwnerRef.current !== currentBatonOwnerId &&
      currentBatonOwnerId === currentUser.id
    ) {
      sendAlert({
        title: '👑 You Have The Baton!',
        body: `You are now the DJ in ${roomData.name}! Pick songs or control playback for the room.`,
        type: 'baton',
        tag: 'baton-granted',
        onClick: () => {
          setShowMusicSearch(true);
        },
      });
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#3b82f6', '#10b981'],
      });
    }
    prevBatonOwnerRef.current = currentBatonOwnerId;

    // 2. Alert when a new song starts playing in the room
    const currentSong = roomData.playback.currentSong;
    if (currentSong) {
      const songKey = `${currentSong.id || currentSong.videoId}`;
      if (!isInitialSyncRef.current) {
        if (prevSongKeyRef.current !== songKey) {
          sendAlert({
            title: `🎵 Now Playing: ${currentSong.title}`,
            body: `${currentSong.artist} • Queued by ${currentSong.addedByName || 'DJ'}`,
            type: 'song',
            icon: currentSong.thumbnail,
            tag: `song-${currentSong.videoId || currentSong.id}`,
          });
        }
      } else {
        isInitialSyncRef.current = false;
      }
      prevSongKeyRef.current = songKey;
    }
  }, [roomData, currentUser]);

  // Sync current user to localStorage
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    socketRef.current?.close();
    socketRef.current = null;
    setRoomData(null);
    setIsConnected(false);
    setIsPendingApproval(false);
    localStorage.removeItem(STORAGE_KEY_USER);
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  // Connect to WebSocket Server
  const connectWebSocket = useCallback(() => {
    if (!currentUser) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join room
      ws.send(
        JSON.stringify({
          type: 'room:join',
          roomId,
          user: currentUser,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'room:sync') {
          setRoomData(message.data);
          setIsPendingApproval(false);
        } else if (message.type === 'room:pending_approval') {
          setIsPendingApproval(true);
        } else if (message.type === 'room:removed' || message.type === 'room:deleted') {
          window.alert(message.message);
          setRoomData(null);
          setShowMembersModal(false);
          localStorage.removeItem(STORAGE_KEY_USER);
          setCurrentUser(null);
          setShowLoginModal(true);
          ws.close();
        } else if (message.type === 'notification:toast') {
          sendAlert({
            title: message.title || 'Room Queue Alert',
            body: message.message,
            type: message.level === 'warning' ? 'warning' : 'queue',
          });
        } else if (message.type === 'chat:new') {
          setRoomData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              chat: [...prev.chat.slice(-50), message.data],
            };
          });

          // Trigger reaction visual if reaction type
          if (message.data.type === 'reaction') {
            confetti({
              particleCount: 20,
              spread: 50,
              origin: { y: 0.7 },
            });
          }
        }
      } catch (err) {
        console.error('WebSocket receive error:', err);
      }
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) return;
      setIsConnected(false);
      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 2500);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
    };
  }, [currentUser, roomId]);

  useEffect(() => {
    if (currentUser) {
      connectWebSocket();
    }
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [currentUser, roomId, connectWebSocket]);

  // Actions dispatched to WebSocket Server
  const sendSocketEvent = (type: string, data?: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && currentUser) {
      socketRef.current.send(
        JSON.stringify({
          type,
          roomId,
          user: currentUser,
          data,
        })
      );
    }
  };

  // Baton Actions
  const handleRequestBaton = () => {
    sendSocketEvent('baton:request');
  };

  const handleCancelBatonRequest = () => {
    sendSocketEvent('baton:cancel_request');
  };

  const handlePassBatonNext = () => {
    sendSocketEvent('baton:pass_next');
  };

  const handleReleaseBaton = () => {
    sendSocketEvent('baton:release');
  };

  const handleClaimBaton = () => {
    sendSocketEvent('baton:claim');
  };

  // Playback updates (Only permitted by Baton Owner)
  const handlePlaybackUpdate = (update: Partial<PlaybackState>) => {
    sendSocketEvent('playback:update', update);
  };

  // Song selection & Queue operations
  const handleSelectSong = (song: SongItem, playImmediately: boolean) => {
    const isBatonUnclaimed = !roomData?.baton.currentOwnerId;
    const canTakePlayback = hasBaton || isBatonUnclaimed || isSoloMember;

    if (playImmediately && canTakePlayback) {
      if (!hasBaton) {
        sendSocketEvent('baton:claim');
      }
      sendSocketEvent('playback:update', {
        song,
        isPlaying: true,
        currentTime: 0,
        duration: song.duration,
      });
    } else {
      // Send to server to append to Master Queue with duplicate verification
      sendSocketEvent('queue:add_song', { song });
      if (playImmediately && !canTakePlayback) {
        sendSocketEvent('baton:request');
      }
    }
  };

  const handleAddMultipleToQueue = (songs: SongItem[]) => {
    songs.forEach((song) => {
      sendSocketEvent('queue:add_song', { song });
    });
  };

  // Next track advancement (plays in order queue, supporting circular buffer lock)
  const handleNextTrack = () => {
    sendSocketEvent('queue:next_track');
  };

  // Queue & Playlist operations
  const handleToggleQueueLock = () => {
    sendSocketEvent('queue:toggle_lock');
  };

  const handleRemoveSongFromQueue = (songId: string) => {
    sendSocketEvent('queue:remove_song', { songId });
  };

  const handleReorderQueue = (newQueue: SongItem[]) => {
    sendSocketEvent('queue:reorder', { queue: newQueue });
  };

  const handleSaveAsPlaylist = (title: string, songs?: SongItem[]) => {
    sendSocketEvent('playlist:create', {
      title,
      songs: songs || roomData?.masterQueue || [],
    });
  };

  const handleLoadPlaylist = (playlistId: string, mode: 'replace' | 'append') => {
    sendSocketEvent('playlist:load', { playlistId, mode });
  };

  const handleDeletePlaylist = (playlistId: string) => {
    sendSocketEvent('playlist:delete', { playlistId });
  };

  // Group membership approvals
  const handleApproveMember = (targetUserId: string) => {
    sendSocketEvent('room:approve_member', { targetUserId });
  };

  const handleRejectMember = (targetUserId: string) => {
    sendSocketEvent('room:reject_member', { targetUserId });
  };

  const handleRemoveMember = (targetUserId: string) => {
    sendSocketEvent('room:remove_member', { targetUserId });
  };

  const handleDeleteRoom = () => {
    sendSocketEvent('room:delete');
  };

  // Chat message
  const handleSendMessage = (text: string, type: 'chat' | 'reaction' = 'chat') => {
    sendSocketEvent('chat:send', { text, type });
  };

  const hasBaton = roomData?.baton.currentOwnerId === currentUser?.id;
  const isHost = roomData?.hostId === currentUser?.id;
  const isSoloMember = Boolean(roomData && roomData.members.length <= 1);

  const mainContent = (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 space-y-5 relative z-10">
      {/* Pending Approval Banner for Private Rooms */}
      {isPendingApproval && (
        <div className="p-4 rounded-2xl bg-purple-900/25 border border-purple-500/40 text-purple-200 flex items-center gap-3 backdrop-blur-md">
          <ShieldAlert className="w-6 h-6 text-purple-400 shrink-0" />
          <div className="text-xs">
            <strong className="block text-white font-bold text-sm">Join Request Submitted</strong>
            This is a private room. Your request has been sent to the group host. You will automatically enter when approved!
          </div>
        </div>
      )}

      {/* Main Synchronized Audio Player */}
      {roomData && (
        <AudioPlayer
          playback={roomData.playback}
          hasBaton={hasBaton}
          batonOwnerName={roomData.baton.currentOwnerName}
          onPlaybackUpdate={handlePlaybackUpdate}
          onNextTrack={handleNextTrack}
          isAmbientActive={ambientMode}
          onToggleAmbient={toggleAmbientMode}
          onClaimBaton={handleClaimBaton}
          onRequestBaton={handleRequestBaton}
          isSoloMember={isSoloMember}
        />
      )}

      {/* Master Song Queue (Shared across all members, circular buffer lock, duplicate prevention) */}
      {roomData && currentUser && (
        <MasterQueueView
          queue={roomData.masterQueue || []}
          isLocked={Boolean(roomData.isQueueLocked)}
          currentPlayback={roomData.playback}
          playlists={roomData.playlists || []}
          activePlaylistId={roomData.activePlaylistId}
          hasBaton={hasBaton}
          currentUserId={currentUser.id}
          onToggleLock={handleToggleQueueLock}
          onRemoveSong={handleRemoveSongFromQueue}
          onReorderQueue={handleReorderQueue}
          onOpenMusicSearch={(tab) => {
            setMusicSearchTab(tab || 'search');
            setShowMusicSearch(true);
          }}
          onSaveAsPlaylist={handleSaveAsPlaylist}
          onLoadPlaylist={handleLoadPlaylist}
          onPlaySongNow={(song) => handleSelectSong(song, true)}
        />
      )}

      {/* Quick Track Selection & AI Music Discovery Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 md:p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-md shadow-purple-500/10">
            <Search className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {hasBaton ? 'You have the DJ Baton' : 'Group Music Discovery'}
            </h3>
            <p className="text-xs text-white/50 truncate">
              Add songs to Master Queue • AI Mood/Culture curation • Group playlists
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="open-local-upload-button"
            onClick={() => {
              setMusicSearchTab('local');
              setShowMusicSearch(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/15"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload MP3</span>
          </button>

          <button
            id="open-ai-generator-button"
            onClick={() => {
              setMusicSearchTab('ai');
              setShowMusicSearch(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/40 hover:to-purple-600/40 border border-pink-500/40 text-pink-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-pink-600/15"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>AI Playlist DJ</span>
          </button>

          <button
            id="open-music-catalog-button"
            onClick={() => {
              setMusicSearchTab('search');
              setShowMusicSearch(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </button>
        </div>
      </div>

      {/* The Baton Manager (FIFO Queue & Control) */}
      {roomData && currentUser && (
        <BatonManager
          baton={roomData.baton}
          currentUser={currentUser}
          members={roomData.members}
          onRequestBaton={handleRequestBaton}
          onCancelRequest={handleCancelBatonRequest}
          onPassBatonNext={handlePassBatonNext}
          onReleaseBaton={handleReleaseBaton}
          onClaimBaton={handleClaimBaton}
          onOpenMusicSearch={() => setShowMusicSearch(true)}
          onOpenNotificationSettings={() => setShowNotificationModal(true)}
        />
      )}

      {/* Chat and Synchronized Reactions */}
      {roomData && currentUser && (
        <ChatAndReactions
          chat={roomData.chat}
          currentUser={currentUser}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Subtle Animated Abstract Pattern Ambient Background */}
      <AmbientBackground
        isActive={ambientMode}
        isPlaying={Boolean(roomData?.playback.isPlaying)}
        onToggle={toggleAmbientMode}
      />

      {/* Immersive Ambient Glow Orbs (Active in normal mode, replaced by abstract canvas in ambient mode) */}
      {!ambientMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-purple-600/10 to-transparent" />
        </div>
      )}

      {/* Top Universal App Header */}
      <header
        className={`sticky top-0 z-40 w-full h-16 bg-black/40 border-b border-white/10 backdrop-blur-md flex items-center transition-all duration-700 ${
          ambientMode
            ? 'opacity-35 hover:opacity-100 focus-within:opacity-100'
            : 'opacity-100'
        }`}
      >
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 flex items-center justify-between gap-3">
          {/* Brand & Room Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20 flex items-center justify-center text-white font-bold">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base md:text-lg tracking-tight text-white">
                  BATON <span className="text-purple-400">AUDIO</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <p className="text-[10px] font-mono text-white/50 leading-none">
                Room: {roomData?.name || roomId}
              </p>
            </div>
          </div>

          {/* Center Platform Mode Simulator Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-full">
            <button
              onClick={() => setDeviceMode('iphone')}
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition ${
                deviceMode === 'iphone'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              iPhone 16
            </button>
            <button
              onClick={() => setDeviceMode('android')}
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition ${
                deviceMode === 'android'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Pixel 9
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition ${
                deviceMode === 'responsive'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Studio View
            </button>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            {/* Ambient Background Toggle */}
            <button
              id="toggle-ambient-bg-button"
              onClick={toggleAmbientMode}
              title={
                ambientMode
                  ? "Exit Ambient Background (Press 'A' or Esc)"
                  : "Turn on Ambient Background (Press 'A')"
              }
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                ambientMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 ring-1 ring-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  ambientMode ? 'text-amber-300 animate-spin' : 'text-purple-400'
                }`}
              />
              <span className="hidden sm:inline">Ambient</span>
              {ambientMode && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Native App Stores & APK Packaging Center */}
            <button
              id="open-rn-export-button"
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-200 font-semibold text-xs border border-purple-500/40 flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition cursor-pointer shrink-0"
              title="Open Mobile App Store & Android APK / iOS IPA Packaging Center"
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">App Stores & APK</span>
              <span className="sm:hidden">App Stores</span>
            </button>
            <PWAInstallButton />

            {/* Push Notifications Settings Trigger */}
            <button
              id="open-notifications-button"
              onClick={() => setShowNotificationModal(true)}
              title="Native Push Notifications & Alerts"
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative"
            >
              <Bell className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Alerts</span>
              {notificationPerm === 'granted' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>

            {/* Room Members & Share */}
            <button
              id="open-members-button"
              onClick={() => setShowMembersModal(true)}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>{roomData?.members.length || 1}</span>
              {roomData && roomData.pendingMembers.length > 0 && isHost && (
                <span className="w-2 h-2 rounded-full bg-pink-500 absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </button>

            {/* Current User Chip */}
            {currentUser && (
              <>
                <button
                  onClick={handleLogout}
                  title="Exit room and log out"
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit room</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  title="Switch profile or room"
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition"
                >
                  <span className="text-sm">{currentUser.avatar}</span>
                  <span className="text-xs font-semibold text-purple-300 hidden sm:inline max-w-[80px] truncate">
                    {currentUser.name}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Body with Mobile Device Simulator wrapper */}
      <main
        className={`flex-1 flex flex-col relative z-10 transition-all duration-700 ${
          ambientMode
            ? 'opacity-35 hover:opacity-100 focus-within:opacity-100'
            : 'opacity-100'
        }`}
      >
        <MobileDeviceSimulator deviceMode={deviceMode} onSelectMode={setDeviceMode}>
          {mainContent}
        </MobileDeviceSimulator>
      </main>

      {/* Immersive Theme Footer */}
      <footer
        className={`h-12 bg-black/60 border-t border-white/10 px-4 md:px-8 flex items-center justify-between text-[10px] font-mono text-white/40 z-10 select-none transition-all duration-700 ${
          ambientMode ? 'opacity-25 hover:opacity-100' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">STORE READY: GOOGLE PLAY (.AAB) & APPLE APP STORE (.IPA)</span>
          <button
            onClick={() => setShowPrivacyPolicyModal(true)}
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition cursor-pointer font-sans text-xs font-medium"
          >
            Privacy Policy & Data Deletion
          </button>
        </div>
        <div className="hidden md:inline">ENCRYPTED STREAM • ZERO TRACKING</div>
        <div>V1.0 STORE COMPLIANT</div>
      </footer>

      {/* Modals */}
      {showMusicSearch && roomData && currentUser && (
        <MusicSearchModal
          hasBaton={hasBaton}
          onSelectSong={handleSelectSong}
          onAddMultipleToQueue={handleAddMultipleToQueue}
          onClose={() => setShowMusicSearch(false)}
          playlist={roomData.masterQueue || roomData.playlist || []}
          playlists={roomData.playlists || []}
          onSaveAsPlaylist={handleSaveAsPlaylist}
          onLoadPlaylist={handleLoadPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          currentSongId={roomData.playback.currentSong?.id}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          initialTab={musicSearchTab}
        />
      )}

      {showMembersModal && roomData && (
        <GroupMembersModal
          roomId={roomData.id}
          roomName={roomData.name}
          isPrivate={roomData.isPrivate}
          pin={roomData.pin}
          isHost={isHost}
          members={roomData.members}
          pendingMembers={roomData.pendingMembers}
          batonOwnerId={roomData.baton.currentOwnerId}
          onApproveMember={handleApproveMember}
          onRejectMember={handleRejectMember}
          onRemoveMember={handleRemoveMember}
          onDeleteRoom={handleDeleteRoom}
          onClose={() => setShowMembersModal(false)}
        />
      )}

      {showExportModal && (
        <ReactNativeExportModal
          onClose={() => setShowExportModal(false)}
          onOpenPrivacyPolicy={() => {
            setShowExportModal(false);
            setShowPrivacyPolicyModal(true);
          }}
        />
      )}

      {showPrivacyPolicyModal && (
        <PrivacyPolicyModal
          onClose={() => setShowPrivacyPolicyModal(false)}
          onClearData={() => {
            setCurrentUser(null);
          }}
        />
      )}

      <OfflineIndicator />

      {/* Push Notification Alerts Preferences Modal */}
      {showNotificationModal && (
        <NotificationSettingsModal
          onClose={() => setShowNotificationModal(false)}
          onOpenMusicSearch={() => {
            setShowNotificationModal(false);
            setShowMusicSearch(true);
          }}
        />
      )}

      {/* In-App Non-Intrusive Notification Toasts */}
      <InAppNotificationToast
        onOpenMusicSearch={() => setShowMusicSearch(true)}
      />

      {showLoginModal && (
        <LoginModal
          defaultRoomId={roomId}
          onLogin={handleLogin}
          onJoinRoom={(newRoomId) => {
            setRoomId(newRoomId);
            window.history.replaceState(null, '', `?room=${newRoomId}`);
          }}
          onCreateRoom={(name, isPrivate, pin) => {
            const newRoomId = 'room-' + Math.random().toString(36).substring(2, 7);
            setRoomId(newRoomId);
            window.history.replaceState(null, '', `?room=${newRoomId}`);
            if (currentUser) {
              fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, isPrivate, pin, host: currentUser }),
              }).catch(console.error);
            }
          }}
        />
      )}
    </div>
  );
}
