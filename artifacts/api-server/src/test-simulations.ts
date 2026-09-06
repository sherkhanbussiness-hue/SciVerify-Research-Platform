import { simulateStar } from "./simulation/star";
import { simulatePulsar } from "./simulation/pulsar";
import { simulateAsteroid } from "./simulation/asteroid";
import { simulateBlackHole } from "./simulation/blackhole";
import { simulateQuasar } from "./simulation/quasar";
import { runSandboxed } from "./harness/sandbox";

async function runSimulationTests() {
  console.log("==================================================");
  console.log("TESTING COSMIC SIMULATION SCIENTIFIC ENGINES");
  console.log("==================================================\n");

  const results: Record<string, boolean> = {};

  // 1. Star Model Tests
  console.log("--- TEST 1: Star Simulation (Sun & Extreme Stars) ---");
  // Sun: Mass = 1.0 M_sun, Radius = 1.0 R_sun, Temp = 5772 K
  const sun = simulateStar({ mass_msun: 1.0, radius_rsun: 1.0, temperature_k: 5772 });
  const sunPass = Math.abs(sun.calculated.luminosity_lsun - 1.0) < 0.01 &&
    Math.abs(sun.calculated.escape_velocity_kms - 617.7) < 5.0 &&
    sun.calculated.spectral_type.startsWith("G");
  console.log(`- Solar calculations: L = ${sun.calculated.luminosity_lsun.toFixed(3)} L_sun, v_esc = ${sun.calculated.escape_velocity_kms.toFixed(1)} km/s, type = ${sun.calculated.spectral_type} => ${sunPass ? "PASS" : "FAIL"}`);
  results["star_solar_model"] = sunPass;

  // Invalid star inputs
  let starInvalidCaught = false;
  try {
    simulateStar({ mass_msun: -1.0, radius_rsun: 1.0, temperature_k: 5000 });
  } catch {
    starInvalidCaught = true;
  }
  console.log(`- Reject negative mass: ${starInvalidCaught ? "PASS" : "FAIL"}`);
  results["star_reject_negative"] = starInvalidCaught;

  // 2. Pulsar Model Tests
  console.log("\n--- TEST 2: Pulsar Simulation (Crab Pulsar) ---");
  // Crab Pulsar: P = 33 ms, B = 3.8e12 Gauss
  const crab = simulatePulsar({ period_ms: 33.0, magnetic_field_gauss: 3.8e12 });
  const crabPass = Math.abs(crab.calculated.frequency_hz - 30.3) < 0.5 &&
    crab.calculated.spin_down_power_watts > 1e30 &&
    crab.calculated.light_cylinder_radius_km > 1000;
  console.log(`- Crab pulsar calculations: f = ${crab.calculated.frequency_hz.toFixed(2)} Hz, Edot = ${crab.calculated.spin_down_power_watts.toExponential(2)} W, R_LC = ${crab.calculated.light_cylinder_radius_km.toFixed(1)} km => ${crabPass ? "PASS" : "FAIL"}`);
  results["pulsar_crab_model"] = crabPass;

  // Invalid pulsar input
  let pulsarInvalidCaught = false;
  try {
    simulatePulsar({ period_ms: -10, magnetic_field_gauss: 1e12 });
  } catch {
    pulsarInvalidCaught = true;
  }
  console.log(`- Reject negative period: ${pulsarInvalidCaught ? "PASS" : "FAIL"}`);
  results["pulsar_reject_negative"] = pulsarInvalidCaught;

  // 3. Asteroid Model Tests
  console.log("\n--- TEST 3: Asteroid Simulation (Ceres Orbit) ---");
  // Ceres: a = 2.77 AU, e = 0.076
  const ceres = simulateAsteroid({ semi_major_axis_au: 2.77, eccentricity: 0.076 });
  const ceresPass = Math.abs(ceres.calculated.orbital_period_years - 4.6) < 0.1 &&
    ceres.calculated.perihelion_speed_kms > ceres.calculated.aphelion_speed_kms &&
    ceres.calculated.trajectory.length === 181;
  console.log(`- Ceres orbital calculations: T = ${ceres.calculated.orbital_period_years.toFixed(2)} yr, v_peri = ${ceres.calculated.perihelion_speed_kms.toFixed(2)} km/s, v_aph = ${ceres.calculated.aphelion_speed_kms.toFixed(2)} km/s, steps = ${ceres.calculated.trajectory.length} => ${ceresPass ? "PASS" : "FAIL"}`);
  results["asteroid_ceres_model"] = ceresPass;

  // Invalid asteroid input (eccentricity >= 1 for bound orbit)
  let asteroidInvalidCaught = false;
  try {
    simulateAsteroid({ semi_major_axis_au: 2.0, eccentricity: 1.5 });
  } catch {
    asteroidInvalidCaught = true;
  }
  console.log(`- Reject unbounded eccentricity: ${asteroidInvalidCaught ? "PASS" : "FAIL"}`);
  results["asteroid_reject_unbound"] = asteroidInvalidCaught;

  // 4. Black Hole Model Tests
  console.log("\n--- TEST 4: Black Hole Simulation (Sagittarius A*) ---");
  // Sgr A*: Mass = 4.15e6 M_sun
  const sgrA = simulateBlackHole({ mass_msun: 4.15e6, test_particle_r_rs: 3.0 });
  const sgrAPass = sgrA.calculated.schwarzschild_radius_km > 1.2e7 &&
    sgrA.calculated.schwarzschild_radius_km < 1.3e7 &&
    sgrA.calculated.photon_sphere_radius_km > sgrA.calculated.schwarzschild_radius_km &&
    sgrA.calculated.gravitational_redshift_z > 0;
  console.log(`- Sgr A* calculations: R_s = ${sgrA.calculated.schwarzschild_radius_km.toExponential(2)} km, R_ph = ${sgrA.calculated.photon_sphere_radius_km.toExponential(2)} km, z = ${sgrA.calculated.gravitational_redshift_z.toFixed(3)} => ${sgrAPass ? "PASS" : "FAIL"}`);
  results["blackhole_sgra_model"] = sgrAPass;

  // Invalid black hole input (test particle inside horizon)
  let bhInvalidCaught = false;
  try {
    simulateBlackHole({ mass_msun: 10, test_particle_r_rs: 0.5 });
  } catch {
    bhInvalidCaught = true;
  }
  console.log(`- Reject test radius inside horizon: ${bhInvalidCaught ? "PASS" : "FAIL"}`);
  results["blackhole_reject_inside_horizon"] = bhInvalidCaught;

  // 5. Quasar Model Tests
  console.log("\n--- TEST 5: Quasar Simulation (3C 273) ---");
  // 3C 273: Mass = 8.86e8 M_sun, dM/dt = 20 M_sun/yr
  const q3c273 = simulateQuasar({ smbh_mass_msun: 8.86e8, accretion_rate_msun_yr: 20.0, redshift_z: 0.158 });
  const qPass = q3c273.calculated.bolometric_luminosity_w > 1e39 &&
    q3c273.calculated.eddington_ratio > 0 &&
    q3c273.calculated.luminosity_distance_mpc > 700;
  console.log(`- 3C 273 calculations: L_bol = ${q3c273.calculated.bolometric_luminosity_w.toExponential(2)} W, lambda_Edd = ${q3c273.calculated.eddington_ratio.toFixed(3)}, d_L = ${q3c273.calculated.luminosity_distance_mpc.toFixed(1)} Mpc => ${qPass ? "PASS" : "FAIL"}`);
  results["quasar_3c273_model"] = qPass;

  // 6. Sandbox Verification of Python Scripts
  console.log("\n--- TEST 6: SciVerify Sandbox Script Execution for All 5 Simulations ---");

  // 6a: Star Sandbox Verification
  const starCapture = await runSandboxed(sun.verification_script, 5000);
  const starSandPass = !starCapture.crashed && starCapture.exit_code === 0 && starCapture.stdout.includes('"value"');
  console.log(`- Star Python script in sandbox: exit ${starCapture.exit_code}, crashed=${starCapture.crashed} => ${starSandPass ? "PASS" : "FAIL"}`);
  results["star_sandbox_verified"] = starSandPass;

  // 6b: Pulsar Sandbox Verification
  const pulsarCapture = await runSandboxed(crab.verification_script, 5000);
  const pulsarSandPass = !pulsarCapture.crashed && pulsarCapture.exit_code === 0 && pulsarCapture.stdout.includes('"value"');
  console.log(`- Pulsar Python script in sandbox: exit ${pulsarCapture.exit_code}, crashed=${pulsarCapture.crashed} => ${pulsarSandPass ? "PASS" : "FAIL"}`);
  results["pulsar_sandbox_verified"] = pulsarSandPass;

  // 6c: Asteroid Sandbox Verification
  const asteroidCapture = await runSandboxed(ceres.verification_script, 5000);
  const asteroidSandPass = !asteroidCapture.crashed && asteroidCapture.exit_code === 0 && asteroidCapture.stdout.includes('"value"');
  console.log(`- Asteroid Python script in sandbox: exit ${asteroidCapture.exit_code}, crashed=${asteroidCapture.crashed} => ${asteroidSandPass ? "PASS" : "FAIL"}`);
  results["asteroid_sandbox_verified"] = asteroidSandPass;

  // 6d: Black Hole Sandbox Verification
  const bhCapture = await runSandboxed(sgrA.verification_script, 5000);
  const bhSandPass = !bhCapture.crashed && bhCapture.exit_code === 0 && bhCapture.stdout.includes('"value"');
  console.log(`- Black Hole Python script in sandbox: exit ${bhCapture.exit_code}, crashed=${bhCapture.crashed} => ${bhSandPass ? "PASS" : "FAIL"}`);
  results["blackhole_sandbox_verified"] = bhSandPass;

  // 6e: Quasar Sandbox Verification
  const quasarCapture = await runSandboxed(q3c273.verification_script, 5000);
  const quasarSandPass = !quasarCapture.crashed && quasarCapture.exit_code === 0 && quasarCapture.stdout.includes('"value"');
  console.log(`- Quasar Python script in sandbox: exit ${quasarCapture.exit_code}, crashed=${quasarCapture.crashed} => ${quasarSandPass ? "PASS" : "FAIL"}`);
  results["quasar_sandbox_verified"] = quasarSandPass;

  console.log("\n==================================================");
  console.log("SIMULATION ENGINE TEST SUMMARY");
  console.log("==================================================");
  let allPass = true;
  for (const [name, ok] of Object.entries(results)) {
    console.log(`  ${name.padEnd(32)}: ${ok ? "PASS" : "FAIL"}`);
    if (!ok) allPass = false;
  }
  console.log("==================================================");
  if (!allPass) {
    throw new Error("One or more cosmic simulation tests failed!");
  }
  console.log("ALL COSMIC SIMULATION TESTS PASSED!\n");
}

runSimulationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
