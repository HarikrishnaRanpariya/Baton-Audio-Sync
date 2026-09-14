import React, { useState } from 'react';
import { RadioStation, DIRECT_RADIO_STREAMS } from '../musicCatalog';
import { SongItem, PlaybackState } from '../types';
import {
  Radio,
  X,
  Play,
  Plus,
  Share2,
  Volume2,
  Sparkles,
  Signal,
  Flame,
  Music2,
  ExternalLink,
  Check,
  Globe,
  Sliders,
  Crown
} from 'lucide-react';

interface RadioBroadcasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayback: PlaybackState;
  hasBaton: boolean;
  batonOwnerName: string | null;
  currentUserId: string;
  currentUserName: string;
  onBroadcastStation: (station: RadioStation, playImmediately: boolean) => void;
  onSendChatMessage?: (text: string) => void;
  onRequestBaton?: () => void;
  onClaimBaton?: () => void;
}

export const RadioBroadcasterModal: React.FC<RadioBroadcasterModalProps> = ({
  isOpen,
  onClose,
  currentPlayback,
  hasBaton,
  batonOwnerName,
  currentUserId,
  currentUserName,
  onBroadcastStation,
  onSendChatMessage,
  onRequestBaton,
  onClaimBaton,
}) => {
  const [activeTab, setActiveTab] = useState<'stations' | 'custom'>('stations');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [customName, setCustomName] = useState('');
  const [customGenre, setCustomGenre] = useState('Web Radio');
  const [customUrl, setCustomUrl] = useState('');
  const [customThumbnail, setCustomThumbnail] = useState('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80');
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSong = currentPlayback.currentSong;
  const isCurrentlyStreaming = currentPlayback.isPlaying && currentSong?.sourceType === 'audio-url';

  const genres = ['all', 'Lo-Fi / Chillhop', 'Synthwave / Retro', 'Jazz / Lounge', 'Ambient / Meditation', 'Acoustic / Folk', 'EDM / Dance', 'Classical / Piano'];

  const filteredStations = filterGenre === 'all'
    ? DIRECT_RADIO_STREAMS
    : DIRECT_RADIO_STREAMS.filter(s => s.genre.toLowerCase().includes(filterGenre.toLowerCase()));

  const handleBroadcast = (station: RadioStation) => {
    onBroadcastStation(station, true);
    if (onSendChatMessage) {
      onSendChatMessage(`📻 tuned the group to 24/7 Live Radio: "${station.name}" (${station.genre})`);
    }
    setBroadcastNotice(`Broadcasting "${station.name}" to all room members!`);
    setTimeout(() => {
      setBroadcastNotice(null);
      onClose();
    }, 1800);
  };

  const handleQueue = (station: RadioStation) => {
    onBroadcastStation(station, false);
    setBroadcastNotice(`Added "${station.name}" to the room queue.`);
    setTimeout(() => setBroadcastNotice(null), 2500);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customName.trim()) return;

    const customStation: RadioStation = {
      id: `custom-radio-${Date.now()}`,
      name: customName.trim(),
      genre: customGenre.trim() || 'Live Radio',
      streamUrl: customUrl.trim(),
      thumbnail: customThumbnail || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
      description: 'Custom community broadcast audio stream'
    };

    handleBroadcast(customStation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0e0d16] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Broadcast Banner */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-amber-950/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Group Live Radio Broadcaster
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-white/60">
                Stream 24/7 web radio synchronized in real-time across all group members
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DJ Baton Status Info */}
        <div className="px-4 py-2 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2">
            <Crown className={`w-3.5 h-3.5 ${hasBaton ? 'text-amber-400' : 'text-white/40'}`} />
            <span>
              {hasBaton
                ? 'You hold the DJ Baton: Broadcasts play immediately for everyone'
                : batonOwnerName
                ? `DJ Baton is held by ${batonOwnerName}`
                : 'DJ Baton is open: Anyone can claim and broadcast'}
            </span>
          </div>

          {!hasBaton && (
            <div className="flex items-center gap-1.5">
              {!batonOwnerName && onClaimBaton && (
                <button
                  onClick={onClaimBaton}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition"
                >
                  Claim DJ Baton
                </button>
              )}
              {batonOwnerName && onRequestBaton && (
                <button
                  onClick={onRequestBaton}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold transition"
                >
                  Request Baton
                </button>
              )}
            </div>
          )}
        </div>

        {/* Success / Broadcast Notification Toast */}
        {broadcastNotice && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="truncate">{broadcastNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2 shrink-0 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'stations'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Curated Stations ({DIRECT_RADIO_STREAMS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Custom Stream URL</span>
          </button>
        </div>

        {/* Tab 1: Curated Stations List */}
        {activeTab === 'stations' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Genre Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGenre(g)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    filterGenre === g
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {g === 'all' ? 'All Genres' : g}
                </button>
              ))}
            </div>

            {/* Stations Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStations.map((station) => {
                const isCurrentStation = isCurrentlyStreaming && (
                  currentSong?.sourceUrl === station.streamUrl ||
                  currentSong?.title === station.name
                );

                return (
                  <div
                    key={station.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isCurrentStation
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img
                          src={station.thumbnail}
                          alt={station.name}
                          className="w-full h-full object-cover"
                        />
                        {isCurrentStation && (
                          <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-1 bg-amber-400 rounded-full animate-bounce h-3" />
                              <span className="w-1 bg-amber-400 rounded-full animate-bounce h-4 delay-75" />
                              <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2 delay-150" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[10px] font-bold">
                            {station.genre}
                          </span>
                          {isCurrentStation && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                              On Air
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 truncate">
                          {station.name}
                        </h4>
                        <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">
                          {station.description}
                        </p>
                      </div>
                    </div>

                    {/* Broadcast Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleBroadcast(station)}
                        className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                          isCurrentStation
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>{isCurrentStation ? 'Re-Sync Room' : 'Broadcast to Group'}</span>
                      </button>

                      <button
                        onClick={() => handleQueue(station)}
                        title="Add to Master Queue"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Stream URL */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Broadcast Custom Web Radio or Icecast Stream</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Connect any live online radio station (Icecast, SHOUTcast, HLS, or direct audio feed). When broadcasted, all group members instantly tune into the same stream.
              </p>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Stream Audio URL (Direct .mp3 / .aac / Icecast)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://streaming.example.fm/listen.mp3"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Station Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ibiza Global Radio"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Genre / Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deep House / Chill"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Station Artwork / Image URL (optional)
                </label>
                <input
                  type="url"
                  value={customThumbnail}
                  onChange={(e) => setCustomThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!customUrl.trim() || !customName.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Broadcast Custom Radio Stream to Group</span>
            </button>
          </form>
        )}

        {/* Modal Footer Note */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center text-[11px] text-white/40">
          💡 Live radio streams use direct HTML5 streaming audio, fully bypassing mobile and YouTube embedding restrictions.
        </div>
      </div>
    </div>
  );
};
