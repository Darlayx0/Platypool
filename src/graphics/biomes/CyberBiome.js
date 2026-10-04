// World 3: Cyber Biome (Calm Night Metropolis)
// Procedural districts (downtown towers -> mid-rise -> industry) streamed per world chunk,
// hashed window lighting (never repeats), a supported elevated rail viaduct, soft smog,
// moonlight shading, light rain and dim sodium street lamps.
import { TerrainProfile } from '../Terrain.js';
import { PropStreamer } from '../PropStreamer.js';
import { ClayProps } from '../ClayProps.js';
import { mixHex, rgba } from '../ColorUtil.js';
import { valueNoise1D, mulberry32 } from '../Noise.js';
import { BiomeBase, pick } from './BiomeBase.js';

const FOG = '#4a5263';

export class CyberBiome extends BiomeBase {
  constructor(bg, seed = 3) {
    super(bg, seed);
    this.moon = { x: 0.2, y: 0.17 };
    this.lightDir = { x: -0.6, y: -0.8 };
    this.grade = { color: '#3c4354', alpha: 0.05 };

    this.tiers = {
      far: {
        factor: 0.07, yFactor: 0.04, base: 230, range: 170, wMin: 18, wMax: 58, gap: 0.3, sink: 0,
        colors: ['#353c4d', '#394152', '#323949'].map((c) => mixHex(c, FOG, 0.3)),
        win: { pitchX: 5, pitchY: 7, w: 1.5, h: 2, litFloor: 0.22, lit: 0.25, alpha: 0.35, unlit: false },
        beaconAt: 9999
      },
      mid: {
        factor: 0.2, yFactor: 0.1, base: 150, range: 240, wMin: 28, wMax: 86, gap: 0.42, sink: 0,
        colors: ['#262d3b', '#2b3240', '#242a36', '#2f333e', '#28303c'],
        win: { pitchX: 7, pitchY: 9, w: 3.2, h: 4.2, litFloor: 0.3, lit: 0.3, alpha: 0.62, unlit: true },
        beaconAt: 330
      },
      near: {
        factor: 0.48, yFactor: 0.2, base: 64, range: 90, wMin: 50, wMax: 150, gap: 0.5, sink: 0,
        colors: ['#1d222b', '#21262f', '#1a1e26'],
        win: { pitchX: 11, pitchY: 13, w: 5, h: 4, litFloor: 0.25, lit: 0.28, alpha: 0.5, unlit: false },
        beaconAt: 9999
      }
    };

    this.fore = {
      key: 'cyber_fore',
      profile: new TerrainProfile({ seed: seed + 71, base: 26, amp: 8, wavelength: 420, octaves: 2, regionLength: 3000, regionAmp: 0.5, minElev: 10 }),
      factor: 0.95, yFactor: 0.32, step: 24, s: 1.2,
      colors: ['#2c323d', '#262b35', '#1f232b'],
      lightColor: '#c6d2e2', shadowColor: '#0e1117', litAlpha: 0.1, shadeAlpha: 0.18, bandDepth: 14,
      rimColor: '#c9d4e2', rimAlpha: 0.16, rimWidth: 1.2
    };

    this.railElev = 182;
    this.train = { x: -9999, speed: 0, cooldown: 4 };
    this.steam = [];

    this.buildStreamers();
    this.initStars();
    this.initRain();
  }

  districtAt(wx, salt = 0) {
    return valueNoise1D(this.seed + 500 + salt, wx / 2300) * 0.5 + 0.5;
  }

  buildStreamers() {
    const S = this.seed;
    this.farCity = new PropStreamer({ seed: S + 301, chunkSize: 600, spacing: 34, jitter: 0.3, maxChunks: 8, generate: (rng, wx) => this.makeBuilding(rng, wx, 'far') });
    this.midCity = new PropStreamer({ seed: S + 331, chunkSize: 560, spacing: 58, jitter: 0.5, maxChunks: 10, generate: (rng, wx) => this.makeBuilding(rng, wx, 'mid') });
    this.nearCity = new PropStreamer({ seed: S + 361, chunkSize: 600, spacing: 100, jitter: 0.3, maxChunks: 10, generate: (rng, wx) => this.makeBuilding(rng, wx, 'near') });
    this.lamps = new PropStreamer({ seed: S + 391, chunkSize: 660, spacing: 220, jitter: 0.25, maxChunks: 8, generate: (rng) => (rng() < 0.8 ? { kind: 'lamp', h: 34 + rng() * 8 } : null) });
    this.allStreamers = [this.farCity, this.midCity, this.nearCity, this.lamps];
  }

