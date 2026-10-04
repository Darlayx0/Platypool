// Deterministic Seeded Noise & Hash Utilities for Procedural Backgrounds
// Provides non-periodic 1D value noise, fBm, ridged noise and stable integer hashing.
// All functions are pure (no allocation per call) so they are safe to use per-frame.

/**
 * 32-bit integer hash (based on lowbias32 by Chris Wellons).
 * Stable for any integer input (negative values are folded into uint32).
 */
export function hash32(n) {
  n = n | 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return n >>> 0;
}

/** Combine seed + index (+ optional salt) into a stable hash. */
export function hash3(seed, i, salt = 0) {
  return hash32(hash32(seed ^ Math.imul(salt + 1, 0x9e3779b1)) ^ Math.imul(i | 0, 0x85ebca77));
}

/** Deterministic float in [0, 1) for (seed, index, salt). */
export function rand01(seed, i, salt = 0) {
  return hash3(seed, i, salt) / 4294967296;
}

/** Hash a string into a 32-bit seed. */
export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small fast seeded PRNG (mulberry32). Returns a function producing floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 1D value noise in [-1, 1] with quintic interpolation.
 * Lattice values come from an integer hash, so the signal never repeats.
 */
export function valueNoise1D(seed, x) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = rand01(seed, xi) * 2 - 1;
  const b = rand01(seed, xi + 1) * 2 - 1;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  return a + (b - a) * u;
}

/**
 * Fractal Brownian Motion (sum of octaves of value noise), normalized to roughly [-1, 1].
 * Octave lacunarity uses an irrational-ish factor (2.07) so octaves never align.
 */
export function fbm1D(seed, x, octaves = 4, gain = 0.5, lacunarity = 2.07) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise1D(seed + o * 1013, x * freq + o * 17.31) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/**
 * Ridged fBm in [0, 1]: produces sharper, mountain-like crests.
 */
export function ridged1D(seed, x, octaves = 4, gain = 0.5, lacunarity = 2.07) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(valueNoise1D(seed + o * 2029, x * freq + o * 9.77));
    sum += n * n * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
