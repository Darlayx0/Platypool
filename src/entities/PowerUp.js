// Collectibles: Weapon Cycling Capsule and Fruit/Star Drops
import { ClayRenderer } from '../graphics/ClayRenderer.js';

export const WEAPON_TYPES = ['SPREAD', 'LASER', 'HOMING', 'FLAK', 'PLASMA'];

export class PowerUpCapsule {
  constructor(x, y, weaponType = null) {
    this.x = x;
    this.y = y;
    this.vx = -85; // drifts left
    this.vy = 0;
    this.radius = 24;
    // Weapon is randomly pre-determined on spawn and cannot be changed by bullets
    if (weaponType && WEAPON_TYPES.includes(weaponType)) {
      this.weaponType = weaponType;
    } else {
      this.weaponType = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
    }
    this.weaponIndex = WEAPON_TYPES.indexOf(this.weaponType);
    this.tick = 0;
    this.hitCooldown = 0;
    this.dead = false;
    this.wobble = 0;
  }

  cycleWeapon() {
    // Weapon is fixed and immutable once dropped
    return this.weaponIndex;
  }

  update(dt) {
    this.tick++;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.wobble > 0) this.wobble -= dt * 3;

    // Gentle wave drift
    this.y += Math.sin(this.tick * 0.05) * 40 * dt;
    this.x += this.vx * dt;

    return this.x > -60;
  }

  draw(ctx) {
    ClayRenderer.drawPowerUpCapsule(ctx, this.x, this.y, this.weaponType, this.tick);
  }
}

export class FruitDrop {
  constructor(x, y, type = 'CHERRY', stage = 1) {
    this.x = x;
    this.y = y;
    this.type = type; // CHERRY, BANANA, APPLE, STAR
    this.stage = stage;
    this.world = Math.min(4, Math.max(1, Math.floor((this.stage - 1) / 5) + 1));
    this.vx = -110;
    this.vy = -40; // slight initial upward pop
    this.radius = 16;
    this.tick = Math.random() * 100;
    this.dead = false;

    // Greatly boosted drop point values
    const baseValues = {
      CHERRY: 2500,
      BANANA: 5000,
      APPLE: 10000,
      STAR: 25000
    };
    const worldMult = 1 + (this.world - 1) * 0.75;
    this.points = Math.round((baseValues[type] || 2500) * worldMult);
  }

  update(dt) {
    this.tick++;
    this.vy += 90 * dt; // gravity arc
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    return this.x > -40 && this.y < 760;
  }

  draw(ctx) {
    ClayRenderer.drawFruit(ctx, this.x, this.y, this.type, this.tick);
  }
}
