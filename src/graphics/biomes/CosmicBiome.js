// World 4: Cosmic Biome (Quiet Deep Space)
// Slow-parallax starfields, soft dust nebulae, a distant ringed gas giant,
// and a flowing, non-repeating asteroid belt with matte clay shading and dust lanes.
import { PropStreamer } from '../PropStreamer.js';
import { mixHex, rgba } from '../ColorUtil.js';
import { valueNoise1D, mulberry32 } from '../Noise.js';
import { BiomeBase, pick } from './BiomeBase.js';

const FOG = '#2a2d45';

export class CosmicBiome extends BiomeBase {
  constructor(bg, seed = 4) {
    super(bg, seed);
    this.lightDir = { x: 0.7, y: -0.7 };
    this.grade = { color: '#23263d', alpha: 0.06 };
    this.planet = { x: 0.73, y: 0.28 };
    this.shootingStars = [];

    this.buildStreamers();
    this.initMotes(26, { vx: -20, vxRand: 25, size: 1, sizeRand: 1.4, alpha: 0.1, alphaRand: 0.18 });
  }

  buildStreamers() {
    const S = this.seed;
    const H = this.height;
    this.starsFar = new PropStreamer({
      seed: S + 11, chunkSize: 800, spacing: 16, jitter: 0.9, maxChunks: 6,
      generate: (rng) => (rng() < 0.55 ? { kind: 'star', y: rng() * H, size: 0.5 + rng() * 0.9, color: pick(rng, ['#c9d2e0', '#d8d2e6', '#e3e1da']), phase: rng() * 6.28, speed: 0.2 + rng() * 0.5 } : null)
    });
    this.starsNear = new PropStreamer({
      seed: S + 23, chunkSize: 900, spacing: 60, jitter: 0.9, maxChunks: 6,
      generate: (rng) => (rng() < 0.5 ? { kind: 'star', y: rng() * H, size: 1 + rng() * 1.1, color: pick(rng, ['#dfe6f0', '#ece4f2', '#f1ece0']), phase: rng() * 6.28, speed: 0.2 + rng() * 0.5 } : null)
    });
    this.nebulae = new PropStreamer({
      seed: S + 37, chunkSize: 1600, spacing: 520, jitter: 0.8, maxChunks: 5,
      generate: (rng) => {
        if (rng() > 0.7) return null;
        const color = pick(rng, ['#5a4f7a', '#3f6280', '#6b5878', '#4b5a80']);
        const puffs = [];
        const n = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          puffs.push({ dx: (rng() - 0.5) * 360, dy: (rng() - 0.5) * 140, rx: 140 + rng() * 200, ry: 70 + rng() * 90, a: 0.13 + rng() * 0.1 });
        }
        return { kind: 'nebula', y: H * (0.2 + rng() * 0.6), color, puffs };
      }
    });
    this.rocksFar = new PropStreamer({
      seed: S + 51, chunkSize: 600, spacing: 34, jitter: 0.9, maxChunks: 8,
      generate: (rng, wx) => this.makeAsteroid(rng, wx, 0.18, 5, 12, 0.5)
    });
    this.rocksNear = new PropStreamer({
      seed: S + 67, chunkSize: 640, spacing: 80, jitter: 0.9, maxChunks: 8,
      generate: (rng, wx) => this.makeAsteroid(rng, wx, 0.45, 10, 38, 0.1)
    });
    this.allStreamers = [this.starsFar, this.starsNear, this.nebulae, this.rocksFar, this.rocksNear];
  }

  /** Asteroid belt: density and vertical flow follow slow noise, so the belt meanders naturally. */
  makeAsteroid(rng, wx, factor, rMin, rMax, fogT) {
    const density = valueNoise1D(this.seed + 300 + factor * 100, wx / 1400) * 0.5 + 0.5;
    if (rng() > density * 0.9) return null;
    const H = this.height;
    const center = H * 0.56 + valueNoise1D(this.seed + 400 + factor * 100, wx / 1800) * H * 0.18;
    const r = rMin + Math.pow(rng(), 1.8) * (rMax - rMin);
    const pts = [];
    const n = 11;
    for (let i = 0; i < n; i++) pts.push(0.72 + rng() * 0.38);
    return {
      kind: 'rock', r, pts, stretch: 1 + rng() * 0.45,
      y: center + (rng() - 0.5) * H * 0.3,
      rot: rng() * Math.PI * 2,
      spin: (rng() - 0.5) * 0.12,
      color: mixHex(pick(rng, ['#6a625c', '#5c5866', '#736a62', '#5f6270', '#7a6f66']), FOG, fogT),
      craters: Math.floor(rng() * 3),
      seed: Math.floor(rng() * 1e9)
    };
  }

  bakeAsteroid(p) {
    if (typeof document === 'undefined') return null;
    const dpr = Math.min(this.bg.dpr || 1, 2);
    const size = Math.ceil(p.r * 2.6 + 6);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(size * dpr);
    canvas.height = Math.ceil(size * dpr);
    const c = canvas.getContext('2d');
    c.scale(dpr, dpr);
    c.translate(size / 2, size / 2);
    c.scale(1, 1 / p.stretch);

    // Smooth irregular silhouette
    const n = p.pts.length;
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2;
      const rr = p.r * p.pts[i % n];
      return [Math.cos(a) * rr, Math.sin(a) * rr];
    };
    c.beginPath();
    const p0 = pt(0);
    const p1 = pt(1);
    c.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    for (let i = 1; i <= n; i++) {
      const a = pt(i);
      const b = pt(i + 1);
      c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    c.closePath();
    const L = this.bg.light;
    const g = c.createRadialGradient(L.x * p.r * 0.4, L.y * p.r * 0.4, p.r * 0.1, 0, 0, p.r * 1.15);
    g.addColorStop(0, mixHex(p.color, '#e9e1d6', 0.28));
    g.addColorStop(0.5, p.color);
    g.addColorStop(1, mixHex(p.color, '#07080d', 0.6));
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();
    const rng = mulberry32(p.seed);
    for (let k = 0; k < p.craters; k++) {
      const cx = (rng() - 0.5) * p.r;
      const cy = (rng() - 0.5) * p.r;
      const cr = p.r * (0.14 + rng() * 0.14);
      c.fillStyle = 'rgba(10, 10, 16, 0.28)';
      c.beginPath();
      c.ellipse(cx, cy, cr, cr * 0.85, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(240, 232, 220, 0.12)';
      c.beginPath();
      c.ellipse(cx - cr * 0.25, cy - cr * 0.25, cr * 0.6, cr * 0.5, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    return { canvas, size };
  }

  update(dt, speedMultiplier) {
    if (Math.random() < 0.003 && this.shootingStars.length < 1) {
      this.shootingStars.push({ x: this.width * (0.4 + Math.random() * 0.6), y: Math.random() * this.height * 0.4, vx: -420, vy: 140, life: 0.7, maxLife: 0.7 });
    }
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const s = this.shootingStars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) this.shootingStars.splice(i, 1);
    }
    this.updateMotes(dt, speedMultiplier);
  }

  drawStars(ctx, streamer, factor) {
    const bg = this.bg;
    const lx = bg.layerX(factor);
    ctx.save();
    streamer.forEachVisible(lx, this.width, 10, (s, sx) => {
      ctx.globalAlpha = 0.35 + (Math.sin(bg.tick * s.speed + s.phase) * 0.5 + 0.5) * 0.4;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sx, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawNebulae(ctx) {
    const bg = this.bg;
    const lx = bg.layerX(0.03);
    this.nebulae.forEachVisible(lx, this.width, 600, (n, sx) => {
      const grad = bg.getPuffGradient(ctx, n.color);
      for (const p of n.puffs) {
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.translate(sx + p.dx, n.y + p.dy);
        ctx.scale(p.rx, p.ry);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  /**
   * Distant ringed gas giant: a calm, instantly readable focal point
   * (replaces the former swirling singularity, which read as an ambiguous "eye").
   */
  drawPlanet(ctx) {
    const bg = this.bg;
    const L = bg.light;
    const cx = this.width * this.planet.x;
    const cy = this.height * this.planet.y + bg.cameraYShift * 0.03;
    const R = 62;
    const tilt = -0.32;
    const ringRx = R * 2.05;
    const ringRy = R * 0.42;

    const drawRing = (front) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.beginPath();
      if (front) ctx.rect(-ringRx - 4, 0, ringRx * 2 + 8, ringRy + 6);
      else ctx.rect(-ringRx - 4, -ringRy - 6, ringRx * 2 + 8, ringRy + 6);
      ctx.clip();
      for (const [k, a, w] of [[1.0, 0.32, 5], [0.86, 0.22, 7], [0.74, 0.14, 4]]) {
        ctx.strokeStyle = `rgba(206, 196, 184, ${a})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.ellipse(0, 0, ringRx * k, ringRy * k, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    // Soft atmospheric glow
    ctx.save();
    const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.2);
    halo.addColorStop(0, 'rgba(170, 160, 190, 0.12)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - R * 2.2, cy - R * 2.2, R * 4.4, R * 4.4);
    ctx.restore();

    drawRing(false);

    // Planet body with muted bands and soft terminator
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    const body = ctx.createRadialGradient(cx + L.x * R * 0.45, cy + L.y * R * 0.45, R * 0.1, cx, cy, R * 1.05);
    body.addColorStop(0, '#c9bcae');
    body.addColorStop(0.55, '#9a8c82');
    body.addColorStop(1, '#4a4350');
    ctx.fillStyle = body;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    const bands = [[-0.55, 0.1, 0.1], [-0.25, 0.14, 0.08], [0.08, 0.08, 0.1], [0.38, 0.16, 0.07], [0.66, 0.08, 0.09]];
    for (const [y, h, a] of bands) {
      ctx.fillStyle = `rgba(70, 58, 60, ${a})`;
      ctx.fillRect(-R * 1.2, y * R, R * 2.4, h * R);
    }
    ctx.rotate(-tilt);
    const term = ctx.createLinearGradient(L.x * R, L.y * R, -L.x * R, -L.y * R);
    term.addColorStop(0, 'rgba(10, 12, 22, 0)');
    term.addColorStop(0.55, 'rgba(10, 12, 22, 0.1)');
    term.addColorStop(1, 'rgba(10, 12, 22, 0.6)');
    ctx.fillStyle = term;
    ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();

    drawRing(true);
  }

  drawAsteroids(ctx, streamer, factor) {
    const bg = this.bg;
    const lx = bg.layerX(factor);
    const yShift = bg.cameraYShift * factor * 0.4;
    streamer.forEachVisible(lx, this.width, 60, (p, sx) => {
      if (!p.sprite) p.sprite = this.bakeAsteroid(p);
      if (!p.sprite) return;
      const sz = p.sprite.size;
      ctx.drawImage(p.sprite.canvas, sx - sz / 2, p.y + yShift - sz / 2, sz, sz);
    });
  }

  draw(ctx) {
    const bg = this.bg;
    bg.drawSkyGradient(ctx, 'cosmic', [
      [0, '#0b0e19'], [0.5, '#11152a'], [1, '#1a1c31']
    ]);
    this.drawStars(ctx, this.starsFar, 0.012);
    this.drawNebulae(ctx);
    this.drawStars(ctx, this.starsNear, 0.03);
    this.drawPlanet(ctx);

    bg.drawFogBank(ctx, { seed: this.seed + 901, factor: 0.08, yFactor: 0.03, elev: 470, spread: 120, spacing: 260, width: 340, height: 60, alpha: 0.14, color: '#343757', drift: 3 });
    this.drawAsteroids(ctx, this.rocksFar, 0.18);
    bg.drawFogBank(ctx, { seed: this.seed + 911, factor: 0.22, yFactor: 0.06, elev: 300, spread: 140, spacing: 240, width: 320, height: 50, alpha: 0.12, color: '#2f3250', drift: 5 });
    this.drawAsteroids(ctx, this.rocksNear, 0.45);
    bg.drawFogBank(ctx, { seed: this.seed + 921, factor: 0.5, yFactor: 0.1, elev: 140, spread: 100, spacing: 220, width: 300, height: 40, alpha: 0.08, color: '#363955', drift: 8, coverage: 0.5 });

    this.drawShootingStars(ctx);
    this.drawMotes(ctx, '#b9b6d4');
  }

  drawShootingStars(ctx) {
    ctx.save();
    for (const s of this.shootingStars) {
      const a = Math.max(0, s.life / s.maxLife) * 0.5;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      g.addColorStop(0, rgba('#f2efe8', a));
      g.addColorStop(1, rgba('#f2efe8', 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }
}
