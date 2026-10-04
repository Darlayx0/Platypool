// World 2: Canyon Biome (Soft Dusk Badlands)
// Terraced, non-repeating mesas and buttes with sediment strata, warm dust haze,
// a low veiled sun, and grounded desert flora (saguaro, barrel cacti, shrubs, hoodoos).
import { TerrainProfile } from '../Terrain.js';
import { PropStreamer } from '../PropStreamer.js';
import { ClayProps } from '../ClayProps.js';
import { mixHex } from '../ColorUtil.js';
import { valueNoise1D } from '../Noise.js';
import { BiomeBase, pick } from './BiomeBase.js';

const FOG = '#e2c9b6';

const MATERIALS = {
  cactus: ['#6f8257', '#7a8b5e', '#677a52'],
  shrub: ['#8e9373', '#9a9a78', '#848b6c'],
  juniper: ['#5f6c4f', '#66724f'],
  rock: ['#a8846a', '#9c7a62', '#b08e72'],
  hoodoo: ['#b78466', '#a8775c', '#c39374', '#9d6f56'],
  flower: '#e6c98a',
  trunk: '#6e5644'
};

export class CanyonBiome extends BiomeBase {
  constructor(bg, seed = 2) {
    super(bg, seed);
    this.sun = { x: 0.76, y: 0.47 };
    this.lightDir = { x: 0.86, y: -0.5 };
    this.grade = { color: '#ecd3bd', alpha: 0.06 };

    this.buildLayers();
    this.buildStreamers();
    this.initMotes(22, { vx: -26, vxRand: 30, alpha: 0.12, alphaRand: 0.18 });
  }

  buildLayers() {
    const S = this.seed;
    this.layers = {
      far: {
        key: 'canyon_far',
        profile: new TerrainProfile({ seed: S + 11, base: 282, amp: 92, wavelength: 640, octaves: 4, warp: 0.5, regionLength: 5000, regionAmp: 0.5, regionLift: 30, terrace: { step: 34, hardness: 0.72 } }),
        factor: 0.06, yFactor: 0.04, step: 12,
        colors: this.aerial('#8a6c76', FOG, [0.26, 0.4, 0.62]),
        lightColor: '#ffe4c8', shadowColor: '#5a4552', litAlpha: 0.26, shadeAlpha: 0.2, bandDepth: 50,
        rimColor: '#ffeedd', rimAlpha: 0.22, rimWidth: 1.2
      },
      mid: {
        key: 'canyon_mid',
        profile: new TerrainProfile({ seed: S + 29, base: 192, amp: 82, wavelength: 460, octaves: 4, warp: 0.45, regionLength: 3400, regionAmp: 0.55, terrace: { step: 30, hardness: 0.68 } }),
        factor: 0.2, yFactor: 0.1, step: 12, s: 0.6,
        colors: this.aerial('#a86e52', FOG, [0.1, 0.2, 0.38]),
        lightColor: '#ffdcbc', shadowColor: '#5b3428', litAlpha: 0.26, shadeAlpha: 0.24, bandDepth: 46,
        rimColor: '#ffe8d2', rimAlpha: 0.24, rimWidth: 1.4, aoAlpha: 0.1,
        strata: { seed: S + 31, spacing: 18, alpha: 0.07, dark: '#4a2a20', light: '#ffe6cf' }
      },
      near: {
        key: 'canyon_near',
        profile: new TerrainProfile({ seed: S + 47, base: 94, amp: 26, wavelength: 400, octaves: 4, regionLength: 2600, regionAmp: 0.6 }),
        factor: 0.55, yFactor: 0.22, step: 18, s: 0.95,
        colors: this.aerial('#b98b64', FOG, [0.03, 0.07, 0.16]),
        lightColor: '#ffe2c0', shadowColor: '#5c3d2a', litAlpha: 0.2, shadeAlpha: 0.22, bandDepth: 34,
        rimColor: '#fff0dc', rimAlpha: 0.24, rimWidth: 1.6, aoAlpha: 0.12, textureAlpha: 0.03
      },
      fore: {
        key: 'canyon_fore',
        profile: new TerrainProfile({ seed: S + 61, base: 28, amp: 18, wavelength: 320, octaves: 3, regionLength: 2200, regionAmp: 0.8, minElev: 4 }),
        factor: 1.1, yFactor: 0.34, step: 20, s: 1.3,
        colors: ['#8d6649', '#7b583f', '#694b36'],
        lightColor: '#ffe0bd', shadowColor: '#3a2618', litAlpha: 0.16, shadeAlpha: 0.22, bandDepth: 22,
        rimColor: '#ffe9d0', rimAlpha: 0.18, rimWidth: 1.6, textureAlpha: 0.035
      }
    };

    this.propPal = {
      mid: this.makePropPal(0.18),
      near: this.makePropPal(0.05),
      fore: this.makePropPal(0.0, 0.8)
    };
  }

