import { C, G, L_SUN, M_P, M_SUN, MPC, SIGMA_T, YEAR_SECONDS } from "./constants";

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

function computeLuminosityDistanceMpc(z: number): number {
  // Flat Lambda-CDM: H0 = 70 km/s/Mpc, Omega_M = 0.3, Omega_Lambda = 0.7
  const H0 = 70.0; // km/s/Mpc
  const cKmS = C / 1000;
  const omegaM = 0.3;
  const omegaLambda = 0.7;

  // Trapezoidal numerical integration of \int_0^z dz' / E(z')
  const steps = 100;
  const dz = z / steps;
  let integral = 0;

  for (let i = 0; i <= steps; i++) {
    const zi = i * dz;
    const Ez = Math.sqrt(omegaM * Math.pow(1 + zi, 3) + omegaLambda);
    const weight = i === 0 || i === steps ? 0.5 : 1.0;
    integral += (weight / Ez) * dz;
  }

  // Comoving distance d_C = (c / H0) * integral
  const dC = (cKmS / H0) * integral;
  // Luminosity distance d_L = (1 + z) * d_C
  return (1 + z) * dC;
}

export function simulateQuasar(params: QuasarParams): QuasarResult {
  const smbh_mass_msun = params.smbh_mass_msun;
  const accretion_rate_msun_yr = params.accretion_rate_msun_yr;
  const radiative_efficiency = Math.max(0.01, Math.min(0.42, params.radiative_efficiency ?? 0.10));
  const redshift_z = Math.max(0.001, Math.min(20.0, params.redshift_z ?? 0.5));
  const jet_lorentz_gamma = Math.max(1.1, Math.min(50.0, params.jet_lorentz_gamma ?? 10.0));

  if (typeof smbh_mass_msun !== "number" || !Number.isFinite(smbh_mass_msun) || smbh_mass_msun < 1e4 || smbh_mass_msun > 1e12) {
    throw new Error("Supermassive black hole mass must be a finite positive number between 1e4 and 1e12 M_sun.");
  }
  if (typeof accretion_rate_msun_yr !== "number" || !Number.isFinite(accretion_rate_msun_yr) || accretion_rate_msun_yr <= 0 || accretion_rate_msun_yr > 1e4) {
    throw new Error("Accretion rate must be a finite positive number between 1e-6 and 1e4 M_sun/year.");
  }

  const massKg = smbh_mass_msun * M_SUN;

  // Eddington Luminosity: L_Edd = 4 * pi * G * M * m_p * c / sigma_T
  const lEddW = (4 * Math.PI * G * massKg * M_P * C) / SIGMA_T;
  const lEddLsun = lEddW / L_SUN;

  // Mass accretion rate in kg/s
  const mDotKgS = (accretion_rate_msun_yr * M_SUN) / YEAR_SECONDS;

  // Bolometric luminosity: L_bol = eta * dM/dt * c^2
  const lBolW = radiative_efficiency * mDotKgS * C * C;
  const lBolLsun = lBolW / L_SUN;

  // Eddington ratio: lambda_Edd = L_bol / L_Edd
  const eddingtonRatio = lBolW / lEddW;

  // Relativistic jet speed: beta = sqrt(1 - 1 / gamma^2)
  const jetBeta = Math.sqrt(1 - 1 / (jet_lorentz_gamma * jet_lorentz_gamma));

  // Maximum apparent superluminal velocity: beta_app_max = beta * gamma
  const maxApparentBeta = jetBeta * jet_lorentz_gamma;

  // Cosmological luminosity distance
  const dLMpc = computeLuminosityDistanceMpc(redshift_z);
  const dLMeters = dLMpc * MPC;

  // Observed bolometric flux at Earth: F = L_bol / (4 * pi * d_L^2)
  const bolometricFlux = lBolW / (4 * Math.PI * dLMeters * dLMeters);

  const verificationScript = `import json, math
G = ${G}
C = ${C}
M_P = ${M_P}
SIGMA_T = ${SIGMA_T}
M_SUN = ${M_SUN}
YEAR_SECONDS = ${YEAR_SECONDS}

mass_msun = ${smbh_mass_msun}
m_dot_msun_yr = ${accretion_rate_msun_yr}
eta = ${radiative_efficiency}

mass_kg = mass_msun * M_SUN
m_dot_kg_s = (m_dot_msun_yr * M_SUN) / YEAR_SECONDS

# Eddington & Bolometric Luminosity
l_edd = (4.0 * math.pi * G * mass_kg * M_P * C) / SIGMA_T
l_bol = eta * m_dot_kg_s * (C ** 2)
eddington_ratio = l_bol / l_edd

print(json.dumps({
    "value": eddington_ratio,
    "eddington_luminosity_w": l_edd,
    "bolometric_luminosity_w": l_bol,
    "eddington_ratio": eddington_ratio
}))
`;

  return {
    inputs: {
      smbh_mass_msun,
      accretion_rate_msun_yr,
      radiative_efficiency,
      redshift_z,
      jet_lorentz_gamma,
    },
    calculated: {
      eddington_luminosity_w: lEddW,
      eddington_luminosity_lsun: lEddLsun,
      bolometric_luminosity_w: lBolW,
      bolometric_luminosity_lsun: lBolLsun,
      eddington_ratio: eddingtonRatio,
      jet_beta: jetBeta,
      max_apparent_superluminal_speed: maxApparentBeta,
      luminosity_distance_mpc: dLMpc,
      observed_bolometric_flux_w_m2: bolometricFlux,
      accretion_rate_kg_s: mDotKgS,
    },
    formulas: {
      eddington_luminosity: "L_Edd = 4π G M m_p c / σ_T",
      bolometric_luminosity: "L_bol = η Ṁ c²",
      eddington_ratio: "λ_Edd = L_bol / L_Edd",
      jet_velocity: "β = √(1 - 1/γ²)",
      apparent_superluminal: "β_app,max = β γ",
    },
    approximations: [
      "Standard geometrically-thin, optically-thick Shakura-Sunyaev / Novikov-Thorne accretion disk model.",
      "Bipolar relativistic jet modeled via Blandford-Znajek / Blandford-Payne magnetohydrodynamic outflow.",
      "Flat ΛCDM cosmological model (H₀ = 70 km/s/Mpc, Ω_m = 0.3, Ω_Λ = 0.7).",
    ],
    verification_script: verificationScript,
  };
}
