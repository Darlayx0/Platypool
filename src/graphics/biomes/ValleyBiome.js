// World 1: Valley Biome (Calm Pastoral Alpine Valley)
// Five non-repeating clay terrain layers with aerial perspective, evolving sub-zones
// (forest -> meadow -> village -> lake district), grounded props, procedural cumulus,
// gentle sun rays and layered valley mist.
import { TerrainProfile } from '../Terrain.js';
import { PropStreamer } from '../PropStreamer.js';
import { ClayProps } from '../ClayProps.js';
import { mixHex } from '../ColorUtil.js';
import { valueNoise1D, smoothstep, hash3 } from '../Noise.js';
import { BiomeBase, pick } from './BiomeBase.js';

const FOG = '#d5dde1';

const MATERIALS = {
  trunk: '#6b5442',
  leaves: ['#6f8a52', '#7a9459', '#62804c', '#86965c', '#5f7b52'],
  conifer: ['#4e6a4d', '#557151', '#486246'],
  poplar: '#5f7e4d',
  bush: ['#6b8550', '#748c55', '#64804e'],
  rock: ['#a19a8c', '#958f84', '#aaa396'],
  hay: '#c9b480',
  walls: ['#e2d6c2', '#d8cab3', '#cec3b1', '#e5dbca'],
  roofs: ['#9a5d4a', '#7c6757', '#6b7480', '#8b6044', '#a06c55'],
  chimney: '#857668',
  window: '#e7d39e',
  stone: '#d1c9bc',
  millCap: '#7a5b49',
  sail: '#ebe5d9',
  sailFrame: '#5a4737'
};

export class ValleyBiome extends BiomeBase {
  constructor(bg, seed = 1) {
    super(bg, seed);

    // Sun in the upper right; all shading follows this light direction
    this.sun = { x: 0.74, y: 0.2 };
    this.lightDir = { x: 0.5, y: -0.86 };
    this.grade = { color: '#e9e1d2', alpha: 0.05 };

    this.millAngle = 0;
    this.smoke = [];

    this.buildLayers();
    this.buildStreamers();
    this.initMotes(18);
  }

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------

  buildLayers() {
    const S = this.seed;
    this.layers = {
      far: {
        key: 'valley_far',
        profile: new TerrainProfile({ seed: S + 11, base: 330, amp: 88, wavelength: 560, octaves: 5, ridge: 0.7, warp: 0.4, regionLength: 5200, regionAmp: 0.5, regionLift: 50 }),
        factor: 0.06, yFactor: 0.04, step: 12, shadeSpan: 48,
        colors: this.aerial('#7a8da4', FOG, [0.26, 0.42, 0.66]),
        lightColor: '#fff1dc', shadowColor: '#46566a', litAlpha: 0.26, shadeAlpha: 0.24, bandDepth: 80,
        rimColor: '#f7f2ea', rimAlpha: 0.24, rimWidth: 1.2
      },
      ridge: {
        key: 'valley_ridge',
        profile: new TerrainProfile({ seed: S + 23, base: 250, amp: 60, wavelength: 420, octaves: 4, ridge: 0.3, regionLength: 3800, regionAmp: 0.5, regionLift: 24, detailAmp: 6, detailWavelength: 15 }),
        factor: 0.14, yFactor: 0.08, step: 7, shadeSpan: 40,
        colors: this.aerial('#5a766c', FOG, [0.18, 0.3, 0.5]),
        lightColor: '#fff0d6', shadowColor: '#33453d', litAlpha: 0.22, shadeAlpha: 0.22, bandDepth: 52,
        rimColor: '#f4efe2', rimAlpha: 0.18, rimWidth: 1.2
      },
      mid: {
        key: 'valley_mid',
        profile: new TerrainProfile({ seed: S + 37, base: 176, amp: 38, wavelength: 470, octaves: 4, ridge: 0, regionLength: 3000, regionAmp: 0.65 }),
        factor: 0.3, yFactor: 0.14, step: 18, s: 0.55,
        colors: this.aerial('#86a06a', FOG, [0.08, 0.15, 0.32]),
        lightColor: '#fff1d2', shadowColor: '#3c4c30', litAlpha: 0.2, shadeAlpha: 0.2, bandDepth: 40,
        rimColor: '#f6f0dc', rimAlpha: 0.22, rimWidth: 1.4, aoAlpha: 0.1, textureAlpha: 0.025
      },
      near: {
        key: 'valley_near',
        profile: new TerrainProfile({ seed: S + 53, base: 100, amp: 32, wavelength: 390, octaves: 4, regionLength: 2600, regionAmp: 0.6 }),
        factor: 0.62, yFactor: 0.24, step: 18, s: 0.95,
        colors: this.aerial('#64804f', FOG, [0.02, 0.06, 0.16]),
        lightColor: '#fff0cf', shadowColor: '#2c3a24', litAlpha: 0.2, shadeAlpha: 0.22, bandDepth: 36,
        rimColor: '#f3ecd4', rimAlpha: 0.24, rimWidth: 1.6, aoAlpha: 0.14, textureAlpha: 0.03
      },
      fore: {
        key: 'valley_fore',
        profile: new TerrainProfile({ seed: S + 71, base: 30, amp: 22, wavelength: 300, octaves: 3, regionLength: 2200, regionAmp: 0.8, minElev: 4 }),
        factor: 1.15, yFactor: 0.36, step: 20, s: 1.35,
        colors: ['#4b6241', '#405638', '#34482e'],
        lightColor: '#fbe9c4', shadowColor: '#1e2a1a', litAlpha: 0.16, shadeAlpha: 0.22, bandDepth: 24,
        rimColor: '#efe6c8', rimAlpha: 0.2, rimWidth: 1.6, textureAlpha: 0.035
      }
    };

    // Lakes: flatten the midground in "lake district" zones
    this.lakeLevel = 150;
    this.layers.mid.profile.flatten = (wx) => {
      const m = this.lakeMask(wx);
      return m > 0 ? { mask: m, level: this.lakeLevel } : null;
    };

    this.propPal = {
      mid: this.makePropPal(0.12),
      near: this.makePropPal(0.04),
      fore: this.makePropPal(0.0, 0.82)
    };
  }

