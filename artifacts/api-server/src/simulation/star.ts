import { C, G, L_SUN, M_SUN, R_SUN, SIGMA, T_SUN } from "./constants";

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

function temperatureToRgb(kelvin: number): string {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let red: number;
  let green: number;
  let blue: number;

  if (temp <= 66) {
    red = 255;
    green = Math.max(0, Math.min(255, 99.4708025861 * Math.log(temp) - 161.1195681661));
    blue = temp <= 19 ? 0 : Math.max(0, Math.min(255, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  } else {
    red = Math.max(0, Math.min(255, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    green = Math.max(0, Math.min(255, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    blue = 255;
  }

  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function determineSpectralType(temp: number): string {
  if (temp >= 30000) {
    const sub = Math.min(9, Math.max(0, Math.floor((60000 - temp) / 3000)));
    return `O${sub}V`;
  }
  if (temp >= 10000) {
    const sub = Math.min(9, Math.max(0, Math.floor((30000 - temp) / 2000)));
    return `B${sub}V`;
  }
  if (temp >= 7500) {
    const sub = Math.min(9, Math.max(0, Math.floor((10000 - temp) / 250)));
    return `A${sub}V`;
  }
  if (temp >= 6000) {
    const sub = Math.min(9, Math.max(0, Math.floor((7500 - temp) / 150)));
    return `F${sub}V`;
  }
  if (temp >= 5200) {
    const sub = Math.min(9, Math.max(0, Math.floor((6000 - temp) / 80)));
    return `G${sub}V`;
  }
  if (temp >= 3700) {
    const sub = Math.min(9, Math.max(0, Math.floor((5200 - temp) / 150)));
    return `K${sub}V`;
  }
  const sub = Math.min(9, Math.max(0, Math.floor((3700 - temp) / 130)));
  return `M${sub}V`;
}

export function simulateStar(params: StarParams): StarResult {
  const { mass_msun, radius_rsun, temperature_k } = params;

  if (typeof mass_msun !== "number" || !Number.isFinite(mass_msun) || mass_msun <= 0 || mass_msun > 500) {
    throw new Error("Star mass must be a finite positive number between 0.01 and 500 M_sun.");
  }
  if (typeof radius_rsun !== "number" || !Number.isFinite(radius_rsun) || radius_rsun <= 0 || radius_rsun > 5000) {
    throw new Error("Star radius must be a finite positive number between 0.01 and 5000 R_sun.");
  }
  if (typeof temperature_k !== "number" || !Number.isFinite(temperature_k) || temperature_k < 500 || temperature_k > 200000) {
    throw new Error("Effective temperature must be a finite positive number between 500 K and 200,000 K.");
  }

  const mKg = mass_msun * M_SUN;
  const rM = radius_rsun * R_SUN;

  // Stefan-Boltzmann Law: L = 4 * pi * R^2 * sigma * T^4
  const surfaceAreaM2 = 4 * Math.PI * rM * rM;
  const luminosityW = surfaceAreaM2 * SIGMA * Math.pow(temperature_k, 4);
  const luminosityLsun = Math.pow(radius_rsun, 2) * Math.pow(temperature_k / T_SUN, 4);

  // Surface gravity: g = G * M / R^2
  const surfaceGravityMs2 = (G * mKg) / (rM * rM);
  // cgs conversion: 1 m/s^2 = 100 cm/s^2
  const logGCgs = Math.log10(surfaceGravityMs2 * 100);

  // Escape velocity: v_esc = sqrt(2 * G * M / R)
  const escapeVelocityMs = Math.sqrt((2 * G * mKg) / rM);
  const escapeVelocityKms = escapeVelocityMs / 1000;

  // Habitable zone boundaries (Kasting et al. / Kopparapu et al. simplified)
  const hzInnerAu = Math.sqrt(luminosityLsun / 1.1);
  const hzOuterAu = Math.sqrt(luminosityLsun / 0.53);

  // Estimated main-sequence lifetime: tau ~ 10 * (M/M_sun)^-2.5 Gyr
  const msLifetimeGyr = mass_msun <= 50 ? 10 * Math.pow(mass_msun, -2.5) : null;

  const spectralType = determineSpectralType(temperature_k);
  const colorHex = temperatureToRgb(temperature_k);

  const verificationScript = `import json, math
G = ${G}
M_SUN = ${M_SUN}
R_SUN = ${R_SUN}
T_SUN = ${T_SUN}
SIGMA = ${SIGMA}

mass_msun = ${mass_msun}
radius_rsun = ${radius_rsun}
temperature_k = ${temperature_k}

m_kg = mass_msun * M_SUN
r_m = radius_rsun * R_SUN

# Stefan-Boltzmann Luminosity
surface_area = 4 * math.pi * (r_m ** 2)
lum_w = surface_area * SIGMA * (temperature_k ** 4)
lum_lsun = (radius_rsun ** 2) * ((temperature_k / T_SUN) ** 4)

# Surface gravity & escape velocity
g = G * m_kg / (r_m ** 2)
v_esc = math.sqrt(2 * G * m_kg / r_m)

print(json.dumps({
    "value": lum_lsun,
    "luminosity_w": lum_w,
    "surface_gravity_ms2": g,
    "escape_velocity_kms": v_esc / 1000.0
}))
`;

  return {
    inputs: { mass_msun, radius_rsun, temperature_k },
    calculated: {
      luminosity_w: luminosityW,
      luminosity_lsun: luminosityLsun,
      surface_gravity_ms2: surfaceGravityMs2,
      log_g_cgs: logGCgs,
      escape_velocity_kms: escapeVelocityKms,
      spectral_type: spectralType,
      color_hex: colorHex,
      habitable_zone_inner_au: hzInnerAu,
      habitable_zone_outer_au: hzOuterAu,
      main_sequence_lifetime_gyr: msLifetimeGyr,
    },
    formulas: {
      luminosity: "L = 4π R² σ T⁴  |  L/L_sun = (R/R_sun)² (T/T_sun)⁴",
      surface_gravity: "g = GM / R²  |  log(g) in [cgs]",
      escape_velocity: "v_esc = √(2GM / R)",
      habitable_zone: "r_in = √(L / 1.1) AU,  r_out = √(L / 0.53) AU",
    },
    approximations: [
      "Spherical, non-rotating stellar geometry without oblateness.",
      "Pure blackbody Planckian continuum approximation for color index.",
      "Standard main sequence lifetime scaling law tau ~ 10 * (M/M_sun)^-2.5 Gyr.",
    ],
    verification_script: verificationScript,
  };
}
