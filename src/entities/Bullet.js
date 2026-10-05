// Bullet System (Player weapons and Enemy projectiles)
import { ClayRenderer } from '../graphics/ClayRenderer.js';

export class Bullet {
  static pool = [];
  static plasmaGradCache = new Map();

  static getPlasmaGrad(ctx, radius) {
    let grad = Bullet.plasmaGradCache.get(radius);
    if (!grad) {
      grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#ea80fc');
      grad.addColorStop(0.7, '#ab47bc');
      grad.addColorStop(1, '#4a148c');
      Bullet.plasmaGradCache.set(radius, grad);
    }
    return grad;
  }

  static acquire(options) {
    if (Bullet.pool.length > 0) {
      const b = Bullet.pool.pop();
      b._inPool = false;
      b.init(options);
      return b;
    }
    return new Bullet(options);
  }

  static release(bullet) {
    if (!bullet || bullet._inPool) return;
    bullet._inPool = true;
    bullet.dead = true;
    bullet.target = null;
    if (bullet.activeArcs) bullet.activeArcs.length = 0;
    if (Bullet.pool.length < 600) {
      Bullet.pool.push(bullet);
    }
  }

  constructor(options) {
    // Transparently recycle from pool if available
    if (Bullet.pool.length > 0) {
      const b = Bullet.pool.pop();
      b._inPool = false;
      b.init(options);
      return b;
    }
    this._inPool = false;
    this.activeArcs = [];
    this._arcSlot1 = { x: 0, y: 0 };
    this._arcSlot2 = { x: 0, y: 0 };
    this._arcSlot3 = { x: 0, y: 0 };
    this._arcSlot4 = { x: 0, y: 0 };
    this.init(options);
  }

  init(options) {
    this._inPool = false;
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
    this.targetSector = options.targetSector || null;
    this.trailTimer = 0;
    this.tick = 0;
    this.gravity = options.gravity || 0;
    this.arcTimer = options.arcTimer || 0;
    if (!this.activeArcs) this.activeArcs = [];
    else this.activeArcs.length = 0;
    if (!this._arcSlot1) this._arcSlot1 = { x: 0, y: 0 };
    if (!this._arcSlot2) this._arcSlot2 = { x: 0, y: 0 };
    if (!this._arcSlot3) this._arcSlot3 = { x: 0, y: 0 };
    if (!this._arcSlot4) this._arcSlot4 = { x: 0, y: 0 };
    this.startX = options.startX !== undefined ? options.startX : this.x;
    this.boosted = options.boosted || false;
    this.accelX = options.accelX || 0;
    this.accelY = options.accelY || 0;
    this.color = options.color || null;
    this.glowColor = options.glowColor || null;
    this.dead = false;
  }

