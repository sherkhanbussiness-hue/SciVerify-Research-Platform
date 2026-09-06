/**
 * Canonical physical & astronomical constants (CODATA 2018 / IAU 2015 resolution).
 * All base values in SI units (m, kg, s, J, W, K).
 */

/** Newtonian gravitational constant (m^3 kg^-1 s^-2) */
export const G = 6.67430e-11;

/** Speed of light in vacuum (m s^-1) */
export const C = 2.99792458e8;

/** Solar mass (kg) */
export const M_SUN = 1.98847e30;

/** Solar radius (m) */
export const R_SUN = 6.957e8;

/** Solar luminosity (W) */
export const L_SUN = 3.828e26;

/** Solar effective surface temperature (K) */
export const T_SUN = 5772;

/** Stefan-Boltzmann constant (W m^-2 K^-4) */
export const SIGMA = 5.670374419e-8;

/** Astronomical Unit (m) */
export const AU = 1.495978707e11;

/** Proton mass (kg) */
export const M_P = 1.67262192369e-27;

/** Thomson scattering cross-section (m^2) */
export const SIGMA_T = 6.6524587321e-29;

/** Planck constant (J s) */
export const H_PLANCK = 6.62607015e-34;

/** Reduced Planck constant (J s) */
export const HBAR = H_PLANCK / (2 * Math.PI);

/** Boltzmann constant (J K^-1) */
export const K_B = 1.380649e-23;

/** Standard year in seconds (Julian year = 365.25 days) */
export const YEAR_SECONDS = 365.25 * 86400;

/** Parsec in meters */
export const PARSEC = 3.08567758149e16;

/** Megaparsec in meters */
export const MPC = 1e6 * PARSEC;

/** Hubble constant in s^-1 (70 km/s/Mpc) */
export const H0_SI = (70 * 1000) / MPC;
