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
    this.maxParticles = 250;
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

  // Ultra-fast glowing electric spark particles for Plasma weapon
  createElectricSpark(x, y, count = 2, color = '#ea80fc', shadowColor = '#aa00ff') {
    for (let i = 0; i < count; i++) {
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
