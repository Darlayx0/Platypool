// Bullet System (Player weapons and Enemy projectiles)
import { ClayRenderer } from '../graphics/ClayRenderer.js';

export class Bullet {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.radius = options.radius || 6;
    this.damage = options.damage || 1;
    this.isEnemy = options.isEnemy || false;
    this.type = options.type || 'NORMAL';
    this.piercing = options.piercing || false;
    this.hitsLeft = options.piercing ? (options.hitsLeft || 4) : 1;
    this.life = options.life || 3.0; // seconds before despawn
    this.maxLife = this.life;
    this.target = options.target || null;
    this.trailTimer = 0;
    this.tick = 0;
    this.gravity = options.gravity || 0;
    this.arcTimer = options.arcTimer || 0;
    this.activeArcs = [];
    this.startX = options.startX !== undefined ? options.startX : this.x;
    this.dead = false;
  }

  update(dt, enemies = [], particles = null, player = null, boss = null, game = null) {
    this.tick++;
    this.life -= dt;

    // Apply gravity for bombs & mortars
    if (this.gravity !== 0) {
      this.vy += this.gravity * dt;
    }

    // Player SPREAD shotgun range falloff: Full punch close-range, gentle decay past 360px
    if (this.type === 'SPREAD' && !this.isEnemy) {
      const distTraveled = this.x - this.startX;
      if (distTraveled > 360) {
        this.damage = Math.max(0.38, 1.0 - (distTraveled - 360) * 0.0018);
      }
    }

    // Player Homing rocket logic: find and track nearest living enemy or boss
    if (this.type === 'HOMING' && !this.isEnemy) {
      if (!this.target || this.target.dead || (this.target.x < this.x - 60)) {
        let closestDistSq = Infinity;
        let bestTarget = null;
        const bx = this.x;
        const by = this.y;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && e.x > bx - 50) {
            const dx = e.x - bx;
            const dy = e.y - by;
            const distSq = dx * dx + dy * dy;
            if (distSq < closestDistSq) {
              closestDistSq = distSq;
              bestTarget = e;
            }
          }
        }
        // Also target boss if no minor enemy or boss is closer
        if (!bestTarget && boss && !boss.dead && boss.x > this.x - 80) {
          bestTarget = boss;
        }
        this.target = bestTarget;
      }

      if (this.target) {
        const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        const currentAngle = Math.atan2(this.vy, this.vx);
        let diff = targetAngle - currentAngle;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const turnSpeed = 12.0 * dt;
        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
        const speed = 780;
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }

      if (particles && Math.random() > 0.4) {
        particles.createSmokePuff(this.x - 10, this.y, 1, 8);
      }
    }

    // Player Plasma Orb logic: emit Tesla electrical arcs to nearby enemies/boss
    if (this.type === 'PLASMA' && !this.isEnemy) {
      this.arcTimer -= dt;
      this.activeArcs = [];

      const arcRadius = 155;
      let target1 = null, distSq1 = Infinity;
      let target2 = null, distSq2 = Infinity;

      // Fast O(N) scan without array allocations or sorting
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        const dx = e.x - this.x;
        if (dx < -arcRadius || dx > arcRadius) continue;
        const dy = e.y - this.y;
        if (dy < -arcRadius || dy > arcRadius) continue;

        const dSq = dx * dx + dy * dy;
        const maxRange = arcRadius + e.radius;
        if (dSq < maxRange * maxRange) {
          if (dSq < distSq1) {
            target2 = target1;
            distSq2 = distSq1;
            target1 = { target: e, x: e.x, y: e.y, isBoss: false };
            distSq1 = dSq;
          } else if (dSq < distSq2) {
            target2 = { target: e, x: e.x, y: e.y, isBoss: false };
            distSq2 = dSq;
          }
        }
      }

      if (boss && !boss.dead) {
        const bdx = boss.x - this.x;
        const bdy = boss.y - this.y;
        const bRange = arcRadius + boss.radius + 35;
        if (Math.abs(bdx) <= bRange && Math.abs(bdy) <= bRange) {
          const bDistSq = bdx * bdx + bdy * bdy;
          if (bDistSq < bRange * bRange) {
            if (bDistSq < distSq1) {
              target2 = target1;
              target1 = { target: boss, x: boss.x, y: boss.y, isBoss: true };
            } else if (bDistSq < distSq2) {
              target2 = { target: boss, x: boss.x, y: boss.y, isBoss: true };
            }
          }
        }
      }

      if (target1) this.activeArcs.push({ x: target1.x, y: target1.y });
      if (target2) this.activeArcs.push({ x: target2.x, y: target2.y });

      if (this.arcTimer <= 0) {
        this.arcTimer = 0.08; // zap interval

        if (target1) {
          if (target1.isBoss) {
            target1.target.takeDamage(0.25, target1.y, particles, null, 'PLASMA_ZAP');
          } else {
            const killed = target1.target.takeDamage(0.5, this.x, false, 'PLASMA_ZAP');
            target1.target.slowTimer = 0.5; // Electro-disruption micro-slow (35% speed reduction)
            if (killed && game) game.handleEnemyDeath(target1.target);
          }
          if (particles) particles.createElectricSpark(target1.x, target1.y, 2, '#ea80fc', '#aa00ff');
        }

        if (target2) {
          if (target2.isBoss) {
            target2.target.takeDamage(0.25, target2.y, particles, null, 'PLASMA_ZAP');
          } else {
            const killed = target2.target.takeDamage(0.5, this.x, false, 'PLASMA_ZAP');
            target2.target.slowTimer = 0.5; // Electro-disruption micro-slow (35% speed reduction)
            if (killed && game) game.handleEnemyDeath(target2.target);
          }
          if (particles) particles.createElectricSpark(target2.x, target2.y, 2, '#ea80fc', '#aa00ff');
        }
      }

      // Lightweight electric spark particle trail (every 2nd frame)
      if (particles && (this.tick % 2 === 0)) {
        particles.createElectricSpark(this.x - 8, this.y + (Math.random() - 0.5) * 8, 1, '#ea80fc', '#aa00ff');
      }
    }

    // Enemy Homing rocket tracking player
    if (this.type === 'ENEMY_HOMING' && this.isEnemy && player) {
      const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      const currentAngle = Math.atan2(this.vy, this.vx);
      let diff = targetAngle - currentAngle;

      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const turnSpeed = 3.2 * dt;
      const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
      const speed = 360;
      this.vx = Math.cos(newAngle) * speed;
      this.vy = Math.sin(newAngle) * speed;

      if (particles && Math.random() > 0.5) {
        particles.createSmokePuff(this.x + 8, this.y, 1, 6);
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    return this.life > 0 && this.x > -80 && this.x < 1360 && this.y > -80 && this.y < 800;
  }

  draw(ctx) {
    if (this.isEnemy) {
      if (this.type === 'ENEMY_SNIPER') {
        // High velocity glowing needle
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ClayRenderer.drawClayCapsule(ctx, 0, 0, 36, 7, '#ff1744', '#b71c1c');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-12, -2, 24, 4);
        ctx.restore();
        return;
      }

      if (this.type === 'ENEMY_BOMB') {
        // Heavy clay bomb with fuse
        ctx.save();
        ctx.translate(this.x, this.y);
        ClayRenderer.drawClayBlob(ctx, 0, 0, 11, 11, '#5d4037', '#271612');
        ClayRenderer.drawClayBlob(ctx, 0, -8, 4, 4, '#ff3d00', '#bf360c');
        ctx.restore();
        return;
      }

      if (this.type === 'ENEMY_MORTAR') {
        // Heavy arcing mortar shell
        ClayRenderer.drawClayBlob(ctx, this.x, this.y, 13, 13, '#e65100', '#bf360c');
        return;
      }

      if (this.type === 'ENEMY_HOMING') {
        // Clay enemy homing missile
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ClayRenderer.drawClayCapsule(ctx, 0, 0, 20, 8, '#d50000', '#7f0000');
        ClayRenderer.drawClayBlob(ctx, 8, 0, 4, 4, '#ffeb3b', '#ff6f00');
        ctx.restore();
        return;
      }

      // Standard enemy clay energy orb
      ClayRenderer.drawClayBlob(ctx, this.x, this.y, this.radius, this.radius, '#ff7043', '#d84315');
      // Bright core
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x - 1, this.y - 1, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#fff9c4';
      ctx.fill();
      ctx.restore();
      return;
    }

    // Player Bullets
    switch (this.type) {
      case 'SPREAD':
        ClayRenderer.drawClayBlob(ctx, this.x, this.y, 8, 6, '#ef5350', '#b71c1c');
        break;

      case 'LASER':
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(66, 165, 245, 0.4)';
        ctx.fillRect(-20, -7, 40, 14);
        ClayRenderer.drawClayCapsule(ctx, 0, 0, 44, 9, '#42a5f5', '#1565c0');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -2, 36, 4);
        ctx.restore();
        break;

      case 'HOMING':
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ClayRenderer.drawClayCapsule(ctx, -2, 0, 22, 9, '#43a047', '#1b5e20');
        ClayRenderer.drawClayBlob(ctx, 9, 0, 5, 5, '#ffee58', '#f57c00');
        ClayRenderer.drawClayCapsule(ctx, -8, -5, 6, 4, '#81c784', '#2e7d32');
        ClayRenderer.drawClayCapsule(ctx, -8, 5, 6, 4, '#81c784', '#2e7d32');
        ctx.restore();
        break;

      case 'FLAK':
        ClayRenderer.drawClayBlob(ctx, this.x, this.y, 14, 14, '#fbc02d', '#f57f17');
        ClayRenderer.drawClayBlob(ctx, this.x - 8, this.y - 6, 4, 4, '#ff3d00', '#bf360c');
        break;

      case 'FLAK_SHRAPNEL':
        ClayRenderer.drawClayBlob(ctx, this.x, this.y, 5, 5, '#ffb300', '#e65100');
        break;

      case 'PLASMA':
        // Electric Tesla Arcs to nearby targets (batched path rendering)
        if (this.activeArcs && this.activeArcs.length > 0) {
          ctx.save();
          // Pass 1: Outer vivid purple glow
          ctx.strokeStyle = '#e040fb';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (const arc of this.activeArcs) {
            ctx.moveTo(this.x, this.y);
            const segments = 4;
            const dx = (arc.x - this.x) / segments;
            const dy = (arc.y - this.y) / segments;
            for (let s = 1; s < segments; s++) {
              const jx = this.x + dx * s + (Math.sin(this.tick + s * 1.5) * 8);
              const jy = this.y + dy * s + (Math.cos(this.tick + s * 1.5) * 8);
              ctx.lineTo(jx, jy);
            }
            ctx.lineTo(arc.x, arc.y);
          }
          ctx.stroke();

          // Pass 2: White-hot inner core filament
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          for (const arc of this.activeArcs) {
            ctx.moveTo(this.x, this.y);
            const segments = 4;
            const dx = (arc.x - this.x) / segments;
            const dy = (arc.y - this.y) / segments;
            for (let s = 1; s < segments; s++) {
              const jx = this.x + dx * s + (Math.sin(this.tick + s * 1.5) * 8);
              const jy = this.y + dy * s + (Math.cos(this.tick + s * 1.5) * 8);
              ctx.lineTo(jx, jy);
            }
            ctx.lineTo(arc.x, arc.y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Plasma Orb (optimized single-pass clay rendering)
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Glowing outer plasma corona
        const coronaR = this.radius + 6 + Math.sin(this.tick * 0.4) * 3;
        ctx.beginPath();
        ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(171, 71, 188, 0.35)';
        ctx.fill();

        // 2. Main Shaded Plasma Clay Blob
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, '#ea80fc');
        grad.addColorStop(0.7, '#ab47bc');
        grad.addColorStop(1, '#4a148c');
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. Rim highlight
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        // 4. White-hot center nucleus
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
        break;

      case 'NORMAL':
      default:
        // Punchier standard pea-shooter pellet
        ClayRenderer.drawClayCapsule(ctx, this.x, this.y, 16, 6, '#ffee58', '#f57f17');
        break;
    }
  }
}
