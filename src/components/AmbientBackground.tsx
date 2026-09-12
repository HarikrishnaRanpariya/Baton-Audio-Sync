import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Moon, Sun, Sliders, X, Eye, EyeOff, Radio } from 'lucide-react';

export type AmbientPatternStyle = 'aurora' | 'stardust' | 'geometric';

interface AmbientBackgroundProps {
  isActive: boolean;
  isPlaying: boolean;
  onToggle: () => void;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  isActive,
  isPlaying,
  onToggle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [patternStyle, setPatternStyle] = useState<AmbientPatternStyle>(() => {
    try {
      return (localStorage.getItem('baton_ambient_style') as AmbientPatternStyle) || 'aurora';
    } catch {
      return 'aurora';
    }
  });
  const [dimLevel, setDimLevel] = useState<number>(() => {
    try {
      const val = localStorage.getItem('baton_ambient_dim');
      return val !== null ? Number(val) : 80; // 80% dim by default
    } catch {
      return 80;
    }
  });
  const [showControls, setShowControls] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const patternStyleRef = useRef(patternStyle);
  useEffect(() => {
    patternStyleRef.current = patternStyle;
    try {
      localStorage.setItem('baton_ambient_style', patternStyle);
    } catch {}
  }, [patternStyle]);

  useEffect(() => {
    try {
      localStorage.setItem('baton_ambient_dim', String(dimLevel));
    } catch {}
  }, [dimLevel]);

  // Main Canvas Animation Loop
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle pool for stardust & geometric styles
    const PARTICLE_COUNT = 65;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      baseRadius: Math.random() * 2 + 1,
      hue: Math.random() > 0.5 ? 275 : 325, // Purple & Pink
      alpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += isPlayingRef.current ? 0.012 : 0.006;
      const currentStyle = patternStyleRef.current;

      // 1. Clear background with subtle deep obsidian base
      ctx.fillStyle = '#050509';
      ctx.fillRect(0, 0, width, height);

      // Music pulse factor
      const musicPulse = isPlayingRef.current
        ? Math.sin(time * 3) * 0.15 + 1
        : 1;

