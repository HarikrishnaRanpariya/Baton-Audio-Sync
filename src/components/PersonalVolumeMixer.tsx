import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Crown,
  Lock,
  RotateCcw,
  Sparkles,
  Info,
  Radio,
  Headphones,
} from 'lucide-react';

interface PersonalVolumeMixerProps {
  masterLevel: number; // 0 - 100, broadcast by Baton Owner
  hasBaton: boolean;
  batonOwnerName: string | null;
  isPlaying: boolean;
  onMasterLevelChange?: (newLevel: number) => void;
  onEffectiveVolumeChange: (effectiveVol: number, isMuted: boolean) => void;
  className?: string;
  isCompact?: boolean;
}

export const PersonalVolumeMixer: React.FC<PersonalVolumeMixerProps> = ({
  masterLevel = 80,
  hasBaton,
  batonOwnerName,
  isPlaying,
  onMasterLevelChange,
  onEffectiveVolumeChange,
  className = '',
  isCompact = false,
}) => {
  // Local Personal Gain state (0% - 150%, 100% = unity gain)
  const [personalGain, setPersonalGain] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('baton_personal_gain');
      if (saved !== null) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 0 && val <= 150) return val;
      }
    } catch {
      // ignore
    }
    return 100;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('baton_personal_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [vuLeft, setVuLeft] = useState(0);
  const [vuRight, setVuRight] = useState(0);
  const animRef = useRef<number | null>(null);

  // Compute effective local volume (0 - 100)
  const effectiveVolume = isMuted
    ? 0
    : Math.min(100, Math.round((masterLevel * personalGain) / 100));

  // Propagate effective local volume up to AudioPlayer (which adjusts YouTube iframe)
  useEffect(() => {
    onEffectiveVolumeChange(effectiveVolume, isMuted);
  }, [effectiveVolume, isMuted, onEffectiveVolumeChange]);

  // Save personal preferences
  useEffect(() => {
    try {
      localStorage.setItem('baton_personal_gain', personalGain.toString());
      localStorage.setItem('baton_personal_muted', isMuted.toString());
    } catch {
      // ignore
    }
  }, [personalGain, isMuted]);

  // Simulated live VU meter animation when playing
  useEffect(() => {
    if (!isPlaying || isMuted || effectiveVolume === 0) {
      setVuLeft(0);
      setVuRight(0);
      return;
    }

    let phase = 0;
    const animate = () => {
      phase += 0.2;
      const baseL = effectiveVolume / 100;
      const noiseL = Math.sin(phase * 1.7) * 0.15 + Math.cos(phase * 3.1) * 0.1;
      const noiseR = Math.cos(phase * 1.9) * 0.15 + Math.sin(phase * 2.7) * 0.1;

      const currentL = Math.max(0, Math.min(1, baseL + noiseL * baseL));
      const currentR = Math.max(0, Math.min(1, baseL + noiseR * baseL));

      setVuLeft(Math.round(currentL * 100));
      setVuRight(Math.round(currentR * 100));

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, isMuted, effectiveVolume]);

  const handleGainChange = (newGain: number) => {
    setPersonalGain(newGain);
    if (isMuted && newGain > 0) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleResetUnity = () => {
    setPersonalGain(100);
    setIsMuted(false);
  };

  const calculateDb = (gain: number) => {
    if (gain <= 0) return '-inf dB';
    const db = (20 * Math.log10(gain / 100)).toFixed(1);
    return Number(db) > 0 ? `+${db} dB` : `${db} dB`;
  };

  const PRESETS = [
    { label: 'Mute', gain: 0 },
    { label: '50% Low', gain: 50 },
    { label: '100% Unity', gain: 100 },
    { label: '125% Boost', gain: 125 },
    { label: '150% Max', gain: 150 },
  ];

  return (
    <div
      id="personal-volume-mixer-card"
      className={`bg-white/[0.04] border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md relative overflow-hidden text-white transition-all ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Personal Volume Mixer
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Independent Local DSP
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Adjust your ear volume freely without desynchronizing group playback
            </p>
          </div>
        </div>

        {/* Local Mute for Me Button */}
        <button
          id="mixer-mute-toggle-button"
          onClick={handleToggleMute}
          title="Mute for you only — room stream continues uninterrupted"
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            isMuted
              ? 'bg-rose-500/25 border-rose-500/50 text-rose-300 shadow-md shadow-rose-500/20 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:text-white'
          }`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>Muted for You</span>
            </>
          ) : (
            <>
              <Headphones className="w-3.5 h-3.5 text-purple-300" />
              <span>Mute for Me</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* LEFT COLUMN: Visual Indicator showing 'Master Level' set by baton owner */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Baton Master Level</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {hasBaton ? (
                  <span className="text-purple-300 flex items-center gap-1 font-bold">
                    <Crown className="w-3 h-3 text-purple-400" />
                    You are DJ ({masterLevel}%)
                  </span>
                ) : (
                  <span className="text-white/50 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-white/40" />
                    {batonOwnerName || 'Baton Owner'} ({masterLevel}%)
                  </span>
                )}
              </div>
            </div>

            {/* Visual Master Meter Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-pink-500 transition-all duration-300 shadow-inner"
                  style={{ width: `${masterLevel}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>0% Min</span>
                <span>Room Broadcast Reference</span>
                <span>100% Max</span>
              </div>
            </div>

            {/* If user holds Baton, allow adjusting Master Level directly */}
            {hasBaton && onMasterLevelChange ? (
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1">
                  <span>Adjust Group Master Level:</span>
                  <span className="font-mono font-bold">{masterLevel}%</span>
                </div>
                <input
                  id="mixer-master-level-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={masterLevel}
                  onChange={(e) => onMasterLevelChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg appearance-none accent-purple-400 cursor-pointer"
                />
              </div>
            ) : (
              <div className="mt-3 pt-2 text-[10px] text-white/40 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0 text-white/30" />
                <span>
                  Synchronized reference set by {batonOwnerName || 'DJ'}. Use your Personal Gain slider to adjust your ears.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 'Personal Gain' Adjustment Slider */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personal Gain Slider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {personalGain}% ({calculateDb(personalGain)})
                </span>
                {personalGain !== 100 && (
                  <button
                    onClick={handleResetUnity}
                    title="Reset to 100% (Unity Gain)"
                    className="text-white/40 hover:text-white transition p-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-1.5">
              <input
                id="personal-gain-slider"
                type="range"
                min={0}
                max={150}
                step={1}
                value={personalGain}
                onChange={(e) => handleGainChange(Number(e.target.value))}
                className="w-full h-2 bg-white/15 rounded-lg appearance-none accent-emerald-400 cursor-pointer hover:h-2.5 transition-all"
              />
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>0% (Off)</span>
                <span className={personalGain === 100 ? 'text-emerald-300 font-bold' : ''}>
                  100% (Unity)
                </span>
                <span>150% (+3.5dB Boost)</span>
              </div>
            </div>

            {/* Quick Gain Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/10">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleGainChange(p.gain)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono transition cursor-pointer ${
                    personalGain === p.gain
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Stereo VU Meter & Output Diagnostic Readout */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Calculated Effective Local Output */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
              Calculated Ear Output:
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}
            >
              {isMuted ? 'Muted (0%)' : `${effectiveVolume}% (${masterLevel}% × ${personalGain}%)`}
            </span>
          </div>
        </div>

        {/* Dual-Channel Simulated Stereo VU Meter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-mono text-white/40">VU</span>

          {/* Left Channel */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-white/40">L</span>
            <div className="w-20 md:w-24 h-2 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  vuLeft > 85
                    ? 'bg-rose-500'
                    : vuLeft > 65
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${vuLeft}%` }}
              />
            </div>
          </div>

          {/* Right Channel */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-white/40">R</span>
            <div className="w-20 md:w-24 h-2 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  vuRight > 85
                    ? 'bg-rose-500'
                    : vuRight > 65
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${vuRight}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
