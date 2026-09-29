// Boss System for Platypus: Clay Wings (3 Unique Bosses for Stages 5, 10, 15)
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Bullet } from './Bullet.js';
import { Enemy } from './Enemy.js';

export class Boss {
  constructor(canvasWidth, canvasHeight, bossType = 'DREADNOUGHT', options = {}) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.bossType = bossType; // DREADNOUGHT, GOLIATH_ZEPPELIN, LEVIATHAN_TITAN
    this.options = options;
    this.rageThreshold = options.rageThreshold !== undefined ? options.rageThreshold : 0.30;
    this.hpMult = options.hpMult !== undefined ? options.hpMult : 1.0;

    this.x = 1500; // starts offscreen
    this.y = canvasHeight / 2;
    this.targetX = 1040;
    this.targetY = canvasHeight / 2;
    this.radius = 95;

    this.tick = 0;
    this.dead = false;
    this.entering = true;
    this.rageMode = false;

    // Death sequence state
    this.isDying = false;
    this.deathTimer = 4.0;
    this.deathExplosionTimer = 0;

    this.initBossComponents();
  }

  initBossComponents() {
    const hpM = this.hpMult || 1.0;
    switch (this.bossType) {
      case 'OMEGA_CORE_SPAWN':
        this.title = 'THE OMEGA APEX CORE';
        this.radius = 75;
        this.coreHp = Math.round(1200 * hpM);
        this.maxTotalHp = this.coreHp;

        // Dash mechanics: forward rush and backward retreat
        this.dashState = 'IDLE'; // 'IDLE', 'TELEGRAPH', 'RUSH', 'HOLD', 'RETREAT'
        this.dashCooldown = 6.5;
        this.dashTimer = 0;
        this.homeX = 1040;
        this.targetDashX = 260;
        this.targetDashY = this.canvasHeight / 2;

        // Invulnerable barrier skill
        this.isInvulnerable = false;
        this.invulnerableCooldown = 11.0;
        this.invulnerableTimer = 0;
        this.shieldDuration = 2.4;

        // Bullet & Attack timers
        this.spiralShootTimer = 0.55;
        this.missileSalvoTimer = 3.2;
        this.droneSpawnTimer = 5.5;
        break;

      case 'OMEGA_COLOSSUS':
        this.title = 'THE OMEGA CLAY COLOSSUS';
        this.radius = 135;
        this.railTopHp = Math.round(400 * hpM);
        this.railTopAlive = true;
        this.railBottomHp = Math.round(400 * hpM);
        this.railBottomAlive = true;
        this.droneCoreHp = Math.round(500 * hpM);
        this.droneCoreAlive = true;
        this.coreHp = Math.round(1100 * hpM);
        this.maxTotalHp = Math.round(2400 * hpM); // Colossal World 4 climax Phase 1

        this.railgunTimer = 2.2;
        this.droneDeployTimer = 3.8;
        this.singularityWaveTimer = 1.5;
        this.rageBarrageTimer = 0.18;
        break;

      case 'GOLIATH_ZEPPELIN':
        this.title = 'THE CLAY GOLIATH ZEPPELIN';
        this.radius = 110;
        this.mortarHp = Math.round(260 * hpM);
        this.mortarAlive = true;
        this.hangarHp = Math.round(240 * hpM);
        this.hangarAlive = true;
        this.coreHp = Math.round(700 * hpM);
        this.maxTotalHp = Math.round(1200 * hpM); // World 2 airship fortress

        this.mortarTimer = 2.4;
        this.broadsideTimer = 1.6;
        this.droneLaunchTimer = 4.0;
        this.mortarAngle = Math.PI * 0.85;
        break;

      case 'LEVIATHAN_TITAN':
        this.title = 'THE ULTIMATE CLAY LEVIATHAN';
        this.radius = 120;
        this.wingTopHp = Math.round(300 * hpM);
        this.wingTopAlive = true;
        this.wingBottomHp = Math.round(300 * hpM);
        this.wingBottomAlive = true;
        this.missilePodHp = Math.round(350 * hpM);
        this.missilePodAlive = true;
        this.coreHp = Math.round(850 * hpM);
        this.maxTotalHp = Math.round(1800 * hpM); // World 3 heavyweight bio-mech (1800 HP)

        this.isChargingLaser = false;
        this.laserChargeTime = 0;
        this.laserChargeRatio = 0;
        this.laserAttackCooldown = 4.8;
        this.missileSalvoTimer = 3.5;
        this.spiralShootTimer = 0.8;
        break;

      case 'DREADNOUGHT':
      default:
        this.title = 'THE IRON CLAY DREADNOUGHT';
        this.radius = 95;
        this.turretTopHp = Math.round(110 * hpM);
        this.turretBottomHp = Math.round(110 * hpM);
        this.turretTopAlive = true;
        this.turretBottomAlive = true;
        this.coreHp = Math.round(380 * hpM);
        this.maxTotalHp = Math.round(600 * hpM); // World 1 armored dreadnought

        this.topTurretAngle = Math.PI;
        this.bottomTurretAngle = Math.PI;
        this.turretShootTimer = 1.4;
        this.missileTimer = 3.0;
        this.rageShootTimer = 0.5;
        break;
    }
  }

  get totalHp() {
    if (this.bossType === 'OMEGA_CORE_SPAWN') {
      return Math.max(0, this.coreHp);
    } else if (this.bossType === 'OMEGA_COLOSSUS') {
      return Math.max(0, (this.railTopAlive ? this.railTopHp : 0) +
                         (this.railBottomAlive ? this.railBottomHp : 0) +
                         (this.droneCoreAlive ? this.droneCoreHp : 0) +
                         this.coreHp);
    } else if (this.bossType === 'GOLIATH_ZEPPELIN') {
      return Math.max(0, (this.mortarAlive ? this.mortarHp : 0) +
                         (this.hangarAlive ? this.hangarHp : 0) +
                         this.coreHp);
    } else if (this.bossType === 'LEVIATHAN_TITAN') {
      return Math.max(0, (this.wingTopAlive ? this.wingTopHp : 0) +
                         (this.wingBottomAlive ? this.wingBottomHp : 0) +
                         (this.missilePodAlive ? this.missilePodHp : 0) +
                         this.coreHp);
    } else {
      return Math.max(0, (this.turretTopAlive ? this.turretTopHp : 0) +
                         (this.turretBottomAlive ? this.turretBottomHp : 0) +
                         this.coreHp);
    }
  }

  get hpRatio() {
    return Math.max(0, this.totalHp / this.maxTotalHp);
  }

  update(dt, player, bullets, sound, camera, particles, extraEnemies = []) {
    this.tick++;

    // Death sequence
    if (this.isDying) {
      this.deathTimer -= dt;
      this.deathExplosionTimer -= dt;

      if (this.deathExplosionTimer <= 0) {
        this.deathExplosionTimer = 0.10 + Math.random() * 0.08;
        const exX = this.x + (Math.random() - 0.5) * (this.radius * 2);
        const exY = this.y + (Math.random() - 0.5) * (this.radius * 1.5);
        particles.createClaySplat(exX, exY, 18, '#ff5722', '#bf360c');
        sound.playExplosion('small');
        camera.addTrauma(0.35);
      }

      this.y += 24 * dt;

      if (this.deathTimer <= 0) {
        particles.createClaySplat(this.x, this.y, 50, '#ffd54f', '#ff6f00');
        sound.playExplosion('large');
        camera.addTrauma(1.0);
        this.dead = true;
        return false;
      }
      return true;
    }

    // Entrance sequence
    if (this.entering) {
      this.x += (this.targetX - this.x) * 2.0 * dt;
      if (Math.abs(this.x - this.targetX) < 5) {
        this.x = this.targetX;
        this.entering = false;
      }
      return true;
    }

    // Universal HP Enrage Upgrade
    if (!this.rageMode && this.hpRatio <= this.rageThreshold) {
      this.rageMode = true;
      if (sound) sound.playBossAlarm();
      if (camera) camera.addTrauma(0.5);
      if (particles) particles.createClaySplat(this.x, this.y, 30, '#ff1744', '#b71c1c');
    }

    // Boss Type Updates
    switch (this.bossType) {
      case 'OMEGA_CORE_SPAWN':
        this.updateOmegaCoreSpawn(dt, player, bullets, sound, camera, particles, extraEnemies);
        break;
      case 'OMEGA_COLOSSUS':
        this.updateOmegaColossus(dt, player, bullets, sound, camera, particles, extraEnemies);
        break;
      case 'GOLIATH_ZEPPELIN':
        this.updateGoliath(dt, player, bullets, sound, camera, particles, extraEnemies);
        break;
      case 'LEVIATHAN_TITAN':
        this.updateLeviathan(dt, player, bullets, sound, camera, particles);
        break;
      case 'DREADNOUGHT':
      default:
        this.updateDreadnought(dt, player, bullets, sound);
        break;
    }

    return true;
  }

  updateDreadnought(dt, player, bullets, sound) {
    const hoverSpeed = this.rageMode ? 0.065 : 0.035;
    const hoverRange = this.rageMode ? 150 : 100;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;

    const topX = this.x - 30;
    const topY = this.y - 50;
    this.topTurretAngle = Math.atan2(player.y - topY, player.x - topX);

    const botX = this.x - 30;
    const botY = this.y + 50;
    this.bottomTurretAngle = Math.atan2(player.y - botY, player.x - botX);

    // Turret shots (drastically faster in rage mode)
    this.turretShootTimer -= dt;
    if (this.turretShootTimer <= 0) {
      this.turretShootTimer = this.rageMode ? 0.6 : 1.4;

      if (this.turretTopAlive) {
        bullets.push(new Bullet({
          x: topX + Math.cos(this.topTurretAngle) * 35,
          y: topY + Math.sin(this.topTurretAngle) * 35,
          vx: Math.cos(this.topTurretAngle) * (this.rageMode ? 520 : 420),
          vy: Math.sin(this.topTurretAngle) * (this.rageMode ? 520 : 420),
          radius: 8,
          isEnemy: true
        }));
      }

      if (this.turretBottomAlive) {
        bullets.push(new Bullet({
          x: botX + Math.cos(this.bottomTurretAngle) * 35,
          y: botY + Math.sin(this.bottomTurretAngle) * 35,
          vx: Math.cos(this.bottomTurretAngle) * (this.rageMode ? 520 : 420),
          vy: Math.sin(this.bottomTurretAngle) * (this.rageMode ? 520 : 420),
          radius: 8,
          isEnemy: true
        }));
      }

      sound.playEnemyShoot();
    }

    // Shotgun fan (7-way in rage mode, 5-way normal)
    this.missileTimer -= dt;
    if (this.missileTimer <= 0) {
      this.missileTimer = this.rageMode ? 1.8 : 3.4;
      const fanAngles = this.rageMode
        ? [-0.45, -0.30, -0.15, 0, 0.15, 0.30, 0.45]
        : [-0.35, -0.18, 0, 0.18, 0.35];
      for (const ang of fanAngles) {
        bullets.push(new Bullet({
          x: this.x - 80,
          y: this.y,
          vx: Math.cos(Math.PI + ang) * (this.rageMode ? 440 : 380),
          vy: Math.sin(Math.PI + ang) * (this.rageMode ? 440 : 380),
          radius: 7,
          isEnemy: true
        }));
      }
      sound.playEnemyShoot();
    }

    // Rage mode corkscrew spiral
    if (this.rageMode) {
      this.rageShootTimer -= dt;
      if (this.rageShootTimer <= 0) {
        this.rageShootTimer = 0.28;
        const spiralAngle = this.tick * 0.18;
        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y,
          vx: Math.cos(Math.PI + Math.sin(spiralAngle) * 0.7) * 440,
          vy: Math.sin(Math.PI + Math.sin(spiralAngle) * 0.7) * 440,
          radius: 8,
          isEnemy: true
        }));
        sound.playEnemyShoot();
      }
    }
  }

  updateGoliath(dt, player, bullets, sound, camera, particles, extraEnemies) {
    const hoverSpeed = this.rageMode ? 0.05 : 0.025;
    const hoverRange = this.rageMode ? 130 : 80;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;

    // Mortar Aim
    const mortarX = this.x - 40;
    const mortarY = this.y - 78;
    this.mortarAngle = Math.atan2(player.y - mortarY, player.x - mortarX);

    // 1. Heavy Arcing Mortar Attack (3 cluster shells when enraged!)
    if (this.mortarAlive) {
      this.mortarTimer -= dt;
      if (this.mortarTimer <= 0) {
        this.mortarTimer = this.rageMode ? 1.4 : 2.5;
        const mortarOffsets = this.rageMode ? [-70, 0, 70] : [-40, 40];
        for (let m = 0; m < mortarOffsets.length; m++) {
          const vxOff = mortarOffsets[m];
          bullets.push(new Bullet({
            x: mortarX,
            y: mortarY,
            vx: -400 + vxOff,
            vy: -240,
            gravity: 300,
            radius: 12,
            type: 'ENEMY_MORTAR',
            life: 3.5,
            isEnemy: true
          }));
        }
        sound.playShoot('FLAK');
        camera.addTrauma(0.2);
      }
    }

    // 2. Drone Bay Deployment (spawns 2 drones when enraged)
    if (this.hangarAlive) {
      this.droneLaunchTimer -= dt;
      if (this.droneLaunchTimer <= 0) {
        this.droneLaunchTimer = this.rageMode ? 3.0 : 5.0;
        const count = this.rageMode ? 2 : 1;
        for (let d = 0; d < count; d++) {
          const spawnType = Math.random() > 0.4 ? 'STINGER' : 'DRONE';
          extraEnemies.push(new Enemy({
            type: spawnType,
            x: this.x + 20,
            y: this.y + 65 + (d === 0 ? 0 : (Math.random() > 0.5 ? 40 : -40)),
            stage: 10
          }));
        }
        sound.playShoot('SPREAD');
        particles.createClaySplat(this.x + 20, this.y + 65, 8, '#00e5ff', '#0097a7');
      }
    }

    // 3. Broadside Volley (5 bullets when enraged)
    this.broadsideTimer -= dt;
    if (this.broadsideTimer <= 0) {
      this.broadsideTimer = this.rageMode ? 1.0 : 2.0;
      const broadsideOffsets = this.rageMode ? [-50, -25, 0, 25, 50] : [-40, 0, 40];
      for (const offset of broadsideOffsets) {
        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y + 35 + offset * 0.4,
          vx: this.rageMode ? -460 : -400,
          vy: offset * 1.5,
          radius: 8,
          isEnemy: true
        }));
      }
      sound.playEnemyShoot();
    }
  }

  updateLeviathan(dt, player, bullets, sound, camera, particles) {
    const hoverSpeed = this.rageMode ? 0.06 : 0.03;
    const hoverRange = this.rageMode ? 160 : 110;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;

    // 1. Sonic Laser Sweep Beam (fast 0.7s charge in rage mode!)
    this.laserAttackCooldown -= dt;
    if (this.laserAttackCooldown <= 0 && !this.isChargingLaser) {
      this.isChargingLaser = true;
      this.laserChargeTime = 0;
    }

    if (this.isChargingLaser) {
      this.laserChargeTime += dt;
      const targetChargeTime = this.rageMode ? 0.7 : 1.4;
      this.laserChargeRatio = Math.min(1.0, this.laserChargeTime / targetChargeTime);

      if (this.laserChargeTime >= targetChargeTime) {
        this.isChargingLaser = false;
        this.laserAttackCooldown = this.rageMode ? 2.8 : 5.5;

        sound.playShoot('LASER');
        camera.addTrauma(0.5);

        // Dense laser burst wave (11 lasers when enraged!)
        const laserCount = this.rageMode ? 11 : 7;
        const half = Math.floor(laserCount / 2);
        for (let i = 0; i < laserCount; i++) {
          const lAngle = (i - half) * (this.rageMode ? 0.10 : 0.12);
          bullets.push(new Bullet({
            x: this.x - 110,
            y: this.y,
            vx: Math.cos(Math.PI + lAngle) * (this.rageMode ? 660 : 580),
            vy: Math.sin(Math.PI + lAngle) * (this.rageMode ? 660 : 580),
            radius: 9,
            type: 'ENEMY_SNIPER',
            life: 2.5,
            isEnemy: true
          }));
        }
      }
    }

    // 2. Missile Battery Pods (4 homing missiles when enraged)
    if (this.missilePodAlive) {
      this.missileSalvoTimer -= dt;
      if (this.missileSalvoTimer <= 0) {
        this.missileSalvoTimer = this.rageMode ? 1.9 : 3.8;
        const offsets = this.rageMode ? [-50, -25, 25, 50] : [-42, 42];
        for (let m = 0; m < offsets.length; m++) {
          const yOff = offsets[m];
          bullets.push(new Bullet({
            x: this.x - 20,
            y: this.y + yOff,
            vx: -240,
            vy: yOff * 3.5,
            radius: 8,
            type: 'ENEMY_HOMING',
            life: 4.5,
            isEnemy: true
          }));
        }
        sound.playShoot('HOMING');
      }
    }

    // 3. Rotating Core Bullet Spiral (4-way cross spiral when enraged!)
    this.spiralShootTimer -= dt;
    if (this.spiralShootTimer <= 0) {
      this.spiralShootTimer = this.rageMode ? 0.28 : 0.65;
      const baseAng = this.tick * 0.14;
      const step = this.rageMode ? (Math.PI / 2) : Math.PI;
      for (let a = 0; a < Math.PI * 2; a += step) {
        bullets.push(new Bullet({
          x: this.x - 85,
          y: this.y,
          vx: Math.cos(baseAng + a) * (this.rageMode ? 420 : 360),
          vy: Math.sin(baseAng + a) * (this.rageMode ? 420 : 360),
          radius: 7,
          isEnemy: true
        }));
      }
      sound.playEnemyShoot();
    }
  }

  updateOmegaColossus(dt, player, bullets, sound, camera, particles, extraEnemies) {
    const hoverSpeed = this.rageMode ? 0.065 : 0.035;
    const hoverRange = this.rageMode ? 175 : 120;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;
    this.x = this.targetX + Math.cos(this.tick * hoverSpeed * 0.7) * (this.rageMode ? 45 : 18);

    // 1. Dual High-Velocity Railgun Beams
    this.railgunTimer -= dt;
    if (this.railgunTimer <= 0) {
      this.railgunTimer = this.rageMode ? 1.5 : 2.6;
      if (this.railTopAlive) {
        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y - 85,
          vx: this.rageMode ? -800 : -700,
          vy: 0,
          radius: 10,
          type: 'ENEMY_SNIPER',
          life: 2.5,
          isEnemy: true
        }));
      }
      if (this.railBottomAlive) {
        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y + 85,
          vx: this.rageMode ? -800 : -700,
          vy: 0,
          radius: 10,
          type: 'ENEMY_SNIPER',
          life: 2.5,
          isEnemy: true
        }));
      }
      sound.playShoot('LASER');
      camera.addTrauma(0.25);
    }

    // 2. Drone Matrix Support Deployment
    if (this.droneCoreAlive) {
      this.droneDeployTimer -= dt;
      if (this.droneDeployTimer <= 0) {
        this.droneDeployTimer = this.rageMode ? 3.5 : 4.5;
        const count = this.rageMode ? 2 : 1;
        for (let d = 0; d < count; d++) {
          const type = Math.random() > 0.4 ? 'ACE' : 'SPINNER';
          extraEnemies.push(new Enemy({
            type,
            x: this.x - 40,
            y: this.y + (d === 0 ? -55 : 55),
            stage: 20
          }));
        }
        sound.playShoot('HOMING');
        particles.createClaySplat(this.x - 40, this.y, 14, '#c084fc', '#581c87');
      }
    }

    // 3. Singularity Bullet Hell Ring Waves (12 bullets when enraged instead of 16)
    this.singularityWaveTimer -= dt;
    if (this.singularityWaveTimer <= 0) {
      this.singularityWaveTimer = this.rageMode ? 1.2 : 1.6;
      const ringCount = this.rageMode ? 12 : 8;
      const baseAngle = this.tick * 0.1;
      for (let i = 0; i < ringCount; i++) {
        const angle = baseAngle + (i * Math.PI * 2) / ringCount;
        bullets.push(new Bullet({
          x: this.x - 90,
          y: this.y,
          vx: Math.cos(angle) * (this.rageMode ? 310 : 260),
          vy: Math.sin(angle) * (this.rageMode ? 310 : 260),
          radius: 7,
          isEnemy: true
        }));
      }
      sound.playEnemyShoot();
    }

    // 4. Overcharge Rage Barrage (Dodgeable tempo)
    if (this.rageMode) {
      this.rageBarrageTimer -= dt;
      if (this.rageBarrageTimer <= 0) {
        this.rageBarrageTimer = 0.22;
        const fanAngle = Math.sin(this.tick * 0.25) * 0.50;
        bullets.push(new Bullet({
          x: this.x - 110,
          y: this.y,
          vx: Math.cos(Math.PI + fanAngle) * 410,
          vy: Math.sin(Math.PI + fanAngle) * 410,
          radius: 8,
          isEnemy: true
        }));
        sound.playEnemyShoot();
      }
    }
  }

  updateOmegaCoreSpawn(dt, player, bullets, sound, camera, particles, extraEnemies) {
    // 1. Invulnerability Barrier Skill Logic
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        if (particles) particles.createElectricSpark(this.x, this.y, 10, '#00e5ff', '#ffffff');
      }
    } else {
      this.invulnerableCooldown -= dt;
      if (this.invulnerableCooldown <= 0) {
        this.isInvulnerable = true;
        this.invulnerableTimer = this.shieldDuration;
        this.invulnerableCooldown = this.rageMode ? 8.5 : 11.0;
        if (sound) sound.playBossAlarm();
        if (camera) camera.addTrauma(0.3);
        if (particles) {
          particles.createElectricSpark(this.x, this.y, 20, '#00e5ff', '#ffffff');
          particles.createFloatingText(this.x, this.y - 60, '🛡️ PERISAI KEBAL DIAKTIFKAN!', '#00e5ff');
        }
      }
    }

    // 2. Hyper-Rush Dash Mechanic (Maju seketika ke depan lalu ke belakang kembali)
    switch (this.dashState) {
      case 'TELEGRAPH':
        this.dashTimer -= dt;
        // Vibration and lightning sparks
        this.x += (Math.random() - 0.5) * 8;
        this.y += (Math.random() - 0.5) * 6;
        if (particles && this.tick % 3 === 0) {
          particles.createElectricSpark(this.x - 20, this.y + (Math.random() - 0.5) * 40, 2, '#ff1744', '#ffd54f');
        }
        if (this.dashTimer <= 0) {
          this.dashState = 'RUSH';
          this.targetDashY = Math.max(120, Math.min(600, player ? player.y : this.y));
          if (sound) sound.playShoot('LASER');
          if (camera) camera.addTrauma(0.35);
        }
        break;

      case 'RUSH': {
        const rushSpeed = this.rageMode ? 1150 : 920;
        this.x -= rushSpeed * dt;
        this.y += (this.targetDashY - this.y) * 4.5 * dt;

        // Shockwave particles & needle bullets during charge
        if (particles && this.tick % 2 === 0) {
          particles.createClaySplat(this.x + 30, this.y, 8, '#d500f9', '#4a148c');
        }

        // Fire needle spread during rush (fair interval)
        if (this.tick % 7 === 0) {
          const angles = [-0.25, 0, 0.25];
          for (let m = 0; m < 3; m++) {
            const ang = angles[m];
            bullets.push(new Bullet({
              x: this.x - 40,
              y: this.y,
              vx: Math.cos(Math.PI + ang) * (this.rageMode ? 560 : 480),
              vy: Math.sin(Math.PI + ang) * (this.rageMode ? 560 : 480),
              radius: 8,
              type: 'ENEMY_SNIPER',
              life: 2.2,
              isEnemy: true
            }));
          }
          if (sound) sound.playEnemyShoot();
        }

        if (this.x <= this.targetDashX) {
          this.x = this.targetDashX;
          this.dashState = 'HOLD';
          this.dashTimer = this.rageMode ? 0.30 : 0.45;
          if (camera) camera.addTrauma(0.4);

          // Radial Nova Shockwave upon reaching front!
          const blastCount = this.rageMode ? 10 : 8;
          for (let i = 0; i < blastCount; i++) {
            const a = (i * Math.PI * 2) / blastCount;
            bullets.push(new Bullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(a) * 300,
              vy: Math.sin(a) * 300,
              radius: 7,
              isEnemy: true
            }));
          }
          if (sound) sound.playExplosion('small');
        }
        break;
      }

      case 'HOLD':
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.dashState = 'RETREAT';
        }
        break;

      case 'RETREAT': {
        const retreatSpeed = this.rageMode ? 850 : 680;
        this.x += retreatSpeed * dt;
        this.y += ((this.canvasHeight / 2) - this.y) * 2.5 * dt;

        if (particles && this.tick % 3 === 0) {
          particles.createSmokePuff(this.x - 20, this.y, 1, 10);
        }

        if (this.x >= this.homeX) {
          this.x = this.homeX;
          this.dashState = 'IDLE';
          this.dashCooldown = this.rageMode ? 5.5 : 7.5;
        }
        break;
      }

      case 'IDLE':
      default: {
        const hoverSpeed = this.rageMode ? 0.07 : 0.045;
        const hoverRange = this.rageMode ? 160 : 120;
        this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;
        this.x = this.homeX + Math.sin(this.tick * hoverSpeed * 0.7) * 25;

        this.dashCooldown -= dt;
        if (this.dashCooldown <= 0) {
          this.dashState = 'TELEGRAPH';
          this.dashTimer = 0.95;
          if (sound) sound.playBossAlarm();
        }
        break;
      }
    }

    // 3. Counter-Rotating Dual-Spiral Bullet Hell (Balanced tempo)
    this.spiralShootTimer -= dt;
    if (this.spiralShootTimer <= 0) {
      this.spiralShootTimer = this.rageMode ? 0.35 : 0.55;
      const baseAng = this.tick * 0.15;
      const arms = 3;
      for (let i = 0; i < arms; i++) {
        const a1 = baseAng + (i * Math.PI * 2) / arms;
        bullets.push(new Bullet({
          x: this.x - 45,
          y: this.y,
          vx: Math.cos(a1) * (this.rageMode ? 330 : 270),
          vy: Math.sin(a1) * (this.rageMode ? 330 : 270),
          radius: 7,
          isEnemy: true
        }));

        const a2 = -baseAng + (i * Math.PI * 2) / arms;
        bullets.push(new Bullet({
          x: this.x - 45,
          y: this.y,
          vx: Math.cos(a2) * (this.rageMode ? 330 : 270),
          vy: Math.sin(a2) * (this.rageMode ? 330 : 270),
          radius: 6,
          isEnemy: true
        }));
      }
      sound.playEnemyShoot();
    }

    // 4. Mutant Homing Spore Salvo
    this.missileSalvoTimer -= dt;
    if (this.missileSalvoTimer <= 0) {
      this.missileSalvoTimer = this.rageMode ? 2.8 : 4.0;
      const count = this.rageMode ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const yOff = (i - (count - 1) / 2) * 36;
        bullets.push(new Bullet({
          x: this.x - 30,
          y: this.y + yOff,
          vx: -210,
          vy: yOff * 3.5,
          radius: 8,
          type: 'ENEMY_HOMING',
          life: 4.0,
          isEnemy: true
        }));
      }
      sound.playShoot('HOMING');
    }

    // 5. Spawn Drone Matrix Support (Mini Mutant Drones)
    this.droneSpawnTimer -= dt;
    if (this.droneSpawnTimer <= 0) {
      this.droneSpawnTimer = this.rageMode ? 3.5 : 6.0;
      const spawnCount = this.rageMode ? 2 : 1;
      for (let d = 0; d < spawnCount; d++) {
        extraEnemies.push(new Enemy({
          type: Math.random() > 0.5 ? 'SPINNER' : 'INTERCEPTOR',
          x: this.x - 30,
          y: this.y + (d === 0 ? -60 : 60),
          stage: 20
        }));
      }
      if (particles) particles.createClaySplat(this.x - 30, this.y, 16, '#00e5ff', '#7b1fa2');
    }
  }

  takeDamage(amount, hitY, particles, sound, bulletType = 'NORMAL') {
    if (this.isDying) return false;

    // Heavy Boss Armor Faraday resistance: Plasma energy deals 25% reduced damage to Bosses
    if (bulletType === 'PLASMA' || bulletType === 'PLASMA_ZAP') {
      amount *= 0.75;
    }

    if (this.bossType === 'OMEGA_CORE_SPAWN') {
      if (this.isInvulnerable) {
        if (particles) {
          particles.createElectricSpark(this.x - 40, hitY, 8, '#00e5ff', '#ffffff');
          particles.createFloatingText(this.x - 30, hitY - 15, 'KEBAL!', '#00e5ff');
        }
        if (sound) sound.playEnemyHit();
        return false;
      }

      this.coreHp -= amount;
      if (!this.rageMode && (this.coreHp <= 360 * (this.hpMult || 1.0) || this.hpRatio <= this.rageThreshold)) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 40, '#ff1744', '#7b1fa2');
      }

      if (this.coreHp <= 0) {
        this.coreHp = 0;
        this.isDying = true;
        return true;
      }
      return false;
    }

    if (this.bossType === 'OMEGA_COLOSSUS') {
      if (this.railTopAlive && hitY < this.y - 55) {
        this.railTopHp -= amount;
        if (this.railTopHp <= 0) {
          this.railTopAlive = false;
          particles.createClaySplat(this.x - 60, this.y - 85, 28, '#00e5ff', '#0097a7');
          sound.playExplosion('large');
        }
      } else if (this.railBottomAlive && hitY > this.y + 55) {
        this.railBottomHp -= amount;
        if (this.railBottomHp <= 0) {
          this.railBottomAlive = false;
          particles.createClaySplat(this.x - 60, this.y + 85, 28, '#00e5ff', '#0097a7');
          sound.playExplosion('large');
        }
      } else if (this.droneCoreAlive && Math.abs(hitY - this.y) > 22 && Math.abs(hitY - this.y) < 55) {
        this.droneCoreHp -= amount;
        if (this.droneCoreHp <= 0) {
          this.droneCoreAlive = false;
          particles.createClaySplat(this.x - 30, this.y, 28, '#d500f9', '#7b1fa2');
          sound.playExplosion('large');
        }
      } else {
        this.coreHp -= amount;
      }

      if (!this.rageMode && (this.hpRatio <= this.rageThreshold || (!this.railTopAlive && !this.railBottomAlive) || this.coreHp < 350 * (this.hpMult || 1.0))) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 35, '#ff1744', '#b71c1c');
      }
    } else if (this.bossType === 'GOLIATH_ZEPPELIN') {
      if (this.mortarAlive && hitY < this.y - 40) {
        this.mortarHp -= amount;
        if (this.mortarHp <= 0) {
          this.mortarAlive = false;
          particles.createClaySplat(this.x - 40, this.y - 78, 22, '#d84315', '#bf360c');
          sound.playExplosion('small');
        }
      } else if (this.hangarAlive && hitY > this.y + 35) {
        this.hangarHp -= amount;
        if (this.hangarHp <= 0) {
          this.hangarAlive = false;
          particles.createClaySplat(this.x + 20, this.y + 65, 22, '#00838f', '#004d40');
          sound.playExplosion('small');
        }
      } else {
        this.coreHp -= amount;
      }

      if (!this.rageMode && (this.hpRatio <= this.rageThreshold || !this.mortarAlive || !this.hangarAlive || this.coreHp < 250 * (this.hpMult || 1.0))) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 30, '#ff1744', '#b71c1c');
      }
    } else if (this.bossType === 'LEVIATHAN_TITAN') {
      if (this.wingTopAlive && hitY < this.y - 55) {
        this.wingTopHp -= amount;
        if (this.wingTopHp <= 0) {
          this.wingTopAlive = false;
          particles.createClaySplat(this.x + 20, this.y - 85, 25, '#7b1fa2', '#311b92');
          sound.playExplosion('small');
        }
      } else if (this.wingBottomAlive && hitY > this.y + 55) {
        this.wingBottomHp -= amount;
        if (this.wingBottomHp <= 0) {
          this.wingBottomAlive = false;
          particles.createClaySplat(this.x + 20, this.y + 85, 25, '#7b1fa2', '#311b92');
          sound.playExplosion('small');
        }
      } else if (this.missilePodAlive && hitY > this.y - 50 && hitY < this.y + 50 && Math.abs(hitY - this.y) > 25) {
        this.missilePodHp -= amount;
        if (this.missilePodHp <= 0) {
          this.missilePodAlive = false;
          particles.createClaySplat(this.x - 20, this.y - 42, 22, '#c2185b', '#880e4f');
          particles.createClaySplat(this.x - 20, this.y + 42, 22, '#c2185b', '#880e4f');
          sound.playExplosion('small');
        }
      } else {
        this.coreHp -= amount;
      }

      if (!this.rageMode && (this.hpRatio <= this.rageThreshold || (!this.wingTopAlive && !this.wingBottomAlive) || this.coreHp < 280 * (this.hpMult || 1.0))) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 30, '#ff1744', '#b71c1c');
      }
    } else {
      // DREADNOUGHT
      if (this.turretTopAlive && hitY < this.y - 25) {
        this.turretTopHp -= amount;
        if (this.turretTopHp <= 0) {
          this.turretTopAlive = false;
          particles.createClaySplat(this.x - 30, this.y - 50, 20, '#e53935', '#b71c1c');
          sound.playExplosion('small');
        }
      } else if (this.turretBottomAlive && hitY > this.y + 25) {
        this.turretBottomHp -= amount;
        if (this.turretBottomHp <= 0) {
          this.turretBottomAlive = false;
          particles.createClaySplat(this.x - 30, this.y + 50, 20, '#e53935', '#b71c1c');
          sound.playExplosion('small');
        }
      } else {
        this.coreHp -= amount;
      }

      if (!this.rageMode && (this.hpRatio <= this.rageThreshold || (!this.turretTopAlive && !this.turretBottomAlive) || this.coreHp < 130 * (this.hpMult || 1.0))) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 25, '#ff1744', '#b71c1c');
      }
    }

    if (this.coreHp <= 0) {
      this.coreHp = 0;
      this.isDying = true;
      return true;
    }

    return false;
  }

  draw(ctx) {
    ClayRenderer.drawBoss(ctx, this);
  }
}