  update(dt, enemies = [], particles = null, player = null, boss = null, game = null) {
    this.tick++;
    this.life -= dt;

    if (this.accelX !== 0) this.vx += this.accelX * dt;
    if (this.accelY !== 0) this.vy += this.accelY * dt;

    // Apply gravity for bombs & mortars
    if (this.gravity !== 0) {
      this.vy += this.gravity * dt;
    }

    // Player SPREAD full-screen sweeper: Arming phase close to nose (<180px: 0.30 dmg), scales up to 1.45 at long-range (>=360px)
    if (this.type === 'SPREAD' && !this.isEnemy) {
      const distTraveled = this.x - this.startX;
      if (distTraveled < 180) {
        this.damage = 0.30;
        this.radius = 6.0;
      } else if (distTraveled < 360) {
        this.damage = 1.10;
        this.radius = 8.0;
      } else {
        this.damage = 1.45;
        this.radius = 10.0;
      }
    }

    // Player FLAK Proximity Airburst Fuze: if within 42px of any enemy, trigger airburst!
    if (this.type === 'FLAK' && !this.isEnemy && !this.dead) {
      const airburstR = 42;
      const airburstRSq = airburstR * airburstR;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead) continue;
        const dx = e.x - this.x;
        if (dx < -airburstR || dx > airburstR) continue;
        const dy = e.y - this.y;
        if (dy < -airburstR || dy > airburstR) continue;
        if (dx * dx + dy * dy <= airburstRSq) {
          if (game && typeof game.detonateFlak === 'function') {
            game.detonateFlak(this);
          }
          this.dead = true;
          return false;
        }
      }
    }

    // Player Homing rocket logic: Smart Divergence (Sector split) & rapid 15.0 rad/s turn
    if (this.type === 'HOMING' && !this.isEnemy) {
      if (!this.target || this.target.dead || (this.target.x < this.x - 60)) {
        let closestDistSq = Infinity;
        let bestTarget = null;
        const bx = this.x;
        const by = this.y;

        // Pass 1: Try finding closest enemy in preferred sector
        if (this.targetSector) {
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && e.x > bx - 50) {
              const inSector = (this.targetSector === 'UPPER' ? e.y < 360 : e.y >= 360);
              if (inSector) {
                const dx = e.x - bx;
                const dy = e.y - by;
                const distSq = dx * dx + dy * dy;
                if (distSq < closestDistSq) {
                  closestDistSq = distSq;
                  bestTarget = e;
                }
              }
            }
          }
        }

        // Pass 2: Fallback to any closest enemy if none found in preferred sector
        if (!bestTarget) {
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

        const turnSpeed = 15.0 * dt; // [🟢 BUFF] Rapid 15.0 rad/s turn
        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
        const speed = 760;
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
      }

      if (particles && Math.random() > 0.4) {
        particles.createSmokePuff(this.x - 10, this.y, 1, 8);
      }
    }

    // Player Plasma Orb logic: emit Tesla electrical arcs to up to 4 nearby enemies/boss (190px radius)
    if (this.type === 'PLASMA' && !this.isEnemy) {
      this.arcTimer -= dt;
      this.activeArcs.length = 0;

      const arcRadius = 190;
      let target1 = null, distSq1 = Infinity, t1X = 0, t1Y = 0, t1IsBoss = false;
      let target2 = null, distSq2 = Infinity, t2X = 0, t2Y = 0, t2IsBoss = false;
      let target3 = null, distSq3 = Infinity, t3X = 0, t3Y = 0, t3IsBoss = false;
      let target4 = null, distSq4 = Infinity, t4X = 0, t4Y = 0, t4IsBoss = false;

      // Fast O(N) scan for up to 4 nearest targets without array allocations
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
            target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss; distSq4 = distSq3;
            target3 = target2; t3X = t2X; t3Y = t2Y; t3IsBoss = t2IsBoss; distSq3 = distSq2;
            target2 = target1; t2X = t1X; t2Y = t1Y; t2IsBoss = t1IsBoss; distSq2 = distSq1;
            target1 = e; t1X = e.x; t1Y = e.y; t1IsBoss = false; distSq1 = dSq;
          } else if (dSq < distSq2) {
            target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss; distSq4 = distSq3;
            target3 = target2; t3X = t2X; t3Y = t2Y; t3IsBoss = t2IsBoss; distSq3 = distSq2;
            target2 = e; t2X = e.x; t2Y = e.y; t2IsBoss = false; distSq2 = dSq;
          } else if (dSq < distSq3) {
            target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss; distSq4 = distSq3;
            target3 = e; t3X = e.x; t3Y = e.y; t3IsBoss = false; distSq3 = dSq;
          } else if (dSq < distSq4) {
            target4 = e; t4X = e.x; t4Y = e.y; t4IsBoss = false; distSq4 = dSq;
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
              target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss;
              target3 = target2; t3X = t2X; t3Y = t2Y; t3IsBoss = t2IsBoss;
              target2 = target1; t2X = t1X; t2Y = t1Y; t2IsBoss = t1IsBoss;
              target1 = boss; t1X = boss.x; t1Y = boss.y; t1IsBoss = true;
            } else if (bDistSq < distSq2) {
              target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss;
              target3 = target2; t3X = t2X; t3Y = t2Y; t3IsBoss = t2IsBoss;
              target2 = boss; t2X = boss.x; t2Y = boss.y; t2IsBoss = true;
            } else if (bDistSq < distSq3) {
              target4 = target3; t4X = t3X; t4Y = t3Y; t4IsBoss = t3IsBoss;
              target3 = boss; t3X = boss.x; t3Y = boss.y; t3IsBoss = true;
            } else if (bDistSq < distSq4) {
              target4 = boss; t4X = boss.x; t4Y = boss.y; t4IsBoss = true;
            }
          }
        }
      }

      if (target1) { this._arcSlot1.x = t1X; this._arcSlot1.y = t1Y; this.activeArcs.push(this._arcSlot1); }
      if (target2) { this._arcSlot2.x = t2X; this._arcSlot2.y = t2Y; this.activeArcs.push(this._arcSlot2); }
      if (target3) { this._arcSlot3.x = t3X; this._arcSlot3.y = t3Y; this.activeArcs.push(this._arcSlot3); }
      if (target4) { this._arcSlot4.x = t4X; this._arcSlot4.y = t4Y; this.activeArcs.push(this._arcSlot4); }

      if (this.arcTimer <= 0) {
        this.arcTimer = 0.09; // zap interval

        const targets = [
          { t: target1, x: t1X, y: t1Y, isBoss: t1IsBoss },
          { t: target2, x: t2X, y: t2Y, isBoss: t2IsBoss },
          { t: target3, x: t3X, y: t3Y, isBoss: t3IsBoss },
          { t: target4, x: t4X, y: t4Y, isBoss: t4IsBoss }
        ];

        for (let ti = 0; ti < targets.length; ti++) {
          const item = targets[ti];
          if (!item.t) continue;
          if (item.isBoss) {
            item.t.takeDamage(0.12, item.y, particles, null, 'PLASMA_ZAP');
            if (typeof item.t.applyPlasmaSlow === 'function') {
              item.t.applyPlasmaSlow(1.0);
            } else {
              item.t.slowTimer = Math.max(item.t.slowTimer || 0, 1.0);
            }
          } else {
            const killed = item.t.takeDamage(0.45, this.x, false, 'PLASMA_ZAP');
            if (typeof item.t.applyPlasmaSlow === 'function') {
              item.t.applyPlasmaSlow(1.2);
            } else {
              item.t.slowTimer = Math.max(item.t.slowTimer || 0, 1.2);
            }
            if (killed && game) game.handleEnemyDeath(item.t);
          }
          if (particles) particles.createElectricSpark(item.x, item.y, 2, '#ea80fc', '#aa00ff');
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
    if (ClayRenderer.use3D) {
      if (this.type === 'PLASMA' && !this.isEnemy && this.activeArcs && this.activeArcs.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        for (const [col, w] of [['#e040fb', 2.5], ['#ffffff', 1.0]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.beginPath();
          for (const arc of this.activeArcs) {
            ctx.moveTo(this.x, this.y);
            const dx = (arc.x - this.x) / 4;
            const dy = (arc.y - this.y) / 4;
            for (let s = 1; s < 4; s++) {
              ctx.lineTo(this.x + dx * s + Math.sin(this.tick + s * 1.5) * 8, this.y + dy * s + Math.cos(this.tick + s * 1.5) * 8);
            }
            ctx.lineTo(arc.x, arc.y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }
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

        // 2. Main Shaded Plasma Clay Blob (Cached flyweight gradient)
        const grad = Bullet.getPlasmaGrad(ctx, this.radius);
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
        if (this.boosted) {
          ctx.save();
          // High-speed sonic streak & cyan-gold core
          ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.fillRect(this.x - 32, this.y - 3, 32, 6);
          ClayRenderer.drawClayCapsule(ctx, this.x, this.y, 24, 7, '#00e5ff', '#0097a7');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.x - 8, this.y - 1.5, 16, 3);
          ctx.restore();
        } else {
          // Punchier standard pea-shooter pellet
          ClayRenderer.drawClayCapsule(ctx, this.x, this.y, 18, 6.5, '#ffee58', '#f57f17');
        }
        break;
    }
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      radius: this.radius,
      damage: this.damage,
      isEnemy: Boolean(this.isEnemy),
      type: this.type,
      piercing: Boolean(this.piercing),
      hitsLeft: this.hitsLeft,
      life: this.life,
      maxLife: this.maxLife,
      tick: this.tick,
      gravity: this.gravity,
      arcTimer: this.arcTimer,
      startX: this.startX,
      targetSector: this.targetSector,
      boosted: Boolean(this.boosted),
      color: this.color,
      glowColor: this.glowColor,
      dead: Boolean(this.dead)
    };
  }

  static deserialize(data) {
    if (!data) return null;
    try {
      const bullet = Bullet.acquire({
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        radius: data.radius,
        damage: data.damage,
        isEnemy: data.isEnemy,
        type: data.type,
        targetSector: data.targetSector,
        piercing: data.piercing,
        hitsLeft: data.hitsLeft,
        life: data.life,
        gravity: data.gravity,
        arcTimer: data.arcTimer,
        startX: data.startX,
        boosted: data.boosted,
        color: data.color,
        glowColor: data.glowColor
      });
      bullet.maxLife = data.maxLife !== undefined ? data.maxLife : bullet.maxLife;
      bullet.tick = data.tick !== undefined ? data.tick : bullet.tick;
      bullet.dead = Boolean(data.dead);
      return bullet;
    } catch (e) {
      console.warn('Failed to deserialize bullet:', e, data);
      return null;
    }
  }
}

