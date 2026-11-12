import React from 'react';

interface CinematicEarthHeaderBgProps {
  variant?: 'pod' | 'cmo' | 'ground' | 'compact';
}

const HEADER_STARS = [
  { left: '6%', top: '18%', size: 1.5, opacity: 0.7 },
  { left: '14%', top: '74%', size: 1.2, opacity: 0.5 },
  { left: '22%', top: '28%', size: 2.0, opacity: 0.85 },
  { left: '31%', top: '15%', size: 1.4, opacity: 0.65 },
  { left: '38%', top: '68%', size: 1.6, opacity: 0.75 },
  { left: '45%', top: '22%', size: 2.2, opacity: 0.9 },
  { left: '49%', top: '82%', size: 1.3, opacity: 0.6 },
  { left: '53%', top: '36%', size: 1.8, opacity: 0.85 },
  { left: '57%', top: '14%', size: 2.4, opacity: 0.95 },
  { left: '61%', top: '62%', size: 1.5, opacity: 0.8 },
  { left: '64%', top: '25%', size: 2.1, opacity: 0.9 },
  { left: '68%', top: '80%', size: 1.6, opacity: 0.75 },
  { left: '72%', top: '12%', size: 2.5, opacity: 1.0 },
  { left: '76%', top: '48%', size: 1.4, opacity: 0.7 },
  { left: '81%', top: '19%', size: 1.9, opacity: 0.9 },
  { left: '86%', top: '76%', size: 2.0, opacity: 0.85 },
  { left: '91%', top: '16%', size: 2.3, opacity: 0.95 },
  { left: '95%', top: '58%', size: 1.6, opacity: 0.8 },
  { left: '97%', top: '28%', size: 1.8, opacity: 0.9 }
];

export const CinematicEarthHeaderBg: React.FC<CinematicEarthHeaderBgProps> = ({
  variant = 'pod'
}) => {
  const isCompact = variant === 'compact';

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none rounded-[inherit] z-0"
      aria-hidden="true"
    >
      {/* Base Deep Space Obsidian & Cosmic Blue Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 82% 52%, rgba(14, 165, 233, 0.34) 0%, rgba(2, 132, 199, 0.16) 34%, rgba(4, 9, 20, 0.96) 72%, #030711 100%)'
        }}
      />

      {/* Crisp Deep-Space Starfield Layer inside Header */}
      {HEADER_STARS.map((star, idx) => (
        <span
          key={idx}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow:
              star.size >= 2
                ? '0 0 6px 1px rgba(186, 230, 253, 0.9)'
                : '0 0 3px rgba(255, 255, 255, 0.6)'
          }}
        />
      ))}

      {/* Wide Curved Earth Atmospheric Limb Horizon (Right 68% of Banner) */}
      <img
        src="/assets/aistudio/nasa_horizon_2.jpg"
        alt="Earth Orbital Horizon Atmosphere"
        referrerPolicy="no-referrer"
        className="absolute right-0 top-0 h-full w-[72%] object-cover object-right opacity-80 mix-blend-screen"
      />

      {/* Cinematic High-Definition Planet Earth from Space (Anchored in the Right Viewport Zone) */}
      <div
        className={`absolute ${
          isCompact
            ? '-right-8 -bottom-12 w-52 h-52 sm:w-60 sm:h-60'
            : 'right-[-2%] sm:right-[2%] top-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80'
        } flex items-center justify-center`}
      >
        {/* Outer Atmospheric Cyan-Sapphire Halo */}
        <div
          className="absolute inset-3 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 42% 42%, rgba(56, 189, 248, 0.55) 0%, rgba(14, 165, 233, 0.28) 52%, transparent 74%)',
            filter: 'blur(12px)'
          }}
        />

        {/* High-Resolution NASA Blue Marble Earth Globe */}
        <img
          src="/assets/aistudio/nasa_earth_1.jpg"
          alt="Cinematic Earth from Space"
          referrerPolicy="no-referrer"
          className="relative w-full h-full object-contain rounded-full mix-blend-lighten opacity-95 drop-shadow-[0_0_28px_rgba(56,189,248,0.55)]"
        />

        {/* Orbital Sunrise Specular Flare on Earth's Atmospheric Limb */}
        <div
          className="absolute top-[16%] left-[14%] w-16 h-16 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(125,211,252,0.75) 28%, rgba(14,165,233,0.2) 60%, transparent 78%)',
            filter: 'blur(1px)'
          }}
        />
        <div
          className="absolute top-[24%] left-[4%] w-28 h-[2px] rotate-[-18deg]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(186,230,253,0.9) 50%, transparent 100%)'
          }}
        />
      </div>

      {/* Directional Readability Gradient Scrim (Keeps Left Text Crisp, Leaves Right Earth Vista Bright & Clear) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(4, 9, 20, 0.94) 0%, rgba(5, 12, 26, 0.86) 44%, rgba(6, 15, 32, 0.42) 66%, rgba(4, 10, 22, 0.08) 85%, rgba(4, 10, 22, 0.18) 100%)'
        }}
      />

      {/* Subtle Sci-Fi Orbital Window Telemetry HUD Overlay on Right Side */}
      {!isCompact && (
        <div className="hidden lg:flex absolute right-4 bottom-2 items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#030814]/75 border border-cyan-400/35 backdrop-blur-xs font-mono text-[9.5px] text-cyan-200/90 tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
          <span>EARTH ORBITAL VISTA // 148.2 MILLION KILOMETERS LOCK</span>
        </div>
      )}
    </div>
  );
};
