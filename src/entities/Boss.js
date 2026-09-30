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
        this.punishWindowTimer = 0;
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
        this.maxTotalHp = Math.round(1200 * hpM); // World 2 airship fortress (HP persis sama)

        this.mortarTimer = 2.2;
        this.broadsideTimer = 1.5;
        this.swarmLaunchTimer = 1.8;
        this.topCatapultTimer = 3.2;
        this.airMineTimer = 4.5;
        this.mortarAngle = Math.PI * 0.85;
        this.sortieCount = 0;
        this.initialSortieDone = false;
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
        this.maxTotalHp = Math.round(600 * hpM); // World 1 armored dreadnought (HP persis sama)

        this.topTurretAngle = Math.PI;
        this.bottomTurretAngle = Math.PI;
        this.turretShootTimer = 0.75;
        this.turretSalvoStep = 0;
        this.spreadPatternTimer = 1.8;
        this.spreadWaveIndex = 0;
        this.sineStreamDuration = 0;
        this.sineStreamCooldown = 4.2;
        this.sineAngle = 0;
        this.sineStreamTimer = 0;
        this.scoutSpawnTimer = 3.8;
        this.scoutSquadCount = 0;
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

  update(dt, player, bullets, sound, camera, particles, extraEnemies = [], allEnemies = []) {
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
        this.updateGoliath(dt, player, bullets, sound, camera, particles, extraEnemies, allEnemies);
        break;
      case 'LEVIATHAN_TITAN':
        this.updateLeviathan(dt, player, bullets, sound, camera, particles);
        break;
      case 'DREADNOUGHT':
      default:
        this.updateDreadnought(dt, player, bullets, sound, camera, particles, extraEnemies, allEnemies);
        break;
    }

    return true;
  }

  updateDreadnought(dt, player, bullets, sound, camera, particles, extraEnemies, allEnemies = []) {
    const hoverSpeed = this.rageMode ? 0.07 : 0.038;
    const hoverRange = this.rageMode ? 140 : 95;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;
    if (this.rageMode) {
      this.x = this.targetX + Math.sin(this.tick * 0.05) * 25;
    } else {
      this.x = this.targetX;
    }

    const topX = this.x - 30;
    const topY = this.y - 50;
    this.topTurretAngle = Math.atan2(player.y - topY, player.x - topX);

    const botX = this.x - 30;
    const botY = this.y + 50;
    this.bottomTurretAngle = Math.atan2(player.y - botY, player.x - botX);

    // 1. POLA 1: Twin Turret Alternating Cross-Fire Waves (Cukup Sering & Berpola)
    this.turretShootTimer -= dt;
    if (this.turretShootTimer <= 0) {
      this.turretShootTimer = this.rageMode ? 0.42 : 0.72;
      this.turretSalvoStep++;

      const bSpeed = this.rageMode ? 490 : 410;
      const bothAlive = this.turretTopAlive && this.turretBottomAlive;
      const fireTop = this.turretTopAlive && (bothAlive ? (this.turretSalvoStep % 2 === 0 || this.turretSalvoStep % 4 === 0) : true);
      const fireBot = this.turretBottomAlive && (bothAlive ? (this.turretSalvoStep % 2 === 1 || this.turretSalvoStep % 4 === 0) : true);

      if (fireTop) {
        const topOffsets = this.rageMode
          ? [-0.34, -0.17, 0, 0.17, 0.34]
          : [-0.22, 0, 0.22];
        for (const off of topOffsets) {
          const ang = this.topTurretAngle + off;
          bullets.push(new Bullet({
            x: topX + Math.cos(ang) * 35,
            y: topY + Math.sin(ang) * 35,
            vx: Math.cos(ang) * bSpeed,
            vy: Math.sin(ang) * bSpeed,
            radius: 7,
            isEnemy: true
          }));
        }
      }

      if (fireBot) {
        const botOffsets = this.rageMode
          ? [-0.34, -0.17, 0, 0.17, 0.34]
          : [-0.22, 0, 0.22];
        for (const off of botOffsets) {
          const ang = this.bottomTurretAngle + off;
          bullets.push(new Bullet({
            x: botX + Math.cos(ang) * 35,
            y: botY + Math.sin(ang) * 35,
            vx: Math.cos(ang) * bSpeed,
            vy: Math.sin(ang) * bSpeed,
            radius: 7,
            isEnemy: true
          }));
        }
      }

      // Jika kedua turret hancur, baterai lambung darurat aktif menembak
      if (!this.turretTopAlive && !this.turretBottomAlive) {
        const ang = Math.atan2(player.y - this.y, player.x - this.x);
        for (const off of [-0.25, 0, 0.25]) {
          bullets.push(new Bullet({
            x: this.x - 50,
            y: this.y,
            vx: Math.cos(ang + off) * bSpeed,
            vy: Math.sin(ang + off) * bSpeed,
            radius: 7,
            isEnemy: true
          }));
        }
      }

      if (sound) sound.playEnemyShoot();
    }

    // 2. POLA 2: Core Multi-Way Geometric Arc Waves (Cukup Menyebar & Berpola)
    this.spreadPatternTimer -= dt;
    if (this.spreadPatternTimer <= 0) {
      this.spreadPatternTimer = this.rageMode ? 1.3 : 2.0;
      this.spreadWaveIndex++;

      const arcSpeed = this.rageMode ? 460 : 380;
      const coreX = this.x - 75;
      const coreY = this.y;

      let fanAngles;
      if (this.rageMode) {
        fanAngles = [-0.60, -0.45, -0.30, -0.15, 0, 0.15, 0.30, 0.45, 0.60];
      } else {
        fanAngles = (this.spreadWaveIndex % 2 === 0)
          ? [-0.50, -0.33, -0.17, 0, 0.17, 0.33, 0.50]
          : [-0.42, -0.25, -0.08, 0.08, 0.25, 0.42];
      }

      for (const ang of fanAngles) {
        bullets.push(new Bullet({
          x: coreX,
          y: coreY,
          vx: Math.cos(Math.PI + ang) * arcSpeed,
          vy: Math.sin(Math.PI + ang) * arcSpeed,
          radius: 8,
          isEnemy: true
        }));
      }

      if (sound) sound.playShoot('SPREAD');
      if (camera) camera.addTrauma(0.12);
      if (particles) particles.createClaySplat(coreX, coreY, 8, '#ffeb3b', '#ff6f00');
    }

    // 3. POLA 3: Sinusoidal Danmaku Curtain Stream (Ciri Khas Boss World 1)
    this.sineStreamCooldown -= dt;
    if (this.sineStreamCooldown <= 0 && this.sineStreamDuration <= 0) {
      this.sineStreamDuration = this.rageMode ? 1.6 : 1.2;
      this.sineStreamCooldown = this.rageMode ? 3.5 : 4.8;
      this.sineAngle = 0;
      this.sineStreamTimer = 0;
      if (particles) {
        particles.createFloatingText(this.x - 50, this.y - 45, '⚡ BARRAGE GELOMBANG!', '#ffeb3b');
      }
    }

    if (this.sineStreamDuration > 0) {
      this.sineStreamDuration -= dt;
      this.sineStreamTimer -= dt;
      if (this.sineStreamTimer <= 0) {
        this.sineStreamTimer = 0.13;
        const waveAng = Math.sin(this.sineAngle) * 0.58;
        this.sineAngle += 0.50;

        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y,
          vx: Math.cos(Math.PI + waveAng) * 440,
          vy: Math.sin(Math.PI + waveAng) * 440,
          radius: 7,
          isEnemy: true
        }));

        if (this.rageMode) {
          // Double counter-phase braided stream
          bullets.push(new Bullet({
            x: this.x - 70,
            y: this.y,
            vx: Math.cos(Math.PI - waveAng) * 440,
            vy: Math.sin(Math.PI - waveAng) * 440,
            radius: 7,
            isEnemy: true
          }));
        }

        if (sound) sound.playEnemyShoot();
      }
    }

    // 4. POLA 4: Spawn Gerombolan Pesawat Pink Stage 1 (Scout Swarm)
    this.scoutSpawnTimer -= dt;
    if (this.scoutSpawnTimer <= 0) {
      this.scoutSpawnTimer = this.rageMode ? 6.5 : 9.0;
      const livingScouts = allEnemies.filter(e => !e.dead && e.type === 'SCOUT').length;
      if (livingScouts < 6) {
        this.scoutSquadCount++;
        if (sound) sound.playBossAlarm();
        if (camera) camera.addTrauma(0.2);
        if (particles) {
          particles.createFloatingText(640, 220, '🚨 KAWANAN PESAWAT PINK MUNCUL!', '#e91e63');
        }

        const startY = (this.scoutSquadCount % 2 === 0)
          ? 180 + Math.random() * 60
          : 460 + Math.random() * 60;
        const fid = `boss_scout_wave_${this.scoutSquadCount}_${Math.floor(this.tick)}`;
        const count = 5;

        for (let i = 0; i < count; i++) {
          extraEnemies.push(new Enemy({
            type: 'SCOUT',
            x: 1320 + i * 50,
            y: startY,
            formationId: fid,
            stage: 1, // Pesawat pink stage 1
            isLastInFormation: (i === count - 1)
          }));
        }
      }
    }
  }

  updateGoliath(dt, player, bullets, sound, camera, particles, extraEnemies, allEnemies = []) {
    const hoverSpeed = this.rageMode ? 0.055 : 0.028;
    const hoverRange = this.rageMode ? 140 : 90;
    this.y = (this.canvasHeight / 2) + Math.sin(this.tick * hoverSpeed) * hoverRange;

    const smallTypes = ['DRONE', 'STINGER', 'SCOUT', 'SPINNER', 'INTERCEPTOR'];
    const activeSmallEnemies = allEnemies.filter(e => !e.dead && smallTypes.includes(e.type)).length;
    const maxSmallEnemies = this.rageMode ? 10 : 7;

    // Sortie Awal saat Goliath baru saja masuk arena
    if (!this.initialSortieDone) {
      this.initialSortieDone = true;
      if (sound) sound.playBossAlarm();
      if (particles) {
        particles.createFloatingText(640, 250, '✈️ GOLIATH AIR WING: FORMATION SORTIE!', '#00e5ff');
      }
      extraEnemies.push(new Enemy({ type: 'STINGER', x: this.x + 20, y: this.y + 65, stage: 10 }));
      extraEnemies.push(new Enemy({ type: 'DRONE', x: this.x + 20, y: this.y + 90, stage: 10 }));
      extraEnemies.push(new Enemy({ type: 'SCOUT', x: this.x - 20, y: this.y - 70, stage: 10 }));
    }

    // 1. VENTRAL BAY LAUNCHES: Hangar bawah meluncurkan pesawat tempur kecil pengganggu
    this.swarmLaunchTimer -= dt;
    if (this.swarmLaunchTimer <= 0) {
      this.swarmLaunchTimer = this.rageMode ? 1.3 : 2.0;
      if (activeSmallEnemies < maxSmallEnemies) {
        this.sortieCount++;
        const spawnY = this.y + 65;
        const spawnX = this.x + 20;

        if (this.hangarAlive) {
          // Hangar utama aktif: meluncurkan Stinger (menabrak cepat) dan Drone (menembak)
          extraEnemies.push(new Enemy({ type: 'STINGER', x: spawnX, y: spawnY - 15, stage: 10 }));
          extraEnemies.push(new Enemy({ type: 'DRONE', x: spawnX + 30, y: spawnY + 20, stage: 10 }));

          if (this.rageMode) {
            extraEnemies.push(new Enemy({ type: 'STINGER', x: spawnX + 60, y: spawnY, stage: 10 }));
          }

          if (particles) particles.createClaySplat(spawnX, spawnY, 10, '#00e5ff', '#0097a7');
          if (sound) sound.playShoot('SPREAD');
        } else {
          // Jika hangar bawah rusak: Catapult darurat lambung tetap meluncurkan pesawat kecil
          extraEnemies.push(new Enemy({ type: 'STINGER', x: spawnX, y: spawnY, stage: 10 }));
          if (particles) particles.createSmokePuff(spawnX, spawnY, 2, 12);
          if (sound) sound.playShoot('SPREAD');
        }
      }
    }

    // 2. FLIGHT DECK CATAPULT: Dek atas meluncurkan pesawat kecil pendukung
    this.topCatapultTimer -= dt;
    if (this.topCatapultTimer <= 0) {
      this.topCatapultTimer = this.rageMode ? 2.0 : 3.2;
      if (activeSmallEnemies < maxSmallEnemies) {
        const topX = this.x - 20;
        const topY = this.y - 70;

        extraEnemies.push(new Enemy({
          type: Math.random() > 0.4 ? 'STINGER' : 'INTERCEPTOR',
          x: topX,
          y: topY,
          stage: 10
        }));

        extraEnemies.push(new Enemy({
          type: 'SCOUT',
          x: topX + 40,
          y: topY - 30,
          stage: 10
        }));

        if (particles) {
          particles.createSmokePuff(topX, topY, 2, 14);
          particles.createFloatingText(topX - 30, topY - 20, '✈️ SORTIE!', '#ffd54f');
        }
        if (sound) sound.playShoot('HOMING');
      }
    }

    // 3. HEAVY ARCING CLUSTER MORTAR: Tembakan meriam lengkung penyekat arena
    const mortarX = this.x - 40;
    const mortarY = this.y - 78;
    this.mortarAngle = Math.atan2(player.y - mortarY, player.x - mortarX);

    if (this.mortarAlive) {
      this.mortarTimer -= dt;
      if (this.mortarTimer <= 0) {
        this.mortarTimer = this.rageMode ? 1.6 : 2.5;
        const mortarOffsets = this.rageMode
          ? [-80, -40, 0, 40, 80]
          : [-55, 0, 55];

        for (let m = 0; m < mortarOffsets.length; m++) {
          const vxOff = mortarOffsets[m];
          bullets.push(new Bullet({
            x: mortarX,
            y: mortarY,
            vx: -390 + vxOff,
            vy: -260,
            gravity: 280,
            radius: 12,
            type: 'ENEMY_MORTAR',
            life: 3.5,
            isEnemy: true
          }));
        }
        if (sound) sound.playShoot('FLAK');
        if (camera) camera.addTrauma(0.22);
      }
    }

    // 4. BROADSIDE FLAK CANNON: Tembakan samping meriam kapal
    this.broadsideTimer -= dt;
    if (this.broadsideTimer <= 0) {
      this.broadsideTimer = this.rageMode ? 0.9 : 1.5;
      const broadsideOffsets = this.rageMode
        ? [-60, -36, -12, 12, 36, 60]
        : [-45, -15, 15, 45];

      for (const offset of broadsideOffsets) {
        bullets.push(new Bullet({
          x: this.x - 70,
          y: this.y + 35 + offset * 0.4,
          vx: this.rageMode ? -470 : -410,
          vy: offset * 1.5,
          radius: 8,
          isEnemy: true
        }));
      }
      if (sound) sound.playEnemyShoot();
    }

    // 5. AERIAL DRIFT MINES: Ranjau terapung pembatas manuver pemain
    this.airMineTimer -= dt;
    if (this.airMineTimer <= 0) {
      this.airMineTimer = this.rageMode ? 3.8 : 5.5;
      const livingMines = allEnemies.filter(e => !e.dead && e.type === 'MINE').length;
      if (livingMines < 4) {
        extraEnemies.push(new Enemy({
          type: 'MINE',
          x: this.x - 50,
          y: this.y - 35,
          stage: 10
        }));
        extraEnemies.push(new Enemy({
          type: 'MINE',
          x: this.x - 50,
          y: this.y + 45,
          stage: 10
        }));
        if (particles) {
          particles.createFloatingText(this.x - 60, this.y + 55, '💣 RANJAU UDARA!', '#ff7043');
        }
        if (sound) sound.playShoot('FLAK');
      }
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
      const targetChargeTime = this.rageMode ? 0.8 : 1.4;
      this.laserChargeRatio = Math.min(1.0, this.laserChargeTime / targetChargeTime);

      if (particles && this.tick % 4 === 0) {
        particles.createElectricSpark(this.x - 110, this.y + (Math.random() - 0.5) * 40, 2, '#00e5ff', '#ffffff');
      }

      if (this.laserChargeTime >= targetChargeTime) {
        this.isChargingLaser = false;
        this.laserAttackCooldown = this.rageMode ? 3.0 : 5.5;

        sound.playShoot('LASER');
        camera.addTrauma(0.5);

        // Dense laser burst wave (9 lasers when enraged, 7 normal - leaves corner safe pockets)
        const laserCount = this.rageMode ? 9 : 7;
        const half = Math.floor(laserCount / 2);
        for (let i = 0; i < laserCount; i++) {
          const lAngle = (i - half) * (this.rageMode ? 0.085 : 0.095);
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
    if (this.railgunTimer <= 0.5 && this.railgunTimer > 0 && particles && this.tick % 3 === 0) {
      if (this.railTopAlive) particles.createElectricSpark(this.x - 70, this.y - 85, 2, '#00e5ff', '#ffffff');
      if (this.railBottomAlive) particles.createElectricSpark(this.x - 70, this.y + 85, 2, '#00e5ff', '#ffffff');
    }
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
        // Continuously lock in player Y coordinate so the trajectory is fixed and visible
        this.targetDashY = Math.max(120, Math.min(600, player ? player.y : this.y));
        // Vibration and lightning sparks
        this.x += (Math.random() - 0.5) * 8;
        this.y += (Math.random() - 0.5) * 6;
        if (particles && this.tick % 3 === 0) {
          particles.createElectricSpark(this.x - 20, this.y + (Math.random() - 0.5) * 40, 2, '#ff1744', '#ffd54f');
        }
        if (this.dashTimer <= 0) {
          this.dashState = 'RUSH';
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
          this.punishWindowTimer = 1.0; // 1-second punish window where spiral bullet hell ceases
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

    // 3. Counter-Rotating Dual-Spiral Bullet Hell (Balanced tempo with punish window)
    if (this.punishWindowTimer > 0) {
      this.punishWindowTimer -= dt;
    } else {
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
          if (particles) particles.createClaySplat(this.x - 60, this.y - 85, 28, '#00e5ff', '#0097a7');
          if (sound) sound.playExplosion('large');
        }
      } else if (this.railBottomAlive && hitY > this.y + 55) {
        this.railBottomHp -= amount;
        if (this.railBottomHp <= 0) {
          this.railBottomAlive = false;
          if (particles) particles.createClaySplat(this.x - 60, this.y + 85, 28, '#00e5ff', '#0097a7');
          if (sound) sound.playExplosion('large');
        }
      } else if (this.droneCoreAlive && Math.abs(hitY - this.y) > 22 && Math.abs(hitY - this.y) < 55) {
        this.droneCoreHp -= amount;
        if (this.droneCoreHp <= 0) {
          this.droneCoreAlive = false;
          if (particles) particles.createClaySplat(this.x - 30, this.y, 28, '#d500f9', '#7b1fa2');
          if (sound) sound.playExplosion('large');
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
          if (particles) particles.createClaySplat(this.x - 40, this.y - 78, 22, '#d84315', '#bf360c');
          if (sound) sound.playExplosion('small');
        }
      } else if (this.hangarAlive && hitY > this.y + 35) {
        this.hangarHp -= amount;
        if (this.hangarHp <= 0) {
          this.hangarAlive = false;
          if (particles) particles.createClaySplat(this.x + 20, this.y + 65, 22, '#00838f', '#004d40');
          if (sound) sound.playExplosion('small');
        }
      } else {
        this.coreHp -= amount;
      }

      if (!this.rageMode && (this.hpRatio <= this.rageThreshold || (!this.mortarAlive && !this.hangarAlive) || this.coreHp < 250 * (this.hpMult || 1.0))) {
        this.rageMode = true;
        if (sound) sound.playBossAlarm();
        if (particles) particles.createClaySplat(this.x, this.y, 30, '#ff1744', '#b71c1c');
      }
    } else if (this.bossType === 'LEVIATHAN_TITAN') {
      if (this.wingTopAlive && hitY < this.y - 55) {
        this.wingTopHp -= amount;
        if (this.wingTopHp <= 0) {
          this.wingTopAlive = false;
          if (particles) particles.createClaySplat(this.x + 20, this.y - 85, 25, '#7b1fa2', '#311b92');
          if (sound) sound.playExplosion('small');
        }
      } else if (this.wingBottomAlive && hitY > this.y + 55) {
        this.wingBottomHp -= amount;
        if (this.wingBottomHp <= 0) {
          this.wingBottomAlive = false;
          if (particles) particles.createClaySplat(this.x + 20, this.y + 85, 25, '#7b1fa2', '#311b92');
          if (sound) sound.playExplosion('small');
        }
      } else if (this.missilePodAlive && hitY > this.y - 50 && hitY < this.y + 50 && Math.abs(hitY - this.y) > 25) {
        this.missilePodHp -= amount;
        if (this.missilePodHp <= 0) {
          this.missilePodAlive = false;
          if (particles) {
            particles.createClaySplat(this.x - 20, this.y - 42, 22, '#c2185b', '#880e4f');
            particles.createClaySplat(this.x - 20, this.y + 42, 22, '#c2185b', '#880e4f');
          }
          if (sound) sound.playExplosion('small');
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
          if (particles) particles.createClaySplat(this.x - 30, this.y - 50, 20, '#e53935', '#b71c1c');
          if (sound) sound.playExplosion('small');
        }
      } else if (this.turretBottomAlive && hitY > this.y + 25) {
        this.turretBottomHp -= amount;
        if (this.turretBottomHp <= 0) {
          this.turretBottomAlive = false;
          if (particles) particles.createClaySplat(this.x - 30, this.y + 50, 20, '#e53935', '#b71c1c');
          if (sound) sound.playExplosion('small');
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
