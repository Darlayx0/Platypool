// Main Game Engine, 15-Stage Director, Multi-Boss System & Collision Engine
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Bullet } from '../entities/Bullet.js';
import { PowerUpCapsule, FruitDrop, SpeedBoostDrop, deserializeCollectible, getRandomFruitType, FRUIT_CONFIGS, getWorldMultiplier } from '../entities/PowerUp.js';
import { ParticleSystem } from '../entities/Particle.js';
import { ParallaxBackground } from '../graphics/ParallaxBg.js';
import { Camera } from './Camera.js';
import { HUD } from '../ui/HUD.js';
import { SoundController } from './Sound.js';
import { Scene3D } from '../graphics/three/Scene3D.js';
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { formatInt, warmNumberFormat } from './NumberFormat.js';

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY'
};

export const DIFFICULTY = {
  BEGINNER: 'BEGINNER',
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD',
  EXTREME: 'EXTREME'
};

export const DIFFICULTY_CONFIGS = {
  BEGINNER: {
    id: 'BEGINNER',
    name: 'BEGINNER',
    label: 'PEMULA',
    badgeColor: '#00acc1',
    textColor: '#80deea',
    scoreMultiplier: 0.25,
    scoreIntervalForLife: 10000,
    hpMult: 0.75,
    shootCooldownMult: 1.20,
    bulletSpeedMult: 0.80,
    maxLives: Infinity,
    startingLives: 5,
    weaponDuration: 25.0,
    keepWeaponOnDeath: true,
    bossGrantsLife: true,
    bossLifeAmount: 2,
    weaponDropInterval: { min: 8.0, max: 20.0 },
    invulnerableDuration: 4.0,
    waveInterval: 14.0,
    speedBoostDurationPerDrop: 25.0,
    speedBoostMaxDuration: 25.0,
    speedBoostVx: 1575,
    speedBoostDropChance: 0.014,
    speedBoostHeavyDropChance: 0.060,
    description: 'Pemula: Skor 0.25x, +1 Nyawa tiap 10k Skor & 2 Nyawa/Boss, HP Musuh 0.75x, Peluru Lambat'
  },
  EASY: {
    id: 'EASY',
    name: 'EASY',
    label: 'MUDAH',
    badgeColor: '#43a047',
    textColor: '#a5d6a7',
    scoreMultiplier: 0.5,
    scoreIntervalForLife: 50000,
    hpMult: 1.0,
    shootCooldownMult: 1.00,
    bulletSpeedMult: 0.90,
    maxLives: Infinity,
    startingLives: 3,
    weaponDuration: 20.0,
    keepWeaponOnDeath: true,
    bossGrantsLife: true,
    bossLifeAmount: 1,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    invulnerableDuration: 3.0,
    waveInterval: 12.0,
    speedBoostDurationPerDrop: 20.0,
    speedBoostMaxDuration: 20.0,
    speedBoostVx: 1575,
    speedBoostDropChance: 0.010,
    speedBoostHeavyDropChance: 0.045,
    description: 'Santai: Skor 0.5x, +1 Nyawa tiap 50k Skor & Boss, Peluru Halus, Senjata 20s Tak Hancur Saat Mati'
  },
  NORMAL: {
    id: 'NORMAL',
    name: 'NORMAL',
    label: 'NORMAL',
    badgeColor: '#f57c00',
    textColor: '#ffe082',
    scoreMultiplier: 1.0,
    scoreIntervalForLife: 200000,
    hpMult: 1.0,
    shootCooldownMult: 1.0,
    bulletSpeedMult: 1.0,
    maxLives: Infinity,
    startingLives: 3,
    weaponDuration: 15.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: true,
    bossLifeAmount: 1,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    invulnerableDuration: 2.5,
    waveInterval: 10.0,
    speedBoostDurationPerDrop: 15.0,
    speedBoostMaxDuration: 15.0,
    speedBoostVx: 1575,
    speedBoostDropChance: 0.007,
    speedBoostHeavyDropChance: 0.030,
    description: 'Klasik Arcade: Skor 1x, +1 Nyawa tiap 200k Skor & Boss, Senjata 15s (Hancur Saat Mati)'
  },
  HARD: {
    id: 'HARD',
    name: 'HARD',
    label: 'SULIT',
    badgeColor: '#e53935',
    textColor: '#ffab91',
    scoreMultiplier: 2.0,
    scoreIntervalForLife: 1000000,
    hpMult: 1.0,
    shootCooldownMult: 0.85,
    bulletSpeedMult: 1.15,
    maxLives: Infinity,
    startingLives: 3,
    weaponDuration: 10.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: false,
    bossLifeAmount: 0,
    weaponDropInterval: { min: 20.0, max: 40.0 },
    invulnerableDuration: 2.0,
    waveInterval: 8.0,
    speedBoostDurationPerDrop: 10.0,
    speedBoostMaxDuration: 10.0,
    speedBoostVx: 1575,
    speedBoostDropChance: 0.004,
    speedBoostHeavyDropChance: 0.020,
    description: 'Tantangan Hardcore: Skor 2x, +1 Nyawa tiap 1 Juta Skor, Peluru Cepat & Rapat, Boss Tanpa Nyawa'
  },
  EXTREME: {
    id: 'EXTREME',
    name: 'EXTREME',
    label: 'EKSTREM',
    badgeColor: '#ab47bc',
    textColor: '#f3e5f5',
    scoreMultiplier: 5.0,
    scoreIntervalForLife: 5000000,
    hpMult: 1.5,
    shootCooldownMult: 0.75,
    bulletSpeedMult: 1.30,
    maxLives: Infinity,
    startingLives: 3,
    weaponDuration: 8.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: false,
    bossLifeAmount: 0,
    weaponDropInterval: { min: 30.0, max: 60.0 },
    invulnerableDuration: 1.5,
    revengeBullets: true,
    bossRageThreshold: 0.50,
    rageThreshold: 0.50,
    waveInterval: 6.5,
    speedBoostDurationPerDrop: 7.0,
    speedBoostMaxDuration: 7.0,
    speedBoostVx: 1650,
    speedBoostDropChance: 0.002,
    speedBoostHeavyDropChance: 0.010,
    description: 'Neraka Tanah Liat: Skor 5x, HP Musuh 1.5x, +1 Nyawa tiap 5 Juta Skor, Peluru Brutal & Revenge Shots!'
  }
};

