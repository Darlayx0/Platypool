// High-Performance Zero-Allocation Particle Pool & Floating Text System
import { ClayRenderer } from '../graphics/ClayRenderer.js';

class ParticleObject {
  constructor() {
    this.active = false;
    this.type = 'CLAY_CHUNK';
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.color = '#e53935';
    this.shadowColor = '#b71c1c';
    this.rotation = 0;
    this.vRot = 0;
    this.life = 0;
    this.maxLife = 1;
    this.gravity = 0;
    this.growth = 0;
  }

  reset() {
    this.active = false;
    this.gravity = 0;
    this.vRot = 0;
    this.growth = 0;
  }
}

// Floating text typography (kept identical to the original live-drawn style)
const TEXT_FONT = 'bold 22px Luckiest Guy, cursive';
const TEXT_STROKE = '#3e2723';
const TEXT_STROKE_W = 4;
// Generous margin: miter joins on a 4px stroke can overshoot a sharp glyph corner by several px.
const TEXT_PAD = 14;
const TEXT_LINE_H = 22 * 1.6;

class FloatingTextObject {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#ffd54f';
    this.vy = -55;
    this.life = 0;
    this.maxLife = 0.9;

    // Pre-rasterised sprite (lazily created, then reused for the lifetime of the slot)
    this.canvas = null;
    this.sctx = null;
    this.hasSprite = false;
    this.pxW = 0;
    this.pxH = 0;
    this.logW = 0;
    this.logH = 0;
  }

  reset() {
    this.active = false;
    this.text = '';
    this.hasSprite = false;
  }
}

export class ParticleSystem {
  constructor() {
    this.maxParticles = 350;
    this.activeCount = 0;
    this.pool = new Array(this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i] = new ParticleObject();
    }

    this.maxTexts = 32;
    this.activeTextCount = 0;
    this.textPool = new Array(this.maxTexts);
    for (let i = 0; i < this.maxTexts; i++) {
      this.textPool[i] = new FloatingTextObject();
    }

