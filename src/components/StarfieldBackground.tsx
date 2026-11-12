import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  color: string;
  isBeacon?: boolean;
}

export const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const starPalette = [
      '#ffffff',
      '#f8fafc',
      '#e0f2fe',
      '#bae6fd',
      '#7dd3fc',
      '#fef08a',
      '#ddd6fe'
    ];

    const drawStarfield = () => {
      if (!canvas) return;
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      let seed = 42109;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const count = Math.max(520, Math.floor((width * height) / 2800));
      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const r = rand();
        const isBeacon = i < 28;
        stars.push({
          x: rand() * width,
          y: rand() * height,
          radius: isBeacon ? 1.8 + rand() * 1.1 : r > 0.82 ? 1.25 + rand() * 0.65 : 0.65 + rand() * 0.65,
          baseAlpha: isBeacon ? 0.92 + rand() * 0.08 : 0.45 + rand() * 0.55,
          color: starPalette[Math.floor(rand() * starPalette.length)],
          isBeacon
        });
      }

      ctx.clearRect(0, 0, width, height);

      // Deep space cosmic background with subtle galactic nebula glow
      const bgGrad = ctx.createRadialGradient(
        width * 0.72,
        height * 0.22,
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.9
      );
      bgGrad.addColorStop(0, '#071329');
      bgGrad.addColorStop(0.45, '#040915');
      bgGrad.addColorStop(1, '#02040a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle second cosmic nebula pocket
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.18,
        height * 0.78,
        10,
        width * 0.18,
        height * 0.78,
        width * 0.45
      );
      nebulaGrad.addColorStop(0, 'rgba(14, 165, 233, 0.09)');
      nebulaGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw all stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.save();
        ctx.globalAlpha = s.baseAlpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow & diffraction spikes for bright beacon stars
        if (s.isBeacon) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0.5, s.x, s.y, s.radius * 5.8);
          glow.addColorStop(0, 'rgba(186, 230, 253, 0.75)');
          glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 5.8, 0, Math.PI * 2);
          ctx.fill();

          // Delicate 4-point star flare
          ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
          ctx.lineWidth = 0.85;
          const spikeLen = s.radius * 4.5;
          ctx.beginPath();
          ctx.moveTo(s.x - spikeLen, s.y);
          ctx.lineTo(s.x + spikeLen, s.y);
          ctx.moveTo(s.x, s.y - spikeLen);
          ctx.lineTo(s.x, s.y + spikeLen);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    drawStarfield();
    window.addEventListener('resize', drawStarfield);
    return () => {
      window.removeEventListener('resize', drawStarfield);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="globalStarfieldCanvas"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