// 20-Stage Campaign Configuration (4 Worlds, 5 Stages per World)
export const STAGE_CONFIGS = [
  // --- WORLD 1: CLAY VALLEY (Stages 1 - 5) ---
  {
    stage: 1,
    title: 'LEMBAH TANAH LIAT',
    subtitle: 'MISI 1: SAPU PENYELIDIK MUSUH',
    biome: 'VALLEY',
    waves: [
      // Wave 1: Pure Scout formation (1 type)
      (game, fid) => {
        game.spawnScoutFormation(5, 260, fid);
      },
      // Wave 2: Dual Scout formations top & bottom (1 type)
      (game, fid) => {
        game.spawnScoutFormation(5, 180, fid);
        game.scheduleSpawn(1.2, () => game.spawnScoutFormation(5, 480, fid + '_b'));
      },
      // Wave 3: Scout formation center + Green Drones (2 types)
      (game, fid) => {
        game.spawnScoutFormation(6, 340, fid);
        game.scheduleEnemy(1.0, { type: 'DRONE', x: 1320, y: 200 });
        game.scheduleEnemy(2.0, { type: 'DRONE', x: 1320, y: 480 });
      }
    ]
  },
  {
    stage: 2,
    title: 'SERANGAN KUMBANG & SAYAP GANDA',
    subtitle: 'MISI 2: PATROLI GLIDER & SERANGAN PENYUSUP',
    biome: 'VALLEY',
    waves: [
      // Wave 1: Drone staggered patrol (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 360 }));
        game.scheduleEnemy(1.2, { type: 'DRONE', x: 1320, y: 520 });
      },
      // Wave 2: Scout formation + Swing Gliders (2 types)
      (game, fid) => {
        game.spawnScoutFormation(5, 240, fid);
        game.scheduleEnemy(0.8, { type: 'SWING_GLIDER', x: 1320, y: 180 });
        game.scheduleEnemy(1.6, { type: 'SWING_GLIDER', x: 1320, y: 460 });
      },
      // Wave 3: Retro Biplanes from behind + Swing Gliders (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'RETRO_BIPLANE', x: -60, y: 220, fromBehind: true, stopAtX: 1100 }));
        game.scheduleEnemy(1.2, { type: 'RETRO_BIPLANE', x: -60, y: 480, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(0.6, { type: 'SWING_GLIDER', x: 1320, y: 320 });
        game.scheduleEnemy(1.8, { type: 'SWING_GLIDER', x: 1320, y: 400 });
      }
    ]
  },
  {
    stage: 3,
    title: 'BADAI FORMASI V-SHAPE',
    subtitle: 'MISI 3: SPAM ARMADA SCOUT DALAM FORMASI V MELIUK',
    biome: 'VALLEY',
    waves: [
      // Wave 1: Pure Scout Undulating V-Shape Swarm (Staggered V-Formations)
      (game, fid) => {
        game.spawnVFormation(7, 240, fid);
        game.scheduleSpawn(0.8, () => game.spawnVFormation(7, 480, fid + '_b'));
      },
      // Wave 2: Triple Undulating V-Formations (High, Mid, Low sweeps)
      (game, fid) => {
        game.spawnVFormation(7, 180, fid);
        game.scheduleSpawn(0.7, () => game.spawnVFormation(7, 360, fid + '_b'));
        game.scheduleSpawn(1.4, () => game.spawnVFormation(7, 540, fid + '_c'));
      },
      // Wave 3: Inverted Pincer V-Formation with Green Drone escorts
      (game, fid) => {
        game.spawnVFormation(7, 220, fid);
        game.scheduleSpawn(0.4, () => game.spawnVFormation(7, 500, fid + '_b'));
        game.scheduleEnemy(0.6, { type: 'DRONE', x: 1320, y: 360 });
        game.scheduleEnemy(1.2, { type: 'DRONE', x: 1320, y: 280 });
        game.scheduleEnemy(1.2, { type: 'DRONE', x: 1320, y: 440 });
      },
      // Wave 4: Sweeping Rapid Undulating Diamond V-Formations with Bi-Plane Flankers
      (game, fid) => {
        game.spawnVFormation(9, 360, fid);
        game.scheduleSpawn(0.7, () => game.spawnVFormation(7, 200, fid + '_b'));
        game.scheduleSpawn(0.7, () => game.spawnVFormation(7, 520, fid + '_c'));
        game.scheduleEnemy(1.2, { type: 'RETRO_BIPLANE', x: 1340, y: 280 });
        game.scheduleEnemy(1.8, { type: 'RETRO_BIPLANE', x: 1340, y: 440 });
      },
      // Wave 5: Grand Climax V-Formation Barrage with layered waves and Fruit Carrier drop
      (game, fid) => {
        game.spawnVFormation(9, 220, fid);
        game.scheduleSpawn(0.6, () => game.spawnVFormation(9, 500, fid + '_b'));
        game.scheduleSpawn(1.2, () => game.spawnVFormation(9, 360, fid + '_c'));
        game.scheduleEnemy(1.0, { type: 'FRUIT_CARRIER', x: 1340, y: 360 });
        game.scheduleEnemy(1.8, { type: 'DRONE', x: 1320, y: 200 });
        game.scheduleEnemy(1.8, { type: 'DRONE', x: 1320, y: 520 });
      }
    ]
  },
  {
    stage: 4,
    title: 'KONVOI BALON UDARA & DREAD CRUISER',
    subtitle: 'MISI 4: HADAPI ARMADA MERIAM & JUMBO DREAD CRUISER',
    biome: 'VALLEY',
    waves: [
      // Wave 1: Gunship Trio + Scout escort formation (2 types)
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 360 }));
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 540 }));
        game.spawnScoutFormation(5, 360, fid);
      },
      // Wave 2: Heavy Blimps + Gunship crossfire (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 200 }));
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 500 }));
        game.scheduleEnemy(0.8, { type: 'GUNSHIP', x: 1320, y: 320 });
        game.scheduleEnemy(1.6, { type: 'GUNSHIP', x: 1320, y: 400 });
      },
      // Wave 3: Heavy Gunships battery + Dual Blimps (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 360 }));
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 540 }));
        game.scheduleEnemy(0.8, { type: 'BLIMP', x: 1340, y: 260 });
        game.scheduleEnemy(1.6, { type: 'BLIMP', x: 1340, y: 460 });
      },
      // Wave 4: Mini-Boss Jumbo Dread Cruiser + Triple Gunship escorts (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUMBO_DREAD_CRUISER', x: 1360, y: 340 }));
        game.scheduleEnemy(0.6, { type: 'GUNSHIP', x: 1320, y: 180 });
        game.scheduleEnemy(1.2, { type: 'GUNSHIP', x: 1320, y: 350 });
        game.scheduleEnemy(1.8, { type: 'GUNSHIP', x: 1320, y: 520 });
      }
    ]
  },
  {
    stage: 5,
    title: 'BENTENG DREADNOUGHT',
    subtitle: 'BOSS DUNIA 1: THE IRON CLAY DREADNOUGHT',
    biome: 'VALLEY',
    isBossStage: true,
    bossType: 'DREADNOUGHT',
    waves: [
      // Wave 1: Fruit Harvest Armada (16 Fruit Carriers)
      (game) => {
        game.spawnFruitCarrierWave(16, 1);
      },
      // Wave 2: Boss Battle
      (game) => {
        game.spawnBoss('DREADNOUGHT');
      }
    ]
  },

  // --- WORLD 2: SUNSET CANYON (Stages 6 - 10) ---
  {
    stage: 6,
    title: 'NGARAI TANAH SENJA',
    subtitle: 'MISI 6: PENYELAM NGARAI & TAWON PENYENGAT',
    biome: 'CANYON',
    waves: [
      // Wave 1: Canyon Divers top diving sequence (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'CANYON_DIVER', x: 700, y: -60 }));
        game.scheduleEnemy(0.8, { type: 'CANYON_DIVER', x: 920, y: -60 });
        game.scheduleEnemy(1.6, { type: 'CANYON_DIVER', x: 1140, y: -60 });
      },
      // Wave 2: Canyon Divers + Stingers horizontal rush (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'CANYON_DIVER', x: 800, y: -60 }));
        game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 240 }));
        game.scheduleEnemy(1.0, { type: 'CANYON_DIVER', x: 1050, y: -60 });
        game.scheduleEnemy(1.2, { type: 'STINGER', x: 1320, y: 480 });
      },
      // Wave 3: Stinger echelon + Canyon Divers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 520 }));
        game.scheduleEnemy(0.8, { type: 'CANYON_DIVER', x: 750, y: -60 });
        game.scheduleEnemy(1.4, { type: 'CANYON_DIVER', x: 1000, y: -60 });
        game.scheduleEnemy(1.8, { type: 'STINGER', x: 1320, y: 360 });
      }
    ]
  },
  {
    stage: 7,
    title: 'LEMBILANG GEYSER & ELANG PEMBURU',
    subtitle: 'MISI 7: ROKET GEYSER BAWAH & FALCON PELACAK',
    biome: 'CANYON',
    waves: [
      // Wave 1: Geyser Rushers erupting vertically (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'GEYSER_RUSHER', x: 700, y: 760 }));
        game.scheduleEnemy(0.8, { type: 'GEYSER_RUSHER', x: 920, y: 760 });
        game.scheduleEnemy(1.6, { type: 'GEYSER_RUSHER', x: 1140, y: 760 });
      },
      // Wave 2: Falcon Trackers + Geyser Rushers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'FALCON_TRACKER', x: 1320, y: 260 }));
        game.enemies.push(new Enemy({ type: 'GEYSER_RUSHER', x: 780, y: 760 }));
        game.scheduleEnemy(0.8, { type: 'FALCON_TRACKER', x: 1320, y: 460 });
        game.scheduleEnemy(1.2, { type: 'GEYSER_RUSHER', x: 1040, y: 760 });
      },
      // Wave 3: Falcon Trackers + Stingers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'FALCON_TRACKER', x: 1320, y: 320 }));
        game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 520 }));
        game.scheduleEnemy(1.0, { type: 'FALCON_TRACKER', x: 1320, y: 440 });
        game.scheduleEnemy(1.5, { type: 'STINGER', x: 1320, y: 360 });
      }
    ]
  },
  {
    stage: 8,
    title: 'KINETIK CAKRAM SPINNER',
    subtitle: 'MISI 8: BARRAGE CAKRAM SPINNER MEMANTUL & PERCIKAN RADIAL',
    biome: 'CANYON',
    waves: [
      // Wave 1: Trio Spinners criss-crossing bounce + Geyser Rusher surprise
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 180, vy: 160 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 360, vy: -160 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 520, vy: 160 }));
        game.scheduleEnemy(0.9, { type: 'GEYSER_RUSHER', x: 1320, y: 580 });
      },
      // Wave 2: Quad Spinners high-speed dynamic ricochet + Canyon Diver
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160, vy: 180 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 280, vy: -180 }));
        game.scheduleEnemy(0.7, { type: 'SPINNER', x: 1320, y: 420, vy: 180 });
        game.scheduleEnemy(0.7, { type: 'SPINNER', x: 1320, y: 560, vy: -180 });
        game.scheduleEnemy(1.2, { type: 'CANYON_DIVER', x: 900, y: -60 });
      },
      // Wave 3: Quintuple Spinners dense radial spark storm + Mine Layer hazard
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160, vy: 170 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 260, vy: -170 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 360, vy: 170 }));
        game.scheduleEnemy(0.7, { type: 'SPINNER', x: 1320, y: 460, vy: -170 });
        game.scheduleEnemy(0.7, { type: 'SPINNER', x: 1320, y: 560, vy: 170 });
        game.scheduleEnemy(1.4, { type: 'MINE_LAYER', x: 1340, y: 360 });
      },
      // Wave 4: Hex-Spinner kinetic wall barrage bouncing at alternating phase angles
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 140, vy: 190 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 240, vy: -190 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 360, vy: 190 }));
        game.scheduleEnemy(0.6, { type: 'SPINNER', x: 1320, y: 460, vy: -190 });
        game.scheduleEnemy(0.6, { type: 'SPINNER', x: 1320, y: 560, vy: 190 });
        game.scheduleEnemy(1.2, { type: 'SPINNER', x: 1320, y: 300, vy: -190 });
        game.scheduleEnemy(1.5, { type: 'CANYON_DIVER', x: 1050, y: -60 });
      },
      // Wave 5: Climax Kinetic Vortex: 7 rapid Spinners coordinated with high-altitude dive bombers & Fruit Carrier
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160, vy: 200 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 260, vy: -200 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 360, vy: 200 }));
        game.scheduleEnemy(0.5, { type: 'SPINNER', x: 1320, y: 460, vy: -200 });
        game.scheduleEnemy(0.5, { type: 'SPINNER', x: 1320, y: 560, vy: 200 });
        game.scheduleEnemy(1.0, { type: 'SPINNER', x: 1320, y: 220, vy: 180 });
        game.scheduleEnemy(1.0, { type: 'SPINNER', x: 1320, y: 480, vy: -180 });
        game.scheduleEnemy(1.2, { type: 'FRUIT_CARRIER', x: 1340, y: 360 });
        game.scheduleEnemy(1.6, { type: 'FALCON_TRACKER', x: 1320, y: 320 });
      }
    ]
  },
  {
    stage: 9,
    title: 'RANJAU NGARAI & BENTENG PASIR JUMBO',
    subtitle: 'MISI 9: PENYEBAR RANJAU & BENTENG PASIR JUMBO',
    biome: 'CANYON',
    waves: [
      // Wave 1: Mine Layers + Canyon Divers plunge (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 220 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 500 }));
        game.scheduleEnemy(0.6, { type: 'CANYON_DIVER', x: 750, y: -60 });
        game.scheduleEnemy(1.2, { type: 'CANYON_DIVER', x: 950, y: -60 });
        game.scheduleEnemy(1.8, { type: 'CANYON_DIVER', x: 1150, y: -60 });
      },
      // Wave 2: Dual Mine Layers + Plunging Canyon Divers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 300 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 440 }));
        game.scheduleEnemy(0.8, { type: 'CANYON_DIVER', x: 700, y: -60 });
        game.scheduleEnemy(1.4, { type: 'CANYON_DIVER', x: 920, y: -60 });
        game.scheduleEnemy(2.0, { type: 'CANYON_DIVER', x: 1120, y: -60 });
      },
      // Wave 3: Triple Mine Layers minefield barrier + Diving bombers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 180 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 360 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 540 }));
        game.scheduleEnemy(0.8, { type: 'CANYON_DIVER', x: 800, y: -60 });
        game.scheduleEnemy(1.6, { type: 'CANYON_DIVER', x: 1050, y: -60 });
      },
      // Wave 4: Mini-Boss Jumbo Sand Fortress + Mine Layer Escort Squad (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUMBO_SAND_FORTRESS', x: 1360, y: 340 }));
        game.scheduleEnemy(0.6, { type: 'MINE_LAYER', x: 1340, y: 180 });
        game.scheduleEnemy(1.0, { type: 'MINE_LAYER', x: 1340, y: 500 });
        game.scheduleEnemy(1.6, { type: 'MINE_LAYER', x: 1340, y: 240 });
        game.scheduleEnemy(2.2, { type: 'MINE_LAYER', x: 1340, y: 440 });
      }
    ]
  },
  {
    stage: 10,
    title: 'GOLIATH SANG PENGUASA LANGIT',
    subtitle: 'BOSS DUNIA 2: THE CLAY GOLIATH ZEPPELIN',
    biome: 'CANYON',
    isBossStage: true,
    bossType: 'GOLIATH_ZEPPELIN',
    waves: [
      // Wave 1: Fruit Harvest Armada (24 Fruit Carriers across canyon)
      (game) => {
        game.spawnFruitCarrierWave(24, 2);
      },
      // Wave 2: Boss Battle
      (game) => {
        game.spawnBoss('GOLIATH_ZEPPELIN');
      }
    ]
  },

  // --- WORLD 3: MIDNIGHT CYBER-CLAY (Stages 11 - 15) ---
  {
    stage: 11,
    title: 'BENTENG MALAM CYBER',
    subtitle: 'MISI 11: PENYUSUP CYBER PHANTOM & KILAT INTERCEPTOR',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Cyber Phantoms sleek rear intrusion (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'CYBER_PHANTOM', x: -60, y: 220, fromBehind: true, stopAtX: 1100 }));
        game.scheduleEnemy(0.8, { type: 'CYBER_PHANTOM', x: -60, y: 480, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 2: Cyber Phantoms + Interceptors blitz (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'CYBER_PHANTOM', x: -60, y: 260, fromBehind: true, stopAtX: 1100 }));
        game.enemies.push(new Enemy({ type: 'CYBER_PHANTOM', x: -60, y: 440, fromBehind: true, stopAtX: 1100 }));
        game.scheduleEnemy(0.7, { type: 'INTERCEPTOR', x: 1340, y: 350 });
        game.scheduleEnemy(1.4, { type: 'INTERCEPTOR', x: 1340, y: 350 });
      },
      // Wave 3: Interceptors + Shield Cruiser (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 350 }));
        game.scheduleEnemy(0.6, { type: 'INTERCEPTOR', x: 1340, y: 220 });
        game.scheduleEnemy(1.2, { type: 'INTERCEPTOR', x: 1340, y: 480 });
      }
    ]
  },
  {
    stage: 12,
    title: 'LABIRIN PERISAI ENERGI',
    subtitle: 'MISI 12: SHIELD CRUISER & SNIPER SUDUT',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Dual Shield Cruisers screening corridor (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 500 }));
      },
      // Wave 2: Shield Cruiser + Corner Snipers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 350 }));
        game.scheduleEnemy(0.7, { type: 'SNIPER', x: 1340, y: 180 });
        game.scheduleEnemy(1.4, { type: 'SNIPER', x: 1340, y: 520 });
      },
      // Wave 3: Snipers + Cyber Phantoms from rear (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 500 }));
        game.scheduleEnemy(0.8, { type: 'CYBER_PHANTOM', x: -60, y: 260, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.6, { type: 'CYBER_PHANTOM', x: -60, y: 440, fromBehind: true, stopAtX: 1100 });
      }
    ]
  },
  {
    stage: 13,
    title: 'BADAI ROKET CYBER',
    subtitle: 'MISI 13: SPAM ARMADA VORTEX DRONE PELUNCUR ROKET HOMING',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Trio Vortex Drones launching twin homing rockets + Cyber Phantom sneak
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 360 }));
        game.scheduleEnemy(0.8, { type: 'VORTEX_DRONE', x: 1320, y: 520 });
        game.scheduleEnemy(1.2, { type: 'CYBER_PHANTOM', x: -60, y: 300, fromBehind: true, stopAtX: 1080 });
      },
      // Wave 2: Quad Vortex Drones continuous rocket salvo + Shield Cruiser vanguard
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 300 }));
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 420 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 540 });
        game.scheduleEnemy(1.0, { type: 'SHIELD_CRUISER', x: 1340, y: 360 });
      },
      // Wave 3: Double-Squad Vortex Drones (6 drones) criss-crossing homing barrage
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 280 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 440 }));
        game.scheduleEnemy(0.8, { type: 'VORTEX_DRONE', x: 1320, y: 220 });
        game.scheduleEnemy(0.8, { type: 'VORTEX_DRONE', x: 1320, y: 360 });
        game.scheduleEnemy(0.8, { type: 'VORTEX_DRONE', x: 1320, y: 520 });
      },
      // Wave 4: Heavy Rocket Battery: Vortex Drones flanked by Cyber Phantoms & Sniper
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 500 }));
        game.scheduleEnemy(0.6, { type: 'CYBER_PENDULUM', x: 1320, y: 350 });
        game.scheduleEnemy(1.0, { type: 'VORTEX_DRONE', x: 1320, y: 350 });
        game.scheduleEnemy(1.4, { type: 'CYBER_PHANTOM', x: -60, y: 220, fromBehind: true, stopAtX: 1080 });
        game.scheduleEnemy(1.4, { type: 'CYBER_PHANTOM', x: -60, y: 480, fromBehind: true, stopAtX: 1080 });
      },
      // Wave 5: Sine-wave launch barrage: 6 Vortex Drones in sweeping patterns + Snipers
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 320 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 480 }));
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 240 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 400 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 560 });
        game.scheduleEnemy(1.2, { type: 'SNIPER', x: 1340, y: 180 });
        game.scheduleEnemy(1.2, { type: 'SNIPER', x: 1340, y: 540 });
      },
      // Wave 6: Climax Armageddon Salvo: Octa-Vortex Drones (8 drones) + Fruit Carrier reward
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 260 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 360 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1320, y: 460 }));
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 200 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 300 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 420 });
        game.scheduleEnemy(0.7, { type: 'VORTEX_DRONE', x: 1320, y: 540 });
        game.scheduleEnemy(1.2, { type: 'FRUIT_CARRIER', x: 1340, y: 360 });
      }
    ]
  },
  {
    stage: 14,
    title: 'BENTENG INTI SIBER',
    subtitle: 'MISI 14: KOLOSUS BENTENG CYBER GARGANTUA & BARRAGE PERISAI',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Shield Cruisers + Corner Snipers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 500 }));
        game.scheduleEnemy(0.8, { type: 'SNIPER', x: 1340, y: 180 });
        game.scheduleEnemy(1.4, { type: 'SNIPER', x: 1340, y: 540 });
      },
      // Wave 2: Dual Shield Cruisers + Triple Snipers precision crossfire (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 280 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 440 }));
        game.scheduleEnemy(0.6, { type: 'SNIPER', x: 1340, y: 160 });
        game.scheduleEnemy(1.2, { type: 'SNIPER', x: 1340, y: 360 });
        game.scheduleEnemy(1.8, { type: 'SNIPER', x: 1340, y: 560 });
      },
      // Wave 3: Triple Shield Cruisers energy barricade + Snipers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 360 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 540 }));
        game.scheduleEnemy(0.8, { type: 'SNIPER', x: 1340, y: 260 });
        game.scheduleEnemy(1.6, { type: 'SNIPER', x: 1340, y: 460 });
      },
      // Wave 4: Mini-Boss Jumbo Cyber Gargantua + Quad Shield Cruiser Escorts (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUMBO_CYBER_GARGANTUA', x: 1360, y: 350 }));
        game.scheduleEnemy(0.6, { type: 'SHIELD_CRUISER', x: 1320, y: 180 });
        game.scheduleEnemy(1.0, { type: 'SHIELD_CRUISER', x: 1320, y: 520 });
        game.scheduleEnemy(1.6, { type: 'SHIELD_CRUISER', x: 1320, y: 260 });
        game.scheduleEnemy(2.2, { type: 'SHIELD_CRUISER', x: 1320, y: 440 });
      }
    ]
  },
  {
    stage: 15,
    title: 'TITAN LEVIATHAN',
    subtitle: 'BOSS DUNIA 3: THE ULTIMATE CLAY LEVIATHAN',
    biome: 'CYBER_NIGHT',
    isBossStage: true,
    bossType: 'LEVIATHAN_TITAN',
    waves: [
      // Wave 1: Fruit Harvest Armada (32 Fruit Carriers in cyber echelon)
      (game) => {
        game.spawnFruitCarrierWave(32, 3);
      },
      // Wave 2: Boss Battle
      (game) => {
        game.spawnBoss('LEVIATHAN_TITAN');
      }
    ]
  },

  // --- WORLD 4: THE COSMIC SINGULARITY (Stages 16 - 20) ---
  {
    stage: 16,
    title: 'GERBANG RUANG KOSMIS',
    subtitle: 'MISI 16: PENYELAM METEOR DARI ATAS & PANCARAN ABYSS DARI BAWAH',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Meteor Divers vertical plunge from ceiling (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'METEOR_DIVER', x: 700, y: -60 }));
        game.scheduleEnemy(0.8, { type: 'METEOR_DIVER', x: 950, y: -60 });
        game.scheduleEnemy(1.6, { type: 'METEOR_DIVER', x: 1150, y: -60 });
      },
      // Wave 2: Abyss Ascenders vertical eruption from floor (1 type)
      (game) => {
        game.enemies.push(new Enemy({ type: 'ABYSS_ASCENDER', x: 750, y: 760 }));
        game.scheduleEnemy(0.8, { type: 'ABYSS_ASCENDER', x: 980, y: 760 });
        game.scheduleEnemy(1.6, { type: 'ABYSS_ASCENDER', x: 1200, y: 760 });
      },
      // Wave 3: Meteor Divers + Abyss Ascenders cross-vertical pincer (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'METEOR_DIVER', x: 750, y: -60 }));
        game.enemies.push(new Enemy({ type: 'ABYSS_ASCENDER', x: 850, y: 760 }));
        game.scheduleEnemy(0.8, { type: 'METEOR_DIVER', x: 1050, y: -60 });
        game.scheduleEnemy(1.2, { type: 'ABYSS_ASCENDER', x: 1150, y: 760 });
      }
    ]
  },
  {
    stage: 17,
    title: 'LINTASAN WARP & ORBIT KOSMIS',
    subtitle: 'MISI 17: PENYUSUP BELAKANG WARP FLANKER & ORBITER',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Pincer Warp Infiltration & Cosmic Orbiter Vanguard (2 Flankers + 1 Orbiter)
      (game) => {
        game.enemies.push(new Enemy({ type: 'WARP_FLANKER', x: -80, y: 200, fromBehind: true, stopAtX: 1100 }));
        game.enemies.push(new Enemy({ type: 'WARP_FLANKER', x: -80, y: 520, fromBehind: true, stopAtX: 1100 }));
        game.scheduleEnemy(0.6, { type: 'COSMIC_ORBITER', x: 1320, y: 360 });
      },
      // Wave 2: Dual Cosmic Orbital Ring + Middle Infiltration & Sky Dive (2 Orbiters + 1 Flanker + 1 Diver)
      (game) => {
        game.enemies.push(new Enemy({ type: 'COSMIC_ORBITER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'COSMIC_ORBITER', x: 1320, y: 480 }));
        game.scheduleEnemy(0.8, { type: 'WARP_FLANKER', x: -80, y: 350, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.4, { type: 'METEOR_DIVER', x: 950, y: -60 });
      },
      // Wave 3: Triple Warp Infiltration Echelon + Cross-Vertical Threats (3 Flankers + 1 Ascender + 1 Diver)
      (game) => {
        game.enemies.push(new Enemy({ type: 'WARP_FLANKER', x: -80, y: 180, fromBehind: true, stopAtX: 1100 }));
        game.scheduleEnemy(0.6, { type: 'WARP_FLANKER', x: -80, y: 360, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.2, { type: 'WARP_FLANKER', x: -80, y: 540, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(0.8, { type: 'ABYSS_ASCENDER', x: 820, y: 760 });
        game.scheduleEnemy(1.5, { type: 'METEOR_DIVER', x: 1080, y: -60 });
      },
      // Wave 4: Constellation Triangle Orbiters + Rear Flanker Pincer (3 Orbiters + 2 Flankers)
      (game) => {
        game.enemies.push(new Enemy({ type: 'COSMIC_ORBITER', x: 1320, y: 360 }));
        game.scheduleEnemy(0.5, { type: 'COSMIC_ORBITER', x: 1370, y: 200 });
        game.scheduleEnemy(0.5, { type: 'COSMIC_ORBITER', x: 1370, y: 520 });
        game.scheduleEnemy(1.0, { type: 'WARP_FLANKER', x: -80, y: 260, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.6, { type: 'WARP_FLANKER', x: -80, y: 460, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 5: Climax Singularity Warp Gate + Fruit Carrier Harvest (2 Orbiters + 2 Flankers + 1 Diver + Fruit Carrier)
      (game) => {
        game.enemies.push(new Enemy({ type: 'COSMIC_ORBITER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'COSMIC_ORBITER', x: 1320, y: 480 }));
        game.scheduleEnemy(0.6, { type: 'WARP_FLANKER', x: -80, y: 180, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.2, { type: 'WARP_FLANKER', x: -80, y: 520, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.0, { type: 'METEOR_DIVER', x: 1000, y: -60 });
        game.scheduleEnemy(1.4, { type: 'FRUIT_CARRIER', x: 1340, y: 360 });
      }
    ]
  },
  {
    stage: 18,
    title: 'PERBURUAN KELAM VOID',
    subtitle: 'MISI 18: SPAM KAWANAN PEMBURU VOID STALKER MENGEJAR PESAWAT',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Trio Void Stalkers locking onto player (3 Hunters)
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 200 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 360 }));
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 520 });
      },
      // Wave 2: Quad Void Stalkers converging aggressively + Cosmic Orbiter harassment
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 180 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 280 }));
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 420 });
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 540 });
        game.scheduleEnemy(1.0, { type: 'COSMIC_ORBITER', x: 1320, y: 360 });
      },
      // Wave 3: Quintuple Void Stalkers predatory pursuit swarm + Warp Flanker ambush
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 260 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 360 }));
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 460 });
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 560 });
        game.scheduleEnemy(1.2, { type: 'WARP_FLANKER', x: -80, y: 300, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 4: Phased Dual-Pack Void Stalkers (6 hunters) rushing in alternating pincers
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 180 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 280 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 380 }));
        game.scheduleEnemy(0.8, { type: 'VOID_STALKER', x: 1340, y: 220 });
        game.scheduleEnemy(0.8, { type: 'VOID_STALKER', x: 1340, y: 340 });
        game.scheduleEnemy(0.8, { type: 'VOID_STALKER', x: 1340, y: 480 });
        game.scheduleEnemy(1.4, { type: 'METEOR_DIVER', x: 1340, y: 200 });
        game.scheduleEnemy(1.4, { type: 'ABYSS_ASCENDER', x: 1340, y: 520 });
      },
      // Wave 5: Void Hunter Swarm + Dual Warp Flankers rear siege
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 300 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 440 }));
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 240 });
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 380 });
        game.scheduleEnemy(0.7, { type: 'VOID_STALKER', x: 1340, y: 520 });
        game.scheduleEnemy(1.1, { type: 'WARP_FLANKER', x: -80, y: 220, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.1, { type: 'WARP_FLANKER', x: -80, y: 500, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 6: Cosmic Void Apex Stalkers: 8 Void Stalkers rushing in sweeping sine packs
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 160 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 260 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 360 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 460 }));
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 200 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 300 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 420 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 540 });
        game.scheduleEnemy(1.2, { type: 'COSMIC_ORBITER', x: 1320, y: 240 });
        game.scheduleEnemy(1.2, { type: 'COSMIC_ORBITER', x: 1320, y: 480 });
      },
      // Wave 7: Grand Void Climax Onslaught: 10 Void Stalkers coordinated pincer pursuit + Fruit Carrier
      (game) => {
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 150 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 250 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 350 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 450 }));
        game.enemies.push(new Enemy({ type: 'VOID_STALKER', x: 1340, y: 550 }));
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 180 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 280 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 380 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 480 });
        game.scheduleEnemy(0.6, { type: 'VOID_STALKER', x: 1340, y: 580 });
        game.scheduleEnemy(1.0, { type: 'FRUIT_CARRIER', x: 1340, y: 360 });
      }
    ]
  },
  {
    stage: 19,
    title: 'BARIKADE TERAKHIR TITAN',
    subtitle: 'MISI 19: RAKSASA JUGGERNAUT & TITAN SINGULARITAS',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Juggernauts + Warp Flankers rear ambush (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 220 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 500 }));
        game.scheduleEnemy(0.8, { type: 'WARP_FLANKER', x: -80, y: 180, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.4, { type: 'WARP_FLANKER', x: -80, y: 520, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 2: Dual Juggernauts + Triple Warp Flankers crossfire (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 260 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 440 }));
        game.scheduleEnemy(0.6, { type: 'WARP_FLANKER', x: -80, y: 180, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.2, { type: 'WARP_FLANKER', x: -80, y: 360, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.8, { type: 'WARP_FLANKER', x: -80, y: 540, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 3: Triple Juggernauts heavy plasma line + Rear Warp Flankers (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 180 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 360 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 540 }));
        game.scheduleEnemy(0.8, { type: 'WARP_FLANKER', x: -80, y: 240, fromBehind: true, stopAtX: 1100 });
        game.scheduleEnemy(1.6, { type: 'WARP_FLANKER', x: -80, y: 480, fromBehind: true, stopAtX: 1100 });
      },
      // Wave 4: Super Mini-Boss Jumbo Singularity Titan + Triple Juggernaut escorts (2 types)
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUMBO_SINGULARITY_TITAN', x: 1360, y: 350 }));
        game.scheduleEnemy(0.6, { type: 'JUGGERNAUT', x: 1350, y: 180 });
        game.scheduleEnemy(1.2, { type: 'JUGGERNAUT', x: 1350, y: 520 });
        game.scheduleEnemy(1.8, { type: 'JUGGERNAUT', x: 1350, y: 350 });
      }
    ]
  },
  {
    stage: 20,
    title: 'KOLOSUS CLAY OMEGA',
    subtitle: 'FINAL CLIMAX BOSS: THE OMEGA CLAY COLOSSUS',
    biome: 'COSMIC_VOID',
    isBossStage: true,
    bossType: 'OMEGA_COLOSSUS',
    waves: [
      // Wave 1: Grand Cosmic Fruit Harvest Armada (40 Fruit Carriers)
      (game) => {
        game.spawnFruitCarrierWave(40, 4);
      },
      // Wave 2: Final Boss Battle
      (game) => {
        game.spawnBoss('OMEGA_COLOSSUS');
      }
    ]
  }
];

