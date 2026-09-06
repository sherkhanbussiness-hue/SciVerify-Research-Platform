import { apiUrl } from "@/lib/api";

export interface StarParams {
  mass_msun: number;
  radius_rsun: number;
  temperature_k: number;
}

export interface StarResult {
  inputs: {
    mass_msun: number;
    radius_rsun: number;
    temperature_k: number;
  };
  calculated: {
    luminosity_w: number;
    luminosity_lsun: number;
    surface_gravity_ms2: number;
    log_g_cgs: number;
    escape_velocity_kms: number;
    spectral_type: string;
    color_hex: string;
    habitable_zone_inner_au: number;
    habitable_zone_outer_au: number;
    main_sequence_lifetime_gyr: number | null;
  };
  formulas: {
    luminosity: string;
    surface_gravity: string;
    escape_velocity: string;
    habitable_zone: string;
  };
  approximations: string[];
  verification_script: string;
}

export interface PulsarParams {
  period_ms: number;
  magnetic_field_gauss: number;
  mass_msun?: number;
  radius_km?: number;
  magnetic_angle_deg?: number;
}

export interface PulsarResult {
  inputs: {
    period_ms: number;
    magnetic_field_gauss: number;
    mass_msun: number;
    radius_km: number;
    magnetic_angle_deg: number;
  };
  calculated: {
    frequency_hz: number;
    angular_velocity_rad_s: number;
    spin_down_power_watts: number;
    spin_down_power_ergs_s: number;
    period_derivative_s_s: number;
    characteristic_age_years: number;
    light_cylinder_radius_km: number;
    moment_of_inertia_kg_m2: number;
    pulse_profile: Array<{ phase_deg: number; intensity: number }>;
  };
  formulas: {
    frequency: string;
    spin_down_power: string;
    characteristic_age: string;
    light_cylinder: string;
  };
  approximations: string[];
  verification_script: string;
}

export interface AsteroidParams {
  semi_major_axis_au: number;
  eccentricity: number;
  central_mass_msun?: number;
  asteroid_mass_kg?: number;
  steps?: number;
}

export interface TrajectoryPoint {
  step: number;
  time_days: number;
  true_anomaly_deg: number;
  x_au: number;
  y_au: number;
  r_au: number;
  v_kms: number;
}

export interface AsteroidResult {
  inputs: {
    semi_major_axis_au: number;
    eccentricity: number;
    central_mass_msun: number;
    asteroid_mass_kg: number;
    steps: number;
  };
  calculated: {
    perihelion_au: number;
    aphelion_au: number;
    orbital_period_years: number;
    orbital_period_days: number;
    perihelion_speed_kms: number;
    aphelion_speed_kms: number;
    mean_orbital_speed_kms: number;
    specific_orbital_energy_j_kg: number;
    specific_angular_momentum_m2_s: number;
    trajectory: TrajectoryPoint[];
  };
  formulas: {
    kepler_third_law: string;
    vis_viva: string;
    orbit_radius: string;
    perihelion_aphelion: string;
  };
  approximations: string[];
  verification_script: string;
}

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

export interface QuasarParams {
  smbh_mass_msun: number;
  accretion_rate_msun_yr: number;
  radiative_efficiency?: number;
  redshift_z?: number;
  jet_lorentz_gamma?: number;
}

export interface QuasarResult {
  inputs: {
    smbh_mass_msun: number;
    accretion_rate_msun_yr: number;
    radiative_efficiency: number;
    redshift_z: number;
    jet_lorentz_gamma: number;
  };
  calculated: {
    eddington_luminosity_w: number;
    eddington_luminosity_lsun: number;
    bolometric_luminosity_w: number;
    bolometric_luminosity_lsun: number;
    eddington_ratio: number;
    jet_beta: number;
    max_apparent_superluminal_speed: number;
    luminosity_distance_mpc: number;
    observed_bolometric_flux_w_m2: number;
    accretion_rate_kg_s: number;
  };
  formulas: {
    eddington_luminosity: string;
    bolometric_luminosity: string;
    eddington_ratio: string;
    jet_velocity: string;
    apparent_superluminal: string;
  };
  approximations: string[];
  verification_script: string;
}

