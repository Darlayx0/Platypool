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
  }

  reset() {
    this.active = false;
    this.text = '';
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
  }

  _allocParticle() {
    let p;
    if (this.activeCount < this.maxParticles) {
      p = this.pool[this.activeCount++];
    } else {
      // Recycle oldest particle at index 0 (swap to active end)
      p = this.pool[0];
      for (let k = 0; k < this.activeCount - 1; k++) {
        this.pool[k] = this.pool[k + 1];
      }
      this.pool[this.activeCount - 1] = p;
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

  // High-Quality Multi-Layered EMP Shockwave for Pulse weapon
  createPulseShockwave(x, y) {
    // 1. Radial Soft EMP Bloom
    const bloom = this._allocParticle();
    bloom.active = true;
    bloom.type = 'PULSE_BLOOM';
    bloom.x = x;
    bloom.y = y;
    bloom.vx = 0;
    bloom.vy = 0;
    bloom.size = 15;
    bloom.growth = 1200;
    bloom.color = '#00e5ff';
    bloom.life = 0.40;
    bloom.maxLife = 0.40;

    // 2. Primary Shockwave (High-Energy Cyan + White Core + Filaments)
    const p1 = this._allocParticle();
    p1.active = true;
    p1.type = 'PULSE_RING';
    p1.x = x;
    p1.y = y;
    p1.vx = 0;
    p1.vy = 0;
    p1.size = 20;
    p1.growth = 2100;
    p1.color = '#00e5ff';
    p1.shadowColor = '#0097a7';
    p1.life = 0.62;
    p1.maxLife = 0.62;

    // 3. Secondary Resonance Wave (Trailing Deep Azure Ring)
    const p2 = this._allocParticle();
    p2.active = true;
    p2.type = 'PULSE_RESONANCE';
    p2.x = x;
    p2.y = y;
    p2.vx = 0;
    p2.vy = 0;
    p2.size = 6;
    p2.growth = 1750;
    p2.color = '#00b0ff';
    p2.shadowColor = '#0288d1';
    p2.life = 0.58;
    p2.maxLife = 0.58;

    // Center electric ionization burst
    this.createElectricSpark(x, y, 22, '#00e5ff', '#ffffff');
  }

  // Vaporization flash when an enemy bullet is disintegrated by Pulse
  createPulseBulletVaporization(x, y) {
    const v = this._allocParticle();
    v.active = true;
    v.type = 'PULSE_VAPOR';
    v.x = x;
    v.y = y;
    v.vx = (Math.random() - 0.5) * 20;
    v.vy = (Math.random() - 0.5) * 20;
    v.size = 5;
    v.growth = 95;
    v.color = '#00e5ff';
    v.life = 0.24;
    v.maxLife = 0.24;

    this.createElectricSpark(x, y, 4, '#00e5ff', '#ffffff');
  }

  // Spawn bursting chunks of clay (Classic Platypus death splat)
  createClaySplat(x, y, count = 12, color = '#e53935', shadowColor = '#b71c1c') {
    // Dynamic throttling if pool is nearly saturated
    if (this.activeCount + count > this.maxParticles) {
      count = Math.max(3, Math.floor(count * 0.5));
    }

    for (let i = 0; i < count; i++) {
      let p;
      if (this.activeCount < this.maxParticles) {
        p = this.pool[this.activeCount++];
      } else {
        p = this.pool[0];
        for (let k = 0; k < this.activeCount - 1; k++) {
          this.pool[k] = this.pool[k + 1];
        }
        this.pool[this.activeCount - 1] = p;
      }

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
      let p;
      if (this.activeCount < this.maxParticles) {
        p = this.pool[this.activeCount++];
      } else {
        p = this.pool[0];
        for (let k = 0; k < this.activeCount - 1; k++) {
          this.pool[k] = this.pool[k + 1];
        }
        this.pool[this.activeCount - 1] = p;
      }

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
      t = this.textPool[0];
      for (let k = 0; k < this.activeTextCount - 1; k++) {
        this.textPool[k] = this.textPool[k + 1];
      }
      this.textPool[this.activeTextCount - 1] = t;
    }

    t.active = true;
    t.x = x;
    t.y = y;
    t.text = text;
    t.color = color;
    t.vy = -55;
    t.life = 0.9;
    t.maxLife = 0.9;
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
    // 1. Draw active particles
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i];
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
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
      } else if (p.type === 'PULSE_RING') {
        const rad = Math.max(1, p.size);

        // 1. Soft glowing outer shockwave aura
        ctx.save();
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = Math.min(22, 14 * alpha);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(2.2, 9.5 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.stroke();

        // 2. High-contrast brilliant white energetic core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.2, 3.2 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Dynamic crackling electric filaments dancing along shockwave perimeter
        if (alpha > 0.12 && rad > 25) {
          ctx.save();
          ctx.strokeStyle = '#e0f7fa';
          ctx.lineWidth = Math.max(1, 2 * alpha);
          ctx.beginPath();
          const segments = 12;
          const arcStep = (Math.PI * 2) / segments;
          for (let s = 0; s < segments; s++) {
            if ((s + Math.floor(rad * 0.08)) % 2 === 0) continue;
            const baseAng = s * arcStep;
            const midAng = baseAng + arcStep * 0.5;
            const endAng = baseAng + arcStep;
            const jitterR = (Math.sin(s * 7 + rad * 0.18) * 8) * alpha;
            const x1 = p.x + Math.cos(baseAng) * rad;
            const y1 = p.y + Math.sin(baseAng) * rad;
            const xm = p.x + Math.cos(midAng) * (rad + jitterR);
            const ym = p.y + Math.sin(midAng) * (rad + jitterR);
            const x2 = p.x + Math.cos(endAng) * rad;
            const y2 = p.y + Math.sin(endAng) * rad;
            ctx.moveTo(x1, y1);
            ctx.lineTo(xm, ym);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
          ctx.restore();
        }
      } else if (p.type === 'PULSE_RESONANCE') {
        // Trailing deep azure resonance ring
        const rad = Math.max(1, p.size);
        ctx.strokeStyle = p.color || '#00b0ff';
        ctx.lineWidth = Math.max(1.4, 4.8 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'PULSE_BLOOM') {
        // Translucent radial EMP bloom
        const rad = Math.max(1, p.size);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.40)');
        grad.addColorStop(0.35, 'rgba(0, 176, 255, 0.18)');
        grad.addColorStop(1, 'rgba(0, 176, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'PULSE_VAPOR') {
        // Bullet vaporization plasma ring
        const rad = Math.max(1, p.size);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = Math.max(1, 3.2 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, 3.0 * alpha), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Draw active floating score texts
    if (this.activeTextCount > 0) {
      ctx.save();
      ctx.font = 'bold 22px Luckiest Guy, cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 4;

      for (let i = 0; i < this.activeTextCount; i++) {
        const t = this.textPool[i];
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t.color;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
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
