import { useEffect, useRef } from "react";
import type { BlackHoleResult } from "@/lib/simulation-api";

interface BlackHoleCanvasProps {
  data: BlackHoleResult;
  isPlaying: boolean;
  speed: number;
}

export function BlackHoleCanvas({ data, isPlaying, speed }: BlackHoleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const particleAngleRef = useRef<number>(0);
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

    // Accretion disk particulate system (bounded pool)
    const diskParticles = Array.from({ length: 110 }, (_, i) => ({
      radiusRatio: 1.6 + Math.random() * 3.8, // Between ISCO and outer disk
      angle: (i / 110) * Math.PI * 2,
      baseSpeed: 1.4 / Math.sqrt(1.6 + Math.random() * 3.8), // Keplerian differential rotation
      size: 1.2 + Math.random() * 2.8,
    }));

    // Background Stars for Gravitational Lensing Deflection
    const backgroundStars = Array.from({ length: 120 }, (_, i) => ({
      xRatio: Math.abs(Math.sin(i * 17.1 + 3.4)),
      yRatio: Math.abs(Math.cos(i * 13.7 + 1.2)),
      size: 0.8 + (i % 3) * 0.5,
      speed: 1 + (i % 4) * 0.7,
      phase: (i % 12) * 0.5,
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
        const orbitOmega = data.calculated.orbital_speed_fraction_c * 2.0;
        particleAngleRef.current = (particleAngleRef.current + orbitOmega * 0.016 * speedRef.current) % (Math.PI * 2);
      }
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.48;

      // Base event horizon radius in pixels
      const rsPx = Math.max(28, Math.min(65, Math.min(width, height) * 0.14));
      const rPhPx = rsPx * 1.5; // Photon sphere
      const rIscoPx = rsPx * 3.0; // ISCO

      // 0. Cosmic Nebula Background Glow
      const nebGrad = ctx.createRadialGradient(cx * 0.7, cy * 0.6, 10, cx, cy, Math.max(width, height) * 0.65);
      nebGrad.addColorStop(0, "rgba(25, 15, 60, 0.35)");
      nebGrad.addColorStop(0.5, "rgba(10, 25, 55, 0.2)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      // 0.5. Lensed Background Stars
      backgroundStars.forEach((s) => {
        const sx = s.xRatio * width;
        const sy = s.yRatio * height;
        const dx = sx - cx;
        const dy = sy - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const deflect = dist > rsPx * 1.05 ? (rsPx * 16) / dist : 0;
        const lensedX = sx + (dx / dist) * deflect;
        const lensedY = sy + (dy / dist) * deflect;

        const twinkle = 0.35 + 0.65 * Math.sin(t * s.speed + s.phase);
        ctx.fillStyle = `rgba(210, 230, 255, ${twinkle * 0.8})`;
        ctx.beginPath();
        ctx.arc(lensedX, lensedY, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 1. Gravitational Lensing Distorted Background Grid Lines
      ctx.save();
      ctx.strokeStyle = "rgba(40, 60, 100, 0.18)";
      ctx.lineWidth = 1;
      for (let x = 20; x < width; x += 40) {
        ctx.beginPath();
        for (let y = 0; y < height; y += 15) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          // Einstein deflection angle ~ 4GM / (c^2 b) = 2 Rs / b
          const deflect = dist > rsPx * 1.1 ? (rsPx * 12) / dist : 0;
          const warpX = x + (dx / dist) * deflect;
          const warpY = y + (dy / dist) * deflect;
          if (y === 0) ctx.moveTo(warpX, warpY);
          else ctx.lineTo(warpX, warpY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 2. Tilted Accretion Disk (Background Half)
      const diskTilt = 0.28; // Y compression
      ctx.save();

      // Draw rear accretion disk
      const outerDiskRadius = rsPx * 5.2;
      const diskGrad = ctx.createRadialGradient(cx, cy, rsPx * 1.4, cx, cy, outerDiskRadius);
      diskGrad.addColorStop(0, "rgba(255, 235, 190, 0.95)");
      diskGrad.addColorStop(0.2, "rgba(255, 145, 45, 0.75)");
      diskGrad.addColorStop(0.6, "rgba(180, 50, 20, 0.4)");
      diskGrad.addColorStop(1, "transparent");

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerDiskRadius, outerDiskRadius * diskTilt, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Upper Lensed Secondary Arc of the Accretion Disk (Einstein Ring effect)
      ctx.strokeStyle = "rgba(255, 175, 75, 0.75)";
      ctx.shadowColor = "rgba(255, 140, 30, 0.5)";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(cx, cy - rsPx * 0.4, rPhPx * 1.15, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      // 3. Photon Ring (Thin brilliant circular light ring with multi-pass bloom)
      ctx.save();
      const pulseGlow = 14 + Math.sin(t * 2) * 4;
      ctx.strokeStyle = "#fff2cb";
      ctx.shadowColor = "#ffaa33";
      ctx.shadowBlur = pulseGlow;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(cx, cy, rPhPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. Pitch-Black Event Horizon (Absolute Shadow)
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(cx, cy, rsPx, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon edge rim
      ctx.strokeStyle = "rgba(255, 200, 100, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rsPx, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Tilted Accretion Disk (Foreground Half) with Relativistic Doppler Beaming
      // Approaching side (left): Doppler blueshifted and much brighter
      // Receding side (right): Doppler redshifted and dimmer
      ctx.save();
      const fgDiskGrad = ctx.createLinearGradient(cx - outerDiskRadius, cy, cx + outerDiskRadius, cy);
      // Left side: Doppler boosted (blue-white, high opacity)
      fgDiskGrad.addColorStop(0, "transparent");
      fgDiskGrad.addColorStop(0.2, "rgba(160, 220, 255, 0.95)");
      fgDiskGrad.addColorStop(0.4, "rgba(255, 200, 100, 0.85)");
      // Right side: Dim red
      fgDiskGrad.addColorStop(0.7, "rgba(180, 40, 20, 0.4)");
      fgDiskGrad.addColorStop(0.9, "rgba(90, 10, 10, 0.15)");
      fgDiskGrad.addColorStop(1, "transparent");

      ctx.fillStyle = fgDiskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerDiskRadius, outerDiskRadius * diskTilt, 0, 0, Math.PI);
      ctx.fill();

      // Accretion swirling particles
      diskParticles.forEach((p) => {
        const curAngle = (p.angle + t * p.baseSpeed * 0.8) % (Math.PI * 2);
        // Only draw foreground particles (y > 0 relative to center)
        const isForeground = Math.sin(curAngle) > 0;
        if (!isForeground) return;

        const r = rsPx * p.radiusRatio;
        const px = cx + Math.cos(curAngle) * r;
        const py = cy + Math.sin(curAngle) * (r * diskTilt);

        // Relativistic beaming brightness: approaching side (cos < 0) is brighter
        const approach = Math.max(0.2, -Math.cos(curAngle));
        ctx.fillStyle = `rgba(255, 220, 160, ${approach * 0.85})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // 6. Test Particle Orbiting at r = test_particle_r_rs * Rs
      const rTestPx = rsPx * data.inputs.test_particle_r_rs;
      const partAngle = particleAngleRef.current;
      const partX = cx + Math.cos(partAngle) * rTestPx;
      const partY = cy + Math.sin(partAngle) * (rTestPx * diskTilt);

      // Orbit guide ring
      ctx.strokeStyle = "rgba(0, 255, 200, 0.35)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rTestPx, rTestPx * diskTilt, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Test particle marker
      ctx.fillStyle = "#00ffcc";
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(partX, partY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Text Annotations
      ctx.fillStyle = "rgba(0, 255, 200, 0.9)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Test Particle: r = ${data.inputs.test_particle_r_rs.toFixed(1)} Rs | v = ${(data.calculated.orbital_speed_fraction_c * 100).toFixed(1)}% c | Redshift z = ${data.calculated.gravitational_redshift_z.toFixed(2)}`, partX + 8, partY - 8);

      // 8. Scientific Approximation Disclaimer Banner (MANDATORY REQUIREMENT)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Relativistic-inspired visualization (Schwarzschild metric approximations) — not full numerical GR ray-tracing.", 16, height - 14);

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
    <div className="relative size-full min-h-[360px] overflow-hidden rounded-xl border border-border/80 bg-[#010309]">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
