import React from 'react';
import { ShieldCheck, X, FileText, Trash2, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
  onClearData?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ onClose, onClearData }) => {
  const [dataCleared, setDataCleared] = React.useState(false);

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all local session data, room cache, and saved preferences? (App Store Guideline 5.1.1v compliance)')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        setDataCleared(true);
        if (onClearData) onClearData();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Failed to clear data:', err);
      }
    }
  };

  return (
    <div id="privacy-policy-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0e0a1a] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Privacy Policy & Store Compliance</h2>
              <p className="text-xs text-white/50">Compliant with Apple Guideline 5.1.1 & Google Play User Data Policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 my-4 space-y-4 text-xs text-white/70 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center gap-3">
            <Lock className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Zero Tracking Guarantee: </span>
              Baton Audio Sync does not collect, sell, or monetize any personal identifiable information (PII), device telemetry, or advertising identifiers.
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">1. Information We Process</h3>
            <p>
              When joining an audio room, the application processes a temporary nickname, avatar identifier, and room code in memory. These are strictly used for real-time peer synchronization over WebSockets and are not permanently stored on remote databases or shared with third parties.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">2. Audio & Media Playback</h3>
            <p>
              Playback is facilitated using the official YouTube IFrame Embed API. All video playback obeys the YouTube Terms of Service and API Services Terms. No audio files or protected copyright streams are downloaded, stored, or re-hosted.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">3. Local Device Storage</h3>
            <p>
              The app stores client-side preferences (such as personal audio gain volume, mute state, and notification settings) solely in your device's local storage (<code className="text-purple-300 font-mono">localStorage</code>).
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">4. Apple Guideline 5.1.1(v) — Right to Data Deletion</h3>
            <p>
              In accordance with Apple App Store review requirements, users have full autonomous control to instantly purge all stored local settings, cached room history, and session identifiers at any time using the button below.
            </p>
          </div>
        </div>

        {/* Account / Data Deletion Action */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleClearAllData}
            disabled={dataCleared}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {dataCleared ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Data Purged Successfully
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-red-400" />
                Delete All Local Data & Reset Session
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
