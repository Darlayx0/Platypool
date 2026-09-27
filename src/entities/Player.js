// Player Aircraft Entity (Novocastrian style)
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Bullet } from './Bullet.js';

export class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.reset();
  }

  reset(difficultyConfig = null, cheatOverrides = null) {
    if (difficultyConfig) {
      this.difficultyConfig = difficultyConfig;
    }
    const diff = this.difficultyConfig || {
      maxLives: 10,
      scoreIntervalForLife: 250000,
      weaponDuration: 15,
      keepWeaponOnDeath: false
    };

    const cheats = cheatOverrides !== null ? cheatOverrides : (this.cheatOverrides || {});
    this.cheatOverrides = cheats;

    this.x = 160;
    this.y = this.canvasHeight / 2;
    this.radius = 22;
    this.speed = 460;
    this.tilt = 0;

    // Handle Infinite Lives vs Custom Starting Lives vs Difficulty Default
    if (cheats.infiniteLives) {
      this.infiniteLives = true;
      this.lives = Infinity;
      this.maxLives = Infinity;
    } else if (cheats.startingLives !== undefined && cheats.startingLives !== null) {
      this.infiniteLives = false;
      this.maxLives = Math.max(20, cheats.startingLives);
      this.lives = cheats.startingLives;
    } else {
      this.infiniteLives = false;
      this.maxLives = diff.maxLives !== undefined ? diff.maxLives : 10;
      this.lives = Math.min(3, this.maxLives);
    }

    this.score = 0;
    this.scoreIntervalForLife = diff.scoreIntervalForLife || 250000;
    this.nextLifeScore = this.scoreIntervalForLife;
    this.combo = 1;
    this.comboTimer = 0;

    // Weapon state (Infinite duration vs custom duration vs difficulty default)
    this.activeWeapon = 'NORMAL';
    this.weaponTimeLeft = 0;
    if (cheats.infiniteWeaponDuration) {
      this.infiniteWeapon = true;
      this.maxWeaponTime = Infinity;
    } else if (cheats.weaponDuration !== undefined && cheats.weaponDuration !== null) {
      this.infiniteWeapon = false;
      this.maxWeaponTime = cheats.weaponDuration;
    } else {
      this.infiniteWeapon = false;
      this.maxWeaponTime = diff.weaponDuration || 15;
    }

    this.keepWeaponOnDeath = Boolean(diff.keepWeaponOnDeath) || Boolean(this.infiniteWeapon);
    this.shootTimer = 0;

    // Invulnerability
    this.invulnerableTimer = 2.5; // seconds
    this.engineTick = 0;
    this.dead = false;
  }

  respawn() {
    this.x = 160;
    this.y = this.canvasHeight / 2;
    // When keepWeaponOnDeath is enabled (Easy mode) or infinite weapon active, active weapon is retained
    if (!this.keepWeaponOnDeath && !this.infiniteWeapon) {
      this.activeWeapon = 'NORMAL';
      this.weaponTimeLeft = 0;
    }
    this.invulnerableTimer = 3.0;
  }

  setWeapon(type) {
    this.activeWeapon = type;
    this.weaponTimeLeft = this.infiniteWeapon ? Infinity : this.maxWeaponTime;
  }

  update(dt, input, particles) {
    this.engineTick++;

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

    // Combo multiplier countdown
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
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
        // Balanced 5-way spread blast: wide crowd control, 1.1 damage per pellet
        this.shootTimer = 0.18;
        sound.playShoot('SPREAD');
        const angles = [-0.28, -0.14, 0, 0.14, 0.28];
        for (const ang of angles) {
          const spd = 880;
          bullets.push(new Bullet({
            x: noseX,
            y: this.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            damage: 1.1,
            type: 'SPREAD',
            radius: 7
          }));
        }
        break;

      case 'LASER':
        // Piercing sonic beam: 1.8 damage each, 4 pierces, high velocity
        this.shootTimer = 0.13;
        sound.playShoot('LASER');
        bullets.push(new Bullet({
          x: noseX,
          y: wingTopY,
          vx: 1300,
          vy: 0,
          damage: 1.8,
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
          damage: 1.8,
          type: 'LASER',
          piercing: true,
          hitsLeft: 4,
          radius: 9
        }));
        break;

      case 'HOMING':
        // Swarm rockets: agile smart tracking, 2.3 damage each
        this.shootTimer = 0.20;
        sound.playShoot('HOMING');
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingTopY - 6,
          vx: 650,
          vy: -180,
          damage: 2.3,
          type: 'HOMING',
          radius: 8
        }));
        bullets.push(new Bullet({
          x: noseX - 5,
          y: wingBottomY + 6,
          vx: 650,
          vy: 180,
          damage: 2.3,
          type: 'HOMING',
          radius: 8
        }));
        break;

      case 'FLAK':
        // Heavy clay flak bomb: 3.8 direct damage, 8 shrapnel burst of 1.3 damage
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
        // Unique Plasma Arc Orb: travels forward, piercing 3x, emitting Tesla arcs to nearby enemies
        this.shootTimer = 0.22;
        sound.playShoot('PLASMA');
        bullets.push(new Bullet({
          x: noseX,
          y: this.y,
          vx: 640,
          vy: 0,
          damage: 2.6,
          type: 'PLASMA',
          piercing: true,
          hitsLeft: 3,
          radius: 12
        }));
        break;

      case 'NORMAL':
      default:
        // Balanced pea-shooter: boosted from 0.45 to 0.80 dmg each (~12.3 DPS) for reliable defense without rivaling power weapons
        this.shootTimer = 0.13;
        sound.playShoot('NORMAL');
        bullets.push(new Bullet({
          x: noseX,
          y: wingTopY,
          vx: 980,
          vy: 0,
          damage: 0.80,
          type: 'NORMAL',
          radius: 6
        }));
        bullets.push(new Bullet({
          x: noseX,
          y: wingBottomY,
          vx: 980,
          vy: 0,
          damage: 0.80,
          type: 'NORMAL',
          radius: 6
        }));
        break;
    }

    return bullets;
  }

  addScore(points) {
    this.score += points * this.combo;
    this.combo = Math.min(8, this.combo + 0.1);
    this.comboTimer = 2.5; // refresh combo window

    // Extra life every scoreIntervalForLife
    let livesAwarded = 0;
    while (this.score >= this.nextLifeScore) {
      this.nextLifeScore += this.scoreIntervalForLife;
      if (!this.infiniteLives && this.lives < this.maxLives) {
        this.lives++;
        livesAwarded++;
      }
    }
    return livesAwarded;
  }

  hit() {
    if (this.invulnerableTimer > 0) return false;
    if (this.infiniteLives) {
      this.invulnerableTimer = 2.5;
      return true;
    }
    this.lives--;
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
