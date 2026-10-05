// Collectibles: Weapon Cycling Capsule and Fruit Drops with Realistic Physics
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Clay3D } from '../graphics/Clay3D.js';

export const WEAPON_TYPES = ['SPREAD', 'LASER', 'HOMING', 'FLAK', 'PLASMA'];

// 6 Distinct Fruit Definitions: from Common/Ordinary to Rare and Legendary/Special
export const FRUIT_CONFIGS = {
  CHERRY: {
    id: 'CHERRY',
    name: 'Ceri',
    label: '🍒 CERI',
    baseValue: 600,
    weight: 40,
    tier: 'COMMON',
    color: '#d32f2f'
  },
  BANANA: {
    id: 'BANANA',
    name: 'Pisang',
    label: '🍌 PISANG',
    baseValue: 1500,
    weight: 25,
    tier: 'COMMON',
    color: '#fdd835'
  },
  APPLE: {
    id: 'APPLE',
    name: 'Apel',
    label: '🍎 APEL',
    baseValue: 3600,
    weight: 18,
    tier: 'STANDARD',
    color: '#e53935'
  },
  WATERMELON: {
    id: 'WATERMELON',
    name: 'Semangka',
    label: '🍉 SEMANGKA',
    baseValue: 7500,
    weight: 10,
    tier: 'RARE',
    color: '#00e676'
  },
  DRAGONFRUIT: {
    id: 'DRAGONFRUIT',
    name: 'Buah Naga',
    label: '🐉 BUAH NAGA',
    baseValue: 12600,
    weight: 5,
    tier: 'VERY_RARE',
    color: '#e040fb'
  },
  GOLDEN_FRUIT: {
    id: 'GOLDEN_FRUIT',
    name: 'Buah Bintang Emas',
    label: '⭐ BUAH EMAS SPESIAL',
    baseValue: 18000,
    weight: 2,
    tier: 'SPECIAL',
    color: '#ffd700'
  }
};

export const FRUIT_TYPES = Object.keys(FRUIT_CONFIGS);

/**
 * Returns World Multiplier according to stage:
 * World 1 (Stage 1 – 5)  : 1.00x
 * World 2 (Stage 6 – 10) : 2.00x
 * World 3 (Stage 11 – 15): 3.00x
 * World 4 (Stage 16 – 20): 4.00x
 */
export function getWorldMultiplier(stage = 1) {
  const world = Math.min(4, Math.max(1, Math.floor((stage - 1) / 5) + 1));
  switch (world) {
    case 1: return 1.0;
    case 2: return 2.0;
    case 3: return 3.0;
    case 4: return 4.0;
    default: return 1.0;
  }
}

/**
 * Weighted random fruit selection based on rarity table
 * tierBoost: 0 = normal enemy drop, 1 = elite/formation clear, 2 = boss explosion burst
 */
export function getRandomFruitType(tierBoost = 0) {
  let weights;
  if (tierBoost >= 2) {
    // Boss drop: richer distribution of high-value and special fruits
    weights = {
      CHERRY: 20,
      BANANA: 22,
      APPLE: 24,
      WATERMELON: 18,
      DRAGONFRUIT: 11,
      GOLDEN_FRUIT: 5
    };
  } else if (tierBoost === 1) {
    // Elite enemy or formation clear
    weights = {
      CHERRY: 28,
      BANANA: 26,
      APPLE: 22,
      WATERMELON: 14,
      DRAGONFRUIT: 7,
      GOLDEN_FRUIT: 3
    };
  } else {
    // Normal enemy kill: strict rarity gradient
    weights = {
      CHERRY: 40,
      BANANA: 25,
      APPLE: 18,
      WATERMELON: 10,
      DRAGONFRUIT: 5,
      GOLDEN_FRUIT: 2
    };
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [type, w] of Object.entries(weights)) {
    if (roll < w) return type;
    roll -= w;
  }
  return 'CHERRY';
}

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
    if (ClayRenderer.use3D) return; // rendered by Scene3D
    ClayRenderer.drawPowerUpCapsule(ctx, this.x, this.y, this.weaponType, this.tick);
  }

  drawShadow(ctx) {
    if (!this.dead && this.x > -40 && this.x < 1350) {
      Clay3D.draw3DGroundShadow(ctx, this.x, this.y, 0.7, 24, 12);
    }
  }

  serialize() {
    return {
      collectibleType: 'CAPSULE',
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      radius: this.radius,
      weaponType: this.weaponType,
      weaponIndex: this.weaponIndex,
      tick: this.tick,
      hitCooldown: this.hitCooldown,
      dead: Boolean(this.dead),
      wobble: this.wobble
    };
  }
}

