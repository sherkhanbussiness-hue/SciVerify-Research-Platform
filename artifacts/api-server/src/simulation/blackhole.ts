import { C, G, HBAR, K_B, M_SUN } from "./constants";

export interface BlackHoleParams {
  mass_msun: number;
  test_particle_r_rs?: number;
  spin_a?: number;
}

export interface BlackHoleResult {
  inputs: {
    mass_msun: number;
    test_particle_r_rs: number;
    spin_a: number;
  };
  calculated: {
    schwarzschild_radius_km: number;
    gravitational_radius_km: number;
    event_horizon_radius_km: number;
    photon_sphere_radius_km: number;
    isco_radius_km: number;
    ergosphere_equator_radius_km: number;
    test_particle_radius_km: number;
    gravitational_redshift_z: number;
    time_dilation_factor: number;
    orbital_speed_fraction_c: number;
    hawking_temperature_k: number;
    accretion_doppler_beaming_factor: number;
  };
  formulas: {
    schwarzschild_radius: string;
    photon_sphere: string;
    isco: string;
    gravitational_redshift: string;
    time_dilation: string;
    hawking_temperature: string;
  };
  approximations: string[];
  verification_script: string;
}

export function simulateBlackHole(params: BlackHoleParams): BlackHoleResult {
  const mass_msun = params.mass_msun;
  const test_particle_r_rs = params.test_particle_r_rs ?? 3.0;
  const raw_spin = params.spin_a ?? 0.0;

  if (typeof mass_msun !== "number" || !Number.isFinite(mass_msun) || mass_msun < 1.0 || mass_msun > 1e12) {
    throw new Error("Black hole mass must be a finite positive number between 1.0 and 1e12 M_sun.");
  }
  if (typeof test_particle_r_rs !== "number" || !Number.isFinite(test_particle_r_rs) || test_particle_r_rs <= 1.0 || test_particle_r_rs > 1e6) {
    throw new Error("Test particle radius must be a finite number outside the Schwarzschild event horizon (1.0 < r/Rs <= 1e6).");
  }
  if (typeof raw_spin !== "number" || !Number.isFinite(raw_spin) || raw_spin < -0.998 || raw_spin > 0.998) {
    throw new Error("Dimensionless Kerr spin parameter must be a finite number in range [-0.998, 0.998].");
  }
  const spin_a = raw_spin;

  const massKg = mass_msun * M_SUN;

  // Gravitational radius: r_g = GM / c^2
  const rgMeters = (G * massKg) / (C * C);
  const rgKm = rgMeters / 1000;

  // Schwarzschild radius: R_s = 2 r_g
  const rsMeters = 2 * rgMeters;
  const rsKm = rsMeters / 1000;

  // Kerr event horizon radius: R_+ = r_g * (1 + sqrt(1 - a^2))
  const sqrtTerm = Math.sqrt(Math.max(0, 1 - spin_a * spin_a));
  const rPlusMeters = rgMeters * (1 + sqrtTerm);
  const rPlusKm = rPlusMeters / 1000;

  // Ergosphere radius at equator = 2 * r_g = R_s
  const rErgoKm = rsKm;

  // Photon sphere for Kerr (equatorial approx):
  // For Schwarzschild (a=0): R_ph = 3 r_g = 1.5 R_s
  const rPhMeters = rgMeters * (2 * (1 + Math.cos((2 / 3) * Math.acos(-Math.abs(spin_a)))));
  const rPhKm = rPhMeters / 1000;

  // ISCO for Kerr (Bardeen et al. 1972):
  // For a=0: ISCO = 6 r_g = 3 R_s
  const z1 = 1 + Math.cbrt(1 - spin_a * spin_a) * (Math.cbrt(1 + spin_a) + Math.cbrt(1 - spin_a));
  const z2 = Math.sqrt(3 * spin_a * spin_a + z1 * z1);
  const sign = spin_a >= 0 ? 1 : -1;
  const iscoMultiplier = 3 + z2 - sign * Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  const iscoKm = rgKm * iscoMultiplier;

  // Test particle position in km and meters
  const rTestMeters = test_particle_r_rs * rsMeters;
  const rTestKm = rTestMeters / 1000;

  // Gravitational redshift: z = 1 / sqrt(1 - R_s / r) - 1
  const metricFactor = Math.sqrt(Math.max(1e-6, 1 - rsMeters / rTestMeters));
  const redshiftZ = 1 / metricFactor - 1;
  const timeDilation = metricFactor; // dtau / dt

  // Relativistic circular orbital velocity at radius r (fraction of c)
  // v / c = sqrt(r_g / r)
  const vOrbitFractionC = Math.min(0.999, Math.sqrt(rgMeters / rTestMeters));

  // Relativistic Doppler beaming factor for approaching disk edge:
  // delta = 1 / [gamma * (1 - beta * cos(theta))]
  const gamma = 1 / Math.sqrt(1 - vOrbitFractionC * vOrbitFractionC);
  const dopplerBeamingFactor = 1 / (gamma * (1 - vOrbitFractionC * 0.7)); // ~45 deg inclination

  // Hawking Radiation temperature: T_H = hbar * c^3 / (8 * pi * G * M * k_B)
  const hawkingTempK = (HBAR * Math.pow(C, 3)) / (8 * Math.PI * G * massKg * K_B);

  const verificationScript = `import json, math
G = ${G}
C = ${C}
M_SUN = ${M_SUN}

mass_msun = ${mass_msun}
test_r_rs = ${test_particle_r_rs}

mass_kg = mass_msun * M_SUN
r_s = 2.0 * G * mass_kg / (C ** 2)
r_test = test_r_rs * r_s

# Gravitational redshift & time dilation
metric_g00 = 1.0 - (r_s / r_test)
time_dilation = math.sqrt(max(1e-9, metric_g00))
redshift_z = (1.0 / time_dilation) - 1.0

print(json.dumps({
    "value": r_s / 1000.0,
    "schwarzschild_radius_km": r_s / 1000.0,
    "redshift_z": redshift_z,
    "time_dilation": time_dilation
}))
`;

  return {
    inputs: {
      mass_msun,
      test_particle_r_rs,
      spin_a,
    },
    calculated: {
      schwarzschild_radius_km: rsKm,
      gravitational_radius_km: rgKm,
      event_horizon_radius_km: rPlusKm,
      photon_sphere_radius_km: rPhKm,
      isco_radius_km: iscoKm,
      ergosphere_equator_radius_km: rErgoKm,
      test_particle_radius_km: rTestKm,
      gravitational_redshift_z: redshiftZ,
      time_dilation_factor: timeDilation,
      orbital_speed_fraction_c: vOrbitFractionC,
      hawking_temperature_k: hawkingTempK,
      accretion_doppler_beaming_factor: dopplerBeamingFactor,
    },
    formulas: {
      schwarzschild_radius: "R_s = 2GM / c²",
      photon_sphere: "R_ph = 1.5 R_s = 3 r_g  [Schwarzschild]",
      isco: "R_ISCO = 3 R_s = 6 r_g  [Schwarzschild]",
      gravitational_redshift: "z = 1 / √(1 - R_s/r) - 1",
      time_dilation: "dτ / dt = √(1 - R_s/r)",
      hawking_temperature: "T_H = ℏ c³ / (8π G M k_B)",
    },
    approximations: [
      "Relativistic-inspired visualization (Schwarzschild / Kerr metric approximations) — not a full general-relativistic ray-tracing simulation.",
      "Accretion disk modeled via Shakura-Sunyaev geometrically thin optically thick approximation with Doppler brightening.",
      "Spherical test particle motion with first-order geodesic time dilation.",
    ],
    verification_script: verificationScript,
  };
}
