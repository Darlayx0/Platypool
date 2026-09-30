// Player Aircraft Entity (Novocastrian style)
import { ClayRenderer } from '../graphics/ClayRenderer.js';
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
      scoreIntervalForLife: 2000000,
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

    // Handle Invulnerability Duration
    this.invulnerableDuration = diff.invulnerableDuration || 2.2;

    // 1. Max Lives Cap:
    if (cheats.overrideMaxLives && cheats.maxLives !== undefined) {
      this.maxLives = Math.max(1, cheats.maxLives);
    } else {
      this.maxLives = diff.maxLives !== undefined ? diff.maxLives : 10;
    }

    // 2. Starting Lives & Infinite Lives (Godmode):
    if (cheats.overrideStartingLives && cheats.infiniteLives) {
      this.infiniteLives = true;
      this.lives = Infinity;
      this.maxLives = Infinity;
    } else if (cheats.overrideStartingLives && cheats.startingLives !== undefined) {
      this.infiniteLives = false;
      this.lives = Math.max(1, cheats.startingLives);
      // Ensure maxLives is at least startingLives
      if (this.maxLives < this.lives) {
        this.maxLives = this.lives;
      }
    } else {
      this.infiniteLives = false;
      this.lives = Math.min(diff.startingLives || 3, this.maxLives);
    }

    this.score = 0;

    // 3. Score Interval for +1 Extra Life:
    if (cheats.overrideScoreInterval && cheats.scoreIntervalForLife) {
      this.scoreIntervalForLife = Math.max(10000, cheats.scoreIntervalForLife);
    } else {
      this.scoreIntervalForLife = diff.scoreIntervalForLife || 2000000;
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

    // 5. Active Skills: Pulse (Z) & Speed Boost (X)
    this.pulseMaxStock = diff.pulseMaxStock !== undefined ? diff.pulseMaxStock : 1;
    this.pulseCharges = diff.pulseStartingStock !== undefined ? Math.min(this.pulseMaxStock, diff.pulseStartingStock) : 1;
    this.speedBoostMaxDuration = diff.speedBoostMaxDuration !== undefined ? diff.speedBoostMaxDuration : 30.0;
    this.speedBoostDurationPerDrop = diff.speedBoostDurationPerDrop !== undefined ? diff.speedBoostDurationPerDrop : 10.0;
    this.speedBoostTimeLeft = 0;
    this.speedBoostActive = false;
    this.speedBoostVx = diff.speedBoostVx || 2100;

    // Invulnerability
    this.invulnerableTimer = this.invulnerableDuration;
    this.engineTick = 0;
    this.dead = false;
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
    // Saat senjata spesial aktif, peningkat senjata normal otomatis nonaktif dan diblokir
    if (this.activeWeapon !== 'NORMAL') {
      this.speedBoostActive = false;
    }
  }

  update(dt, input, particles) {
    this.engineTick++;

    // Speed Boost countdown saat aktif (diblokir dan otomatis mati jika senjata bukan NORMAL)
    if (this.activeWeapon !== 'NORMAL') {
      this.speedBoostActive = false;
    } else if (this.speedBoostActive && this.speedBoostTimeLeft > 0) {
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

    // Movement control
    let targetTilt = 0;

    if (input.controlMode === 'MOUSE' && input.mouse.active) {
      // Smooth lerp to mouse position
      const targetX = Math.max(50, Math.min(this.canvasWidth - 80, input.mouse.x));
      const targetY = Math.max(50, Math.min(this.canvasHeight - 50, input.mouse.y));

      const dx = targetX - this.x;
      const dy = targetY - this.y;

      this.x += dx * Math.min(1.0, 14 * dt);
      this.y += dy * Math.min(1.0, 14 * dt);

      targetTilt = Math.max(-1, Math.min(1, dy * 0.08));
    } else {
      // Keyboard WASD / Arrows
      const move = input.getMovementVector();
      this.x += move.dx * this.speed * dt;
      this.y += move.dy * this.speed * dt;

      targetTilt = move.dy;
    }

    // Smooth tilt interpolation
    this.tilt += (targetTilt - this.tilt) * 12 * dt;

    // Boundary constraints
    this.x = Math.max(45, Math.min(this.canvasWidth - 55, this.x));
    this.y = Math.max(45, Math.min(this.canvasHeight - 45, this.y));

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

    switch (this.activeWeapon) {
      case 'SPREAD':
        // Tier A+ CQB Shotgun & Defensive Eraser: 7-way spread, 1.0 dmg per pellet (~38.9 DPS point blank), range falloff, bullet-eraser
        this.shootTimer = 0.18;
        sound.playShoot('SPREAD');
        const angles = [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30];
        for (const ang of angles) {
          const spd = 900;
          bullets.push(new Bullet({
            x: noseX,
            y: this.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            damage: 1.0,
            type: 'SPREAD',
            radius: 7,
            startX: noseX,
            life: 1.5
          }));
        }
        break;

      case 'LASER':
        // Tier A+ Thermal Sniper: 2.0 damage each (~30.8 DPS pure melt), 4 pierces, hitscan velocity, 2x shield melting
        this.shootTimer = 0.13;
        sound.playShoot('LASER');
        bullets.push(new Bullet({
          x: noseX,
          y: wingTopY,
          vx: 1300,
          vy: 0,
          damage: 2.0,
          type: 'LASER',
          piercing: true,
          hitsLeft: 4,
          radius: 9
        }));
        bullets.push(new Bullet({
          x: noseX,
          y: wingBottomY,
          vx: 1300,
          vy: 0,
          damage: 2.0,
          type: 'LASER',
          piercing: true,
          hitsLeft: 4,
          radius: 9
        }));
        break;

      case 'HOMING':
        // Tier A+ Agile Harasser: 2.0 damage each (~20.0 DPS), 100% smart lock & turn speed for dodging in bullet hell
        this.shootTimer = 0.20;
        sound.playShoot('HOMING');
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingTopY - 6,
          vx: 650,
          vy: -180,
          damage: 2.0,
          type: 'HOMING',
          radius: 8
        }));
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingBottomY + 6,
          vx: 650,
          vy: 180,
          damage: 2.0,
          type: 'HOMING',
          radius: 8
        }));
        break;

      case 'FLAK':
        // Tier A+ Siege Demolition: 3.8 direct damage, instant shield shatter, expanded 8 shrapnel burst (0.65s life)
        this.shootTimer = 0.28;
        sound.playShoot('FLAK');
        bullets.push(new Bullet({
          x: noseX,
          y: this.y,
          vx: 820,
          vy: 0,
          damage: 3.8,
          type: 'FLAK',
          radius: 13
        }));
        break;

      case 'PLASMA':
        // Tier A+ Crowd Disrupter: 2.4 direct damage, pierce decay, Tesla arc micro-slow/stun on swarms, 50% vs Boss armor
        this.shootTimer = 0.22;
        sound.playShoot('PLASMA');
        bullets.push(new Bullet({
          x: noseX,
          y: this.y,
          vx: 640,
          vy: 0,
          damage: 2.4,
          type: 'PLASMA',
          piercing: true,
          hitsLeft: 3,
          radius: 12
        }));
        break;

      case 'NORMAL':
      default:
        // Balanced pea-shooter: boosted from 0.80 to 1.00 dmg each (~16.7 DPS)
        this.shootTimer = 0.12;
        const isBoosted = Boolean(this.speedBoostActive && this.speedBoostTimeLeft > 0);
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
      if (!this.infiniteLives && this.lives < this.maxLives) {
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
      this.activeWeapon
    );
  }
}
