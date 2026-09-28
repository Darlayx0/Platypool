// Enemies and Wave Formations for Platypus AI
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Bullet } from './Bullet.js';

export class Enemy {
  static currentStage = 1;
  static difficultyConfig = null;

  constructor(options) {
    this.x = options.x !== undefined ? options.x : 1320;
    this.y = options.y !== undefined ? options.y : 300;
    this.type = options.type || 'SCOUT';
    this.formationId = options.formationId || null;
    this.isLastInFormation = options.isLastInFormation || false;

    this.difficultyConfig = options.difficultyConfig || Enemy.difficultyConfig || null;
    this.stage = options.stage || Enemy.currentStage || 1;
    this.world = Math.min(4, Math.max(1, Math.floor((this.stage - 1) / 5) + 1));
    this.bulletSpeedMult = 1.0;
    this.shootCooldownMult = 1.0;

    this.tick = Math.random() * 50;
    this.dead = false;

    // Type-specific setup
    this.initType();
  }

  initType() {
    switch (this.type) {
      case 'DRONE':
        this.maxHp = 2.5;
        this.hp = 2.5;
        this.radius = 18;
        this.vx = -240;
        this.vy = 0;
        this.scoreValue = 150;
        this.shootTimer = 1.0 + Math.random() * 1.5;
        this.color = '#43a047';
        this.shadowColor = '#1b5e20';
        break;

      case 'GUNSHIP':
        this.maxHp = 18;
        this.hp = 18;
        this.radius = 36;
        this.vx = -120;
        this.vy = 0;
        this.scoreValue = 600;
        this.shootTimer = 1.2;
        this.targetHoverX = 900 + Math.random() * 180;
        this.color = '#3949ab';
        this.shadowColor = '#1a237e';
        break;

      case 'BLIMP':
        this.maxHp = 45;
        this.hp = 45;
        this.radius = 55;
        this.vx = -65;
        this.vy = 0;
        this.scoreValue = 1500;
        this.shootTimer = 1.5;
        this.color = '#ffe082';
        this.shadowColor = '#ff8f00';
        break;

      case 'STINGER':
        this.maxHp = 3;
        this.hp = 3;
        this.radius = 16;
        this.vx = -270;
        this.vy = 0;
        this.baseVy = (Math.random() - 0.5) * 60;
        this.scoreValue = 200;
        this.charging = false;
        this.hasCharged = false;
        this.color = '#ffb300';
        this.shadowColor = '#e65100';
        break;

      case 'SNIPER':
        this.maxHp = 7;
        this.hp = 7;
        this.radius = 22;
        this.vx = -220;
        this.vy = 0;
        this.scoreValue = 450;
        this.targetX = 1060 + Math.random() * 120;
        this.aimTimer = 0;
        this.maxAimTime = 1.3;
        this.isAiming = false;
        this.aimAngle = Math.PI;
        this.shootCooldown = 0.5;
        this.color = '#512da8';
        this.shadowColor = '#1a237e';
        break;

      case 'BOMBER':
        this.maxHp = 25;
        this.hp = 25;
        this.radius = 38;
        this.vx = -110;
        this.vy = 0;
        this.scoreValue = 800;
        this.bombTimer = 1.2 + Math.random();
        this.color = '#689f38';
        this.shadowColor = '#2e7d32';
        break;

      case 'SPINNER':
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 24;
        this.vx = -190;
        this.vy = (Math.random() > 0.5 ? 1 : -1) * 160;
        this.scoreValue = 350;
        this.sparkTimer = 1.2;
        this.color = '#e53935';
        this.shadowColor = '#b71c1c';
        break;

      case 'SHIELD_CRUISER':
        this.maxHp = 22;
        this.hp = 22;
        this.maxShieldHp = 16;
        this.shieldHp = 16;
        this.radius = 36;
        this.vx = -95;
        this.vy = 0;
        this.targetX = 920 + Math.random() * 150;
        this.scoreValue = 900;
        this.shootTimer = 1.6;
        this.color = '#00acc1';
        this.shadowColor = '#006064';
        break;

      case 'MINE_LAYER':
        this.maxHp = 20;
        this.hp = 20;
        this.radius = 28;
        this.vx = -85;
        this.vy = 0;
        this.scoreValue = 550;
        this.mineTimer = 1.8 + Math.random() * 0.8;
        this.color = '#d84315';
        this.shadowColor = '#bf360c';
        break;

      case 'MINE':
        this.maxHp = 3;
        this.hp = 3;
        this.radius = 18;
        this.vx = -45;
        this.vy = 0;
        this.baseY = this.y;
        this.scoreValue = 100;
        this.color = '#37474f';
        this.shadowColor = '#212121';
        break;

      case 'ACE':
        this.maxHp = 12;
        this.hp = 12;
        this.radius = 24;
        this.vx = -170;
        this.vy = 0;
        this.baseY = this.y;
        this.loopPhase = 0;
        this.scoreValue = 750;
        this.shootTimer = 1.0;
        this.color = '#ffca28';
        this.shadowColor = '#ff6f00';
        break;

      case 'INTERCEPTOR':
        this.maxHp = 14;
        this.hp = 14;
        this.radius = 22;
        this.vx = -300;
        this.vy = 0;
        this.baseY = this.y;
        this.scoreValue = 750;
        this.phaseState = 'APPROACH';
        this.stateTimer = 0.9;
        this.hasShot = false;
        this.color = '#ab47bc';
        this.shadowColor = '#4a148c';
        break;

      case 'JUGGERNAUT':
        this.maxHp = 42;
        this.hp = 42;
        this.maxShieldHp = 24;
        this.shieldHp = 24;
        this.radius = 48;
        this.vx = -60;
        this.vy = 0;
        this.scoreValue = 1800;
        this.mortarTimer = 1.8;
        this.burstTimer = 1.4;
        this.color = '#37474f';
        this.shadowColor = '#212121';
        break;

      case 'VORTEX_DRONE':
        this.maxHp = 18;
        this.hp = 18;
        this.radius = 26;
        this.vx = -110;
        this.vy = 0;
        this.baseY = this.y;
        this.orbitPhase = Math.random() * Math.PI * 2;
        this.scoreValue = 850;
        this.vortexTimer = 2.2;
        this.color = '#00e5ff';
        this.shadowColor = '#006064';
        break;

      case 'SCOUT':
      default:
        this.maxHp = 1.5;
        this.hp = 1.5;
        this.radius = 16;
        this.vx = -210;
        this.vy = 0;
        this.baseY = this.y;
        this.waveFreq = 0.05;
        this.waveAmp = 55;
        this.scoreValue = 100;
        this.shootTimer = 2.0 + Math.random() * 2.0;
        this.color = '#e91e63';
        this.shadowColor = '#880e4f';
        break;
    }

    // World Difficulty Multipliers: Enemy movement speed locked to 1.0x across all worlds
    // Shoot cooldown delay is made shorter (jeda sedikit & lebih sulit seiring meningkatnya world)
    let hpMult = 1.0;
    let spdMult = 1.0; // Strictly 1.0x across ALL worlds as requested
    let bSpdMult = 1.0;
    let cdMult = 0.88; // World 1: tighter firing interval

    if (this.world === 2) {
      hpMult = 1.40;
      spdMult = 1.0; // 1x in World 2
      bSpdMult = 1.25;
      cdMult = 0.70; // Shorter pause between shots (harder than before)
    } else if (this.world === 3) {
      hpMult = 1.80;
      spdMult = 1.0; // 1x in World 3
      bSpdMult = 1.50;
      cdMult = 0.52; // Even shorter pause between shots
    } else if (this.world === 4) {
      hpMult = 2.50;
      spdMult = 1.0; // 1x in World 4
      bSpdMult = 1.80;
      cdMult = 0.36; // Highly aggressive firing rhythm
    }

    // Difficulty Multipliers:
    // HP Mult: Beginner 0.75x, Extreme 1.5x, others 1.0x
    // Bullet Speed & Shoot Delay from Difficulty
    const diff = this.difficultyConfig || Enemy.difficultyConfig || {};
    const diffHp = diff.hpMult !== undefined ? diff.hpMult : 1.0;
    const diffBulletSpeed = diff.bulletSpeedMult !== undefined ? diff.bulletSpeedMult : 1.0;
    const diffShootCd = diff.shootCooldownMult !== undefined ? diff.shootCooldownMult : 1.0;

    this.bulletSpeedMult = bSpdMult * diffBulletSpeed;
    this.shootCooldownMult = cdMult * diffShootCd;
    this.speedMult = spdMult;

    this.maxHp = Math.round(this.maxHp * hpMult * diffHp * 10) / 10;
    this.hp = this.maxHp;
    if (this.maxShieldHp) {
      this.maxShieldHp = Math.round(this.maxShieldHp * hpMult * diffHp * 10) / 10;
      this.shieldHp = this.maxShieldHp;
    }
    this.vx *= spdMult;
    if (this.vy) this.vy *= spdMult;

    // World score multiplier: 1x, 2x, 3x, 4x
    let scoreWorldMult = this.world;
    this.scoreValue = Math.round(this.scoreValue * scoreWorldMult);
    if (this.shootTimer) this.shootTimer *= this.shootCooldownMult;
  }

