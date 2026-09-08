import { useEffect, useRef } from "react";
import type { QuasarResult } from "@/lib/simulation-api";

interface QuasarCanvasProps {
  data: QuasarResult;
  isPlaying: boolean;
  speed: number;
}

export function QuasarCanvas({ data, isPlaying, speed }: QuasarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (!destroyed) resize();
      });
    });
    resizeObserver.observe(canvas);

    // Jet knots and outflow particles (bounded pool)
    const jetKnots = Array.from({ length: 32 }, (_, i) => ({
      distFrac: (i / 32),
      side: i % 2 === 0 ? 1 : -1,
      speed: 0.8 + Math.random() * 0.4,
      size: 2 + Math.random() * 4,
    }));

    // Background micro-stars
    const bgStars = Array.from({ length: 110 }, (_, i) => ({
      xRatio: Math.abs(Math.sin(i * 18.2 + 3.1)),
      yRatio: Math.abs(Math.cos(i * 12.4 + 6.3)),
      size: 0.8 + (i % 3) * 0.4,
      speed: 0.8 + (i % 4) * 0.6,
      phase: (i % 10) * 0.5,
    }));

    const render = () => {
      if (destroyed) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      if (isPlayingRef.current) {
        timeRef.current += 0.016 * speedRef.current;
      }
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 0. Deep Space Nebula & Micro-stars
      const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.65);
      nebGrad.addColorStop(0, "rgba(40, 20, 70, 0.35)");
      nebGrad.addColorStop(0.5, "rgba(15, 25, 60, 0.2)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      bgStars.forEach((s) => {
        const twinkle = 0.35 + 0.65 * Math.sin(t * s.speed + s.phase);
        ctx.fillStyle = `rgba(210, 230, 255, ${twinkle * 0.75})`;
        ctx.beginPath();
        ctx.arc(s.xRatio * width, s.yRatio * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const smbhRadius = 18;
      const diskRadius = Math.min(width, height) * 0.38;
      const jetLength = Math.min(width, height) * 0.48;

      // 1. Dual Bipolar Relativistic Plasma Jets (Vertical axis)
      for (let sign = -1; sign <= 1; sign += 2) {
        const jetGrad = ctx.createLinearGradient(cx, cy, cx, cy + sign * jetLength);
        jetGrad.addColorStop(0, "rgba(200, 240, 255, 0.95)");
        jetGrad.addColorStop(0.2, "rgba(100, 180, 255, 0.75)");
        jetGrad.addColorStop(0.6, "rgba(140, 60, 255, 0.4)");
        jetGrad.addColorStop(1, "transparent");

        ctx.fillStyle = jetGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy);
        ctx.lineTo(cx - 24, cy + sign * jetLength);
        ctx.lineTo(cx + 24, cy + sign * jetLength);
        ctx.lineTo(cx + 3, cy);
        ctx.closePath();
        ctx.fill();

        // Helical magnetic field coil around jet
        ctx.strokeStyle = "rgba(160, 220, 255, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let y = 0; y <= jetLength; y += 4) {
          const coilFrac = y / jetLength;
          const coilW = 4 + coilFrac * 18;
          const angle = coilFrac * Math.PI * 8 + t * 4 * sign;
          const x = cx + Math.sin(angle) * coilW;
          const yPos = cy + sign * y;
          if (y === 0) ctx.moveTo(x, yPos);
          else ctx.lineTo(x, yPos);
        }
        ctx.stroke();

        // Relativistic Jet Knots moving outward at beta * c
        jetKnots.forEach((knot) => {
          if (knot.side !== sign) return;
          const currentDist = ((knot.distFrac + t * 0.4 * knot.speed) % 1.0) * jetLength;
          const yPos = cy + sign * currentDist;
          const knotSpread = (currentDist / jetLength) * 16;
          const xPos = cx + Math.sin(currentDist * 0.1 + t) * knotSpread;

          ctx.fillStyle = "rgba(220, 245, 255, 0.85)";
          ctx.beginPath();
          ctx.arc(xPos, yPos, knot.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 2. Hyperluminous Accretion Disk (Horizontal Plane)
      const diskTilt = 0.22; // Edge-on tilt
      const diskGrad = ctx.createRadialGradient(cx, cy, smbhRadius, cx, cy, diskRadius);
      diskGrad.addColorStop(0, "#ffffff");
      diskGrad.addColorStop(0.1, "#66ccff");
      diskGrad.addColorStop(0.35, "#ff9933");
      diskGrad.addColorStop(0.7, "#cc2266");
      diskGrad.addColorStop(1, "transparent");

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, diskRadius, diskRadius * diskTilt, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling spiral density wave arcs in accretion disk
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let step = 0; step < 50; step++) {
          const frac = step / 50;
          const theta = arm * ((Math.PI * 2) / 3) + frac * Math.PI * 3 + t * 1.5;
          const r = smbhRadius * 1.2 + frac * (diskRadius * 0.85);
          const px = cx + Math.cos(theta) * r;
          const py = cy + Math.sin(theta) * (r * diskTilt);
          if (step === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // 3. Central Supermassive Black Hole Core
      ctx.fillStyle = "#000000";
      ctx.shadowColor = "#44aaff";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, smbhRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner horizon rim
      ctx.strokeStyle = "rgba(100, 200, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, smbhRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Live Parameter Badges
      const eddRatio = data.calculated.eddington_ratio;
      const jetBeta = data.calculated.jet_beta;
      ctx.fillStyle = "rgba(140, 220, 255, 0.9)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`L_bol = ${data.calculated.bolometric_luminosity_lsun.toExponential(2)} L☉ | λ_Edd = ${eddRatio.toFixed(3)} | Jet v = ${(jetBeta * 100).toFixed(2)}% c`, 16, 24);

      // 5. Scientific Approximation Disclaimer Banner (MANDATORY REQUIREMENT)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Astrophysical accretion and relativistic jet model — visual simulation is an artistically rendered relativistic jet approximation.", 16, height - 14);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      destroyed = true;
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [data]);

  return (
    <div className="relative size-full min-h-[360px] overflow-hidden rounded-xl border border-border/80 bg-[#02030a]">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
