// Non-Repeating Procedural Terrain Profiles
// A TerrainProfile maps a continuous world X coordinate to an elevation (px above screen bottom).
// It blends fBm detail, optional ridged crests, optional geological terracing (mesas),
// domain warping and slow "macro region" modulation so the landscape character evolves
// (plains -> rolling hills -> ridges) across the level instead of looping.
import { fbm1D, ridged1D, valueNoise1D, smoothstep, lerp } from './Noise.js';

export class TerrainProfile {
  /**
   * @param {object} cfg
   * @param {number} cfg.seed
   * @param {number} cfg.base          Baseline elevation (px from bottom)
   * @param {number} cfg.amp           Main amplitude (px)
   * @param {number} cfg.wavelength    Dominant feature width (px)
   * @param {number} [cfg.octaves=4]
   * @param {number} [cfg.ridge=0]     0 = rounded hills, 1 = sharp ridged peaks
   * @param {number} [cfg.warp=0.35]   Domain warp strength (fraction of wavelength)
   * @param {number} [cfg.regionLength] Length (px) of macro regions; defaults to wavelength * 6
   * @param {number} [cfg.regionAmp=0.45] How much macro regions modulate amplitude (0..1)
   * @param {number} [cfg.regionLift=0] Baseline lift (px) applied in "high" regions
   * @param {object} [cfg.terrace]      { step, hardness } stepped mesas / buttes
   * @param {number} [cfg.minElev]      Clamp lower bound
   */
  constructor(cfg) {
    this.seed = cfg.seed >>> 0;
    this.base = cfg.base;
    this.amp = cfg.amp;
    this.invWave = 1 / cfg.wavelength;
    this.octaves = cfg.octaves || 4;
    this.ridge = cfg.ridge || 0;
    this.warp = cfg.warp !== undefined ? cfg.warp : 0.35;
    this.invRegion = 1 / (cfg.regionLength || cfg.wavelength * 6);
    this.regionAmp = cfg.regionAmp !== undefined ? cfg.regionAmp : 0.45;
    this.regionLift = cfg.regionLift || 0;
    this.terrace = cfg.terrace || null;
    this.minElev = cfg.minElev !== undefined ? cfg.minElev : 0;
    this.detailAmp = cfg.detailAmp || 0;
    this.invDetail = 1 / (cfg.detailWavelength || 12);
    this.flatten = null; // optional (worldX) => { mask, level } e.g. lakes
  }

  /** Slow macro-region value in [0, 1] (shared by props to choose sub-zones). */
  region(worldX) {
    return valueNoise1D(this.seed + 7001, worldX * this.invRegion) * 0.5 + 0.5;
  }

  heightAt(worldX) {
    const s = this.seed;
    const u = worldX * this.invWave;

    // Domain warp: bends feature spacing so no two hills share the same rhythm
    const w = valueNoise1D(s + 4001, u * 0.37) * this.warp;
    const p = u + w;

    let n = fbm1D(s, p, this.octaves); // [-1, 1]
    if (this.ridge > 0) {
      const r = ridged1D(s + 3001, p * 0.85, this.octaves) * 2 - 1; // [-1, 1]
      n = lerp(n, r, this.ridge);
    }

    // Macro regions: some stretches are calm plains, others rugged
    const reg = this.region(worldX);
    const ampMul = 1 - this.regionAmp + this.regionAmp * 2 * smoothstep(0.15, 0.85, reg);
    let h = this.base + n * this.amp * ampMul + (reg - 0.5) * this.regionLift;

    if (this.terrace) {
      const step = this.terrace.step;
      const hard = this.terrace.hardness || 0.75;
      const k = h / step;
      const fl = Math.floor(k);
      const fr = k - fl;
      // Plateau-dominant smooth step: flat tops with clean, rounded cliff edges
      const t = smoothstep(hard, 1, fr);
      h = (fl + t) * step;
    }

    if (this.detailAmp) {
      // Rounded canopy-like bumps: |noise| gives soft domes with tight valleys
      h += Math.abs(valueNoise1D(s + 9001, worldX * this.invDetail)) * this.detailAmp;
    }

    if (this.flatten) {
      const f = this.flatten(worldX);
      if (f && f.mask > 0) h = lerp(h, f.level, f.mask);
    }

    return Math.max(this.minElev, h);
  }
}