    // Device-pixel density used to rasterise text sprites crisply (mirrors Game.dpr)
    this.resolutionScale = 1;
    this._measureCtx = null;
  }

  setResolutionScale(scale) {
    this.resolutionScale = Math.max(1, Number(scale) || 1);
  }

  _getMeasureCtx() {
    if (!this._measureCtx && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 96;
      this._measureCtx = c.getContext('2d');
    }
    return this._measureCtx;
  }

  /**
   * Rasterise a floating text once into the slot's own offscreen canvas (stroke + fill, identical
   * style to the legacy live draw). Per-frame cost drops from 2 text-shaping/raster passes to a
   * single drawImage, and the emoji/web-font glyph work happens exactly once per pickup.
   */
  _renderTextSprite(t) {
    const mctx = this._getMeasureCtx();
    if (!mctx) { t.hasSprite = false; return; }

    mctx.font = TEXT_FONT;
    const textW = mctx.measureText(t.text).width;
    const s = this.resolutionScale;

    const logW = Math.ceil(textW + TEXT_PAD * 2);
    const logH = Math.ceil(TEXT_LINE_H + TEXT_PAD * 2);
    const pxW = Math.ceil(logW * s);
    const pxH = Math.ceil(logH * s);

    if (!t.canvas) {
      t.canvas = document.createElement('canvas');
      t.sctx = t.canvas.getContext('2d');
    }
    // Grow-only backing store: resizing a canvas reallocates, so only do it when really needed.
    if (t.canvas.width < pxW || t.canvas.height < pxH) {
      t.canvas.width = Math.max(t.canvas.width, pxW);
      t.canvas.height = Math.max(t.canvas.height, pxH);
    }

    const g = t.sctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, t.canvas.width, t.canvas.height);
    g.setTransform(s, 0, 0, s, 0, 0);
    g.font = TEXT_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.strokeStyle = TEXT_STROKE;
    g.lineWidth = TEXT_STROKE_W;
    g.fillStyle = t.color;
    // Anchor on the exact pixel-grid centre so the sprite lines up 1:1 with the old centred text
    const cx = pxW / s / 2;
    const cy = pxH / s / 2;
    g.strokeText(t.text, cx, cy);
    g.fillText(t.text, cx, cy);

    t.pxW = pxW;
    t.pxH = pxH;
    t.logW = pxW / s;
    t.logH = pxH / s;
    t.hasSprite = true;
  }

  /**
   * Pre-warm glyph caches (web font + colour-emoji fallback) so the first real pickup label
   * does not stall the frame while the browser rasterises those glyphs for the first time.
   */
  prewarmText(strings) {
    if (typeof document === 'undefined' || !strings || strings.length === 0) return;
    const run = () => {
      const g = this._getMeasureCtx();
      if (!g) return;
      g.font = TEXT_FONT;
      g.lineWidth = TEXT_STROKE_W;
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      for (const str of strings) {
        g.clearRect(0, 0, 640, 96);
        g.measureText(str);
        g.strokeText(str, 8, 48);
        g.fillText(str, 8, 48);
      }
    };
    const fonts = document.fonts;
    if (fonts && typeof fonts.load === 'function') {
      fonts.load(TEXT_FONT, strings.join('')).then(run, run);
    } else {
      run();
    }
  }

  _allocParticle() {
    let p;
    if (this.activeCount < this.maxParticles) {
      p = this.pool[this.activeCount++];
    } else {
      // O(1) in-place recycling: reuse oldest particle at index 0 without array-shifting
      p = this.pool[0];
    }
    p.reset();
    return p;
  }

  // Ultra-fast glowing electric spark particles for Plasma weapon
  createElectricSpark(x, y, count = 2, color = '#ea80fc', shadowColor = '#aa00ff') {
    for (let i = 0; i < count; i++) {
      const p = this._allocParticle();
      p.active = true;
      p.type = 'ELECTRIC_SPARK';
      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 200;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 3 + Math.random() * 4;
      p.color = color;
      p.shadowColor = shadowColor;
      p.life = 0.16 + Math.random() * 0.14;
      p.maxLife = 0.30;
      p.rotation = 0;
      p.vRot = 0;
      p.gravity = 0;
      p.growth = 0;
    }
  }


  // Spawn bursting chunks of clay (Classic Platypus death splat)
  createClaySplat(x, y, count = 12, color = '#e53935', shadowColor = '#b71c1c') {
    // Dynamic throttling if pool is nearly saturated
    if (this.activeCount + count > this.maxParticles) {
      count = Math.max(3, Math.floor(count * 0.5));
    }

    for (let i = 0; i < count; i++) {
      const p = this._allocParticle();
      p.active = true;
      p.type = 'CLAY_CHUNK';
      p.x = x;
      p.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 280;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 4 + Math.random() * 8;
      p.color = color;
      p.shadowColor = shadowColor;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 8;
      p.life = 0.6 + Math.random() * 0.4;
      p.maxLife = 1.0;
      p.gravity = 260;
      p.growth = 0;
    }

    // Add some soft smoke puffs too
    this.createSmokePuff(x, y, Math.min(count, 4));
  }

  // Engine or explosion smoke puffs
  createSmokePuff(x, y, count = 1, baseSize = 14) {
    for (let i = 0; i < count; i++) {
      const p = this._allocParticle();
      p.active = true;
      p.type = 'SMOKE';
      p.x = x + (Math.random() - 0.5) * 12;
      p.y = y + (Math.random() - 0.5) * 12;
      p.vx = (Math.random() - 0.5) * 40 - 30; // drifts back
      p.vy = (Math.random() - 0.5) * 40;
      p.size = baseSize * (0.6 + Math.random() * 0.8);
      p.color = '#eceff1';
      p.shadowColor = '#90a4ae';
      p.life = 0.4 + Math.random() * 0.3;
      p.maxLife = 0.7;
      p.growth = 25;
      p.rotation = 0;
      p.vRot = 0;
      p.gravity = 0;
    }
  }

  // Floating score or bonus text
  createFloatingText(x, y, text, color = '#ffd54f') {
    let t;
    if (this.activeTextCount < this.maxTexts) {
      t = this.textPool[this.activeTextCount++];
    } else {
      // O(1) in-place recycling of oldest text slot
      t = this.textPool[0];
    }
    t.reset();

    t.active = true;
    t.x = x;
    t.y = y;
    t.text = text;
    t.color = color;
    t.vy = -55;
    t.life = 0.9;
    t.maxLife = 0.9;

    // Rasterise once; draw() then only blits the sprite
    this._renderTextSprite(t);
  }

  update(dt) {
    // 1. Update active particles (O(1) Swap-and-Pop on expiration)
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      p.life -= dt;

      if (p.life <= 0) {
        // Swap with last active particle
        this.activeCount--;
        if (i < this.activeCount) {
          const temp = this.pool[i];
          this.pool[i] = this.pool[this.activeCount];
          this.pool[this.activeCount] = temp;
          i--; // Re-check swapped element
        }
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity !== 0) {
        p.vy += p.gravity * dt;
      }

      if (p.vRot !== 0) {
        p.rotation += p.vRot * dt;
      }

      if (p.growth !== 0) {
        p.size += p.growth * dt;
      }
    }

    // 2. Update active floating texts (O(1) Swap-and-Pop on expiration)
    for (let i = 0; i < this.activeTextCount; i++) {
      const t = this.textPool[i];
      t.life -= dt;

      if (t.life <= 0) {
        this.activeTextCount--;
        if (i < this.activeTextCount) {
          const temp = this.textPool[i];
          this.textPool[i] = this.textPool[this.activeTextCount];
          this.textPool[this.activeTextCount] = temp;
          i--;
        }
        continue;
      }

      t.y += t.vy * dt;
    }
  }

  draw(ctx) {
    if (this.activeCount === 0 && this.activeTextCount === 0) return;

    // 1. Draw active particles with batched canvas state
    ctx.save();
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.type === 'CLAY_CHUNK') {
        ClayRenderer.drawClayChunk(ctx, p.x, p.y, p.size, p.color, p.shadowColor, p.rotation);
      } else if (p.type === 'SMOKE') {
        ClayRenderer.drawClayBlob(ctx, p.x, p.y, p.size, p.size * 0.8, p.color, p.shadowColor);
      } else if (p.type === 'ELECTRIC_SPARK') {
        const s = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.7, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.7, p.y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    }
    ctx.restore();

    // 2. Draw active floating score texts (pre-rasterised sprites: 1 drawImage each)
    if (this.activeTextCount > 0) {
      ctx.save();
      let liveStyleReady = false;

      for (let i = 0; i < this.activeTextCount; i++) {
        const t = this.textPool[i];
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.globalAlpha = alpha;

        if (t.hasSprite) {
          ctx.drawImage(
            t.canvas,
            0, 0, t.pxW, t.pxH,
            t.x - t.logW * 0.5, t.y - t.logH * 0.5, t.logW, t.logH
          );
          continue;
        }

        // Fallback (no offscreen canvas available): original live text rendering
        if (!liveStyleReady) {
          ctx.font = TEXT_FONT;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = TEXT_STROKE;
          ctx.lineWidth = TEXT_STROKE_W;
          liveStyleReady = true;
        }
        ctx.fillStyle = t.color;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }
  }

  clear() {
    this.activeCount = 0;
    this.activeTextCount = 0;
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].reset();
    }
    for (let i = 0; i < this.maxTexts; i++) {
      this.textPool[i].reset();
    }
  }
}
