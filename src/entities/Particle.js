// Clay Splat, Smoke & Floating Text Particles
import { ClayRenderer } from '../graphics/ClayRenderer.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
    this.maxParticles = 220; // Safe ceiling to maintain 60 FPS under heavy spam
  }

  // Ultra-fast glowing electric spark particles for Plasma weapon
  createElectricSpark(x, y, count = 2, color = '#ea80fc', shadowColor = '#aa00ff') {
    if (this.particles.length > this.maxParticles) {
      // Drop excess oldest particles to preserve 60 FPS
      this.particles.splice(0, count);
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 200;
      this.particles.push({
        type: 'ELECTRIC_SPARK',
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        shadowColor,
        life: 0.16 + Math.random() * 0.14,
        maxLife: 0.30
      });
    }
  }

  // Spawn bursting chunks of clay (Classic Platypus death splat)
  createClaySplat(x, y, count = 12, color = '#e53935', shadowColor = '#b71c1c') {
    if (this.particles.length + count > this.maxParticles) {
      count = Math.max(3, Math.floor(count * 0.5));
      if (this.particles.length > this.maxParticles - count) {
        this.particles.splice(0, count);
      }
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 280;
      this.particles.push({
        type: 'CLAY_CHUNK',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color,
        shadowColor,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        gravity: 260
      });
    }

    // Add some soft smoke puffs too
    this.createSmokePuff(x, y, Math.min(count, 4));
  }

  // Engine or explosion smoke puffs
  createSmokePuff(x, y, count = 1, baseSize = 14) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'SMOKE',
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 40 - 30, // drifts back
        vy: (Math.random() - 0.5) * 40,
        size: baseSize * (0.6 + Math.random() * 0.8),
        color: '#eceff1',
        shadowColor: '#90a4ae',
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        growth: 25
      });
    }
  }

  // Floating score or bonus text
  createFloatingText(x, y, text, color = '#ffd54f') {
    this.texts.push({
      x,
      y,
      text,
      color,
      vy: -55,
      life: 0.9,
      maxLife: 0.9
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      if (p.vRot) {
        p.rotation += p.vRot * dt;
      }

      if (p.growth) {
        p.size += p.growth * dt;
      }
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  draw(ctx) {
    // Draw particles
    for (const p of this.particles) {
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

    // Draw floating score texts
    ctx.save();
    ctx.font = 'bold 22px Luckiest Guy, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const t of this.texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.texts = [];
  }
}
