// Cinematic Procedural Clay Parallax Engine for Platypus AI
// - Continuous world-space scrolling (no modulo wrap -> no seams, no looping)
// - Non-repeating noise terrain with smooth clay bevels and slope-aware sun shading
// - Aerial perspective, layered volumetric fog puffs, soft height fog
// - Procedural cumulus clouds, global light direction, soft color grading
// - Smooth crossfade between biomes
import { ClayTexture } from './ClayTexture.js';
import { rand01, valueNoise1D, mulberry32, seedFromString } from './Noise.js';
import { hexToRgb, rgba } from './ColorUtil.js';
import { ValleyBiome } from './biomes/ValleyBiome.js';
import { CanyonBiome } from './biomes/CanyonBiome.js';
import { CyberBiome } from './biomes/CyberBiome.js';
import { CosmicBiome } from './biomes/CosmicBiome.js';

export const BIOMES = {
  VALLEY: {
    name: 'CLAY VALLEY',
    description: 'Pastoral Plasticine Valley with Alpine Ranges, Lakes, Villages & Forests'
  },
  CANYON: {
    name: 'SUNSET CANYON',
    description: 'Layered Sandstone Mesas, Buttes & Desert Basins at Dusk'
  },
  CYBER_NIGHT: {
    name: 'MIDNIGHT CYBER-CLAY',
    description: 'Calm Night Metropolis with Districts, Industry & Wet Smog'
  },
  COSMIC_VOID: {
    name: 'COSMIC SINGULARITY',
    description: 'Quiet Deep Space with Dust Nebulae, Distant Singularity & Asteroid Fields'
  }
};

const TRANSITION_DURATION = 1.8;