// Default Cheat Configuration
export const DEFAULT_CHEAT_CONFIG = {
  enabled: false,
  startStage: 1, // 1 to 20

  // Starting Lives
  overrideStartingLives: false,
  infiniteLives: false,
  startingLives: 10, // 1 to 20

  // Max Lives
  overrideMaxLives: false,
  maxLives: Infinity,

  // Score Interval for +1 Extra Life
  overrideScoreInterval: false,
  scoreIntervalForLife: 200000, // 10k to 5M

  // Weapon Duration
  overrideWeaponDuration: false,
  infiniteWeaponDuration: false,
  weaponDuration: 15, // 5 to 60

  // Enemy HP Multiplier
  overrideEnemyHp: false,
  enemyHpMult: 1.0, // 0.25x to 5.0x

  // Enemy Shoot Cooldown Multiplier
  overrideShootCooldown: false,
  enemyShootCooldownMult: 1.0, // 0.25x to 4.0x

  // Enemy Bullet Speed Multiplier
  overrideBulletSpeed: false,
  enemyBulletSpeedMult: 1.0 // 0.25x to 3.0x
};

export class Game {
  constructor(canvas, uiHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiHooks = uiHooks || {};

    // Canonical logical game resolution (16:9 arcade format)
    this.width = 1280;
    this.height = 720;

    // UHD Hi-DPI Configuration
    let savedUhd = true;
    try {
      savedUhd = localStorage.getItem('platypus_uhd') !== 'false';
    } catch (e) {}
    this.uhdEnabled = Boolean(savedUhd);
    this.dpr = this.uhdEnabled ? Math.min(window.devicePixelRatio || 1, 3.0) : 1.0;

    // Difficulty configuration (EASY, NORMAL, HARD)
    let savedDiff = 'NORMAL';
    try {
      savedDiff = localStorage.getItem('platypus_difficulty') || 'NORMAL';
    } catch (e) {}
    this.difficulty = DIFFICULTY_CONFIGS[savedDiff] ? savedDiff : 'NORMAL';
    this.difficultyConfig = DIFFICULTY_CONFIGS[this.difficulty];

    // Cheat configuration (Overridden values take precedence over difficulty settings)
    let savedCheats = null;
    try {
      const str = localStorage.getItem('platypus_cheat_config');
      if (str) savedCheats = JSON.parse(str);
    } catch (e) {}
    this.cheatConfig = Object.assign({}, DEFAULT_CHEAT_CONFIG, savedCheats || {});

    // Subsystems
    this.sound = new SoundController();
    this.camera = new Camera(this.width, this.height);
    this.bg = new ParallaxBackground(this.width, this.height);
    this.particles = new ParticleSystem();
    this.particles.setResolutionScale(this.dpr);
    warmNumberFormat();
    this.particles.prewarmText([
      '🍒 CERI', '🍌 PISANG', '🍎 APEL', '🍉 SEMANGKA', '🐉 BUAH NAGA', '⭐ BUAH EMAS SPESIAL',
      '🍉 PANEN BUAH!', '⚡ OVERDRIVE 1.5X!', '+ SPREAD!', '+ LASER!', '+ HOMING!', '+ FLAK!', '+ PLASMA!',
      '+1 NYAWA (20,000 SKOR)!', '0123456789, +!()x:.'
    ]);

    this.hud = new HUD();
    this.hud.setDifficulty(this.difficulty, this.difficultyConfig);
    this.hud.setCheatActive(this.isCheatActive());

    Enemy.difficultyConfig = this.getEffectiveEnemyDifficultyConfig();

    // Enemy HP Display Mode Configuration (DYNAMIC, ALWAYS, MINIMAL)
    try {
      const savedHpMode = localStorage.getItem('platypus_setting_enemy_hp_mode');
      if (savedHpMode) Enemy.hpDisplayMode = savedHpMode;
    } catch (e) {}

    this.player = new Player(this.width, this.height);
    this.player.reset(this.difficultyConfig, this.getCheatOverrides());

    // Real-time 3D claymation layer (WebGL). Falls back to legacy 2D sprites when unavailable.
    this.scene3D = Scene3D.create(this.width, this.height, this.dpr);
    ClayRenderer.use3D = Boolean(this.scene3D);

    // Update physical canvas size according to UHD DPR
    this.updateCanvasDimensions();
    window.addEventListener('resize', () => this.updateCanvasDimensions());

    // Entity lists
    this.bullets = [];
    this.enemies = [];
    this.collectibles = [];
    this.boss = null;

    // Pre-allocated reusable scratch buffers to eliminate GC allocations
    this._extraEnemies = [];
    this._extraBossEnemies = [];
    this._enemyBulletsBuffer = [];

    // 20-Stage System State
    this.currentStage = 1;
    this.totalStages = STAGE_CONFIGS.length; // 20
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.bossPreWaveGraceTimer = null;
    this.stageTransitionTimer = 0;
    this.isTransitioningStage = false;
    this.spawnQueue = [];
    this.formationsTracker = new Map();

    // Weapon Drop Timer according to difficulty interval
    this.weaponDropTimer = this.getRandomWeaponDropInterval();

    // State
    this.state = GAME_STATES.MENU;
    this.lastTime = performance.now();

    this.boundLoop = this.loop.bind(this);
    requestAnimationFrame(this.boundLoop);
  }