  makePropPal(t, darken = 1) {
    const m = (hex) => {
      const c = mixHex(hex, FOG, t);
      return darken < 1 ? mixHex(c, '#2a1d14', 1 - darken) : c;
    };
    return { m, trunk: m(MATERIALS.trunk), flower: m(MATERIALS.flower) };
  }

  buildStreamers() {
    const S = this.seed;
    this.clouds = new PropStreamer({
      seed: S + 101, chunkSize: 1400, spacing: 420, jitter: 0.7, maxChunks: 6,
      generate: (rng) => { if (rng() >= 0.4) return null; const size = 160 + rng() * 140; return { kind: 'cloud', y: size * 0.45 + 24 + rng() * 90, size, hash: Math.floor(rng() * 1e9), alpha: 0.5, flatness: 0.35 }; }
    });
    this.midProps = new PropStreamer({
      seed: S + 211, chunkSize: 560, spacing: 80, jitter: 0.6, maxChunks: 12,
      generate: (rng, wx, ctx) => this.generateMidProp(rng, wx, ctx)
    });
    this.nearProps = new PropStreamer({
      seed: S + 251, chunkSize: 540, spacing: 90, jitter: 0.6, maxChunks: 12,
      generate: (rng, wx, ctx) => this.generateNearProp(rng, wx, ctx)
    });
    this.foreProps = new PropStreamer({
      seed: S + 293, chunkSize: 600, spacing: 160, jitter: 0.6, maxChunks: 10,
      generate: (rng, wx) => this.generateForeProp(rng, wx)
    });
    this.allStreamers = [this.clouds, this.midProps, this.nearProps, this.foreProps];
  }

