import React from 'react';
import { DeviceMode } from '../types';
import { Smartphone, Apple, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface MobileDeviceSimulatorProps {
  deviceMode: DeviceMode;
  onSelectMode: (mode: DeviceMode) => void;
  children: React.ReactNode;
}

export const MobileDeviceSimulator: React.FC<MobileDeviceSimulatorProps> = ({
  deviceMode,
  onSelectMode,
  children,
}) => {
  if (deviceMode === 'responsive') {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  const isIphone = deviceMode === 'iphone';

  return (
    <div className="min-h-screen py-6 px-2 md:px-6 flex flex-col items-center justify-center bg-[#050508]">
      {/* Device Frame */}
      <div
        className={`relative transition-all duration-300 shadow-[0_0_80px_rgba(147,51,234,0.18)] border-4 ${
          isIphone
            ? 'w-[390px] h-[844px] rounded-[52px] border-neutral-800 bg-[#050508] ring-12 ring-neutral-900/90'
            : 'w-[400px] h-[850px] rounded-[42px] border-neutral-800 bg-[#050508] ring-10 ring-neutral-900'
        } overflow-hidden flex flex-col`}
      >
        {/* Hardware Notch / Dynamic Island */}
        {isIphone ? (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-2.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800" />
            <div className="w-3 h-3 rounded-full bg-purple-950/80 border border-purple-900/60" />
          </div>
        ) : (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 border border-neutral-800" />
        )}

        {/* Mobile Status Bar */}
        <div className="w-full h-11 pt-2 px-7 flex items-center justify-between text-[11px] font-semibold text-white/60 z-40 select-none bg-black/60 backdrop-blur-md">
          <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5 text-white/70">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-6">
          {children}
        </div>

        {/* iOS / Android Home Indicator Pill */}
        <div className="w-full h-6 flex items-center justify-center bg-black/80 select-none">
          <div
            className={`h-1 bg-white/30 rounded-full ${
              isIphone ? 'w-32' : 'w-24'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
