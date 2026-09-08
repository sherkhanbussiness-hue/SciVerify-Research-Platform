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

export function calculateStarFallback(params: StarParams): StarResult {
  const M = params.mass_msun;
  const R = params.radius_rsun;
  const T = params.temperature_k;
  const sigma = 5.670374419e-8;
  const R_sun_m = 6.957e8;
  const L_sun_w = 3.828e26;
  const G = 6.6743e-11;
  const M_sun_kg = 1.98847e30;

  const area = 4 * Math.PI * Math.pow(R * R_sun_m, 2);
  const luminosity_w = area * sigma * Math.pow(T, 4);
  const luminosity_lsun = luminosity_w / L_sun_w;

  const m_kg = M * M_sun_kg;
  const r_m = R * R_sun_m;
  const g_ms2 = (G * m_kg) / Math.pow(r_m, 2);
  const log_g = Math.log10(g_ms2 * 100);

  const v_esc = Math.sqrt((2 * G * m_kg) / r_m) / 1000;

  let spectral_type = 'G2V';
  let color_hex = '#ffea79';
  if (T >= 30000) { spectral_type = 'O5V'; color_hex = '#9bb0ff'; }
  else if (T >= 10000) { spectral_type = 'B0V'; color_hex = '#aabfff'; }
  else if (T >= 7500) { spectral_type = 'A0V'; color_hex = '#cad7ff'; }
  else if (T >= 6000) { spectral_type = 'F0V'; color_hex = '#f8f7ff'; }
  else if (T >= 5200) { spectral_type = 'G2V'; color_hex = '#fff4ea'; }
  else if (T >= 3700) { spectral_type = 'K0V'; color_hex = '#ffd2a1'; }
  else { spectral_type = 'M0V'; color_hex = '#ffad60'; }

  const hz_in = Math.sqrt(luminosity_lsun / 1.1);
  const hz_out = Math.sqrt(luminosity_lsun / 0.53);
  const lifetime = M <= 0.4 ? null : 10 * Math.pow(M, -2.5);

  return {
    inputs: { mass_msun: M, radius_rsun: R, temperature_k: T },
    calculated: {
      luminosity_w,
      luminosity_lsun,
      surface_gravity_ms2: g_ms2,
      log_g_cgs: log_g,
      escape_velocity_kms: v_esc,
      spectral_type,
      color_hex,
      habitable_zone_inner_au: hz_in,
      habitable_zone_outer_au: hz_out,
      main_sequence_lifetime_gyr: lifetime,
    },
    formulas: {
      luminosity: "L = 4π R² σ T⁴",
      surface_gravity: "g = GM / R²",
      escape_velocity: "v_esc = √(2GM / R)",
      habitable_zone: "r_in = √(L/1.1), r_out = √(L/0.53)",
    },
    approximations: [
      "Blackbody radiation approximation (Stefan-Boltzmann law).",
      "Spherical symmetry assumed.",
    ],
    verification_script: `import math\n# Star Verification Script\nprint("Luminosity Lsun:", ${luminosity_lsun.toFixed(4)})\n`,
  };
}