export interface SandboxVerificationResponse {
  ran: boolean;
  correct: boolean;
  crashed: boolean;
  timed_out: boolean;
  exit_code: number | null;
  execution_time_ms: number;
  parsed_output: Record<string, unknown> | null;
  numeric_value: number | null;
  stdout: string;
  stderr: string;
  status: "VERIFIED_IN_SANDBOX" | "EXECUTION_FAILED";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.message || err.error || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchStarSimulation(params: StarParams) {
  return postJson<StarResult>("/api/simulation/star", params);
}

export function fetchPulsarSimulation(params: PulsarParams) {
  return postJson<PulsarResult>("/api/simulation/pulsar", params);
}

export function fetchAsteroidSimulation(params: AsteroidParams) {
  return postJson<AsteroidResult>("/api/simulation/asteroid", params);
}

export function fetchBlackHoleSimulation(params: BlackHoleParams) {
  return postJson<BlackHoleResult>("/api/simulation/blackhole", params);
}

export function fetchQuasarSimulation(params: QuasarParams) {
  return postJson<QuasarResult>("/api/simulation/quasar", params);
}

export function verifyInSandbox(script: string, expected_value?: number, tolerance?: number) {
  return postJson<SandboxVerificationResponse>("/api/simulation/verify", {
    script,
    expected_value,
    tolerance,
  });
}

export const STAR_PRESETS: Array<{ name: string; description: string; params: StarParams }> = [
  {
    name: "Sun (G2V Yellow Dwarf)",
    description: "Our home star, providing life-supporting planetary equilibrium.",
    params: { mass_msun: 1.0, radius_rsun: 1.0, temperature_k: 5772 },
  },
  {
    name: "Sirius A (A1V White Star)",
    description: "The brightest star in Earth's night sky, twice as massive as the Sun.",
    params: { mass_msun: 2.06, radius_rsun: 1.71, temperature_k: 9940 },
  },
  {
    name: "Betelgeuse (M1-2 Red Supergiant)",
    description: "Luminous red supergiant in Orion approaching core-collapse supernova.",
    params: { mass_msun: 16.5, radius_rsun: 764.0, temperature_k: 3600 },
  },
  {
    name: "Rigel (B8Ia Blue Supergiant)",
    description: "Extremely luminous blue supergiant shining with tens of thousands of solar luminosities.",
    params: { mass_msun: 21.0, radius_rsun: 78.9, temperature_k: 12100 },
  },
  {
    name: "Proxima Centauri (M5.5Ve Red Dwarf)",
    description: "The closest known star to the Sun, with an expected lifespan of trillions of years.",
    params: { mass_msun: 0.12, radius_rsun: 0.15, temperature_k: 3042 },
  },
];

export const PULSAR_PRESETS: Array<{ name: string; description: string; params: PulsarParams }> = [
  {
    name: "Crab Pulsar (PSR B0531+21)",
    description: "Young energetic pulsar formed in the historical SN 1054 supernova.",
    params: { period_ms: 33.08, magnetic_field_gauss: 3.8e12, mass_msun: 1.4, radius_km: 12.0, magnetic_angle_deg: 45 },
  },
  {
    name: "Vela Pulsar (PSR B0833-45)",
    description: "Bright radio and gamma-ray pulsar rotating over 11 times per second.",
    params: { period_ms: 89.33, magnetic_field_gauss: 3.4e12, mass_msun: 1.4, radius_km: 12.0, magnetic_angle_deg: 53 },
  },
  {
    name: "Fastest Millisecond Pulsar (PSR J1748-2446ad)",
    description: "Fastest known pulsar spinning at an astonishing 716 rotations per second.",
    params: { period_ms: 1.40, magnetic_field_gauss: 2.5e8, mass_msun: 1.6, radius_km: 11.5, magnetic_angle_deg: 35 },
  },
  {
    name: "Magnetar SGR 1806-20",
    description: "Ultra-magnetized neutron star with a magnetic field over 10^14 Gauss.",
    params: { period_ms: 7560.0, magnetic_field_gauss: 2.0e14, mass_msun: 1.5, radius_km: 12.0, magnetic_angle_deg: 70 },
  },
];

export const ASTEROID_PRESETS: Array<{ name: string; description: string; params: AsteroidParams }> = [
  {
    name: "1 Ceres (Main Belt Dwarf Planet)",
    description: "The largest object in the asteroid belt between Mars and Jupiter with a near-circular orbit.",
    params: { semi_major_axis_au: 2.77, eccentricity: 0.076, central_mass_msun: 1.0 },
  },
  {
    name: "4 Vesta (Differentiated Asteroid)",
    description: "Second largest asteroid in the main belt with a rocky basaltic crust.",
    params: { semi_major_axis_au: 2.36, eccentricity: 0.089, central_mass_msun: 1.0 },
  },
  {
    name: "99942 Apophis (Near-Earth Asteroid)",
    description: "Potentially hazardous Aten asteroid with a tight Earth-crossing orbit.",
    params: { semi_major_axis_au: 0.92, eccentricity: 0.191, central_mass_msun: 1.0 },
  },
  {
    name: "Halley's Comet (High-e Keplerian Orbit)",
    description: "Famous periodic comet with a highly eccentric orbit demonstrating Kepler's 2nd Law.",
    params: { semi_major_axis_au: 17.8, eccentricity: 0.967, central_mass_msun: 1.0 },
  },
];

export const BLACK_HOLE_PRESETS: Array<{ name: string; description: string; params: BlackHoleParams }> = [
  {
    name: "Sagittarius A* (Milky Way Center)",
    description: "Supermassive black hole at the center of the Milky Way galaxy.",
    params: { mass_msun: 4.15e6, test_particle_r_rs: 3.5, spin_a: 0.1 },
  },
  {
    name: "M87* (Virgo A Galaxy)",
    description: "Supermassive black hole famously imaged by the Event Horizon Telescope.",
    params: { mass_msun: 6.5e9, test_particle_r_rs: 3.0, spin_a: 0.9 },
  },
  {
    name: "Cygnus X-1 (Stellar Mass Black Hole)",
    description: "One of the strongest galactic X-ray sources, paired with a blue supergiant companion.",
    params: { mass_msun: 21.2, test_particle_r_rs: 4.0, spin_a: 0.95 },
  },
  {
    name: "GW150914 Remnant (LIGO Binary Merger)",
    description: "Black hole formed by the coalescence of two stellar-mass black holes.",
    params: { mass_msun: 62.0, test_particle_r_rs: 3.0, spin_a: 0.68 },
  },
];

export const QUASAR_PRESETS: Array<{ name: string; description: string; params: QuasarParams }> = [
  {
    name: "3C 273 (First Identified Quasar)",
    description: "One of the most luminous active galactic nuclei in the Virgo constellation.",
    params: { smbh_mass_msun: 8.86e8, accretion_rate_msun_yr: 20.0, radiative_efficiency: 0.1, redshift_z: 0.158, jet_lorentz_gamma: 10.0 },
  },
  {
    name: "TON 618 (Hyperluminous Ultramassive Black Hole)",
    description: "Hosts one of the most massive black holes ever observed with intense radiation output.",
    params: { smbh_mass_msun: 6.6e10, accretion_rate_msun_yr: 150.0, radiative_efficiency: 0.12, redshift_z: 2.219, jet_lorentz_gamma: 15.0 },
  },
  {
    name: "Pōniuāʻena (Early Universe Quasar)",
    description: "Ancient high-redshift quasar seen when the universe was only 700 million years old.",
    params: { smbh_mass_msun: 1.5e9, accretion_rate_msun_yr: 30.0, radiative_efficiency: 0.1, redshift_z: 7.515, jet_lorentz_gamma: 12.0 },
  },
  {
    name: "OJ 287 (Supermassive Binary Engine)",
    description: "Blazar with prominent quasi-periodic outbursts and ultra-relativistic jet emission.",
    params: { smbh_mass_msun: 1.8e10, accretion_rate_msun_yr: 45.0, radiative_efficiency: 0.15, redshift_z: 0.306, jet_lorentz_gamma: 18.0 },
  },
];
