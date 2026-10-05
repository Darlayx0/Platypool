// Enemies and Wave Formations for Platypus AI
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { Clay3D } from '../graphics/Clay3D.js';
import { Bullet } from './Bullet.js';

export class Enemy {
  static currentStage = 1;
  static difficultyConfig = null;
  static hpDisplayMode = 'DYNAMIC'; // 'DYNAMIC' | 'ALWAYS' | 'MINIMAL'

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
    this.speedMult = 1.0;

    this.tick = Math.random() * 50;
    this.dead = false;
    this.slowTimer = 0;
    this.spawnGraceTimer = 0.6; // Anti-blind fire grace period
    this.invulnerableTimer = 0;
    this.maxInvulnerableTimer = 0;
    this.isMiniBoss = false;

    this.roll = 0;
    this.pitch = 0;
    this.targetRoll = 0;
    this.altitude = options.altitude || (0.85 + Math.random() * 0.3);

    // Type-specific setup
    this.initType(options);

    // Dynamic Visual Health Bar & Damage Feedback State
    this.hpBarTimer = 0;
    this.lagHp = this.hp;
    this.criticalSmokeTimer = 0;
  }

  initType(options = {}) {
    switch (this.type) {
      case 'DRONE':
        this.maxHp = 2.5;
        this.hp = 2.5;
        this.radius = 18;
        this.vx = -240;
        this.vy = 0;
        this.scoreValue = 15;
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
        this.scoreValue = 60;
        this.shootTimer = 1.2;
        this.targetHoverX = 900 + Math.random() * 180;
        this.color = '#3949ab';
        this.shadowColor = '#1a237e';
        break;

      case 'BLIMP':
        this.maxHp = 22;
        this.hp = 22;
        this.radius = 55;
        this.vx = -65;
        this.vy = 0;
        this.scoreValue = 150;
        this.shootTimer = 1.5;
        this.color = '#ffe082';
        this.shadowColor = '#ff8f00';
        break;

      case 'STINGER':
        this.maxHp = 3.5;
        this.hp = 3.5;
        this.radius = 16;
        this.vx = options.vx !== undefined ? options.vx : -270;
        this.vy = 0;
        this.baseVy = options.baseVy !== undefined ? options.baseVy : (Math.random() - 0.5) * 60;
        this.scoreValue = 20;
        this.charging = options.charging || false;
        this.hasCharged = options.charging || false;
        this.color = '#ffb300';
        this.shadowColor = '#e65100';
        break;

      case 'SNIPER':
        this.maxHp = 10;
        this.hp = 10;
        this.radius = 22;
        this.vx = -220;
        this.vy = 0;
        this.scoreValue = 45;
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
        this.maxHp = 18;
        this.hp = 18;
        this.radius = 38;
        this.vx = -110;
        this.vy = 0;
        this.scoreValue = 80;
        this.bombTimer = 1.2 + Math.random();
        this.color = '#689f38';
        this.shadowColor = '#2e7d32';
        break;

      case 'SPINNER':
        this.maxHp = options.hp !== undefined ? options.hp : 10;
        this.hp = this.maxHp;
        this.radius = 24;
        this.vx = options.vx !== undefined ? options.vx : -190;
        this.vy = options.vy !== undefined ? options.vy : ((Math.random() > 0.5 ? 1 : -1) * 160);
        this.scoreValue = 35;
        this.sparkTimer = options.sparkTimer !== undefined ? options.sparkTimer : 1.2;
        this.sparkInterval = options.sparkInterval !== undefined ? options.sparkInterval : 1.4;
        this.baseY = this.y;
        this.waveAmp = options.waveAmp !== undefined ? options.waveAmp : 0;
        this.waveFreq = options.waveFreq !== undefined ? options.waveFreq : 0.0065;
        this.phase = options.phase !== undefined ? options.phase : 0;
        this.driftY = options.driftY !== undefined ? options.driftY : 0;
        this.swoopAmp = options.swoopAmp !== undefined ? options.swoopAmp : 0;
        this.syncWave = Boolean(options.syncWave);
        this.color = '#e53935';
        this.shadowColor = '#b71c1c';
        break;

      case 'SHIELD_CRUISER':
        this.maxHp = 16;
        this.hp = 16;
        this.maxShieldHp = 10;
        this.shieldHp = 10;
        this.radius = 36;
        this.vx = -95;
        this.vy = 0;
        this.targetX = 920 + Math.random() * 150;
        this.scoreValue = 90;
        this.shootTimer = 1.6;
        this.color = '#00acc1';
        this.shadowColor = '#006064';
        break;

      case 'MINE_LAYER':
        this.maxHp = 15;
        this.hp = 15;
        this.radius = 28;
        this.vx = -85;
        this.vy = 0;
        this.scoreValue = 55;
        this.mineTimer = 1.8 + Math.random() * 0.8;
        this.color = '#d84315';
        this.shadowColor = '#bf360c';
        break;

      case 'MINE':
        this.maxHp = options.hp !== undefined ? options.hp : 3;
        this.hp = this.maxHp;
        this.radius = 18;
        this.vx = options.vx !== undefined ? options.vx : -45;
        this.vy = options.vy !== undefined ? options.vy : 0;
        this.baseY = this.y;
        this.scoreValue = 10;
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
        this.scoreValue = 75;
        this.shootTimer = 1.0;
        this.color = '#ffca28';
        this.shadowColor = '#ff6f00';
        break;

      case 'INTERCEPTOR':
        this.maxHp = 8;
        this.hp = 8;
        this.radius = 22;
        this.vx = -300;
        this.vy = 0;
        this.baseY = this.y;
        this.scoreValue = 75;
        this.phaseState = 'APPROACH';
        this.stateTimer = 0.9;
        this.hasShot = false;
        this.color = '#ab47bc';
        this.shadowColor = '#4a148c';
        break;

      case 'JUGGERNAUT':
        this.isMiniBoss = false;
        this.invulnerableTimer = options.invulnerableTimer !== undefined ? options.invulnerableTimer : 0;
        this.maxInvulnerableTimer = this.invulnerableTimer;
        this.maxHp = 28;
        this.hp = 28;
        this.maxShieldHp = 14;
        this.shieldHp = 14;
        this.radius = 48;
        this.vx = -60;
        this.vy = 0;
        this.scoreValue = 180;
        this.mortarTimer = 1.6;
        this.burstTimer = 1.2;
        this.color = '#37474f';
        this.shadowColor = '#212121';
        break;

      case 'VORTEX_DRONE':
        this.maxHp = 10;
        this.hp = 10;
        this.radius = 26;
        this.vx = -110;
        this.vy = 0;
        this.baseY = this.y;
        this.orbitPhase = Math.random() * Math.PI * 2;
        this.scoreValue = 85;
        this.vortexTimer = 2.2;
        this.color = '#00e5ff';
        this.shadowColor = '#006064';
        break;

      case 'RETRO_BIPLANE':
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : (this.x < 100);
        this.stopAtX = options.stopAtX !== undefined ? options.stopAtX : (this.fromBehind && !options.flyAcross ? 1100 : null);
        this.flyAcross = options.flyAcross || false;
        this.isAnchored = false;
        this.maxHp = 5;
        this.hp = 5;
        this.radius = 22;
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 290 : -220);
        this.vy = options.vy !== undefined ? options.vy : 0;
        this.scoreValue = 30;
        this.shootTimer = 1.2 + Math.random() * 0.8;
        this.color = '#ff7043';
        this.shadowColor = '#d84315';
        break;

      case 'SWING_GLIDER':
        this.maxHp = 5;
        this.hp = 5;
        this.radius = 20;
        this.vx = options.vx !== undefined ? options.vx : -160;
        this.vy = 0;
        this.baseY = this.y;
        this.baseX = this.x;
        this.swingPhase = options.swingPhase !== undefined ? options.swingPhase : Math.random() * Math.PI * 2;
        this.swingAmp = options.swingAmp || 110;
        this.swingSpeed = options.swingSpeed || 2.4;
        this.scoreValue = 28;
        this.shootTimer = 1.4 + Math.random();
        this.color = '#26a69a';
        this.shadowColor = '#004d40';
        break;

      case 'CANYON_DIVER':
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 22;
        this.vx = options.vx !== undefined ? options.vx : -130;
        this.vy = options.vy !== undefined ? options.vy : 230;
        this.diveState = 'DIVING';
        this.scoreValue = 35;
        this.shootTimer = 0.8;
        this.color = '#ff9800';
        this.shadowColor = '#e65100';
        break;

      case 'GEYSER_RUSHER':
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 20;
        this.vx = options.vx !== undefined ? options.vx : -150;
        this.vy = options.vy !== undefined ? options.vy : -280;
        this.gravity = options.gravity !== undefined ? options.gravity : 260;
        this.scoreValue = 32;
        this.shootTimer = 0.9;
        this.color = '#d84315';
        this.shadowColor = '#bf360c';
        break;

      case 'FALCON_TRACKER':
        this.maxHp = 12;
        this.hp = 12;
        this.radius = 24;
        this.vx = -180;
        this.vy = 0;
        this.speed = 220;
        this.turnSpeed = 2.0;
        this.aimAngle = Math.PI;
        this.scoreValue = 50;
        this.shootTimer = 1.3;
        this.color = '#f57c00';
        this.shadowColor = '#b26a00';
        break;

      case 'CYBER_PHANTOM':
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : (this.x < 100);
        this.stopAtX = options.stopAtX !== undefined ? options.stopAtX : (this.fromBehind && !options.flyAcross ? 1080 : null);
        this.flyAcross = options.flyAcross || false;
        this.isAnchored = false;
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 22;
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 360 : -280);
        this.vy = 0;
        this.scoreValue = 65;
        this.shootTimer = 0.8;
        this.color = '#00e5ff';
        this.shadowColor = '#00838f';
        break;

      case 'CYBER_PENDULUM':
        this.maxHp = 12;
        this.hp = 12;
        this.radius = 26;
        this.vx = options.vx !== undefined ? options.vx : -100;
        this.vy = 0;
        this.baseY = this.y;
        this.swingPhase = options.swingPhase || 0;
        this.swingAmp = 140;
        this.swingSpeed = 2.8;
        this.scoreValue = 70;
        this.shootTimer = 1.1;
        this.color = '#7c4dff';
        this.shadowColor = '#4527a0';
        break;

      case 'VOID_STALKER':
        this.maxHp = 14;
        this.hp = 14;
        this.radius = 24;
        this.vx = -190;
        this.vy = 0;
        this.speed = 240;
        this.turnSpeed = 2.4;
        this.aimAngle = Math.PI;
        this.scoreValue = 85;
        this.shootTimer = 1.2;
        this.color = '#b388ff';
        this.shadowColor = '#6200ea';
        break;

      case 'METEOR_DIVER':
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 22;
        this.vx = options.vx !== undefined ? options.vx : -160;
        this.vy = options.vy !== undefined ? options.vy : 260;
        this.scoreValue = 60;
        this.shootTimer = 0.7;
        this.color = '#ff5252';
        this.shadowColor = '#c62828';
        break;

      case 'ABYSS_ASCENDER':
        this.maxHp = 9;
        this.hp = 9;
        this.radius = 24;
        this.vx = options.vx !== undefined ? options.vx : -140;
        this.vy = options.vy !== undefined ? options.vy : -270;
        this.scoreValue = 65;
        this.shootTimer = 0.8;
        this.color = '#ea80fc';
        this.shadowColor = '#aa00ff';
        break;

      case 'WARP_FLANKER':
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : (this.x < 100);
        this.stopAtX = options.stopAtX !== undefined ? options.stopAtX : (this.fromBehind && !options.flyAcross ? 1100 : null);
        this.flyAcross = options.flyAcross || false;
        this.isAnchored = false;
        this.baseY = this.y;
        this.loopPhase = Math.random() * Math.PI * 2;
        this.maxHp = 10;
        this.hp = 10;
        this.radius = 24;
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 340 : -260);
        this.vy = options.vy !== undefined ? options.vy : 0;
        this.scoreValue = 80;
        this.shootTimer = 1.0;
        this.color = '#e040fb';
        this.shadowColor = '#7b1fa2';
        break;

      case 'COSMIC_ORBITER':
        this.maxHp = 15;
        this.hp = 15;
        this.radius = 30;
        this.vx = options.vx !== undefined ? options.vx : -70;
        this.vy = 0;
        this.baseY = this.y;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitRadiusX = 90;
        this.orbitRadiusY = 130;
        this.orbitSpeed = 2.0;
        this.scoreValue = 95;
        this.shootTimer = 1.4;
        this.color = '#64ffda';
        this.shadowColor = '#00bfa5';
        break;

      case 'QUANTUM_WARPER':
        this.maxHp = 10.2;
        this.hp = 10.2;
        this.radius = 24;
        this.vx = options.vx !== undefined ? options.vx : -45;
        this.vy = 0;
        this.scoreValue = 90;
        this.blinkState = 'MATERIALIZING';
        this.blinkTimer = 0.4;
        this.blinkAlpha = 0.2;
        this.shootTimer = 0.8;
        this.color = '#00e5ff';
        this.shadowColor = '#006064';
        break;

      case 'SINGULARITY_ORB':
        this.maxHp = 15.5;
        this.hp = 15.5;
        this.radius = 28;
        this.vx = options.vx !== undefined ? options.vx : -45;
        this.vy = 0;
        this.baseY = this.y;
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.gravityPull = options.gravityPull !== undefined ? options.gravityPull : 75;
        this.scoreValue = 120;
        this.shootTimer = 1.6;
        this.color = '#7c4dff';
        this.shadowColor = '#311b92';
        break;

      case 'BINARY_TETHER':
        this.maxHp = 11.8;
        this.hp = 11.8;
        this.radius = 22;
        this.vx = options.vx !== undefined ? options.vx : -65;
        this.vy = 0;
        this.scoreValue = 85;
        this.laserState = 'IDLE'; // 'IDLE' -> 'TELEGRAPH' -> 'FIRING' -> 'IDLE'
        this.laserTimer = 0.8 + Math.random() * 0.6;
        this.targetAngle = Math.PI;
        this.laserWarmup = 0.85; // Durasi peringatan bidikan laser (0.85 detik)
        this.laserDuration = 0.60; // Durasi tembakan sinar laser mematikan (0.60 detik)
        this.shootTimer = 999999;
        this.color = '#ffd700';
        this.shadowColor = '#ff6d00';
        break;

      case 'CHRONO_LEECH':
        this.maxHp = 12;
        this.hp = 12;
        this.radius = 26;
        this.vx = options.vx !== undefined ? options.vx : -65;
        this.vy = 0;
        this.baseY = this.y;
        this.scoreValue = 100;
        this.shootTimer = 1.3;
        this.color = '#ea80fc';
        this.shadowColor = '#aa00ff';
        break;

      case 'COSMIC_CRUISER':
        this.isMiniBoss = false;
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : (this.x < 100);
        this.maxHp = 36;
        this.hp = 36;
        this.maxShieldHp = 16;
        this.shieldHp = 16;
        this.radius = 46;
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 55 : -50);
        this.vy = 0;
        this.scoreValue = 200;
        this.shootTimer = 1.1;
        this.color = '#1c2331';
        this.shadowColor = '#0d131f';
        break;

      case 'CHRONO_DREADNOUGHT':
        this.isMiniBoss = false;
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : (this.x < 100);
        this.maxHp = 54;
        this.hp = 54;
        this.maxShieldHp = 20;
        this.shieldHp = 20;
        this.radius = 48;
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 50 : -45);
        this.vy = 0;
        this.scoreValue = 350;
        this.shootTimer = 1.2;
        this.chronoWaveTimer = 1.6;
        this.flakMortarTimer = 3.2;
        this.color = '#ffd700';
        this.shadowColor = '#b8860b';
        break;

      case 'JUMBO_DREAD_CRUISER':
        this.isJumbo = true;
        this.isMiniBoss = true;
        this.invulnerableTimer = options.invulnerableTimer !== undefined ? options.invulnerableTimer : 2.5;
        this.maxInvulnerableTimer = this.invulnerableTimer;
        this.maxHp = 100;
        this.hp = 100;
        this.radius = 62;
        this.vx = -45;
        this.vy = 0;
        this.targetHoverX = 980;
        this.scoreValue = 350;
        this.shootTimer = 1.3;
        this.mortarTimer = 2.2;
        this.carrierTimer = 4.0;
        this.color = '#455a64';
        this.shadowColor = '#1c313a';
        break;

      case 'JUMBO_SAND_FORTRESS':
        this.isJumbo = true;
        this.isMiniBoss = true;
        this.invulnerableTimer = options.invulnerableTimer !== undefined ? options.invulnerableTimer : 3.0;
        this.maxInvulnerableTimer = this.invulnerableTimer;
        this.maxHp = 180;
        this.hp = 180;
        this.radius = 68;
        this.vx = -40;
        this.vy = 0;
        this.targetHoverX = 970;
        this.scoreValue = 450;
        this.mortarTimer = 1.8;
        this.burstTimer = 1.3;
        this.color = '#a1887f';
        this.shadowColor = '#4e342e';
        break;

      case 'JUMBO_CYBER_GARGANTUA':
        this.isJumbo = true;
        this.isMiniBoss = true;
        this.invulnerableTimer = options.invulnerableTimer !== undefined ? options.invulnerableTimer : 3.0;
        this.maxInvulnerableTimer = this.invulnerableTimer;
        this.maxHp = 200;
        this.hp = 200;
        this.maxShieldHp = 80;
        this.shieldHp = 80;
        this.radius = 72;
        this.vx = -35;
        this.vy = 0;
        this.targetHoverX = 960;
        this.scoreValue = 650;
        this.shootTimer = 1.0;
        this.novaTimer = 2.4;
        this.railgunTimer = 1.8;
        this.color = '#1a237e';
        this.shadowColor = '#0d1338';
        break;

      case 'JUMBO_SINGULARITY_TITAN':
        this.isJumbo = true;
        this.isMiniBoss = true;
        this.invulnerableTimer = options.invulnerableTimer !== undefined ? options.invulnerableTimer : 3.5;
        this.maxInvulnerableTimer = this.invulnerableTimer;
        this.maxHp = 280;
        this.hp = 280;
        this.maxShieldHp = 120;
        this.shieldHp = 120;
        this.radius = 76;
        this.fromBehind = options.fromBehind !== undefined ? options.fromBehind : false;
        this.targetHoverX = options.targetHoverX !== undefined ? options.targetHoverX : (this.fromBehind ? 240 : 960);
        this.vx = options.vx !== undefined ? options.vx : (this.fromBehind ? 75 : -60);
        this.vy = 0;
        this.hoverPhase = 'ENTER'; // 'ENTER', 'HOVER_STATIC', 'ADVANCE_LEFT', 'ADVANCE_RIGHT'
        this.hoverTimer = 12.0; // Mengayun & statis di sisi layar (~12 detik)
        this.scoreValue = 900;
        this.vortexTimer = 2.0;
        this.starNovaTimer = 1.5;
        this.homingPodTimer = 2.6;
        this.color = '#311b92';
        this.shadowColor = '#12005e';
        break;

      case 'FRUIT_CARRIER':
        this.maxHp = 2.0;
        this.hp = 2.0;
        this.radius = 28;
        this.vx = options.vx !== undefined ? options.vx : -150;
        this.vy = 0;
        this.baseY = this.y;
        this.waveFreq = options.waveFreq !== undefined ? options.waveFreq : 0.03;
        this.waveAmp = options.waveAmp !== undefined ? options.waveAmp : 28;
        this.scoreValue = 60;
        this.shootTimer = 999999;
        this.color = '#ffb300';
        this.shadowColor = '#e65100';
        break;

      case 'SCOUT':
      default:
        this.maxHp = 2.0;
        this.hp = 2.0;
        this.radius = 16;
        this.vx = -210;
        this.vy = 0;
        this.baseY = this.y;
        this.waveFreq = options.waveFreq !== undefined ? options.waveFreq : 0.05;
        this.waveAmp = options.waveAmp !== undefined ? options.waveAmp : 55;
        this.syncWave = Boolean(options.syncWave);
        this.scoreValue = 10;
        this.shootTimer = 2.0 + Math.random() * 2.0;
        this.color = '#e91e63';
        this.shadowColor = '#880e4f';
        break;
    }

    // Standar 1.0x antar world: Tidak ada multiplier pengganda HP, jeda peluru, atau kecepatan peluru per world/stage.
    // Karakteristik musuh konsisten dan perbedaan kesulitan murni berasal dari jenis arketipe
    // khusus tiap world (pola gerakan, taktik serangan, sudut spawn unik).
    const diff = this.difficultyConfig || Enemy.difficultyConfig || {};
    const diffHp = diff.hpMult !== undefined ? diff.hpMult : 1.0;
    const diffBulletSpeed = diff.bulletSpeedMult !== undefined ? diff.bulletSpeedMult : 1.0;
    const diffShootCd = diff.shootCooldownMult !== undefined ? diff.shootCooldownMult : 1.0;

    this.bulletSpeedMult = diffBulletSpeed;
    this.shootCooldownMult = diffShootCd;
    this.speedMult = 1.0;

    if (options && options.hp !== undefined) {
      this.maxHp = Math.round(options.hp * diffHp * 10) / 10;
      this.hp = this.maxHp;
    } else {
      this.maxHp = Math.round(this.maxHp * diffHp * 10) / 10;
      this.hp = this.maxHp;
    }
    if (this.maxShieldHp) {
      this.maxShieldHp = Math.round(this.maxShieldHp * diffHp * 10) / 10;
      this.shieldHp = this.maxShieldHp;
    }

    // World score multiplier: 1x, 2x, 3x, 4x
    let scoreWorldMult = this.world;
    this.scoreValue = Math.round(this.scoreValue * scoreWorldMult);
    if (this.shootTimer) this.shootTimer *= this.shootCooldownMult;
  }

  update(dt, player, bullets, sound, extraEnemies = [], particles = null, allEnemies = []) {
    const prevX = this.x;
    const prevY = this.y;
    this.tick += (this.slowTimer > 0 ? 0.5 : 1.0);

    if (this.spawnGraceTimer > 0) {
      this.spawnGraceTimer -= dt;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      dt *= 0.50; // Electro-paralysis: 50% speed penalty to movement and fire
      this.shootCooldownMult = 2.0; // Jeda peluru musuh menjadi lebih lambat
      this.speedMult = 0.50;
      this.bulletSpeedMult = 0.70;
      if (particles && Math.random() < 0.25) {
        particles.createElectricSpark(this.x, this.y, 2, '#ea80fc', '#aa00ff');
      }
    } else {
      this.shootCooldownMult = 1.0;
      this.speedMult = 1.0;
      this.bulletSpeedMult = 1.0;
    }

    // Dynamic HP bar timer & White-loss damage lag interpolation
    if (this.hpBarTimer > 0) {
      this.hpBarTimer = Math.max(0, this.hpBarTimer - dt);
    }
    if (this.lagHp > this.hp) {
      this.lagHp += (this.hp - this.lagHp) * Math.min(1, dt * 7.5);
    } else {
      this.lagHp = this.hp;
    }

    // Diegetic damage feedback: subtle clay friction smoke puffs when critically damaged (HP <= 30%)
    if (!this.dead && this.maxHp >= 6 && (this.hp / this.maxHp) <= 0.30) {
      this.criticalSmokeTimer -= dt;
      if (this.criticalSmokeTimer <= 0) {
        this.criticalSmokeTimer = 0.22 + Math.random() * 0.12;
        if (particles && typeof particles.createSmokePuff === 'function') {
          const offX = (Math.random() - 0.5) * (this.radius * 0.5);
          const offY = (Math.random() - 0.5) * (this.radius * 0.5);
          particles.createSmokePuff(this.x + offX, this.y + offY, 1, Math.min(10, this.radius * 0.45));
        }
      }
    }

    switch (this.type) {
      case 'SCOUT':
        this.x += this.vx * dt;
        if (this.waveAmp > 0) {
          if (this.syncWave) {
            this.y = this.baseY + Math.sin(this.tick * (this.waveFreq || 0.04)) * this.waveAmp;
          } else {
            this.y = this.baseY + Math.sin(this.x * this.waveFreq) * this.waveAmp;
          }
        } else {
          this.y = this.baseY;
        }
        break;

      case 'DRONE':
        this.x += this.vx * dt;
        const dyDrone = player.y - this.y;
        this.y += Math.sign(dyDrone) * Math.min(Math.abs(dyDrone), 140 * dt * this.speedMult);

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1150 && this.x > player.x + 80) {
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
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200 && this.x > player.x + 50) {
          this.shootTimer = 2.6 * this.shootCooldownMult; // Lebih berjeda (~2.6s)
          const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
          const spd = 360 * this.bulletSpeedMult;

          // Hanya 1 butir peluru menargetkan pemain
          bullets.push(new Bullet({
            x: this.x - 25,
            y: this.y,
            vx: Math.cos(angleToPlayer) * spd,
            vy: Math.sin(angleToPlayer) * spd,
            radius: 7,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'BLIMP':
        this.x += this.vx * dt;
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200 && this.x > player.x + 50) {
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
        if (this.x > this.targetX || this.spawnGraceTimer > 0) {
          this.x += this.vx * dt;
        } else {
          // Hover in place and aim laser at player
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
        if (this.bombTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 150 && this.x < 1180) {
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
        if (this.waveAmp > 0 || this.swoopAmp || this.driftY) {
          const freq = this.waveFreq || 0.0065;
          const ph = this.phase || 0;
          const progress = Math.max(0, 1360 - this.x);
          const drift = this.driftY ? progress * this.driftY : 0;
          let curveY = (this.waveAmp > 0) ? Math.sin(this.x * freq + ph) * this.waveAmp : 0;
          if (this.swoopAmp) {
            curveY += Math.sin((progress / 1400) * Math.PI) * this.swoopAmp;
          }
          this.y = Math.max(70, Math.min(650, this.baseY + curveY + drift));
        } else if (this.vy !== 0) {
          this.y += this.vy * dt;
          // Bounce off top and bottom screen
          if (this.y < 70) {
            this.y = 70;
            this.vy = Math.abs(this.vy);
          } else if (this.y > 650) {
            this.y = 650;
            this.vy = -Math.abs(this.vy);
          }
        }

        this.sparkTimer -= dt;
        if (this.sparkTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1150 && this.x > 100) {
          this.sparkTimer = (this.sparkInterval || 1.4) * this.shootCooldownMult;
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
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200 && this.x > player.x + 60) {
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
        if (this.mineTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 300 && this.x < 1180) {
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
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1150 && this.x > player.x + 80) {
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
            this.stateTimer = 0.60;
            this.hasShot = false;
          }
        } else if (this.phaseState === 'BRAKE_SHOOT') {
          this.x += (this.vx * 0.16) * dt;
          this.y += Math.sin(this.tick * 0.1) * 35 * dt;
          this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
          this.stateTimer -= dt;
          if (!this.hasShot && this.stateTimer <= 0.28 && this.spawnGraceTimer <= 0) {
            this.hasShot = true;
            const targetAngle = this.aimAngle;
            const offs = [-0.20, 0, 0.20]; // 3 Laser menyebar rapi
            const lSpeed = 540 * this.bulletSpeedMult;
            for (let k = 0; k < 3; k++) {
              const ang = targetAngle + offs[k];
              bullets.push(new Bullet({
                x: this.x - 25,
                y: this.y,
                vx: Math.cos(ang) * lSpeed,
                vy: Math.sin(ang) * lSpeed,
                radius: 7,
                type: 'ENEMY_SNIPER',
                isEnemy: true
              }));
            }
            sound.playShoot('LASER');
          }
          if (this.stateTimer <= 0) {
            this.phaseState = 'DASH_OUT';
            this.vx = -550 * this.speedMult;
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
        if (this.mortarTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1250 && this.x > player.x + 80) {
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
        if (this.burstTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1180 && this.x > player.x + 50) {
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
        if (this.vortexTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200 && this.x > player.x + 70) {
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

      case 'RETRO_BIPLANE':
        if (this.fromBehind) {
          if (this.stopAtX && !this.isAnchored && this.x >= this.stopAtX) {
            this.isAnchored = true;
            this.vx = 0;
          }
          if (this.isAnchored) {
            this.y += Math.sin(this.tick * 0.05) * 45 * dt;
          } else {
            this.x += this.vx * dt;
          }
        } else {
          this.x += this.vx * dt;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1240) {
          this.shootTimer = 1.3 * this.shootCooldownMult;
          const bulletDir = (this.fromBehind && this.isAnchored) ? -1 : (this.fromBehind ? 1 : -1);
          bullets.push(new Bullet({
            x: this.x + bulletDir * 20,
            y: this.y - 7,
            vx: bulletDir * 360 * this.bulletSpeedMult,
            vy: 0,
            radius: 6,
            isEnemy: true
          }));
          bullets.push(new Bullet({
            x: this.x + bulletDir * 20,
            y: this.y + 7,
            vx: bulletDir * 360 * this.bulletSpeedMult,
            vy: 0,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'SWING_GLIDER':
        this.x += this.vx * dt;
        this.swingPhase += this.swingSpeed * dt * this.speedMult;
        this.y = this.baseY + Math.sin(this.swingPhase) * this.swingAmp;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1180 && this.x > player.x + 60) {
          this.shootTimer = 1.5 * this.shootCooldownMult;
          const ang = Math.atan2(player.y - this.y, player.x - this.x);
          bullets.push(new Bullet({
            x: this.x - 16,
            y: this.y,
            vx: Math.cos(ang) * 350 * this.bulletSpeedMult,
            vy: Math.sin(ang) * 350 * this.bulletSpeedMult,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'CANYON_DIVER':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.y > 480) {
          this.vy -= 280 * dt;
          this.vx -= 50 * dt;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.y > 80 && this.y < 640 && this.x > 100 && this.x < 1200) {
          this.shootTimer = 0.9 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          bullets.push(new Bullet({
            x: this.x,
            y: this.y + 12,
            vx: Math.cos(a) * 360 * this.bulletSpeedMult,
            vy: Math.sin(a) * 360 * this.bulletSpeedMult,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'GEYSER_RUSHER':
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.y < 620 && this.y > 60 && this.x > 100 && this.x < 1200) {
          this.shootTimer = 1.0 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 15,
            y: this.y,
            vx: -320 * this.bulletSpeedMult,
            vy: -40,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'FALCON_TRACKER': {
        const targetAng = Math.atan2(player.y - this.y, player.x - this.x);
        let diff = targetAng - this.aimAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);
        this.vx = Math.cos(this.aimAngle) * this.speed * this.speedMult;
        this.vy = Math.sin(this.aimAngle) * this.speed * this.speedMult;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1220) {
          this.shootTimer = 1.3 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x + Math.cos(this.aimAngle) * 18,
            y: this.y + Math.sin(this.aimAngle) * 18,
            vx: Math.cos(this.aimAngle) * 420 * this.bulletSpeedMult,
            vy: Math.sin(this.aimAngle) * 420 * this.bulletSpeedMult,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;
      }

      case 'CYBER_PHANTOM':
        if (!this.isAnchored) {
          this.x += this.vx * dt;
          if (this.stopAtX && this.x >= this.stopAtX) {
            this.isAnchored = true;
            this.vx = 0;
          }
        } else {
          this.y += Math.sin(this.tick * 0.06) * 55 * dt;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.isAnchored) {
          this.shootTimer = 1.1 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 22,
            y: this.y - 10,
            vx: -420 * this.bulletSpeedMult,
            vy: -25,
            radius: 7,
            type: 'ENEMY_SNIPER',
            isEnemy: true
          }));
          bullets.push(new Bullet({
            x: this.x - 22,
            y: this.y + 10,
            vx: -420 * this.bulletSpeedMult,
            vy: 25,
            radius: 7,
            type: 'ENEMY_SNIPER',
            isEnemy: true
          }));
          sound.playShoot('LASER');
        }
        break;

      case 'CYBER_PENDULUM':
        this.x += this.vx * dt;
        this.swingPhase += this.swingSpeed * dt * this.speedMult;
        this.y = this.baseY + Math.sin(this.swingPhase) * this.swingAmp;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1180 && this.x > player.x + 80) {
          this.shootTimer = 1.2 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          bullets.push(new Bullet({
            x: this.x - 18,
            y: this.y,
            vx: Math.cos(a) * 400 * this.bulletSpeedMult,
            vy: Math.sin(a) * 400 * this.bulletSpeedMult,
            radius: 7,
            type: 'ENEMY_SNIPER',
            isEnemy: true
          }));
          sound.playShoot('LASER');
        }
        break;

      case 'VOID_STALKER': {
        const targetAng = Math.atan2(player.y - this.y, player.x - this.x);
        let diff = targetAng - this.aimAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.aimAngle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);
        this.vx = Math.cos(this.aimAngle) * this.speed * this.speedMult;
        this.vy = Math.sin(this.aimAngle) * this.speed * this.speedMult;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1220) {
          this.shootTimer = 1.1 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x + Math.cos(this.aimAngle) * 20,
            y: this.y + Math.sin(this.aimAngle) * 20,
            vx: Math.cos(this.aimAngle) * 460 * this.bulletSpeedMult,
            vy: Math.sin(this.aimAngle) * 460 * this.bulletSpeedMult,
            radius: 6,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;
      }

      case 'METEOR_DIVER':
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.y > 60 && this.y < 660 && this.x > 100 && this.x < 1200) {
          this.shootTimer = 0.8 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x,
            y: this.y,
            vx: -180 * this.bulletSpeedMult,
            vy: 140 * this.bulletSpeedMult,
            radius: 7,
            isEnemy: true
          }));
          sound.playEnemyShoot();
        }
        break;

      case 'ABYSS_ASCENDER':
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.y > 60 && this.y < 660 && this.x > 100 && this.x < 1200) {
          this.shootTimer = 0.8 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 16,
            y: this.y,
            vx: -340 * this.bulletSpeedMult,
            vy: -70 * this.bulletSpeedMult,
            radius: 7,
            isEnemy: true
          }));
          sound.playShoot('LASER');
        }
        break;

      case 'WARP_FLANKER':
        if (!this.isAnchored) {
          this.x += this.vx * dt;
          if (this.stopAtX && this.x >= this.stopAtX) {
            this.x = this.stopAtX;
            this.isAnchored = true;
            this.vx = 0;
            this.baseY = this.y;
          }
        } else {
          this.loopPhase = (this.loopPhase || 0) + 2.2 * dt;
          this.y = this.baseY + Math.sin(this.loopPhase) * 45;
        }

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1240) {
          this.shootTimer = 1.0 * this.shootCooldownMult;
          const dir = this.isAnchored ? -1 : 1;
          bullets.push(new Bullet({
            x: this.x + dir * 22,
            y: this.y,
            vx: dir * 450 * this.bulletSpeedMult,
            vy: 0,
            radius: 6,
            type: 'ENEMY_SNIPER',
            isEnemy: true
          }));
          sound.playShoot('LASER');
        }
        break;

      case 'COSMIC_ORBITER':
        this.x += this.vx * dt;
        this.orbitAngle += this.orbitSpeed * dt * this.speedMult;
        this.y = this.baseY + Math.sin(this.orbitAngle) * this.orbitRadiusY;
        this.x += Math.cos(this.orbitAngle) * 35 * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 120 && this.x < 1180) {
          this.shootTimer = 1.4 * this.shootCooldownMult;
          for (let a = 0; a < 4; a++) {
            const ang = this.orbitAngle + (a * Math.PI) / 2;
            bullets.push(new Bullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 320 * this.bulletSpeedMult,
              vy: Math.sin(ang) * 320 * this.bulletSpeedMult,
              radius: 6,
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }
        break;

      case 'QUANTUM_WARPER': {
        // State machine: MATERIALIZING -> ACTIVE -> DEMATERIALIZING -> BLINK
        if (!this.blinkState) {
          this.blinkState = 'MATERIALIZING';
          this.blinkTimer = 0.4;
          this.blinkAlpha = 0.2;
        }

        if (this.blinkState === 'MATERIALIZING') {
          this.blinkTimer -= dt;
          this.blinkAlpha = Math.min(1.0, this.blinkAlpha + dt * 2.5);
          if (this.blinkTimer <= 0) {
            this.blinkState = 'ACTIVE';
            this.blinkTimer = 1.4;
            this.blinkAlpha = 1.0;
          }
        } else if (this.blinkState === 'ACTIVE') {
          this.x += (this.vx || -40) * dt;
          this.y += Math.sin(this.tick * 0.04) * 25 * dt;
          this.blinkTimer -= dt;

          this.shootTimer -= dt;
          if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 100 && this.x < 1220 && player) {
            this.shootTimer = 1.0 * this.shootCooldownMult;
            const targetAng = Math.atan2(player.y - this.y, player.x - this.x);
            [-0.18, 0, 0.18].forEach(off => {
              bullets.push(new Bullet({
                x: this.x - 16,
                y: this.y,
                vx: Math.cos(targetAng + off) * 440 * this.bulletSpeedMult,
                vy: Math.sin(targetAng + off) * 440 * this.bulletSpeedMult,
                radius: 6,
                type: 'ENEMY_SNIPER',
                isEnemy: true
              }));
            });
            sound.playShoot('LASER');
          }

          if (this.blinkTimer <= 0) {
            this.blinkState = 'DEMATERIALIZING';
            this.blinkTimer = 0.35;
            if (particles) {
              particles.createElectricSpark(this.x, this.y, 10, '#00e5ff', '#ffffff');
              particles.createSmokePuff(this.x, this.y, 2, 12);
            }
          }
        } else if (this.blinkState === 'DEMATERIALIZING') {
          this.blinkTimer -= dt;
          this.blinkAlpha = Math.max(0.05, this.blinkAlpha - dt * 2.8);
          if (this.blinkTimer <= 0) {
            // Quantum Blink to new tactical coordinates!
            this.x = Math.max(260, Math.min(1140, this.x + (Math.random() > 0.5 ? -180 : 150)));
            this.y = Math.max(120, Math.min(600, this.y + (Math.random() - 0.5) * 260));
            this.blinkState = 'MATERIALIZING';
            this.blinkTimer = 0.35;
            if (sound && sound.playShoot) sound.playShoot('HOMING');
            if (particles) {
              particles.createElectricSpark(this.x, this.y, 14, '#00e5ff', '#e040fb');
              particles.createSmokePuff(this.x, this.y, 2, 14);
            }
          }
        }
        break;
      }

      case 'SINGULARITY_ORB': {
        this.x += this.vx * dt;
        this.pulseAngle = (this.pulseAngle || 0) + 1.8 * dt;
        this.y = (this.baseY || this.y) + Math.sin(this.pulseAngle) * 35;

        // Gravitational micro-pull on player
        if (player && !player.dead && this.x > 80 && this.x < 1240) {
          const dx = this.x - player.x;
          const dy = this.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 35 && dist < 450) {
            const pullForce = (1 - dist / 450) * (this.gravityPull || 75) * dt;
            player.x += (dx / dist) * pullForce;
            player.y += (dy / dist) * pullForce;
            player.x = Math.max(45, Math.min(1225, player.x));
            player.y = Math.max(45, Math.min(675, player.y));
          }
        }

        // Pulse 6-way gravitational burst
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 100 && this.x < 1200) {
          this.shootTimer = 1.6 * this.shootCooldownMult;
          for (let k = 0; k < 6; k++) {
            const ang = (k * Math.PI * 2) / 6 + (this.pulseAngle || 0);
            bullets.push(new Bullet({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * 260 * this.bulletSpeedMult,
              vy: Math.sin(ang) * 260 * this.bulletSpeedMult,
              radius: 6,
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }
        break;
      }

      case 'BINARY_TETHER': {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.laserState === 'IDLE') {
          this.laserTimer -= dt;
          if (this.laserTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 60 && this.x < 1250 && player && !player.dead) {
            this.laserState = 'TELEGRAPH';
            this.laserTimer = this.laserWarmup;
            this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
            if (sound && sound.playEnemyShoot) sound.playEnemyShoot();
          }
        } else if (this.laserState === 'TELEGRAPH') {
          // Lacak posisi pemain hingga 0.20s terakhir sebelum mengunci sudut tembakan
          if (this.laserTimer > 0.20 && player && !player.dead) {
            const desiredAng = Math.atan2(player.y - this.y, player.x - this.x);
            const diff = Math.atan2(Math.sin(desiredAng - this.targetAngle), Math.cos(desiredAng - this.targetAngle));
            this.targetAngle += diff * Math.min(1.0, 10 * dt);
          }

          this.laserTimer -= dt;
          if (particles && Math.random() < 0.45) {
            particles.createElectricSpark(this.x, this.y, 4, '#ffd700', '#ff1744');
          }

          if (this.laserTimer <= 0) {
            this.laserState = 'FIRING';
            this.laserTimer = this.laserDuration;
            if (sound && sound.playShoot) sound.playShoot('LASER');
          }
        } else if (this.laserState === 'FIRING') {
          this.laserTimer -= dt;

          // Sinar laser mematikan menembus seluruh layar mengarah ke target player
          const beamLen = 1600;
          const x1 = this.x, y1 = this.y;
          const x2 = this.x + Math.cos(this.targetAngle) * beamLen;
          const y2 = this.y + Math.sin(this.targetAngle) * beamLen;

          // Deteksi tabrakan sinar laser dengan pemain
          if (player && !player.invulnerable && !player.dead) {
            const px = player.x, py = player.y;
            const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
            if (l2 > 0) {
              let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
              t = Math.max(0, Math.min(1, t));
              const projX = x1 + t * (x2 - x1);
              const projY = y1 + t * (y2 - y1);
              const dist = Math.hypot(px - projX, py - projY);
              const beamRadius = 14;
              if (dist < (player.radius || 18) + beamRadius) {
                player.hit();
                if (sound && sound.playExplosion) sound.playExplosion('small');
              }
            }
          }

          if (particles && Math.random() < 0.5) {
            const pDist = 100 + Math.random() * 700;
            particles.createElectricSpark(
              this.x + Math.cos(this.targetAngle) * pDist,
              this.y + Math.sin(this.targetAngle) * pDist,
              3, '#ffd700', '#ffffff'
            );
          }

          if (this.laserTimer <= 0) {
            this.laserState = 'IDLE';
            this.laserTimer = (2.2 + Math.random() * 0.6) * this.shootCooldownMult;
          }
        }
        break;
      }

      case 'CHRONO_LEECH': {
        this.x += (this.vx || -65) * dt;
        this.y = (this.baseY || this.y) + Math.sin(this.tick * 0.03) * 30;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 120 && this.x < 1200 && player) {
          this.shootTimer = 1.3 * this.shootCooldownMult;
          // Fires time-dilation temporal projectile (starts slow, then rapidly accelerates!)
          const aimAng = Math.atan2(player.y - this.y, player.x - this.x);
          bullets.push(new Bullet({
            x: this.x - 20,
            y: this.y,
            vx: Math.cos(aimAng) * 90 * this.bulletSpeedMult,
            vy: Math.sin(aimAng) * 90 * this.bulletSpeedMult,
            accelX: Math.cos(aimAng) * 340,
            accelY: Math.sin(aimAng) * 340,
            radius: 8,
            type: 'ENEMY_PLASMA',
            isEnemy: true
          }));
          sound.playShoot('PLASMA');
        }
        break;
      }

      case 'COSMIC_CRUISER': {
        this.x += (this.vx || (this.fromBehind ? 55 : -50)) * dt;
        this.y += Math.sin(this.tick * 0.02) * 25 * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1220 && player) {
          this.shootTimer = 1.3 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          const fDir = this.fromBehind ? 1 : -1;
          [-14, 14].forEach(yOff => {
            bullets.push(new Bullet({
              x: this.x + fDir * 25,
              y: this.y + yOff,
              vx: Math.cos(a) * 420 * this.bulletSpeedMult,
              vy: Math.sin(a) * 420 * this.bulletSpeedMult,
              radius: 7,
              isEnemy: true
            }));
          });
          sound.playEnemyShoot();
        }
        break;
      }

      case 'CHRONO_DREADNOUGHT': {
        this.x += (this.vx || (this.fromBehind ? 50 : -45)) * dt;
        this.y += Math.sin(this.tick * 0.018) * 22 * dt;
        const forwardDir = this.fromBehind ? 1 : -1;

        // 1. Serangan Unik I: Chrono Stasis Wave (Gelombang Waktu 3 Arah)
        this.chronoWaveTimer -= dt;
        if (this.chronoWaveTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 60 && this.x < 1240 && player) {
          this.chronoWaveTimer = 3.0 * this.shootCooldownMult;
          const aimAng = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.22, 0, 0.22].forEach(angOff => {
            const spreadAng = aimAng + angOff;
            bullets.push(new Bullet({
              x: this.x + forwardDir * 35,
              y: this.y,
              vx: Math.cos(spreadAng) * 90 * this.bulletSpeedMult,
              vy: Math.sin(spreadAng) * 90 * this.bulletSpeedMult,
              accelX: Math.cos(spreadAng) * 360,
              accelY: Math.sin(spreadAng) * 360,
              radius: 9,
              type: 'ENEMY_PLASMA',
              isEnemy: true
            }));
          });
          if (sound && sound.playShoot) sound.playShoot('PLASMA');
          if (particles) {
            particles.createElectricSpark(this.x + forwardDir * 30, this.y, 14, '#ffd700', '#ffea00');
          }
        }

        // 2. Serangan Unik II: Golden Shrapnel Mortar Artillery (Artileri Pecahan Emas)
        this.flakMortarTimer -= dt;
        if (this.flakMortarTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1220 && player) {
          this.flakMortarTimer = 3.8 * this.shootCooldownMult;
          const targetDist = Math.abs(player.x - this.x);
          bullets.push(new Bullet({
            x: this.x + forwardDir * 20,
            y: this.y - 18,
            vx: forwardDir * 240 * this.bulletSpeedMult,
            vy: ((player.y - this.y) / Math.max(1, targetDist)) * 200,
            radius: 11,
            type: 'ENEMY_BOMB',
            isEnemy: true
          }));
          if (sound && sound.playShoot) sound.playShoot('HOMING');
        }

        // 3. Serangan Unik III: Dual Heavy Kinetic Battery
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x > 80 && this.x < 1220 && player) {
          this.shootTimer = 1.4 * this.shootCooldownMult;
          [-16, 16].forEach(yOff => {
            bullets.push(new Bullet({
              x: this.x + forwardDir * 40,
              y: this.y + yOff,
              vx: forwardDir * 440 * this.bulletSpeedMult,
              vy: 0,
              radius: 7.5,
              type: 'ENEMY_SNIPER',
              isEnemy: true
            }));
          });
          if (sound && sound.playShoot) sound.playShoot('LASER');
        }
        break;
      }

      case 'FRUIT_CARRIER':
        this.x += this.vx * dt;
        this.y = this.baseY + Math.sin(this.tick * this.waveFreq) * this.waveAmp;
        if (this.x < -70) return false;
        break;

      case 'JUMBO_DREAD_CRUISER':
        if (this.x > this.targetHoverX) {
          this.x += this.vx * dt;
        } else {
          this.y += Math.sin(this.tick * 0.02) * 35 * dt;
        }

        // 1. Triple Gun Turret Salvo
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1220 && this.x > player.x + 80) {
          this.shootTimer = 1.4 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.22, 0, 0.22].forEach(off => {
            bullets.push(new Bullet({
              x: this.x - 50,
              y: this.y,
              vx: Math.cos(a + off) * 380 * this.bulletSpeedMult,
              vy: Math.sin(a + off) * 380 * this.bulletSpeedMult,
              radius: 8,
              isEnemy: true
            }));
          });
          sound.playEnemyShoot();
        }

        // 2. Heavy Steam Mortar
        this.mortarTimer -= dt;
        if (this.mortarTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200) {
          this.mortarTimer = 2.5 * this.shootCooldownMult;
          bullets.push(new Bullet({
            x: this.x - 20,
            y: this.y - 25,
            vx: -240 * this.bulletSpeedMult,
            vy: -140,
            gravity: 210,
            radius: 9,
            type: 'ENEMY_MORTAR',
            isEnemy: true
          }));
          sound.playShoot('FLAK');
        }

        // 3. Mini carrier deployment
        this.carrierTimer -= dt;
        if (this.carrierTimer <= 0 && this.x < 1150) {
          this.carrierTimer = 5.0;
          extraEnemies.push(new Enemy({
            type: 'SCOUT',
            x: this.x + 20,
            y: this.y - 30,
            stage: this.stage
          }));
          extraEnemies.push(new Enemy({
            type: 'SCOUT',
            x: this.x + 20,
            y: this.y + 30,
            stage: this.stage
          }));
        }
        break;

      case 'JUMBO_SAND_FORTRESS':
        if (this.x > this.targetHoverX) {
          this.x += this.vx * dt;
        } else {
          this.y += Math.sin(this.tick * 0.02) * 40 * dt;
        }

        // Twin heavy mortar shells
        this.mortarTimer -= dt;
        if (this.mortarTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1220) {
          this.mortarTimer = 2.0 * this.shootCooldownMult;
          [-24, 24].forEach(yOff => {
            bullets.push(new Bullet({
              x: this.x - 45,
              y: this.y + yOff,
              vx: -260 * this.bulletSpeedMult,
              vy: -130 + yOff * 0.5,
              gravity: 220,
              radius: 9,
              type: 'ENEMY_MORTAR',
              isEnemy: true
            }));
          });
          sound.playShoot('FLAK');
        }

        // Sandstorm 5-way spread
        this.burstTimer -= dt;
        if (this.burstTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200 && this.x > player.x + 70) {
          this.burstTimer = 1.5 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.35, -0.18, 0, 0.18, 0.35].forEach(off => {
            bullets.push(new Bullet({
              x: this.x - 40,
              y: this.y,
              vx: Math.cos(a + off) * 400 * this.bulletSpeedMult,
              vy: Math.sin(a + off) * 400 * this.bulletSpeedMult,
              radius: 7,
              isEnemy: true
            }));
          });
          sound.playEnemyShoot();
        }
        break;

      case 'JUMBO_CYBER_GARGANTUA':
        if (this.x > this.targetHoverX) {
          this.x += this.vx * dt;
        } else {
          this.y += Math.sin(this.tick * 0.025) * 45 * dt;
        }

        // Twin railguns
        this.railgunTimer -= dt;
        if (this.railgunTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1220 && this.x > player.x + 60) {
          this.railgunTimer = 2.0 * this.shootCooldownMult;
          [-22, 22].forEach(yOff => {
            const a = Math.atan2(player.y - (this.y + yOff), player.x - (this.x - 55));
            bullets.push(new Bullet({
              x: this.x - 55,
              y: this.y + yOff,
              vx: Math.cos(a) * 620 * this.bulletSpeedMult,
              vy: Math.sin(a) * 620 * this.bulletSpeedMult,
              radius: 7,
              type: 'ENEMY_SNIPER',
              isEnemy: true
            }));
          });
          sound.playShoot('LASER');
        }

        // EMP Nova ring
        this.novaTimer -= dt;
        if (this.novaTimer <= 0 && this.spawnGraceTimer <= 0 && this.x < 1200) {
          this.novaTimer = 2.8 * this.shootCooldownMult;
          const count = 10;
          for (let k = 0; k < count; k++) {
            const ang = (k * Math.PI * 2) / count + this.tick * 0.05;
            bullets.push(new Bullet({
              x: this.x - 10,
              y: this.y,
              vx: Math.cos(ang) * 340 * this.bulletSpeedMult,
              vy: Math.sin(ang) * 340 * this.bulletSpeedMult,
              radius: 7,
              isEnemy: true
            }));
          }
          sound.playEnemyShoot();
        }
        break;

      case 'JUMBO_SINGULARITY_TITAN': {
        if (!this.hoverPhase) {
          const reachedTarget = this.fromBehind ? (this.x >= this.targetHoverX) : (this.x <= this.targetHoverX);
          this.hoverPhase = reachedTarget ? 'HOVER_STATIC' : 'ENTER';
          this.hoverTimer = 12.0;
        }

        if (this.hoverPhase === 'ENTER') {
          this.x += (this.vx || (this.fromBehind ? 75 : -60)) * dt * this.speedMult;
          const reached = this.fromBehind ? (this.x >= this.targetHoverX) : (this.x <= this.targetHoverX);
          if (reached) {
            this.x = this.targetHoverX;
            this.hoverPhase = 'HOVER_STATIC';
            this.hoverTimer = 12.0;
          }
        } else if (this.hoverPhase === 'HOVER_STATIC') {
          // Mengayun dan statis di sisi layar (~12 detik)
          this.y += Math.sin(this.tick * 0.03) * 55 * dt * this.speedMult;
          this.hoverTimer -= dt;
          if (this.hoverTimer <= 0) {
            this.hoverPhase = this.fromBehind ? 'ADVANCE_RIGHT' : 'ADVANCE_LEFT';
            if (particles && typeof particles.createFloatingText === 'function') {
              particles.createFloatingText(this.x, this.y - 70, this.fromBehind ? '⚠️ TITAN MENYERBU KE KANAN!' : '⚠️ TITAN MENYERBU KE DEPAN!', '#e040fb');
            }
          }
        } else if (this.hoverPhase === 'ADVANCE_LEFT') {
          this.x -= 75 * dt * this.speedMult;
          this.y += Math.sin(this.tick * 0.03) * 50 * dt * this.speedMult;
        } else if (this.hoverPhase === 'ADVANCE_RIGHT') {
          this.x += 75 * dt * this.speedMult;
          this.y += Math.sin(this.tick * 0.03) * 50 * dt * this.speedMult;
        }

        const shootDir = this.fromBehind ? 1 : -1;
        const canShoot = this.fromBehind ? (this.x > 50) : (this.x < 1220);

        // 1. Gravity Vortex Homing Missiles
        this.vortexTimer -= dt;
        if (this.vortexTimer <= 0 && this.spawnGraceTimer <= 0 && canShoot) {
          this.vortexTimer = 2.6 * this.shootCooldownMult;
          [-24, 24].forEach(yOff => {
            bullets.push(new Bullet({
              x: this.x + shootDir * 35,
              y: this.y + yOff,
              vx: shootDir * 240,
              vy: yOff * 3.5,
              radius: 9,
              type: 'ENEMY_HOMING',
              life: 5.0,
              isEnemy: true
            }));
          });
          sound.playShoot('HOMING');
        }

        // 2. Star Nova 12-Way Burst
        this.starNovaTimer -= dt;
        if (this.starNovaTimer <= 0 && this.spawnGraceTimer <= 0 && (this.fromBehind ? this.x > 80 : this.x < 1200)) {
          this.starNovaTimer = 2.0 * this.shootCooldownMult;
          const count = 12;
          for (let k = 0; k < count; k++) {
            const ang = (k * Math.PI * 2) / count + this.tick * 0.08;
            bullets.push(new Bullet({
              x: this.x + shootDir * 15,
              y: this.y,
              vx: Math.cos(ang) * 360 * this.bulletSpeedMult,
              vy: Math.sin(ang) * 360 * this.bulletSpeedMult,
              radius: 7,
              isEnemy: true
            }));
          }
          sound.playShoot('SPREAD');
        }

        // 3. Heavy frontal railgun spires
        this.homingPodTimer -= dt;
        const inFiringZone = player && (this.fromBehind ? (this.x < player.x - 40) : (this.x > player.x + 80));
        if (this.homingPodTimer <= 0 && this.spawnGraceTimer <= 0 && canShoot && inFiringZone) {
          this.homingPodTimer = 2.4 * this.shootCooldownMult;
          const a = Math.atan2(player.y - this.y, player.x - this.x);
          [-0.15, 0.15].forEach(off => {
            bullets.push(new Bullet({
              x: this.x + shootDir * 60,
              y: this.y,
              vx: Math.cos(a + off) * 600 * this.bulletSpeedMult,
              vy: Math.sin(a + off) * 600 * this.bulletSpeedMult,
              radius: 7,
              type: 'ENEMY_SNIPER',
              isEnemy: true
            }));
          });
          sound.playShoot('LASER');
        }
        break;
      }
    }

    // Dynamic 3D Flight Kinematics & Aerodynamic Banking
    const dX = this.x - prevX;
    const dY = this.y - prevY;
    const targetRoll = Math.max(-0.65, Math.min(0.65, (dY / Math.max(0.001, dt * 260)) * 0.55));
    this.roll = (this.roll || 0) + (targetRoll - (this.roll || 0)) * Math.min(1.0, 10 * dt);
    this.pitch = Math.max(-0.25, Math.min(0.25, (dX / Math.max(0.001, dt * 320)) * 0.15));

    // Mini-boss safeguard: Mini-bosses must stay on screen and NEVER despawn off-screen while alive!
    if (this.isMiniBoss && this.hp > 0) {
      if (this.fromBehind) {
        if (this.x < 120 && this.hoverPhase !== 'ENTER') {
          this.x = 120;
          if (this.vx < 0) this.vx = 0;
        }
      } else {
        if (this.x < 720 && this.hoverPhase !== 'ADVANCE_LEFT') {
          this.x = 720;
          if (this.vx < 0) this.vx = 0;
        }
      }
      return true;
    }

    return this.x > -180 && this.x < 1460 && this.y > -140 && this.y < 860;
  }

  applyPlasmaSlow(duration = 1.5) {
    this.slowTimer = Math.max(this.slowTimer || 0, duration);
  }

  takeDamage(amount, bulletX = 0, piercing = false, bulletType = 'NORMAL') {
    if (this.invulnerableTimer > 0) {
      return false; // Kebal sementara saat baru muncul
    }

    if (bulletType === 'PLASMA' || bulletType === 'PLASMA_ZAP') {
      this.applyPlasmaSlow(bulletType === 'PLASMA' ? 1.5 : 1.2);
    }

    // Shield Cruiser, Juggernaut, Cosmic Cruiser, Chrono Dreadnought, & Jumbo Shield mechanics
    const isShieldBearer = (this.type === 'SHIELD_CRUISER' || this.type === 'JUGGERNAUT' || this.type === 'COSMIC_CRUISER' || this.type === 'CHRONO_DREADNOUGHT' || this.type === 'JUMBO_CYBER_GARGANTUA' || this.type === 'JUMBO_SINGULARITY_TITAN');
    const isFrontShieldHit = this.fromBehind ? (bulletX < this.x + 25) : (bulletX > this.x - 25);
    if (isShieldBearer && this.shieldHp > 0 && isFrontShieldHit) {
      if (bulletType === 'FLAK') {
        // Tier A+ Flak Demolition: instantly shatters heavy energy shield in 1 blast!
        this.shieldHp = 0;
        this.hp -= amount;
      } else if (bulletType === 'LASER') {
        // Tier A+ Thermal Laser: 3.0x bonus shield melting damage!
        this.shieldHp -= amount * 3.0;
        if (this.shieldHp < 0) {
          this.hp += this.shieldHp * 0.5;
          this.shieldHp = 0;
        }
      } else if (!piercing) {
        this.shieldHp -= amount;
        if (this.shieldHp < 0) {
          this.hp += this.shieldHp;
          this.shieldHp = 0;
        }
      } else {
        // Piercing Plasma bypasses shield
        this.hp -= amount;
      }
    } else {
      this.hp -= amount;
    }

    if (amount > 0) {
      this.hpBarTimer = 1.6;
    }

    if (this.hp <= 0) {
      this.dead = true;
      return true; // killed
    }
    return false;
  }

  drawShadow(ctx) {
    if (!this.dead && this.x > -160 && this.x < 1440 && this.y > -120 && this.y < 840) {
      const rx = this.radius * 0.95;
      const ry = this.radius * 0.45;
      Clay3D.draw3DGroundShadow(ctx, this.x, this.y, this.altitude || 0.9, rx, ry);
    }
  }

  /** 2D attack telegraphs that stay readable on top of the 3D models' underlay */
  drawTelegraphs(ctx) {
    if (this.type === 'STINGER' && this.charging) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 179, 0, 0.40)';
      ctx.beginPath();
      ctx.ellipse(this.x + 18, this.y, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'SNIPER' && this.isAiming) {
      ctx.save();
      const aimRatio = Math.min(1.0, this.aimTimer / this.maxAimTime);
      const startX = this.x - 30;
      const startY = this.y;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(this.aimAngle) * 1200, startY + Math.sin(this.aimAngle) * 1200);
      if (aimRatio < 0.6) {
        ctx.strokeStyle = `rgba(255, 235, 59, ${0.30 + aimRatio * 0.40})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
      } else {
        ctx.strokeStyle = `rgba(255, 23, 68, ${0.75 + (aimRatio - 0.6) * 0.60})`;
        ctx.lineWidth = 2.5 + (aimRatio - 0.6) * 3.5;
        ctx.setLineDash([12, 4]);
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  draw(ctx) {
    if (ClayRenderer.use3D) {
      this.drawTelegraphs(ctx);
      return;
    }
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const r = this.roll || 0;
    const p = this.pitch || 0;

    switch (this.type) {
      case 'FRUIT_CARRIER':
        ClayRenderer.drawFruitCarrier(ctx, this.x, this.y, this.tick, this.color, this.shadowColor, r, p);
        break;
      case 'SCOUT':
        ClayRenderer.drawScout(ctx, this.x, this.y, this.tick, r, p);
        break;
      case 'DRONE':
        ClayRenderer.drawDrone(ctx, this.x, this.y, this.tick, r, p);
        break;
      case 'GUNSHIP':
        ClayRenderer.drawGunship(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'BLIMP':
        ClayRenderer.drawBlimp(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'STINGER':
        if (this.charging) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 179, 0, 0.40)';
          ctx.beginPath();
          ctx.ellipse(this.x + 18, this.y, 18, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ClayRenderer.drawStinger(ctx, this.x, this.y, this.tick, r, p);
        break;
      case 'SNIPER':
        // Draw 3-stage telegraph targeting laser line when aiming
        if (this.isAiming) {
          ctx.save();
          const aimRatio = Math.min(1.0, this.aimTimer / this.maxAimTime);
          const startX = this.x - 30;
          const startY = this.y;
          const endX = startX + Math.cos(this.aimAngle) * 1200;
          const endY = startY + Math.sin(this.aimAngle) * 1200;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);

          if (aimRatio < 0.6) {
            // Stage 1: Yellow tracking line
            ctx.strokeStyle = `rgba(255, 235, 59, ${0.30 + aimRatio * 0.40})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
          } else {
            // Stage 2: Locked Red warning line with outer glow
            ctx.strokeStyle = `rgba(255, 23, 68, ${0.75 + (aimRatio - 0.6) * 0.60})`;
            ctx.lineWidth = 2.5 + (aimRatio - 0.6) * 3.5;
            ctx.setLineDash([12, 4]);
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 8;
          }
          ctx.stroke();
          ctx.restore();
        }
        ClayRenderer.drawSniper(ctx, this.x, this.y, this.isAiming, this.aimTimer / this.maxAimTime, this.tick, r, p);
        break;
      case 'BOMBER':
        ClayRenderer.drawBomber(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'SPINNER':
        ClayRenderer.drawSpinner(ctx, this.x, this.y, this.tick, r, p);
        break;
      case 'SHIELD_CRUISER': {
        const shieldRatio = Math.max(0, this.shieldHp / this.maxShieldHp);
        ClayRenderer.drawShieldCruiser(ctx, this.x, this.y, shieldRatio, hpRatio, this.tick, r, p);
        break;
      }
      case 'MINE_LAYER':
        ClayRenderer.drawMineLayer(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'MINE':
        ClayRenderer.drawMine(ctx, this.x, this.y, this.tick, r, p);
        break;
      case 'ACE': {
        const tilt = Math.cos(this.loopPhase);
        ClayRenderer.drawAce(ctx, this.x, this.y, tilt, hpRatio, this.tick, r, p);
        break;
      }
      case 'INTERCEPTOR': {
        const isAiming = this.phaseState === 'BRAKE_SHOOT' && !this.hasShot;
        ClayRenderer.drawInterceptor(ctx, this.x, this.y, hpRatio, this.tick, isAiming, this.aimAngle || Math.PI, r, p);
        break;
      }
      case 'JUGGERNAUT': {
        const jShield = Math.max(0, this.shieldHp / this.maxShieldHp);
        ClayRenderer.drawJuggernaut(ctx, this.x, this.y, jShield, hpRatio, this.tick, r, p);
        break;
      }
      case 'VORTEX_DRONE':
        ClayRenderer.drawVortexDrone(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'RETRO_BIPLANE': {
        const facingLeft = (this.fromBehind && this.isAnchored) || !this.fromBehind;
        ClayRenderer.drawRetroBiplane(ctx, this.x, this.y, this.tick, hpRatio, this.isAnchored, facingLeft, r, p);
        break;
      }
      case 'SWING_GLIDER':
        ClayRenderer.drawSwingGlider(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'CANYON_DIVER':
        ClayRenderer.drawCanyonDiver(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'GEYSER_RUSHER':
        ClayRenderer.drawGeyserRusher(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'FALCON_TRACKER':
        ClayRenderer.drawFalconTracker(ctx, this.x, this.y, this.aimAngle || Math.PI, this.tick, hpRatio, r, p);
        break;
      case 'CYBER_PHANTOM':
        ClayRenderer.drawCyberPhantom(ctx, this.x, this.y, this.tick, hpRatio, this.isAnchored, r, p);
        break;
      case 'CYBER_PENDULUM':
        ClayRenderer.drawCyberPendulum(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'VOID_STALKER':
        ClayRenderer.drawVoidStalker(ctx, this.x, this.y, this.aimAngle || Math.PI, this.tick, hpRatio, r, p);
        break;
      case 'METEOR_DIVER':
        ClayRenderer.drawMeteorDiver(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'ABYSS_ASCENDER':
        ClayRenderer.drawAbyssAscender(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'WARP_FLANKER':
        ClayRenderer.drawWarpFlanker(ctx, this.x, this.y, this.tick, hpRatio, this.isAnchored, r, p);
        break;
      case 'COSMIC_ORBITER':
        ClayRenderer.drawCosmicOrbiter(ctx, this.x, this.y, this.tick, hpRatio, r, p);
        break;
      case 'QUANTUM_WARPER':
        ClayRenderer.drawQuantumWarper(ctx, this.x, this.y, this.tick, hpRatio, this.blinkAlpha, r, p);
        break;
      case 'SINGULARITY_ORB':
        ClayRenderer.drawSingularityOrb(ctx, this.x, this.y, this.tick, hpRatio);
        break;
      case 'BINARY_TETHER':
        ClayRenderer.drawBinaryTether(ctx, this.x, this.y, this.partner ? this.partner.x : null, this.partner ? this.partner.y : null, this.tick, this.laserActive);
        break;
      case 'CHRONO_LEECH':
        ClayRenderer.drawChronoLeech(ctx, this.x, this.y, this.tick, hpRatio);
        break;
      case 'COSMIC_CRUISER': {
        const cShield = this.maxShieldHp ? Math.max(0, this.shieldHp / this.maxShieldHp) : 0;
        ClayRenderer.drawCosmicCruiser(ctx, this.x, this.y, cShield, hpRatio, this.tick);
        break;
      }
      case 'JUMBO_DREAD_CRUISER':
        ClayRenderer.drawJumboDreadCruiser(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'JUMBO_SAND_FORTRESS':
        ClayRenderer.drawJumboSandFortress(ctx, this.x, this.y, hpRatio, this.tick, r, p);
        break;
      case 'JUMBO_CYBER_GARGANTUA': {
        const jShield = this.maxShieldHp ? Math.max(0, this.shieldHp / this.maxShieldHp) : 0;
        ClayRenderer.drawJumboCyberGargantua(ctx, this.x, this.y, jShield, hpRatio, this.tick, r, p);
        break;
      }
      case 'JUMBO_SINGULARITY_TITAN': {
        const jShield = this.maxShieldHp ? Math.max(0, this.shieldHp / this.maxShieldHp) : 0;
        ClayRenderer.drawJumboSingularityTitan(ctx, this.x, this.y, jShield, hpRatio, this.tick, this.fromBehind);
        break;
      }
    }
  }

  /** HP bar / invulnerability badge for enemies (rendered above 3D layer at step 6.5) */
  drawOverlay(ctx, player = null) {
    if (this.dead) return;

    // 0. Binary Tether: Independent Targeted Laser with Telegraph Warning
    if (this.type === 'BINARY_TETHER') {
      const x1 = this.x, y1 = this.y;
      const x2 = this.x + Math.cos(this.targetAngle) * 1600;
      const y2 = this.y + Math.sin(this.targetAngle) * 1600;

      // Fase 1: Peringatan di awal (Telegraph Warning Laser)
      if (this.laserState === 'TELEGRAPH') {
        ctx.save();
        const progress = 1 - (this.laserTimer / (this.laserWarmup || 0.85));
        const flashAlpha = 0.45 + Math.sin(this.tick * 0.4) * 0.35 + progress * 0.2;
        
        // Garis laser penanda bidikan merah-emas putus-putus
        ctx.strokeStyle = `rgba(255, 23, 68, ${flashAlpha})`;
        ctx.lineWidth = 1.8 + progress * 1.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.tick * 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Lingkaran reticle bidikan di sekitar jarak pemain
        ctx.setLineDash([]);
        const targetDist = player ? Math.hypot(player.x - this.x, player.y - this.y) : 400;
        const tx = this.x + Math.cos(this.targetAngle) * targetDist;
        const ty = this.y + Math.sin(this.targetAngle) * targetDist;
        const reticleR = 12 + (1 - progress) * 16;
        ctx.strokeStyle = `rgba(255, 215, 0, ${flashAlpha + 0.2})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(tx, ty, reticleR, 0, Math.PI * 2);
        ctx.stroke();

        // Apex charging crystal glow
        ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + progress * 0.4})`;
        ctx.beginPath();
        ctx.arc(x1, y1, 8 + progress * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (this.laserState === 'FIRING') {
        ctx.save();
        // Fase 2: Tembakan Sinar Laser Penuh Mematikan (Full Searing Lethal Beam)
        // A. Aura panas luar emas berkilau
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.85 + Math.sin(this.tick * 0.5) * 0.15})`;
        ctx.lineWidth = 14 + Math.sin(this.tick * 0.6) * 3;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // B. Inti putih menyala
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // C. Kilatan loncatan petir bertegangan tinggi di sepanjang laser
        const segs = 8;
        ctx.strokeStyle = 'rgba(255, 245, 157, 0.9)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let s = 1; s < segs; s++) {
          const t = s / segs;
          const jx = (Math.random() - 0.5) * 16;
          const jy = (Math.random() - 0.5) * 16;
          ctx.lineTo(x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + jy);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Muzzle flare
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x1, y1, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Ambient aura kristal pylon emas
      ctx.save();
      const tetherR = this.radius + 6 + Math.sin(this.tick * 0.25) * 3;
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.45 + Math.sin(this.tick * 0.3) * 0.25})`;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, tetherR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.type === 'SINGULARITY_ORB') {
      ctx.save();
      const pullR = this.radius + 16 + Math.sin(this.tick * 0.15) * 8;
      ctx.strokeStyle = `rgba(224, 64, 251, ${0.45 + Math.sin(this.tick * 0.2) * 0.25})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pullR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.type === 'CHRONO_DREADNOUGHT') {
      ctx.save();
      const dreadR = this.radius + 10 + Math.sin(this.tick * 0.12) * 5;
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.35 + Math.sin(this.tick * 0.18) * 0.2})`;
      ctx.lineWidth = 2.8;
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, dreadR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 1. Invulnerability Energy Shield & Badge (Always render if active)
    if (this.invulnerableTimer > 0) {
      ctx.save();
      const pulseR = this.radius + 12 + Math.sin(this.tick * 0.35) * 4;
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(this.tick * 0.4) * 0.35})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, pulseR - 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 6;
      ctx.fillText(`🛡️ KEBAL ${this.invulnerableTimer.toFixed(1)}s`, this.x, this.y - this.radius - 18);
      ctx.restore();
    }

    // 2. Health Bar Display Logic
    const mode = Enemy.hpDisplayMode || 'DYNAMIC';
    const isJumboOrMini = Boolean(this.isJumbo || this.isMiniBoss);
    const isArmored = this.maxHp > 4;

    // In 'MINIMAL' mode: only Jumbo/Mini-boss gets health bars; regular armored enemies don't
    if (mode === 'MINIMAL' && !isJumboOrMini) return;

    // If maxHp <= 4 (kroco: Scout, Drone, Stinger, etc.), never show health bar to prevent screen clutter
    if (!isArmored && !isJumboOrMini) return;

    // In 'DYNAMIC' mode: armored enemies only show bar when hpBarTimer > 0
    if (!isJumboOrMini && mode === 'DYNAMIC' && this.hpBarTimer <= 0) return;

    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const lagRatio = Math.max(0, Math.min(1, (this.lagHp !== undefined ? this.lagHp : this.hp) / this.maxHp));

    // Calculate alpha (fade-out in dynamic mode)
    let alpha = 1.0;
    if (!isJumboOrMini && mode === 'DYNAMIC' && this.hpBarTimer < 0.35) {
      alpha = Math.max(0, this.hpBarTimer / 0.35);
    }
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (isJumboOrMini) {
      // -------------------------------------------------------------------------
      // Jumbo & Mini-Boss Bar (UHD Clay Container)
      // -------------------------------------------------------------------------
      const barW = Math.max(50, this.radius * 1.5);
      const barH = 7;
      const barX = this.x - barW / 2;
      const barY = this.y - this.radius - 14;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

      // Background trough
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(barX, barY, barW, barH);

      // White/Yellow Damage Lag Bar (Chunk loss animation)
      if (lagRatio > hpRatio) {
        ctx.fillStyle = '#fff59d';
        ctx.fillRect(barX, barY, barW * lagRatio, barH);
      }

      // HP Bar Fill (Smooth Green -> Orange -> Red)
      ctx.fillStyle = hpRatio > 0.5 ? '#66bb6a' : (hpRatio > 0.25 ? '#ffa726' : '#ef5350');
      ctx.fillRect(barX, barY, barW * hpRatio, barH);

      // Shield Bar layer if applicable
      if (this.maxShieldHp && this.shieldHp > 0) {
        const sRatio = Math.max(0, Math.min(1, this.shieldHp / this.maxShieldHp));
        ctx.fillStyle = 'rgba(0, 229, 255, 0.95)';
        ctx.fillRect(barX, barY - 4, barW * sRatio, 3);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY - 4, barW, 3);
      }

      // Border frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    } else {
      // -------------------------------------------------------------------------
      // Medium / Heavy Armored Enemy Micro-Bar (Ultra-clean & sleek)
      // -------------------------------------------------------------------------
      const barW = Math.max(26, Math.min(56, this.radius * 1.35));
      const barH = 3.5;
      const barX = this.x - barW / 2;
      const barY = this.y - this.radius - 8;

      // Soft drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(barX - 1, barY - 0.5, barW + 2, barH + 1.5);

      // Dark clay background trough
      ctx.fillStyle = 'rgba(20, 26, 31, 0.88)';
      ctx.fillRect(barX, barY, barW, barH);

      // Damage lag ghost bar (cream/yellow)
      if (lagRatio > hpRatio) {
        ctx.fillStyle = '#fff9c4';
        ctx.fillRect(barX, barY, barW * lagRatio, barH);
      }

      // Main HP fill (Green -> Amber -> Crimson)
      ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : (hpRatio > 0.25 ? '#ff9800' : '#f44336');
      ctx.fillRect(barX, barY, barW * hpRatio, barH);

      // Energy Shield sub-bar if present
      if (this.maxShieldHp && this.shieldHp > 0) {
        const sRatio = Math.max(0, Math.min(1, this.shieldHp / this.maxShieldHp));
        ctx.fillStyle = 'rgba(0, 229, 255, 0.95)';
        ctx.fillRect(barX, barY - 3, barW * sRatio, 2);
      }

      // Subtle border outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      type: this.type,
      formationId: this.formationId,
      isLastInFormation: Boolean(this.isLastInFormation),
      hpBarTimer: this.hpBarTimer || 0,
      lagHp: this.lagHp || this.hp,
      stage: this.stage,
      world: this.world,
      bulletSpeedMult: this.bulletSpeedMult,
      shootCooldownMult: this.shootCooldownMult,
      tick: this.tick,
      dead: Boolean(this.dead),
      slowTimer: this.slowTimer,
      spawnGraceTimer: this.spawnGraceTimer,
      invulnerableTimer: this.invulnerableTimer,
      maxInvulnerableTimer: this.maxInvulnerableTimer,
      isMiniBoss: Boolean(this.isMiniBoss),
      maxHp: this.maxHp,
      hp: this.hp,
      maxShieldHp: this.maxShieldHp,
      shieldHp: this.shieldHp,
      radius: this.radius,
      vx: this.vx,
      vy: this.vy,
      baseVy: this.baseVy,
      baseY: this.baseY,
      scoreValue: this.scoreValue,
      shootTimer: this.shootTimer,
      targetHoverX: this.targetHoverX,
      charging: Boolean(this.charging),
      hasCharged: Boolean(this.hasCharged),
      targetX: this.targetX,
      aimTimer: this.aimTimer,
      maxAimTime: this.maxAimTime,
      isAiming: Boolean(this.isAiming),
      aimAngle: this.aimAngle,
      shootCooldown: this.shootCooldown,
      bombTimer: this.bombTimer,
      sparkTimer: this.sparkTimer,
      mineTimer: this.mineTimer,
      loopPhase: this.loopPhase,
      phaseState: this.phaseState,
      stateTimer: this.stateTimer,
      hasShot: Boolean(this.hasShot),
      mortarTimer: this.mortarTimer,
      burstTimer: this.burstTimer,
      orbitPhase: this.orbitPhase,
      vortexTimer: this.vortexTimer,
      waveFreq: this.waveFreq,
      waveAmp: this.waveAmp,
      isJumbo: Boolean(this.isJumbo),
      fromBehind: Boolean(this.fromBehind),
      stopAtX: this.stopAtX,
      isAnchored: Boolean(this.isAnchored),
      swingPhase: this.swingPhase,
      orbitAngle: this.orbitAngle,
      hoverPhase: this.hoverPhase,
      hoverTimer: this.hoverTimer
    };
  }

  static deserialize(data, difficultyConfig = null) {
    if (!data) return null;
    try {
      const enemy = new Enemy({
        x: data.x,
        y: data.y,
        type: data.type,
        formationId: data.formationId,
        isLastInFormation: data.isLastInFormation,
        stage: data.stage,
        difficultyConfig: difficultyConfig || Enemy.difficultyConfig
      });
      for (const key of Object.keys(data)) {
        if (data[key] !== undefined) {
          enemy[key] = data[key];
        }
      }
      return enemy;
    } catch (e) {
      console.warn('Failed to deserialize enemy:', e, data);
      return null;
    }
  }
}