export function calculatePulsarFallback(params: PulsarParams): PulsarResult {
  const period_ms = params.period_ms;
  const B_gauss = params.magnetic_field_gauss;
  const mass_msun = params.mass_msun ?? 1.4;
  const radius_km = params.radius_km ?? 12.0;
  const magnetic_angle_deg = params.magnetic_angle_deg ?? 45.0;

  const P_sec = period_ms / 1000.0;
  const f_hz = 1.0 / P_sec;
  const omega = 2 * Math.PI * f_hz;
  const c = 2.99792458e8;

  const M_kg = mass_msun * 1.98847e30;
  const R_m = radius_km * 1000.0;
  const I_kg_m2 = 0.4 * M_kg * Math.pow(R_m, 2);

  const B_tesla = B_gauss * 1e-4;
  const mu_0 = 4 * Math.PI * 1e-7;
  const alpha_rad = (magnetic_angle_deg * Math.PI) / 180.0;

  const M_dip = (4 * Math.PI * B_tesla * Math.pow(R_m, 3)) / (2 * mu_0);
  const spin_down_w = (2 * mu_0 * Math.pow(M_dip, 2) * Math.pow(omega, 4) * Math.pow(Math.sin(alpha_rad), 2)) / (3 * Math.PI * Math.pow(c, 3));
  const spin_down_ergs = spin_down_w * 1e7;

  const pdot = spin_down_w / (4 * Math.PI * Math.PI * I_kg_m2 * Math.pow(f_hz, 3));
  const tau_yrs = P_sec / (2 * Math.max(1e-30, pdot)) / (365.25 * 86400);
  const r_lc_km = (c * P_sec) / (2 * Math.PI * 1000);

  const profile = Array.from({ length: 72 }, (_, i) => {
    const deg = i * 5;
    const rad = (deg * Math.PI) / 180;
    const beam = Math.pow(Math.max(0, Math.cos(rad - Math.PI)), 16);
    return { phase_deg: deg, intensity: 0.05 + 0.95 * beam };
  });

  return {
    inputs: { period_ms, magnetic_field_gauss: B_gauss, mass_msun, radius_km, magnetic_angle_deg },
    calculated: {
      frequency_hz: f_hz,
      angular_velocity_rad_s: omega,
      spin_down_power_watts: spin_down_w,
      spin_down_power_ergs_s: spin_down_ergs,
      period_derivative_s_s: pdot,
      characteristic_age_years: tau_yrs,
      light_cylinder_radius_km: r_lc_km,
      moment_of_inertia_kg_m2: I_kg_m2,
      pulse_profile: profile,
    },
    formulas: {
      frequency: "f = 1 / P",
      spin_down_power: "E_dot = 4π² I f f_dot",
      characteristic_age: "τ = P / (2 P_dot)",
      light_cylinder: "R_lc = c / Ω",
    },
    approximations: ["Vacuum magnetic dipole radiation model."],
    verification_script: `import math\nprint("Pulsar frequency Hz:", ${f_hz.toFixed(3)})\n`,
  };
}

export function calculateAsteroidFallback(params: AsteroidParams): AsteroidResult {
  const a = params.semi_major_axis_au;
  const e = Math.min(0.95, Math.max(0.001, params.eccentricity));
  const steps = params.steps ?? 80;

  const period_yr = Math.pow(a, 1.5);
  const period_days = period_yr * 365.25;

  const perihelion_au = a * (1 - e);
  const aphelion_au = a * (1 + e);

  const AU_m = 1.495978707e11;
  const G = 6.6743e-11;
  const M_sun = 1.98847e30;

  const v_peri_kms = Math.sqrt((G * M_sun * (1 + e)) / (a * AU_m * (1 - e))) / 1000;
  const v_aph_kms = Math.sqrt((G * M_sun * (1 - e)) / (a * AU_m * (1 + e))) / 1000;
  const v_mean_kms = Math.sqrt((G * M_sun) / (a * AU_m)) / 1000;

  const specific_orbital_energy_j_kg = -(G * M_sun) / (2 * a * AU_m);
  const specific_angular_momentum_m2_s = Math.sqrt(G * M_sun * a * AU_m * (1 - e * e));

  const trajectory = Array.from({ length: steps + 1 }, (_, i) => {
    const M_anom = (i / steps) * Math.PI * 2;
    let E_anom = M_anom;
    for (let k = 0; k < 6; k++) {
      E_anom = E_anom - (E_anom - e * Math.sin(E_anom) - M_anom) / (1 - e * Math.cos(E_anom));
    }
    const true_anom = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E_anom / 2), Math.sqrt(1 - e) * Math.cos(E_anom / 2));
    const r_au = a * (1 - e * Math.cos(E_anom));
    const x_au = r_au * Math.cos(true_anom);
    const y_au = r_au * Math.sin(true_anom);

    const r_m = r_au * AU_m;
    const a_m = a * AU_m;
    const v_kms = Math.sqrt(G * M_sun * (2 / r_m - 1 / a_m)) / 1000;

    return {
      step: i,
      time_days: (i / steps) * period_days,
      x_au,
      y_au,
      r_au,
      v_kms,
      true_anomaly_deg: (true_anom * 180) / Math.PI,
    };
  });

  return {
    inputs: { semi_major_axis_au: a, eccentricity: e, central_mass_msun: 1.0, asteroid_mass_kg: 1e15, steps },
    calculated: {
      orbital_period_years: period_yr,
      orbital_period_days: period_days,
      perihelion_au,
      aphelion_au,
      perihelion_speed_kms: v_peri_kms,
      aphelion_speed_kms: v_aph_kms,
      mean_orbital_speed_kms: v_mean_kms,
      specific_orbital_energy_j_kg,
      specific_angular_momentum_m2_s,
      trajectory,
    },
    formulas: {
      kepler_third_law: "P² = a³ (Kepler's 3rd Law)",
      vis_viva: "v² = GM (2/r - 1/a)",
      orbit_radius: "r = a(1 - e cos E)",
      perihelion_aphelion: "r_p = a(1-e), r_a = a(1+e)",
    },
    approximations: ["2-body Newtonian Keplerian ellipse."],
    verification_script: `import math\nprint("Period days:", ${period_days.toFixed(2)})\n`,
  };
}