  makePropPal(t, darken = 1) {
    const m = (hex) => {
      const c = mixHex(hex, FOG, t);
      return darken < 1 ? mixHex(c, '#1d2619', 1 - darken) : c;
    };
    return {
      m,
      trunk: m(MATERIALS.trunk), hay: m(MATERIALS.hay), chimney: m(MATERIALS.chimney),
      window: m(MATERIALS.window), stone: m(MATERIALS.stone), millCap: m(MATERIALS.millCap),
      sail: m(MATERIALS.sail), sailFrame: m(MATERIALS.sailFrame)
    };
  }

  /** Slow world-scale sub-zone selector for the midground (0..1). */
  zoneAt(wx) {
    return valueNoise1D(this.seed + 500, wx / 2400) * 0.5 + 0.5;
  }

  lakeMask(wx) {
    return smoothstep(0.74, 0.82, this.zoneAt(wx));
  }

  buildStreamers() {
    const S = this.seed;
    this.cloudsFar = new PropStreamer({
      seed: S + 101, chunkSize: 1200, spacing: 300, jitter: 0.7, maxChunks: 6,
      generate: (rng) => { if (rng() >= 0.55) return null; const size = 110 + rng() * 80; return { kind: 'cloud', y: size * 0.45 + 30 + rng() * 120, size, hash: Math.floor(rng() * 1e9), alpha: 0.75 }; }
    });
    this.cloudsNear = new PropStreamer({
      seed: S + 131, chunkSize: 1380, spacing: 460, jitter: 0.7, maxChunks: 6,
      generate: (rng) => { if (rng() >= 0.45) return null; const size = 180 + rng() * 120; return { kind: 'cloud', y: size * 0.45 + 20 + rng() * 100, size, hash: Math.floor(rng() * 1e9), alpha: 0.9 }; }
    });
    this.midProps = new PropStreamer({
      seed: S + 211, chunkSize: 552, spacing: 46, jitter: 0.6, maxChunks: 14,
      generate: (rng, wx, ctx) => this.generateMidProp(rng, wx, ctx)
    });
    this.nearProps = new PropStreamer({
      seed: S + 251, chunkSize: 540, spacing: 72, jitter: 0.9, maxChunks: 12,
      generate: (rng, wx) => this.generateNearProp(rng, wx)
    });
    this.foreProps = new PropStreamer({
      seed: S + 293, chunkSize: 600, spacing: 150, jitter: 0.6, maxChunks: 10,
      generate: (rng, wx) => this.generateForeProp(rng, wx)
    });
    this.allStreamers = [this.cloudsFar, this.cloudsNear, this.midProps, this.nearProps, this.foreProps];
  }

