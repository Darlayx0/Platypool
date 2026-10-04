// Scene3D — Real-time WebGL Claymation Engine for Platypus Arcade.
// Renders all true 3D clay entities (Player, Bosses, Enemies, Pickups, Bullets, Clay Debris)
// into an offscreen canvas that Game composites seamlessly into the 2D pipeline.
// Long-lens perspective camera ensures 1:1 pixel coordinates on the Z=0 plane while
// delivering authentic 3D volume, self-shadowing, banking, and physical stop-motion clay depth.

import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.js';
import { BossActor, BOSS_COLORS } from './BossModels.js';
import { EnemyActor, PickupActor, BulletLayer, DebrisSystem } from './Actors.js';
import { FRUIT_CONFIGS } from '../../entities/PowerUp.js';

export class Scene3D {
  /**
   * Returns a Scene3D instance, or null if WebGL is unavailable on this device.
   */
  static create(width, height, dpr = 1) {
    try {
      const probe = document.createElement('canvas');
      if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return null;
      return new Scene3D(width, height, dpr);
    } catch (e) {
      console.warn('[Scene3D] WebGL unavailable, falling back to 2D renderer.', e);
      return null;
    }
  }

  constructor(width, height, dpr) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();

    // Long-lens perspective: the z=0 plane maps exactly onto game pixels (width x height)
    // while giving authentic parallax, volumetric depth, and self-shadowing when objects bank/pitch.
    this.fov = 22;
    this.camera = new THREE.PerspectiveCamera(this.fov, width / height, 10, 8000);

    this.setupLights();
    this.setSize(width, height, dpr);

    // 1. Hero Player Model
    this.player = new PlayerModel();
    this.scene.add(this.player.root);

    // 2. Boss Actor holder
    this.bossActor = null;
    this.lastBossType = null;
    this.lastBossHp = null;

    // 3. Enemy Actors (Entity -> Actor mapping + Pools per enemy type)
    this.enemyActors = new Map(); // Enemy entity -> EnemyActor
    this.enemyPools = new Map();  // type string -> EnemyActor[]
    this.trackedEnemies = new Set();

    // 4. Collectible / Pickup Actors (Collectible entity -> PickupActor)
    this.pickupActors = new Map(); // Collectible entity -> PickupActor
    this.pickupPools = new Map();  // key -> PickupActor[]

    // 5. Instanced Bullets Layer (up to 1200 fast 3D clay bullets in 3 draw calls)
    this.bulletLayer = new BulletLayer(this.scene, 1200);

    // 6. Volumetric Clay Debris System
    this.debris = new DebrisSystem(this.scene, 320);

    // Reusable active entity sets to eliminate per-frame allocations
    this._activeEnemiesSet = new Set();
    this._activePickupsSet = new Set();

    this.lastTime = performance.now();
    this.time = 0;

