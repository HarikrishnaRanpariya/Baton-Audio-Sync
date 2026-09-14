import React, { useState, useEffect, useRef } from 'react';
import { SongItem, PlaylistGroup, AiPlaylistCriteria } from '../types';
import { CURATED_TRACKS, DIRECT_RADIO_STREAMS, DIRECT_AUDIO_TRACKS, RadioStation, extractYouTubeVideoId } from '../musicCatalog';
import {
  Search,
  Music,
  Link as LinkIcon,
  Plus,
  Play,
  Sparkles,
  X,
  ListMusic,
  Check,
  FolderOpen,
  Wand2,
  Trash2,
  BookmarkPlus,
  Loader2,
  Globe,
  Radio,
  Clock,
  Layers,
  Upload,
  FileAudio,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Zap,
} from 'lucide-react';

interface MusicSearchModalProps {
  hasBaton: boolean;
  onSelectSong: (song: SongItem, playImmediately: boolean) => void;
  onAddMultipleToQueue?: (songs: SongItem[]) => void;
  onClose: () => void;
  playlist: SongItem[];
  playlists?: PlaylistGroup[];
  onSaveAsPlaylist?: (title: string, songs: SongItem[]) => void;
  onLoadPlaylist?: (playlistId: string, mode: 'replace' | 'append') => void;
  onDeletePlaylist?: (playlistId: string) => void;
  currentSongId?: string;
  currentUserId: string;
  currentUserName: string;
  initialTab?: 'search' | 'local' | 'url' | 'streams' | 'ai' | 'playlists';
}

const MOODS = [
  'Chill & Relaxed',
  'High Energy & Workout',
  'Deep Focus / Coding',
  'Late Night Drive',
  'Party & Dance',
  'Romantic & Warm',
  'Feel Good & Uplifting',
  'Melancholic & Nostalgic',
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'Korean',
  'Japanese',
  'French',
  'Punjabi',
  'Multi-lingual',
];

const COUNTRIES = [
  'Global',
  'USA / North America',
  'India / Bollywood',
  'Latin America',
  'South Korea',
  'UK & Europe',
  'Japan',
  'Nigeria / Afrobeats',
];

