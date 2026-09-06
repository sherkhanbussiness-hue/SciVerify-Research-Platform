import { C, M_SUN, YEAR_SECONDS } from "./constants";

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

export function simulatePulsar(params: PulsarParams): PulsarResult {
  const period_ms = params.period_ms;
  const magnetic_field_gauss = params.magnetic_field_gauss;
  const mass_msun = params.mass_msun ?? 1.4;
  const radius_km = params.radius_km ?? 12.0;
  const magnetic_angle_deg = params.magnetic_angle_deg ?? 45.0;

  if (typeof period_ms !== "number" || !Number.isFinite(period_ms) || period_ms < 0.1 || period_ms > 100_000) {
    throw new Error("Pulsar period must be a finite number between 0.1 and 100,000 ms.");
  }
  if (typeof magnetic_field_gauss !== "number" || !Number.isFinite(magnetic_field_gauss) || magnetic_field_gauss < 1e6 || magnetic_field_gauss > 1e16) {
    throw new Error("Surface magnetic field must be a finite number between 1e6 and 1e16 Gauss.");
  }
  if (typeof mass_msun !== "number" || !Number.isFinite(mass_msun) || mass_msun < 0.5 || mass_msun > 3.5) {
    throw new Error("Neutron star mass must be a finite number between 0.5 and 3.5 M_sun.");
  }
  if (typeof radius_km !== "number" || !Number.isFinite(radius_km) || radius_km < 5.0 || radius_km > 30.0) {
    throw new Error("Neutron star radius must be a finite number between 5.0 and 30.0 km.");
  }
  if (typeof magnetic_angle_deg !== "number" || !Number.isFinite(magnetic_angle_deg) || magnetic_angle_deg < 0 || magnetic_angle_deg > 90) {
    throw new Error("Magnetic inclination angle must be a finite number between 0 and 90 degrees.");
  }

  const periodSec = period_ms / 1000;
  const freqHz = 1.0 / periodSec;
  const omega = 2 * Math.PI * freqHz;

  const massKg = mass_msun * M_SUN;
  const radiusM = radius_km * 1000;
  const alphaRad = (magnetic_angle_deg * Math.PI) / 180;

  // Moment of inertia for standard uniform density sphere approximation (I ~ 0.4 M R^2)
  const momentOfInertia = 0.4 * massKg * radiusM * radiusM;

  // Magnetic field in Tesla (1 Tesla = 10^4 Gauss)
  const bTesla = magnetic_field_gauss * 1e-4;

  // Magnetic dipole radiation formula (SI):
  // \dot{E} = (mu_0 / (6 * pi * c^3)) * m^2 * omega^4
  // With magnetic dipole moment m = (4 * pi / mu_0) * B * R^3 => \dot{E} = (8 * pi * B^2 * R^6 * omega^4 * sin^2(alpha)) / (6 * mu_0 * c^3)
  // In vacuum: mu_0 = 4*pi*1e-7 => \dot{E} = (2 / (3 * mu_0 * c^3)) * (4*pi * B * R^3)^2 / (4*pi)...
  // Standard compact form: \dot{E} = (2 * B^2 * R^6 * omega^4 * sin^2(alpha)) / (3 * mu_0 * c^3)
  const mu0 = 4 * Math.PI * 1e-7;
  const sinAlpha = Math.sin(alphaRad);
  const sin2Alpha = Math.max(0.05, sinAlpha * sinAlpha); // Avoid exact 0 for realistic oblique rotator

  const spinDownPowerWatts = (2 * Math.pow(bTesla, 2) * Math.pow(radiusM, 6) * Math.pow(omega, 4) * sin2Alpha) /
    (3 * mu0 * Math.pow(C, 3));
  const spinDownPowerErgsS = spinDownPowerWatts * 1e7;

  // Period derivative: \dot{P} = 4 * pi^2 * B^2 * R^6 * sin^2(alpha) / (3 * I * mu0 * c^3 * P)
  // Using \dot{E} = I * omega * \dot{omega} = I * (4*pi^2/P) * (\dot{P}/P^2) = 4*pi^2 * I * \dot{P} / P^3
  // => \dot{P} = \dot{E} * P^3 / (4 * pi^2 * I)
  const periodDerivative = (spinDownPowerWatts * Math.pow(periodSec, 3)) / (4 * Math.PI * Math.PI * momentOfInertia);

  // Characteristic spin-down age: tau = P / (2 * \dot{P})
  const characteristicAgeSec = periodSec / (2 * Math.max(1e-30, periodDerivative));
  const characteristicAgeYears = characteristicAgeSec / YEAR_SECONDS;

  // Light cylinder radius: R_LC = c / omega
  const rLckm = (C / omega) / 1000;

  // Synthetic pulse profile (intensity as a function of rotation phase 0 to 360 deg)
  const pulseProfile: Array<{ phase_deg: number; intensity: number }> = [];
  const beamWidthDeg = 20.0;
  for (let phase = 0; phase <= 360; phase += 5) {
    const deltaPhase = Math.abs(phase - 180);
    const beamGaussian = Math.exp(-0.5 * Math.pow(deltaPhase / beamWidthDeg, 2));
    const noise = 0.03 * Math.sin(phase * 0.1);
    const intensity = Math.max(0, Math.min(1, beamGaussian + noise + 0.05));
    pulseProfile.push({ phase_deg: phase, intensity });
  }

  const verificationScript = `import json, math
C = ${C}
M_SUN = ${M_SUN}
period_ms = ${period_ms}
b_gauss = ${magnetic_field_gauss}
mass_msun = ${mass_msun}
radius_km = ${radius_km}

period_s = period_ms / 1000.0
freq_hz = 1.0 / period_s
omega = 2.0 * math.pi * freq_hz
r_lc_km = (C / omega) / 1000.0

print(json.dumps({
    "value": freq_hz,
    "frequency_hz": freq_hz,
    "angular_velocity_rad_s": omega,
    "light_cylinder_radius_km": r_lc_km
}))
`;

  return {
    inputs: {
      period_ms,
      magnetic_field_gauss,
      mass_msun,
      radius_km,
      magnetic_angle_deg,
    },
    calculated: {
      frequency_hz: freqHz,
      angular_velocity_rad_s: omega,
      spin_down_power_watts: spinDownPowerWatts,
      spin_down_power_ergs_s: spinDownPowerErgsS,
      period_derivative_s_s: periodDerivative,
      characteristic_age_years: characteristicAgeYears,
      light_cylinder_radius_km: rLckm,
      moment_of_inertia_kg_m2: momentOfInertia,
      pulse_profile: pulseProfile,
    },
    formulas: {
      frequency: "f = 1 / P  |  ω = 2π f",
      spin_down_power: "Ė = (2 B² R⁶ ω⁴ sin²α) / (3 μ₀ c³)",
      characteristic_age: "τ = P / (2 Ṗ) [years]",
      light_cylinder: "R_LC = c / ω",
    },
    approximations: [
      "Magnetic dipole in vacuum (Pacini / Ostriker-Gunn model).",
      "Rigid uniform sphere neutron star moment of inertia I = 0.4 M R².",
      "Gaussian relativistic beam geometry at observer inclination alignment.",
    ],
    verification_script: verificationScript,
  };
}
