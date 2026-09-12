import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { MessageSquare, Send, Sparkles, Smile, Flame, Music, Heart, ThumbsUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatAndReactionsProps {
  chat: ChatMessage[];
  currentUser: UserProfile;
  onSendMessage: (text: string, type?: 'chat' | 'reaction') => void;
}

const REACTION_EMOJIS = ['🔥', '🎵', '🕺', '❤️', '👏', '⚡', '🎉'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  chat,
  currentUser,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'chat');
    setInputText('');
  };

  const handleSendReaction = (emoji: string) => {
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 },
      scalar: 1.2,
    });
    onSendMessage(emoji, 'reaction');
  };

  return (
    <div id="chat-and-reactions-container" className="w-full">
      {/* Floating Synchronized Reactions Bar */}
      <div className="flex items-center justify-between gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider pl-1 pr-1 hidden sm:inline">
            React:
          </span>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-purple-600/30 hover:scale-115 active:scale-95 text-base flex items-center justify-center transition cursor-pointer border border-white/5"
            >
              {emoji}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            isOpen
              ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
              : 'bg-white/10 text-white/80 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
          {chat.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-600/40 text-purple-200 text-[10px] flex items-center justify-center font-mono">
              {chat.length > 9 ? '9+' : chat.length}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="mt-3 bg-black/70 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex flex-col h-64 text-white">
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {chat.length === 0 ? (
              <div className="text-center py-10 text-white/40">
                No messages yet. Say hi or drop a reaction!
              </div>
            ) : (
              chat.map((msg) => {
                const isMe = msg.userId === currentUser.id;
                const isSystem = msg.type === 'system' || msg.type === 'baton';

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="text-center py-1 px-3 rounded-full bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-300 font-medium"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-white/40 px-1 mb-0.5 font-mono">
                      {msg.userName} {isMe && '(You)'}
                    </span>
                    <div
                      className={`px-3.5 py-2 rounded-2xl max-w-[80%] ${
                        isMe
                          ? 'bg-purple-600 text-white font-medium rounded-tr-xs shadow-md shadow-purple-600/20'
                          : 'bg-white/10 text-white/90 rounded-tl-xs border border-white/5'
                      } ${msg.type === 'reaction' ? 'text-xl py-1' : ''}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send synchronized comment..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