  updateCanvasDimensions() {
    this.dpr = this.uhdEnabled ? Math.min(window.devicePixelRatio || 1, 3.0) : 1.0;
    const targetW = Math.round(this.width * this.dpr);
    const targetH = Math.round(this.height * this.dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    if (this.bg && this.bg.onResize) {
      this.bg.onResize(this.dpr);
    }
    if (this.scene3D) {
      this.scene3D.setSize(this.width, this.height, this.dpr);
    }
    if (this.particles && this.particles.setResolutionScale) {
      this.particles.setResolutionScale(this.dpr);
    }
  }

  setUhdEnabled(enabled) {
    this.uhdEnabled = Boolean(enabled);
    try {
      localStorage.setItem('platypus_uhd', this.uhdEnabled ? 'true' : 'false');
    } catch (e) {}
    this.updateCanvasDimensions();
    if (this.uiHooks && this.uiHooks.onUhdChanged) {
      this.uiHooks.onUhdChanged(this.uhdEnabled);
    }
    return this.uhdEnabled;
  }

  toggleUhd() {
    return this.setUhdEnabled(!this.uhdEnabled);
  }

  setEnemyHpDisplayMode(mode) {
    if (['DYNAMIC', 'ALWAYS', 'MINIMAL'].includes(mode)) {
      Enemy.hpDisplayMode = mode;
      try {
        localStorage.setItem('platypus_setting_enemy_hp_mode', mode);
      } catch (e) {}
    }
    return Enemy.hpDisplayMode;
  }

  getEnemyHpDisplayMode() {
    return Enemy.hpDisplayMode || 'DYNAMIC';
  }

  isCheatActive() {
    return Boolean(this.cheatConfig && this.cheatConfig.enabled);
  }

  getCheatOverrides() {
    if (!this.isCheatActive()) return null;
    return {
      overrideStartingLives: Boolean(this.cheatConfig.overrideStartingLives),
      infiniteLives: Boolean(this.cheatConfig.infiniteLives),
      startingLives: parseInt(this.cheatConfig.startingLives, 10) || 10,

      overrideMaxLives: Boolean(this.cheatConfig.overrideMaxLives),
      maxLives: this.cheatConfig.overrideMaxLives ? (parseInt(this.cheatConfig.maxLives, 10) || Infinity) : Infinity,

      overrideScoreInterval: Boolean(this.cheatConfig.overrideScoreInterval),
      scoreIntervalForLife: parseInt(this.cheatConfig.scoreIntervalForLife, 10) || 200000,

      overrideWeaponDuration: Boolean(this.cheatConfig.overrideWeaponDuration),
      infiniteWeaponDuration: Boolean(this.cheatConfig.infiniteWeaponDuration),
      weaponDuration: parseFloat(this.cheatConfig.weaponDuration) || 15
    };
  }

  _buildEnemyDifficultyConfig(cheatCfg) {
    const base = Object.assign({}, this.difficultyConfig || DIFFICULTY_CONFIGS.NORMAL);
    if (!cheatCfg || !cheatCfg.enabled) {
      return base;
    }
    if (cheatCfg.overrideEnemyHp && cheatCfg.enemyHpMult !== undefined) {
      base.hpMult = parseFloat(cheatCfg.enemyHpMult) || 1.0;
    }
    if (cheatCfg.overrideShootCooldown && cheatCfg.enemyShootCooldownMult !== undefined) {
      base.shootCooldownMult = parseFloat(cheatCfg.enemyShootCooldownMult) || 1.0;
    }
    if (cheatCfg.overrideBulletSpeed && cheatCfg.enemyBulletSpeedMult !== undefined) {
      base.bulletSpeedMult = parseFloat(cheatCfg.enemyBulletSpeedMult) || 1.0;
    }
    return base;
  }

  getEffectiveEnemyDifficultyConfig() {
    return this._buildEnemyDifficultyConfig(this.cheatConfig);
  }

  setCheatConfig(newConfig) {
    this.cheatConfig = Object.assign({}, this.cheatConfig, newConfig);
    try {
      localStorage.setItem('platypus_cheat_config', JSON.stringify(this.cheatConfig));
    } catch (e) {}
    Enemy.difficultyConfig = this.getEffectiveEnemyDifficultyConfig();
    if (this.hud) {
      this.hud.setCheatActive(this.isCheatActive());
    }
    if (this.state === GAME_STATES.MENU && this.player) {
      this.player.reset(this.difficultyConfig, this.getCheatOverrides());
    }
  }

  static getSavedProgress() {
    try {
      const dataStr = localStorage.getItem('platypus_saved_game');
      if (!dataStr) return null;
      const data = JSON.parse(dataStr);
      if (data && typeof data === 'object' && Number.isFinite(data.stage) && data.stage >= 1 && data.stage <= 20) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to parse saved game progress:', e);
    }
    return null;
  }

  hasSavedProgress() {
    return Game.getSavedProgress() !== null;
  }

  saveProgress() {
    if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.PAUSED) {
      return false;
    }
    if (!this.player || (this.player.lives <= 0 && !this.player.infiniteLives)) {
      return false;
    }

    try {
      // 1. Serialize all active entities
      const serializedPlayer = this.player.serialize();
      const serializedEnemies = this.enemies.map(e => (e && e.serialize) ? e.serialize() : null).filter(Boolean);
      const serializedBoss = (this.boss && this.boss.serialize) ? this.boss.serialize() : null;
      const serializedBullets = this.bullets.map(b => (b && b.serialize) ? b.serialize() : null).filter(Boolean);
      const serializedCollectibles = this.collectibles.map(c => (c && c.serialize) ? c.serialize() : null).filter(Boolean);

      // 2. Serialize Formations Tracker
      const formationsList = Array.from(this.formationsTracker.entries());

      // 3. Serialize Spawn Queue
      const serializedQueue = [];
      for (const item of this.spawnQueue) {
        let desc = item.descriptor;
        if (!desc && typeof item.action === 'function') {
          desc = this._extractSpawnDescriptor(item.action);
        }
        if (desc) {
          serializedQueue.push({
            timer: item.timer,
            descriptor: desc
          });
        }
      }

      // 4. Serialize Audio Track State
      const audioState = {
        biome: this.currentStageConfig.biome,
        isBossMusic: Boolean(this.sound && this.sound.isBossMusic),
        currentBossType: this.sound ? this.sound.currentBossType : null,
        musicStep: this.sound ? this.sound.musicStep : 0
      };

      const payload = {
        version: 2,
        timestamp: Date.now(),
        // Core mirror progress (for fast UI card reads & backwards compatibility)
        stage: this.currentStage,
        wave: Math.max(1, Math.min(this.totalWavesInStage, this.currentWave)),
        score: Math.floor(this.player.score || 0),
        lives: this.player.infiniteLives ? 999 : (this.player.lives !== undefined ? this.player.lives : 3),
        infiniteLives: Boolean(this.player.infiniteLives),
        maxLives: this.player.maxLives || 10,
        nextLifeScore: this.player.nextLifeScore || 200000,
        scoreIntervalForLife: this.player.scoreIntervalForLife || 200000,
        activeWeapon: this.player.activeWeapon || 'NORMAL',
        weaponTimeLeft: Math.max(0, this.player.weaponTimeLeft === Infinity ? 9999 : (this.player.weaponTimeLeft || 0)),
        infiniteWeapon: Boolean(this.player.infiniteWeapon),
        speedBoostTimeLeft: Math.max(0, this.player.speedBoostTimeLeft || 0),
        speedBoostActive: Boolean(this.player.speedBoostActive),
        difficulty: this.difficulty || 'NORMAL',
        isCheat: this.isCheatActive(),
        cheatConfig: this.isCheatActive() ? Object.assign({}, this.cheatConfig) : null,

        // Exact state preservation
        player: serializedPlayer,
        enemies: serializedEnemies,
        boss: serializedBoss,
        bullets: serializedBullets,
        collectibles: serializedCollectibles,
        formationsTracker: formationsList,
        spawnQueue: serializedQueue,
        audio: audioState,
        director: {
          waveTimer: this.waveTimer,
          waveInProgress: this.waveInProgress,
          stageTransitionTimer: this.stageTransitionTimer,
          isTransitioningStage: this.isTransitioningStage,
          weaponDropTimer: this.weaponDropTimer
        }
      };

      localStorage.setItem('platypus_saved_game', JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn('Failed to save game progress:', e);
      return false;
    }
  }

  clearSavedProgress() {
    try {
      localStorage.removeItem('platypus_saved_game');
    } catch (e) {
      console.warn('Failed to clear saved game progress:', e);
    }
  }

  goToMainMenu() {
    if ((this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) && this.player && (this.player.lives > 0 || this.player.infiniteLives)) {
      this.saveProgress();
    }
    this.state = GAME_STATES.MENU;
    this.sound.goToMainMenu();
    this.sound.setBossMode(false);
    if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    this.bullets = [];
    this.enemies = [];
    this.collectibles = [];
    this.boss = null;
    this.particles.clear();
    this.spawnQueue = [];
    this.hud.bannerLife = 0;
    this.hud.setCheatActive(this.isCheatActive());
    this.player.reset(this.difficultyConfig, this.getCheatOverrides());
  }

  setDifficulty(diffId) {
    if (DIFFICULTY_CONFIGS[diffId]) {
      this.difficulty = diffId;
      this.difficultyConfig = DIFFICULTY_CONFIGS[diffId];
      Enemy.difficultyConfig = this.getEffectiveEnemyDifficultyConfig();
      try {
        localStorage.setItem('platypus_difficulty', diffId);
      } catch (e) {}
      if (this.hud) {
        this.hud.setDifficulty(diffId, this.difficultyConfig);
      }
      if (this.state === GAME_STATES.MENU) {
        this.player.reset(this.difficultyConfig, this.getCheatOverrides());
      }
    }
  }

  getRandomWeaponDropInterval() {
    const range = (this.difficultyConfig && this.difficultyConfig.weaponDropInterval)
      ? this.difficultyConfig.weaponDropInterval
      : { min: 10.0, max: 40.0 };
    return range.min + Math.random() * (range.max - range.min);
  }

  spawnWeaponDrop() {
    // Spawns a floating clay capsule drifting in from right edge [120, 600]
    const spawnY = 120 + Math.random() * 480;
    this.collectibles.push(new PowerUpCapsule(this.width + 40, spawnY));
  }

  get currentStageConfig() {
    return STAGE_CONFIGS[this.currentStage - 1] || STAGE_CONFIGS[0];
  }

  get totalWavesInStage() {
    return this.currentStageConfig.waves.length;
  }

  start() {
    this.clearSavedProgress();
    this.sound.init();
    this.sound.setBossMode(false);
    if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    this.hud.setCheatActive(this.isCheatActive());
    this.player.reset(this.difficultyConfig, this.getCheatOverrides());
    this.bullets = [];
    this.enemies = [];
    this.collectibles = [];
    this.boss = null;
    this.particles.clear();
    this.spawnQueue = [];
    this.weaponDropTimer = this.getRandomWeaponDropInterval();

    // Determine starting stage (Stage 1 or Cheat starting stage 1..20)
    let startStage = 1;
    if (this.isCheatActive() && this.cheatConfig.startStage) {
      startStage = Math.max(1, Math.min(this.totalStages, parseInt(this.cheatConfig.startStage, 10)));
    }

    this.currentStage = startStage;
    Enemy.currentStage = startStage;
    Enemy.difficultyConfig = this.getEffectiveEnemyDifficultyConfig();
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.bossPreWaveGraceTimer = null;
    this.stageTransitionTimer = 0;
    this.isTransitioningStage = false;
    this.formationsTracker.clear();

    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);
    if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    // Professional Soundtrack Restart Logic:
    // Guarantees soundtrack is initialized, un-ducked, and playing cleanly from beat 1 for this stage
    this.sound.restartMusic({ biome: cfg.biome, isBoss: false });

    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();
    this.hud.showBanner(`STAGE ${startStage}: ${cfg.title}`, cfg.subtitle, 3.5);

    if (this.uiHooks && this.uiHooks.onStageChanged) {
      this.uiHooks.onStageChanged(this.currentStage, this.totalStages, cfg);
    }

    this.saveProgress();
  }

