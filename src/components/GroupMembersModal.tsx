import React, { useState, useEffect } from 'react';
import { RoomMember, UserProfile } from '../types';
import { Users, Crown, Shield, ShieldCheck, Check, X, Copy, QrCode, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

interface GroupMembersModalProps {
  roomId: string;
  roomName: string;
  isPrivate: boolean;
  pin?: string;
  isHost: boolean;
  members: RoomMember[];
  pendingMembers: RoomMember[];
  batonOwnerId: string | null;
  onApproveMember: (userId: string) => void;
  onRejectMember: (userId: string) => void;
  onClose: () => void;
}

export const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  roomId,
  roomName,
  isPrivate,
  pin,
  isHost,
  members,
  pendingMembers,
  batonOwnerId,
  onApproveMember,
  onRejectMember,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'share'>('members');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [shareUrl]);

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div id="group-members-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0a0a12]/95 border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl relative text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-600/10">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {roomName}
                {isPrivate && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Private
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/50">
                Room Code: <span className="font-mono text-purple-400 font-bold">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            id="close-members-modal-button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'members'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition relative ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Join Requests
            {pendingMembers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                {pendingMembers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'share'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share & QR
          </button>
        </div>

        {/* Tab 1: Active Members */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
            {members.map((member) => {
              const holdsBaton = member.id === batonOwnerId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{member.avatar || '🎧'}</span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {member.name}
                        {member.isHost && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30">
                            Host
                          </span>
                        )}
                        {holdsBaton && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold flex items-center gap-1 shadow-md shadow-purple-600/30">
                            <Crown className="w-3 h-3" /> Baton Holder
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40">
                        Synchronized listener
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Pending Requests (Accept / Reject) */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
            {pendingMembers.length === 0 ? (
              <div className="text-center py-10 text-white/40 text-xs">
                No pending join requests at the moment.
              </div>
            ) : (
              pendingMembers.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-purple-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{req.avatar || '🎧'}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{req.name}</div>
                      <div className="text-[11px] text-purple-300">
                        Wants to join this private room
                      </div>
                    </div>
                  </div>

                  {isHost ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApproveMember(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md shadow-purple-600/30"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => onRejectMember(req.id)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-pink-500/20 text-white/50 hover:text-pink-300 text-xs transition cursor-pointer border border-white/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-white/40 italic">
                      Awaiting Host Approval
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Shareable link & QR Code */}
        {activeTab === 'share' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-center">
            <p className="text-xs text-white/50">
              Invite friends to listen simultaneously on Android, iPhone, or Desktop.
            </p>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="inline-block p-4 bg-white/10 border border-white/20 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="bg-white p-2 rounded-xl">
                  <img src={qrCodeUrl} alt="Room QR Code" className="w-44 h-44 mx-auto" />
                </div>
                <p className="text-[11px] text-white/70 font-semibold mt-2">
                  Scan with camera to join immediately
                </p>
              </div>
            )}

            {/* Share Link Box */}
            <div className="text-left space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">
                  Shareable Room URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/80 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'link')}
                    className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/30"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">
                  Room Code (Direct Join)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomId}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-purple-400 font-bold font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(roomId, 'code')}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {pin && (
                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
                  <span>Room Passcode PIN: <strong className="font-mono">{pin}</strong></span>
                  <button
                    onClick={() => copyToClipboard(pin, 'code')}
                    className="text-[11px] underline font-semibold text-purple-300 hover:text-purple-200 cursor-pointer"
                  >
                    Copy PIN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
