import { AU, G, M_SUN, YEAR_SECONDS } from "./constants";

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

export function simulateAsteroid(params: AsteroidParams): AsteroidResult {
  const semi_major_axis_au = params.semi_major_axis_au;
  const eccentricity = params.eccentricity;
  const central_mass_msun = params.central_mass_msun ?? 1.0;
  const asteroid_mass_kg = params.asteroid_mass_kg ?? 1e15;
  const steps = Math.max(36, Math.min(360, params.steps ?? 180));

  if (typeof semi_major_axis_au !== "number" || !Number.isFinite(semi_major_axis_au) || semi_major_axis_au <= 0 || semi_major_axis_au > 10000) {
    throw new Error("Semi-major axis must be a finite positive number between 0.01 and 10,000 AU.");
  }
  if (typeof eccentricity !== "number" || !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 0.999) {
    throw new Error("Eccentricity for bound orbit must be a finite number in range [0, 0.999).");
  }
  if (typeof central_mass_msun !== "number" || !Number.isFinite(central_mass_msun) || central_mass_msun <= 0 || central_mass_msun > 1000) {
    throw new Error("Central body mass must be a finite positive number between 0.01 and 1000 M_sun.");
  }

  const centralMassKg = central_mass_msun * M_SUN;
  const semiMajorMeters = semi_major_axis_au * AU;

  // Perihelion and Aphelion
  const perihelionAu = semi_major_axis_au * (1 - eccentricity);
  const aphelionAu = semi_major_axis_au * (1 + eccentricity);

  // Kepler's Third Law: T = 2 * pi * sqrt(a^3 / (G * M))
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorMeters, 3) / (G * centralMassKg));
  const periodDays = periodSeconds / 86400;
  const periodYears = periodSeconds / YEAR_SECONDS;

  // Vis-Viva equation: v = sqrt(GM * (2/r - 1/a))
  const perihelionMeters = perihelionAu * AU;
  const aphelionMeters = aphelionAu * AU;
  const vPerihelionMs = Math.sqrt(G * centralMassKg * (2 / perihelionMeters - 1 / semiMajorMeters));
  const vAphelionMs = Math.sqrt(G * centralMassKg * (2 / aphelionMeters - 1 / semiMajorMeters));
  const meanSpeedKms = (2 * Math.PI * semiMajorMeters / periodSeconds) / 1000;

  // Specific energy: epsilon = -GM / (2a)
  const specificEnergy = -(G * centralMassKg) / (2 * semiMajorMeters);

  // Specific angular momentum: h = sqrt(GM * a * (1 - e^2))
  const specificAngularMomentum = Math.sqrt(G * centralMassKg * semiMajorMeters * (1 - eccentricity * eccentricity));

  // Trajectory discretisation via True Anomaly θ from 0 to 2π
  const trajectory: TrajectoryPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const thetaRad = fraction * 2 * Math.PI;

    // Radius from polar orbit equation: r = a(1 - e^2) / (1 + e * cos(theta))
    const rAu = (semi_major_axis_au * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(thetaRad));
    const rM = rAu * AU;

    // Cartesian coordinates
    const xAu = rAu * Math.cos(thetaRad);
    const yAu = rAu * Math.sin(thetaRad);

    // Speed from Vis-Viva equation
    const vMs = Math.sqrt(Math.max(0, G * centralMassKg * (2 / rM - 1 / semiMajorMeters)));

    // Time corresponding to true anomaly via eccentric anomaly E:
    // tan(E/2) = sqrt((1-e)/(1+e)) * tan(theta/2)
    const tanThetaHalf = Math.tan(thetaRad / 2);
    const E = 2 * Math.atan2(Math.sqrt(1 - eccentricity) * tanThetaHalf, Math.sqrt(1 + eccentricity));
    // Normalize E to [0, 2pi]
    const Enorm = (E + 2 * Math.PI) % (2 * Math.PI);
    // Kepler equation: M = E - e * sin(E)
    const M = Enorm - eccentricity * Math.sin(Enorm);
    const timeDays = (M / (2 * Math.PI)) * periodDays;

    trajectory.push({
      step: i,
      time_days: timeDays,
      true_anomaly_deg: (thetaRad * 180) / Math.PI,
      x_au: xAu,
      y_au: yAu,
      r_au: rAu,
      v_kms: vMs / 1000,
    });
  }

  const verificationScript = `import json, math
G = ${G}
M_SUN = ${M_SUN}
AU = ${AU}

a_au = ${semi_major_axis_au}
e = ${eccentricity}
m_msun = ${central_mass_msun}

a_m = a_au * AU
m_kg = m_msun * M_SUN

# Kepler's Third Law
period_s = 2 * math.pi * math.sqrt((a_m ** 3) / (G * m_kg))
period_days = period_s / 86400.0

# Perihelion and Aphelion speeds via Vis-Viva
r_peri_m = a_au * (1 - e) * AU
r_aph_m = a_au * (1 + e) * AU

v_peri = math.sqrt(G * m_kg * (2.0 / r_peri_m - 1.0 / a_m))
v_aph = math.sqrt(G * m_kg * (2.0 / r_aph_m - 1.0 / a_m))

print(json.dumps({
    "value": period_days,
    "period_days": period_days,
    "v_perihelion_kms": v_peri / 1000.0,
    "v_aphelion_kms": v_aph / 1000.0
}))
`;

  return {
    inputs: {
      semi_major_axis_au,
      eccentricity,
      central_mass_msun,
      asteroid_mass_kg,
      steps,
    },
    calculated: {
      perihelion_au: perihelionAu,
      aphelion_au: aphelionAu,
      orbital_period_years: periodYears,
      orbital_period_days: periodDays,
      perihelion_speed_kms: vPerihelionMs / 1000,
      aphelion_speed_kms: vAphelionMs / 1000,
      mean_orbital_speed_kms: meanSpeedKms,
      specific_orbital_energy_j_kg: specificEnergy,
      specific_angular_momentum_m2_s: specificAngularMomentum,
      trajectory,
    },
    formulas: {
      kepler_third_law: "T = 2π √(a³ / GM)",
      vis_viva: "v = √[GM (2/r - 1/a)]",
      orbit_radius: "r(θ) = a(1 - e²) / (1 + e cos θ)",
      perihelion_aphelion: "r_p = a(1 - e),  r_a = a(1 + e)",
    },
    approximations: [
      "Unperturbed 2-body Newtonian Keplerian gravitational field.",
      "Asteroid test-mass approximation (m_asteroid << M_central).",
      "Planar coplanar orbit (inclination i = 0).",
    ],
    verification_script: verificationScript,
  };
}