export class FruitDrop {
  constructor(x, y, type = 'CHERRY', stage = 1, options = {}) {
    this.x = x;
    this.y = y;
    this.type = FRUIT_CONFIGS[type] ? type : 'CHERRY';
    this.stage = stage;
    this.world = Math.min(4, Math.max(1, Math.floor((this.stage - 1) / 5) + 1));
    this.worldMultiplier = getWorldMultiplier(this.stage);

    const cfg = FRUIT_CONFIGS[this.type] || FRUIT_CONFIGS.CHERRY;
    this.basePoints = cfg.baseValue;
    this.points = Math.round(this.basePoints * this.worldMultiplier);
    this.label = cfg.label;

    // Realistic Physics Properties
    this.isBossDrop = Boolean(options.isBossDrop);
    this.vx = options.vx !== undefined ? options.vx : -110;
    this.vy = options.vy !== undefined ? options.vy : -50;
    this.gravity = options.gravity !== undefined ? options.gravity : (this.isBossDrop ? 520 : 130);
    this.bounce = options.bounce !== undefined ? options.bounce : (this.isBossDrop ? 0.65 : 0.35);
    this.friction = options.friction !== undefined ? options.friction : 0.985;
    this.groundFriction = options.groundFriction !== undefined ? options.groundFriction : 0.86;
    this.radius = 18;
    this.rotation = options.rotation !== undefined ? options.rotation : Math.random() * Math.PI * 2;
    this.vRot = options.vRot !== undefined ? options.vRot : (Math.random() - 0.5) * 8;
    this.tick = Math.random() * 100;
    this.dead = false;
    this.life = options.life !== undefined ? options.life : (this.isBossDrop ? 15.0 : 10.0);
    this.maxLife = this.life;
    this.groundY = 665;
  }

  update(dt, player = null) {
    this.tick++;
    if (this.life > 0) this.life -= dt;
    if (this.life <= 0) return false;

    // Gentle clay magnetic pull when player is nearby (AABB fast rejection)
    if (player && !player.dead) {
      const magnetRange = this.isBossDrop ? 160 : 120;
      const dx = player.x - this.x;
      if (dx > -magnetRange && dx < magnetRange) {
        const dy = player.y - this.y;
        if (dy > -magnetRange && dy < magnetRange) {
          const distSq = dx * dx + dy * dy;
          if (distSq < magnetRange * magnetRange && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const pullFactor = (1 - dist / magnetRange) * 420;
            const invDist = 1 / dist;
            this.vx += dx * invDist * pullFactor * dt;
            this.vy += dy * invDist * pullFactor * dt;
          }
        }
      }
    }

    // Realistic 2D Physics: Gravity & Aerodynamic Drag
    this.vy += this.gravity * dt;
    this.vx *= Math.pow(this.friction, dt * 60);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vRot * dt;

    // Floor Bounce & Friction
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      if (Math.abs(this.vy) > 30) {
        this.vy = -this.vy * this.bounce;
        this.vx *= this.groundFriction;
        this.vRot *= 0.75;
      } else {
        this.vy = 0;
        this.vx *= 0.92;
        this.vRot *= 0.85;
      }
    }

    // Wall Bounces for Boss Drops (keeps shower of fruits on screen to collect)
    if (this.isBossDrop) {
      if (this.x < 24) {
        this.x = 24;
        this.vx = Math.abs(this.vx) * this.bounce;
      } else if (this.x > 1256) {
        this.x = 1256;
        this.vx = -Math.abs(this.vx) * this.bounce;
      }
      if (this.y < 24) {
        this.y = 24;
        this.vy = Math.abs(this.vy) * this.bounce;
      }
      return true;
    }

    return this.x > -50 && this.y < 760;
  }

  draw(ctx) {
    if (ClayRenderer.use3D) return; // rendered by Scene3D
    // Blinking effect when life is about to expire
    if (this.life < 2.5 && Math.sin(this.life * 14) < 0) {
      return;
    }
    ClayRenderer.drawFruit(ctx, this.x, this.y, this.type, this.tick, this.rotation);
  }

  drawShadow(ctx) {
    if (!this.dead && this.x > -40 && this.x < 1350) {
      Clay3D.draw3DGroundShadow(ctx, this.x, this.y, 0.6, 18, 9);
    }
  }

  serialize() {
    return {
      collectibleType: 'FRUIT',
      x: this.x,
      y: this.y,
      type: this.type,
      stage: this.stage,
      world: this.world,
      worldMultiplier: this.worldMultiplier,
      basePoints: this.basePoints,
      points: this.points,
      label: this.label,
      isBossDrop: Boolean(this.isBossDrop),
      vx: this.vx,
      vy: this.vy,
      gravity: this.gravity,
      bounce: this.bounce,
      friction: this.friction,
      groundFriction: this.groundFriction,
      radius: this.radius,
      rotation: this.rotation,
      vRot: this.vRot,
      tick: this.tick,
      dead: Boolean(this.dead),
      life: this.life,
      maxLife: this.maxLife,
      groundY: this.groundY
    };
  }
}


