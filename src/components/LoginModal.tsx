import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Sparkles, Music2, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: UserProfile) => void;
  defaultRoomId?: string;
  onJoinRoom?: (roomId: string, pin?: string) => void;
  onCreateRoom?: (name: string, isPrivate: boolean, pin?: string) => void;
}

const AVATARS = ['🎧', '🎵', '🎸', '🎹', '🎤', '🎷', '🥁', '⚡', '🔥', '👑'];
const COLORS = ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#06b6d4'];

export const LoginModal: React.FC<LoginModalProps> = ({
  onLogin,
  defaultRoomId,
  onJoinRoom,
  onCreateRoom,
}) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎧');
  const [selectedColor, setSelectedColor] = useState('#f59e0b');
  const [roomAction, setRoomAction] = useState<'join' | 'create'>('join');
  const [targetRoomId, setTargetRoomId] = useState(defaultRoomId || 'groove-402');
  const [roomName, setRoomName] = useState('Late Night Vibes');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const user: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      avatar: selectedAvatar,
      color: selectedColor,
    };

    onLogin(user);

    if (roomAction === 'create' && onCreateRoom) {
      onCreateRoom(roomName.trim() || 'Music Lounge', isPrivate, pin.trim() || undefined);
    } else if (onJoinRoom) {
      onJoinRoom(targetRoomId.trim(), pin.trim() || undefined);
    }
  };

  return (
    <div id="login-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-[#0a0a12]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl relative text-neutral-100">
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Music2 className="w-8 h-8" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            BATON <span className="text-purple-400">AUDIO</span>
            <span className="text-xs bg-purple-600/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
              Live
            </span>
          </h1>
          <p className="text-sm text-white/50 mt-1.5">
            Synchronized YouTube Music listening with first-come first-served Baton control.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <div className="relative">
              <input
                id="login-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Beats"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
              <User className="w-4 h-4 text-white/40 absolute right-3.5 top-3.5" />
            </div>
          </div>

          {/* Avatar Choice */}
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              Choose Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition ${
                    selectedAvatar === emoji
                      ? 'bg-purple-600/30 border-2 border-purple-500 scale-105 shadow-md shadow-purple-500/20'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Room Action Tabs */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setRoomAction('join')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  roomAction === 'join'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Join Existing Room
              </button>
              <button
                type="button"
                onClick={() => setRoomAction('create')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  roomAction === 'create'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Create Private Room
              </button>
            </div>
          </div>

          {roomAction === 'join' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Room Code or ID
                </label>
                <input
                  id="join-room-id-input"
                  type="text"
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  placeholder="e.g. groove-402"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Room PIN (if private room)
                </label>
                <input
                  id="join-room-pin-input"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Optional 4-digit PIN"
                  maxLength={6}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  Room Name
                </label>
                <input
                  id="create-room-name-input"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Tokyo Lo-Fi Lounge"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Private Room
                  </div>
                  <div className="text-[11px] text-white/40">
                    Host approval required to join
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 cursor-pointer"
                />
              </div>
              {isPrivate && (
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">
                    Set Room Passcode / PIN
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    maxLength={6}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          <button
            id="login-submit-button"
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {roomAction === 'join' ? 'Enter Synchronized Room' : 'Launch New Room'}
          </button>
        </form>
      </div>
    </div>
  );
};
