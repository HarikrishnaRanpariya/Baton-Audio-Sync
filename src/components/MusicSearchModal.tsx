import React, { useState } from 'react';
import { SongItem, PlaylistGroup, AiPlaylistCriteria } from '../types';
import { CURATED_TRACKS, extractYouTubeVideoId } from '../musicCatalog';
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
  initialTab?: 'search' | 'url' | 'ai' | 'playlists';
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
  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'ai' | 'playlists'>(initialTab);
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [urlError, setUrlError] = useState('');
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

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

    const videoId = extractYouTubeVideoId(customUrl);
    if (!videoId) {
      setUrlError('Could not extract a valid YouTube video ID. Please check the URL.');
      return;
    }

    const song: SongItem = {
      id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId,
      title: customTitle.trim() || `YouTube Track (${videoId})`,
      artist: customArtist.trim() || 'YouTube Music Stream',
      thumbnail: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80`,
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
        <div className="grid grid-cols-4 gap-1.5 mt-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
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
            <span className="hidden sm:inline">Search Catalog</span>
            <span className="sm:hidden">Catalog</span>
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
            id="tab-ai-generator"
            onClick={() => setActiveTab('ai')}
            className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30 font-bold'
                : 'text-pink-300/80 hover:text-pink-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">AI Playlist</span>
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
        {/* TAB 2: Custom YouTube URL */}
        {/* ========================================================================= */}
        {activeTab === 'url' && (
          <form onSubmit={handleCustomUrlSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Paste YouTube / YouTube Music Link
              </label>
              <input
                id="custom-youtube-url-input"
                type="text"
                required
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://music.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Supports standard YouTube videos, YouTube Shorts, and YouTube Music streams.
              </p>
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
