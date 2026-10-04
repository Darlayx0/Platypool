// Premium Claymation Material Library
// Procedural fingerprint / sculpt-tool bump texture + cached physically-based clay materials.
import * as THREE from 'three';

let clayBumpTexture = null;

/**
 * Generates a tileable procedural "hand-sculpted plasticine" bump map:
 * low-frequency lumps + thumb-press dimples + fine fingerprint ridges.
 */
function getClayBumpTexture() {
  if (clayBumpTexture) return clayBumpTexture;
  if (typeof document === 'undefined') return null;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');

  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, size, size);

  // Pseudo-random with fixed seed for deterministic look
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Helper that draws wrapped (tileable) primitives
  const wrapDraw = (fn) => {
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) fn(ox, oy);
    }
  };

  // 1. Soft lumps (uneven clay mass)
  for (let i = 0; i < 70; i++) {
    const x = rnd() * size, y = rnd() * size, r = 10 + rnd() * 34;
    const light = rnd() > 0.5;
    wrapDraw((ox, oy) => {
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grad.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)');
      grad.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      g.fill();
    });
  }

  // 2. Thumb-press dimples with fingerprint ridges
  for (let i = 0; i < 9; i++) {
    const x = rnd() * size, y = rnd() * size, r = 14 + rnd() * 14;
    const rot = rnd() * Math.PI;
    wrapDraw((ox, oy) => {
      g.save();
      g.translate(x + ox, y + oy);
      g.rotate(rot);
      g.scale(1, 0.72);
      for (let k = r; k > 2; k -= 2.2) {
        g.beginPath();
        g.ellipse(0, 0, k, k * 0.9, 0, 0, Math.PI * 2);
        g.strokeStyle = 'rgba(0,0,0,0.07)';
        g.lineWidth = 0.9;
        g.stroke();
      }
      g.restore();
    });
  }

  // 3. Sculpt-tool scratch strokes
  for (let i = 0; i < 40; i++) {
    const x = rnd() * size, y = rnd() * size, len = 6 + rnd() * 20, a = rnd() * Math.PI;
    wrapDraw((ox, oy) => {
      g.beginPath();
      g.moveTo(x + ox, y + oy);
      g.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
      g.strokeStyle = rnd() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
      g.lineWidth = 0.6 + rnd();
      g.stroke();
    });
  }

  // 4. Fine grain noise
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 14;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);

  clayBumpTexture = new THREE.CanvasTexture(c);
  clayBumpTexture.wrapS = clayBumpTexture.wrapT = THREE.RepeatWrapping;
  clayBumpTexture.repeat.set(2, 2);
  clayBumpTexture.colorSpace = THREE.NoColorSpace;
  return clayBumpTexture;
}

const cache = new Map();
// Colour-only (default options) lookups are by far the most frequent (debris bursts); give them a
// dedicated map so the hot path needs neither JSON.stringify nor a concatenated key string.
const defaultCache = new Map();
const NO_OPTS = Object.freeze({});

/**
 * Get a cached clay material.
 * @param {string} color hex color
 * @param {object} opts { roughness, sheen, clearcoat, emissive, emissiveIntensity, transparent, opacity, bump }
 */
export function clayMat(color, opts = NO_OPTS) {
  let isDefault = opts === NO_OPTS;
  if (!isDefault) {
    isDefault = true;
    for (const _k in opts) { isDefault = false; break; }
  }
  if (isDefault) {
    const hit = defaultCache.get(color);
    if (hit) return hit;
  }

  const key = color + JSON.stringify(opts);
  let m = cache.get(key);
  if (m) {
    if (isDefault) defaultCache.set(color, m);
    return m;
  }

  m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: opts.roughness ?? 0.62,
    metalness: 0,
    sheen: opts.sheen ?? 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color('#ffffff'),
    clearcoat: opts.clearcoat ?? 0.12,
    clearcoatRoughness: 0.55,
    emissive: new THREE.Color(opts.emissive || '#000000'),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: Boolean(opts.transparent),
    opacity: opts.opacity ?? 1,
    depthWrite: opts.transparent ? false : true,
    side: opts.side ?? THREE.FrontSide
  });

  if (opts.bump !== false) {
    m.bumpMap = getClayBumpTexture();
    m.bumpScale = opts.bumpScale ?? 1.4;
  }

  cache.set(key, m);
  if (isDefault) defaultCache.set(color, m);
  return m;
}

/** Glowing (unlit) clay for flames, energy cores, lights */
export function glowMat(color, opacity = 1) {
  const key = 'glow' + color + opacity;
  let m = cache.get(key);
  if (m) return m;
  m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  cache.set(key, m);
  return m;
}
