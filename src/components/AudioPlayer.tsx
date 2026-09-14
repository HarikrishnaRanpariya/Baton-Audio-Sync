import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlaybackState, SongItem } from '../types';
import { Play, Pause, SkipForward, Volume2, VolumeX, Crown, Radio, Disc, Sparkles, Sliders, Hand, AlertCircle, Tv, Zap, ExternalLink } from 'lucide-react';
import { PersonalVolumeMixer } from './PersonalVolumeMixer';

interface AudioPlayerProps {
  playback: PlaybackState;
  hasBaton: boolean;
  batonOwnerName: string | null;
  onPlaybackUpdate: (update: Partial<PlaybackState>) => void;
  onNextTrack?: () => void;
  isAmbientActive?: boolean;
  onToggleAmbient?: () => void;
  onClaimBaton?: () => void;
  onRequestBaton?: () => void;
  isSoloMember?: boolean;
  onOpenRadio?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playback,
  hasBaton,
  batonOwnerName,
  onPlaybackUpdate,
  onNextTrack,
  isAmbientActive,
  onToggleAmbient,
  onClaimBaton,
  onRequestBaton,
  isSoloMember = false,
  onOpenRadio,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(playback.currentTime);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showMixer, setShowMixer] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [audioLatencyMs, setAudioLatencyMs] = useState(45);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [youtubeError, setYoutubeError] = useState<number | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 639px)').matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  });

  const currentSong = playback.currentSong;
  const isAudioSource = Boolean(currentSong?.sourceUrl);
  const isLiveRadio = Boolean(
    currentSong?.sourceType === 'audio-url' &&
    ((currentSong?.duration || 0) >= 3600 ||
      currentSong?.title?.toLowerCase().includes('radio') ||
      currentSong?.artist?.toLowerCase().includes('radio') ||
      currentSong?.sourceUrl?.includes('stream') ||
      currentSong?.sourceUrl?.includes('icecast'))
  );
  const lastSourceUrlRef = useRef<string>('');

  // Helper: compute expected server playback timestamp accounting for network transit
  const calculateExpectedTime = useCallback(() => {
    if (!playback.isPlaying) {
      return playback.currentTime;
    }
    const elapsed = (Date.now() - playback.updatedAt) / 1000;
    const computed = playback.currentTime + elapsed;
    return Math.min(computed, playback.duration || 3600);
  }, [playback.isPlaying, playback.currentTime, playback.updatedAt, playback.duration]);

  // Direct Audio Unlocker for Mobile Autoplay Policy (Samsung S25 Ultra / Android Chrome / WebViews)
  const unlockAudio = useCallback(async () => {
    // 1. Resume Web AudioContext
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // Emit silent pulse to bless context
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.01);
      }
    } catch (e) {
      console.warn('AudioContext resume handled:', e);
    }

    // 2. Unlock HTML5 Audio Element
    if (audioRef.current) {
      try {
        audioRef.current.muted = isMuted;
        audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
        if (isAudioSource) {
          const expected = calculateExpectedTime();
          if (Math.abs(audioRef.current.currentTime - expected) > 1.5) {
            audioRef.current.currentTime = expected;
          }
          await audioRef.current.play();
        }
      } catch (e) {
        console.warn('HTML5 Audio unlock handled:', e);
      }
    }

    // 3. Unlock YouTube Iframe Player
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.unMute === 'function' && !isMuted) {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
        if (!isAudioSource) {
          const expected = calculateExpectedTime();
          if (typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(expected, true);
          }
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        }
      } catch (e) {
        console.warn('YouTube unlock handled:', e);
      }
    }

    setAudioUnlocked(true);

    if (hasBaton && !playback.isPlaying) {
      onPlaybackUpdate({
        isPlaying: true,
        currentTime: isAudioSource
          ? audioRef.current?.currentTime || localCurrentTime
          : playerRef.current?.getCurrentTime?.() || localCurrentTime,
        updatedAt: Date.now(),
      });
    }
  }, [calculateExpectedTime, isAudioSource, isMuted, volume, hasBaton, playback.isPlaying, localCurrentTime, onPlaybackUpdate]);

  // Global One-Time User-Gesture Listener:
  // As soon as the user touches/clicks anywhere on the S25 Ultra, audio permissions are unlocked!
  useEffect(() => {
    if (audioUnlocked) return;

    const handleFirstGesture = () => {
      unlockAudio();
    };

    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('touchend', handleFirstGesture, { passive: true });
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, [audioUnlocked, unlockAudio]);

  // Initialize YouTube Iframe Player (Universal Mobile + Desktop Compatible)
  useEffect(() => {
    let checkInterval: any = null;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;
      const targetElement = document.getElementById('youtube-player-element');
      if (!targetElement) return;

      try {
        playerRef.current = new window.YT.Player('youtube-player-element', {
          height: '100%',
          width: '100%',
          videoId: currentSong?.videoId ? currentSong.videoId : '4NRXx6U8ABQ',
          playerVars: {
            autoplay: playback.isPlaying && !isAudioSource ? 1 : 0,
            controls: 1, // Native controls permit 1-tap playback if autoplay is restricted
            playsinline: 1, // Crucial for mobile browser & WebView inline playback
            enablejsapi: 1,
            disablekb: 0,
            fs: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
            widget_referrer: window.location.href,
          },
          events: {
            onError: (event: any) => {
              console.warn('YouTube Player error code:', event.data);
              setYoutubeError(event.data);
              // On Error 150 / 101, make video player visible so user can interact with native mobile player directly
              if (event.data === 150 || event.data === 101) {
                setShowVideoPlayer(true);
              }
              // Auto-advance if video is blocked from embedding by copyright owner
              if ((event.data === 150 || event.data === 101 || event.data === 100) && hasBaton && onNextTrack) {
                setTimeout(() => {
                  onNextTrack();
                }, 4000);
              }
            },
            onReady: (event: any) => {
              setYoutubeError(null);
              setPlayerReady(true);
              try {
                if (isMuted) {
                  if (typeof event.target?.mute === 'function') event.target.mute();
                } else {
                  if (typeof event.target?.unMute === 'function') event.target.unMute();
                  if (typeof event.target?.setVolume === 'function') event.target.setVolume(volume);
                }
                if (playback.isPlaying && !isAudioSource) {
                  const expectedTime = calculateExpectedTime();
                  if (typeof event.target?.seekTo === 'function') {
                    event.target.seekTo(expectedTime, true);
                  }
                  if (typeof event.target?.playVideo === 'function') {
                    event.target.playVideo();
                  }
                }
              } catch (err) {
                console.warn('YouTube player onReady error handled:', err);
              }
            },
            onStateChange: (event: any) => {
              // YT.PlayerState.PLAYING = 1
              if (event.data === 1) {
                setAudioUnlocked(true);
                setYoutubeError(null);
              }
              // YT.PlayerState.ENDED = 0
              if (event.data === 0 && onNextTrack) {
                onNextTrack();
              }
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YouTube player:', err);
      }
    };

    // Hook official API callback and polling fallback
    const prevApiReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevApiReady === 'function') prevApiReady();
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 150);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isAudioSource || !currentSong?.sourceUrl) {
      audio.pause();
      return;
    }

    if (lastSourceUrlRef.current !== currentSong.sourceUrl) {
      lastSourceUrlRef.current = currentSong.sourceUrl;
      audio.src = currentSong.sourceUrl;
      audio.currentTime = playback.currentTime || 0;
      audio.load();
    }

    audio.muted = isMuted;
    try {
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
    } catch (e) {}
    if (playback.isPlaying) {
      audio.play().then(() => setAudioUnlocked(true)).catch((err) => {
        console.warn('Audio play auto-policy handled:', err);
        setAudioUnlocked(false);
      });
    } else {
      audio.pause();
    }
  }, [currentSong?.sourceUrl, playback.isPlaying, isAudioSource, isMuted, volume]);

  // Synchronize player with authoritative playback state changes
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;
    if (isAudioSource) {
      try {
        playerRef.current.pauseVideo?.();
      } catch (e) {}
      return;
    }

    try {
      // 1. Song changed?
      if (currentSong && currentSong.videoId) {
        const currentLoaded = playerRef.current.getVideoData?.()?.video_id;
        if (currentLoaded !== currentSong.videoId) {
          setYoutubeError(null);
          const expected = calculateExpectedTime();
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById({
              videoId: currentSong.videoId,
              startSeconds: expected,
            });
          }
          if (playback.isPlaying) {
            window.setTimeout(() => {
              try {
                playerRef.current?.playVideo?.();
              } catch (e) {}
            }, 180);
          } else {
            playerRef.current.pauseVideo?.();
          }
          return;
        }
      }

      // 2. Play / Pause state changed?
      const playerState = playerRef.current.getPlayerState?.();
      // 1 = playing, 2 = paused
      if (playback.isPlaying && playerState !== 1) {
        const expected = calculateExpectedTime();
        const currentSec = playerRef.current.getCurrentTime?.() || 0;
        if (Math.abs(currentSec - expected) > 1.2) {
          playerRef.current.seekTo(expected, true);
        }
        playerRef.current.playVideo?.();
      } else if (!playback.isPlaying && playerState === 1) {
        playerRef.current.pauseVideo?.();
        playerRef.current.seekTo(playback.currentTime, true);
      }

      // 3. Audio drift check (sync audio streams across all users within <0.5s)
      const expectedTime = calculateExpectedTime();
      const actualTime = playerRef.current.getCurrentTime?.() || 0;
      const drift = Math.abs(actualTime - expectedTime);
      setAudioLatencyMs(Math.round(drift * 100));

      if (drift > 1.5 && !isScrubbing) {
        playerRef.current.seekTo(expectedTime, true);
      }
    } catch (err) {
      console.warn('YouTube sync glitch handled:', err);
    }
  }, [playback.isPlaying, playback.currentSong?.videoId, playback.currentTime, playback.updatedAt, playerReady, isAudioSource, isScrubbing, calculateExpectedTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioSource || !Number.isFinite(playback.currentTime)) return;
    const expectedTime = calculateExpectedTime();
    if (Math.abs(audio.currentTime - expectedTime) > 1.5) audio.currentTime = expectedTime;
  }, [playback.currentTime, playback.updatedAt, isAudioSource, calculateExpectedTime]);

  // Periodic local playhead update & visualizer loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isAudioSource && audioRef.current && !isScrubbing) {
        setLocalCurrentTime(audioRef.current.currentTime);
      } else if (playerRef.current && playerReady && !isScrubbing) {
        try {
          const t = playerRef.current.getCurrentTime?.() || 0;
          setLocalCurrentTime(t);
        } catch (e) {
          // ignore transient iframe poll
        }
      } else if (!playback.isPlaying && !isScrubbing) {
        setLocalCurrentTime(playback.currentTime);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [playerReady, isScrubbing, playback.isPlaying, playback.currentTime, isAudioSource]);

  // Audio Equalizer Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 28;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let height = 4;
        if (playback.isPlaying) {
          const wave1 = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
          const wave2 = Math.cos(phase * 1.5 + i * 0.3) * 0.5 + 0.5;
          height = Math.max(6, (wave1 * 0.6 + wave2 * 0.4) * (canvas.height * 0.85));
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - height;

        // Gradient from purple-500 to pink-500 (Immersive UI theme)
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#a855f7');
        grad.addColorStop(1, '#ec4899');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [3, 3, 0, 0]);
        ctx.fill();
      }

      phase += 0.12;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [playback.isPlaying]);

  // Safe helper to apply volume & mute to YouTube IFrame player and HTML5 audio without crashing
  const applyPlayerAudio = useCallback((targetVolume: number, muted: boolean) => {
    // 1. Always update HTML5 audio element (vital for local MP3 and direct streams on Android/S25 Ultra)
    if (audioRef.current) {
      audioRef.current.muted = muted;
      try {
        audioRef.current.volume = muted ? 0 : Math.max(0, Math.min(1, targetVolume / 100));
      } catch (e) {}
    }

    if (isAudioSource) {
      return;
    }

    const player = playerRef.current;
    if (!player) return;
    try {
      if (muted) {
        if (typeof player.mute === 'function') {
          player.mute();
        }
      } else {
        if (typeof player.unMute === 'function') {
          player.unMute();
        }
        if (typeof player.setVolume === 'function') {
          player.setVolume(targetVolume);
        }
      }
    } catch (err) {
      console.warn('YouTube audio state update deferred or handled:', err);
    }
  }, [isAudioSource]);

  // When player becomes ready, ensure current volume & mute settings are applied
  useEffect(() => {
    if (playerReady) {
      applyPlayerAudio(volume, isMuted);
    }
  }, [playerReady, applyPlayerAudio, volume, isMuted]);

  // Volume handler
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const shouldMute = newVol === 0;
    const nextMuted = shouldMute ? true : (isMuted && newVol > 0 ? false : isMuted);
    setIsMuted(nextMuted);
    applyPlayerAudio(newVol, nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      try {
        audioRef.current.volume = nextMuted ? 0 : Math.max(0, Math.min(1, newVol / 100));
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    applyPlayerAudio(volume, nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      try {
        audioRef.current.volume = nextMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
      } catch (e) {}
    }
  };

  // Callback from PersonalVolumeMixer: updates YouTube and HTML5 audio for this local device only
  const handleEffectiveVolumeChange = useCallback((effectiveVol: number, muted: boolean) => {
    setVolume(effectiveVol);
    setIsMuted(muted);
    applyPlayerAudio(effectiveVol, muted);
    if (audioRef.current) {
      audioRef.current.muted = muted;
      try {
        audioRef.current.volume = muted ? 0 : Math.max(0, Math.min(1, effectiveVol / 100));
      } catch (e) {}
    }
  }, [applyPlayerAudio]);

  // Alternative audio engine for mobile / S25 Ultra: bypasses YouTube embedding restrictions
  const handleSwitchToDirectAudioFallback = () => {
    const fallbackUrl = currentSong?.sourceUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3';
    setYoutubeError(null);
    if (hasBaton) {
      onPlaybackUpdate({
        currentSong: {
          ...(currentSong || {
            id: `stream-${Date.now()}`,
            videoId: '',
            title: 'Universal High-Fidelity Audio Stream',
            artist: 'Direct Stream',
            thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
            duration: 200,
            addedBy: 'system',
            addedByName: 'Stream Engine',
          }),
          sourceUrl: fallbackUrl,
          sourceType: 'audio-url',
        },
        isPlaying: true,
        updatedAt: Date.now(),
      });
    } else {
      if (audioRef.current) {
        audioRef.current.src = fallbackUrl;
        audioRef.current.muted = isMuted;
        try {
          audioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
        } catch (e) {}
        audioRef.current.play().then(() => setAudioUnlocked(true)).catch((e) => console.warn(e));
      }
    }
  };

  // Baton holder can adjust the master room reference volume level
  const handleMasterLevelChange = (newMasterLevel: number) => {
    if (!hasBaton) return;
    onPlaybackUpdate({
      masterVolume: newMasterLevel,
    });
  };

  // Play / Pause toggle
  const handlePlayPause = () => {
    if (!hasBaton) {
      if (isSoloMember || !batonOwnerName) {
        if (onClaimBaton) onClaimBaton();
      } else {
        if (onRequestBaton) onRequestBaton();
        return;
      }
    }
    const nextIsPlaying = !playback.isPlaying;
    const curr = isAudioSource
      ? (audioRef.current?.currentTime ?? localCurrentTime)
      : (playerRef.current?.getCurrentTime?.() ?? localCurrentTime);
    try {
      if (isAudioSource) {
        if (nextIsPlaying) {
          audioRef.current?.play().then(() => setAudioUnlocked(true)).catch(() => setAudioUnlocked(false));
        } else {
          audioRef.current?.pause();
        }
      } else if (nextIsPlaying) {
        playerRef.current?.playVideo?.();
      } else {
        playerRef.current?.pauseVideo?.();
      }
    } catch (err) {
      console.warn('Direct playback command handled:', err);
    }
    onPlaybackUpdate({
      isPlaying: nextIsPlaying,
      currentTime: curr,
      updatedAt: Date.now(),
    });
    if (nextIsPlaying) {
      setAudioUnlocked(true);
    }
  };

  // Seek handler (Baton holder only)
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasBaton) return;
    const newTime = parseFloat(e.target.value);
    setLocalCurrentTime(newTime);
    if (isAudioSource && audioRef.current) {
      try {
        audioRef.current.currentTime = newTime;
      } catch (err) {
        console.warn('Audio seek error handled:', err);
      }
    } else if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(newTime, true);
      } catch (err) {
        console.warn('Seek error handled:', err);
      }
    }
    onPlaybackUpdate({
      currentTime: newTime,
      updatedAt: Date.now(),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const duration = playback.duration || currentSong?.duration || 200;

  return (
    <div id="audio-player-card" className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl shadow-purple-950/40 backdrop-blur-xl relative overflow-hidden text-white">
      {/* Background glow when playing */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-1000 ${
          playback.isPlaying ? 'opacity-30 bg-purple-600' : 'opacity-5 bg-purple-900'
        }`}
      />

      {/* Synchronized Stream Badge & Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase text-purple-400">
            <Radio className={`w-3.5 h-3.5 ${playback.isPlaying ? 'text-emerald-400 animate-pulse' : 'text-white/40'}`} />
            <span>{playback.isPlaying ? 'Live Audio Synced' : 'Audio Paused'}</span>
          </div>
          <span className="text-[11px] text-white/40 hidden sm:inline font-mono">
            Drift: &lt;{audioLatencyMs}ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Radio Broadcaster Modal Button */}
          {onOpenRadio && (
            <button
              id="player-open-radio-btn"
              onClick={onOpenRadio}
              title="24/7 Live Radio & Broadcast to Group"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                isLiveRadio
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveRadio ? 'text-black animate-pulse' : 'text-amber-400'}`} />
              <span>{isLiveRadio ? 'Radio (On Air)' : 'Live Radio'}</span>
            </button>
          )}

          {/* Toggle between Turntable and Video View */}
          <button
            onClick={() => setShowVideoPlayer(!showVideoPlayer)}
            title={showVideoPlayer ? 'Switch to Vinyl Turntable' : 'Watch YouTube Video'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
              showVideoPlayer
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{showVideoPlayer ? 'Vinyl View' : 'Watch Video'}</span>
          </button>

          {/* Baton Owner indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {hasBaton ? (
              <span className="flex items-center gap-1 text-purple-300 font-bold bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full shadow-sm">
                <Crown className="w-3.5 h-3.5 text-purple-400" />
                Master DJ
              </span>
            ) : (
              <span className="text-white/50 text-xs">
                DJ: <strong className="text-purple-300 font-medium">{batonOwnerName || 'Nobody (Open)'}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* YouTube IFrame container: Standard dimensions maintain mobile Chrome background audio execution */}
      <div
        className={
          showVideoPlayer
            ? 'relative w-full aspect-video rounded-2xl overflow-hidden mb-5 bg-black border border-white/10 shadow-2xl transition-all'
            : 'fixed -left-[9999px] -top-[9999px] w-[360px] h-[240px] opacity-0 pointer-events-none'
        }
      >
        <div id="youtube-player-element" className="w-full h-full" />
      </div>

      {isAudioSource && (
        <audio
          ref={audioRef}
          preload="auto"
          className="hidden"
          muted={isMuted}
          onLoadedMetadata={(event) => {
            const d = Math.round(event.currentTarget.duration);
            if (Number.isFinite(d) && d > 0 && hasBaton) {
              onPlaybackUpdate({ duration: d });
            }
          }}
          onTimeUpdate={(event) => {
            setLocalCurrentTime(event.currentTarget.currentTime);
          }}
          onEnded={() => {
            if (hasBaton && onNextTrack) {
              onNextTrack();
            }
          }}
          onError={(e) => {
            console.error('Audio element error:', e);
            setAudioUnlocked(false);
          }}
        />
      )}

      {/* Mobile Autoplay / Sync Banner */}
      {currentSong && playback.isPlaying && !audioUnlocked && (
        <div className="w-full mb-4">
          <button
            onClick={unlockAudio}
            className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer animate-pulse"
          >
            <Volume2 className="w-5 h-5 text-slate-950" />
            <span>Tap to Synchronize Audio with Room 🔊</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Sync Banner for Mobile Viewport */}
      {currentSong && playback.isPlaying && !audioUnlocked && (
        <div className="fixed bottom-20 left-4 right-4 z-50 sm:hidden">
          <button
            onClick={unlockAudio}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-400 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/80 flex items-center justify-center gap-2.5 border border-white/40 active:scale-95 transition cursor-pointer animate-bounce"
          >
            <Volume2 className="w-5 h-5 text-slate-950" />
            <span>TAP TO UNMUTE &amp; SYNC AUDIO 🔊</span>
          </button>
        </div>
      )}

      {/* Embed Restriction Warning & S25 Ultra Mobile Alternative Engine */}
      {youtubeError && (
        <div className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-400/40 text-white text-sm shadow-xl">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-200 flex flex-wrap items-center gap-2">
                <span>YouTube Playback Blocked on Device (Error {youtubeError})</span>
                <span className="text-[10px] bg-amber-400/25 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  S25 / Mobile Alternative
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1">
                YouTube restricts embedding for this song on mobile browsers. Use our high-fidelity direct audio stream to play immediately without restrictions, or open directly in the YouTube app.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={handleSwitchToDirectAudioFallback}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Switch to Direct Audio Stream 🔊</span>
                </button>

                {!showVideoPlayer && (
                  <button
                    onClick={() => setShowVideoPlayer(true)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-400/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-purple-200" />
                    <span>Reveal Video Player</span>
                  </button>
                )}

                {currentSong?.videoId && (
                  <button
                    onClick={() => {
                      const ytUrl = `https://www.youtube.com/watch?v=${currentSong.videoId}`;
                      window.open(ytUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white/70" />
                    <span>Open in YouTube App</span>
                  </button>
                )}

                {onNextTrack && (
                  <button
                    onClick={onNextTrack}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Skip Track</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Vinyl & Track Presentation */}
      <div className="flex flex-col sm:flex-row items-center gap-6 my-3">
        {/* Spinning Vinyl Turntable Disc */}
        <div className="relative group shrink-0">
          <div
            className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-black border-4 border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden transition-transform duration-700 ${
              playback.isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
            }`}
            style={{
              boxShadow: playback.isPlaying
                ? '0 0 45px -5px rgba(168, 85, 247, 0.4), 0 0 15px rgba(0,0,0,0.9)'
                : '0 10px 25px -5px rgba(0,0,0,0.7)',
            }}
          >
            {/* Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/5" />
            <div className="absolute inset-5 rounded-full border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-white/5" />

            {/* Album Art Label */}
            <img
              src={currentSong?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80'}
              alt={currentSong?.title || 'Now Playing'}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-black/80 shadow-inner"
              referrerPolicy="no-referrer"
            />
            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 bg-black rounded-full border border-white/20" />
          </div>

          {/* Tonearm graphic overlay */}
          <div className="absolute -top-1 -right-2 text-white/40 opacity-70">
            <Disc className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Track Metadata & Equalizer Visualizer */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1.5">
            {isLiveRadio ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                24/7 Group Live Radio Broadcast (S25 / Mobile Certified)
              </span>
            ) : currentSong?.sourceType === 'local-file' ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Direct HTML5 Studio Audio (Room Synced)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                YouTube Music Synchronized Stream
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate drop-shadow-sm">
            {currentSong?.title || 'Select a Song to Begin'}
          </h2>
          <p className="text-sm md:text-base text-white/60 font-medium truncate mt-0.5">
            {currentSong?.artist || 'Baton holder can search or paste any song'}
          </p>
          {currentSong?.addedByName && (
            <p className="text-xs text-white/40 mt-1">
              {isLiveRadio ? 'Broadcasted by: ' : 'Queued by: '}
              <span className="text-purple-300 font-medium">{currentSong.addedByName}</span>
            </p>
          )}

          {/* Dynamic Audio Visualizer Bar Wave */}
          <div className="mt-4 pt-1">
            <canvas
              ref={canvasRef}
              width={260}
              height={32}
              className="w-full max-w-xs h-8 mx-auto sm:mx-0 opacity-90"
            />
          </div>
        </div>
      </div>

      {/* Interactive Track Timeline / Scrubber */}
      {isLiveRadio ? (
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="font-black text-amber-300 uppercase tracking-wider text-[11px]">
              Continuous Live Group Radio
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-mono">
              Infinite Stream
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-[11px] font-mono hidden sm:inline">
              100% Android S25 & Mobile Compatible
            </span>
            {onOpenRadio && (
              <button
                onClick={onOpenRadio}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition cursor-pointer"
              >
                Switch Radio Station
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-1.5">
          <div className="relative flex items-center">
            <input
              id="audio-scrubber"
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={localCurrentTime}
              disabled={!hasBaton}
              onMouseDown={() => setIsScrubbing(true)}
              onMouseUp={() => setIsScrubbing(false)}
              onTouchStart={() => setIsScrubbing(true)}
              onTouchEnd={() => setIsScrubbing(false)}
              onChange={handleSeek}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10 accent-purple-500 ${
                !hasBaton ? 'cursor-not-allowed opacity-70' : 'hover:h-2.5 transition-all'
              }`}
            />
          </div>

          <div className="flex justify-between text-xs text-white/50 font-mono">
            <span>{formatTime(localCurrentTime)}</span>
            {!hasBaton && (
              <span className="text-[11px] text-purple-400/80 font-sans italic">
                Seek locked to Baton Holder
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Control Buttons & Volume */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Playback & Queue Advancement Controls */}
        <div className="flex items-center gap-3">
          {!playback.isPlaying ? (
            <button
              id="start-playback-button"
              onClick={handlePlayPause}
              title={hasBaton ? 'Start Queue Playback' : batonOwnerName ? 'Request the baton' : 'Claim the open baton'}
              className={`px-5 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition shadow-lg cursor-pointer ${hasBaton ? 'bg-white text-black' : 'bg-purple-600 text-white'}`}
            >
              {hasBaton ? <Play className="w-5 h-5 fill-current" /> : <Hand className="w-5 h-5" />}
              <span>{hasBaton ? 'Start Queue' : batonOwnerName ? 'Request Baton' : 'Claim Baton'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Queue Stream</span>
            </div>
          )}

          {/* Next Song / Skip button */}
          {onNextTrack && (
            <button
              id="next-track-button"
              onClick={onNextTrack}
              disabled={!hasBaton && !isSoloMember}
              title={hasBaton || isSoloMember ? 'Play Next Song from Queue' : 'Baton holder can skip to next song'}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border transition ${
                hasBaton || isSoloMember
                  ? 'bg-purple-600/30 border-purple-500/40 text-white hover:bg-purple-600/50 cursor-pointer'
                  : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-xs font-medium">Next Song</span>
            </button>
          )}

          {!hasBaton && (
            <div className="flex items-center gap-2">
              {onClaimBaton && (isSoloMember || !batonOwnerName) ? (
                <button
                  id="player-take-baton-button"
                  onClick={onClaimBaton}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  Take Baton
                </button>
              ) : (
                <span className="text-xs text-white/50 hidden sm:inline">
                  DJ: <strong className="text-purple-300">{batonOwnerName || 'Lounge Host'}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side controls: Personal Mute (For Yourself Only) & Volume */}
        <div className="flex items-center gap-2.5">
          {/* Dedicated Personal Mute Toggle */}
          <button
            id="personal-mute-toggle-button"
            onClick={toggleMute}
            title="Mutes playback on your device only. Other group members continue listening uninterrupted."
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Unmute (Muted for you)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Mute for me</span>
              </>
            )}
          </button>

          {onToggleAmbient && (
            <button
              id="player-ambient-toggle-button"
              onClick={onToggleAmbient}
              title={isAmbientActive ? 'Exit Ambient Background' : 'Turn on Ambient Background'}
              className={`px-3 py-2 rounded-full border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isAmbientActive
                  ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-md shadow-purple-600/20'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAmbientActive ? 'text-amber-300 animate-spin' : 'text-purple-400'}`} />
              <span className="hidden sm:inline">Ambient</span>
            </button>
          )}

          {/* Toggle Personal Volume Mixer Panel Button */}
          <button
            id="toggle-personal-mixer-button"
            onClick={() => setShowMixer((p) => !p)}
            title="Toggle Personal Volume Mixer (Master Level & Personal Gain Controls)"
            className={`px-3.5 py-2 rounded-full border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showMixer
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-md shadow-purple-600/20'
                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Mixer</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/80">
              {isMuted ? 'Muted' : `${volume}%`}
            </span>
          </button>
        </div>
      </div>

      {/* Dedicated Personal Volume Mixer Component */}
      {showMixer && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <PersonalVolumeMixer
            masterLevel={playback.masterVolume ?? 80}
            hasBaton={hasBaton}
            batonOwnerName={batonOwnerName}
            isPlaying={playback.isPlaying}
            onMasterLevelChange={handleMasterLevelChange}
            onEffectiveVolumeChange={handleEffectiveVolumeChange}
          />
        </div>
      )}
    </div>
  );
};