  resumeSavedGame() {
    const saved = Game.getSavedProgress();
    if (!saved) {
      this.start();
      return;
    }

    this.sound.init();
    this.sound.setBossMode(false);
    if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    this.sound.setPauseDucking(false);

    // 1. Difficulty & Cheats restoration
    if (saved.difficulty && DIFFICULTY_CONFIGS[saved.difficulty]) {
      this.difficulty = saved.difficulty;
      this.difficultyConfig = DIFFICULTY_CONFIGS[saved.difficulty];
    }
    // CRITICAL: We do NOT overwrite this.cheatConfig or localStorage.getItem('platypus_cheat_config')!
    // Cheat settings modified by the user are strictly preserved for new games (permainan awal).
    // The resumed session continues using its own saved session parameters without mutating global settings.
    const sessionCheat = (saved.cheatConfig && saved.isCheat) ? Object.assign({}, DEFAULT_CHEAT_CONFIG, saved.cheatConfig) : null;
    Enemy.difficultyConfig = sessionCheat ? this._buildEnemyDifficultyConfig(sessionCheat) : this.getEffectiveEnemyDifficultyConfig();
    if (this.hud) {
      this.hud.setDifficulty(this.difficulty, this.difficultyConfig);
      this.hud.setCheatActive(Boolean(saved.isCheat));
    }

    // 2. Clear old state
    for (const b of this.bullets) {
      Bullet.release(b);
    }
    this.bullets = [];
    this.enemies = [];
    this.collectibles = [];
    this.boss = null;
    this.particles.clear();
    this.spawnQueue = [];
    this.formationsTracker.clear();
    if (this.camera) this.camera.trauma = 0;

    // 3. Stage & wave director restoration
    this.currentStage = Math.max(1, Math.min(this.totalStages, saved.stage || 1));
    Enemy.currentStage = this.currentStage;
    this.currentWave = Math.max(1, Math.min(this.totalWavesInStage, saved.wave || 1));

    if (saved.director) {
      this.waveTimer = saved.director.waveTimer || 0;
      this.waveInProgress = Boolean(saved.director.waveInProgress);
      this.stageTransitionTimer = saved.director.stageTransitionTimer || 0;
      this.isTransitioningStage = Boolean(saved.director.isTransitioningStage);
      this.weaponDropTimer = saved.director.weaponDropTimer || this.getRandomWeaponDropInterval();
    } else {
      this.waveTimer = 0;
      this.waveInProgress = true;
      this.stageTransitionTimer = 0;
      this.isTransitioningStage = false;
      this.weaponDropTimer = this.getRandomWeaponDropInterval();
    }

    // 4. Formations Tracker restoration
    if (Array.isArray(saved.formationsTracker)) {
      for (const [fid, val] of saved.formationsTracker) {
        this.formationsTracker.set(fid, val);
      }
    }

    // 5. Player entity restoration
    this.player.reset(this.difficultyConfig, sessionCheat ? this.getCheatOverrides() : null);
    if (saved.player) {
      this.player.deserialize(saved.player);
    } else {
      this.player.score = saved.score || 0;
      this.player.infiniteLives = Boolean(saved.infiniteLives);
      this.player.lives = saved.infiniteLives ? Infinity : (saved.lives !== undefined ? saved.lives : 3);
      this.player.maxLives = saved.maxLives || 10;
      this.player.nextLifeScore = saved.nextLifeScore || 200000;
      this.player.scoreIntervalForLife = saved.scoreIntervalForLife || 200000;
      this.player.activeWeapon = saved.activeWeapon || 'NORMAL';
      this.player.weaponTimeLeft = saved.weaponTimeLeft || 0;
      this.player.infiniteWeapon = Boolean(saved.infiniteWeapon);
      this.player.speedBoostTimeLeft = saved.speedBoostTimeLeft || 0;
      this.player.speedBoostActive = Boolean(saved.speedBoostActive);
      this.player.x = 160;
      this.player.y = this.height / 2;
      this.player.invulnerableTimer = 3.0;
      this.player.dead = false;
    }

    // 6. Enemies restoration
    if (Array.isArray(saved.enemies)) {
      for (const enemyData of saved.enemies) {
        const e = Enemy.deserialize(enemyData, this.getEffectiveEnemyDifficultyConfig());
        if (e && !e.dead) {
          this.enemies.push(e);
        }
      }
    }

    // 7. Boss restoration
    if (saved.boss && !saved.boss.dead) {
      this.boss = Boss.deserialize(this.width, this.height, saved.boss);
    }

    // 8. Bullets restoration
    if (Array.isArray(saved.bullets)) {
      for (const bulletData of saved.bullets) {
        const b = Bullet.deserialize(bulletData);
        if (b && !b.dead) {
          this.bullets.push(b);
        }
      }
    }

    // 9. Collectibles restoration
    if (Array.isArray(saved.collectibles)) {
      for (const colData of saved.collectibles) {
        const c = deserializeCollectible(colData);
        if (c && !c.dead) {
          this.collectibles.push(c);
        }
      }
    }

    // 10. Spawn Queue restoration
    if (Array.isArray(saved.spawnQueue)) {
      for (const item of saved.spawnQueue) {
        if (!item || item.timer === undefined || !item.descriptor) continue;
        const action = this._recreateSpawnAction(item.descriptor);
        if (action) {
          this.spawnQueue.push({
            timer: item.timer,
            action,
            descriptor: item.descriptor
          });
        }
      }
    }

    // If Version 1 legacy save without entities or queue, spawn current wave
    if (!saved.version || saved.version < 2) {
      if (this.enemies.length === 0 && !this.boss && this.spawnQueue.length === 0) {
        this.spawnCurrentWave();
      }
    }

    // 11. Environment & Audio
    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);

    const isBossActive = Boolean(this.boss || (saved.audio && saved.audio.isBossMusic) || (cfg.isBossStage && this.currentWave === this.totalWavesInStage));
    const bossTypeToPlay = (this.boss ? this.boss.bossType : null) || (saved.audio ? saved.audio.currentBossType : null) || cfg.bossType;

    if (isBossActive) {
      this.sound.restartMusic({ biome: cfg.biome, isBoss: true, bossType: bossTypeToPlay });
      this.sound.setBossMode(true, cfg.biome, bossTypeToPlay);
      if (this.boss && this.boss.rageMode && this.sound.setBossRage) this.sound.setBossRage(true);
      if (this.bg && this.bg.setBossMode) this.bg.setBossMode(true, bossTypeToPlay);
    } else {
      this.sound.restartMusic({ biome: cfg.biome, isBoss: false });
      this.sound.setBossMode(false);
      if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    }

    if (saved.audio && typeof saved.audio.musicStep === 'number') {
      this.sound.musicStep = saved.audio.musicStep;
    }

    // 12. Set game state
    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();

    this.hud.showBanner(
      `STAGE ${this.currentStage}: ${cfg.title} (DILANJUTKAN)`,
      `GELOMBANG ${this.currentWave} • SKOR ${formatInt(this.player.score)}`,
      3.5,
      '#66bb6a'
    );

    if (this.uiHooks && this.uiHooks.onStageChanged) {
      this.uiHooks.onStageChanged(this.currentStage, this.totalStages, cfg);
    }

