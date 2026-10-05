// Player Aircraft Entity (Novocastrian style)
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Clay3D } from '../graphics/Clay3D.js';
import { Bullet } from './Bullet.js';

export class Player {
  constructor(canvasWidth, canvasHeight, difficultyConfig = null) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.reset(difficultyConfig);
  }

  reset(difficultyConfig = null, cheatOverrides = null) {
    if (difficultyConfig) {
      this.difficultyConfig = difficultyConfig;
    }
    const diff = this.difficultyConfig || {
      maxLives: 10,
      scoreIntervalForLife: 200000,
      weaponDuration: 15,
      keepWeaponOnDeath: false
    };

    const cheats = (cheatOverrides !== null && cheatOverrides !== undefined) ? cheatOverrides : {};
    this.cheatOverrides = cheats;

    this.x = 160;
    this.y = this.canvasHeight / 2;
    this.radius = 22;
    this.speed = 460;
    this.tilt = 0;
    this.roll = 0;
    this.pitch = 0;
    this.targetRoll = 0;
    this.targetPitch = 0;
    this.altitude = 1.0;

    // Handle Invulnerability Duration
    this.invulnerableDuration = diff.invulnerableDuration || 2.2;

    // 1. Max Lives Cap (Uncapped by default - no maximum life limit):
    if (cheats.overrideMaxLives && cheats.maxLives !== undefined) {
      this.maxLives = Math.max(1, cheats.maxLives);
    } else {
      this.maxLives = Infinity;
    }

    // 2. Starting Lives & Infinite Lives (Godmode):
    if (cheats.overrideStartingLives && cheats.infiniteLives) {
      this.infiniteLives = true;
      this.lives = Infinity;
      this.maxLives = Infinity;
    } else if (cheats.overrideStartingLives && cheats.startingLives !== undefined) {
      this.infiniteLives = false;
      this.lives = Math.max(1, cheats.startingLives);
    } else {
      this.infiniteLives = false;
      this.lives = diff.startingLives || 3;
    }

    this.score = 0;

    // 3. Score Interval for +1 Extra Life:
    if (cheats.overrideScoreInterval && cheats.scoreIntervalForLife) {
      this.scoreIntervalForLife = Math.max(1000, cheats.scoreIntervalForLife);
    } else {
      this.scoreIntervalForLife = diff.scoreIntervalForLife || 200000;
    }
    this.nextLifeScore = this.scoreIntervalForLife;

    // 4. Weapon Duration & Infinite Weapon:
    this.activeWeapon = 'NORMAL';
    this.weaponTimeLeft = 0;
    if (cheats.overrideWeaponDuration && cheats.infiniteWeaponDuration) {
      this.infiniteWeapon = true;
      this.maxWeaponTime = Infinity;
    } else if (cheats.overrideWeaponDuration && cheats.weaponDuration !== undefined) {
      this.infiniteWeapon = false;
      this.maxWeaponTime = cheats.weaponDuration;
    } else {
      this.infiniteWeapon = false;
      this.maxWeaponTime = diff.weaponDuration || 15;
    }

    this.keepWeaponOnDeath = Boolean(diff.keepWeaponOnDeath) || Boolean(this.infiniteWeapon);
    this.shootTimer = 0;

    // 5. Active Skills: Speed Boost Overdrive (X)
    this.speedBoostMaxDuration = diff.speedBoostMaxDuration !== undefined ? diff.speedBoostMaxDuration : 15.0;
    this.speedBoostDurationPerDrop = diff.speedBoostDurationPerDrop !== undefined ? diff.speedBoostDurationPerDrop : 15.0;
    this.speedBoostTimeLeft = 0;
    this.speedBoostActive = false;
    this.speedBoostVx = diff.speedBoostVx || 2100;

    // Invulnerability
    this.invulnerableTimer = this.invulnerableDuration;
    this.engineTick = 0;
    this.dead = false;
  }

  get isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  respawn() {
    this.x = 160;
    this.y = this.canvasHeight / 2;
    // When keepWeaponOnDeath is enabled (Easy/Beginner mode) or infinite weapon active, active weapon is retained
    if (!this.keepWeaponOnDeath && !this.infiniteWeapon) {
      this.activeWeapon = 'NORMAL';
      this.weaponTimeLeft = 0;
    }
    this.speedBoostActive = false;
    this.invulnerableTimer = this.invulnerableDuration;
  }

  setWeapon(type) {
    this.activeWeapon = type;
    this.weaponTimeLeft = this.infiniteWeapon ? Infinity : this.maxWeaponTime;
  }

  update(dt, input, particles) {
    this.engineTick++;

    // Speed Boost countdown saat aktif (berlaku untuk semua senjata)
    if (this.speedBoostActive && this.speedBoostTimeLeft > 0) {
      this.speedBoostTimeLeft -= dt;
      if (this.speedBoostTimeLeft <= 0) {
        this.speedBoostTimeLeft = 0;
        this.speedBoostActive = false;
      }
    }

    // Weapon duration countdown
    if (this.activeWeapon !== 'NORMAL') {
      if (!this.infiniteWeapon) {
        this.weaponTimeLeft -= dt;
        if (this.weaponTimeLeft <= 0) {
          this.activeWeapon = 'NORMAL';
          this.weaponTimeLeft = 0;
        }
      } else {
        this.weaponTimeLeft = Infinity;
      }
    }

    // Invulnerability countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.shootTimer > 0) {
      this.shootTimer -= dt;
    }

    // Unified Movement Control: Supports Mouse, Touchpad, Touch, WASD, and Keyboard Arrows simultaneously
    let targetTilt = 0;
    const move = input.getMovementVector();
    const isKeyboardMoving = (move.dx !== 0 || move.dy !== 0);

    if (isKeyboardMoving) {
      // 1. Keyboard steering actively drives the ship
      this.x += move.dx * this.speed * dt;
      this.y += move.dy * this.speed * dt;
      targetTilt = move.dy;

      // Harmonize mouse virtual position to match current ship coordinates so future mouse moves transition seamlessly
      input.mouse.x = this.x;
      input.mouse.y = this.y;
      input.mouseSteeringActive = false;
    } else if (input.mouseSteeringActive && input.mouse.active) {
      // 2. Mouse / Touchpad / Touch steering smoothly glides the ship to pointer position
      const mx = Number.isFinite(input.mouse.x) ? input.mouse.x : this.x;
      const my = Number.isFinite(input.mouse.y) ? input.mouse.y : this.y;
      const targetX = Math.max(50, Math.min(this.canvasWidth - 80, mx));
      const targetY = Math.max(50, Math.min(this.canvasHeight - 50, my));

      const dx = targetX - this.x;
      const dy = targetY - this.y;

      this.x += dx * Math.min(1.0, 15 * dt);
      this.y += dy * Math.min(1.0, 15 * dt);

      targetTilt = Math.max(-1, Math.min(1, dy * 0.08));
    }

    // Smooth tilt interpolation
    this.tilt += (targetTilt - this.tilt) * 12 * dt;

    // 3D Aerodynamic Roll Banking & Pitch Kinematics (Plasticine Elasticity)
    this.targetRoll = targetTilt * 0.72; // Bank up to ~41 degrees into the turn
    const moveX = isKeyboardMoving ? move.dx : Math.max(-1, Math.min(1, ((input.mouse && Number.isFinite(input.mouse.x) ? input.mouse.x : this.x) - this.x) * 0.05));
    this.targetPitch = -moveX * 0.16 + (this.speedBoostActive ? -0.25 : 0);

    // Spring-damper plasticine elasticity interpolation with micro engine-hum wobble
    const clayWobble = Math.sin(this.engineTick * 0.35) * 0.015;
    this.roll += (this.targetRoll - this.roll) * 14 * dt + clayWobble;
    this.pitch += (this.targetPitch - this.pitch) * 12 * dt;
    this.altitude = 1.0 + Math.sin(this.engineTick * 0.06) * 0.15;

    // Strict boundary constraints and NaN-immunity
    this.x = Number.isFinite(this.x) ? Math.max(45, Math.min(this.canvasWidth - 55, this.x)) : 160;
    this.y = Number.isFinite(this.y) ? Math.max(45, Math.min(this.canvasHeight - 45, this.y)) : (this.canvasHeight / 2);

    // Exhaust smoke trail
    if (this.engineTick % 3 === 0 && particles) {
      particles.createSmokePuff(this.x - 30, this.y + (Math.random() - 0.5) * 6, 1, 10);
    }
  }

  shoot(sound) {
    if (this.shootTimer > 0) return null;

    const bullets = [];
    const noseX = this.x + 28;
    const wingTopY = this.y - 10;
    const wingBottomY = this.y + 10;

    const isBoosted = Boolean(this.speedBoostActive && this.speedBoostTimeLeft > 0);
    const rateMult = isBoosted ? (1 / 1.5) : 1.0;
    const spdMult = isBoosted ? 1.5 : 1.0;

    switch (this.activeWeapon) {
      case 'SPREAD':
        // Tier A+ Long-Range Full-Screen Carpet Sweeper & Distant Eraser (Arming phase in close-range)
        this.shootTimer = 0.21 * rateMult;
        sound.playShoot('SPREAD');
        const angles = [-0.32, -0.21, -0.11, 0, 0.11, 0.21, 0.32];
        const spd = 880 * spdMult;
        for (const ang of angles) {
          bullets.push(new Bullet({
            x: noseX,
            y: this.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            damage: 0.30, // Arming damage <180px, unfurls up to 1.45 at long-range
            type: 'SPREAD',
            radius: 7.5,
            startX: noseX,
            life: 1.8,
            boosted: isBoosted
          }));
        }
        break;

      case 'LASER':
        // Tier A+ Thermal Sniper: 2.0 damage, 3 pierces with dissipation, 1650 px/s hitscan velocity, 3.0x shield melting
        this.shootTimer = 0.16 * rateMult;
        sound.playShoot('LASER');
        bullets.push(new Bullet({
          x: noseX,
          y: wingTopY,
          vx: 1650 * spdMult,
          vy: 0,
          damage: 2.0,
          type: 'LASER',
          piercing: true,
          hitsLeft: 3,
          radius: 9,
          boosted: isBoosted
        }));
        bullets.push(new Bullet({
          x: noseX,
          y: wingBottomY,
          vx: 1650 * spdMult,
          vy: 0,
          damage: 2.0,
          type: 'LASER',
          piercing: true,
          hitsLeft: 3,
          radius: 9,
          boosted: isBoosted
        }));
        break;

      case 'HOMING':
        // Tier A+ Omnidirectional Agile Seeker: 1.4 damage, 15 rad/s turn, Smart Divergence (Upper/Lower Split)
        this.shootTimer = 0.19 * rateMult;
        sound.playShoot('HOMING');
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingTopY - 6,
          vx: 600 * spdMult,
          vy: -180 * spdMult,
          damage: 1.4,
          type: 'HOMING',
          targetSector: 'UPPER',
          radius: 8,
          boosted: isBoosted
        }));
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingBottomY + 6,
          vx: 600 * spdMult,
          vy: 180 * spdMult,
          damage: 1.4,
          type: 'HOMING',
          targetSector: 'LOWER',
          radius: 8,
          boosted: isBoosted
        }));
        break;

      case 'FLAK':
        // Tier A+ Heavy Siege Artillery: 5.2 direct (2x dmg), 1.5x cooldown (0.54s), 10-shrapnel airburst, 22px recoil kickback
        this.shootTimer = 0.54 * rateMult;
        this.x = Math.max(45, this.x - 22); // Heavy muzzle kickback recoil!
        sound.playShoot('FLAK');
        bullets.push(new Bullet({
          x: noseX,
          y: this.y,
          vx: 860 * spdMult,
          vy: 0,
          damage: 5.2,
          type: 'FLAK',
          radius: 14,
          boosted: isBoosted
        }));
        break;

      case 'PLASMA':
        // Tier A+ Creeping Electro-Disrupter: 1.2 direct, 420 px/s crawl, 3.2s life, 50% electro-paralysis, 4 Tesla targets
        this.shootTimer = 0.28 * rateMult;
        sound.playShoot('PLASMA');
        bullets.push(new Bullet({
          x: noseX,
          y: this.y,
          vx: 420 * spdMult,
          vy: 0,
          damage: 1.2,
          type: 'PLASMA',
          piercing: true,
          hitsLeft: 3,
          radius: 13,
          life: 3.2,
          boosted: isBoosted
        }));
        break;

      case 'NORMAL':
      default:
        // Balanced pea-shooter: boosted from 0.80 to 1.00 dmg each (~16.7 DPS)
        this.shootTimer = 0.12 * rateMult;
        const bulletSpeed = isBoosted ? this.speedBoostVx : 1050;
        sound.playShoot(isBoosted ? 'NORMAL_BOOSTED' : 'NORMAL');
        bullets.push(new Bullet({
          x: noseX,
          y: wingTopY,
          vx: bulletSpeed,
          vy: 0,
          damage: isBoosted ? 1.15 : 1.00,
          type: 'NORMAL',
          boosted: isBoosted,
          radius: isBoosted ? 7 : 6.5
        }));
        bullets.push(new Bullet({
          x: noseX,
          y: wingBottomY,
          vx: bulletSpeed,
          vy: 0,
          damage: isBoosted ? 1.15 : 1.00,
          type: 'NORMAL',
          boosted: isBoosted,
          radius: isBoosted ? 7 : 6.5
        }));
        break;
    }

    return bullets;
  }

  addScore(points, isRaw = false) {
    const diffMult = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
      ? this.difficultyConfig.scoreMultiplier
      : 1.0;
    const earned = isRaw ? Math.round(points) : Math.round(points * diffMult);
    this.score += earned;

    // Extra life every scoreIntervalForLife
    let livesAwarded = 0;
    while (this.score >= this.nextLifeScore) {
      this.nextLifeScore += this.scoreIntervalForLife;
      if (!this.infiniteLives) {
        this.lives++;
        livesAwarded++;
      }
    }
    return { earned, livesAwarded };
  }

  hit() {
    if (this.invulnerableTimer > 0) return false;
    if (this.infiniteLives) {
      this.invulnerableTimer = this.invulnerableDuration || 2.5;
      return true;
    }
    this.lives--;
    this.invulnerableTimer = this.invulnerableDuration || 2.2;
    if (this.lives <= 0) {
      this.dead = true;
    }
    return true;
  }

  draw(ctx) {
    ClayRenderer.drawPlayerShip(
      ctx,
      this.x,
      this.y,
      this.tilt,
      this.invulnerableTimer > 0,
      this.engineTick,
      this.activeWeapon,
      this.roll,
      this.pitch,
      Boolean(this.speedBoostActive && this.speedBoostTimeLeft > 0)
    );
  }

  drawShadow(ctx) {
    if (this.lives > 0) {
      Clay3D.draw3DGroundShadow(ctx, this.x, this.y, this.altitude || 1.0, 36, 15);
    }
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
      speed: this.speed,
      tilt: this.tilt,
      roll: this.roll,
      pitch: this.pitch,
      altitude: this.altitude,
      invulnerableDuration: this.invulnerableDuration,
      invulnerableTimer: this.invulnerableTimer,
      maxLives: this.maxLives === Infinity ? 'Infinity' : this.maxLives,
      infiniteLives: Boolean(this.infiniteLives),
      lives: this.lives === Infinity ? 'Infinity' : this.lives,
      score: this.score,
      scoreIntervalForLife: this.scoreIntervalForLife,
      nextLifeScore: this.nextLifeScore,
      activeWeapon: this.activeWeapon,
      weaponTimeLeft: this.weaponTimeLeft === Infinity ? 'Infinity' : this.weaponTimeLeft,
      infiniteWeapon: Boolean(this.infiniteWeapon),
      maxWeaponTime: this.maxWeaponTime === Infinity ? 'Infinity' : this.maxWeaponTime,
      keepWeaponOnDeath: Boolean(this.keepWeaponOnDeath),
      shootTimer: this.shootTimer,
      speedBoostMaxDuration: this.speedBoostMaxDuration,
      speedBoostDurationPerDrop: this.speedBoostDurationPerDrop,
      speedBoostTimeLeft: this.speedBoostTimeLeft,
      speedBoostActive: Boolean(this.speedBoostActive),
      speedBoostVx: this.speedBoostVx,
      engineTick: this.engineTick,
      dead: Boolean(this.dead),
      difficultyConfig: this.difficultyConfig,
      cheatOverrides: this.cheatOverrides
    };
  }

  deserialize(data) {
    if (!data) return;
    if (data.difficultyConfig) this.difficultyConfig = data.difficultyConfig;
    if (data.cheatOverrides) this.cheatOverrides = data.cheatOverrides;
    this.x = (data.x !== undefined && Number.isFinite(data.x)) ? Math.max(45, Math.min(this.canvasWidth - 55, data.x)) : (Number.isFinite(this.x) ? this.x : 160);
    this.y = (data.y !== undefined && Number.isFinite(data.y)) ? Math.max(45, Math.min(this.canvasHeight - 45, data.y)) : (Number.isFinite(this.y) ? this.y : (this.canvasHeight / 2));
    this.radius = data.radius !== undefined ? data.radius : this.radius;
    this.speed = data.speed !== undefined ? data.speed : this.speed;
    this.tilt = data.tilt !== undefined ? data.tilt : this.tilt;
    this.roll = data.roll !== undefined ? data.roll : (this.tilt * 0.45);
    this.pitch = data.pitch !== undefined ? data.pitch : 0;
    this.altitude = data.altitude !== undefined ? data.altitude : 1.0;
    this.invulnerableDuration = data.invulnerableDuration !== undefined ? data.invulnerableDuration : this.invulnerableDuration;
    this.invulnerableTimer = data.invulnerableTimer !== undefined ? data.invulnerableTimer : this.invulnerableTimer;
    this.maxLives = data.maxLives === 'Infinity' ? Infinity : (data.maxLives !== undefined ? data.maxLives : this.maxLives);
    this.infiniteLives = Boolean(data.infiniteLives);
    this.lives = data.lives === 'Infinity' ? Infinity : (data.lives !== undefined ? data.lives : this.lives);
    this.score = data.score !== undefined ? data.score : this.score;
    this.scoreIntervalForLife = data.scoreIntervalForLife !== undefined ? data.scoreIntervalForLife : this.scoreIntervalForLife;
    this.nextLifeScore = data.nextLifeScore !== undefined ? data.nextLifeScore : this.nextLifeScore;
    this.activeWeapon = data.activeWeapon || this.activeWeapon;
    this.weaponTimeLeft = data.weaponTimeLeft === 'Infinity' ? Infinity : (data.weaponTimeLeft !== undefined ? data.weaponTimeLeft : this.weaponTimeLeft);
    this.infiniteWeapon = Boolean(data.infiniteWeapon);
    this.maxWeaponTime = data.maxWeaponTime === 'Infinity' ? Infinity : (data.maxWeaponTime !== undefined ? data.maxWeaponTime : this.maxWeaponTime);
    this.keepWeaponOnDeath = Boolean(data.keepWeaponOnDeath);
    this.shootTimer = data.shootTimer !== undefined ? data.shootTimer : this.shootTimer;
    this.speedBoostMaxDuration = data.speedBoostMaxDuration !== undefined ? data.speedBoostMaxDuration : this.speedBoostMaxDuration;
    this.speedBoostDurationPerDrop = data.speedBoostDurationPerDrop !== undefined ? data.speedBoostDurationPerDrop : this.speedBoostDurationPerDrop;
    this.speedBoostTimeLeft = data.speedBoostTimeLeft !== undefined ? data.speedBoostTimeLeft : this.speedBoostTimeLeft;
    this.speedBoostActive = Boolean(data.speedBoostActive);
    this.speedBoostVx = data.speedBoostVx !== undefined ? data.speedBoostVx : this.speedBoostVx;
    this.engineTick = data.engineTick !== undefined ? data.engineTick : this.engineTick;
    this.dead = Boolean(data.dead);
  }
}