  // ---------------------------------------------------------------------------
  // Prop generation (deterministic per world chunk)
  // ---------------------------------------------------------------------------

  member(rng, kind, pal, dx = 0, dy = 0) {
    const m = pal.m;
    switch (kind) {
      case 'tree': {
        const canopy = 12 + rng() * 5;
        return { kind, dx, dy, v: { height: 34 + rng() * 18, canopy, color: m(pick(rng, MATERIALS.leaves)), blobs: ClayProps.makeCanopy(rng, canopy) } };
      }
      case 'conifer':
        return { kind, dx, dy, v: { height: 40 + rng() * 30, ratio: 0.34 + rng() * 0.08, tiers: 3 + Math.floor(rng() * 2), color: m(pick(rng, MATERIALS.conifer)) } };
      case 'poplar':
        return { kind, dx, dy, v: { height: 44 + rng() * 16, girth: 0.9 + rng() * 0.3, color: m(MATERIALS.poplar) } };
      case 'bush': {
        const size = 8 + rng() * 4;
        return { kind, dx, dy, v: { size, color: m(pick(rng, MATERIALS.bush)), blobs: ClayProps.makeBushBlobs(rng, size) } };
      }
      case 'rock':
        return { kind, dx, dy, v: { w: 14 + rng() * 12, h: 9 + rng() * 7, color: m(pick(rng, MATERIALS.rock)) } };
      case 'hay':
        return { kind, dx, dy, v: { count: 2 + Math.floor(rng() * 2) } };
      case 'cottage':
        return { kind, dx, dy, v: { w: 26 + rng() * 12, h: 16 + rng() * 6, roofH: 11 + rng() * 5, wall: m(pick(rng, MATERIALS.walls)), roof: m(pick(rng, MATERIALS.roofs)), chimney: rng() < 0.7 } };
      case 'windmill':
        return { kind, dx, dy, v: { height: 44 + rng() * 12 } };
      default:
        return null;
    }
  }

  generateMidProp(rng, wx, gctx) {
    const layer = this.layers.mid;
    const pal = this.propPal.mid;
    if (this.lakeMask(wx - 40) > 0.02 || this.lakeMask(wx + 40) > 0.02) {
      // Lake shore: occasional shrubs, never anything on the water
      if (this.lakeMask(wx) < 0.02 && rng() < 0.3) return this.finalizeProp(this.group([this.member(rng, 'bush', pal)]), layer, wx);
      return null;
    }
    if (this.slopeAt(layer.profile, wx) > 0.5) return null;

    const z = this.zoneAt(wx) + (rng() - 0.5) * 0.08;
    const r = rng();
    let prop = null;

    if (z < 0.34) {
      // Forest: dense conifer and broadleaf clusters
      if (r < 0.85) prop = this.group(this.cluster(rng, ['conifer', 'conifer', 'tree'], pal, 2 + Math.floor(rng() * 3), 34));
    } else if (z < 0.5) {
      // Meadow & farmland: airy, with poplar rows and hay
      if (r < 0.22) prop = this.group(this.cluster(rng, ['poplar'], pal, 2 + Math.floor(rng() * 2), 26));
      else if (r < 0.38) prop = this.group([this.member(rng, 'hay', pal)]);
      else if (r < 0.58) prop = this.group([this.member(rng, 'tree', pal)]);
    } else {
      // Village
      if (r < 0.42) {
        const members = this.cluster(rng, ['cottage'], pal, 1 + Math.floor(rng() * 2), 30);
        if (rng() < 0.5) members.push(this.member(rng, 'tree', pal, (rng() < 0.5 ? -1 : 1) * 26, -2));
        prop = this.group(members, { smoke: true });
      } else if (r < 0.5 && gctx.prevKind !== 'windmill') {
        prop = this.group([this.member(rng, 'windmill', pal)]);
      } else if (r < 0.72) {
        prop = this.group([this.member(rng, rng() < 0.5 ? 'tree' : 'poplar', pal)]);
      }
    }
    return this.finalizeProp(prop, layer, wx);
  }