export class ParallaxBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    // Continuous world scroll distance (px at parallax factor 1.0). Never wrapped.
    this.distance = 0;

    // 3D Vertical Parallax Elevation (Controlled by player altitude)
    this.cameraYShift = 0;
    this.targetCameraYShift = 0;

    this.tick = 0;
    this.speedMultiplier = 1;

    // Boss Tension grading
    this.isBoss = false;
    this.bossDarken = 0;

    // Global key light (direction TOWARD the light, screen space, y down). Set per biome.
    this.light = { x: 0.55, y: -0.83 };

    // Caches
    this.gradientCache = new Map();
    this.puffGradientCache = new Map();

    // Zero-allocation flat buffers for terrain passes
    this.maxTerrainPoints = 400;
    this.ridgeX = new Float32Array(this.maxTerrainPoints);
    this.ridgeY = new Float32Array(this.maxTerrainPoints);
    this.slopeShade = new Float32Array(this.maxTerrainPoints);
    this.ridgeShadeRaw = new Float32Array(this.maxTerrainPoints);

    // Biome crossfade
    this.prevEngine = null;
    this.transition = 0;
    this.transitionCanvas = null;
    this.transitionCtx = null;

    this.biomeEngines = {
      VALLEY: new ValleyBiome(this, seedFromString('valley')),
      CANYON: new CanyonBiome(this, seedFromString('canyon')),
      CYBER_NIGHT: new CyberBiome(this, seedFromString('cyber')),
      COSMIC_VOID: new CosmicBiome(this, seedFromString('cosmic'))
    };

    this.currentBiomeKey = 'VALLEY';
    this.currentEngine = this.biomeEngines.VALLEY;
    this.biome = BIOMES.VALLEY;
    this.applyEngineLight(this.currentEngine);
    this.hasDrawn = false;
  }

  // Backwards-compatible derived offsets (unwrapped)
  get cloudOffset() { return this.distance * 0.08; }
  get farMountainOffset() { return this.distance * 0.12; }
  get nearMountainOffset() { return this.distance * 0.25; }
  get midHillOffset() { return this.distance * 0.5; }
  get nearHillOffset() { return this.distance * 1.0; }
  get islandOffset() { return this.distance * 1.2; }
  get foregroundOffset() { return this.distance * 1.6; }

  layerX(factor) {
    return this.distance * factor;
  }

  applyEngineLight(engine) {
    if (engine && engine.lightDir) {
      const l = engine.lightDir;
      const len = Math.hypot(l.x, l.y) || 1;
      this.light = { x: l.x / len, y: l.y / len };
    }
  }

  onResize(dpr = 1) {
    this.dpr = dpr;
    this.gradientCache.clear();
    this.puffGradientCache.clear();
    this.transitionCanvas = null;
    this.transitionCtx = null;
    for (const key of Object.keys(this.biomeEngines)) {
      this.biomeEngines[key].onResize(this.width, this.height);
    }
  }

  setBiome(biomeKey) {
    if (!this.biomeEngines[biomeKey] || this.currentBiomeKey === biomeKey) return;
    if (this.hasDrawn && this.currentEngine) {
      this.prevEngine = this.currentEngine;
      this.transition = 1;
    }
    this.currentBiomeKey = biomeKey;
    this.currentEngine = this.biomeEngines[biomeKey];
    this.biome = BIOMES[biomeKey] || BIOMES.VALLEY;
    this.applyEngineLight(this.currentEngine);
    this.gradientCache.clear();
  }

  setBossMode(isBoss, bossType = null) {
    this.isBoss = Boolean(isBoss);
  }

  /**
   * Update world scroll and 3D camera elevation
   */
  update(dt, speedMultiplier = 1, playerYRatio = 0.5, playerPitch = 0) {
    this.tick += dt;
    this.speedMultiplier = speedMultiplier;
    const baseSpeed = 80 * speedMultiplier * dt;
    this.distance += baseSpeed;

    this.targetCameraYShift = (playerYRatio - 0.5) * 42;
    this.cameraYShift += (this.targetCameraYShift - this.cameraYShift) * Math.min(1.0, dt * 3.5);

    const targetDarken = this.isBoss ? 1.0 : 0.0;
    this.bossDarken += (targetDarken - this.bossDarken) * Math.min(1.0, dt * 1.5);

    if (this.currentEngine && this.currentEngine.update) {
      this.currentEngine.update(dt, speedMultiplier, baseSpeed);
    }
    if (this.prevEngine) {
      this.transition -= dt / TRANSITION_DURATION;
      if (this.transition <= 0) {
        this.transition = 0;
        this.prevEngine = null;
      } else if (this.prevEngine.update) {
        this.prevEngine.update(dt, speedMultiplier, baseSpeed);
      }
    }
  }

  draw(ctx) {
    this.hasDrawn = true;
    if (this.currentEngine) {
      this.applyEngineLight(this.currentEngine);
      this.currentEngine.draw(ctx, this.bossDarken);
      this.drawGrade(ctx, this.currentEngine.grade);
    }

    // Crossfade the previous biome out (rendered offscreen to avoid alpha bleed between layers)
    if (this.prevEngine && this.transition > 0) {
      const off = this.getTransitionContext();
      if (off) {
        const octx = off.ctx;
        octx.setTransform(1, 0, 0, 1, 0, 0);
        octx.clearRect(0, 0, off.canvas.width, off.canvas.height);
        octx.setTransform(off.scale, 0, 0, off.scale, 0, 0);
        this.applyEngineLight(this.prevEngine);
        this.prevEngine.draw(octx, this.bossDarken);
        this.drawGrade(octx, this.prevEngine.grade);
        this.applyEngineLight(this.currentEngine);

        const t = this.transition;
        ctx.save();
        ctx.globalAlpha = t * t * (3 - 2 * t);
        ctx.drawImage(off.canvas, 0, 0, this.width, this.height);
        ctx.restore();
      }
    }

    // Boss tension: calm, cool dimming rather than a harsh color switch
    if (this.bossDarken > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(12, 16, 30, ${0.26 * this.bossDarken})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  getTransitionContext() {
    if (typeof document === 'undefined') return null;
    const scale = Math.min(this.dpr || 1, 1.5);
    const w = Math.ceil(this.width * scale);
    const h = Math.ceil(this.height * scale);
    if (!this.transitionCanvas || this.transitionCanvas.width !== w || this.transitionCanvas.height !== h) {
      this.transitionCanvas = document.createElement('canvas');
      this.transitionCanvas.width = w;
      this.transitionCanvas.height = h;
      this.transitionCtx = this.transitionCanvas.getContext('2d');
    }
    return { canvas: this.transitionCanvas, ctx: this.transitionCtx, scale };
  }

  /** Unifying soft grade: lifts shadows toward a tint, lowering harsh contrast. */
  drawGrade(ctx, grade) {
    if (!grade) return;
    ctx.save();
    ctx.fillStyle = rgba(grade.color, grade.alpha);
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  // =========================================================================
  // --- TERRAIN -------------------------------------------------------------
  // =========================================================================

  /** Screen Y of a terrain surface at a given world X for a layer. */
  groundY(layer, worldX) {
    return this.height - layer.profile.heightAt(worldX) + this.cameraYShift * layer.yFactor;
  }

  /**
   * Draw a non-repeating clay terrain layer.
   * layer = {
   *   key, profile, factor, yFactor, step,
   *   colors: [top, mid, bottom],
   *   lightColor, shadowColor, litAlpha, shadeAlpha, bandDepth,
   *   rimColor, rimAlpha, rimWidth
   * }
   */
  drawTerrainLayer(ctx, layer) {
    const h = this.height;
    const W = this.width;
    const step = layer.step || 20;
    const lx = this.distance * layer.factor;
    const yShift = this.cameraYShift * layer.yFactor;
    const startWorld = Math.floor(lx / step) * step;
    const n = Math.min(this.maxTerrainPoints - 2, Math.ceil(W / step) + 3);
    const profile = layer.profile;

    for (let i = 0; i <= n; i++) {
      const wx = startWorld + (i - 1) * step;
      this.ridgeX[i] = wx - lx;
      this.ridgeY[i] = h - profile.heightAt(wx);
    }

    // Slope-aware Lambert shading relative to flat ground (positive = sunlit, negative = shade).
    // Slopes are measured over a wide baseline and blurred so shading reads as broad, soft planes.
    const L = this.light;
    const flatDot = -L.y;
    const span = Math.max(1, Math.round((layer.shadeSpan || 36) / step));
    for (let i = 0; i <= n; i++) {
      const i0 = Math.max(0, i - span);
      const i1 = Math.min(n, i + span);
      const dy = (this.ridgeY[i1] - this.ridgeY[i0]) / ((i1 - i0) * step);
      const len = Math.sqrt(dy * dy + 1);
      const dot = (dy * L.x - L.y) / len;
      this.ridgeShadeRaw[i] = Math.max(-1, Math.min(1, (dot - flatDot) * 2.2));
    }
    for (let i = 0; i <= n; i++) {
      let sum = 0;
      let cnt = 0;
      for (let k = -2; k <= 2; k++) {
        const j = i + k;
        if (j < 0 || j > n) continue;
        sum += this.ridgeShadeRaw[j];
        cnt++;
      }
      this.slopeShade[i] = sum / cnt;
    }

    ctx.save();
    ctx.translate(0, yShift);

    // Smooth clay ridge path (quadratic through midpoints)
    const ridge = new Path2D();
    this.traceRidge(ridge, n, 0);
    const body = new Path2D();
    body.moveTo(this.ridgeX[0], h + 60);
    body.lineTo(this.ridgeX[0], this.ridgeY[0]);
    this.traceRidge(body, n, 0, true);
    body.lineTo(this.ridgeX[n], h + 60);
    body.closePath();

    // 1. Body fill with vertical clay gradient (already aerial-mixed by the biome)
    ctx.fillStyle = this.getTerrainGradient(ctx, layer);
    ctx.fill(body);

    // 2. Slope shading bands (soft vertical falloff via stacked translucent bands)
    ctx.save();
    ctx.clip(body);
    const shadeGrad = ctx.createLinearGradient(0, 0, W, 0);
    const litAlpha = layer.litAlpha !== undefined ? layer.litAlpha : 0.22;
    const shadeAlpha = layer.shadeAlpha !== undefined ? layer.shadeAlpha : 0.22;
    const lc = hexToRgb(layer.lightColor || '#fff4dc');
    const sc = hexToRgb(layer.shadowColor || '#1a2433');
    let lastOff = -1;
    for (let i = 0; i <= n; i++) {
      const off = this.ridgeX[i] / W;
      if (off < 0 || off > 1 || off <= lastOff) continue;
      const s = this.slopeShade[i];
      const col = s >= 0
        ? `rgba(${lc.r}, ${lc.g}, ${lc.b}, ${(s * litAlpha).toFixed(3)})`
        : `rgba(${sc.r}, ${sc.g}, ${sc.b}, ${(-s * shadeAlpha).toFixed(3)})`;
      shadeGrad.addColorStop(off, col);
      lastOff = off;
    }
    ctx.fillStyle = shadeGrad;
    const depth = layer.bandDepth || 46;
    const bands = 4;
    ctx.globalAlpha = 0.34;
    for (let b = 1; b <= bands; b++) {
      const d = (depth * b) / bands;
      const band = new Path2D();
      band.moveTo(this.ridgeX[0], this.ridgeY[0] - 2);
      this.traceRidge(band, n, -2, true);
      for (let i = n; i >= 0; i--) band.lineTo(this.ridgeX[i], this.ridgeY[i] + d);
      band.closePath();
      ctx.fill(band);
    }
    ctx.globalAlpha = 1;

    // Geological sediment strata (horizontal, irregular thickness, very soft)
    if (layer.strata) {
      const st = layer.strata;
      const top = h - (profile.base + profile.amp * 1.4 + (profile.regionLift || 0));
      let y = top;
      for (let k = 0; y < h + 40 && k < 64; k++) {
        const th = st.spacing * (0.45 + rand01(st.seed, k) * 1.1);
        const a = st.alpha * (0.5 + rand01(st.seed, k, 2) * 0.7);
        ctx.fillStyle = k % 2 === 0 ? rgba(st.dark, a) : rgba(st.light, a * 0.8);
        ctx.fillRect(0, y, W, th * 0.5);
        y += th;
      }
    }

    // Ambient occlusion: gently darker toward the base of the layer
    if (layer.aoAlpha) {
      const ao = this.getCachedLinear(ctx, `ao_${layer.key}_${h}`, 0, h - (layer.profile.base * 0.65), 0, h + 10, [
        [0, 'rgba(0,0,0,0)'],
        [1, rgba(layer.shadowColor || '#1a2433', layer.aoAlpha)]
      ]);
      ctx.fillStyle = ao;
      ctx.fillRect(0, h - layer.profile.base * 0.65, W, layer.profile.base * 0.65 + 70);
    }

    // Subtle plasticine micro-texture (scrolls with the land; very low alpha)
    if (layer.textureAlpha) {
      const pat = ClayTexture.getPattern(ctx);
      if (pat) {
        ctx.translate(-(lx % 128), 0);
        ctx.globalAlpha = layer.textureAlpha;
        ctx.fillStyle = pat;
        ctx.fillRect(-128, 0, W + 256, h + 60);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    // 3. Soft rim light along the crest (single continuous stroke)
    if (layer.rimAlpha) {
      const rc = hexToRgb(layer.rimColor || '#fff6e6');
      const rimGrad = ctx.createLinearGradient(0, 0, W, 0);
      lastOff = -1;
      for (let i = 0; i <= n; i += 2) {
        const off = this.ridgeX[i] / W;
        if (off < 0 || off > 1 || off <= lastOff) continue;
        const s = Math.max(0, this.slopeShade[i]);
        rimGrad.addColorStop(off, `rgba(${rc.r}, ${rc.g}, ${rc.b}, ${(layer.rimAlpha * (0.45 + 0.55 * s)).toFixed(3)})`);
        lastOff = off;
      }
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = layer.rimWidth || 1.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.translate(0, (layer.rimWidth || 1.6) * 0.5);
      ctx.stroke(ridge);
    }

    ctx.restore();
  }

  traceRidge(path, n, yOff = 0, continuing = false) {
    const X = this.ridgeX;
    const Y = this.ridgeY;
    if (!continuing) path.moveTo(X[0], Y[0] + yOff);
    for (let i = 1; i < n; i++) {
      const mx = (X[i] + X[i + 1]) * 0.5;
      const my = (Y[i] + Y[i + 1]) * 0.5 + yOff;
      path.quadraticCurveTo(X[i], Y[i] + yOff, mx, my);
    }
    path.lineTo(X[n], Y[n] + yOff);
  }

  getTerrainGradient(ctx, layer) {
    const key = `terrain_${layer.key}_${this.height}`;
    let grad = this.gradientCache.get(key);
    if (!grad) {
      const top = this.height - (layer.profile.base + layer.profile.amp * 1.2 + (layer.profile.regionLift || 0) * 0.5);
      grad = ctx.createLinearGradient(0, top, 0, this.height);
      grad.addColorStop(0, layer.colors[0]);
      grad.addColorStop(0.45, layer.colors[1]);
      grad.addColorStop(1, layer.colors[2]);
      this.gradientCache.set(key, grad);
    }
    return grad;
  }

  getCachedLinear(ctx, key, x0, y0, x1, y1, stops) {
    let grad = this.gradientCache.get(key);
    if (!grad) {
      grad = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const [o, c] of stops) grad.addColorStop(o, c);
      this.gradientCache.set(key, grad);
    }
    return grad;
  }

  // =========================================================================
  // --- SKY, SUN & ATMOSPHERE -----------------------------------------------
  // =========================================================================

  /** Vertical sky gradient from an array of [offset, color] stops (cached). */
  drawSkyGradient(ctx, key, stops) {
    ctx.fillStyle = this.getCachedLinear(ctx, `sky_${key}_${this.height}`, 0, 0, 0, this.height, stops);
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Soft sun disc with layered bloom. */
  drawSun(ctx, x, y, opts = {}) {
    const radius = opts.radius || 22;
    const glowRadius = opts.glowRadius || 220;
    const core = opts.core || '#fffaf0';
    const glow = opts.glow || '#ffe9c4';
    const glowAlpha = opts.glowAlpha !== undefined ? opts.glowAlpha : 0.4;

    ctx.save();
    const g = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowRadius);
    g.addColorStop(0, rgba(glow, glowAlpha));
    g.addColorStop(0.25, rgba(glow, glowAlpha * 0.45));
    g.addColorStop(0.6, rgba(glow, glowAlpha * 0.12));
    g.addColorStop(1, rgba(glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);

    if (opts.disc !== false) {
      const d = ctx.createRadialGradient(x - radius * 0.25, y - radius * 0.25, radius * 0.1, x, y, radius);
      d.addColorStop(0, core);
      d.addColorStop(1, rgba(core, opts.discEdgeAlpha !== undefined ? opts.discEdgeAlpha : 0.85));
      ctx.fillStyle = d;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Gentle crepuscular rays (very slow, low alpha).
   */
  drawGodRays(ctx, sunX, sunY, rayCount = 5, maxRadius = 650, alpha = 0.06, rayColorHex = '#fff8db', baseAngle = Math.PI * 0.62) {
    ctx.save();
    const t = this.tick * 0.05;
    for (let i = 0; i < rayCount; i++) {
      const spread = (i - (rayCount - 1) / 2) * 0.16;
      const angle = baseAngle + spread + Math.sin(t + i * 1.7) * 0.02;
      const beamWidth = 0.05 + rand01(91, i) * 0.05;
      const beamLen = maxRadius * (0.75 + rand01(92, i) * 0.25);

      const a1 = angle - beamWidth * 0.5;
      const a2 = angle + beamWidth * 0.5;
      const grad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, beamLen);
      const curAlpha = alpha * (0.75 + Math.sin(t * 1.3 + i * 0.9) * 0.25);
      grad.addColorStop(0, rgba(rayColorHex, curAlpha));
      grad.addColorStop(0.45, rgba(rayColorHex, curAlpha * 0.5));
      grad.addColorStop(1, rgba(rayColorHex, 0));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(a1) * beamLen, sunY + Math.sin(a1) * beamLen);
      ctx.lineTo(sunX + Math.cos(a2) * beamLen, sunY + Math.sin(a2) * beamLen);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Horizon Depth Fog: uniform soft atmospheric blanket around a given elevation.
   */
  drawHorizonFog(ctx, baseHeight, fogHeight = 90, alpha = 0.16, colorHex = '#e0f0fa') {
    const h = this.height;
    const topY = h - baseHeight - fogHeight;
    const totalH = fogHeight * 2;
    const grad = this.getCachedLinear(ctx, `hfog_${baseHeight}_${fogHeight}_${alpha}_${colorHex}_${h}`, 0, topY, 0, topY + totalH, [
      [0, rgba(colorHex, 0)],
      [0.45, rgba(colorHex, alpha)],
      [0.7, rgba(colorHex, alpha * 0.75)],
      [1, rgba(colorHex, 0)]
    ]);
    ctx.save();
    ctx.translate(0, this.cameraYShift * 0.06);
    ctx.fillStyle = grad;
    ctx.fillRect(0, topY, this.width, totalH);
    ctx.restore();
  }

  /** Ground-hugging height fog that thickens toward the bottom of the frame. */
  drawHeightFog(ctx, topElev, alpha, colorHex) {
    const h = this.height;
    const grad = this.getCachedLinear(ctx, `heightfog_${topElev}_${alpha}_${colorHex}_${h}`, 0, h - topElev, 0, h, [
      [0, rgba(colorHex, 0)],
      [1, rgba(colorHex, alpha)]
    ]);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - topElev, this.width, topElev);
    ctx.restore();
  }

  getPuffGradient(ctx, colorHex) {
    let g = this.puffGradientCache.get(colorHex);
    if (!g) {
      g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, rgba(colorHex, 1));
      g.addColorStop(0.45, rgba(colorHex, 0.6));
      g.addColorStop(1, rgba(colorHex, 0));
      this.puffGradientCache.set(colorHex, g);
    }
    return g;
  }

  /**
   * Volumetric fog bank built from soft, non-repeating mist puffs.
   * Density varies along the world so the haze reads as real atmosphere, not a stripe.
   * fog = { seed, factor, yFactor, elev, spread, spacing, width, height, alpha, color, drift, coverage }
   */
  drawFogBank(ctx, fog) {
    const W = this.width;
    const h = this.height;
    const spacing = fog.spacing || 150;
    const lx = this.distance * fog.factor + this.tick * (fog.drift || 6);
    const yShift = this.cameraYShift * (fog.yFactor || 0.1);
    const first = Math.floor((lx - spacing * 3) / spacing);
    const last = Math.floor((lx + W + spacing * 3) / spacing);
    const grad = this.getPuffGradient(ctx, fog.color);
    const coverage = fog.coverage !== undefined ? fog.coverage : 0.75;
    const seed = fog.seed;

    for (let c = first; c <= last; c++) {
      // Density field: slow noise decides where fog gathers or thins out
      const density = valueNoise1D(seed + 11, c * 0.18) * 0.5 + 0.5;
      if (rand01(seed, c, 1) > coverage * (0.55 + density * 0.6)) continue;

      const wx = (c + rand01(seed, c, 2)) * spacing;
      const sx = wx - lx;
      const rx = (fog.width || 220) * (0.6 + rand01(seed, c, 3) * 0.8);
      const ry = (fog.height || 40) * (0.6 + rand01(seed, c, 4) * 0.7);
      if (sx + rx < 0 || sx - rx > W) continue;

      const sy = h - fog.elev + (rand01(seed, c, 5) - 0.5) * (fog.spread || 30) + yShift;
      const breathe = 0.85 + Math.sin(this.tick * 0.25 + c * 1.3) * 0.15;

      ctx.save();
      ctx.fillStyle = grad;
      ctx.globalAlpha = Math.min(1, fog.alpha * (0.5 + density * 0.5) * breathe);
      ctx.translate(sx, sy);
      ctx.scale(rx, ry);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Subtle lens atmosphere drawn above gameplay (kept extremely soft).
   */
  drawCinematicAtmosphere(ctx) {
    ctx.save();
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const radius = Math.max(this.width, this.height) * 0.75;
    const key = `vignette_${this.width}_${this.height}`;
    let vigGrad = this.gradientCache.get(key);
    if (!vigGrad) {
      vigGrad = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(1, 'rgba(10, 14, 24, 0.12)');
      this.gradientCache.set(key, vigGrad);
    }
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  // =========================================================================
  // --- CLOUDS --------------------------------------------------------------
  // =========================================================================

  /**
   * Bake a natural flat-bottomed cumulus cloud into an offscreen canvas.
   * pal = { top, base, shadow } ; size = approximate width in px
   */
  bakeCloud(seed, size, pal, opts = {}) {
    if (typeof document === 'undefined') return null;
    const rng = mulberry32(seed);
    const dpr = Math.min(this.dpr || 1, 2);
    const W0 = size;
    const blobs = [];
    let maxR = 0;
    // Base row: wide, low puffs that define the flat cloud floor
    const baseCount = 4 + Math.floor(rng() * 3);
    for (let k = 0; k < baseCount; k++) {
      const t = k / (baseCount - 1);
      const r = W0 * (0.1 + rng() * 0.05) * (0.7 + (1 - Math.abs(t - 0.5) * 2) * 0.4);
      blobs.push({ cx: (t - 0.5) * W0 * 0.8 + (rng() - 0.5) * W0 * 0.05, cy: -r * 0.45, r });
      maxR = Math.max(maxR, r);
    }
    // Towers: fewer, larger puffs rising off-center for an asymmetric, natural crown
    const towerCount = 2 + Math.floor(rng() * 3);
    const towerCenter = (rng() - 0.5) * W0 * 0.25;
    for (let k = 0; k < towerCount; k++) {
      const spread = (k / Math.max(1, towerCount - 1) - 0.5) * W0 * 0.5;
      const r = W0 * (0.14 + rng() * 0.08) * (1 - Math.abs(spread) / W0);
      const cx = towerCenter + spread + (rng() - 0.5) * W0 * 0.06;
      blobs.push({ cx, cy: -r * (0.9 + rng() * 0.35) - W0 * 0.04, r });
      maxR = Math.max(maxR, r);
    }
    // Crown puff
    if (rng() < 0.7) {
      const r = W0 * (0.1 + rng() * 0.05);
      blobs.push({ cx: towerCenter + (rng() - 0.5) * W0 * 0.15, cy: -W0 * 0.24 - r * 0.6, r });
    }
    const flatness = opts.flatness !== undefined ? opts.flatness : 0.18;
    const pad = 12;
    const minX = -W0 * 0.5 - maxR - pad;
    const maxX = W0 * 0.5 + maxR + pad;
    let minY = 0;
    for (const b of blobs) minY = Math.min(minY, b.cy - b.r);
    minY -= pad;
    const baseY = maxR * flatness;
    const maxY = baseY + pad;
    const cw = maxX - minX;
    const ch = maxY - minY;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cw * dpr);
    canvas.height = Math.ceil(ch * dpr);
    const c = canvas.getContext('2d');
    c.scale(dpr, dpr);
    c.translate(-minX, -minY);

    // Flat base: clip below the cloud floor
    c.save();
    c.beginPath();
    c.rect(minX, minY, cw, baseY - minY);
    c.clip();

    // Silhouette in base color
    c.fillStyle = pal.base;
    for (const b of blobs) {
      c.beginPath();
      c.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.ellipse(0, baseY - maxR * 0.3, W0 * 0.36, maxR * 0.4, 0, 0, Math.PI * 2);
    c.fill();

    // Sunlit tops (light from global direction)
    const L = this.light;
    c.globalCompositeOperation = 'source-atop';
    for (const b of blobs) {
      const g = c.createRadialGradient(b.cx + L.x * b.r * 0.45, b.cy + L.y * b.r * 0.45, b.r * 0.1, b.cx, b.cy, b.r * 1.05);
      g.addColorStop(0, rgba(pal.top, 0.95));
      g.addColorStop(0.6, rgba(pal.top, 0.25));
      g.addColorStop(1, rgba(pal.top, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(b.cx, b.cy, b.r * 1.05, 0, Math.PI * 2);
      c.fill();
    }

    // Underside shading
    const under = c.createLinearGradient(0, minY + (baseY - minY) * 0.35, 0, baseY);
    under.addColorStop(0, rgba(pal.shadow, 0));
    under.addColorStop(1, rgba(pal.shadow, 0.75));
    c.fillStyle = under;
    c.fillRect(minX, minY, cw, ch);

    // Micro plasticine texture
    c.globalAlpha = 0.035;
    const pat = ClayTexture.getPattern(c);
    if (pat) {
      c.fillStyle = pat;
      c.fillRect(minX, minY, cw, ch);
    }
    c.restore();

    return { canvas, w: cw, h: ch, ax: -minX, ay: -minY };
  }

  // =========================================================================
  // --- COLOR HELPERS (backwards compatible) --------------------------------
  // =========================================================================

  lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  hexToRgb(hex) {
    return hexToRgb(hex);
  }

  hexToRgba(hex, alpha) {
    return rgba(hex, alpha);
  }
}
