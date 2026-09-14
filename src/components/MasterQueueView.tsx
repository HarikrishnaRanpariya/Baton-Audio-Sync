import React, { useState } from 'react';
import { SongItem, PlaylistGroup, PlaybackState } from '../types';
import {
  ListMusic,
  Lock,
  Unlock,
  Repeat,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  BookmarkPlus,
  FolderOpen,
  Sparkles,
  Music2,
  Check,
  Play,
  Volume2,
  Sliders,
  Upload,
} from 'lucide-react';

interface MasterQueueViewProps {
  queue: SongItem[];
  isLocked: boolean;
  currentPlayback: PlaybackState;
  playlists: PlaylistGroup[];
  activePlaylistId: string | null;
  hasBaton: boolean;
  currentUserId: string;
  onToggleLock: () => void;
  onRemoveSong: (songId: string) => void;
  onReorderQueue: (newQueue: SongItem[]) => void;
  onOpenMusicSearch: (initialTab?: 'search' | 'local' | 'url' | 'ai' | 'playlists') => void;
  onSaveAsPlaylist: (title: string) => void;
  onLoadPlaylist: (playlistId: string, mode: 'replace' | 'append') => void;
  onPlaySongNow?: (song: SongItem) => void;
}

export const MasterQueueView: React.FC<MasterQueueViewProps> = ({
  queue,
  isLocked,
  currentPlayback,
  playlists,
  activePlaylistId,
  hasBaton,
  currentUserId,
  onToggleLock,
  onRemoveSong,
  onReorderQueue,
  onOpenMusicSearch,
  onSaveAsPlaylist,
  onLoadPlaylist,
  onPlaySongNow,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistTitleInput, setPlaylistTitleInput] = useState('');
  const [showPlaylistsDropdown, setShowPlaylistsDropdown] = useState(false);

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const updated = [...queue];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderQueue(updated);
  };

  const handleSavePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistTitleInput.trim()) return;
    onSaveAsPlaylist(playlistTitleInput.trim());
    setPlaylistTitleInput('');
    setShowSaveModal(false);
  };

  const currentSong = currentPlayback.currentSong;

  return (
    <div
      id="master-queue-section"
      className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden text-white"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                Master Song Queue
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-semibold">
                {queue.length} {queue.length === 1 ? 'song' : 'songs'}
              </span>
            </div>
            <p className="text-xs text-white/50">
              Shared queue • Anyone in the room can add songs • Strict duplicate prevention
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Circular Buffer Lock Button */}
          <button
            id="toggle-queue-lock-button"
            onClick={onToggleLock}
            title={
              isLocked
                ? 'Queue is Locked into Circular Buffer (Songs loop continuously)'
                : 'Click to Lock Queue into Circular Buffer mode'
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              isLocked
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <Repeat className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>Circular Buffer (Locked)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-white/50" />
                <span>Lock Queue</span>
              </>
            )}
          </button>

          {/* Group Playlists Button */}
          <div className="relative">
            <button
              id="group-playlists-dropdown-button"
              onClick={() => setShowPlaylistsDropdown((p) => !p)}
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Saved Playlists ({playlists.length})</span>
            </button>

            {/* Dropdown Menu */}
            {showPlaylistsDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0e0e18]/95 border border-purple-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl z-30 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Group Playlists
                  </span>
                  <button
                    onClick={() => {
                      setShowPlaylistsDropdown(false);
                      onOpenMusicSearch('playlists');
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                  >
                    Manage
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <p className="text-xs text-white/40 py-3 text-center">
                    No named playlists saved yet. Save the current queue or create one!
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">
                            {pl.title}
                          </div>
                          <div className="text-[10px] text-white/40">
                            {pl.songs.length} songs • By {pl.createdByName}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onLoadPlaylist(pl.id, 'replace');
                            setShowPlaylistsDropdown(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shrink-0 transition"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Jump to Personal Volume Mixer */}
          <button
            id="queue-volume-mixer-button"
            onClick={() => {
              const el = document.getElementById('personal-volume-mixer-card');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            title="Jump to Personal Volume Mixer"
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Volume Mixer</span>
          </button>

          {/* Save Queue as Named Playlist */}
          {queue.length > 0 && (
            <button
              id="save-queue-as-playlist-button"
              onClick={() => setShowSaveModal(true)}
              title="Save current queue as a titled playlist"
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Save as Playlist</span>
            </button>
          )}

          {/* Upload MP3 Button */}
          <button
            id="upload-mp3-to-queue-button"
            onClick={() => onOpenMusicSearch('local')}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Upload MP3</span>
            <span className="sm:hidden">MP3</span>
          </button>

          {/* Add Songs Button */}
          <button
            id="add-song-to-queue-button"
            onClick={() => onOpenMusicSearch('search')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Songs</span>
          </button>
        </div>
      </div>

      {/* Lock / Circular Buffer Notice Banner */}
      {isLocked && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <Repeat className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="leading-snug">
            <strong className="text-amber-300 font-bold">Circular Buffer Mode Active:</strong> Each song returns to the end of the queue after playing. The group's playlist never empties and continues playing seamlessly!
          </div>
        </div>
      )}

      {/* Now Playing Highlight */}
      {currentSong && (
        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/10 border border-purple-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                <Volume2 className="w-2.5 h-2.5 text-black" />
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Now Playing
              </span>
              <div className="text-sm font-bold text-white truncate">
                {currentSong.title}
              </div>
              <div className="text-xs text-white/60 truncate">
                {currentSong.artist} • Queued by {currentSong.addedByName || 'Group'}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-white/50 px-2 py-1 rounded bg-black/40 border border-white/10 shrink-0">
            Current
          </span>
        </div>
      )}

      {/* Up Next Master Queue List */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
          <span>Up Next in Master Queue</span>
          {isLocked && (
            <span className="text-[11px] text-amber-400/90 font-mono">
              [Order Locked • Reordering Disabled]
            </span>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 bg-white/5">
            <Music2 className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white/70">Master queue is empty</p>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              Any group member can add songs or use the AI Playlist generator to queue up tunes!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                onClick={() => onOpenMusicSearch('local')}
                className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-300" />
                Upload MP3 / Audio
              </button>
              <button
                onClick={() => onOpenMusicSearch('search')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Browse Songs
              </button>
              <button
                onClick={() => onOpenMusicSearch('ai')}
                className="px-4 py-2 rounded-xl bg-pink-600/30 hover:bg-pink-600/40 border border-pink-500/40 text-pink-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                AI Generate List
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {queue.map((song, index) => {
              const isAddedByMe = song.addedBy === currentUserId;
              return (
                <div
                  key={`${song.id}-${index}`}
                  className="group p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition"
                >
                  {/* Track Order & Art */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-mono font-bold text-white/40 group-hover:text-purple-400 shrink-0">
                      #{index + 1}
                    </span>
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold text-white truncate">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-white/50 truncate flex items-center gap-1.5">
                        <span>{song.artist}</span>
                        <span>•</span>
                        <span className="text-purple-300">
                          {isAddedByMe ? 'Added by you' : `By ${song.addedByName || 'Member'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Reorder & Remove) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reorder Buttons (enabled if not locked) */}
                    {!isLocked && (
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={() => moveTrack(index, 'up')}
                          disabled={index === 0}
                          title="Move up in queue"
                          className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveTrack(index, 'down')}
                          disabled={index === queue.length - 1}
                          title="Move down in queue"
                          className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Quick Play */}
                    {onPlaySongNow && (
                      <button
                        onClick={() => onPlaySongNow(song)}
                        title={hasBaton ? "Play right now" : "Take baton & play right now"}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Remove track */}
                    {!isLocked && (
                      <button
                        onClick={() => onRemoveSong(song.id)}
                        title="Remove from queue"
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Queue as Named Playlist Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0e0e18] border border-purple-500/30 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Save Queue as Playlist</h3>
            <p className="text-xs text-white/60 mb-4">
              Give a title to this playlist. All group members will be able to load it anytime.
            </p>

            <form onSubmit={handleSavePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Chill Friday Vibes, Roadtrip Anthems"
                  value={playlistTitleInput}
                  onChange={(e) => setPlaylistTitleInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="text-xs text-purple-300/80 bg-purple-600/10 p-2.5 rounded-xl border border-purple-500/20">
                Saving {queue.length} songs from the current queue.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold hover:scale-105 transition shadow-md shadow-purple-600/30"
                >
                  Save Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
