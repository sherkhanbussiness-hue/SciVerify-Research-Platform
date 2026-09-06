import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertCircle,
  Atom,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileCode2,
  Flame,
  Globe2,
  Orbit,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  fetchStarSimulation,
  fetchPulsarSimulation,
  fetchAsteroidSimulation,
  fetchBlackHoleSimulation,
  fetchQuasarSimulation,
  verifyInSandbox,
  STAR_PRESETS,
  PULSAR_PRESETS,
  ASTEROID_PRESETS,
  BLACK_HOLE_PRESETS,
  QUASAR_PRESETS,
  type StarResult,
  type PulsarResult,
  type AsteroidResult,
  type BlackHoleResult,
  type QuasarResult,
  type SandboxVerificationResponse,
} from "@/lib/simulation-api";
import { StarCanvas } from "@/components/simulations/StarCanvas";
import { PulsarCanvas } from "@/components/simulations/PulsarCanvas";
import { AsteroidCanvas } from "@/components/simulations/AsteroidCanvas";
import { BlackHoleCanvas } from "@/components/simulations/BlackHoleCanvas";
import { QuasarCanvas } from "@/components/simulations/QuasarCanvas";

type CosmicEntityType = "star" | "pulsar" | "asteroid" | "blackhole" | "quasar";

interface ShellProps {
  children: React.ReactNode;
}