    this.saveProgress();
  }

  restart() {
    this.start();
  }

  addPlayerScore(points, isRaw = false) {
    const result = this.player.addScore(points, isRaw);
    const livesAwarded = typeof result === 'object' ? result.livesAwarded : result;
    const earned = typeof result === 'object' ? result.earned : Math.round(points);
    if (livesAwarded > 0) {
      this.sound.playExtraLife();
      this.camera.addTrauma(0.35);
      this.particles.createClaySplat(this.player.x, this.player.y, 25, '#ffd54f', '#66bb6a');
      const scoreIntervalFormatted = formatInt(this.player.scoreIntervalForLife || 200000);
      this.particles.createFloatingText(
        this.player.x,
        this.player.y - 35,
        `+${livesAwarded} NYAWA (${scoreIntervalFormatted} SKOR)!`,
        '#69f0ae'
      );
    }
    return earned;
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.saveProgress();
      this.state = GAME_STATES.PAUSED;
      this.sound.setPauseDucking(true);
      if (this.uiHooks.onPause) this.uiHooks.onPause(true);
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.lastTime = performance.now();
      this.sound.setPauseDucking(false);
      if (this.uiHooks.onPause) this.uiHooks.onPause(false);
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.state === GAME_STATES.PLAYING) {
      this.update(dt);
    } else if (this.state === GAME_STATES.PAUSED) {
      const input = this.uiHooks.input;
      if (input && input.consumePause()) {
        this.togglePause();
      }
      this.bg.update(dt * 0.4, 0.4, 0.5, 0);
    } else if (this.state === GAME_STATES.MENU) {
      this.bg.update(dt * 0.4, 0.4, 0.5, 0);
    }

    if (this.uiHooks && this.uiHooks.onFrame) {
      this.uiHooks.onFrame(this);
    }

    this.render();
    requestAnimationFrame(this.boundLoop);
  }

  update(dt) {
    const input = this.uiHooks.input;

    if (input && input.consumePause()) {
      this.togglePause();
      return;
    }

    // Periodic Auto-Save throttled to 15.0s during active gameplay (state is also persisted on wave triggers & pause)
    this.saveProgressTimer = (this.saveProgressTimer || 0) + dt;
    if (this.saveProgressTimer >= 15.0) {
      this.saveProgressTimer = 0;
      this.saveProgress();
    }

    // 1. Update Camera, Background, Particles, HUD
    this.camera.update(dt);
    const playerYRatio = (this.player && this.player.y) ? (this.player.y / this.height) : 0.5;
    const playerPitch = (this.player && this.player.pitch) ? this.player.pitch : 0;
    this.bg.update(dt, 1, playerYRatio, playerPitch);
    this.particles.update(dt);
    this.hud.update(dt, this.player, this.boss);

    // 2. Update Player
    this.player.update(dt, input, this.particles);

    // Shooting
    if (input && input.isShooting()) {
      const newBullets = this.player.shoot(this.sound);
      if (newBullets) {
        this.bullets.push(...newBullets);
      }
    }

    // 2b. Weapon Drop Director: strictly spawns every 10-40 seconds under any condition (even during boss battles!)
    this.weaponDropTimer -= dt;
    if (this.weaponDropTimer <= 0) {
      this.spawnWeaponDrop();
      this.weaponDropTimer = this.getRandomWeaponDropInterval();
    }

    // 3. Stage & Wave Director
    this.updateStageDirector(dt);

    // 4. Update Bullets (with boss target tracking for homing missiles)
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      if (b.dead) continue;
      const alive = b.update(dt, this.enemies, this.particles, this.player, this.boss, this);
      if (!alive) {
        // Player Flak Bomb detonation
        if (b.type === 'FLAK' && !b.isEnemy) {
          this.detonateFlak(b);
        }
        // Enemy Bomb cluster burst
        else if (b.type === 'ENEMY_BOMB' && b.isEnemy) {
          this.detonateEnemyBomb(b);
        }
        b.dead = true;
      }
    }
    this.fastCompactBullets();

    // 5. Update Enemies (zero-allocation scratch array)
    this._extraEnemies.length = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      const alive = e.update(dt, this.player, this.bullets, this.sound, this._extraEnemies, this.particles);
      if (!alive) {
        e.dead = true;
      }
    }
    this.fastCompact(this.enemies);
    if (this._extraEnemies.length > 0) {
      this.enemies.push(...this._extraEnemies);
    }

    // 6. Update Boss (zero-allocation scratch array)
    if (this.boss) {
      this._extraBossEnemies.length = 0;
      const wasRage = this.boss.rageMode;
      const bossAlive = this.boss.update(dt, this.player, this.bullets, this.sound, this.camera, this.particles, this._extraBossEnemies, this.enemies);
      if (this._extraBossEnemies.length > 0) {
        for (const e of this._extraBossEnemies) {
          if (e.formationId && !this.formationsTracker.has(e.formationId)) {
            const count = this._extraBossEnemies.filter(x => x.formationId === e.formationId).length;
            this.formationsTracker.set(e.formationId, { total: count, killed: 0 });
          }
        }
        this.enemies.push(...this._extraBossEnemies);
      }

      // Boss Enrage / Overload transition notification
      if (!wasRage && this.boss.rageMode) {
        this.camera.addTrauma(0.7);
        if (this.sound.setBossRage) this.sound.setBossRage(true);
        this.hud.showBanner('PERINGATAN BAHAYA!', 'BOSS MENGAMUK (ENRAGED) - SERANGAN MENINGKAT!', 3.5, '#ff1744');
      }

      if (!bossAlive && this.boss.dead) {
        this.handleBossDefeated();
      }
    }

    // 7. Update Collectibles
    for (let i = 0; i < this.collectibles.length; i++) {
      const c = this.collectibles[i];
      if (c.dead) continue;
      const alive = c.update(dt, this.player);
      if (!alive) {
        c.dead = true;
      }
    }
    this.fastCompact(this.collectibles);

    // 8. Collisions
    this.handleCollisions();
  }

  fastCompactBullets() {
    const array = this.bullets;
    let write = 0;
    const len = array.length;
    for (let read = 0; read < len; read++) {
      const item = array[read];
      if (!item.dead) {
        if (write !== read) {
          array[write] = item;
        }
        write++;
      } else {
        Bullet.release(item);
      }
    }
    array.length = write;
  }

  fastCompact(array) {
    let write = 0;
    const len = array.length;
    for (let read = 0; read < len; read++) {
      const item = array[read];
      if (!item.dead) {
        if (write !== read) {
          array[write] = item;
        }
        write++;
      }
    }
    array.length = write;
  }

  scheduleEnemy(delaySeconds, enemyOptions) {
    const opts = Object.assign({}, enemyOptions);
    this.scheduleSpawn(delaySeconds, () => {
      this.enemies.push(new Enemy(Object.assign({}, opts, {
        difficultyConfig: this.getEffectiveEnemyDifficultyConfig(),
        stage: this.currentStage
      })));
    }, { type: 'ENEMY', enemyOptions: opts });
  }

  scheduleFormation(delaySeconds, count, startY, formationId) {
    this.scheduleSpawn(delaySeconds, () => {
      this.spawnScoutFormation(count, startY, formationId);
    }, { type: 'FORMATION', count, startY, formationId });
  }

  scheduleWeaponCapsule(delaySeconds, x, y) {
    this.scheduleSpawn(delaySeconds, () => {
      this.spawnWeaponCapsule(x, y);
    }, { type: 'WEAPON_CAPSULE', x, y });
  }

  spawnWeaponCapsule(x, y) {
    this.collectibles.push(new PowerUpCapsule(x, y));
  }

  scheduleSpawn(delaySeconds, actionFn, descriptor = null) {
    let desc = descriptor;
    if (!desc && typeof actionFn === 'function') {
      desc = this._extractSpawnDescriptor(actionFn);
    }
    this.spawnQueue.push({ timer: delaySeconds, action: actionFn, descriptor: desc });
  }

  _extractSpawnDescriptor(fn) {
    if (!fn) return null;
    const str = fn.toString();
    // 1. Check if it's an enemy spawn
    const enemyMatch = str.match(/Enemy\s*\(\s*(\{[\s\S]*?\})\s*\)/);
    if (enemyMatch) {
      try {
        const opts = new Function(`return (${enemyMatch[1]});`)();
        return { type: 'ENEMY', enemyOptions: opts };
      } catch (e) {}
    }
    // 2. Check if it's spawnScoutFormation
    const formMatch = str.match(/spawnScoutFormation\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*([^\)]+)\)/);
    if (formMatch) {
      try {
        const count = parseInt(formMatch[1], 10);
        const startY = parseInt(formMatch[2], 10);
        let fid = formMatch[3].trim().replace(/^['"]|['"]$/g, '');
        return { type: 'FORMATION', count, startY, formationId: fid };
      } catch (e) {}
    }
    // 2b. Check if it's spawnVFormation
    const vformMatch = str.match(/spawnVFormation\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*([^\)]+)\)/);
    if (vformMatch) {
      try {
        const count = parseInt(vformMatch[1], 10);
        const startY = parseInt(vformMatch[2], 10);
        let fid = vformMatch[3].trim().replace(/^['"]|['"]$/g, '');
        return { type: 'V_FORMATION', count, startY, formationId: fid };
      } catch (e) {}
    }
    // 3. Check if it's spawnWeaponCapsule
    const capMatch = str.match(/spawnWeaponCapsule\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (capMatch) {
      return { type: 'WEAPON_CAPSULE', x: parseInt(capMatch[1], 10), y: parseInt(capMatch[2], 10) };
    }
    return null;
  }

  _recreateSpawnAction(desc) {
    if (!desc) return null;
    switch (desc.type) {
      case 'ENEMY':
      case 'FORMATION_ENEMY':
        return () => {
          this.enemies.push(new Enemy(Object.assign({}, desc.enemyOptions, {
            difficultyConfig: this.getEffectiveEnemyDifficultyConfig(),
            stage: this.currentStage
          })));
        };
      case 'FORMATION':
        return () => {
          this.spawnScoutFormation(desc.count, desc.startY, desc.formationId);
        };
      case 'V_FORMATION':
        return () => {
          this.spawnVFormation(desc.count, desc.startY, desc.formationId);
        };
      case 'CAPSULE':
      case 'WEAPON_CAPSULE':
        return () => {
          this.spawnWeaponCapsule(desc.x, desc.y);
        };
      default:
        return null;
    }
  }

  updateStageDirector(dt) {
    if (this.boss) return; // Boss battle takes precedence

    // Handle stage transition delay
    if (this.isTransitioningStage) {
      this.stageTransitionTimer -= dt;
      if (this.stageTransitionTimer <= 0) {
        this.isTransitioningStage = false;
        this.advanceToNextStage();
      }
      return;
    }

    // Process scheduled spawns
    for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
      const item = this.spawnQueue[i];
      item.timer -= dt;
      if (item.timer <= 0) {
        item.action();
        this.spawnQueue.splice(i, 1);
      }
    }

    const effDiff = this.difficultyConfig || {};
    const waveInterval = effDiff.waveInterval || 10.0;

    // Check if wave is in progress
    if (this.waveInProgress) {
      const isSpawningComplete = (this.spawnQueue.length === 0);

      // Countdown wave otomatis hanya dimulai saat semua musuh wave saat ini selesai dimunculkan
      if (isSpawningComplete) {
        this.waveTimer += dt;
      } else {
        this.waveTimer = 0;
      }

      const isClearedEarly = (isSpawningComplete && this.enemies.length === 0);
      const isTimeUp = (isSpawningComplete && this.waveTimer >= waveInterval);

      if (this.currentWave < this.totalWavesInStage) {
        const cfg = this.currentStageConfig;
        const isBossPreWave = Boolean(cfg && cfg.isBossStage && this.currentWave === 1);

        if (isBossPreWave) {
          // Stage 5 Wave 1 Fruit Harvest: provide breathing window to harvest drops
          if (this.bossPreWaveGraceTimer !== null && this.bossPreWaveGraceTimer !== undefined) {
            this.bossPreWaveGraceTimer -= dt;
            if (this.bossPreWaveGraceTimer <= 0) {
              this.bossPreWaveGraceTimer = null;
              this.currentWave++;
              this.waveTimer = 0;
              this.sound.playBossAlarm();
              this.sound.setBossMode(true, cfg.biome, cfg.bossType);
              if (this.bg && this.bg.setBossMode) this.bg.setBossMode(true, cfg.bossType);
              this.camera.addTrauma(0.5);
              this.hud.showBanner('PERINGATAN BAHAYA!', `${cfg.title} MUNCUL!`, 3.5, '#ff1744');
              this.spawnCurrentWave();
            }
          } else if (isTimeUp || isClearedEarly) {
            this.bossPreWaveGraceTimer = 5.0; // 5.0 seconds breathing space to collect fruit!
            this.hud.showBanner('PANEN BUAH SELESAI!', 'AMBIL SEMUA BUAH SEBELUM BOS MUNCUL! ⏱️', 3.2, '#ffd54f');
          }
        } else {
          // Standard wave transition
          if (isTimeUp || isClearedEarly) {
            this.currentWave++;
            this.waveTimer = 0;
            if (cfg.isBossStage && this.currentWave === this.totalWavesInStage) {
              this.sound.playBossAlarm();
              this.sound.setBossMode(true, cfg.biome, cfg.bossType);
              if (this.bg && this.bg.setBossMode) this.bg.setBossMode(true, cfg.bossType);
              this.camera.addTrauma(0.5);
              this.hud.showBanner('PERINGATAN BAHAYA!', `${cfg.title} MUNCUL!`, 3.5, '#ff1744');
            }
            this.spawnCurrentWave();
          }
        }
      } else {
        // Final wave of the stage
        const cfg = this.currentStageConfig;
        if (!cfg.isBossStage && isSpawningComplete && this.enemies.length === 0) {
          this.handleStageCleared();
          return;
        }
      }
      return;
    }

    // Spawn first wave after small initial breathing pause
    if (!this.waveInProgress && this.currentWave <= this.totalWavesInStage) {
      this.waveTimer += dt;
      if (this.waveTimer > 1.2) {
        this.waveInProgress = true;
        this.waveTimer = 0;
        this.spawnCurrentWave();
      }
    }
  }

  spawnCurrentWave() {
    const cfg = this.currentStageConfig;
    const waveIndex = this.currentWave - 1;
    const waveFn = cfg.waves[waveIndex];

    if (waveFn) {
      const fid = `form_s${this.currentStage}_w${this.currentWave}_${Date.now()}`;
      waveFn(this, fid);
    }
    this.saveProgress();
  }

  spawnBoss(bossType) {
    const cfg = this.currentStageConfig;
    this.sound.playBossAlarm();
    this.sound.transitionToBoss(cfg.biome, bossType);
    this.camera.addTrauma(0.6);
    const effDiff = this.getEffectiveEnemyDifficultyConfig();
    const rageThreshold = effDiff.bossRageThreshold || 0.30;
    const hpMult = effDiff.hpMult !== undefined ? effDiff.hpMult : 1.0;
    this.boss = new Boss(this.width, this.height, bossType, { rageThreshold, hpMult });

    // Pastikan arena bos bersih dari musuh yang tidak sesuai
    if (bossType === 'GOLIATH_ZEPPELIN') {
      // HANYA perbolehkan 2 jenis musuh World 2: FALCON_TRACKER dan STINGER (maksimal 4)
      this.enemies = this.enemies.filter(e => !e.dead && (e.type === 'FALCON_TRACKER' || e.type === 'STINGER')).slice(0, 4);
    } else if (bossType === 'DREADNOUGHT') {
      // Bersihkan musuh sisa pre-boss agar arena World 1 murni fokus pada Dreadnought & Pink Scouts
      this.enemies = this.enemies.filter(e => !e.dead && e.type === 'SCOUT');
    } else if (bossType === 'OMEGA_COLOSSUS' || bossType === 'OMEGA_CORE_SPAWN') {
      // Pastikan arena World 4 murni diisi minion kosmis World 4
      this.enemies = this.enemies.filter(e => !e.dead && (e.type === 'COSMIC_ORBITER' || e.type === 'VOID_STALKER' || e.type === 'WARP_FLANKER')).slice(0, 4);
    }
  }

  spawnBossFruitBurst(bossX, bossY, count = 12) {
    this.sound.playPowerUpCollect();
    this.camera.addTrauma(0.5);
    this.particles.createFloatingText(bossX, Math.max(90, bossY - 60), '💥 HUJAN BUAH SUPER! 🍉🍒🍌🍇', '#ffd54f');

    for (let i = 0; i < count; i++) {
      // 360-degree radial explosion with strong upward fountain bias
      const angle = (Math.PI * 2 * (i / count)) + (Math.random() - 0.5) * 0.4;
      const speed = 220 + Math.random() * 450;
      const vx = Math.cos(angle) * speed;
      // Upward burst bias
      const vy = Math.sin(angle) * speed - 160 - Math.random() * 220;

      // Select fruit with tierBoost = 2 (rich high-tier & special distribution)
      const fruitType = getRandomFruitType(2);

      this.collectibles.push(new FruitDrop(
        bossX + (Math.random() - 0.5) * 50,
        bossY + (Math.random() - 0.5) * 50,
        fruitType,
        this.currentStage,
        {
          isBossDrop: true,
          vx,
          vy,
          gravity: 480 + Math.random() * 120,
          bounce: 0.65 + Math.random() * 0.1,
          friction: 0.988,
          groundFriction: 0.86,
          vRot: (Math.random() - 0.5) * 14,
          life: 14.0 + Math.random() * 4.0
        }
      ));
    }
  }

  handleBossDefeated() {
    const bossType = this.boss.bossType;
    const bossX = this.boss.x;
    const bossY = this.boss.y;
    this.boss = null;
    const cfg = this.currentStageConfig;

    // Trigger massive realistic fruit burst on boss defeat (jumlah disesuaikan 1/3, skor x3)!
    this.spawnBossFruitBurst(bossX, bossY, bossType === 'OMEGA_COLOSSUS' ? 10 : (bossType === 'OMEGA_CORE_SPAWN' || this.currentStage === this.totalStages ? 15 : 12));

    // Check if Stage 20 Phase 1 Colossus was defeated -> Emerge Phase 2 Child Boss!
    if (bossType === 'OMEGA_COLOSSUS') {
      this.camera.addTrauma(0.95);
      this.sound.playExplosion('large');
      this.sound.playBossAlarm();
      this.particles.createClaySplat(bossX, bossY, 65, '#d500f9', '#ff1744');
      this.particles.createClaySplat(bossX, bossY, 45, '#00e5ff', '#ffffff');
      this.particles.createFloatingText(640, 320, '⚠️ TERAS PECAH! INTI MUTAN TELAH BANGKIT!', '#ff1744');
      this.hud.showBanner(
        'PERINGATAN ANCAMAN TERTINGGI!',
        'TERAS PECAH! ANAK MUTAN KELUAR DARI DALAM CORE (800 HP)!',
        4.5,
        '#ff1744'
      );

      // Spawn Phase 2 Continuation Boss: "THE OMEGA APEX CORE"
      const effDiff = this.getEffectiveEnemyDifficultyConfig();
      const rageThreshold = effDiff.bossRageThreshold || 0.30;
      const hpMult = effDiff.hpMult !== undefined ? effDiff.hpMult : 1.0;
      this.boss = new Boss(this.width, this.height, 'OMEGA_CORE_SPAWN', { rageThreshold, hpMult });
      this.boss.x = bossX;
      this.boss.y = bossY;
      this.boss.entering = false;
      this.sound.transitionToBoss(cfg.biome, 'OMEGA_CORE_SPAWN');
      return;
    }

    this.sound.transitionToBiome(cfg.biome, false);

    // Bersihkan peluru musuh dan minion sisa agar pemain tidak tertembak saat selebrasi stage clear
    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      if (b.isEnemy && !b.dead) {
        b.dead = true;
        this.particles.createClaySplat(b.x, b.y, 4, '#ffca28', '#ff6f00');
      }
    }
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e.dead) {
        e.dead = true;
        this.particles.createClaySplat(e.x, e.y, 14, e.color || '#ff5722', e.shadowColor || '#bf360c');
        this.sound.playExplosion('small');
      }
    }

    // Penambahan nyawa setiap berhasil mengalahkan boss (hanya jika diizinkan di mode ini)
    if (this.difficultyConfig && this.difficultyConfig.bossGrantsLife) {
      const lifeAmount = this.difficultyConfig.bossLifeAmount !== undefined ? this.difficultyConfig.bossLifeAmount : 1;
      if (lifeAmount > 0) {
        this.player.lives += lifeAmount;
        this.sound.playExtraLife();
        this.camera.addTrauma(0.4);
        this.particles.createClaySplat(this.player.x, this.player.y, 25, '#ffd54f', '#66bb6a');
        this.particles.createFloatingText(this.player.x, this.player.y - 40, `+${lifeAmount} NYAWA (BERHASIL LEWATI WORLD)!`, '#69f0ae');
      }
    }

    if (bossType === 'OMEGA_CORE_SPAWN' || this.currentStage === this.totalStages) {
      // Final Boss Defeated!
      const diffMult = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
        ? this.difficultyConfig.scoreMultiplier
        : 1.0;
      const baseFinalBonus = 350000;
      const finalVictoryBonus = Math.round(baseFinalBonus * diffMult);
      const earned = this.addPlayerScore(finalVictoryBonus, true);
      this.particles.createFloatingText(640, 360, `+${formatInt(earned)} FINAL VICTORY BONUS!`, '#ffd54f');
      this.triggerVictory();
    } else {
      // World Boss Defeated (Stage 5, 10, or 15)
      let baseBonus = 25000;
      if (bossType === 'LEVIATHAN_TITAN') baseBonus = 120000;
      else if (bossType === 'GOLIATH_ZEPPELIN') baseBonus = 60000;
      const diffMult = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
        ? this.difficultyConfig.scoreMultiplier
        : 1.0;
      const bossBonus = Math.round(baseBonus * diffMult);
      const earned = this.addPlayerScore(bossBonus, true);
      this.particles.createFloatingText(640, 360, `+${formatInt(earned)} BOSS CLEARED!`, '#ffd54f');
      this.handleStageCleared();
    }
  }

  handleStageCleared() {
    // 1. Base bonus stage clear disesuaikan dengan redenominasi skor (2.500 * stage)
    const baseBonus = this.currentStage * 2500;

    // 2. Sistem logika: multiplier skor dari world terlebih dahulu (World 1: 1.0x, World 2: 2.0x, World 3: 3.0x, World 4: 4.0x)
    const worldMultiplier = getWorldMultiplier ? getWorldMultiplier(this.currentStage) : Math.min(4, Math.max(1, Math.floor((this.currentStage - 1) / 5) + 1));
    const bonusAfterWorld = Math.round(baseBonus * worldMultiplier);

    // 3. Multiplier skor dari difficulty berikutnya
    const diffMultiplier = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
      ? this.difficultyConfig.scoreMultiplier
      : 1.0;
    const finalBonus = Math.round(bonusAfterWorld * diffMultiplier);

    // 4. Tambahkan skor pemain (isRaw = true agar tidak dikalikan berulang di addScore)
    const earned = this.addPlayerScore(finalBonus, true);
    this.sound.playPowerUpCollect();

    this.hud.showBanner(
      `STAGE ${this.currentStage} SELESAI!`,
      `BONUS SKOR: +${formatInt(earned)}! (World ${worldMultiplier}x • ${this.difficulty} ${diffMultiplier}x)`,
      3.5,
      '#66bb6a'
    );

    this.isTransitioningStage = true;
    this.stageTransitionTimer = 3.0;
  }

  advanceToNextStage() {
    this.currentStage++;
    Enemy.currentStage = this.currentStage;

    if (this.currentStage > this.totalStages) {
      this.triggerVictory();
      return;
    }

    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.bossPreWaveGraceTimer = null;
    this.spawnQueue = [];
    this.formationsTracker.clear();

    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);
    if (this.bg && this.bg.setBossMode) this.bg.setBossMode(false);
    this.sound.transitionToBiome(cfg.biome, false);

    this.hud.showBanner(`STAGE ${this.currentStage}: ${cfg.title}`, cfg.subtitle, 3.5);

    if (this.uiHooks && this.uiHooks.onStageChanged) {
      this.uiHooks.onStageChanged(this.currentStage, this.totalStages, cfg);
    }
    this.saveProgress();
  }

  spawnScoutFormation(count, startY, formationId, options = {}) {
    this.formationsTracker.set(formationId, { total: count, killed: 0 });

    const fromBehind = options.fromBehind || false;
    const startX = fromBehind ? -60 : (options.x !== undefined ? options.x : 1320);
    const interval = options.interval !== undefined ? options.interval : 0.38;

    for (let i = 0; i < count; i++) {
      const enemyOpts = Object.assign({
        type: 'SCOUT',
        x: startX,
        y: startY,
        formationId,
        stage: this.currentStage,
        isLastInFormation: (i === count - 1)
      }, options);
      if (fromBehind && options.vx === undefined) {
        enemyOpts.vx = 240;
      }
      this.scheduleEnemy(i * interval, enemyOpts);
    }
  }

  spawnVFormation(count, centerY, formationId, options = {}) {
    this.formationsTracker.set(formationId, { total: count, killed: 0 });
    const startX = options.x !== undefined ? options.x : 1340;
    const spacingX = options.spacingX || 48;
    const spacingY = options.spacingY || 42;
    const half = Math.floor(count / 2);

    for (let i = 0; i < count; i++) {
      const offset = Math.abs(i - half);
      const enemyX = startX + offset * spacingX;
      const enemyY = centerY + (i - half) * spacingY;

      const enemyOpts = Object.assign({
        type: 'SCOUT',
        x: enemyX,
        y: enemyY,
        baseY: enemyY,
        waveAmp: 55,
        waveFreq: 0.045,
        formationId,
        stage: this.currentStage,
        isLastInFormation: (i === count - 1)
      }, options);

      const delay = (enemyX - startX) / 320;
      this.scheduleEnemy(Math.max(0, delay), enemyOpts);
    }
  }

  spawnFruitCarrierWave(count, world = 1) {
    const lanes = [150, 250, 360, 470, 580];
    const delayPerShip = count >= 36 ? 0.28 : (count >= 28 ? 0.35 : (count >= 20 ? 0.44 : 0.55));

    for (let i = 0; i < count; i++) {
      const laneY = lanes[i % lanes.length] + ((Math.floor(i / lanes.length) % 2 === 1) ? 22 : -22);
      const delay = i * delayPerShip;
      this.scheduleEnemy(delay, {
        type: 'FRUIT_CARRIER',
        x: 1320 + (i % 2) * 35,
        y: laneY,
        waveFreq: 0.032 + (i % 3) * 0.004,
        waveAmp: 22 + (i % 4) * 6
      });
    }
  }

  detonateFlak(b) {
    this.sound.playExplosion('small');
    this.camera.addTrauma(0.2);
    this.particles.createClaySplat(b.x, b.y, 16, '#fbc02d', '#ff3d00');

    // Tier A+ Demolition: 10 high-velocity shrapnel pellets with 0.70s life
    const step = (Math.PI * 2) / 10;
    for (let a = 0; a < Math.PI * 2; a += step) {
      this.bullets.push(new Bullet({
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        damage: 2.20,
        type: 'FLAK_SHRAPNEL',
        radius: 5,
        life: 0.70
      }));
    }

    // Shrapnel blast wave neutralizes standard enemy bullets in 55px radius
    for (let bi = 0; bi < this.bullets.length; bi++) {
      const eb = this.bullets[bi];
      if (!eb.dead && eb.isEnemy && eb.type !== 'ENEMY_BOMB' && eb.type !== 'ENEMY_MORTAR') {
        const dx = eb.x - b.x;
        const dy = eb.y - b.y;
        if (dx * dx + dy * dy <= 3025) { // 55px radius
          eb.dead = true;
          this.particles.createClaySplat(eb.x, eb.y, 4, '#ffb300', '#ffffff');
        }
      }
    }
  }

  detonateEnemyBomb(b) {
    this.sound.playExplosion('small');
    this.particles.createClaySplat(b.x, b.y, 10, '#5d4037', '#271612');

    // 4 clay shrapnel pellets in cardinal directions
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const a of angles) {
      this.bullets.push(new Bullet({
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * 320,
        vy: Math.sin(a) * 320,
        radius: 6,
        isEnemy: true,
        life: 1.2
      }));
    }
  }

  detonateMine(e) {
    this.sound.playExplosion('small');
    this.camera.addTrauma(0.2);
    this.particles.createClaySplat(e.x, e.y, 14, '#37474f', '#212121');

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      this.bullets.push(new Bullet({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * 280,
        vy: Math.sin(a) * 280,
        radius: 6,
        isEnemy: true,
        life: 1.5
      }));
    }
  }

  handleCollisions() {
    const bullets = this.bullets;
    const enemies = this.enemies;
    const collectibles = this.collectibles;
    const player = this.player;
    const px = player.x;
    const py = player.y;
    const pr = player.radius;

    // A. Player Bullets vs Enemies & Boss
    const bulletCount = bullets.length;
    const enemyCount = enemies.length;

    // Fast-path pre-indexing for SPREAD eraser: collect active standard enemy bullets
    let enemyBulletCount = 0;
    for (let bi = 0; bi < bulletCount; bi++) {
      const b = bullets[bi];
      if (!b.dead && b.isEnemy && b.type !== 'ENEMY_BOMB' && b.type !== 'ENEMY_MORTAR') {
        this._enemyBulletsBuffer[enemyBulletCount++] = b;
      }
    }

    for (let bi = 0; bi < bulletCount; bi++) {
      const b = bullets[bi];
      if (b.dead || b.isEnemy) continue;

      const bx = b.x;
      const by = b.y;
      const br = b.radius;

      // Tier A+ SPREAD: Defensive Bullet-Eraser (Cancels standard enemy projectiles via fast indexed buffer)
      if (b.type === 'SPREAD') {
        for (let ebi = 0; ebi < enemyBulletCount; ebi++) {
          const eb = this._enemyBulletsBuffer[ebi];
          if (eb.dead) continue;
          const edx = eb.x - bx;
          const edy = eb.y - by;
          const rCancel = br + eb.radius + 5; // [🟢 BUFF] Expanded for distant full-screen clearing
          if (edx >= -rCancel && edx <= rCancel && edy >= -rCancel && edy <= rCancel) {
            if (edx * edx + edy * edy < rCancel * rCancel) {
              eb.dead = true;
              b.dead = true;
              this.particles.createClaySplat(eb.x, eb.y, 6, '#ef5350', '#ffffff');
              this.sound.playEnemyHit();
              break;
            }
          }
        }
        if (b.dead) continue;
      }

      // 1. Bullets vs Enemies (AABB fast rejection + squared distance)
      for (let ei = 0; ei < enemyCount; ei++) {
        const e = enemies[ei];
        if (e.dead) continue;

        const rSum = e.radius + br;
        const dx = e.x - bx;
        if (dx < -rSum || dx > rSum) continue;
        const dy = e.y - by;
        if (dy < -rSum || dy > rSum) continue;

        if (dx * dx + dy * dy < rSum * rSum) {
          this.sound.playEnemyHit();
          if (b.type === 'PLASMA') {
            this.particles.createElectricSpark(bx, by, 4, '#ea80fc', '#ffffff');
            if (typeof e.applyPlasmaSlow === 'function') e.applyPlasmaSlow(1.5);
          } else {
            this.particles.createClaySplat(bx, by, 4, e.color, e.shadowColor);
          }

          const killed = e.takeDamage(b.damage, bx, b.piercing, b.type);
          if (killed) {
            this.handleEnemyDeath(e);
          }

          // HOMING micro-splash: deals 0.70 area damage within 24px radius
          if (b.type === 'HOMING') {
            this.particles.createSmokePuff(bx, by, 3, 12);
            const splashR = 24;
            const splashRSq = splashR * splashR;
            for (let si = 0; si < enemyCount; si++) {
              const se = enemies[si];
              if (se.dead || se === e) continue;
              const sdx = se.x - bx;
              const sdy = se.y - by;
              if (sdx * sdx + sdy * sdy <= splashRSq) {
                const splashKilled = se.takeDamage(0.70, bx, false, 'HOMING_SPLASH');
                if (splashKilled) this.handleEnemyDeath(se);
                this.particles.createClaySplat(se.x, se.y, 4, se.color, se.shadowColor);
              }
            }
          }

          if (!b.piercing) {
            if (b.type === 'FLAK') this.detonateFlak(b);
            b.dead = true;
            break;
          } else {
            b.hitsLeft--;
            if (b.type === 'PLASMA') {
              b.damage *= 0.60; // Plasma pierce damage decay
            } else if (b.type === 'LASER') {
              b.damage *= 0.55; // Laser pierce damage dissipation: Target 1: 2.0, Target 2: 1.1, Target 3: 0.6
            }
            if (b.hitsLeft <= 0) {
              b.dead = true;
              break;
            }
          }
        }
      }

      // 2. Bullets vs Boss (AABB fast rejection + squared distance)
      if (!b.dead && this.boss && !this.boss.dead) {
        const boss = this.boss;
        const rSum = boss.radius + br + 35;
        const dx = boss.x - bx;
        if (dx >= -rSum && dx <= rSum) {
          const dy = boss.y - by;
          if (dy >= -rSum && dy <= rSum) {
            if (dx * dx + dy * dy < rSum * rSum) {
              this.sound.playEnemyHit();
              this.camera.addTrauma(0.08);
              if (boss.isInvulnerable) {
                this.particles.createElectricSpark(bx, by, 8, '#00e5ff', '#ffffff');
              } else if (b.type === 'PLASMA') {
                this.particles.createElectricSpark(bx, by, 4, '#ea80fc', '#ffffff');
                if (typeof boss.applyPlasmaSlow === 'function') boss.applyPlasmaSlow(1.5);
              } else {
                this.particles.createClaySplat(bx, by, 5, '#90a4ae', '#37474f');
              }

              boss.takeDamage(b.damage, by, this.particles, this.sound, b.type);

              if (!b.piercing) {
                if (b.type === 'FLAK') this.detonateFlak(b);
                b.dead = true;
              } else {
                b.hitsLeft--;
                if (b.type === 'PLASMA') {
                  b.damage *= 0.60;
                } else if (b.type === 'LASER') {
                  b.damage *= 0.55;
                }
                if (b.hitsLeft <= 0) {
                  b.dead = true;
                }
              }
            }
          }
        }
      }
    }

    // B. Player vs Collectibles (AABB fast rejection + squared distance)
    const collectibleCount = collectibles.length;
    for (let ci = 0; ci < collectibleCount; ci++) {
      const c = collectibles[ci];
      if (c.dead) continue;

      const rSum = c.radius + pr;
      const dx = c.x - px;
      if (dx < -rSum || dx > rSum) continue;
      const dy = c.y - py;
      if (dy < -rSum || dy > rSum) continue;

      if (dx * dx + dy * dy < rSum * rSum) {
        c.dead = true;

        if (c instanceof PowerUpCapsule) {
          player.setWeapon(c.weaponType);
          this.sound.playPowerUpCollect();
          this.camera.addTrauma(0.15);
          this.particles.createClaySplat(px, py, 20, '#ffd54f', '#ff6f00');
          const worldMult = getWorldMultiplier ? getWorldMultiplier(this.currentStage) : 1.0;
          const baseCapsulePoints = Math.round(500 * worldMult);
          const earned = this.addPlayerScore(baseCapsulePoints);
          this.particles.createFloatingText(px, py - 30, `+ ${c.weaponType}! (+${formatInt(earned)})`, '#ffd54f');
        } else if (c instanceof FruitDrop) {
          this.sound.playFruitCollect();
          const earned = this.addPlayerScore(c.points);
          this.particles.createClaySplat(c.x, c.y, 14, '#81c784', '#2e7d32');
          this.particles.createFloatingText(c.x, c.y - 25, `${c.label || ''} +${formatInt(earned)}!`, '#ffd54f');
        } else if (c instanceof SpeedBoostDrop) {
          this.sound.playSpecialDropCollect();
          this.camera.addTrauma(0.15);
          this.particles.createClaySplat(c.x, c.y, 16, '#ffd54f', '#ff6f00');
          player.speedBoostActive = true;
          const addTime = player.speedBoostDurationPerDrop || 15.0;
          const maxTime = player.speedBoostMaxDuration || 15.0;
          player.speedBoostTimeLeft = Math.min(maxTime, (player.speedBoostTimeLeft || 0) + addTime);
          this.particles.createFloatingText(c.x, c.y - 25, '⚡ OVERDRIVE 1.5X!', '#ffd54f');
        }
      }
    }

    // C. Enemy Bullets vs Player (AABB fast rejection + squared distance)
    for (let bi = 0; bi < bulletCount; bi++) {
      const b = bullets[bi];
      if (b.dead || !b.isEnemy) continue;

      const rSum = pr + b.radius - 4;
      const dx = px - b.x;
      if (dx < -rSum || dx > rSum) continue;
      const dy = py - b.y;
      if (dy < -rSum || dy > rSum) continue;

      if (dx * dx + dy * dy < rSum * rSum) {
        b.dead = true;
        this.damagePlayer();
        break;
      }
    }

    // D. Enemies vs Player (Crash collision: AABB fast rejection + squared distance)
    for (let ei = 0; ei < enemyCount; ei++) {
      const e = enemies[ei];
      if (e.dead) continue;

      const rSum = pr + e.radius - 8;
      const dx = px - e.x;
      if (dx < -rSum || dx > rSum) continue;
      const dy = py - e.y;
      if (dy < -rSum || dy > rSum) continue;

      if (dx * dx + dy * dy < rSum * rSum) {
        this.damagePlayer();
        e.takeDamage(10);
        if (e.dead) this.handleEnemyDeath(e);
        break;
      }
    }

    // In-place single-pass compaction for all entity arrays with bullet pooling
    this.fastCompactBullets();
    this.fastCompact(this.collectibles);
    this.fastCompact(this.enemies);
  }

  handleEnemyDeath(e) {
    // Special Stage 5 Wave 1 Fruit Carrier Death: bursts into a fountain of 2-3 fruits (disesuaikan 1/3, skor x3)!
    if (e.type === 'FRUIT_CARRIER') {
      this.sound.playExplosion('small');
      this.sound.playPowerUpCollect();
      this.camera.addTrauma(0.18);
      this.particles.createClaySplat(e.x, e.y, 22, '#ffd54f', '#ff9800');
      const earned = this.addPlayerScore(e.scoreValue);
      this.particles.createFloatingText(e.x, e.y - 30, `🍉 PANEN BUAH! +${formatInt(earned)}`, '#ffd54f');

      // Explosive fountain of 2 to 3 multi-tier fruits!
      const fruitCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < fruitCount; i++) {
        const angle = (Math.PI * 2 * (i / fruitCount)) + (Math.random() - 0.5) * 0.5;
        const speed = 140 + Math.random() * 200;
        const vx = Math.cos(angle) * speed - 60;
        const vy = Math.sin(angle) * speed - 120;
        const fType = getRandomFruitType(1);
        this.collectibles.push(new FruitDrop(
          e.x + (Math.random() - 0.5) * 20,
          e.y + (Math.random() - 0.5) * 20,
          fType,
          this.currentStage,
          {
            vx,
            vy,
            bounce: 0.6,
            life: 14.0
          }
        ));
      }
      return;
    }

    const isHeavy = (e.type === 'BLIMP' || e.type === 'GUNSHIP' || e.type === 'BOMBER' || e.type === 'SHIELD_CRUISER' || e.type === 'JUGGERNAUT' || e.type === 'ACE' || e.type === 'INTERCEPTOR' || e.type === 'VORTEX_DRONE');
    this.sound.playExplosion(isHeavy ? 'large' : 'small');
    this.camera.addTrauma(isHeavy ? 0.35 : 0.15);
    this.particles.createClaySplat(e.x, e.y, isHeavy ? 24 : 14, e.color, e.shadowColor);
    const earned = this.addPlayerScore(e.scoreValue);
    if (isHeavy) {
      this.particles.createFloatingText(e.x, e.y - 25, `+${formatInt(earned)}`, '#ffd54f');
    }

    // If Mine died, detonate into fragments
    if (e.type === 'MINE') {
      this.detonateMine(e);
    }

    // Extreme Mode Gimmick: Dead-man Revenge Bullets from Elite/Heavy enemies!
    if (this.difficultyConfig && this.difficultyConfig.revengeBullets && isHeavy && this.player && !this.player.dead) {
      const pAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      const revCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < revCount; i++) {
        const spread = (i - (revCount - 1) / 2) * 0.28;
        const ang = pAngle + spread;
        const bSpeed = 380 + Math.random() * 80;
        this.bullets.push(new Bullet({
          x: e.x,
          y: e.y,
          vx: Math.cos(ang) * bSpeed,
          vy: Math.sin(ang) * bSpeed,
          damage: 1,
          isEnemy: true,
          type: 'SNIPER_BEAM',
          radius: 5.5,
          color: '#e040fb',
          glowColor: '#7b1fa2'
        }));
      }
    }

    // Formation tracking for Fruit Drops (peluang dibagi 3: 1/3 peluang drop)
    if (e.formationId && this.formationsTracker.has(e.formationId)) {
      const fInfo = this.formationsTracker.get(e.formationId);
      fInfo.killed++;
      if (fInfo.killed >= fInfo.total) {
        // Bonus fruits with tierBoost (peluang 1/3 atau 33.3%)
        if (Math.random() < (1.0 / 3)) {
          for (let i = 0; i < 2; i++) {
            const fType = getRandomFruitType(1);
            this.collectibles.push(new FruitDrop(
              e.x + (i === 0 ? -15 : 15),
              e.y + (i === 0 ? -10 : 10),
              fType,
              this.currentStage,
              {
                vx: (i === 0 ? -140 : -80) + (Math.random() - 0.5) * 40,
                vy: -130 - Math.random() * 80,
                bounce: 0.5
              }
            ));
          }
        }

        // Formation Clear Special Drop Roll (Sangat Langka: 6% Speed Boost)
        const hasSpeedOnScreen = this.collectibles.some(c => c instanceof SpeedBoostDrop && !c.dead);

        const rollSpecial = Math.random();
        if (!hasSpeedOnScreen && rollSpecial < 0.06) {
          this.collectibles.push(new SpeedBoostDrop(e.x + 20, e.y));
          if (this.sound && this.sound.playSpecialDropSpawn) this.sound.playSpecialDropSpawn();
          this.particles.createElectricSpark(e.x + 20, e.y, 12, '#ffd54f', '#ff9100');
        }

        this.particles.createFloatingText(e.x, e.y - 35, 'FORMATION CLEARED!', '#69f0ae');
      }
    }

    // Rebalanced fruit drop chance (peluang dibagi 3, skor buah naik 3x):
    // Heavy / Elite enemies: Peluang drop 1/3 (33.3%), peluang buah ke-2 15%
    // Regular enemies: Peluang drop 15% (45% dibagi 3)
    if (isHeavy) {
      if (Math.random() < (1.0 / 3)) {
        const fruitCount = Math.random() < 0.15 ? 2 : 1;
        for (let i = 0; i < fruitCount; i++) {
          const fType = getRandomFruitType(1);
          this.collectibles.push(new FruitDrop(
            e.x + (Math.random() - 0.5) * 20,
            e.y + (Math.random() - 0.5) * 20,
            fType,
            this.currentStage,
            {
              vx: (Math.random() - 0.65) * 160,
              vy: -140 - Math.random() * 100,
              bounce: 0.55
            }
          ));
        }
      }
    } else if (Math.random() < 0.15) {
      // Normal enemies drop fruit (15% drop chance)
      const fType = getRandomFruitType(0);
      this.collectibles.push(new FruitDrop(
        e.x,
        e.y,
        fType,
        this.currentStage,
        {
          vx: (Math.random() - 0.7) * 120,
          vy: -110 - Math.random() * 70,
          bounce: 0.45
        }
      ));
    }

    // Drop roll for tactical consumable: Speed Boost Overdrive
    const effDiff = this.difficultyConfig || {};
    const speedBoostChance = isHeavy 
      ? (effDiff.speedBoostHeavyDropChance !== undefined ? effDiff.speedBoostHeavyDropChance : 0.030)
      : (effDiff.speedBoostDropChance !== undefined ? effDiff.speedBoostDropChance : 0.007);

    // Cegah duplikasi jika item jenis tersebut sudah melayang aktif di layar
    const hasSpeedActive = this.collectibles.some(c => c instanceof SpeedBoostDrop && !c.dead);

    if (!hasSpeedActive && Math.random() < speedBoostChance) {
      this.collectibles.push(new SpeedBoostDrop(e.x + (Math.random() - 0.5) * 20, e.y));
      if (this.sound && this.sound.playSpecialDropSpawn) this.sound.playSpecialDropSpawn();
      this.particles.createElectricSpark(e.x, e.y, 14, '#ffd54f', '#ffffff');
    }
  }

  damagePlayer() {
    const lostLife = this.player.hit();
    if (lostLife) {
      this.sound.playExplosion('large');
      this.camera.addTrauma(0.6);
      this.particles.createClaySplat(this.player.x, this.player.y, 25, '#cfd8dc', '#e53935');

      if (this.player.lives <= 0 && !this.player.infiniteLives) {
        this.triggerGameOver();
      } else {
        this.player.respawn();
        // Anti-spawnkill recovery shockwave: clear nearby hostile bullets
        this.bullets = this.bullets.filter(b => {
          if (!b.isEnemy) return true;
          const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
          if (dist < 220) {
            this.particles.createElectricSpark(b.x, b.y, 4, '#00e5ff', '#ffffff');
            return false;
          }
          return true;
        });
        this.particles.createElectricSpark(this.player.x, this.player.y, 16, '#00e5ff', '#ffffff');
      }
    }
  }

  triggerGameOver() {
    this.clearSavedProgress();
    this.state = GAME_STATES.GAMEOVER;
    this.sound.onGameOver();
    if (this.hud) this.hud.flushHighScore();
    if (this.uiHooks.onGameOver) {
      this.uiHooks.onGameOver(
        Math.floor(this.player.score),
        this.currentStage,
        this.totalStages,
        this.currentWave,
        this.hud.highScore,
        this.difficultyConfig,
        this.isCheatActive()
      );
    }
  }

  triggerVictory() {
    this.clearSavedProgress();
    this.state = GAME_STATES.VICTORY;
    this.sound.onVictory();
    if (this.hud) this.hud.flushHighScore();
    this.hud.showBanner('MISI SELESAI!', `SELAMAT, SELURUH ${this.totalStages} STAGE TELAH DITAKLUKKAN!`, 5.0, '#66bb6a');
    if (this.uiHooks.onVictory) {
      this.uiHooks.onVictory(
        Math.floor(this.player.score),
        this.totalStages,
        this.difficultyConfig,
        this.isCheatActive()
      );
    }
  }

  render() {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    // 1. Parallax Clay Background (Rock-solid, completely free from camera/environment shake)
    this.bg.draw(this.ctx);

    // Camera shake (neutralized)
    this.camera.apply(this.ctx);

    // 1.5. Dynamic Altitude 3D Ground & Cloud Shadows (Multi-plane tactile depth)
    for (const c of this.collectibles) {
      if (c.drawShadow) c.drawShadow(this.ctx);
    }
    for (const e of this.enemies) {
      if (e.drawShadow) e.drawShadow(this.ctx);
    }
    if (this.boss && !this.boss.dead && this.boss.drawShadow) {
      this.boss.drawShadow(this.ctx);
    }
    if (this.player.lives > 0 && this.player.drawShadow) {
      this.player.drawShadow(this.ctx);
    }

    // 2. Collectibles
    for (const c of this.collectibles) {
      c.draw(this.ctx);
    }

    // 3. Enemies
    for (const e of this.enemies) {
      e.draw(this.ctx);
    }

    // 4. Boss
    if (this.boss && !this.boss.dead) {
      this.boss.draw(this.ctx);
    }

    // 5. Bullets
    for (const b of this.bullets) {
      b.draw(this.ctx);
    }

    // 6. Real-time 3D Claymation Layer (Player, Bosses, Enemies, Pickups, Bullets, Debris)
    if (this.scene3D) {
      if (this.scene3D.render(this)) {
        this.ctx.drawImage(this.scene3D.canvas, 0, 0, this.width, this.height);
      }
    } else if (this.player.lives > 0) {
      this.player.draw(this.ctx);
    }

    // 6.5. 2D Overlays on top of 3D entities (Jumbo enemy health bars & shield badges)
    for (const e of this.enemies) {
      if (e.drawOverlay) e.drawOverlay(this.ctx);
    }

    // 7. Particles
    this.particles.draw(this.ctx);

    // 7.5. Cinematic Atmosphere & Subtle Lens Vignette
    if (this.bg && this.bg.drawCinematicAtmosphere) {
      this.bg.drawCinematicAtmosphere(this.ctx);
    }

    // 8. HUD Overlay (inside the scaled UHD context so all text & graphics are crisp vector quality)
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.hud.draw(this.ctx, this.player, this.boss, {
        currentStage: this.currentStage,
        totalStages: this.totalStages,
        currentWave: this.currentWave,
        totalWaves: this.totalWavesInStage,
        waveTimer: this.waveTimer,
        waveInterval: (this.difficultyConfig && this.difficultyConfig.waveInterval) || 10.0,
        isBossStage: Boolean(this.currentStageConfig && this.currentStageConfig.isBossStage)
      });
    }

    this.ctx.restore();
  }
}