    // Pre-warm all pickup templates and compile all shaders ahead of time
    this.prewarm();
  }

  setupLights() {
    // Studio 3-Point Claymation Lighting Rig calibrated for stop-motion clay depth
    // 1. Soft Warm Ambient Hemisphere
    const hemi = new THREE.HemisphereLight(0xfff5e6, 0x4a3b32, 0.95);
    this.scene.add(hemi);

    // 2. Warm Key Directional Light with soft PCF shadow map
    const key = new THREE.DirectionalLight(0xfff1dc, 2.7);
    key.position.set(-0.55, 0.75, 0.9).multiplyScalar(1000);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.6;
    key.shadow.radius = 3.5;
    this.key = key;
    this.scene.add(key);
    this.scene.add(key.target);

    // 3. Cool Ambient Fill Light from lower-right
    const fill = new THREE.DirectionalLight(0xb2d4ff, 0.75);
    fill.position.set(0.65, -0.35, 0.8).multiplyScalar(1000);
    this.scene.add(fill);

    // 4. Sharp Rim Glint from rear-top
    const rim = new THREE.DirectionalLight(0xffffff, 1.45);
    rim.position.set(0.25, 0.55, -1.0).multiplyScalar(1000);
    this.scene.add(rim);
  }

  setSize(width, height, dpr = 1) {
    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    const dist = (height / 2) / Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
    this.camera.aspect = width / height;
    this.camera.position.set(width / 2, -height / 2, dist);
    this.camera.lookAt(width / 2, -height / 2, 0);
    this.camera.near = Math.max(10, dist - 2500);
    this.camera.far = dist + 2500;
    this.camera.updateProjectionMatrix();

    // Shadow frustum covering the 1280x720 playfield + extra margins
    const sc = this.key.shadow.camera;
    const half = Math.max(width, height) * 0.65;
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half;
    sc.near = 1; sc.far = 3200;
    sc.updateProjectionMatrix();
    this.key.target.position.set(width / 2, -height / 2, 0);
    this.key.position.set(width / 2 - 550, -height / 2 + 750, 950);
  }

  /**
   * Pre-warm all pickup actor templates and compile all WebGL shaders upfront
   * so there are zero frame-drops or GPU pipeline stalls when grabbing items.
   */
  prewarm() {
    try {
      const weaponTypes = ['SPREAD', 'LASER', 'HOMING', 'FLAK', 'PLASMA'];
      for (const w of weaponTypes) {
        const key = `CAPSULE:${w}`;
        const actor = new PickupActor('CAPSULE', w, null);
        actor.root.visible = false;
        this.scene.add(actor.root);
        let pool = this.pickupPools.get(key);
        if (!pool) { pool = []; this.pickupPools.set(key, pool); }
        pool.push(actor);
      }

      const fruitTypes = Object.keys(FRUIT_CONFIGS || {});
      for (const f of fruitTypes) {
        const key = `FRUIT:${f}`;
        const cfg = FRUIT_CONFIGS[f];
        const col = (cfg && cfg.color) || '#e53935';
        const actor = new PickupActor('FRUIT', f, col);
        actor.root.visible = false;
        this.scene.add(actor.root);
        let pool = this.pickupPools.get(key);
        if (!pool) { pool = []; this.pickupPools.set(key, pool); }
        pool.push(actor);
      }

      const speedKey = 'SPEED_BOOST:SPEED_BOOST';
      const speedActor = new PickupActor('SPEED_BOOST', 'SPEED_BOOST', null);
      speedActor.root.visible = false;
      this.scene.add(speedActor.root);
      let speedPool = this.pickupPools.get(speedKey);
      if (!speedPool) { speedPool = []; this.pickupPools.set(speedKey, speedPool); }
      speedPool.push(speedActor);

      // Pre-compile all WebGL shaders upfront to prevent first-hit compile freezes
      if (this.renderer && typeof this.renderer.compile === 'function') {
        this.renderer.compile(this.scene, this.camera);
      }
    } catch (e) {
      console.warn('[Scene3D] Prewarm skipped or partial:', e);
    }
  }

  /**
   * Spawns physical 3D clay debris chunks that tumble and scatter with realistic depth.
   */
  addDebris(x, y, size = 16, colors = ['#e53935', '#ffffff'], count = 10) {
    this.debris.burst(x, y, size, colors, count);
  }

  /* ----------------- ENEMY ACTOR POOLING ----------------- */
  getEnemyActor(e) {
    let actor = this.enemyActors.get(e);
    if (actor) return actor;

    const pool = this.enemyPools.get(e.type);
    if (pool && pool.length > 0) {
      actor = pool.pop();
    } else {
      actor = new EnemyActor(e.type);
      this.scene.add(actor.root);
    }

    actor.reset(e);
    actor.root.visible = true;
    this.enemyActors.set(e, actor);
    return actor;
  }

  releaseEnemyActor(e, actor) {
    this.enemyActors.delete(e);
    actor.root.visible = false;
    let pool = this.enemyPools.get(actor.type);
    if (!pool) {
      pool = [];
      this.enemyPools.set(actor.type, pool);
    }
    if (pool.length < 24) {
      pool.push(actor);
    } else {
      this.scene.remove(actor.root);
    }
  }

  /* ----------------- PICKUP ACTOR POOLING ----------------- */
  getPickupKey(c) {
    if (c.weaponType) return `CAPSULE:${c.weaponType}`;
    if (c.type) return `FRUIT:${c.type}`;
    return 'SPEED_BOOST:SPEED_BOOST';
  }

  getPickupActor(c) {
    let actor = this.pickupActors.get(c);
    if (actor) return actor;

    const key = this.getPickupKey(c);
    let pool = this.pickupPools.get(key);
    if (pool && pool.length > 0) {
      actor = pool.pop();
    } else {
      if (c.weaponType) {
        actor = new PickupActor('CAPSULE', c.weaponType, null);
      } else if (c.type) {
        const cfg = FRUIT_CONFIGS && FRUIT_CONFIGS[c.type];
        const col = (cfg && cfg.color) || c.color || '#e53935';
        actor = new PickupActor('FRUIT', c.type, col);
      } else {
        actor = new PickupActor('SPEED_BOOST', 'SPEED_BOOST', null);
      }
      this.scene.add(actor.root);
    }

    actor.reset();
    actor.root.visible = true;
    this.pickupActors.set(c, actor);
    return actor;
  }

  releasePickupActor(c, actor) {
    this.pickupActors.delete(c);
    actor.root.visible = false;
    const key = this.getPickupKey(c);
    let pool = this.pickupPools.get(key);
    if (!pool) {
      pool = [];
      this.pickupPools.set(key, pool);
    }
    if (pool.length < 16) {
      pool.push(actor);
    } else {
      this.scene.remove(actor.root);
    }
  }

  /* ----------------- MAIN RENDER LOOP ----------------- */
  /**
   * Updates all 3D actors from the 2D gameplay state and renders the full 3D scene.
   * @returns {boolean} true if 3D scene was rendered
   */
  render(game) {
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.time += dt;

    // 1. Update Player 3D Biplane
    const p = game.player;
    const showPlayer = p && p.lives > 0;
    this.player.root.visible = showPlayer;
    if (showPlayer) {
      this.player.update(p, dt);
    }

    // 2. Update Boss 3D Colossus / Titan / Zeppelin
    const b = game.boss;
    if (b && !b.dead) {
      if (!this.bossActor || this.bossActor.type !== b.bossType) {
        if (this.bossActor) {
          this.scene.remove(this.bossActor.root);
        }
        this.bossActor = new BossActor(b.bossType);
        this.scene.add(this.bossActor.root);
        this.lastBossHp = b.currentHp;
      }
      // Check boss hit for debris burst
      if (this.lastBossHp !== null && b.currentHp < this.lastBossHp) {
        const cols = BOSS_COLORS[b.bossType] || ['#ff5722', '#ff9800'];
        this.debris.burst(b.x + (Math.random() - 0.5) * 40, b.y + (Math.random() - 0.5) * 40, 22, cols, 4);
      }
      this.lastBossHp = b.currentHp;
      this.bossActor.update(b, dt);
    } else {
      if (this.bossActor) {
        // Boss just died: trigger grand finale clay chunk explosion
        if (b && b.dead && this.lastBossHp !== null) {
          const cols = BOSS_COLORS[this.bossActor.type] || ['#ff5722', '#ff9800', '#00e5ff'];
          this.debris.burst(b.x, b.y, 80, cols, 24);
          this.lastBossHp = null;
        }
        this.scene.remove(this.bossActor.root);
        this.bossActor = null;
      }
    }

    // 3. Update 3D Enemies (Active list vs Tracked list)
    const activeEnemies = this._activeEnemiesSet;
    activeEnemies.clear();
    const enemies = game.enemies || [];
    for (let i = 0; i < enemies.length; i++) {
      activeEnemies.add(enemies[i]);
    }

    // Detect defeated/despawned enemies
    for (const [e, actor] of this.enemyActors.entries()) {
      if (!activeEnemies.has(e) || e.dead) {
        // Spawn clay debris if the enemy was destroyed with 0 or negative hp
        if (e.dead || (e.hp !== undefined && e.hp <= 0)) {
          const cols = [e.color || '#ff5722', e.shadowColor || '#bf360c', '#ffffff'];
          this.debris.burst(e.x, e.y, e.radius || 20, cols, Math.min(18, Math.max(8, Math.round(e.radius * 0.5))));
        }
        this.releaseEnemyActor(e, actor);
      }
    }

    // Update active enemies
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      // Skip enemies far outside viewport to save rendering cost
      if (e.x < -140 || e.x > this.width + 140 || e.y < -140 || e.y > this.height + 140) {
        const actor = this.enemyActors.get(e);
        if (actor) this.releaseEnemyActor(e, actor);
        continue;
      }
      const actor = this.getEnemyActor(e);
      actor.update(e, dt);
    }

    // 4. Update 3D Collectibles & Pickups
    const activePickups = this._activePickupsSet;
    activePickups.clear();
    const collectibles = game.collectibles || [];
    for (let i = 0; i < collectibles.length; i++) {
      activePickups.add(collectibles[i]);
    }

    for (const [c, actor] of this.pickupActors.entries()) {
      if (!activePickups.has(c) || c.dead) {
        this.releasePickupActor(c, actor);
      }
    }
    for (let i = 0; i < collectibles.length; i++) {
      const c = collectibles[i];
      if (c.dead) continue;
      if (c.x < -60 || c.x > this.width + 60 || c.y < -60 || c.y > this.height + 60) {
        const actor = this.pickupActors.get(c);
        if (actor) this.releasePickupActor(c, actor);
        continue;
      }
      const actor = this.getPickupActor(c);
      actor.update(c, dt);
    }

    // 5. Update 3D Instanced Bullets
    this.bulletLayer.sync(game.bullets || [], this.time);

    // 6. Update 3D Clay Debris
    this.debris.update(dt);

    // Render WebGL frame
    this.renderer.render(this.scene, this.camera);
    return true;
  }
}
