import { useEffect, useRef } from "react";

interface StarfieldBackgroundProps {
  className?: string;
  count?: number;
}

export function StarfieldBackground({ className = "absolute inset-0 pointer-events-none opacity-60", count = 120 }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let destroyed = false;

    const resize = () => {
      if (destroyed || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (!destroyed) resize();
      });
    });
    ro.observe(canvas);

    const stars = Array.from({ length: count }, (_, i) => ({
      x: (Math.sin(i * 17.1 + 3.4) * 0.5 + 0.5),
      y: (Math.cos(i * 13.7 + 1.2) * 0.5 + 0.5),
      size: 0.8 + (i % 3) * 0.4,
      speed: 1 + (i % 4) * 0.7,
      phase: (i % 12) * 0.5,
    }));

    let t = 0;
    const render = () => {
      if (destroyed) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      // Deep space nebula background glow
      const nebGrad = ctx.createRadialGradient(w * 0.3, h * 0.3, 10, w * 0.3, h * 0.3, Math.max(w, h) * 0.6);
      nebGrad.addColorStop(0, "rgba(20, 35, 65, 0.2)");
      nebGrad.addColorStop(0.6, "rgba(10, 15, 30, 0.1)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((s) => {
        const twinkle = 0.35 + 0.65 * Math.sin(t * s.speed + s.phase);
        ctx.fillStyle = `rgba(200, 225, 255, ${twinkle * 0.75})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      destroyed = true;
      ro.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [count]);

  return <canvas ref={canvasRef} className={className} />;
}