export function CosmicLabPage({ Shell, PageHeader }: { Shell: React.ComponentType<ShellProps>; PageHeader: React.ComponentType<{ eyebrow: string; title: string; description: string; actions?: React.ReactNode }> }) {
  const [entityType, setEntityType] = useState<CosmicEntityType>("star");

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);

  // Loading & error state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sandbox verification state
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<SandboxVerificationResponse | null>(null);

  // 1. Star state
  const [starParams, setStarParams] = useState(STAR_PRESETS[0].params);
  const [starResult, setStarResult] = useState<StarResult | null>(null);

  // 2. Pulsar state
  const [pulsarParams, setPulsarParams] = useState(PULSAR_PRESETS[0].params);
  const [pulsarResult, setPulsarResult] = useState<PulsarResult | null>(null);

  // 3. Asteroid state
  const [asteroidParams, setAsteroidParams] = useState(ASTEROID_PRESETS[0].params);
  const [asteroidResult, setAsteroidResult] = useState<AsteroidResult | null>(null);

  // 4. Black hole state
  const [blackHoleParams, setBlackHoleParams] = useState(BLACK_HOLE_PRESETS[0].params);
  const [blackHoleResult, setBlackHoleResult] = useState<BlackHoleResult | null>(null);

  // 5. Quasar state
  const [quasarParams, setQuasarParams] = useState(QUASAR_PRESETS[0].params);
  const [quasarResult, setQuasarResult] = useState<QuasarResult | null>(null);

  // Active verification script
  const activeScript =
    entityType === "star"
      ? starResult?.verification_script
      : entityType === "pulsar"
      ? pulsarResult?.verification_script
      : entityType === "asteroid"
      ? asteroidResult?.verification_script
      : entityType === "blackhole"
      ? blackHoleResult?.verification_script
      : quasarResult?.verification_script;

  // Monotonic sequence tracker to eliminate async race conditions
  const reqSeqRef = useRef<number>(0);

  // Run Star Simulation
  const runStar = useCallback(async (p = starParams) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchStarSimulation(p);
      if (seq === reqSeqRef.current) {
        setStarResult(res);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        setErrorMsg(err instanceof Error ? err.message : "Star simulation failed");
      }
    } finally {
      if (seq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [starParams]);

  // Run Pulsar Simulation
  const runPulsar = useCallback(async (p = pulsarParams) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchPulsarSimulation(p);
      if (seq === reqSeqRef.current) {
        setPulsarResult(res);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        setErrorMsg(err instanceof Error ? err.message : "Pulsar simulation failed");
      }
    } finally {
      if (seq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [pulsarParams]);

  // Run Asteroid Simulation
  const runAsteroid = useCallback(async (p = asteroidParams) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAsteroidSimulation(p);
      if (seq === reqSeqRef.current) {
        setAsteroidResult(res);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        setErrorMsg(err instanceof Error ? err.message : "Asteroid simulation failed");
      }
    } finally {
      if (seq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [asteroidParams]);

  // Run Black Hole Simulation
  const runBlackHole = useCallback(async (p = blackHoleParams) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchBlackHoleSimulation(p);
      if (seq === reqSeqRef.current) {
        setBlackHoleResult(res);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        setErrorMsg(err instanceof Error ? err.message : "Black hole simulation failed");
      }
    } finally {
      if (seq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [blackHoleParams]);

  // Run Quasar Simulation
  const runQuasar = useCallback(async (p = quasarParams) => {
    const seq = ++reqSeqRef.current;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchQuasarSimulation(p);
      if (seq === reqSeqRef.current) {
        setQuasarResult(res);
      }
    } catch (err) {
      if (seq === reqSeqRef.current) {
        setErrorMsg(err instanceof Error ? err.message : "Quasar simulation failed");
      }
    } finally {
      if (seq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [quasarParams]);

  // Initial fetch for current entity
  useEffect(() => {
    setVerificationResult(null);
    if (entityType === "star" && !starResult) void runStar();
    if (entityType === "pulsar" && !pulsarResult) void runPulsar();
    if (entityType === "asteroid" && !asteroidResult) void runAsteroid();
    if (entityType === "blackhole" && !blackHoleResult) void runBlackHole();
    if (entityType === "quasar" && !quasarResult) void runQuasar();
  }, [entityType, starResult, pulsarResult, asteroidResult, blackHoleResult, quasarResult, runStar, runPulsar, runAsteroid, runBlackHole, runQuasar]);

  // Trigger active simulation
  const handleRunActive = () => {
    setVerificationResult(null);
    if (entityType === "star") void runStar();
    else if (entityType === "pulsar") void runPulsar();
    else if (entityType === "asteroid") void runAsteroid();
    else if (entityType === "blackhole") void runBlackHole();
    else if (entityType === "quasar") void runQuasar();
  };

  // Sandbox verification handler
  const handleVerifyInSandbox = async () => {
    if (!activeScript) return;
    setVerifying(true);
    try {
      let expected: number | undefined;
      if (entityType === "star") expected = starResult?.calculated.luminosity_lsun;
      else if (entityType === "pulsar") expected = pulsarResult?.calculated.frequency_hz;
      else if (entityType === "asteroid") expected = asteroidResult?.calculated.orbital_period_days;
      else if (entityType === "blackhole") expected = blackHoleResult?.calculated.schwarzschild_radius_km;
      else if (entityType === "quasar") expected = quasarResult?.calculated.eddington_ratio;

      const res = await verifyInSandbox(activeScript, expected);
      setVerificationResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sandbox verification request failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Astrophysical Simulation Engine"
        title="Cosmic Simulation Lab"
        description="Interactive, mathematically validated astrophysics simulations powered by SciVerify's deterministic execution and sandboxed verification engine."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-sim-toggle-play"
              className="gap-1.5"
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isPlaying ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimSpeed(1.0);
                setIsPlaying(true);
              }}
              data-testid="button-sim-reset-speed"
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={handleRunActive}
              disabled={loading}
              data-testid="button-sim-run"
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Run Simulation
            </Button>
          </div>
        }
      />

      {/* Entity Selection Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { type: "star", label: "Stars", icon: Sparkles, color: "text-amber-300" },
          { type: "pulsar", label: "Pulsars", icon: Atom, color: "text-cyan-300" },
          { type: "asteroid", label: "Asteroids", icon: Orbit, color: "text-emerald-300" },
          { type: "blackhole", label: "Black Holes", icon: Compass, color: "text-violet-400" },
          { type: "quasar", label: "Quasars", icon: Flame, color: "text-rose-400" },
        ].map(({ type, label, icon: Icon, color }) => {
          const active = entityType === type;
          return (
            <button
              key={type}
              onClick={() => setEntityType(type as CosmicEntityType)}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-all ${
                active
                  ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/20"
                  : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/40 hover:bg-secondary/40 hover:text-foreground"
              }`}
              data-testid={`tab-sim-${type}`}
            >
              <Icon className={`size-4 ${color}`} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Error Alert if any */}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Visualizer & Controls */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Visualizer Area */}
        <div className="space-y-4">
          <Card className="panel-glow overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">
                  {entityType === "star" && "Stellar Photosphere & Chromosphere"}
                  {entityType === "pulsar" && "Relativistic Oblique Rotator & Light Cylinder"}
                  {entityType === "asteroid" && "Keplerian 2-Body Trajectory & Velocity Vector"}
                  {entityType === "blackhole" && "Gravitational Lensing & Relativistic Doppler Beaming"}
                  {entityType === "quasar" && "Active Galactic Nucleus & Relativistic Outflow Jet"}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Real-time Canvas visualization driven by verified astrophysical equations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Speed:</span>
                {[0.5, 1.0, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                      simSpeed === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {entityType === "star" && starResult && (
                <StarCanvas data={starResult} isPlaying={isPlaying} speed={simSpeed} />
              )}
              {entityType === "pulsar" && pulsarResult && (
                <PulsarCanvas data={pulsarResult} isPlaying={isPlaying} speed={simSpeed} />
              )}
              {entityType === "asteroid" && asteroidResult && (
                <AsteroidCanvas data={asteroidResult} isPlaying={isPlaying} speed={simSpeed} />
              )}
              {entityType === "blackhole" && blackHoleResult && (
                <BlackHoleCanvas data={blackHoleResult} isPlaying={isPlaying} speed={simSpeed} />
              )}
              {entityType === "quasar" && quasarResult && (
                <QuasarCanvas data={quasarResult} isPlaying={isPlaying} speed={simSpeed} />
              )}
            </CardContent>
          </Card>

          {/* SciVerify Sandbox Verification Box */}
          <Card className="panel-glow border-primary/25 bg-[#030a14]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-primary" />
                  <CardTitle className="text-xs font-semibold">SciVerify Sandbox Code Verification</CardTitle>
                </div>
                {verificationResult && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      verificationResult.ran && verificationResult.correct
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-red-400/30 bg-red-400/10 text-red-300"
                    }`}
                  >
                    {verificationResult.ran && verificationResult.correct ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> VERIFIED IN SANDBOX
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="size-3" /> VERIFICATION FAILED
                      </span>
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Executes the exact mathematical simulation formulas inside an isolated Python 3 subprocess sandbox,
                proving numerical correctness against reference equations.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {activeScript && (
                <pre className="max-h-28 overflow-y-auto rounded border border-border/70 bg-[#02050b] p-2.5 font-mono text-[10px] leading-5 text-muted-foreground">
                  {activeScript}
                </pre>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-muted-foreground">
                  {verificationResult && (
                    <span>
                      Execution time:{" "}
                      <strong className="text-foreground">{verificationResult.execution_time_ms} ms</strong> | Exit code:{" "}
                      <strong className="text-foreground">{verificationResult.exit_code}</strong>
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVerifyInSandbox}
                  disabled={verifying}
                  data-testid="button-run-sandbox-verify"
                  className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <FileCode2 className={`size-3.5 ${verifying ? "animate-spin" : ""}`} />
                  {verifying ? "Executing in Sandbox..." : "Verify in SciVerify Sandbox"}
                </Button>
              </div>

              {verificationResult?.parsed_output && (
                <div className="rounded border border-border/60 bg-secondary/30 p-2 font-mono text-[10px] text-emerald-300">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Sandbox Output:</div>
                  <pre>{JSON.stringify(verificationResult.parsed_output, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Parameters & Calculated Properties Side Panel */}
        <div className="space-y-4">
          {/* Parameter Configuration Card */}
          <Card className="panel-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold">Simulation Parameters</CardTitle>
              <p className="text-[11px] text-muted-foreground">Select presets or adjust parameters manually</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Preset Selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Astronomical Presets</label>
                <div className="mt-1 grid gap-1.5">
                  {entityType === "star" &&
                    STAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setStarParams(preset.params);
                          void runStar(preset.params);
                        }}
                        className={`rounded border p-2 text-left text-xs transition-colors ${
                          starParams.mass_msun === preset.params.mass_msun &&
                          starParams.temperature_k === preset.params.temperature_k
                            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                            : "border-border/70 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="truncate text-[10px] opacity-75">{preset.description}</div>
                      </button>
                    ))}

                  {entityType === "pulsar" &&
                    PULSAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setPulsarParams(preset.params);
                          void runPulsar(preset.params);
                        }}
                        className={`rounded border p-2 text-left text-xs transition-colors ${
                          pulsarParams.period_ms === preset.params.period_ms
                            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                            : "border-border/70 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="truncate text-[10px] opacity-75">{preset.description}</div>
                      </button>
                    ))}

                  {entityType === "asteroid" &&
                    ASTEROID_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setAsteroidParams(preset.params);
                          void runAsteroid(preset.params);
                        }}
                        className={`rounded border p-2 text-left text-xs transition-colors ${
                          asteroidParams.semi_major_axis_au === preset.params.semi_major_axis_au
                            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                            : "border-border/70 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="truncate text-[10px] opacity-75">{preset.description}</div>
                      </button>
                    ))}

                  {entityType === "blackhole" &&
                    BLACK_HOLE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setBlackHoleParams(preset.params);
                          void runBlackHole(preset.params);
                        }}
                        className={`rounded border p-2 text-left text-xs transition-colors ${
                          blackHoleParams.mass_msun === preset.params.mass_msun
                            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                            : "border-border/70 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="truncate text-[10px] opacity-75">{preset.description}</div>
                      </button>
                    ))}

                  {entityType === "quasar" &&
                    QUASAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setQuasarParams(preset.params);
                          void runQuasar(preset.params);
                        }}
                        className={`rounded border p-2 text-left text-xs transition-colors ${
                          quasarParams.smbh_mass_msun === preset.params.smbh_mass_msun
                            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                            : "border-border/70 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div>{preset.name}</div>
                        <div className="truncate text-[10px] opacity-75">{preset.description}</div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Sliders & Numeric Controls */}
              <div className="space-y-3 border-t border-border/70 pt-3">
                {entityType === "star" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Mass (M☉)</span>
                        <span className="font-mono text-primary">{starParams.mass_msun}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="30"
                        step="0.1"
                        value={starParams.mass_msun}
                        onChange={(e) => setStarParams({ ...starParams, mass_msun: parseFloat(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Radius (R☉)</span>
                        <span className="font-mono text-primary">{starParams.radius_rsun}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={starParams.radius_rsun}
                        onChange={(e) => setStarParams({ ...starParams, radius_rsun: parseFloat(e.target.value) })}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Surface Temp (K)</span>
                        <span className="font-mono text-primary">{starParams.temperature_k} K</span>
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="35000"
                        step="250"
                        value={starParams.temperature_k}
                        onChange={(e) => setStarParams({ ...starParams, temperature_k: parseInt(e.target.value, 10) })}
                        className="w-full accent-primary"
                      />
                    </div>
                  </>
                )}

                {entityType === "pulsar" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Rotation Period P (ms)</span>
                        <span className="font-mono text-cyan-300">{pulsarParams.period_ms} ms</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="500"
                        step="0.5"
                        value={pulsarParams.period_ms}
                        onChange={(e) => setPulsarParams({ ...pulsarParams, period_ms: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Magnetic Field B (Gauss)</span>
                        <span className="font-mono text-cyan-300">{pulsarParams.magnetic_field_gauss.toExponential(1)} G</span>
                      </div>
                      <input
                        type="range"
                        min="9"
                        max="14"
                        step="0.1"
                        value={Math.log10(pulsarParams.magnetic_field_gauss)}
                        onChange={(e) =>
                          setPulsarParams({ ...pulsarParams, magnetic_field_gauss: Math.pow(10, parseFloat(e.target.value)) })
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Magnetic Inclination α (deg)</span>
                        <span className="font-mono text-cyan-300">{pulsarParams.magnetic_angle_deg}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={pulsarParams.magnetic_angle_deg ?? 45}
                        onChange={(e) => setPulsarParams({ ...pulsarParams, magnetic_angle_deg: parseInt(e.target.value, 10) })}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </>
                )}

                {entityType === "asteroid" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Semi-Major Axis a (AU)</span>
                        <span className="font-mono text-emerald-300">{asteroidParams.semi_major_axis_au} AU</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="25.0"
                        step="0.1"
                        value={asteroidParams.semi_major_axis_au}
                        onChange={(e) => setAsteroidParams({ ...asteroidParams, semi_major_axis_au: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Eccentricity e</span>
                        <span className="font-mono text-emerald-300">{asteroidParams.eccentricity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="0.95"
                        step="0.01"
                        value={asteroidParams.eccentricity}
                        onChange={(e) => setAsteroidParams({ ...asteroidParams, eccentricity: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Central Star Mass (M☉)</span>
                        <span className="font-mono text-emerald-300">{asteroidParams.central_mass_msun} M☉</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="5.0"
                        step="0.1"
                        value={asteroidParams.central_mass_msun ?? 1.0}
                        onChange={(e) => setAsteroidParams({ ...asteroidParams, central_mass_msun: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </>
                )}

                {entityType === "blackhole" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Log Mass (M☉)</span>
                        <span className="font-mono text-violet-300">{blackHoleParams.mass_msun.toExponential(2)} M☉</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.1"
                        value={Math.log10(blackHoleParams.mass_msun)}
                        onChange={(e) =>
                          setBlackHoleParams({ ...blackHoleParams, mass_msun: Math.pow(10, parseFloat(e.target.value)) })
                        }
                        className="w-full accent-violet-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Test Orbit Radius (r / Rs)</span>
                        <span className="font-mono text-violet-300">{blackHoleParams.test_particle_r_rs} Rs</span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="15.0"
                        step="0.1"
                        value={blackHoleParams.test_particle_r_rs ?? 3.0}
                        onChange={(e) =>
                          setBlackHoleParams({ ...blackHoleParams, test_particle_r_rs: parseFloat(e.target.value) })
                        }
                        className="w-full accent-violet-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Dimensionless Spin a*</span>
                        <span className="font-mono text-violet-300">{blackHoleParams.spin_a}</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="0.99"
                        step="0.02"
                        value={blackHoleParams.spin_a ?? 0.0}
                        onChange={(e) => setBlackHoleParams({ ...blackHoleParams, spin_a: parseFloat(e.target.value) })}
                        className="w-full accent-violet-400"
                      />
                    </div>
                  </>
                )}

                {entityType === "quasar" && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>SMBH Mass (Log M☉)</span>
                        <span className="font-mono text-rose-300">{quasarParams.smbh_mass_msun.toExponential(2)} M☉</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="10.5"
                        step="0.1"
                        value={Math.log10(quasarParams.smbh_mass_msun)}
                        onChange={(e) =>
                          setQuasarParams({ ...quasarParams, smbh_mass_msun: Math.pow(10, parseFloat(e.target.value)) })
                        }
                        className="w-full accent-rose-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Accretion Rate Ṁ (M☉/yr)</span>
                        <span className="font-mono text-rose-300">{quasarParams.accretion_rate_msun_yr} M☉/yr</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="200"
                        step="0.5"
                        value={quasarParams.accretion_rate_msun_yr}
                        onChange={(e) =>
                          setQuasarParams({ ...quasarParams, accretion_rate_msun_yr: parseFloat(e.target.value) })
                        }
                        className="w-full accent-rose-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Cosmological Redshift z</span>
                        <span className="font-mono text-rose-300">z = {quasarParams.redshift_z}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="8.0"
                        step="0.05"
                        value={quasarParams.redshift_z ?? 0.5}
                        onChange={(e) => setQuasarParams({ ...quasarParams, redshift_z: parseFloat(e.target.value) })}
                        className="w-full accent-rose-400"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scientific Results Metrics Panel */}
          <Card className="panel-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Scientific Calculations & Derived Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {entityType === "star" && starResult && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Luminosity</div>
                    <div className="font-mono font-semibold text-foreground">
                      {starResult.calculated.luminosity_lsun.toFixed(2)} L☉
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Spectral Class</div>
                    <div className="font-mono font-semibold text-primary">
                      {starResult.calculated.spectral_type}
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Escape Velocity</div>
                    <div className="font-mono font-semibold text-foreground">
                      {starResult.calculated.escape_velocity_kms.toFixed(1)} km/s
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Surface Gravity</div>
                    <div className="font-mono font-semibold text-foreground">
                      log g = {starResult.calculated.log_g_cgs.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2 rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Habitable Zone Boundaries</div>
                    <div className="font-mono text-foreground">
                      {starResult.calculated.habitable_zone_inner_au.toFixed(2)} AU –{" "}
                      {starResult.calculated.habitable_zone_outer_au.toFixed(2)} AU
                    </div>
                  </div>
                </div>
              )}

              {entityType === "pulsar" && pulsarResult && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Frequency</div>
                    <div className="font-mono font-semibold text-cyan-300">
                      {pulsarResult.calculated.frequency_hz.toFixed(2)} Hz
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Angular Velocity</div>
                    <div className="font-mono font-semibold text-foreground">
                      {pulsarResult.calculated.angular_velocity_rad_s.toFixed(1)} rad/s
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Spin-down Power</div>
                    <div className="font-mono font-semibold text-foreground">
                      {pulsarResult.calculated.spin_down_power_watts.toExponential(2)} W
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Light Cylinder (RLC)</div>
                    <div className="font-mono font-semibold text-foreground">
                      {pulsarResult.calculated.light_cylinder_radius_km.toFixed(1)} km
                    </div>
                  </div>
                  <div className="col-span-2 rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Characteristic Age</div>
                    <div className="font-mono text-foreground">
                      {pulsarResult.calculated.characteristic_age_years.toExponential(2)} years
                    </div>
                  </div>
                </div>
              )}

              {entityType === "asteroid" && asteroidResult && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Orbital Period</div>
                    <div className="font-mono font-semibold text-emerald-300">
                      {asteroidResult.calculated.orbital_period_years.toFixed(2)} yr (
                      {asteroidResult.calculated.orbital_period_days.toFixed(1)} d)
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Mean Orbital Speed</div>
                    <div className="font-mono font-semibold text-foreground">
                      {asteroidResult.calculated.mean_orbital_speed_kms.toFixed(2)} km/s
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Perihelion Speed</div>
                    <div className="font-mono font-semibold text-foreground">
                      {asteroidResult.calculated.perihelion_speed_kms.toFixed(2)} km/s
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Aphelion Speed</div>
                    <div className="font-mono font-semibold text-foreground">
                      {asteroidResult.calculated.aphelion_speed_kms.toFixed(2)} km/s
                    </div>
                  </div>
                  <div className="col-span-2 rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Apsides Distance Range</div>
                    <div className="font-mono text-foreground">
                      r_p = {asteroidResult.calculated.perihelion_au.toFixed(2)} AU | r_a ={" "}
                      {asteroidResult.calculated.aphelion_au.toFixed(2)} AU
                    </div>
                  </div>
                </div>
              )}

              {entityType === "blackhole" && blackHoleResult && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Schwarzschild Radius (Rs)</div>
                    <div className="font-mono font-semibold text-violet-300">
                      {blackHoleResult.calculated.schwarzschild_radius_km.toExponential(2)} km
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Photon Sphere (Rph)</div>
                    <div className="font-mono font-semibold text-foreground">
                      {blackHoleResult.calculated.photon_sphere_radius_km.toExponential(2)} km
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Gravitational Redshift</div>
                    <div className="font-mono font-semibold text-foreground">
                      z = {blackHoleResult.calculated.gravitational_redshift_z.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Orbital Speed at r</div>
                    <div className="font-mono font-semibold text-foreground">
                      {(blackHoleResult.calculated.orbital_speed_fraction_c * 100).toFixed(1)}% c
                    </div>
                  </div>
                  <div className="col-span-2 rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Innermost Stable Orbit (ISCO)</div>
                    <div className="font-mono text-foreground">
                      {blackHoleResult.calculated.isco_radius_km.toExponential(2)} km
                    </div>
                  </div>
                </div>
              )}

              {entityType === "quasar" && quasarResult && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Bolometric Luminosity</div>
                    <div className="font-mono font-semibold text-rose-300">
                      {quasarResult.calculated.bolometric_luminosity_lsun.toExponential(2)} L☉
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Eddington Ratio</div>
                    <div className="font-mono font-semibold text-foreground">
                      λ_Edd = {quasarResult.calculated.eddington_ratio.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Relativistic Jet Speed</div>
                    <div className="font-mono font-semibold text-foreground">
                      β = {(quasarResult.calculated.jet_beta * 100).toFixed(2)}% c
                    </div>
                  </div>
                  <div className="rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Luminosity Distance</div>
                    <div className="font-mono font-semibold text-foreground">
                      {quasarResult.calculated.luminosity_distance_mpc.toFixed(1)} Mpc
                    </div>
                  </div>
                  <div className="col-span-2 rounded border border-border/70 bg-secondary/20 p-2">
                    <div className="text-[10px] text-muted-foreground">Observed Flux at Earth</div>
                    <div className="font-mono text-foreground">
                      {quasarResult.calculated.observed_bolometric_flux_w_m2.toExponential(2)} W/m²
                    </div>
                  </div>
                </div>
              )}

              {/* Formula & Approximation Notes */}
              <div className="mt-3 rounded border border-border/60 bg-[#060e18] p-2.5 text-[10px] text-muted-foreground">
                <div className="font-semibold text-foreground">Astrophysical Model & Notes:</div>
                <div className="mt-1 space-y-1">
                  {entityType === "star" && (
                    <>
                      <div>• Stefan-Boltzmann radiation: L = 4π R² σ T⁴</div>
                      <div>• Newtonian surface gravity: g = GM/R²</div>
                    </>
                  )}
                  {entityType === "pulsar" && (
                    <>
                      <div>• Magnetic dipole spin-down: Ė = (2 B² R⁶ ω⁴ sin²α) / (3 μ₀ c³)</div>
                      <div>• Relativistic light cylinder radius: R_LC = c / ω</div>
                    </>
                  )}
                  {entityType === "asteroid" && (
                    <>
                      <div>• Keplerian orbital period: T = 2π √(a³ / GM)</div>
                      <div>• Vis-Viva velocity: v = √[GM (2/r - 1/a)]</div>
                    </>
                  )}
                  {entityType === "blackhole" && (
                    <>
                      <div>• Schwarzschild radius: Rs = 2GM / c²</div>
                      <div>• Gravitational redshift: z = (1 - Rs/r)^(-1/2) - 1</div>
                    </>
                  )}
                  {entityType === "quasar" && (
                    <>
                      <div>• Accretion luminosity: L_bol = η Ṁ c²</div>
                      <div>• Eddington critical limit: L_Edd = 4π G M mp c / σT</div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
