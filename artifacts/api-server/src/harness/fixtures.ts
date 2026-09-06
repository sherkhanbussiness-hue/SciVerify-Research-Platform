import { SUBDOMAIN, type Fixture } from "./types";

/**
 * Subdomain choice: physics_sim (not nasa_noaa_dataset).
 *
 * Reference answers are computed from pinned constants and standard equations:
 * - CODATA 2018 G = 6.67430e-11 m^3 kg^-1 s^-2
 * - Earth mass 5.972e24 kg (pinned in input_data)
 * - Mean Earth radius 6.371e6 m
 * - Standard gravity g = 9.80665 m/s^2 (CGPM)
 *
 * Regenerated with CPython 3 (see verify-harness) so the stored numbers
 * match an independent evaluation of the same formulas.
 */
const G = 6.6743e-11;
const M_EARTH = 5.972e24;
const R_EARTH = 6.371e6;
const G_STD = 9.80665;

export const FIXTURES: Fixture[] = [
  {
    id: "fx-01",
    subdomain: SUBDOMAIN,
    title: "LEO circular orbital period",
    description:
      "Compute the period of a circular Earth orbit from Newtonian gravity.",
    difficulty: "Intermediate",
    runtime: "5–15 sec",
    dataset: "Pinned Newtonian constants (CODATA G, mean Earth radius)",
    inputs: [
      "G = 6.67430e-11 m^3 kg^-1 s^-2",
      "M_earth = 5.972e24 kg",
      "R_earth = 6.371e6 m",
      "altitude = 400 km",
    ],
    outputs: ["Orbital period in seconds as JSON {\"value\": <number>}"],
    method:
      "Circular two-body period T = 2π √(r³ / GM) with r = R_earth + altitude.",
    criteria: [
      "Use the pinned constants in input_data",
      "Assume a circular orbit",
      "Print only a final JSON object with key value",
      "Period compared with absolute tolerance 1 s",
    ],
    prompt: `Write a Python 3 script that computes the orbital period of a satellite in a circular Earth orbit.

Use these exact constants (do not substitute other values):
G = 6.67430e-11
M_earth = 5.972e24
R_earth = 6.371e6
altitude_m = 400000

The orbital radius is r = R_earth + altitude_m.
The period of a circular orbit is T = 2 * pi * sqrt(r**3 / (G * M_earth)).

Print a single JSON object on the last line: {"value": <period_in_seconds>}
Do not print anything after that JSON object. Do not read files or use the network.`,
    input_data: {
      G,
      M_earth: M_EARTH,
      R_earth: R_EARTH,
      altitude_m: 400000,
    },
    // Independent evaluation of T = 2π √(r³/GM) with the pinned constants.
    reference_answer: 5544.933316730677,
    tolerance: { type: "absolute", value: 1 },
    stub_code: `import json, math
G = 6.67430e-11
M_earth = 5.972e24
R_earth = 6.371e6
altitude_m = 400000
r = R_earth + altitude_m
T = 2 * math.pi * math.sqrt(r**3 / (G * M_earth))
print(json.dumps({"value": T}))
`,
  },
  {
    id: "fx-02",
    subdomain: SUBDOMAIN,
    title: "Gravitational force at 400 km",
    description:
      "Evaluate Newton's inverse-square law for a 1000 kg mass at LEO altitude.",
    difficulty: "Beginner",
    runtime: "3–8 sec",
    dataset: "Pinned Newtonian constants (CODATA G, mean Earth radius)",
    inputs: [
      "G = 6.67430e-11",
      "M_earth = 5.972e24 kg",
      "m = 1000 kg",
      "R_earth = 6.371e6 m",
      "altitude = 400 km",
    ],
    outputs: ["Force in newtons as JSON {\"value\": <number>}"],
    method: "F = G M m / r² with r = R_earth + altitude.",
    criteria: [
      "Use SI units",
      "Use r = R_earth + altitude, not altitude alone",
      "Print JSON {\"value\": force_newtons}",
      "Compared with absolute tolerance 1 N",
    ],
    prompt: `Write a Python 3 script that computes the Newtonian gravitational force between Earth and a satellite.

Use these exact constants:
G = 6.67430e-11
M_earth = 5.972e24
m_satellite = 1000
R_earth = 6.371e6
altitude_m = 400000

r = R_earth + altitude_m
F = G * M_earth * m_satellite / r**2

Print a single JSON object on the last line: {"value": <force_in_newtons>}
Do not print anything after that JSON object. Do not read files or use the network.`,
    input_data: {
      G,
      M_earth: M_EARTH,
      m_satellite: 1000,
      R_earth: R_EARTH,
      altitude_m: 400000,
    },
    reference_answer: 8694.005190064809,
    tolerance: { type: "absolute", value: 1 },
    stub_code: `import json
G = 6.67430e-11
M_earth = 5.972e24
m_satellite = 1000
R_earth = 6.371e6
altitude_m = 400000
r = R_earth + altitude_m
F = G * M_earth * m_satellite / r**2
print(json.dumps({"value": F}))
`,
  },
  {
    id: "fx-03",
    subdomain: SUBDOMAIN,
    title: "Earth surface escape velocity",
    description:
      "Compute escape speed from Earth's surface using the pinned GM and radius.",
    difficulty: "Beginner",
    runtime: "3–8 sec",
    dataset: "Pinned Newtonian constants (CODATA G, mean Earth radius)",
    inputs: [
      "G = 6.67430e-11",
      "M_earth = 5.972e24 kg",
      "R_earth = 6.371e6 m",
    ],
    outputs: ["Escape speed in m/s as JSON {\"value\": <number>}"],
    method: "v_esc = √(2GM / R) at the surface.",
    criteria: [
      "Evaluate at R_earth, not at an altitude",
      "SI units (m/s)",
      "Print JSON {\"value\": v_esc}",
      "Compared with absolute tolerance 1 m/s",
    ],
    prompt: `Write a Python 3 script that computes the escape velocity from the surface of Earth.

Use these exact constants:
G = 6.67430e-11
M_earth = 5.972e24
R_earth = 6.371e6

v_esc = sqrt(2 * G * M_earth / R_earth)

Print a single JSON object on the last line: {"value": <escape_speed_m_per_s>}
Do not print anything after that JSON object. Do not read files or use the network.`,
    input_data: {
      G,
      M_earth: M_EARTH,
      R_earth: R_EARTH,
    },
    reference_answer: 11185.97789184991,
    tolerance: { type: "absolute", value: 1 },
    stub_code: `import json, math
G = 6.67430e-11
M_earth = 5.972e24
R_earth = 6.371e6
v_esc = math.sqrt(2 * G * M_earth / R_earth)
print(json.dumps({"value": v_esc}))
`,
  },
  {
    id: "fx-04",
    subdomain: SUBDOMAIN,
    title: "Simple pendulum period",
    description:
      "Compute the small-angle period of a simple pendulum with standard gravity.",
    difficulty: "Beginner",
    runtime: "3–8 sec",
    dataset: "Standard gravity g = 9.80665 m/s² (CGPM)",
    inputs: ["L = 1.5 m", "g = 9.80665 m/s²", "small-angle approximation"],
    outputs: ["Period in seconds as JSON {\"value\": <number>}"],
    method: "T = 2π √(L / g) for a simple pendulum (small angle).",
    criteria: [
      "Use g = 9.80665 exactly",
      "Small-angle formula only",
      "Print JSON {\"value\": period_seconds}",
      "Compared with absolute tolerance 0.001 s",
    ],
    prompt: `Write a Python 3 script that computes the small-angle period of a simple pendulum.

Use these exact values:
L = 1.5
g = 9.80665

T = 2 * pi * sqrt(L / g)

Print a single JSON object on the last line: {"value": <period_in_seconds>}
Do not print anything after that JSON object. Do not read files or use the network.`,
    input_data: {
      L: 1.5,
      g: G_STD,
    },
    reference_answer: 2.4573394910108535,
    tolerance: { type: "absolute", value: 0.001 },
    stub_code: `import json, math
L = 1.5
g = 9.80665
T = 2 * math.pi * math.sqrt(L / g)
print(json.dumps({"value": T}))
`,
  },
  {
    id: "fx-05",
    subdomain: SUBDOMAIN,
    title: "Vacuum projectile range",
    description:
      "Compute the flat-ground vacuum range of a projectile at 45 degrees.",
    difficulty: "Beginner",
    runtime: "3–8 sec",
    dataset: "Standard gravity g = 9.80665 m/s² (CGPM)",
    inputs: [
      "v0 = 50 m/s",
      "theta = 45 degrees",
      "g = 9.80665 m/s²",
      "flat ground, no drag",
    ],
    outputs: ["Range in meters as JSON {\"value\": <number>}"],
    method: "R = v0² sin(2θ) / g with θ in radians.",
    criteria: [
      "Convert 45 degrees to radians",
      "Use g = 9.80665",
      "Print JSON {\"value\": range_meters}",
      "Compared with absolute tolerance 0.05 m",
    ],
    prompt: `Write a Python 3 script that computes the vacuum range of a projectile on flat ground.

Use these exact values:
v0 = 50
theta_degrees = 45
g = 9.80665

theta = theta_degrees * pi / 180
R = (v0 ** 2) * sin(2 * theta) / g

Print a single JSON object on the last line: {"value": <range_in_meters>}
Do not print anything after that JSON object. Do not read files or use the network.`,
    input_data: {
      v0: 50,
      theta_degrees: 45,
      g: G_STD,
    },
    reference_answer: 254.92905324448208,
    tolerance: { type: "absolute", value: 0.05 },
    stub_code: `import json, math
v0 = 50
theta_degrees = 45
g = 9.80665
theta = theta_degrees * math.pi / 180
R = (v0 ** 2) * math.sin(2 * theta) / g
print(json.dumps({"value": R}))
`,
  },
];

export function getFixture(id: string): Fixture | undefined {
  return FIXTURES.find((fixture) => fixture.id === id);
}

export function listFixtures(): Fixture[] {
  return FIXTURES;
}