  generateNearProp(rng, wx) {
    const layer = this.layers.near;
    if (this.slopeAt(layer.profile, wx) > 0.55) return null;
    // Natural grouping: a slow density field thins props into clumps and open stretches
    const density = valueNoise1D(this.seed + 650, wx / 520) * 0.5 + 0.5;
    if (rng() > density * 1.15) return null;
    const pal = this.propPal.near;
    const z = valueNoise1D(this.seed + 600, wx / 1800) * 0.5 + 0.5;
    const r = rng();
    let prop = null;
    if (z < 0.4) {
      if (r < 0.7) prop = this.group(this.cluster(rng, ['tree', 'conifer', 'tree'], pal, 1 + Math.floor(rng() * 2), 30));
    } else if (z < 0.7) {
      if (r < 0.25) prop = this.group([this.member(rng, 'tree', pal)]);
      else if (r < 0.45) prop = this.group([this.member(rng, 'bush', pal)]);
      else if (r < 0.55) prop = this.group([this.member(rng, 'rock', pal)]);
      else if (r < 0.62) prop = this.group([this.member(rng, 'hay', pal)]);
    } else {
      if (r < 0.3) prop = this.group([this.member(rng, 'bush', pal)]);
      else if (r < 0.42) prop = this.group([this.member(rng, 'rock', pal)]);
    }
    return this.finalizeProp(prop, layer, wx);
  }

  generateForeProp(rng, wx) {
    const layer = this.layers.fore;
    if (layer.profile.heightAt(wx) < 14) return null;
    const pal = this.propPal.fore;
    const r = rng();
    let prop = null;
    if (r < 0.32) prop = this.group([this.member(rng, 'bush', pal)]);
    else if (r < 0.44) prop = this.group([this.member(rng, 'rock', pal)]);
    return this.finalizeProp(prop, layer, wx);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  update(dt, speedMultiplier) {
    this.millAngle = (this.millAngle + dt * 0.55) % (Math.PI * 2);
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.age += dt;
      p.lx += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 4.5;
      if (p.age >= p.life) this.smoke.splice(i, 1);
    }
    this.updateMotes(dt, speedMultiplier);
  }

  // ---------------------------------------------------------------------------
  // Draw
  // ---------------------------------------------------------------------------

  draw(ctx) {
    const bg = this.bg;
    const W = this.width;
    const H = this.height;
    const sunX = W * this.sun.x;
    const sunY = H * this.sun.y;

    bg.drawSkyGradient(ctx, 'valley', [
      [0, '#8aa4bc'], [0.42, '#a8bccb'], [0.72, '#ccd7db'], [0.9, '#e0e2db'], [1, '#e8e3d7']
    ]);
    bg.drawSun(ctx, sunX, sunY, { radius: 20, core: '#fff9ee', glow: '#ffe7c4', glowAlpha: 0.42, glowRadius: 270 });

    this.drawClouds(ctx, this.cloudsFar, 0.022, 3, { top: '#f7f5f0', base: '#e2e6e9', shadow: '#aab6c1' });
    this.drawClouds(ctx, this.cloudsNear, 0.045, 6, { top: '#fbf9f4', base: '#e8ebed', shadow: '#a7b4c0' });
    bg.drawGodRays(ctx, sunX, sunY, 5, 720, 0.045, '#fff4dc', Math.PI * 0.66);

    // Far alpine range + horizon haze
    bg.drawTerrainLayer(ctx, this.layers.far);
    bg.drawHorizonFog(ctx, 290, 70, 0.13, FOG);
    bg.drawFogBank(ctx, { seed: this.seed + 901, factor: 0.08, yFactor: 0.05, elev: 285, spread: 26, spacing: 210, width: 260, height: 26, alpha: 0.15, color: '#e3e8ea', drift: 3 });

    // Forested foothills
    bg.drawTerrainLayer(ctx, this.layers.ridge);
    bg.drawFogBank(ctx, { seed: this.seed + 911, factor: 0.18, yFactor: 0.09, elev: 222, spread: 22, spacing: 180, width: 220, height: 24, alpha: 0.2, color: '#e0e6e8', drift: 4 });

    // Midground meadows, lakes & villages
    bg.drawTerrainLayer(ctx, this.layers.mid);
    this.drawLakes(ctx);
    this.drawPropLayer(ctx, this.midProps, this.layers.mid, this.propPal.mid, (p, sx, gy) => {
      if (p.hub) {
        ClayProps.windmillSails(ctx, sx + p.hub.dx, gy + p.hub.dy, this.layers.mid.s, this.millAngle + (p.worldX % 7), this.propPal.mid);
      }
      if (p.smoke && p.chimneys.length && this.smoke.length < 40 && Math.random() < 0.03) {
        const ch = p.chimneys[Math.floor(Math.random() * p.chimneys.length)];
        this.smoke.push({ lx: p.worldX + ch.dx, y: H - p.elev + p.sink + ch.dy, vx: -5 - Math.random() * 4, vy: -9 - Math.random() * 5, r: 2.2, age: 0, life: 4 + Math.random() * 2 });
      }
    });
    this.drawSmoke(ctx);
    bg.drawFogBank(ctx, { seed: this.seed + 921, factor: 0.36, yFactor: 0.15, elev: 158, spread: 20, spacing: 160, width: 200, height: 22, alpha: 0.17, color: '#e6ebec', drift: 6 });

    // Near pastures & woodland
    bg.drawTerrainLayer(ctx, this.layers.near);
    this.drawPropLayer(ctx, this.nearProps, this.layers.near, this.propPal.near);
    bg.drawFogBank(ctx, { seed: this.seed + 931, factor: 0.7, yFactor: 0.26, elev: 82, spread: 16, spacing: 170, width: 220, height: 18, alpha: 0.1, color: '#eef1f0', drift: 8, coverage: 0.6 });

    // Foreground mounds
    bg.drawTerrainLayer(ctx, this.layers.fore);
    this.drawPropLayer(ctx, this.foreProps, this.layers.fore, this.propPal.fore);

    bg.drawHeightFog(ctx, 150, 0.06, '#e9ecea');
    this.drawMotes(ctx, '#fff6df');
  }

