/**
 * Static formula reference database for physics_sim fixtures.
 *
 * Each entry carries:
 *  - id:          unique key
 *  - tags:        lowercase keywords used for retrieval
 *  - title:       human-readable name
 *  - formula:     the equation in concise notation
 *  - variables:   definitions of each symbol
 *  - note:        optional gotcha / unit reminder
 */

export interface FormulaEntry {
  id: string;
  tags: string[];
  title: string;
  formula: string;
  variables: string;
  note?: string;
}

export const FORMULA_DB: FormulaEntry[] = [
  // ── Orbital mechanics ────────────────────────────────────────────────────────
  {
    id: "orbital-period",
    tags: ["orbital", "orbit", "period", "circular", "satellite", "leo", "kepler"],
    title: "Circular orbital period",
    formula: "T = 2π √(r³ / (G·M))",
    variables: "T = period [s], r = orbital radius [m], G = 6.67430e-11 [m³ kg⁻¹ s⁻²], M = central body mass [kg]",
    note: "r = R_body + altitude; do not use altitude alone.",
  },
  {
    id: "orbital-velocity",
    tags: ["orbital", "orbit", "velocity", "circular", "satellite", "speed"],
    title: "Circular orbital speed",
    formula: "v = √(G·M / r)",
    variables: "v = orbital speed [m/s], G = gravitational constant, M = central mass [kg], r = orbital radius [m]",
  },
  {
    id: "vis-viva",
    tags: ["orbital", "elliptical", "vis-viva", "energy", "semi-major"],
    title: "Vis-viva equation (elliptical orbit)",
    formula: "v² = G·M (2/r − 1/a)",
    variables: "v = speed [m/s], r = current distance from focus [m], a = semi-major axis [m]",
  },
  {
    id: "kepler-third",
    tags: ["kepler", "third law", "period", "semi-major", "orbit"],
    title: "Kepler's third law",
    formula: "T² = (4π²/G·M) · a³",
    variables: "T = period [s], a = semi-major axis [m], M = central mass [kg]",
  },
  // ── Gravity ──────────────────────────────────────────────────────────────────
  {
    id: "gravitational-force",
    tags: ["gravity", "gravitational", "force", "newton", "inverse-square", "attraction"],
    title: "Newton's law of universal gravitation",
    formula: "F = G·M·m / r²",
    variables: "F = force [N], G = 6.67430e-11 [m³ kg⁻¹ s⁻²], M,m = masses [kg], r = separation [m]",
    note: "r is centre-to-centre distance, not altitude above surface.",
  },
  {
    id: "surface-gravity",
    tags: ["surface", "gravity", "acceleration", "g", "earth"],
    title: "Surface gravitational acceleration",
    formula: "g = G·M / R²",
    variables: "g = acceleration [m/s²], M = body mass [kg], R = body radius [m]",
  },
  {
    id: "gravitational-pe",
    tags: ["potential energy", "gravitational", "energy", "orbit"],
    title: "Gravitational potential energy",
    formula: "U = −G·M·m / r",
    variables: "U = potential energy [J], M,m = masses [kg], r = separation [m]",
    note: "U → 0 as r → ∞; U is negative for bound systems.",
  },
  // ── Escape velocity ───────────────────────────────────────────────────────────
  {
    id: "escape-velocity",
    tags: ["escape", "velocity", "speed", "surface", "earth", "launch"],
    title: "Escape velocity from a body's surface",
    formula: "v_esc = √(2·G·M / R)",
    variables: "v_esc = escape speed [m/s], G = 6.67430e-11, M = body mass [kg], R = body radius [m]",
    note: "Evaluate at the launch radius R, not at an altitude.",
  },
  // ── Pendulum ──────────────────────────────────────────────────────────────────
  {
    id: "simple-pendulum",
    tags: ["pendulum", "period", "oscillation", "simple", "small-angle", "swing"],
    title: "Simple pendulum period (small-angle approximation)",
    formula: "T = 2π √(L / g)",
    variables: "T = period [s], L = length [m], g = 9.80665 m/s² (standard gravity)",
    note: "Valid only for small angles (< ~15°). Use exact ODE solution for large angles.",
  },
  {
    id: "physical-pendulum",
    tags: ["physical pendulum", "period", "moment", "inertia", "oscillation"],
    title: "Physical pendulum period",
    formula: "T = 2π √(I / (m·g·d))",
    variables: "T = period [s], I = moment of inertia about pivot [kg·m²], m = mass [kg], d = pivot-to-COM distance [m]",
  },
  // ── Projectile motion ─────────────────────────────────────────────────────────
  {
    id: "projectile-range",
    tags: ["projectile", "range", "trajectory", "angle", "vacuum", "launch"],
    title: "Projectile range on flat ground (vacuum)",
    formula: "R = v₀² · sin(2θ) / g",
    variables: "R = range [m], v₀ = launch speed [m/s], θ = launch angle [rad], g = 9.80665 m/s²",
    note: "Convert θ from degrees to radians before computing sin. Maximum range at θ = 45°.",
  },
  {
    id: "projectile-max-height",
    tags: ["projectile", "height", "maximum", "trajectory", "vacuum"],
    title: "Projectile maximum height",
    formula: "H = (v₀ · sin θ)² / (2g)",
    variables: "H = max height [m], v₀ = launch speed [m/s], θ = launch angle [rad]",
  },
  {
    id: "projectile-time-of-flight",
    tags: ["projectile", "time", "flight", "duration", "trajectory"],
    title: "Projectile time of flight",
    formula: "t = 2·v₀·sin(θ) / g",
    variables: "t = flight time [s], v₀ = launch speed [m/s], θ = launch angle [rad]",
  },
  // ── Energy / kinematics ───────────────────────────────────────────────────────
  {
    id: "kinetic-energy",
    tags: ["kinetic", "energy", "speed", "mass"],
    title: "Kinetic energy",
    formula: "KE = ½·m·v²",
    variables: "KE = kinetic energy [J], m = mass [kg], v = speed [m/s]",
  },
  {
    id: "work-energy",
    tags: ["work", "energy", "force", "displacement"],
    title: "Work-energy theorem",
    formula: "W = ΔKE = F·d·cos(φ)",
    variables: "W = work [J], F = force [N], d = displacement [m], φ = angle between F and d",
  },
  {
    id: "free-fall",
    tags: ["free fall", "drop", "height", "time", "gravity", "kinematics"],
    title: "Free-fall kinematics",
    formula: "h = ½·g·t²   |   v = g·t   |   v² = 2·g·h",
    variables: "h = height [m], t = time [s], v = speed [m/s], g = 9.80665 m/s²",
  },
  // ── Rotation ──────────────────────────────────────────────────────────────────
  {
    id: "centripetal-acceleration",
    tags: ["centripetal", "acceleration", "circular", "rotation", "radial"],
    title: "Centripetal acceleration",
    formula: "a_c = v² / r = ω²·r",
    variables: "a_c [m/s²], v = tangential speed [m/s], r = radius [m], ω = angular speed [rad/s]",
  },
  {
    id: "angular-momentum",
    tags: ["angular momentum", "rotation", "moment", "inertia", "spin"],
    title: "Angular momentum",
    formula: "L = I·ω = m·v·r  (point mass)",
    variables: "L = angular momentum [kg·m²/s], I = moment of inertia [kg·m²], ω = angular velocity [rad/s]",
  },
  // ── Constants reference ───────────────────────────────────────────────────────
  {
    id: "constants-gravity",
    tags: ["constant", "G", "gravity", "gravitational", "universal"],
    title: "Gravitational constant G",
    formula: "G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻²",
    variables: "CODATA 2018 recommended value used throughout SciVerify fixtures",
    note: "Always use the value given in input_data when provided.",
  },
  {
    id: "constants-earth",
    tags: ["earth", "mass", "radius", "constant", "planet"],
    title: "Standard Earth parameters",
    formula: "M_earth = 5.972 × 10²⁴ kg   |   R_earth = 6.371 × 10⁶ m   |   g = 9.80665 m/s²",
    variables: "M_earth = mass, R_earth = mean equatorial radius, g = standard surface gravity",
    note: "Use the pinned values in input_data when provided; these are fallback references.",
  },
];

// ── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Tokenises text into lowercase words (letters, digits, hyphens).
 */
function tokenise(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9][\w-]*/g) ?? [];
  return new Set(tokens);
}

/**
 * Retrieves formula entries whose tags overlap with keywords in the prompt.
 * Returns the top `maxResults` entries ranked by number of tag hits.
 */
export function retrieveFormulas(
  prompt: string,
  maxResults = 4,
): FormulaEntry[] {
  const tokens = tokenise(prompt);

  const scored = FORMULA_DB.map((entry) => {
    const hits = entry.tags.filter((tag) => {
      // A tag can be a phrase (e.g. "escape velocity") — check each word
      const tagWords = tag.toLowerCase().split(/\s+/);
      return tagWords.every((w) => tokens.has(w));
    }).length;
    return { entry, hits };
  })
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxResults);

  return scored.map(({ entry }) => entry);
}

/**
 * Formats retrieved entries as a compact reference block to inject into the
 * LLM prompt.  Returns an empty string when the list is empty.
 */
export function formatContext(entries: FormulaEntry[]): string {
  if (entries.length === 0) return "";
  const lines = entries.map(
    (e) =>
      `[${e.title}]  ${e.formula}  |  ${e.variables}${e.note ? `  NOTE: ${e.note}` : ""}`,
  );
  return `\n\nRelevant formula reference (use as a guide, not as a replacement for the constants in input_data):\n${lines.join("\n")}`;
}
