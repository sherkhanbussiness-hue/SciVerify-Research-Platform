import { useEffect, useRef } from "react";
import type { AsteroidResult } from "@/lib/simulation-api";

interface AsteroidCanvasProps {
  data: AsteroidResult;
  isPlaying: boolean;
  speed: number;
}

export function AsteroidCanvas({ data, isPlaying, speed }: AsteroidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simTimeDaysRef = useRef<number>(0);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
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

    const trajectory = data.calculated.trajectory;
    const aphelionAu = data.calculated.aphelion_au;
    const periodDays = data.calculated.orbital_period_days;

    // Background micro-stars
    const bgStars = Array.from({ length: 110 }, (_, i) => ({
      xRatio: Math.abs(Math.sin(i * 14.7 + 5.3)),
      yRatio: Math.abs(Math.cos(i * 8.9 + 2.4)),
      size: 0.8 + (i % 3) * 0.4,
      speed: 0.8 + (i % 4) * 0.6,
      phase: (i % 10) * 0.5,
    }));

    const render = () => {
      if (destroyed) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0 || !trajectory || trajectory.length === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Kepler's 2nd Law: Time-proportional orbit progression
      if (isPlayingRef.current && periodDays > 0) {
        const dtWallSec = 0.016;
        const orbitDurationSec = 10.0; // 1 full orbit = 10s at 1.0x speed
        const dDays = (periodDays / orbitDurationSec) * dtWallSec * speedRef.current;
        simTimeDaysRef.current = (simTimeDaysRef.current + dDays) % periodDays;
      }
      const curTime = simTimeDaysRef.current;

      // Fast O(log N) binary search for segment along the trajectory by time_days
      let low = 0;
      let high = trajectory.length - 1;
      let curIdx = 0;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (trajectory[mid].time_days <= curTime) {
          curIdx = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      if (curIdx >= trajectory.length - 1) curIdx = trajectory.length - 2;
      if (curIdx < 0) curIdx = 0;

      const nextIdx = (curIdx + 1) % trajectory.length;
      const t0 = trajectory[curIdx].time_days;
      const t1 = trajectory[nextIdx].time_days;
      const span = t1 > t0 ? t1 - t0 : 1;
      const frac = Math.max(0, Math.min(1, (curTime - t0) / span));

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 0. Background Nebula & Micro-stars
      const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.6);
      nebGrad.addColorStop(0, "rgba(15, 30, 50, 0.3)");
      nebGrad.addColorStop(0.6, "rgba(6, 12, 24, 0.15)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      // Batched micro-stars
      ctx.fillStyle = "rgba(200, 225, 255, 0.65)";
      ctx.beginPath();
      for (let i = 0; i < bgStars.length; i++) {
        const s = bgStars[i];
        const sx = s.xRatio * width;
        const sy = s.yRatio * height;
        ctx.moveTo(sx + s.size, sy);
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Coordinate scaling: map astronomical units to canvas pixels
      // Allow orbit to fit comfortably within 80% of canvas
      const maxExtent = aphelionAu * 1.25;
      const pxPerAu = (Math.min(width, height) * 0.42) / maxExtent;

      const ptCur = trajectory[curIdx];
      const ptNext = trajectory[nextIdx];

      const curXAu = ptCur.x_au + (ptNext.x_au - ptCur.x_au) * frac;
      const curYAu = ptCur.y_au + (ptNext.y_au - ptCur.y_au) * frac;
      const curRAu = ptCur.r_au + (ptNext.r_au - ptCur.r_au) * frac;
      const curVKms = ptCur.v_kms + (ptNext.v_kms - ptCur.v_kms) * frac;

      const astPxX = cx + curXAu * pxPerAu;
      const astPxY = cy - curYAu * pxPerAu; // Invert Y for standard Cartesian

      // Update fading trail
      if (isPlayingRef.current) {
        trailRef.current.push({ x: astPxX, y: astPxY });
        if (trailRef.current.length > 35) {
          trailRef.current.shift();
        }
      }

      // 1. Grid lines / AU scale circles
      ctx.strokeStyle = "rgba(40, 70, 110, 0.25)";
      ctx.lineWidth = 1;
      [1, 2, 5, 10, 20].forEach((auDist) => {
        if (auDist * pxPerAu < Math.min(width, height) * 0.6) {
          ctx.beginPath();
          ctx.arc(cx, cy, auDist * pxPerAu, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(100, 150, 210, 0.4)";
          ctx.font = "8px monospace";
          ctx.fillText(`${auDist} AU`, cx + auDist * pxPerAu + 3, cy - 3);
        }
      });

      // 2. Complete Orbital Path Ellipse Trace (Computed from backend data)
      ctx.strokeStyle = "rgba(0, 220, 255, 0.5)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      trajectory.forEach((pt, idx) => {
        const px = cx + pt.x_au * pxPerAu;
        const py = cy - pt.y_au * pxPerAu;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();

      // 3. Radius vector connecting central star to asteroid
      ctx.strokeStyle = "rgba(255, 200, 50, 0.4)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(astPxX, astPxY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Motion Trail
      ctx.lineWidth = 3;
      for (let i = 0; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        const alpha = (i / trailRef.current.length) * 0.6;
        ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Central Star (at origin/focus point)
      const sunRadius = Math.max(7, Math.min(18, 12 * Math.cbrt(data.inputs.central_mass_msun)));
      const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sunRadius * 2);
      sunGrad.addColorStop(0, "#ffffff");
      sunGrad.addColorStop(0.3, "#ffcc00");
      sunGrad.addColorStop(0.7, "#ff6600");
      sunGrad.addColorStop(1, "transparent");

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff5cc";
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // 6. Velocity Vector Indicator
      // Tangent direction calculated from next point
      const dx = (ptNext.x_au - ptCur.x_au) * pxPerAu;
      const dy = -(ptNext.y_au - ptCur.y_au) * pxPerAu;
      const len = Math.hypot(dx, dy) || 1;
      const vScale = Math.min(45, Math.max(15, curVKms * 1.2));
      const vEndX = astPxX + (dx / len) * vScale;
      const vEndY = astPxY + (dy / len) * vScale;

      ctx.strokeStyle = "#ff4466";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(astPxX, astPxY);
      ctx.lineTo(vEndX, vEndY);
      ctx.stroke();

      // 7. Asteroid Body with clean dual-pass bloom
      ctx.fillStyle = "rgba(0, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(astPxX, astPxY, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(astPxX, astPxY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 8. Live Parameters Overlay
      ctx.fillStyle = "rgba(0, 240, 255, 0.9)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`r = ${curRAu.toFixed(2)} AU | v = ${curVKms.toFixed(1)} km/s`, astPxX + 10, astPxY - 10);

      // Perihelion / Aphelion annotations
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "9px monospace";
      ctx.fillText(`Perihelion: ${data.calculated.perihelion_au.toFixed(2)} AU (${data.calculated.perihelion_speed_kms.toFixed(1)} km/s)`, 16, height - 28);
      ctx.fillText(`Aphelion:   ${data.calculated.aphelion_au.toFixed(2)} AU (${data.calculated.aphelion_speed_kms.toFixed(1)} km/s)`, 16, height - 14);

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
    <div className="relative size-full min-h-[360px] overflow-hidden rounded-xl border border-border/80 bg-[#02050e]">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