  makeBuilding(rng, wx, tier) {
    const cfg = this.tiers[tier];
    const d = this.districtAt(wx, tier === 'near' ? 40 : 0);
    if (rng() < cfg.gap * (1.2 - d)) return null;

    if (tier === 'near' && rng() < 0.16) {
      return { kind: 'stack', w: 16 + rng() * 6, elev: 190 + rng() * 60, color: mixHex('#4a4f59', FOG, 0.05), seed: Math.floor(rng() * 1e9) };
    }

    const w = cfg.wMin + rng() * (cfg.wMax - cfg.wMin);
    const elev = cfg.base + Math.pow(d, 1.5) * cfg.range * (0.55 + rng() * 0.45);
    return {
      kind: 'bldg', w, elev,
      color: pick(rng, cfg.colors),
      setback: rng() < 0.32 && elev > cfg.base + 40,
      roof: pick(rng, ['none', 'tank', 'antenna', 'none', 'vent']),
      seed: Math.floor(rng() * 1e9),
      beacon: elev > cfg.beaconAt,
      phase: rng() * Math.PI * 2
    };
  }

  bakeBuilding(p, tier) {
    const cfg = this.tiers[tier];
    const L = this.bg.light;
    const box = { w: p.w + 8, h: p.elev + 34 };
    return ClayProps.bake(this.bg, box, (c) => {
      const w = p.w;
      const h = p.elev;
      if (p.kind === 'stack') {
        // Industrial chimney: tapered cylinder with two muted bands
        const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, mixHex(p.color, '#c8d2e0', 0.2));
        g.addColorStop(0.45, p.color);
        g.addColorStop(1, mixHex(p.color, '#0d1016', 0.4));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(-w / 2, 6);
        c.lineTo(-w * 0.38, -h);
        c.lineTo(w * 0.38, -h);
        c.lineTo(w / 2, 6);
        c.closePath();
        c.fill();
        c.fillStyle = 'rgba(150, 110, 90, 0.35)';
        c.fillRect(-w * 0.4, -h + 10, w * 0.8, 4);
        c.fillRect(-w * 0.41, -h + 22, w * 0.82, 4);
        return;
      }

      let bodyTop = -h;
      if (p.setback) {
        const sw = w * 0.6;
        ClayProps.softBox(c, -sw / 2, -h, sw, h * 0.3, 2, mixHex(p.color, '#0d1016', 0.04), L, 0.14, 0.3);
        bodyTop = -h + h * 0.16;
      }
      ClayProps.softBox(c, -w / 2, bodyTop, w, -bodyTop + 8, 2.5, p.color, L, 0.1, 0.3);

      // Roof details
      if (p.roof === 'tank') {
        const tx = (p.seed % 2 ? 0.2 : -0.2) * w;
        c.fillStyle = mixHex(p.color, '#0d1016', 0.25);
        c.fillRect(tx - 1.5, -h - 4, 1.2, 4);
        c.fillRect(tx + 4.5, -h - 4, 1.2, 4);
        ClayProps.softBox(c, tx - 2.5, -h - 12, 9, 9, 3, mixHex(p.color, '#b9a48c', 0.15), L, 0.15, 0.3);
      } else if (p.roof === 'antenna') {
        c.strokeStyle = mixHex(p.color, '#a8b4c4', 0.3);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, -h);
        c.lineTo(0, -h - 22);
        c.stroke();
      } else if (p.roof === 'vent') {
        ClayProps.softBox(c, -w * 0.3, -h - 5, w * 0.24, 6, 2, mixHex(p.color, '#0d1016', 0.12), L, 0.12, 0.3);
      }

      // Windows: hashed per building & floor (whole floors dark/lit like real offices)
      const win = cfg.win;
      const rng = mulberry32(p.seed);
      const left = -w / 2 + 4;
      const cols = Math.max(1, Math.floor((w - 8) / win.pitchX));
      const rows = Math.floor((-bodyTop - 12) / win.pitchY);
      const offX = left + ((w - 8) - cols * win.pitchX) / 2 + (win.pitchX - win.w) / 2;
      for (let r = 0; r < rows; r++) {
        const floorLit = rng() < win.litFloor;
        const y = bodyTop + 8 + r * win.pitchY;
        for (let k = 0; k < cols; k++) {
          const lit = floorLit ? rng() < win.lit + 0.2 : rng() < win.lit * 0.1;
          const x = offX + k * win.pitchX;
          if (lit) {
            const warm = rng() < 0.75;
            c.fillStyle = warm ? rgba('#d9be8a', win.alpha * (0.6 + rng() * 0.4)) : rgba('#a3b8cb', win.alpha * 0.7);
            c.fillRect(x, y, win.w, win.h);
          } else if (win.unlit) {
            c.fillStyle = 'rgba(12, 16, 24, 0.1)';
            c.fillRect(x, y, win.w, win.h);
          }
        }
      }
    });
  }

  initStars() {
    const rng = mulberry32(this.seed + 7);
    this.stars = [];
    for (let i = 0; i < 46; i++) {
      this.stars.push({ x: rng() * this.width, y: rng() * this.height * 0.42, size: 0.6 + rng() * 1.1, phase: rng() * Math.PI * 2, speed: 0.3 + rng() * 0.6 });
    }
  }

  initRain() {
    this.rain = [];
    for (let i = 0; i < 40; i++) {
      this.rain.push({ x: Math.random() * this.width, y: Math.random() * this.height, vx: -120 - Math.random() * 60, vy: 300 + Math.random() * 120, len: 10 + Math.random() * 10, alpha: 0.08 + Math.random() * 0.14 });
    }
  }

  update(dt, speedMultiplier, baseSpeed) {
    // Elevated rail train: occasional, calm pass-bys
    const t = this.train;
    if (t.x < -400 || t.speed === 0) {
      t.cooldown -= dt;
      if (t.cooldown <= 0) {
        t.x = this.width + 200;
        t.speed = 140 + Math.random() * 60;
        t.length = 150 + Math.random() * 80;
        t.cooldown = 10 + Math.random() * 12;
      }
    }
    if (t.speed > 0) t.x -= (t.speed + 80 * speedMultiplier * 0.4) * dt;

    for (let i = this.steam.length - 1; i >= 0; i--) {
      const p = this.steam[i];
      p.age += dt;
      p.lx += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 6;
      if (p.age >= p.life) this.steam.splice(i, 1);
    }

    for (const p of this.rain) {
      p.x += p.vx * dt * speedMultiplier;
      p.y += p.vy * dt;
      if (p.x < -50 || p.y > this.height + 50) {
        p.x = Math.random() * (this.width + 200);
        p.y = -Math.random() * 100;
      }
    }
  }

  drawCity(ctx, streamer, tier) {
    const bg = this.bg;
    const cfg = this.tiers[tier];
    const lx = bg.layerX(cfg.factor);
    const yShift = bg.cameraYShift * cfg.yFactor;
    const H = this.height;
    streamer.forEachVisible(lx, this.width, 160, (p, sx) => {
      if (!p.sprite) p.sprite = this.bakeBuilding(p, tier);
      const gy = H + yShift + 6;
      ClayProps.drawSprite(ctx, p.sprite, sx, gy);

      if (p.beacon) {
        const a = 0.25 + (Math.sin(bg.tick * 1.8 + p.phase) * 0.5 + 0.5) * 0.3;
        ctx.save();
        ctx.fillStyle = `rgba(200, 120, 105, ${a})`;
        ctx.beginPath();
        ctx.arc(sx, gy - p.elev - 6, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (p.kind === 'stack' && this.steam.length < 40 && Math.random() < 0.06) {
        this.steam.push({ lx: p.worldX, y: H + 6 - p.elev, vx: -6 - Math.random() * 6, vy: -14 - Math.random() * 6, r: 5, age: 0, life: 4 + Math.random() * 2 });
      }
    });
  }

  drawSteam(ctx) {
    if (!this.steam.length) return;
    const bg = this.bg;
    const cfg = this.tiers.near;
    const lx = bg.layerX(cfg.factor);
    const yShift = bg.cameraYShift * cfg.yFactor;
    const grad = bg.getPuffGradient(ctx, '#8d96a5');
    for (const p of this.steam) {
      const t = p.age / p.life;
      ctx.save();
      ctx.globalAlpha = 0.26 * (1 - t) * Math.min(1, p.age * 2);
      ctx.translate(p.lx - lx, p.y + yShift);
      ctx.scale(p.r, p.r * 0.8);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Elevated rail on regularly spaced supports, with an occasional train. */
  drawViaduct(ctx) {
    const bg = this.bg;
    const factor = 0.34;
    const lx = bg.layerX(factor);
    const yShift = bg.cameraYShift * 0.15;
    const H = this.height;
    const y = H - this.railElev + yShift;
    const W = this.width;
    const deckCol = '#2a303b';

    // Pillars (fixed engineering spacing is natural for infrastructure)
    const spacing = 150;
    const first = Math.floor(lx / spacing) - 1;
    for (let i = first; i < first + Math.ceil(W / spacing) + 3; i++) {
      const px = i * spacing - lx;
      const g = ctx.createLinearGradient(px - 5, 0, px + 5, 0);
      g.addColorStop(0, '#3a404d');
      g.addColorStop(1, '#20242c');
      ctx.fillStyle = g;
      ctx.fillRect(px - 5, y + 6, 10, H - y);
    }
    // Deck
    const dg = ctx.createLinearGradient(0, y - 2, 0, y + 9);
    dg.addColorStop(0, '#404756');
    dg.addColorStop(0.3, deckCol);
    dg.addColorStop(1, '#262b35');
    ctx.fillStyle = dg;
    ctx.fillRect(0, y - 2, W, 11);
    ctx.fillStyle = 'rgba(200, 210, 225, 0.12)';
    ctx.fillRect(0, y - 2, W, 1.2);

    // Train
    const t = this.train;
    if (t.speed > 0 && t.x > -t.length - 20 && t.x < W + 40) {
      const ty = y - 10;
      ctx.save();
      ClayProps.softBox(ctx, t.x, ty - 4, t.length, 12, 6, '#4a505d', bg.light, 0.14, 0.3);
      ctx.fillStyle = 'rgba(222, 196, 140, 0.55)';
      for (let k = 12; k < t.length - 14; k += 9) ctx.fillRect(t.x + k, ty - 1, 5, 3);
      ctx.restore();
    }
  }

  drawLamps(ctx) {
    const bg = this.bg;
    const layer = this.fore;
    const lx = bg.layerX(layer.factor);
    const yShift = bg.cameraYShift * layer.yFactor;
    const H = this.height;
    const glow = bg.getPuffGradient(ctx, '#e3b77c');
    this.lamps.forEachVisible(lx, this.width, 80, (p, sx) => {
      if (p.elev === undefined) p.elev = layer.profile.heightAt(p.worldX);
      const gy = H - p.elev + yShift + 2;
      const top = gy - p.h;
      ctx.save();
      ctx.fillStyle = '#1b1f27';
      ctx.fillRect(sx - 1.3, top, 2.6, p.h);
      ctx.fillRect(sx - 1.3, top, 9, 2.4);
      ctx.fillStyle = '#e8c690';
      ctx.fillRect(sx + 5, top + 2, 4, 2);
      ctx.globalAlpha = 0.22;
      ctx.translate(sx + 7, top + 6);
      ctx.scale(34, 26);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  draw(ctx) {
    const bg = this.bg;
    const W = this.width;
    const H = this.height;

    bg.drawSkyGradient(ctx, 'cyber', [
      [0, '#151b29'], [0.45, '#1e2637'], [0.78, '#2d3546'], [1, '#433f49']
    ]);

    // Faint stars
    ctx.save();
    ctx.fillStyle = '#c3cbd8';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.18 + (Math.sin(bg.tick * s.speed + s.phase) * 0.5 + 0.5) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    bg.drawSun(ctx, W * this.moon.x, H * this.moon.y, { radius: 16, core: '#e8ecf1', glow: '#aebdd2', glowAlpha: 0.22, glowRadius: 170, discEdgeAlpha: 0.9 });

    // City glow on the horizon (light pollution), then distant skyline
    bg.drawHorizonFog(ctx, 240, 120, 0.22, '#6a6570');
    this.drawCity(ctx, this.farCity, 'far');
    bg.drawFogBank(ctx, { seed: this.seed + 901, factor: 0.09, yFactor: 0.05, elev: 250, spread: 40, spacing: 220, width: 300, height: 34, alpha: 0.16, color: '#5a6170', drift: 4 });

    this.drawCity(ctx, this.midCity, 'mid');
    bg.drawFogBank(ctx, { seed: this.seed + 911, factor: 0.24, yFactor: 0.1, elev: 190, spread: 30, spacing: 200, width: 260, height: 30, alpha: 0.12, color: '#4e5767', drift: 6 });

    this.drawViaduct(ctx);
    this.drawCity(ctx, this.nearCity, 'near');
    this.drawSteam(ctx);
    bg.drawFogBank(ctx, { seed: this.seed + 921, factor: 0.55, yFactor: 0.2, elev: 80, spread: 16, spacing: 180, width: 230, height: 22, alpha: 0.1, color: '#4f5868', drift: 8, coverage: 0.6 });

    bg.drawTerrainLayer(ctx, this.fore);
    this.drawLamps(ctx);

    bg.drawHeightFog(ctx, 150, 0.06, '#4a5262');
    this.drawRain(ctx);
  }

  drawRain(ctx) {
    ctx.save();
    ctx.strokeStyle = '#9aa6b6';
    ctx.lineWidth = 1;
    for (const p of this.rain) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 4, p.y + p.len);
      ctx.stroke();
    }
    ctx.restore();
  }
}
