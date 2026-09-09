import { useEffect, useRef } from "react";
import type { StarResult } from "@/lib/simulation-api";

interface StarCanvasProps {
  data: StarResult;
  isPlaying: boolean;
  speed: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || "#ffffff").replace("#", "");
  let r = 255;
  let g = 255;
  let b = 255;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 255;
    g = parseInt(clean[1] + clean[1], 16) || 255;
    b = parseInt(clean[2] + clean[2], 16) || 255;
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16) || 255;
    g = parseInt(clean.substring(2, 4), 16) || 255;
    b = parseInt(clean.substring(4, 6), 16) || 255;
  }
  const safeA = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  return `rgba(${r}, ${g}, ${b}, ${safeA})`;
}

export function StarCanvas({ data, isPlaying, speed }: StarCanvasProps) {
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

    // Handle high DPI displays
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

      // Convective granules configuration (bounded pool)
    const granulesCount = 40;
    const granules = Array.from({ length: granulesCount }, (_, i) => ({
      angle: (i / granulesCount) * Math.PI * 2 + Math.random() * 0.2,
      distRatio: 0.15 + Math.random() * 0.75,
      size: 8 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.6,
    }));

    // Prominence / flare arcs
    const flaresCount = 6;
    const flares = Array.from({ length: flaresCount }, (_, i) => ({
      baseAngle: (i / flaresCount) * Math.PI * 2 + 0.3,
      lengthRatio: 0.25 + Math.random() * 0.4,
      width: 0.08 + Math.random() * 0.08,
      speed: 0.5 + Math.random() * 0.5,
    }));

    // Background micro-stars for starfield depth
    const bgStars = Array.from({ length: 80 }, (_, i) => ({
      xRatio: Math.abs(Math.sin(i * 19.3 + 2.1)),
      yRatio: Math.abs(Math.cos(i * 11.5 + 4.7)),
      size: 0.8 + (i % 3) * 0.4,
      speed: 0.8 + (i % 4) * 0.6,
      phase: (i % 10) * 0.5,
    }));

    const baseColor = data.calculated.color_hex || "#fff2e6";

    // Pre-render a cached radial granule sprite once onto an offscreen canvas
    // This eliminates 40-45 radial gradient allocations per animation frame
    const granuleCanvas = document.createElement("canvas");
    const granuleDim = 48;
    granuleCanvas.width = granuleDim;
    granuleCanvas.height = granuleDim;
    const gCtx = granuleCanvas.getContext("2d");
    if (gCtx) {
      const hDim = granuleDim / 2;
      const sprGrad = gCtx.createRadialGradient(hDim, hDim, 0, hDim, hDim, hDim);
      sprGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      sprGrad.addColorStop(0.5, hexToRgba(baseColor, 0.7));
      sprGrad.addColorStop(1, "transparent");
      gCtx.fillStyle = sprGrad;
      gCtx.beginPath();
      gCtx.arc(hDim, hDim, hDim, 0, Math.PI * 2);
      gCtx.fill();
    }

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

      // 0. Background Nebula
      const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.6);
      nebGrad.addColorStop(0, "rgba(25, 18, 45, 0.3)");
      nebGrad.addColorStop(0.6, "rgba(8, 12, 28, 0.15)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      // Batched micro-stars (single beginPath/fill call instead of 100 separate paths)
      ctx.fillStyle = "rgba(220, 235, 255, 0.65)";
      ctx.beginPath();
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        const sx = s.xRatio * width;
        const sy = s.yRatio * height;
        ctx.moveTo(sx + s.size, sy);
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Base radius scaled logarithmically to fit canvas nicely while showing contrast
      const radiusRsun = data.inputs.radius_rsun;
      const minDimension = Math.min(width, height);
      const scaleFactor = 0.22 + 0.05 * Math.log10(Math.max(0.05, radiusRsun));
      const starRadius = Math.max(35, Math.min(minDimension * 0.42, minDimension * scaleFactor));

      // 1. Outer Corona Glow
      const coronaRadius = starRadius * 2.6;
      const coronaGrad = ctx.createRadialGradient(cx, cy, Math.max(1, starRadius * 0.75), cx, cy, Math.max(2, coronaRadius));
      coronaGrad.addColorStop(0, hexToRgba(baseColor, 0.65));
      coronaGrad.addColorStop(0.3, hexToRgba(baseColor, 0.3));
      coronaGrad.addColorStop(0.7, hexToRgba(baseColor, 0.08));
      coronaGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coronaRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Solar Prominence Flares / Arcs (dual stroke for bloom without costly shadowBlur)
      for (let idx = 0; idx < flares.length; idx++) {
        const flare = flares[idx];
        const angle = flare.baseAngle + Math.sin(t * 0.3 + idx) * 0.1;
        const pulse = 1 + Math.sin(t * flare.speed + idx * 2) * 0.25;
        const flareDist = starRadius * (1 + flare.lengthRatio * pulse);

        const xBase = cx + Math.cos(angle) * starRadius;
        const yBase = cy + Math.sin(angle) * starRadius;
        const xTip = cx + Math.cos(angle) * flareDist;
        const yTip = cy + Math.sin(angle) * flareDist;
        const xCtrl = cx + Math.cos(angle + flare.width) * (flareDist * 1.1);
        const yCtrl = cy + Math.sin(angle + flare.width) * (flareDist * 1.1);

        // Ambient soft bloom pass
        ctx.strokeStyle = hexToRgba(baseColor, 0.3);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(xBase, yBase);
        ctx.quadraticCurveTo(xCtrl, yCtrl, xTip, yTip);
        ctx.stroke();

        // Core bright line pass
        ctx.strokeStyle = hexToRgba(baseColor, 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xBase, yBase);
        ctx.quadraticCurveTo(xCtrl, yCtrl, xTip, yTip);
        ctx.stroke();
      }

      // 3. Photosphere Disk with Limb Darkening
      const diskGrad = ctx.createRadialGradient(
        cx - starRadius * 0.15,
        cy - starRadius * 0.15,
        Math.max(1, starRadius * 0.05),
        cx,
        cy,
        Math.max(2, starRadius)
      );
      diskGrad.addColorStop(0, "#ffffff");
      diskGrad.addColorStop(0.4, hexToRgba(baseColor, 1));
      diskGrad.addColorStop(0.85, hexToRgba(baseColor, 0.87));
      diskGrad.addColorStop(1, "#100808");

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Convective Granulation Overlay via fast GPU sprite blitting
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, starRadius - 1), 0, Math.PI * 2);
      ctx.clip();

      for (let i = 0; i < granules.length; i++) {
        const g = granules[i];
        const drift = t * 0.15 * g.speed;
        const currentAngle = g.angle + drift;
        const gx = cx + Math.cos(currentAngle) * (starRadius * g.distRatio);
        const gy = cy + Math.sin(currentAngle) * (starRadius * g.distRatio);

        const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 * g.speed + g.phase);
        ctx.globalAlpha = 0.12 + 0.18 * pulse;
        const d = g.size * 2;
        ctx.drawImage(granuleCanvas, gx - g.size, gy - g.size, d, d);
      }

      ctx.restore();

      // 5. Outer atmospheric rim line
      ctx.strokeStyle = hexToRgba(baseColor, 0.73);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Scale Annotation
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`R = ${data.inputs.radius_rsun} R☉ | T_eff = ${data.inputs.temperature_k} K`, 16, height - 16);

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
    <div className="relative size-full min-h-[360px] overflow-hidden rounded-xl border border-border/80 bg-[#03070d]">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