  member(rng, kind, pal, dx = 0, dy = 0) {
    const m = pal.m;
    switch (kind) {
      case 'saguaro': {
        const height = 42 + rng() * 26;
        const arms = [];
        const n = Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          arms.push({ side: i % 2 === 0 ? (rng() < 0.5 ? -1 : 1) : 0, at: 0.4 + rng() * 0.25, reach: 7 + rng() * 4, rise: 10 + rng() * 10 });
        }
        for (const a of arms) if (a.side === 0) a.side = arms[0].side * -1;
        return { kind, dx, dy, v: { height, girth: 0.9 + rng() * 0.3, arms, color: m(pick(rng, MATERIALS.cactus)) } };
      }
      case 'barrel':
        return { kind, dx, dy, v: { color: m(pick(rng, MATERIALS.cactus)), flower: rng() < 0.35 } };
      case 'bush': {
        const size = 7 + rng() * 4;
        return { kind, dx, dy, v: { size, color: m(pick(rng, MATERIALS.shrub)), blobs: ClayProps.makeBushBlobs(rng, size) } };
      }
      case 'tree': {
        const canopy = 10 + rng() * 4;
        return { kind, dx, dy, v: { height: 26 + rng() * 10, canopy, color: m(pick(rng, MATERIALS.juniper)), blobs: ClayProps.makeCanopy(rng, canopy) } };
      }
      case 'rock':
        return { kind, dx, dy, v: { w: 14 + rng() * 14, h: 9 + rng() * 8, color: m(pick(rng, MATERIALS.rock)) } };
      case 'hoodoo': {
        const segs = [];
        const n = 3 + Math.floor(rng() * 2);
        let w = 12 + rng() * 5;
        for (let i = 0; i < n; i++) {
          const isCap = i === n - 1;
          segs.push({ w: isCap ? w * 1.5 : w, h: isCap ? 7 + rng() * 3 : 10 + rng() * 8, dx: (rng() - 0.5) * 2, color: m(isCap ? MATERIALS.hoodoo[3] : pick(rng, MATERIALS.hoodoo)) });
          w *= 0.85 + rng() * 0.1;
        }
        return { kind, dx, dy, v: { w: 16, segments: segs } };
      }
      default:
        return null;
    }
  }

  generateMidProp(rng, wx, gctx) {
    const layer = this.layers.mid;
    if (this.slopeAt(layer.profile, wx) > 0.25) return null; // only on plateau tops & flats
    const pal = this.propPal.mid;
    const r = rng();
    let prop = null;
    if (r < 0.14 && gctx.prevKind !== 'hoodoo') prop = this.group(this.cluster(rng, ['hoodoo'], pal, 1 + Math.floor(rng() * 2), 18));
    else if (r < 0.3) prop = this.group(this.cluster(rng, ['bush', 'tree'], pal, 1 + Math.floor(rng() * 2), 22));
    return this.finalizeProp(prop, layer, wx);
  }

  generateNearProp(rng, wx, gctx) {
    const layer = this.layers.near;
    if (this.slopeAt(layer.profile, wx) > 0.5) return null;
    const pal = this.propPal.near;
    const z = valueNoise1D(this.seed + 600, wx / 1900) * 0.5 + 0.5;
    const r = rng();
    let prop = null;
    if (z < 0.45) {
      // Cactus flats
      if (r < 0.3 && gctx.prevKind !== 'saguaro') prop = this.group([this.member(rng, 'saguaro', pal)]);
      else if (r < 0.48) prop = this.group(this.cluster(rng, ['barrel', 'bush'], pal, 2, 18));
      else if (r < 0.58) prop = this.group([this.member(rng, 'rock', pal)]);
    } else {
      // Rocky scrubland
      if (r < 0.28) prop = this.group(this.cluster(rng, ['rock', 'bush'], pal, 2, 22));
      else if (r < 0.4) prop = this.group([this.member(rng, 'tree', pal)]);
      else if (r < 0.5) prop = this.group([this.member(rng, 'barrel', pal)]);
    }
    return this.finalizeProp(prop, layer, wx);
  }

  generateForeProp(rng, wx) {
    const layer = this.layers.fore;
    if (layer.profile.heightAt(wx) < 12) return null;
    const pal = this.propPal.fore;
    const r = rng();
    let prop = null;
    if (r < 0.26) prop = this.group([this.member(rng, 'bush', pal)]);
    else if (r < 0.42) prop = this.group([this.member(rng, 'rock', pal)]);
    return this.finalizeProp(prop, layer, wx);
  }

  update(dt, speedMultiplier) {
    this.updateMotes(dt, speedMultiplier);
  }

  draw(ctx) {
    const bg = this.bg;
    const W = this.width;
    const H = this.height;
    const sunX = W * this.sun.x;
    const sunY = H * this.sun.y;

    bg.drawSkyGradient(ctx, 'canyon', [
      [0, '#5f5b72'], [0.32, '#86788a'], [0.58, '#b9998f'], [0.78, '#dcb79c'], [1, '#ebd1b6']
    ]);
    bg.drawSun(ctx, sunX, sunY, { radius: 22, core: '#fff3e0', glow: '#ffd9b0', glowAlpha: 0.45, glowRadius: 300, discEdgeAlpha: 0.7 });
    this.drawClouds(ctx, this.clouds, 0.03, 4, { top: '#fff0e2', base: '#e4cdc2', shadow: '#a88f98' });
    bg.drawGodRays(ctx, sunX, sunY, 5, 760, 0.04, '#ffe6c8', Math.PI * 0.82);

    bg.drawTerrainLayer(ctx, this.layers.far);
    bg.drawHorizonFog(ctx, 240, 70, 0.16, FOG);
    bg.drawFogBank(ctx, { seed: this.seed + 901, factor: 0.09, yFactor: 0.05, elev: 236, spread: 24, spacing: 220, width: 280, height: 26, alpha: 0.16, color: '#ecd6c4', drift: 4 });

    bg.drawTerrainLayer(ctx, this.layers.mid);
    this.drawPropLayer(ctx, this.midProps, this.layers.mid, this.propPal.mid);
    bg.drawFogBank(ctx, { seed: this.seed + 911, factor: 0.26, yFactor: 0.12, elev: 150, spread: 20, spacing: 180, width: 230, height: 22, alpha: 0.18, color: '#ecd4c0', drift: 6 });

    bg.drawTerrainLayer(ctx, this.layers.near);
    this.drawPropLayer(ctx, this.nearProps, this.layers.near, this.propPal.near);
    bg.drawFogBank(ctx, { seed: this.seed + 921, factor: 0.62, yFactor: 0.24, elev: 78, spread: 14, spacing: 180, width: 220, height: 16, alpha: 0.1, color: '#f0dccb', drift: 9, coverage: 0.55 });

    bg.drawTerrainLayer(ctx, this.layers.fore);
    this.drawPropLayer(ctx, this.foreProps, this.layers.fore, this.propPal.fore);

    bg.drawHeightFog(ctx, 140, 0.07, '#eed8c4');
    this.drawMotes(ctx, '#f6dcc0');
  }
}