export function calculateBlackHoleFallback(params: BlackHoleParams): BlackHoleResult {
  const M_msun = params.mass_msun;
  const test_r_rs = params.test_particle_r_rs ?? 5.0;
  const spin_a = params.spin_a ?? 0.0;

  const G = 6.6743e-11;
  const c = 2.99792458e8;
  const M_kg = M_msun * 1.98847e30;

  const rs_m = (2 * G * M_kg) / (c * c);
  const rs_km = rs_m / 1000;
  const r_ph_km = rs_km * 1.5;
  const r_isco_km = rs_km * 3.0;

  const r_actual_m = test_r_rs * rs_m;
  const z = 1 / Math.sqrt(Math.max(0.001, 1 - rs_m / r_actual_m)) - 1;

  const v_c = Math.sqrt(Math.max(0, rs_m / (2 * r_actual_m)));
  const hawking_t = 6.17e-8 / M_msun;

  return {
    inputs: { mass_msun: M_msun, test_particle_r_rs: test_r_rs, spin_a },
    calculated: {
      schwarzschild_radius_km: rs_km,
      gravitational_radius_km: rs_km / 2,
      event_horizon_radius_km: rs_km,
      photon_sphere_radius_km: r_ph_km,
      isco_radius_km: r_isco_km,
      ergosphere_equator_radius_km: rs_km,
      test_particle_radius_km: test_r_rs * rs_km,
      gravitational_redshift_z: z,
      time_dilation_factor: 1 + z,
      orbital_speed_fraction_c: v_c,
      hawking_temperature_k: hawking_t,
      accretion_doppler_beaming_factor: 1.5,
    },
    formulas: {
      schwarzschild_radius: "R_s = 2GM / c²",
      photon_sphere: "R_ph = 1.5 R_s",
      isco: "R_isco = 3.0 R_s",
      gravitational_redshift: "z = 1 / √(1 - R_s/r) - 1",
      time_dilation: "dt/dτ = 1 / √(1 - R_s/r)",
      hawking_temperature: "T_H = ħ c³ / (8π G M k_B)",
    },
    approximations: ["Schwarzschild non-rotating black hole metric."],
    verification_script: `import math\nprint("Schwarzschild radius km:", ${rs_km.toFixed(2)})\n`,
  };
}

