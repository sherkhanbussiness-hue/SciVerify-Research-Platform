import { useEffect, useRef } from "react";
import type { PulsarResult } from "@/lib/simulation-api";

interface PulsarCanvasProps {
  data: PulsarResult;
  isPlaying: boolean;
  speed: number;
}

export function PulsarCanvas({ data, isPlaying, speed }: PulsarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const pulseHistoryRef = useRef<number[]>(new Array(80).fill(0.05));
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

    const freqHz = data.calculated.frequency_hz;
    const magAngleRad = (data.inputs.magnetic_angle_deg * Math.PI) / 180;

    // Background micro-stars
    const bgStars = Array.from({ length: 110 }, (_, i) => ({
      xRatio: Math.abs(Math.sin(i * 21.4 + 1.8)),
      yRatio: Math.abs(Math.cos(i * 14.1 + 8.2)),
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

      // Progress phase strictly proportional to physical rotation frequency f = 1 / P
      if (isPlayingRef.current) {
        const dt = 0.016 * speedRef.current;
        // Angular frequency omega = 2 * pi * f. Scaled for human visual tracking:
        const scaledOmega = 2 * Math.PI * (freqHz * 0.2);
        phaseRef.current = (phaseRef.current + scaledOmega * dt) % (Math.PI * 2);
      }
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.45;

      // 0. Deep Space Nebula & Micro-stars
      const nebGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.65);
      nebGrad.addColorStop(0, "rgba(20, 35, 75, 0.35)");
      nebGrad.addColorStop(0.5, "rgba(10, 18, 45, 0.2)");
      nebGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, width, height);

      bgStars.forEach((s) => {
        const twinkle = 0.35 + 0.65 * Math.sin(phase * s.speed + s.phase);
        ctx.fillStyle = `rgba(210, 235, 255, ${twinkle * 0.75})`;
        ctx.beginPath();
        ctx.arc(s.xRatio * width, s.yRatio * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      const nsRadius = 24; // Compact neutron star

      // Beam sweeping projection:
      // The magnetic axis precesses around the spin axis (Y-axis)
      const sweepX = Math.sin(phase) * Math.sin(magAngleRad);
      const sweepZ = Math.cos(phase) * Math.sin(magAngleRad);
      const sweepY = -Math.cos(magAngleRad); // Upward component

      // Line of sight intensity: peak when beam points toward observer (+Z axis)
      const beamAlignment = Math.max(0, sweepZ);
      const pulseIntensity = Math.pow(beamAlignment, 6); // Sharp lighthouse beam pulse

      // Update pulse oscilloscope history
      if (isPlayingRef.current) {
        pulseHistoryRef.current.push(pulseIntensity);
        if (pulseHistoryRef.current.length > 80) {
          pulseHistoryRef.current.shift();
        }
      }

      // 1. Background Magnetic Field Dipole Loops
      ctx.save();
      ctx.strokeStyle = "rgba(70, 140, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let side = -1; side <= 1; side += 2) {
        for (let scale = 1; scale <= 3; scale++) {
          ctx.beginPath();
          const loopW = nsRadius * 3.5 * scale;
          const loopH = nsRadius * 5.0 * scale;
          ctx.ellipse(cx + side * (loopW * 0.5), cy, loopW * 0.5, loopH * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. Emission Cones (Bipolar Synchrotron Beams)
      const beamLength = Math.min(width, height) * 0.48;
      const beamSpread = 0.18; // Angular half-width of relativistic cone

      for (let sign = -1; sign <= 1; sign += 2) {
        const dirX = sign * sweepX;
        const dirY = sign * sweepY;
        const dirZ = sign * sweepZ;

        // Perspective projection: scale length slightly by Z
        const pLen = beamLength * (1 + dirZ * 0.2);
        const bx = cx + dirX * pLen;
        const by = cy + dirY * pLen;

        const perpX = -dirY;
        const perpY = dirX;
        const coneHalfWidth = pLen * beamSpread;

        const cGrad = ctx.createRadialGradient(cx, cy, nsRadius, bx, by, pLen * 0.8);
        const beamAlpha = 0.4 + 0.5 * Math.max(0, dirZ);
        cGrad.addColorStop(0, `rgba(180, 220, 255, ${beamAlpha})`);
        cGrad.addColorStop(0.4, `rgba(80, 160, 255, ${beamAlpha * 0.6})`);
        cGrad.addColorStop(0.9, `rgba(40, 90, 220, ${beamAlpha * 0.15})`);
        cGrad.addColorStop(1, "transparent");

        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(bx + perpX * coneHalfWidth, by + perpY * coneHalfWidth);
        ctx.lineTo(bx - perpX * coneHalfWidth, by - perpY * coneHalfWidth);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Observer Flash Effect (when beam sweeps Earth)
      if (pulseIntensity > 0.3) {
        const flashRadius = nsRadius * (2.5 + pulseIntensity * 4.0);
        const flashGrad = ctx.createRadialGradient(cx, cy, nsRadius, cx, cy, flashRadius);
        flashGrad.addColorStop(0, `rgba(220, 240, 255, ${pulseIntensity * 0.7})`);
        flashGrad.addColorStop(0.5, `rgba(80, 180, 255, ${pulseIntensity * 0.3})`);
        flashGrad.addColorStop(1, "transparent");

        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, flashRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Central Neutron Star Core
      const coreGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, nsRadius);
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.3, "#c0e0ff");
      coreGrad.addColorStop(0.7, "#4080ff");
      coreGrad.addColorStop(1, "#0a1840");

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "#80b0ff";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, nsRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 5. Spin Axis & Magnetic Axis Vectors
      // Spin axis (vertical)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - nsRadius * 2.2);
      ctx.lineTo(cx, cy + nsRadius * 2.2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("SPIN AXIS (ω)", cx, cy - nsRadius * 2.4);

      // Magnetic axis line
      ctx.strokeStyle = "rgba(0, 230, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - sweepX * nsRadius * 1.8, cy - sweepY * nsRadius * 1.8);
      ctx.lineTo(cx + sweepX * nsRadius * 1.8, cy + sweepY * nsRadius * 1.8);
      ctx.stroke();

      // 6. Real-Time Oscilloscope Pulse Profile (Bottom Panel)
      const oscY = height - 55;
      const oscHeight = 40;
      const oscWidth = width - 40;
      const oscX = 20;

      // Background box for oscilloscope
      ctx.fillStyle = "rgba(5, 15, 30, 0.85)";
      ctx.strokeStyle = "rgba(40, 90, 160, 0.5)";
      ctx.lineWidth = 1;
      ctx.fillRect(oscX, oscY, oscWidth, oscHeight);
      ctx.strokeRect(oscX, oscY, oscWidth, oscHeight);

      // Label
      ctx.fillStyle = "rgba(100, 200, 255, 0.8)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`OBSERVED PULSE PROFILE (f = ${freqHz.toFixed(2)} Hz | P = ${data.inputs.period_ms} ms)`, oscX + 8, oscY + 12);

      // Waveform trace
      const hist = pulseHistoryRef.current;
      ctx.strokeStyle = "#00e6ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < hist.length; i++) {
        const x = oscX + (i / (hist.length - 1)) * oscWidth;
        const y = oscY + oscHeight - 5 - hist[i] * (oscHeight - 18);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

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
    <div className="relative size-full min-h-[360px] overflow-hidden rounded-xl border border-border/80 bg-[#020610]">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