  update(dt, player, bullets, sound, extraEnemies = []) {
    this.tick++;

    switch (this.type) {
      case 'SCOUT':
        this.x += this.vx * dt;
        this.y = this.baseY + Math.sin(this.x * this.waveFreq) * this.waveAmp;
        break;

      case 'DRONE':
        this.x += this.vx * dt;
        const dyDrone = player.y - this.y;
        this.y += Math.sign(dyDrone) * Math.min(Math.abs(dyDrone), 140 * dt * this.speedMult);

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.x < 1150 && this.x > player.x + 80) {
          this.shootTimer = (2.0 + Math.random()) * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 15,
            y: this.y,
            vx: -360 * this.bulletSpeedMult,
            vy: 0,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'GUNSHIP':
        if (this.x > this.targetHoverX) {
          this.x += this.vx * dt;
        } else {
          this.y += Math.sin(this.tick * 0.04) * 80 * dt * this.speedMult;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.x < 1200 && this.x > player.x + 50) {
          this.shootTimer = 1.8 * this.shootCooldownMult;
          const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
          const spd = 360 * this.bulletSpeedMult;

          [-0.2, 0, 0.2].forEach(offset => {
            bullets.push(new Bullet({
              x: this.x - 25,
              y: this.y,
              vx: Math.cos(angleToPlayer + offset) * spd,
              vy: Math.sin(angleToPlayer + offset) * spd,
              radius: 7,
              isEnemy: true
            }));
          });
          sound.playEnemyShoot();
        }
        break;

      case 'BLIMP':
        this.x += this.vx * dt;
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.x < 1200 && this.x > player.x + 50) {
          this.shootTimer = 1.6 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 60,
            y: this.y + 10,
            vx: -380 * this.bulletSpeedMult,
            vy: -40 * this.bulletSpeedMult,
            radius: 8,
            isEnemy: true
          }));
          bullets.push(new Bullet({
            x: this.x - 60,
            y: this.y + 10,
            vx: -380 * this.bulletSpeedMult,
            vy: 40 * this.bulletSpeedMult,
            radius: 8,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'STINGER':
        // If not yet charging, check if vertically aligned with player to charge!
        if (!this.charging && !this.hasCharged && this.x > player.x + 100 && this.x < 1150) {
          if (Math.abs(player.y - this.y) < 70) {
            this.charging = true;
            this.hasCharged = true;
            this.vx = -530 * this.speedMult;
            sound.playShoot('SPREAD');
          }
        }

        this.x += this.vx * dt;
        if (!this.charging) {
          this.y += this.baseVy * dt;
          if (this.y < 90 || this.y > 630) this.baseVy *= -1;
        }
        break;

      case 'SNIPER':
        if (this.x > this.targetX) {
          this.x += this.vx * dt;
        } else {
          // Hover in place and aim laser at player (aims faster in higher worlds)
          this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
          this.isAiming = true;
          this.aimTimer += dt * (1 / this.shootCooldownMult);

          if (this.aimTimer >= this.maxAimTime) {
            this.aimTimer = 0;
            this.isAiming = false;
            // Fire high velocity railgun sniper needle!
            const snpSpd = 760 * this.bulletSpeedMult;
            bullets.push(new Bullet({
              x: this.x - 30,
              y: this.y,
              vx: Math.cos(this.aimAngle) * snpSpd,
              vy: Math.sin(this.aimAngle) * snpSpd,
              radius: 6,
              type: 'ENEMY_SNIPER',
              isEnemy: true
            }));
            sound.playShoot('LASER');
            // Reposition slightly
            this.targetX = 1000 + Math.random() * 180;
          }
        }
        break;

      case 'BOMBER':
        this.x += this.vx * dt;
        this.bombTimer -= dt;
        if (this.bombTimer <= 0 && this.x > 150 && this.x < 1180) {
          this.bombTimer = (1.8 + Math.random() * 0.8) * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x,
            y: this.y + 20,
            vx: -80 * this.bulletSpeedMult,
            vy: 90 * this.bulletSpeedMult,
            gravity: 160 * this.bulletSpeedMult,
            radius: 9,
            type: 'ENEMY_BOMB',
            life: 2.2,
            isEnemy: true
          }));
          sound.playShoot('FLAK');
        }
        break;

      case 'SPINNER':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Bounce off top and bottom screen
        if (this.y < 70) {
          this.y = 70;
          this.vy = Math.abs(this.vy);
        } else if (this.y > 650) {
          this.y = 650;
          this.vy = -Math.abs(this.vy);
        }

        this.sparkTimer -= dt;
        if (this.sparkTimer <= 0 && this.x < 1150 && this.x > 100) {
          this.sparkTimer = 1.4 * this.shootCooldownMult;
          // 4 radial sparks
          const spkSpd = 320 * this.bulletSpeedMult;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
            bullets.push(new Bullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(a) * spkSpd,
              vy: Math.sin(a) * spkSpd,
              radius: 6,
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }
        break;

      case 'SHIELD_CRUISER':
        if (this.x > this.targetX) {
          this.x += this.vx * dt;
        } else {
          this.y += Math.sin(this.tick * 0.03) * 60 * dt * this.speedMult;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.x < 1200 && this.x > player.x + 60) {
          this.shootTimer = 1.9 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          const scSpd = 380 * this.bulletSpeedMult;
          bullets.push(new Bullet({
            x: this.x - 30,
            y: this.y - 12,
            vx: Math.cos(a) * scSpd,
            vy: Math.sin(a) * scSpd,
            radius: 7,
            isEnemy: true
          }));
          bullets.push(new Bullet({
            x: this.x - 30,
            y: this.y + 12,
            vx: Math.cos(a) * scSpd,
            vy: Math.sin(a) * scSpd,
            radius: 7,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'MINE_LAYER':
        this.x += this.vx * dt;
        this.mineTimer -= dt;
        if (this.mineTimer <= 0 && this.x > 300 && this.x < 1180) {
          this.mineTimer = (2.4 + Math.random()) * this.shootCooldownMult;
          extraEnemies.push(new Enemy({
            type: 'MINE',
            x: this.x + 20,
            y: this.y,
            stage: this.stage
          }));
          sound.playEnemyHit();
        }
        break;

      case 'MINE':
        this.x += this.vx * dt;
        this.y = this.baseY + Math.sin(this.tick * 0.05) * 20;
        break;

      case 'ACE':
        this.x += this.vx * dt;
        this.loopPhase += dt * 3.5 * this.speedMult;
        this.y = this.baseY + Math.sin(this.loopPhase) * 80;
        this.x += Math.cos(this.loopPhase) * 40 * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.x < 1150 && this.x > player.x + 80) {
          this.shootTimer = 1.2 * this.shootCooldownMult;
          const aceAngle = Math.atan2(player.y - this.y, player.x - this.x);
          bullets.push(new Bullet({
            x: this.x - 20,
            y: this.y,
            vx: Math.cos(aceAngle) * 440 * this.bulletSpeedMult,
            vy: Math.sin(aceAngle) * 440 * this.bulletSpeedMult,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'INTERCEPTOR':
        if (this.phaseState === 'APPROACH') {
          this.x += this.vx * dt;
          this.stateTimer -= dt;
          if (this.stateTimer <= 0 || this.x < 920) {
            this.phaseState = 'BRAKE_SHOOT';
            this.stateTimer = 0.55;
            this.hasShot = false;
          }
        } else if (this.phaseState === 'BRAKE_SHOOT') {
          this.x += (this.vx * 0.18) * dt;
          this.y += Math.sin(this.tick * 0.1) * 35 * dt;
          this.stateTimer -= dt;
          if (!this.hasShot && this.stateTimer <= 0.3) {
            this.hasShot = true;
            const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
            const offs = [-0.22, 0, 0.22];
            for (let k = 0; k < 3; k++) {
              const ang = targetAngle + offs[k];
              bullets.push(new Bullet({
                x: this.x - 25,
                y: this.y,
                vx: Math.cos(ang) * 600 * this.bulletSpeedMult,
                vy: Math.sin(ang) * 600 * this.bulletSpeedMult,
                radius: 7,
                type: 'ENEMY_SNIPER',
                isEnemy: true
              }));
            }
            sound.playEnemyShoot();
          }
          if (this.stateTimer <= 0) {
            this.phaseState = 'DASH_OUT';
            this.vx = -560 * this.speedMult;
          }
        } else {
          // DASH_OUT
          this.x += this.vx * dt;
        }
        break;

      case 'JUGGERNAUT':
        this.x += this.vx * dt;
        this.y += Math.sin(this.tick * 0.02) * 20 * dt;

        // Twin heavy mortar shells
        this.mortarTimer -= dt;
        if (this.mortarTimer <= 0 && this.x < 1250 && this.x > player.x + 80) {
          this.mortarTimer = 2.4 * this.shootCooldownMult;
          for (let k = 0; k < 2; k++) {
            const yOff = k === 0 ? -22 : 22;
            bullets.push(new Bullet({
              x: this.x - 45,
              y: this.y + yOff,
              vx: -280 * this.bulletSpeedMult,
              vy: -110,
              radius: 9,
              gravity: 190,
              type: 'ENEMY_MORTAR',
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }

        // Radial 5-way clay burst
        this.burstTimer -= dt;
        if (this.burstTimer <= 0 && this.x < 1180 && this.x > player.x + 50) {
          this.burstTimer = 1.6 * this.shootCooldownMult;
          const baseAng = Math.atan2(player.y - this.y, player.x - this.x);
          const bAngles = [-0.35, -0.18, 0, 0.18, 0.35];
          for (let k = 0; k < 5; k++) {
            const ang = baseAng + bAngles[k];
            bullets.push(new Bullet({
              x: this.x - 35,
              y: this.y,
              vx: Math.cos(ang) * 380 * this.bulletSpeedMult,
              vy: Math.sin(ang) * 380 * this.bulletSpeedMult,
              radius: 7,
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }
        break;

      case 'VORTEX_DRONE':
        this.x += this.vx * dt;
        this.orbitPhase += dt * 2.2 * this.speedMult;
        this.y = this.baseY + Math.sin(this.orbitPhase) * 85;

        this.vortexTimer -= dt;
        if (this.vortexTimer <= 0 && this.x < 1200 && this.x > player.x + 70) {
          this.vortexTimer = 2.4 * this.shootCooldownMult;
          for (let k = 0; k < 2; k++) {
            const yOff = k === 0 ? -20 : 20;
            bullets.push(new Bullet({
              x: this.x - 20,
              y: this.y + yOff,
              vx: -220,
              vy: yOff * 3.0,
              radius: 8,
              type: 'ENEMY_HOMING',
              life: 4.5,
              isEnemy: true
            }));
          }
          sound.playShoot('HOMING');
        }
        break;
    }

    return this.x > -140 && this.y > -100 && this.y < 820;
  }

  takeDamage(amount, bulletX = 0, piercing = false) {
    // Shield Cruiser & Juggernaut energy barrier mechanic
    if ((this.type === 'SHIELD_CRUISER' || this.type === 'JUGGERNAUT') && this.shieldHp > 0 && !piercing && bulletX > this.x - 20) {
      this.shieldHp -= amount;
      if (this.shieldHp < 0) {
        this.hp += this.shieldHp;
        this.shieldHp = 0;
      }
    } else {
      this.hp -= amount;
    }

    if (this.hp <= 0) {
      this.dead = true;
      return true; // killed
    }
    return false;
  }

  draw(ctx) {
    const hpRatio = Math.max(0, this.hp / this.maxHp);

    switch (this.type) {
      case 'SCOUT':
        ClayRenderer.drawScout(ctx, this.x, this.y, this.tick);
        break;
      case 'DRONE':
        ClayRenderer.drawDrone(ctx, this.x, this.y, this.tick);
        break;
      case 'GUNSHIP':
        ClayRenderer.drawGunship(ctx, this.x, this.y, hpRatio, this.tick);
        break;
      case 'BLIMP':
        ClayRenderer.drawBlimp(ctx, this.x, this.y, hpRatio, this.tick);
        break;
      case 'STINGER':
        ClayRenderer.drawStinger(ctx, this.x, this.y, this.tick);
        break;
      case 'SNIPER':
        // Draw telegraph targeting laser line when aiming
        if (this.isAiming) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(this.x - 30, this.y);
          ctx.lineTo(this.x - 30 + Math.cos(this.aimAngle) * 1200, this.y + Math.sin(this.aimAngle) * 1200);
          const aimAlpha = 0.2 + (this.aimTimer / this.maxAimTime) * 0.7;
          ctx.strokeStyle = `rgba(255, 23, 68, ${aimAlpha})`;
          ctx.lineWidth = 1.5 + (this.aimTimer / this.maxAimTime) * 2;
          ctx.setLineDash([8, 4]);
          ctx.stroke();
          ctx.restore();
        }
        ClayRenderer.drawSniper(ctx, this.x, this.y, this.isAiming, this.aimTimer / this.maxAimTime, this.tick);
        break;
      case 'BOMBER':
        ClayRenderer.drawBomber(ctx, this.x, this.y, hpRatio, this.tick);
        break;
      case 'SPINNER':
        ClayRenderer.drawSpinner(ctx, this.x, this.y, this.tick);
        break;
      case 'SHIELD_CRUISER': {
        const shieldRatio = Math.max(0, this.shieldHp / this.maxShieldHp);
        ClayRenderer.drawShieldCruiser(ctx, this.x, this.y, shieldRatio, hpRatio, this.tick);
        break;
      }
      case 'MINE_LAYER':
        ClayRenderer.drawMineLayer(ctx, this.x, this.y, hpRatio, this.tick);
        break;
      case 'MINE':
        ClayRenderer.drawMine(ctx, this.x, this.y, this.tick);
        break;
      case 'ACE': {
        const tilt = Math.cos(this.loopPhase);
        ClayRenderer.drawAce(ctx, this.x, this.y, tilt, hpRatio, this.tick);
        break;
      }
      case 'INTERCEPTOR':
        ClayRenderer.drawInterceptor(ctx, this.x, this.y, hpRatio, this.tick);
        break;
      case 'JUGGERNAUT': {
        const jShield = Math.max(0, this.shieldHp / this.maxShieldHp);
        ClayRenderer.drawJuggernaut(ctx, this.x, this.y, jShield, hpRatio, this.tick);
        break;
      }
      case 'VORTEX_DRONE':
        ClayRenderer.drawVortexDrone(ctx, this.x, this.y, hpRatio, this.tick);
        break;
    }
  }
}