const SONG_TYPES = [
  'Lo-Fi & Ambient',
  'Pop Anthems',
  'EDM & Electronic',
  'Acoustic & Indie',
  'Hip-Hop & R&B',
  'Bollywood & Desi',
  'Rock & Alternative',
  'K-Pop & Asian Pop',
];

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  hasBaton,
  onSelectSong,
  onAddMultipleToQueue,
  onClose,
  playlist,
  playlists = [],
  onSaveAsPlaylist,
  onLoadPlaylist,
  onDeletePlaylist,
  currentSongId,
  currentUserId,
  currentUserName,
  initialTab = 'search',
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'local' | 'url' | 'streams' | 'ai' | 'playlists'>(initialTab);
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [fileError, setFileError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  // Local MP3 upload state
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [localTitle, setLocalTitle] = useState('');
  const [localArtist, setLocalArtist] = useState('');
  const [localDuration, setLocalDuration] = useState<number>(210);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isLocalAudioPreviewPlaying, setIsLocalAudioPreviewPlaying] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [uploadProgressStatus, setUploadProgressStatus] = useState<string | null>(null);
  const [selectedPlaylistForLocal, setSelectedPlaylistForLocal] = useState<string>('queue');
  const [newPlaylistTitleForLocal, setNewPlaylistTitleForLocal] = useState<string>('');
  const localPreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      if (localPreviewAudioRef.current) {
        localPreviewAudioRef.current.pause();
      }
    };
  }, [localPreviewUrl]);

  // AI Generator state
  const [aiMood, setAiMood] = useState('Chill & Relaxed');
  const [aiLanguage, setAiLanguage] = useState('English');
  const [aiCountry, setAiCountry] = useState('Global');
  const [aiSongType, setAiSongType] = useState('Lo-Fi & Ambient');
  const [aiCount, setAiCount] = useState<number>(6);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedPlaylist, setAiGeneratedPlaylist] = useState<{
    title: string;
    description: string;
    tracks: Array<{
      videoId: string;
      title: string;
      artist: string;
      duration: number;
      thumbnail?: string;
      reason?: string;
    }>;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // New Playlist creation inside Playlists tab
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isCreatingNewPlaylist, setIsCreatingNewPlaylist] = useState(false);

  // Filter catalog songs
  const filteredTracks = CURATED_TRACKS.filter((track) => {
    const q = query.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q)
    );
  });

  const handlePlayOrQueue = (rawTrack: (typeof CURATED_TRACKS)[0], playImmediately: boolean) => {
    const song: SongItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: rawTrack.videoId,
      title: rawTrack.title,
      artist: rawTrack.artist,
      thumbnail: rawTrack.thumbnail,
      duration: rawTrack.duration,
      addedBy: currentUserId,
      addedByName: currentUserName,
    };

    onSelectSong(song, playImmediately);
    setAddedNotification(playImmediately ? `Playing ${song.title}` : `Queued ${song.title}`);
    setTimeout(() => setAddedNotification(null), 2500);

    if (playImmediately) {
      onClose();
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) return;

    const videoId = extractYouTubeVideoId(trimmedUrl);
    // Direct audio URL fallback (mp3, aac, m4a, radio stream, etc.)
    if (!videoId && /^https?:\/\//i.test(trimmedUrl)) {
      const song: SongItem = {
        id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        videoId: '',
        sourceUrl: trimmedUrl,
        sourceType: 'audio-url',
        title: customTitle.trim() || 'Direct Online Audio Stream',
        artist: customArtist.trim() || 'Web Audio Source',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        duration: 240,
        addedBy: currentUserId,
        addedByName: currentUserName,
      };
      onSelectSong(song, false);
      setAddedNotification(`Added "${song.title}" to Master Queue`);
      setTimeout(() => setAddedNotification(null), 2500);
      setCustomUrl('');
      setCustomTitle('');
      setCustomArtist('');
      return;
    }

    if (!videoId) {
      setUrlError('Could not extract a valid YouTube video ID or stream URL. Please check the link.');
      return;
    }

    // Attach fallback stream for mobile/S25 Ultra if YouTube restricts embedding
    const randomFallback = DIRECT_AUDIO_TRACKS[Math.floor(Math.random() * DIRECT_AUDIO_TRACKS.length)];
    const song: SongItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId,
      sourceUrl: randomFallback.sourceUrl,
      sourceType: 'audio-url',
      title: customTitle.trim() || `YouTube Track (${videoId})`,
      artist: customArtist.trim() || 'YouTube Music Stream',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: 240,
      addedBy: currentUserId,
      addedByName: currentUserName,
    };

    onSelectSong(song, false);
    setAddedNotification(`Added "${song.title}" to Master Queue`);
    setTimeout(() => setAddedNotification(null), 2500);
    setCustomUrl('');
    setCustomTitle('');
    setCustomArtist('');
  };

  // Helper to extract audio duration via browser audio decoder
  const inspectAudioFile = (file: File): Promise<{ duration: number; previewUrl: string }> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const tempAudio = new Audio();
        tempAudio.preload = 'metadata';
        tempAudio.src = url;
        tempAudio.onloadedmetadata = () => {
          const d = Math.round(tempAudio.duration);
          resolve({ duration: Number.isFinite(d) && d > 0 ? d : 210, previewUrl: url });
        };
        tempAudio.onerror = () => {
          resolve({ duration: 210, previewUrl: url });
        };
      } catch {
        resolve({ duration: 210, previewUrl: '' });
      }
    });
  };

  const handleSelectLocalFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError('');
    const rawFiles = Array.from(files);
    const audioFiles = rawFiles.filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setFileError('Please select valid audio files (MP3, WAV, M4A, OGG, FLAC, AAC).');
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    if (localPreviewAudioRef.current) {
      localPreviewAudioRef.current.pause();
    }
    setIsLocalAudioPreviewPlaying(false);

    setLocalFiles(audioFiles);

    if (audioFiles.length === 1) {
      const single = audioFiles[0];
      const cleanName = single.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      setLocalTitle(cleanName);
      setLocalArtist(currentUserName ? `${currentUserName}'s Upload` : 'Local Audio');
      const { duration, previewUrl } = await inspectAudioFile(single);
      setLocalDuration(duration);
      setLocalPreviewUrl(previewUrl);
    } else {
      setLocalTitle(`${audioFiles.length} Audio Tracks`);
      setLocalArtist(currentUserName || 'Batch Upload');
      const { previewUrl } = await inspectAudioFile(audioFiles[0]);
      setLocalPreviewUrl(previewUrl);
    }
  };

  const uploadSingleAudioFile = async (
    file: File,
    title: string,
    artist: string,
    duration: number
  ): Promise<SongItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/audio-upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || `Upload failed for ${file.name}`);
    }
    const data = await response.json();
    return {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: '',
      sourceUrl: data.url,
      sourceType: 'audio-url',
      title: title.trim() || data.originalName.replace(/\.[^.]+$/, ''),
      artist: artist.trim() || 'Uploaded Track',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      duration: duration || 210,
      addedBy: currentUserId,
      addedByName: currentUserName,
    };
  };

  const handlePlayLocalNow = async () => {
    if (localFiles.length === 0) return;
    setIsUploadingLocal(true);
    setUploadProgressStatus('Uploading MP3 to room server...');
    setFileError('');

    try {
      const file = localFiles[0];
      const song = await uploadSingleAudioFile(file, localTitle, localArtist, localDuration);
      onSelectSong(song, true);
      setAddedNotification(`Playing "${song.title}" for the room!`);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setFileError(err.message || 'Could not upload audio file.');
    } finally {
      setIsUploadingLocal(false);
      setUploadProgressStatus(null);
    }
  };

  const handleAddLocalToQueue = async () => {
    if (localFiles.length === 0) return;
    setIsUploadingLocal(true);
    setFileError('');

    try {
      if (localFiles.length === 1) {
        setUploadProgressStatus('Uploading MP3 to room server...');
        const file = localFiles[0];
        const song = await uploadSingleAudioFile(file, localTitle, localArtist, localDuration);
        onSelectSong(song, false);
        setAddedNotification(`Added "${song.title}" to Master Queue`);
      } else {
        // Multi-file batch upload
        const uploadedSongs: SongItem[] = [];
        for (let i = 0; i < localFiles.length; i++) {
          const file = localFiles[i];
          setUploadProgressStatus(`Uploading track ${i + 1} of ${localFiles.length}: ${file.name}...`);
          const song = await uploadSingleAudioFile(
            file,
            file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
            localArtist || 'Batch Upload',
            210
          );
          uploadedSongs.push(song);
        }
        if (onAddMultipleToQueue) {
          onAddMultipleToQueue(uploadedSongs);
        } else {
          for (const s of uploadedSongs) {
            onSelectSong(s, false);
          }
        }
        setAddedNotification(`Added ${uploadedSongs.length} local tracks to Master Queue`);
      }

      setTimeout(() => setAddedNotification(null), 3000);
      setLocalFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setFileError(err.message || 'Could not upload audio files.');
    } finally {
      setIsUploadingLocal(false);
      setUploadProgressStatus(null);
    }
  };

  const handleSaveLocalToPlaylist = async () => {
    if (localFiles.length === 0) return;
    setIsUploadingLocal(true);
    setFileError('');

    try {
      const uploadedSongs: SongItem[] = [];
      for (let i = 0; i < localFiles.length; i++) {
        const file = localFiles[i];
        setUploadProgressStatus(`Uploading track ${i + 1} of ${localFiles.length}...`);
        const song = await uploadSingleAudioFile(
          file,
          localFiles.length === 1 ? localTitle : file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          localArtist || 'Local Music',
          localFiles.length === 1 ? localDuration : 210
        );
        uploadedSongs.push(song);
      }

      const playlistTitle =
        selectedPlaylistForLocal === 'new'
          ? (newPlaylistTitleForLocal.trim() || 'My Local MP3s')
          : (playlists.find((p) => p.id === selectedPlaylistForLocal)?.title || 'Local Audio Playlist');

      if (onSaveAsPlaylist) {
        onSaveAsPlaylist(playlistTitle, uploadedSongs);
        setAddedNotification(`Saved ${uploadedSongs.length} tracks to playlist "${playlistTitle}"!`);
        setTimeout(() => setAddedNotification(null), 3000);
      }
      setLocalFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setFileError(err.message || 'Could not save tracks to playlist.');
    } finally {
      setIsUploadingLocal(false);
      setUploadProgressStatus(null);
    }
  };

  const togglePreviewPlayback = () => {
    const audio = localPreviewAudioRef.current;
    if (!audio) return;
    if (isLocalAudioPreviewPlaying) {
      audio.pause();
      setIsLocalAudioPreviewPlaying(false);
    } else {
      audio.play().then(() => setIsLocalAudioPreviewPlaying(true)).catch(() => setIsLocalAudioPreviewPlaying(false));
    }
  };

  // Trigger AI generation
  const handleGenerateAiPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const criteria: AiPlaylistCriteria = {
        mood: aiMood,
        language: aiLanguage,
        country: aiCountry,
        songType: aiSongType,
        count: aiCount,
      };

      const res = await fetch('/api/ai/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.playlist) {
        setAiGeneratedPlaylist(data.playlist);
      } else {
        throw new Error('Invalid playlist response from AI');
      }
    } catch (err: any) {
      console.warn('AI Generation fallback error:', err);
      setAiError('Could not generate playlist at this moment. Please try again.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddAllAiToQueue = () => {
    if (!aiGeneratedPlaylist) return;
    const songs: SongItem[] = aiGeneratedPlaylist.tracks.map((t) => ({
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: t.videoId,
      title: t.title,
      artist: t.artist,
      duration: t.duration || 210,
      thumbnail:
        t.thumbnail ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      addedBy: currentUserId,
      addedByName: currentUserName,
    }));

    if (onAddMultipleToQueue) {
      onAddMultipleToQueue(songs);
    } else {
      songs.forEach((s) => onSelectSong(s, false));
    }

    setAddedNotification(`Added ${songs.length} AI tracks to Master Queue`);
    setTimeout(() => setAddedNotification(null), 3000);
  };

  const handleSaveAiAsPlaylist = () => {
    if (!aiGeneratedPlaylist || !onSaveAsPlaylist) return;
    const songs: SongItem[] = aiGeneratedPlaylist.tracks.map((t) => ({
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: t.videoId,
      title: t.title,
      artist: t.artist,
      duration: t.duration || 210,
      thumbnail:
        t.thumbnail ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
      addedBy: currentUserId,
      addedByName: currentUserName,
    }));

    onSaveAsPlaylist(aiGeneratedPlaylist.title, songs);
    setAddedNotification(`Saved playlist "${aiGeneratedPlaylist.title}"!`);
    setTimeout(() => setAddedNotification(null), 3000);
  };

  return (
    <div
      id="music-search-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-[#0c0c16]/95 border border-purple-500/20 rounded-3xl p-5 md:p-7 shadow-2xl shadow-purple-950/60 backdrop-blur-2xl relative text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Add Songs & Playlists
              </h2>
              <p className="text-xs text-white/50">
                Master Queue • Anyone can add songs • Instant duplicate prevention
              </p>
            </div>
          </div>
          <button
            id="close-music-search-button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Added Alert Toast */}
        {addedNotification && (
          <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{addedNotification}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
          <button
            id="tab-search-catalog"
            onClick={() => setActiveTab('search')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catalog</span>
            <span className="sm:hidden">Catalog</span>
          </button>
          <button
            id="tab-upload-local"
            onClick={() => setActiveTab('local')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'local'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload MP3</span>
            <span className="sm:hidden">MP3</span>
          </button>
          <button
            id="tab-paste-url"
            onClick={() => setActiveTab('url')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">YouTube Link</span>
            <span className="sm:hidden">URL</span>
          </button>
          <button
            id="tab-direct-streams"
            onClick={() => setActiveTab('streams')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'streams'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                : 'text-amber-300/80 hover:text-amber-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radio (S25)</span>
            <span className="sm:hidden">Radio</span>
          </button>
          <button
            id="tab-ai-generator"
            onClick={() => setActiveTab('ai')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30 font-bold'
                : 'text-pink-300/80 hover:text-pink-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">AI DJ</span>
            <span className="sm:hidden">AI</span>
          </button>
          <button
            id="tab-saved-playlists"
            onClick={() => setActiveTab('playlists')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'playlists'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Playlists ({playlists.length})</span>
            <span className="sm:hidden">Lists</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: Search Catalog */}
        {/* ========================================================================= */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {/* Search Input */}
            <div className="relative">
              <input
                id="search-songs-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search international hits, Bollywood, Lo-Fi, K-Pop, Rock, Pop..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
              />
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
            </div>

            {/* Song Results List */}
            <div className="space-y-2">
              {filteredTracks.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-xs">
                  No matching tracks found. Try pasting any YouTube URL in the &ldquo;YouTube Link&rdquo; tab!
                </div>
              ) : (
                filteredTracks.map((track) => (
                  <div
                    key={track.videoId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                        <p className="text-xs text-white/50 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {hasBaton && (
                        <button
                          onClick={() => handlePlayOrQueue(track, true)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-md shadow-purple-600/30 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Play Now
                        </button>
                      )}
                      <button
                        onClick={() => handlePlayOrQueue(track, false)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-purple-500/30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Queue
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Dedicated Local Machine MP3 / Audio File Upload */}
        {/* ========================================================================= */}
        {activeTab === 'local' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            {/* Header info banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-teal-950/30 to-purple-950/20 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                Local Machine Audio Upload & Playback
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Add MP3, WAV, M4A, OGG, or FLAC files directly from your computer. Uploaded tracks are synchronized across all devices in the room, queued into the Master Playlist, or saved into custom groups!
              </p>
            </div>

            {/* Dropzone & File Selector */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files) {
                  handleSelectLocalFiles(e.dataTransfer.files);
                }
              }}
              className="p-6 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/15 hover:bg-emerald-950/25 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,.webm"
                onChange={(e) => handleSelectLocalFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white mb-1">
                {localFiles.length === 0 ? 'Choose or Drag MP3 / Audio Files' : `${localFiles.length} file(s) selected`}
              </div>
              <p className="text-xs text-white/50 max-w-sm">
                Supports MP3, WAV, M4A, OGG, FLAC. You can select one song or multiple tracks at once.
              </p>
            </div>

            {fileError && (
              <div className="p-3 bg-pink-500/20 border border-pink-500/40 rounded-xl text-xs text-pink-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Uploading Status Banner */}
            {isUploadingLocal && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-300 shrink-0" />
                <span className="font-medium">{uploadProgressStatus || 'Uploading audio file...'}</span>
              </div>
            )}

            {/* Selected File Details & Editor */}
            {localFiles.length > 0 && !isUploadingLocal && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                        {localFiles.length === 1 ? localFiles[0].name : `${localFiles.length} Selected Songs`}
                      </div>
                      <div className="text-[11px] text-white/40 flex items-center gap-2 mt-0.5">
                        <span>{(localFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB total</span>
                        {localFiles.length === 1 && (
                          <>
                            <span>•</span>
                            <span>{Math.floor(localDuration / 60)}:{(localDuration % 60).toString().padStart(2, '0')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview Player button for single file */}
                  {localPreviewUrl && (
                    <button
                      type="button"
                      onClick={togglePreviewPlayback}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                    >
                      {isLocalAudioPreviewPlaying ? (
                        <>
                          <PauseCircle className="w-4 h-4 text-emerald-400" />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 text-purple-400" />
                          <span>Preview Audio</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Hidden HTML5 audio for in-modal preview */}
                {localPreviewUrl && (
                  <audio
                    ref={localPreviewAudioRef}
                    src={localPreviewUrl}
                    onEnded={() => setIsLocalAudioPreviewPlaying(false)}
                    onError={() => setIsLocalAudioPreviewPlaying(false)}
                    className="hidden"
                  />
                )}

                {/* Metadata Fields for single song */}
                {localFiles.length === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">
                        Song / Track Title
                      </label>
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        placeholder="e.g. My Favorite Song"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">
                        Artist / Origin
                      </label>
                      <input
                        type="text"
                        value={localArtist}
                        onChange={(e) => setLocalArtist(e.target.value)}
                        placeholder="e.g. Artist name or your name"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Multi-file track list */}
                {localFiles.length > 1 && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {localFiles.map((f, idx) => (
                      <div
                        key={f.name + idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs text-white/80"
                      >
                        <span className="truncate max-w-[240px]">{idx + 1}. {f.name}</span>
                        <span className="text-white/40 shrink-0">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Target action selector (Queue vs Playlist) */}
                <div className="pt-2 border-t border-white/10">
                  <label className="block text-xs font-medium text-white/60 mb-2">
                    Also Save into a Playlist (Optional):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedPlaylistForLocal}
                      onChange={(e) => setSelectedPlaylistForLocal(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="queue">Don't save to playlist (Queue only)</option>
                      <option value="new">+ Create New Group Playlist...</option>
                      {playlists.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          Playlist: {pl.title} ({pl.songs.length} tracks)
                        </option>
                      ))}
                    </select>

                    {selectedPlaylistForLocal === 'new' && (
                      <input
                        type="text"
                        value={newPlaylistTitleForLocal}
                        onChange={(e) => setNewPlaylistTitleForLocal(e.target.value)}
                        placeholder="New Playlist Name..."
                        className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 grow"
                      />
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {/* Play Now Button */}
                  <button
                    type="button"
                    onClick={handlePlayLocalNow}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Now for Room</span>
                  </button>

                  {/* Add to Queue Button */}
                  <button
                    type="button"
                    onClick={handleAddLocalToQueue}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{localFiles.length > 1 ? `Add All (${localFiles.length}) to Queue` : 'Add to Master Queue'}</span>
                  </button>
                </div>

                {selectedPlaylistForLocal !== 'queue' && (
                  <button
                    type="button"
                    onClick={handleSaveLocalToPlaylist}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-white/10 text-xs"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                    <span>Save Track(s) into Playlist</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Custom YouTube URL or Direct Web Audio */}
        {/* ========================================================================= */}
        {activeTab === 'url' && (
          <form onSubmit={handleCustomUrlSubmit} className="mt-4 space-y-4">
            {/* Mobile S25 Guidance Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
              <Radio className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-100">Samsung S25 Ultra & Mobile Notice: </span>
                Some YouTube songs restrict playback inside mobile browsers. You can paste any direct web stream link here (MP3/M4A/AAC), or browse our{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('streams')}
                  className="text-amber-300 font-bold underline hover:text-amber-100 cursor-pointer"
                >
                  24/7 Web Radio Stations
                </button>{' '}
                which bypass YouTube restrictions 100%!
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Paste YouTube / YouTube Music / Direct Audio Link
              </label>
              <input
                id="custom-youtube-url-input"
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://music.youtube.com/watch?v=... or https://.../stream.mp3"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
              />
              <div className="flex items-center justify-between text-[11px] text-white/40 mt-1.5">
                <span>Supports YouTube links and direct audio stream URLs.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('local')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                >
                  Upload local MP3 instead →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Track Title (Optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Starboy, Bohemian Rhapsody"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Artist / Creator (Optional)
                </label>
                <input
                  type="text"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder="e.g. The Weeknd, Queen"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            {urlError && (
              <div className="p-3 bg-pink-500/15 border border-pink-500/40 rounded-xl text-xs text-pink-300">
                {urlError}
              </div>
            )}

            <button
              id="submit-custom-song-button"
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to Master Song Queue
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Universal Web Radio & Direct Audio Streams (100% S25 Ultra Mobile Ready) */}
        {/* ========================================================================= */}
        {activeTab === 'streams' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-5 pr-1">
            {/* Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Mobile &amp; S25 Ultra Direct Audio Streams</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                  Zero Restrictions
                </span>
              </div>
              <p className="text-xs text-white/75 leading-relaxed mt-1.5">
                These streams play through direct native HTML5 audio. They are guaranteed to work on Samsung Galaxy S25 Ultra, Chrome for Android, iOS Safari, and mobile app webviews without YouTube embedding restrictions or commercials.
              </p>
            </div>

            {/* 24/7 Curated Radio Stations */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>24/7 Live Web Radio Stations</span>
                </h3>
                <span className="text-[11px] text-white/40">{DIRECT_RADIO_STREAMS.length} live stations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DIRECT_RADIO_STREAMS.map((station) => {
                  const songItem: SongItem = {
                    id: station.id,
                    videoId: '',
                    sourceUrl: station.streamUrl,
                    sourceType: 'audio-url',
                    title: station.name,
                    artist: station.genre,
                    thumbnail: station.thumbnail,
                    duration: 3600,
                    addedBy: currentUserId,
                    addedByName: currentUserName,
                  };

                  return (
                    <div
                      key={station.id}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={station.thumbnail}
                          alt={station.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
                            <span className="text-[10px] text-white/40">• {station.genre}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {station.name}
                          </h4>
                          <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5 leading-snug">
                            {station.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => {
                            onSelectSong(songItem, true);
                            setAddedNotification(`Playing "${station.name}"`);
                            setTimeout(() => setAddedNotification(null), 2500);
                            onClose();
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-amber-300" />
                          <span>Play Now ⚡</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectSong(songItem, false);
                            setAddedNotification(`Added "${station.name}" to Queue`);
                            setTimeout(() => setAddedNotification(null), 2500);
                          }}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Queue</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Studio Tracks */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>High-Fidelity Royalty-Free Direct Audio</span>
                </h3>
                <span className="text-[11px] text-white/40">{DIRECT_AUDIO_TRACKS.length} studio tracks</span>
              </div>

              <div className="space-y-2">
                {DIRECT_AUDIO_TRACKS.map((track, idx) => {
                  const songItem: SongItem = {
                    id: `direct-track-${idx}-${track.title.toLowerCase().replace(/\s+/g, '-')}`,
                    videoId: '',
                    sourceUrl: track.sourceUrl,
                    sourceType: 'audio-url',
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    duration: track.duration,
                    addedBy: currentUserId,
                    addedByName: currentUserName,
                  };

                  return (
                    <div
                      key={`direct-${idx}`}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                            <span className="truncate">{track.artist}</span>
                            <span>•</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">Direct MP3</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onSelectSong(songItem, true);
                            setAddedNotification(`Playing "${track.title}"`);
                            setTimeout(() => setAddedNotification(null), 2500);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-purple-200" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectSong(songItem, false);
                            setAddedNotification(`Added "${track.title}" to Queue`);
                            setTimeout(() => setAddedNotification(null), 2500);
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI Playlist Generator */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/30 via-purple-950/30 to-purple-900/20 border border-pink-500/30">
              <div className="flex items-center gap-2 text-pink-300 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-pink-400" />
                AI Mood & Culture DJ Engine
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Generate curated track lists by combining mood, language, country/culture, and song genre. Add directly to the master queue or save as a titled playlist!
              </p>
            </div>

            <form onSubmit={handleGenerateAiPlaylist} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mood */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Mood / Atmosphere
                  </label>
                  <select
                    value={aiMood}
                    onChange={(e) => setAiMood(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {MOODS.map((m) => (
                      <option key={m} value={m} className="bg-[#0c0c16]">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Language
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l} className="bg-[#0c0c16]">
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country / Region */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Country / Region
                  </label>
                  <select
                    value={aiCountry}
                    onChange={(e) => setAiCountry(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-[#0c0c16]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Song Type / Genre */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Song Type / Genre
                  </label>
                  <select
                    value={aiSongType}
                    onChange={(e) => setAiSongType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {SONG_TYPES.map((g) => (
                      <option key={g} value={g} className="bg-[#0c0c16]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Track Count selection */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-white/60">Number of tracks:</span>
                <div className="flex items-center gap-1.5">
                  {[5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAiCount(num)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        aiCount === num
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-white/60'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {aiError}
                </div>
              )}

              <button
                id="generate-ai-playlist-button"
                type="submit"
                disabled={isGeneratingAi}
                className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-pink-600/25 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is curating songs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate AI Playlist ({aiMood} • {aiSongType})</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated AI Results */}
            {aiGeneratedPlaylist && (
              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      {aiGeneratedPlaylist.title}
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {aiGeneratedPlaylist.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleAddAllAiToQueue}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add All to Queue
                    </button>
                    {onSaveAsPlaylist && (
                      <button
                        onClick={handleSaveAiAsPlaylist}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-white/10"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5 text-pink-400" />
                        Save Playlist
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {aiGeneratedPlaylist.tracks.map((t, idx) => (
                    <div
                      key={t.videoId + idx}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-white/40 w-4">#{idx + 1}</span>
                        {t.thumbnail && (
                          <img
                            src={t.thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{t.title}</div>
                          <div className="text-[11px] text-white/50 truncate">
                            {t.artist}
                            {t.reason && (
                              <span className="text-purple-300 ml-1.5 font-medium">
                                • {t.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handlePlayOrQueue(
                            {
                              videoId: t.videoId,
                              title: t.title,
                              artist: t.artist,
                              thumbnail:
                                t.thumbnail ||
                                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
                              duration: t.duration || 210,
                            },
                            false
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Queue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Group Playlists */}
        {/* ========================================================================= */}
        {activeTab === 'playlists' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Named Room Playlists</h3>
                <p className="text-xs text-white/50">
                  Shared collections of songs titled by group members.
                </p>
              </div>

              {onSaveAsPlaylist && (
                <button
                  onClick={() => setIsCreatingNewPlaylist((p) => !p)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Playlist
                </button>
              )}
            </div>

            {/* Create new playlist box */}
            {isCreatingNewPlaylist && (
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2.5">
                <span className="text-xs font-bold text-white">Create a New Named Playlist</span>
                <input
                  type="text"
                  placeholder="Playlist Title (e.g., Chill Vibes, Gym Bangers)..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsCreatingNewPlaylist(false)}
                    className="px-3 py-1 text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newPlaylistTitle.trim() || !onSaveAsPlaylist) return;
                      onSaveAsPlaylist(newPlaylistTitle.trim(), playlist);
                      setNewPlaylistTitle('');
                      setIsCreatingNewPlaylist(false);
                      setAddedNotification(`Created playlist "${newPlaylistTitle}"!`);
                      setTimeout(() => setAddedNotification(null), 2500);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500"
                  >
                    Save Current Queue as This Playlist
                  </button>
                </div>
              </div>
            )}

            {/* Playlist list */}
            {playlists.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                <FolderOpen className="w-8 h-8 text-white/20 mx-auto mb-2" />
                No named playlists created yet for this room. Save the master queue or create one!
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-purple-400" />
                          {pl.title}
                        </h4>
                        <p className="text-xs text-white/50 mt-0.5">
                          {pl.songs.length} tracks • Created by {pl.createdByName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onLoadPlaylist && (
                          <>
                            <button
                              onClick={() => {
                                onLoadPlaylist(pl.id, 'replace');
                                setAddedNotification(`Loaded "${pl.title}" into Master Queue`);
                                setTimeout(() => setAddedNotification(null), 2500);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-purple-600/30"
                            >
                              Load Queue
                            </button>
                            <button
                              onClick={() => {
                                onLoadPlaylist(pl.id, 'append');
                                setAddedNotification(`Appended "${pl.title}" to Master Queue`);
                                setTimeout(() => setAddedNotification(null), 2500);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition cursor-pointer"
                            >
                              Append
                            </button>
                          </>
                        )}

                        {onDeletePlaylist &&
                          (pl.createdBy === currentUserId || hasBaton) && (
                            <button
                              onClick={() => onDeletePlaylist(pl.id)}
                              title="Delete playlist"
                              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Preview first 3 tracks */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {pl.songs.slice(0, 5).map((song, i) => (
                        <div
                          key={song.id + i}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/30 border border-white/5 shrink-0 text-xs"
                        >
                          <img
                            src={song.thumbnail}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-white/80 max-w-[120px] truncate">{song.title}</span>
                        </div>
                      ))}
                      {pl.songs.length > 5 && (
                        <span className="text-[11px] text-white/40 shrink-0">
                          +{pl.songs.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