      if (currentStyle === 'aurora') {
        // --- 1. AURORA WAVES PATTERN ---
        // Generative multi-layered flowing harmonic ribbon waves
        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const wOffset = w * 0.8;
          const yBase = height * (0.35 + w * 0.15);

          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 12) {
            const normalizedX = x / width;
            const wave1 = Math.sin(normalizedX * 4 + time + wOffset) * 60 * musicPulse;
            const wave2 = Math.cos(normalizedX * 2.5 - time * 0.8 + wOffset) * 45;
            const wave3 = Math.sin(normalizedX * 7 + time * 1.5) * 20;
            const y = yBase + wave1 + wave2 + wave3;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();

          // Gradient fill
          const grad = ctx.createLinearGradient(0, yBase - 100, width, height);
          if (w === 0) {
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.14)'); // Purple
            grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.08)'); // Pink
            grad.addColorStop(1, 'rgba(5, 5, 9, 0)');
          } else if (w === 1) {
            grad.addColorStop(0, 'rgba(147, 51, 234, 0.1)'); // Violet
            grad.addColorStop(0.6, 'rgba(59, 130, 246, 0.08)'); // Blue
            grad.addColorStop(1, 'rgba(5, 5, 9, 0)');
          } else if (w === 2) {
            grad.addColorStop(0, 'rgba(217, 70, 239, 0.09)'); // Fuchsia
            grad.addColorStop(0.7, 'rgba(99, 102, 241, 0.06)'); // Indigo
            grad.addColorStop(1, 'rgba(5, 5, 9, 0)');
          } else {
            grad.addColorStop(0, 'rgba(99, 102, 241, 0.07)'); // Indigo
            grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.05)'); // Pink
            grad.addColorStop(1, 'rgba(5, 5, 9, 0)');
          }

          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Soft ambient light orb drifting in center
        const orbX = width * 0.5 + Math.sin(time * 0.7) * (width * 0.25);
        const orbY = height * 0.45 + Math.cos(time * 0.5) * (height * 0.18);
        const orbRad = Math.min(width, height) * 0.45 * musicPulse;
        const orbGrad = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, orbRad);
        orbGrad.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
        orbGrad.addColorStop(0.4, 'rgba(236, 72, 153, 0.06)');
        orbGrad.addColorStop(1, 'rgba(5, 5, 9, 0)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRad, 0, Math.PI * 2);
        ctx.fill();

      } else if (currentStyle === 'stardust') {
        // --- 2. NEBULA STARDUST PATTERN ---
        // Organic glowing dust clouds and drifting bioluminescent stars
        const nebulaX1 = width * 0.35 + Math.sin(time * 0.4) * 80;
        const nebulaY1 = height * 0.4 + Math.cos(time * 0.3) * 60;
        const nebulaGrad1 = ctx.createRadialGradient(nebulaX1, nebulaY1, 20, nebulaX1, nebulaY1, width * 0.4 * musicPulse);
        nebulaGrad1.addColorStop(0, 'rgba(147, 51, 234, 0.18)');
        nebulaGrad1.addColorStop(0.5, 'rgba(236, 72, 153, 0.07)');
        nebulaGrad1.addColorStop(1, 'rgba(5, 5, 9, 0)');
        ctx.fillStyle = nebulaGrad1;
        ctx.fillRect(0, 0, width, height);

        const nebulaX2 = width * 0.7 + Math.cos(time * 0.5) * 90;
        const nebulaY2 = height * 0.6 + Math.sin(time * 0.4) * 70;
        const nebulaGrad2 = ctx.createRadialGradient(nebulaX2, nebulaY2, 20, nebulaX2, nebulaY2, width * 0.45 * musicPulse);
        nebulaGrad2.addColorStop(0, 'rgba(59, 130, 246, 0.14)');
        nebulaGrad2.addColorStop(0.6, 'rgba(168, 85, 247, 0.06)');
        nebulaGrad2.addColorStop(1, 'rgba(5, 5, 9, 0)');
        ctx.fillStyle = nebulaGrad2;
        ctx.fillRect(0, 0, width, height);

        // Render shimmering stars
        particles.forEach((p) => {
          p.x += p.vx * (isPlayingRef.current ? 1.4 : 0.8);
          p.y += p.vy * (isPlayingRef.current ? 1.4 : 0.8);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const currentPulse = Math.sin(time * 2 + p.pulsePhase) * 0.3 + 0.7;
          const r = p.baseRadius * currentPulse * (isPlayingRef.current ? 1.2 : 1);

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha * currentPulse})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${p.hue}, 90%, 65%, 0.8)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

      } else {
        // --- 3. GEOMETRIC MESH / CONSTELLATION PATTERN ---
        // Interconnected node mesh with subtle floating lines
        const maxDist = 140;

        // Update positions
        particles.forEach((p) => {
          p.x += p.vx * (isPlayingRef.current ? 1.2 : 0.7);
          p.y += p.vy * (isPlayingRef.current ? 1.2 : 0.7);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        });

        // Draw connecting lines
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.22 * musicPulse;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Draw nodes
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.baseRadius * musicPulse, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, 0.6)`;
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        id="ambient-background-canvas"
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ease-in-out"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Dimming Veil for the rest of the application */}
      <div
        id="ambient-dim-veil"
        className="fixed inset-0 z-1 pointer-events-none transition-colors duration-700"
        style={{
          backgroundColor: `rgba(5, 5, 9, ${(dimLevel / 100) * 0.75})`,
        }}
      />

      {/* Ambient Floating Mode Bar (Bottom-center) */}
      <div
        id="ambient-mode-floating-bar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto"
      >
        {/* Expanded Controls Drawer */}
        {showControls && (
          <div className="bg-[#0e0e18]/95 border border-white/15 p-4 rounded-3xl shadow-2xl shadow-purple-950/80 backdrop-blur-2xl text-white text-xs w-72 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Ambient Style
              </span>
              <button
                onClick={() => setShowControls(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pattern selection tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl mb-3">
              <button
                onClick={() => setPatternStyle('aurora')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  patternStyle === 'aurora'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Aurora
              </button>
              <button
                onClick={() => setPatternStyle('stardust')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  patternStyle === 'stardust'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Stardust
              </button>
              <button
                onClick={() => setPatternStyle('geometric')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  patternStyle === 'geometric'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Mesh
              </button>
            </div>

            {/* Dim Intensity Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-white/70 mb-1">
                <span>UI Dim Level</span>
                <span className="font-mono text-purple-400">{dimLevel}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={dimLevel}
                onChange={(e) => setDimLevel(Number(e.target.value))}
                className="w-full accent-purple-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-white/40 mt-1">
                <span>Subtle (40%)</span>
                <span>Deep Lounge (95%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Compact Pill Bar */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a0a12]/90 border border-purple-500/30 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl text-white">
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-200">
              Ambient Mode
            </span>
          </div>

          <button
            id="ambient-controls-toggle-button"
            onClick={() => setShowControls((prev) => !prev)}
            title="Configure Ambient Pattern & Dim Level"
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-[11px] font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span className="capitalize">{patternStyle}</span>
          </button>

          <button
            id="ambient-exit-button"
            onClick={onToggle}
            title="Exit Ambient Mode"
            className="px-3 py-1 rounded-full bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-purple-500/40"
          >
            <X className="w-3 h-3" />
            Exit
          </button>
        </div>
      </div>
    </>
  );
};