export class SpeedBoostDrop {
  constructor(x, y, options = {}) {
    this.x = x;
    // Keep spawn height in safe mid-air play zone
    this.y = Math.max(130, Math.min(590, y));
    this.baseY = this.y;
    this.vx = options.vx !== undefined ? options.vx : -82;
    this.vy = options.vy !== undefined ? options.vy : 0;
    this.radius = 22;
    this.rotation = 0;
    this.vRot = (Math.random() - 0.5) * 2.5;
    this.tick = Math.random() * 50;
    this.dead = false;
    this.life = options.life !== undefined ? options.life : 20.0;
    this.maxLife = this.life;
  }

  update(dt, player = null) {
    this.tick++;
    if (this.life > 0) this.life -= dt;
    if (this.life <= 0) return false;

    // Generous magnetic attraction when player is nearby
    if (player && !player.dead) {
      const magnetRange = 240;
      const dx = player.x - this.x;
      if (dx > -magnetRange && dx < magnetRange) {
        const dy = player.y - this.y;
        if (dy > -magnetRange && dy < magnetRange) {
          const distSq = dx * dx + dy * dy;
          if (distSq < magnetRange * magnetRange && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const pullFactor = (1 - dist / magnetRange) * 540;
            const invDist = 1 / dist;
            this.vx += dx * invDist * pullFactor * dt;
            this.vy += dy * invDist * pullFactor * dt;
          }
        }
      }
    }

    // Aerodynamic horizontal cruising with gentle sinusoidal floating wave
    this.x += this.vx * dt;
    this.y += this.vy * dt + Math.sin(this.tick * 0.055) * 32 * dt;
    this.rotation += this.vRot * dt;

    // Soft drag on vertical acceleration from magnetic drift
    this.vy *= Math.pow(0.94, dt * 60);

    // Keep smoothly within visible screen bounds
    this.y = Math.max(90, Math.min(620, this.y));

    return this.x > -50;
  }

  draw(ctx) {
    if (ClayRenderer.use3D) return; // rendered by Scene3D
    // Blinking flash warning during last 3.5 seconds of existence
    if (this.life < 3.5 && Math.sin(this.life * 14) < 0) return;
    ClayRenderer.drawSpeedBoostDrop(ctx, this.x, this.y, this.tick, this.rotation);
  }

  drawShadow(ctx) {
    if (!this.dead && this.x > -40 && this.x < 1350) {
      Clay3D.draw3DGroundShadow(ctx, this.x, this.y, 0.65, 20, 10);
    }
  }

  serialize() {
    return {
      collectibleType: 'SPEED_BOOST',
      x: this.x,
      y: this.y,
      baseY: this.baseY,
      vx: this.vx,
      vy: this.vy,
      radius: this.radius,
      rotation: this.rotation,
      vRot: this.vRot,
      tick: this.tick,
      dead: Boolean(this.dead),
      life: this.life,
      maxLife: this.maxLife
    };
  }
}

export function deserializeCollectible(data) {
  if (!data) return null;
  try {
    switch (data.collectibleType) {
      case 'CAPSULE': {
        const item = new PowerUpCapsule(data.x, data.y, data.weaponType);
        item.vx = data.vx !== undefined ? data.vx : item.vx;
        item.vy = data.vy !== undefined ? data.vy : item.vy;
        item.radius = data.radius !== undefined ? data.radius : item.radius;
        item.tick = data.tick !== undefined ? data.tick : item.tick;
        item.hitCooldown = data.hitCooldown !== undefined ? data.hitCooldown : item.hitCooldown;
        item.dead = Boolean(data.dead);
        item.wobble = data.wobble !== undefined ? data.wobble : item.wobble;
        return item;
      }
      case 'FRUIT': {
        const item = new FruitDrop(data.x, data.y, data.type, data.stage || 1, {
          isBossDrop: data.isBossDrop,
          vx: data.vx,
          vy: data.vy,
          gravity: data.gravity,
          bounce: data.bounce,
          friction: data.friction,
          groundFriction: data.groundFriction,
          rotation: data.rotation,
          vRot: data.vRot,
          life: data.life
        });
        item.maxLife = data.maxLife !== undefined ? data.maxLife : item.maxLife;
        item.tick = data.tick !== undefined ? data.tick : item.tick;
        item.dead = Boolean(data.dead);
        item.groundY = data.groundY !== undefined ? data.groundY : item.groundY;
        return item;
      }
      case 'SPEED_BOOST': {
        const item = new SpeedBoostDrop(data.x, data.y, {
          vx: data.vx,
          vy: data.vy,
          life: data.life
        });
        item.baseY = data.baseY !== undefined ? data.baseY : item.baseY;
        item.rotation = data.rotation !== undefined ? data.rotation : item.rotation;
        item.vRot = data.vRot !== undefined ? data.vRot : item.vRot;
        item.tick = data.tick !== undefined ? data.tick : item.tick;
        item.dead = Boolean(data.dead);
        item.maxLife = data.maxLife !== undefined ? data.maxLife : item.maxLife;
        return item;
      }
      default:
        return null;
    }
  } catch (e) {
    console.warn('Failed to deserialize collectible:', e, data);
    return null;
  }
}