  drawSmoke(ctx) {
    if (!this.smoke.length) return;
    const bg = this.bg;
    const lx = bg.layerX(this.layers.mid.factor);
    const yShift = bg.cameraYShift * this.layers.mid.yFactor;
    const grad = bg.getPuffGradient(ctx, '#eef0ef');
    for (const p of this.smoke) {
      const t = p.age / p.life;
      ctx.save();
      ctx.globalAlpha = 0.32 * (1 - t) * Math.min(1, p.age * 3);
      ctx.translate(p.lx - lx, p.y + yShift);
      ctx.scale(p.r, p.r * 0.85);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Calm lake surfaces reflecting the sky, where the midground flattens. */
  drawLakes(ctx) {
    const bg = this.bg;
    const layer = this.layers.mid;
    const lx = bg.layerX(layer.factor);
    const W = this.width;
    const step = 8;
    const yS = this.height - this.lakeLevel + bg.cameraYShift * layer.yFactor;
    let start = null;

    const flush = (x0, x1) => {
      if (x1 - x0 < 24) return;
      const depth = 16;
      const taper = Math.min(26, (x1 - x0) * 0.2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, yS);
      ctx.lineTo(x1, yS);
      ctx.quadraticCurveTo(x1 - taper * 0.3, yS + depth * 0.7, x1 - taper, yS + depth);
      ctx.lineTo(x0 + taper, yS + depth);
      ctx.quadraticCurveTo(x0 + taper * 0.3, yS + depth * 0.7, x0, yS);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, yS, 0, yS + depth);
      g.addColorStop(0, '#c9d6dc');
      g.addColorStop(0.5, '#a9bcc6');
      g.addColorStop(1, '#8fa5b0');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      // Soft horizontal reflection streaks, anchored to the world
      ctx.strokeStyle = 'rgba(255, 252, 244, 0.35)';
      ctx.lineWidth = 1;
      const firstCell = Math.floor((lx + x0) / 60);
      const lastCell = Math.floor((lx + x1) / 60);
      for (let cell = firstCell; cell <= lastCell; cell++) {
        const sxk = cell * 60 - lx + (hash3(this.seed, cell, 3) % 30);
        const syk = yS + 3 + (hash3(this.seed, cell, 4) % 10);
        const len = 14 + (hash3(this.seed, cell, 5) % 26);
        ctx.beginPath();
        ctx.moveTo(sxk, syk);
        ctx.lineTo(sxk + len, syk);
        ctx.stroke();
      }
      ctx.restore();
      // Shoreline glint
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0 + 4, yS + 0.5);
      ctx.lineTo(x1 - 4, yS + 0.5);
      ctx.stroke();
    };

    for (let x = -step; x <= W + step; x += step) {
      const wet = this.lakeMask(lx + x) > 0.85;
      if (wet && start === null) start = x;
      if (!wet && start !== null) { flush(start, x); start = null; }
    }
    if (start !== null) flush(start, W + step);
  }
}
