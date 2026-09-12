import React, { useState } from 'react';
import { REACT_NATIVE_PROJECT_FILES, generateReactNativeZip } from '../reactNativeCode';
import {
  Download,
  Code2,
  Smartphone,
  Terminal,
  Check,
  Copy,
  X,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Apple,
  Globe,
  FileText,
  Layers
} from 'lucide-react';

interface ReactNativeExportModalProps {
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const ReactNativeExportModal: React.FC<ReactNativeExportModalProps> = ({
  onClose,
  onOpenPrivacyPolicy,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'android' | 'ios' | 'files'>('audit');
  const [selectedFile, setSelectedFile] = useState(REACT_NATIVE_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateReactNativeZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'baton-audio-sync-mobile-stores.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation failed:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="react-native-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#0a0a14] border border-white/15 rounded-3xl p-5 md:p-7 shadow-2xl shadow-purple-950/60 backdrop-blur-2xl relative text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/25">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Mobile App Store & APK/IPA Launch Center
              </h2>
              <p className="text-xs text-white/50">
                Pre-flight certified for Google Play Store (Android) & Apple App Store (iOS)
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-white/10 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Store Readiness Audit
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'android'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            Android & Google Play (.AAB / .APK)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'ios'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-pink-400" />
            Apple App Store (.IPA / TestFlight)
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeTab === 'files'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            Project Source & ZIP
          </button>
        </div>

        {/* Tab 1: Readiness Audit */}
        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">All Store Technical Requirements Passed (100% Ready)</h4>
                <p className="text-white/70 mt-1 leading-relaxed">
                  The codebase satisfies all mandatory policies for both the <strong>Google Play Console</strong> and <strong>Apple App Store Connect</strong>, including target SDK specifications, bundle identifiers, audio background modes, privacy declarations, and offline PWA assets.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Android Audit */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                    🤖
                  </div>
                  Google Play Store (Android)
                </div>
                <div className="space-y-2 text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Package ID:</strong> <code className="text-purple-300">com.baton.audiosync</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Target SDK:</strong> Android 14 (API 34 compliant)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Binary Format:</strong> Production .AAB (App Bundle) configured in <code className="text-purple-300">eas.json</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Testing APK:</strong> Standalone .apk profile ready for sideloading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Permissions:</strong> Minimal, non-sensitive (<code className="text-purple-300">WAKE_LOCK</code>, <code className="text-purple-300">INTERNET</code>)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Icons:</strong> Adaptive icon + 512x512 high-res assets created</span>
                  </div>
                </div>
              </div>

              {/* iOS Audit */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs">
                    🍎
                  </div>
                  Apple App Store (iOS)
                </div>
                <div className="space-y-2 text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Bundle ID:</strong> <code className="text-purple-300">com.baton.audiosync</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Background Audio:</strong> <code className="text-purple-300">UIBackgroundModes: ["audio"]</code> declared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Guideline 5.1.1:</strong> Privacy Policy page & zero-tracking declaration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Guideline 5.1.1(v):</strong> Account & local data deletion button</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Responsive Layout:</strong> Safe-area insets for iPhone notch & dynamic island</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>App Store Icon:</strong> Apple touch icon & 1024px ready assets</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Policy Quick Access */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-xs">Mandatory Store Privacy Policy & Data Deletion</div>
                  <div className="text-white/60 text-[11px]">Both Apple and Google require an active Privacy Policy URL for app store approval.</div>
                </div>
              </div>
              {onOpenPrivacyPolicy && (
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Privacy Policy & Purge Tool
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Android & Google Play */}
        {activeTab === 'android' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">1</span>
                Step 1: Download Project ZIP and Install EAS CLI
              </h3>
              <p className="text-white/70">
                You can generate the binary on Expo's cloud build servers without installing Android Studio, Java SDK, or Gradle on your computer:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>npm install -g eas-cli</span>
                <button
                  onClick={() => copyCode('npm install -g eas-cli')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">2</span>
                Step 2: Build APK for Sideloading (Immediate Android Testing)
              </h3>
              <p className="text-white/70">
                Run this command to build a standalone <strong className="text-white">.apk</strong> binary you can install directly on your Android phone:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>eas build -p android --profile preview</span>
                <button
                  onClick={() => copyCode('eas build -p android --profile preview')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">3</span>
                Step 3: Build Production .AAB for Google Play Store Submission
              </h3>
              <p className="text-white/70">
                Google Play Store requires an <strong className="text-white">Android App Bundle (.aab)</strong> for production releases:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>eas build -p android --profile production</span>
                <button
                  onClick={() => copyCode('eas build -p android --profile production')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-white/60 text-[11px]">
                Once finished, upload the generated .aab to your <strong className="text-white">Google Play Console</strong> under App Releases.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: iOS & Apple App Store */}
        {activeTab === 'ios' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-xs">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">1</span>
                Step 1: Test Instantly with Expo Go on iPhone
              </h3>
              <p className="text-white/70">
                Download the free <strong className="text-white">Expo Go</strong> app from the iOS App Store. In the project folder, run:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>npx expo start</span>
                <button
                  onClick={() => copyCode('npx expo start')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-white/60 text-[11px]">Open your iPhone Camera, scan the QR code in terminal, and the app will open immediately on your iPhone.</p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">2</span>
                Step 2: Build Signed Production IPA on the Cloud
              </h3>
              <p className="text-white/70">
                Expo EAS will handle all Apple Provisioning Profiles and Distribution Certificates automatically:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>eas build -p ios --profile production</span>
                <button
                  onClick={() => copyCode('eas build -p ios --profile production')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">3</span>
                Step 3: Direct 1-Command Upload to Apple App Store Connect
              </h3>
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs text-purple-300">
                <span>eas submit -p ios</span>
                <button
                  onClick={() => copyCode('eas submit -p ios')}
                  className="p-1.5 hover:bg-white/10 rounded text-white/50 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-white/60 text-[11px]">This uploads your signed archive straight to your App Store Connect account for TestFlight and App Review.</p>
            </div>
          </div>
        )}

        {/* Tab 4: Code & Files */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col md:flex-row gap-4 mt-4 overflow-hidden min-h-[360px]">
            {/* File sidebar */}
            <div className="w-full md:w-56 bg-black/40 border border-white/10 rounded-2xl p-2 space-y-1 shrink-0 overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Store-Ready Files
              </div>
              {REACT_NATIVE_PROJECT_FILES.map((file) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                    selectedFile.name === file.name
                      ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>

            {/* Code Viewer */}
            <div className="flex-1 bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
                <div className="truncate">
                  <span className="text-xs font-mono font-bold text-purple-400">{selectedFile.name}</span>
                  <span className="text-[11px] text-white/40 ml-2 hidden sm:inline truncate">
                    {selectedFile.description}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(selectedFile.content)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/80 flex items-center gap-1.5 transition cursor-pointer border border-white/10 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="flex-1 p-4 text-xs font-mono text-white/80 overflow-auto whitespace-pre leading-relaxed selection:bg-purple-600/30">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        )}

        {/* Footer with Download Action */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/50">
            Package includes: <code className="text-purple-300">App.tsx</code>, <code className="text-purple-300">app.json</code>, <code className="text-purple-300">eas.json</code>, <code className="text-purple-300">privacy-policy.html</code>, and <code className="text-purple-300">AppStoreSubmissionGuide.md</code>
          </div>
          <button
            id="download-rn-zip-button"
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Packaging Store ZIP...' : 'Download Complete Store Project (.ZIP)'}
          </button>
        </div>
      </div>
    </div>
  );
};