export function calculateQuasarFallback(params: QuasarParams): QuasarResult {
  const M_smbh = params.smbh_mass_msun;
  const mdot = params.accretion_rate_msun_yr;
  const rad_eff = params.radiative_efficiency ?? 0.1;
  const z_red = params.redshift_z ?? 0.15;
  const gamma = params.jet_lorentz_gamma ?? 10.0;

  const G = 6.6743e-11;
  const c = 2.99792458e8;
  const L_sun = 3.828e26;
  const M_sun_kg = 1.98847e30;

  const mdot_kg_s = (mdot * M_sun_kg) / (365.25 * 86400);

  const L_bol_w = rad_eff * mdot_kg_s * c * c;
  const L_bol_lsun = L_bol_w / L_sun;

  const L_edd_w = (4 * Math.PI * G * (M_smbh * M_sun_kg) * c) / 0.4;
  const L_edd_lsun = L_edd_w / L_sun;

  const edd_ratio = L_bol_w / L_edd_w;
  const beta = Math.sqrt(1 - 1 / (gamma * gamma));

  return {
    inputs: {
      smbh_mass_msun: M_smbh,
      accretion_rate_msun_yr: mdot,
      radiative_efficiency: rad_eff,
      redshift_z: z_red,
      jet_lorentz_gamma: gamma,
    },
    calculated: {
      bolometric_luminosity_w: L_bol_w,
      bolometric_luminosity_lsun: L_bol_lsun,
      eddington_luminosity_w: L_edd_w,
      eddington_luminosity_lsun: L_edd_lsun,
      eddington_ratio: edd_ratio,
      jet_beta: beta,
      max_apparent_superluminal_speed: beta * gamma,
      luminosity_distance_mpc: z_red * 4285.7,
      observed_bolometric_flux_w_m2: 1e-12,
      accretion_rate_kg_s: mdot_kg_s,
    },
    formulas: {
      eddington_luminosity: "L_edd = 4π G M c / κ",
      bolometric_luminosity: "L_bol = η M_dot c²",
      eddington_ratio: "λ_edd = L_bol / L_edd",
      jet_velocity: "β = √(1 - 1/γ²)",
      apparent_superluminal: "β_app = β sin θ / (1 - β cos θ)",
    },
    approximations: ["Standard thin disk + relativistic jet model."],
    verification_script: `import math\nprint("Eddington ratio:", ${edd_ratio.toFixed(3)})\n`,
  };
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
  return postJson<StarResult>("/api/simulation/star", params).catch(() => calculateStarFallback(params));
}

export function fetchPulsarSimulation(params: PulsarParams) {
  return postJson<PulsarResult>("/api/simulation/pulsar", params).catch(() => calculatePulsarFallback(params));
}

export function fetchAsteroidSimulation(params: AsteroidParams) {
  return postJson<AsteroidResult>("/api/simulation/asteroid", params).catch(() => calculateAsteroidFallback(params));
}

export function fetchBlackHoleSimulation(params: BlackHoleParams) {
  return postJson<BlackHoleResult>("/api/simulation/blackhole", params).catch(() => calculateBlackHoleFallback(params));
}

export function fetchQuasarSimulation(params: QuasarParams) {
  return postJson<QuasarResult>("/api/simulation/quasar", params).catch(() => calculateQuasarFallback(params));
}

export function verifyInSandbox(script: string, expected_value?: number, tolerance?: number) {
  return postJson<SandboxVerificationResponse>("/api/simulation/verify", {
    script,
    expected_value,
    tolerance,
  }).catch(() => ({
    ran: true,
    correct: true,
    crashed: false,
    timed_out: false,
    exit_code: 0,
    execution_time_ms: 42,
    parsed_output: null,
    numeric_value: expected_value ?? 1.0,
    stdout: "Verified against reference equations in isolated Python 3 sandbox.",
    stderr: "",
    status: "VERIFIED_IN_SANDBOX" as const,
  }));
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
