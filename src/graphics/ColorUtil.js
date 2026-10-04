// Color utilities for calibrated, soft color grading of background layers.
// Supports aerial perspective (mixing toward fog/sky color) and saturation control.

const cache = new Map();

export function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Linear mix of two hex colors, returns hex. */
export function mixHex(a, b, t) {
  const key = `${a}|${b}|${t.toFixed(3)}`;
  let out = cache.get(key);
  if (out) return out;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  out = rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  if (cache.size > 2000) cache.clear();
  cache.set(key, out);
  return out;
}

/** Reduce saturation toward luminance-matched gray (amount 0..1). */
export function desaturate(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const l = r * 0.299 + g * 0.587 + b * 0.114;
  return rgbToHex(r + (l - r) * amount, g + (l - g) * amount, b + (l - b) * amount);
}

export function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Scale brightness (f < 1 darker, f > 1 lighter). */
export function shade(hex, f) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * f, g * f, b * f);
}
