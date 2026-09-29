// Main Game Engine, 15-Stage Director, Multi-Boss System & Collision Engine
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Bullet } from '../entities/Bullet.js';
import { PowerUpCapsule, FruitDrop, getRandomFruitType, FRUIT_CONFIGS, getWorldMultiplier } from '../entities/PowerUp.js';
import { ParticleSystem } from '../entities/Particle.js';
import { ParallaxBackground } from '../graphics/ParallaxBg.js';
import { Camera } from './Camera.js';
import { HUD } from '../ui/HUD.js';
import { SoundController } from './Sound.js';

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
    scoreIntervalForLife: 100000,
    hpMult: 0.75,
    shootCooldownMult: 1.20,
    bulletSpeedMult: 0.80,
    maxLives: 20,
    startingLives: 5,
    weaponDuration: 25.0,
    keepWeaponOnDeath: true,
    bossGrantsLife: true,
    bossLifeAmount: 2,
    weaponDropInterval: { min: 8.0, max: 20.0 },
    invulnerableDuration: 4.0,
    description: 'Pemula: Skor 0.25x, +1 Nyawa tiap 100k Skor & 2 Nyawa/Boss, HP Musuh 0.75x, Peluru Lambat'
  },
  EASY: {
    id: 'EASY',
    name: 'EASY',
    label: 'MUDAH',
    badgeColor: '#43a047',
    textColor: '#a5d6a7',
    scoreMultiplier: 0.5,
    scoreIntervalForLife: 500000,
    hpMult: 1.0,
    shootCooldownMult: 1.00,
    bulletSpeedMult: 0.90,
    maxLives: 15,
    startingLives: 3,
    weaponDuration: 20.0,
    keepWeaponOnDeath: true,
    bossGrantsLife: true,
    bossLifeAmount: 1,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    invulnerableDuration: 3.0,
    description: 'Santai: Skor 0.5x, +1 Nyawa tiap 500k Skor & Boss, Peluru Halus, Senjata 20s Tak Hancur Saat Mati'
  },
  NORMAL: {
    id: 'NORMAL',
    name: 'NORMAL',
    label: 'NORMAL',
    badgeColor: '#f57c00',
    textColor: '#ffe082',
    scoreMultiplier: 1.0,
    scoreIntervalForLife: 2000000,
    hpMult: 1.0,
    shootCooldownMult: 1.0,
    bulletSpeedMult: 1.0,
    maxLives: 10,
    startingLives: 3,
    weaponDuration: 15.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: true,
    bossLifeAmount: 1,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    invulnerableDuration: 2.5,
    description: 'Klasik Arcade: Skor 1x, +1 Nyawa tiap 2 Juta Skor & Boss, Senjata 15s (Hancur Saat Mati)'
  },
  HARD: {
    id: 'HARD',
    name: 'HARD',
    label: 'SULIT',
    badgeColor: '#e53935',
    textColor: '#ffab91',
    scoreMultiplier: 2.0,
    scoreIntervalForLife: 10000000,
    hpMult: 1.0,
    shootCooldownMult: 0.85,
    bulletSpeedMult: 1.15,
    maxLives: 5,
    startingLives: 3,
    weaponDuration: 10.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: false,
    bossLifeAmount: 0,
    weaponDropInterval: { min: 20.0, max: 40.0 },
    invulnerableDuration: 2.0,
    description: 'Tantangan Hardcore: Skor 2x, +1 Nyawa tiap 10 Juta Skor, Peluru Cepat & Rapat, Boss Tanpa Nyawa'
  },
  EXTREME: {
    id: 'EXTREME',
    name: 'EXTREME',
    label: 'EKSTREM',
    badgeColor: '#ab47bc',
    textColor: '#f3e5f5',
    scoreMultiplier: 5.0,
    scoreIntervalForLife: 50000000,
    hpMult: 1.5,
    shootCooldownMult: 0.75,
    bulletSpeedMult: 1.30,
    maxLives: 3,
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
    description: 'Neraka Tanah Liat: Skor 5x, HP Musuh 1.5x, +1 Nyawa tiap 50 Juta Skor, Peluru Brutal & Revenge Shots!'
  }
};

// 15-Stage Campaign Configuration
export const STAGE_CONFIGS = [
  // --- WORLD 1: CLAY VALLEY (Stages 1 - 5) ---
  {
    stage: 1,
    title: 'LEMBAH TANAH LIAT',
    subtitle: 'MISI 1: SAPU PENYELIDIK MUSUH',
    biome: 'VALLEY',
    waves: [
      (game, fid) => {
        game.spawnScoutFormation(5, 260, fid);
      },
      (game, fid) => {
        game.spawnScoutFormation(5, 180, fid);
        game.scheduleSpawn(1.5, () => game.spawnScoutFormation(5, 420, fid + '_b'));
      },
      (game, fid) => {
        game.spawnScoutFormation(6, 280, fid);
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 180 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 460 })));
      }
    ]
  },
  {
    stage: 2,
    title: 'SERANGAN KUMBANG',
    subtitle: 'WASPADA PENUKIK CEPAT BERACUN',
    biome: 'VALLEY',
    waves: [
      (game) => {
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 120 + i * 140 }));
          });
        }
      },
      (game, fid) => {
        game.spawnScoutFormation(5, 220, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.2 + i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 420 - i * 100 }));
          });
        }
      },
      (game, fid) => {
        game.spawnScoutFormation(6, 340, fid);
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(0.8 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 150 + i * 120 }));
          });
        }
      }
    ]
  },
  {
    stage: 3,
    title: 'ARMADA MERIAM BIRU',
    subtitle: 'KAPAL TEMPUR GUNSHIP DENGAN 3 PENYEBARAN',
    biome: 'VALLEY',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 280 }));
        game.spawnScoutFormation(4, 460, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 200 }));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1350, y: 480 })));
      },
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 320 }));
        game.spawnScoutFormation(5, 180, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 450 + i * 60 }));
          });
        }
      }
    ]
  },
  {
    stage: 4,
    title: 'KONVOI BALON UDARA',
    subtitle: 'HANCURKAN BALON TEMPUR ZEPPELIN',
    biome: 'VALLEY',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 260 }));
        game.spawnScoutFormation(5, 480, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 220 }));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 460 })));
      },
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 360 }));
        game.spawnScoutFormation(5, 180, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 200 + i * 140 }));
          });
        }
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
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 240 }));
        game.spawnScoutFormation(5, 420, fid);
      },
      (game) => {
        game.spawnBoss('DREADNOUGHT');
      }
    ]
  },

  // --- WORLD 2: SUNSET CANYON (Stages 6 - 10) ---
  {
    stage: 6,
    title: 'NGARAI TANAH SENJA',
    subtitle: 'WASPADA TAWON STINGER YANG MELUNCUR KENCANG',
    biome: 'CANYON',
    waves: [
      (game) => {
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 160 + i * 130 }));
          });
        }
      },
      (game, fid) => {
        game.spawnScoutFormation(5, 240, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 380 + (i % 2 === 0 ? 80 : -80) }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 280 }));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.6 + i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 160 }));
          });
        }
      }
    ]
  },
  {
    stage: 7,
    title: 'LORONG PENEMBAK JITU',
    subtitle: 'HINDARI GARIS BIDIK LASER MERAH SNIPER!',
    biome: 'CANYON',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1350, y: 500 }));
        game.spawnScoutFormation(4, 350, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1320, y: 240 }));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.5 + i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 400 + i * 70 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 320 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 160 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 480 })));
      }
    ]
  },
  {
    stage: 8,
    title: 'HUJAN BOM TANAH LIAT',
    subtitle: 'WASPADAI PELEMPAR BOM BERUNTUN DARI ATAS',
    biome: 'CANYON',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 160 }));
        game.spawnScoutFormation(5, 420, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 140 }));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1350, y: 240 })));
        for (let i = 0; i < 2; i++) {
          game.scheduleSpawn(1.0 + i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 480 + i * 70 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 160 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 460 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 300 })));
      }
    ]
  },
  {
    stage: 9,
    title: 'BADAI CAKRAM BERPUTAR',
    subtitle: 'HINDARI CAKRAM GERGAJI SPINNER MEMANTUL',
    biome: 'CANYON',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 520 }));
        game.spawnScoutFormation(4, 350, fid);
      },
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 220 + i * 130 }));
          });
        }
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 150 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 300 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 520 })));
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
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 480 }));
      },
      (game) => {
        game.spawnBoss('GOLIATH_ZEPPELIN');
      }
    ]
  },

  // --- WORLD 3: MIDNIGHT CYBER-CLAY (Stages 11 - 15) ---
  {
    stage: 11,
    title: 'BENTENG MALAM CYBER',
    subtitle: 'TEMBUS PERISAI ENERGI SHIELD CRUISER & SERANGAN SNIPER!',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: First Shield Cruiser frontline with scout formation
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 260 }));
        game.spawnScoutFormation(6, 480, fid);
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 160 })));
      },
      // Wave 2: Shield Cruiser with Sniper pressure and diving Stingers
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 200 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 500 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 320 })));
        game.scheduleSpawn(2.0, () => game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 })));
      },
      // Wave 3: Dual Shield Cruisers screening a Gunship
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1350, y: 460 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 320 })));
      },
      // Wave 4: Fortified Climax: Dual Shield Cruisers, Double Snipers and Stinger Swarm
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.scheduleSpawn(0.5, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 440 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 530 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.8 + i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 180 + i * 140 }));
          });
        }
      }
    ]
  },
  {
    stage: 12,
    title: 'MEDAN RANJAU TERAPUNG',
    subtitle: 'RANJAU PELEDAK PADAT, CAKRAM SPINNER & GAYA TARIK VORTEX!',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Mine Layer deployment with scout squadron
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 240 }));
        game.spawnScoutFormation(6, 420, fid);
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 160 })));
      },
      // Wave 2: Mine Layer shielded by Cruiser and Spinner distraction
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 200 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 480 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 340 })));
      },
      // Wave 3: Double Mine Layers creating cross-minefield with Sniper
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 320 })));
      },
      // Wave 4: Spinner crossfire + Vortex Drone gravity trap
      (game) => {
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 480 }));
        game.scheduleSpawn(0.7, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 330 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 250 })));
      },
      // Wave 5: Minefield Climax: Dual Mine Layers, Shield Cruiser and dual Snipers
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 440 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 330 })));
        game.scheduleSpawn(1.1, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 520 })));
      }
    ]
  },
  {
    stage: 13,
    title: 'SKUADRON ELIT EMAS & JET SILUMAN',
    subtitle: 'AKROBATIK ACE, JET INTERCEPTOR & ANOMALI VORTEX: 6 GELOMBANG!',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Ace & Interceptor squad
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 160 + i * 160 }));
          });
        }
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 320 })));
      },
      // Wave 2: Shield Cruiser with Vortex Drones
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 300 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 180 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 440 })));
      },
      // Wave 3: Double Mine Layers & Snipers with Interceptor dive
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 330 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 260 })));
      },
      // Wave 4: Bombers & Spinners
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 480 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1340, y: 330 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 220 })));
      },
      // Wave 5: Stinger Swarm & Dual Interceptors
      (game) => {
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(i * 0.45, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 140 + i * 130 }));
          });
        }
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 200 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 460 })));
      },
      // Wave 6: Elite Squadron Climax: Juggernaut Mini-Boss + Escorts
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1340, y: 330 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 240 })));
      }
    ]
  },

  // --- STAGE 14: THE EXTENDED GAUNTLET (Marathon Stage!) ---
  {
    stage: 14,
    title: 'SERANGAN TOTAL: GAUNTLET MARATON',
    subtitle: 'STAGE MARATON EKSTREM: PERTAHANKAN DIRI DARI 10 GELOMBANG MUSUH!',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Swarm & Interceptor
      (game, fid) => {
        game.spawnScoutFormation(6, 260, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 160 }));
          });
        }
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 340 })));
      },
      // Wave 2: Gunships, Snipers & Vortex Drone
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 480 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 320 })));
      },
      // Wave 3: Bombers, Spinners & Drone Escort
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 160 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 480 }));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 200 + i * 120 }));
          });
        }
      },
      // Wave 4: Heavy Juggernaut & Shield Cruiser
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 320 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 180 })));
      },
      // Wave 5: Mine Layers, Aces & Vortex Drone
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 340 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 180 })));
      },
      // Wave 6: Twin Blimp Dreadnoughts & Escort Aces
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 200 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 460 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 330 })));
      },
      // Wave 7: Quad Interceptor Firing Squad
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 160 + i * 170 }));
          });
        }
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 420 })));
      },
      // Wave 8: Double Shield Cruisers & Bombers
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 150 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 510 })));
      },
      // Wave 9: Stinger Storm & Juggernaut Mortar Barrage
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 300 }));
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(0.5 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 140 + i * 140 }));
          });
        }
      },
      // Wave 10: Supreme Gauntlet Climax!
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 240 }));
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1350, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 180 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 330 })));
      }
    ]
  },

  // --- STAGE 15: THE ULTIMATE TITAN (World 3 Boss) ---
  {
    stage: 15,
    title: 'TITAN LEVIATHAN',
    subtitle: 'BOSS DUNIA 3: THE ULTIMATE CLAY LEVIATHAN',
    biome: 'CYBER_NIGHT',
    isBossStage: true,
    bossType: 'LEVIATHAN_TITAN',
    waves: [
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 }));
      },
      (game) => {
        game.spawnBoss('LEVIATHAN_TITAN');
      }
    ]
  },

  // --- WORLD 4: THE COSMIC SINGULARITY (Stages 16 - 20) ---
  {
    stage: 16,
    title: 'GERBANG RUANG KOSMIS',
    subtitle: 'MEMASUKI ANGKASA HAMPARAN KOSMOS PENUH ANCAMAN',
    biome: 'COSMIC_VOID',
    waves: [
      (game, fid) => {
        game.spawnScoutFormation(6, 250, fid);
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(0.5 + i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 140 }));
          });
        }
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 320 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 180 }));
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 540 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 340 })));
      },
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 300 }));
        game.spawnScoutFormation(6, 450, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160 + i * 140 }));
          });
        }
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 220 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 320 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 180 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 460 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 200 }));
        game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 330 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.2 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 160 + i * 150 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 340 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 180 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
      }
    ]
  },
  {
    stage: 17,
    title: 'BENTENG SIBER BERLAPIS BAJA',
    subtitle: 'TEMBUS FORMASI PENGAWAL BERPERISAI & JUGGERNAUT: 7 GELOMBANG',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 480 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1350, y: 340 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 270 })));
      },
      // Wave 2
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 330 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 520 })));
      },
      // Wave 3
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 300 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 160 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 480 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 180 + i * 130 }));
          });
        }
      },
      // Wave 4
      (game) => {
        game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 340 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 180 })));
      },
      // Wave 5
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 240 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 480 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 360 })));
      },
      // Wave 6
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 240 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 480 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 360 })));
      },
      // Wave 7
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 340 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 500 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 260 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 420 })));
      }
    ]
  },
  {
    stage: 18,
    title: 'SKUADRON BADAI BINTANG EKSTREM',
    subtitle: 'SKUADRON ACE & INTERCEPTOR ELIT: 8 GELOMBANG SENGIT!',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Ace & Interceptor Blitz
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 160 + i * 180 }));
          });
        }
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 320 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 480 })));
      },
      // Wave 2: Blimp with Snipers & Spinners
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 280 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 150 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 450 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 300 })));
      },
      // Wave 3: Juggernaut with Shield Cruisers & Stingers
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 320 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.2 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 160 }));
          });
        }
      },
      // Wave 4: Interceptor Squadron & Vortex Drones
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1320, y: 180 + i * 150 }));
          });
        }
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 240 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 440 })));
      },
      // Wave 5: Bombers, Mine Layers & Aces
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 480 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 340 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 160 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 520 })));
      },
      // Wave 6: Dual Juggernauts with Snipers
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 220 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 460 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 340 })));
      },
      // Wave 7: Quad Ace Loopers & Stinger Storm
      (game) => {
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 140 + i * 140 }));
          });
        }
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(1.0 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 130 }));
          });
        }
      },
      // Wave 8: Climax Star Fleet Assault!
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 240 }));
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1350, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 160 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 340 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 500 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 280 })));
      }
    ]
  },
  {
    stage: 19,
    title: 'BARIKADE TERAKHIR SINGULARITAS',
    subtitle: 'GAUNTLET KOSMIS MARATON: 10 GELOMBANG SPAM BULLET-HELL EKSTREM!',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1: Scout Swarm + Stingers + Interceptors
      (game, fid) => {
        game.spawnScoutFormation(8, 260, fid);
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(0.5 + i * 0.4, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 140 + i * 140 }));
          });
        }
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 200 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 480 })));
      },
      // Wave 2: Quad Snipers, Bombers & Vortex Drone
      (game) => {
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 150 }));
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 520 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 330 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 240 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 440 })));
      },
      // Wave 3: Shield Cruisers, Spinners & Mine Layers
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 520 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 340 })));
      },
      // Wave 4: Double Blimps & Interceptors
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 220 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 480 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 340 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 160 })));
        game.scheduleSpawn(2.0, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 520 })));
      },
      // Wave 5: Relentless Swarm - Stingers, Aces & Vortex Drone
      (game) => {
        for (let i = 0; i < 5; i++) {
          game.scheduleSpawn(i * 0.35, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 130 + i * 120 }));
          });
        }
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 340 })));
      },
      // Wave 6: Heavy Fortress - Dual Juggernauts & Shield Cruisers
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 220 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 340 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 160 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 520 })));
      },
      // Wave 7: Bullet-Hell Spiral - Spinners, Bombers & Interceptors
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 180 + i * 160 }));
          });
        }
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 240 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 440 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 340 })));
      },
      // Wave 8: Aerial Dreadnoughts - Blimps & Juggernaut Barrage
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 240 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 460 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 180 })));
        game.scheduleSpawn(1.6, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 520 })));
      },
      // Wave 9: Hyper-Spam Blitz - Quad Aces & Triple Interceptors
      (game) => {
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(i * 0.45, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 150 + i * 140 }));
          });
        }
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 200 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 480 })));
        for (let i = 0; i < 4; i++) {
          game.scheduleSpawn(1.2 + i * 0.35, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 160 + i * 130 }));
          });
        }
      },
      // Wave 10: Supreme Pre-Boss Climax Gauntlet!
      (game) => {
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 220 }));
        game.enemies.push(new Enemy({ type: 'JUGGERNAUT', x: 1350, y: 460 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 340 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 180 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 500 })));
        game.scheduleSpawn(1.8, () => game.enemies.push(new Enemy({ type: 'INTERCEPTOR', x: 1340, y: 260 })));
        game.scheduleSpawn(2.2, () => game.enemies.push(new Enemy({ type: 'VORTEX_DRONE', x: 1340, y: 420 })));
        game.scheduleSpawn(2.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 340 })));
      }
    ]
  },

  // --- STAGE 20: THE FINAL CLIMAX (Final Boss!) ---
  {
    stage: 20,
    title: 'KOLOSUS CLAY OMEGA',
    subtitle: 'FINAL CLIMAX BOSS: THE OMEGA CLAY COLOSSUS',
    biome: 'COSMIC_VOID',
    isBossStage: true,
    bossType: 'OMEGA_COLOSSUS',
    waves: [
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 460 }));
      },
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
  maxLives: 20, // 1 to 50

  // Score Interval for +1 Extra Life
  overrideScoreInterval: false,
  scoreIntervalForLife: 2000000, // 100k to 50M

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
    this.hud = new HUD();
    this.hud.setDifficulty(this.difficulty, this.difficultyConfig);
    this.hud.setCheatActive(this.isCheatActive());

    Enemy.difficultyConfig = this.getEffectiveEnemyDifficultyConfig();

    this.player = new Player(this.width, this.height);
    this.player.reset(this.difficultyConfig, this.getCheatOverrides());

    // Update physical canvas size according to UHD DPR
    this.updateCanvasDimensions();
    window.addEventListener('resize', () => this.updateCanvasDimensions());

    // Entity lists
    this.bullets = [];
    this.enemies = [];
    this.collectibles = [];
    this.boss = null;

    // 20-Stage System State
    this.currentStage = 1;
    this.totalStages = STAGE_CONFIGS.length; // 20
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.stageTransitionTimer = 0;
    this.isTransitioningStage = false;
    this.spawnQueue = [];
    this.formationsTracker = new Map();

    // Weapon Drop Timer according to difficulty interval
    this.weaponDropTimer = this.getRandomWeaponDropInterval();

    // State
    this.state = GAME_STATES.MENU;
    this.lastTime = performance.now();

    requestAnimationFrame((t) => this.loop(t));
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
      maxLives: parseInt(this.cheatConfig.maxLives, 10) || 20,

      overrideScoreInterval: Boolean(this.cheatConfig.overrideScoreInterval),
      scoreIntervalForLife: parseInt(this.cheatConfig.scoreIntervalForLife, 10) || 2000000,

      overrideWeaponDuration: Boolean(this.cheatConfig.overrideWeaponDuration),
      infiniteWeaponDuration: Boolean(this.cheatConfig.infiniteWeaponDuration),
      weaponDuration: parseFloat(this.cheatConfig.weaponDuration) || 15
    };
  }

  getEffectiveEnemyDifficultyConfig() {
    const base = Object.assign({}, this.difficultyConfig || DIFFICULTY_CONFIGS.NORMAL);
    // When cheat is disabled, strictly return difficulty config!
    if (!this.isCheatActive()) {
      return base;
    }
    // Only apply overrides when master cheat is ON AND individual override toggle is ON
    if (this.cheatConfig.overrideEnemyHp && this.cheatConfig.enemyHpMult !== undefined) {
      base.hpMult = parseFloat(this.cheatConfig.enemyHpMult) || 1.0;
    }
    if (this.cheatConfig.overrideShootCooldown && this.cheatConfig.enemyShootCooldownMult !== undefined) {
      base.shootCooldownMult = parseFloat(this.cheatConfig.enemyShootCooldownMult) || 1.0;
    }
    if (this.cheatConfig.overrideBulletSpeed && this.cheatConfig.enemyBulletSpeedMult !== undefined) {
      base.bulletSpeedMult = parseFloat(this.cheatConfig.enemyBulletSpeedMult) || 1.0;
    }
    return base;
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

  goToMainMenu() {
    this.state = GAME_STATES.MENU;
    this.sound.goToMainMenu();
    this.sound.setBossMode(false);
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
    this.sound.init();
    this.sound.setBossMode(false);
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
    this.stageTransitionTimer = 0;
    this.isTransitioningStage = false;
    this.formationsTracker.clear();

    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);
    // Professional Soundtrack Restart Logic:
    // Guarantees soundtrack is initialized, un-ducked, and playing cleanly from beat 1 for this stage
    this.sound.restartMusic({ biome: cfg.biome, isBoss: false });

    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();
    this.hud.showBanner(`STAGE ${startStage}: ${cfg.title}`, cfg.subtitle, 3.5);

    if (this.uiHooks && this.uiHooks.onStageChanged) {
      this.uiHooks.onStageChanged(this.currentStage, this.totalStages, cfg);
    }
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
      const scoreIntervalFormatted = (this.player.scoreIntervalForLife || 2000000).toLocaleString();
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
      this.bg.update(dt * 0.4);
    } else if (this.state === GAME_STATES.MENU) {
      this.bg.update(dt * 0.4);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const input = this.uiHooks.input;

    if (input && input.consumePause()) {
      this.togglePause();
      return;
    }

    // 1. Update Camera, Background, Particles, HUD
    this.camera.update(dt);
    this.bg.update(dt);
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
    this.fastCompact(this.bullets);

    // 5. Update Enemies
    const extraEnemies = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      const alive = e.update(dt, this.player, this.bullets, this.sound, extraEnemies);
      if (!alive) {
        e.dead = true;
      }
    }
    this.fastCompact(this.enemies);
    if (extraEnemies.length > 0) {
      this.enemies.push(...extraEnemies);
    }

    // 6. Update Boss
    if (this.boss) {
      const extraBossEnemies = [];
      const wasRage = this.boss.rageMode;
      const bossAlive = this.boss.update(dt, this.player, this.bullets, this.sound, this.camera, this.particles, extraBossEnemies);
      if (extraBossEnemies.length > 0) {
        this.enemies.push(...extraBossEnemies);
      }

      // Boss Enrage / Overload transition notification
      if (!wasRage && this.boss.rageMode) {
        this.camera.addTrauma(0.7);
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

  scheduleSpawn(delaySeconds, actionFn) {
    this.spawnQueue.push({ timer: delaySeconds, action: actionFn });
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

    this.waveTimer += dt;

    // Check if current wave is cleared
    if (this.waveInProgress && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveInProgress = false;
      this.waveTimer = 0;
      this.currentWave++;

      // If all waves in current stage cleared
      if (this.currentWave > this.totalWavesInStage) {
        this.handleStageCleared();
        return;
      } else {
        const cfg = this.currentStageConfig;
        if (cfg.isBossStage && this.currentWave === this.totalWavesInStage) {
          // Boss wave alert
          this.sound.playBossAlarm();
          this.sound.setBossMode(true);
          this.camera.addTrauma(0.5);
          this.hud.showBanner('PERINGATAN BAHAYA!', `${cfg.title} MUNCUL!`, 3.5, '#ff1744');
        }
        // No large center banner on regular wave transitions to avoid interrupting player vision
      }
      return;
    }

    // Spawn next wave after small breathing pause
    if (!this.waveInProgress && this.currentWave <= this.totalWavesInStage && this.waveTimer > 1.2) {
      this.waveInProgress = true;
      this.spawnCurrentWave();
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
  }

  spawnBossFruitBurst(bossX, bossY, count = 35) {
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

    // Trigger massive realistic fruit burst on boss defeat!
    this.spawnBossFruitBurst(bossX, bossY, bossType === 'OMEGA_COLOSSUS' ? 30 : (bossType === 'OMEGA_CORE_SPAWN' || this.currentStage === this.totalStages ? 45 : 35));

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
        'TERAS PECAH! ANAK MUTAN KELUAR DARI DALAM CORE (1200 HP)!',
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

    // Penambahan nyawa setiap berhasil mengalahkan boss (hanya jika diizinkan di mode ini)
    if (this.difficultyConfig && this.difficultyConfig.bossGrantsLife) {
      const lifeAmount = this.difficultyConfig.bossLifeAmount !== undefined ? this.difficultyConfig.bossLifeAmount : 1;
      const actualAdded = Math.min(lifeAmount, this.player.maxLives - this.player.lives);
      if (actualAdded > 0) {
        this.player.lives += actualAdded;
        this.sound.playExtraLife();
        this.camera.addTrauma(0.4);
        this.particles.createClaySplat(this.player.x, this.player.y, 25, '#ffd54f', '#66bb6a');
        this.particles.createFloatingText(this.player.x, this.player.y - 40, `+${actualAdded} NYAWA (BERHASIL LEWATI WORLD)!`, '#69f0ae');
      }
    }

    if (bossType === 'OMEGA_CORE_SPAWN' || this.currentStage === this.totalStages) {
      // Final Boss Defeated!
      const diffMult = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
        ? this.difficultyConfig.scoreMultiplier
        : 1.0;
      const baseFinalBonus = 3500000;
      const finalVictoryBonus = Math.round(baseFinalBonus * diffMult);
      const earned = this.addPlayerScore(finalVictoryBonus, true);
      this.particles.createFloatingText(640, 360, `+${earned.toLocaleString()} FINAL VICTORY BONUS!`, '#ffd54f');
      this.triggerVictory();
    } else {
      // World Boss Defeated (Stage 5, 10, or 15)
      let baseBonus = 250000;
      if (bossType === 'LEVIATHAN_TITAN') baseBonus = 1200000;
      else if (bossType === 'GOLIATH_ZEPPELIN') baseBonus = 600000;
      const diffMult = (this.difficultyConfig && this.difficultyConfig.scoreMultiplier !== undefined)
        ? this.difficultyConfig.scoreMultiplier
        : 1.0;
      const bossBonus = Math.round(baseBonus * diffMult);
      const earned = this.addPlayerScore(bossBonus, true);
      this.particles.createFloatingText(640, 360, `+${earned.toLocaleString()} BOSS CLEARED!`, '#ffd54f');
      this.handleStageCleared();
    }
  }

  handleStageCleared() {
    // 1. Base bonus dinaikkan untuk balancing game (dari sebelumnya 2.500 * stage menjadi 25.000 * stage)
    const baseBonus = this.currentStage * 25000;

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
      `BONUS SKOR: +${earned.toLocaleString()}! (World ${worldMultiplier}x • ${this.difficulty} ${diffMultiplier}x)`,
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
    this.spawnQueue = [];
    this.formationsTracker.clear();

    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);
    this.sound.transitionToBiome(cfg.biome, false);

    this.hud.showBanner(`STAGE ${this.currentStage}: ${cfg.title}`, cfg.subtitle, 3.5);

    if (this.uiHooks && this.uiHooks.onStageChanged) {
      this.uiHooks.onStageChanged(this.currentStage, this.totalStages, cfg);
    }
  }

  spawnScoutFormation(count, startY, formationId) {
    this.formationsTracker.set(formationId, { total: count, killed: 0 });

    for (let i = 0; i < count; i++) {
      this.scheduleSpawn(i * 0.38, () => {
        this.enemies.push(new Enemy({
          type: 'SCOUT',
          x: 1320,
          y: startY,
          formationId,
          stage: this.currentStage,
          isLastInFormation: (i === count - 1)
        }));
      });
    }
  }

  detonateFlak(b) {
    this.sound.playExplosion('small');
    this.camera.addTrauma(0.2);
    this.particles.createClaySplat(b.x, b.y, 14, '#fbc02d', '#ff3d00');

    // Tier A+ Demolition: 8 high-velocity shrapnel pellets with extended life (0.65s)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      this.bullets.push(new Bullet({
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        damage: 1.3,
        type: 'FLAK_SHRAPNEL',
        radius: 5,
        life: 0.65
      }));
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

    for (let bi = 0; bi < bulletCount; bi++) {
      const b = bullets[bi];
      if (b.dead || b.isEnemy) continue;

      const bx = b.x;
      const by = b.y;
      const br = b.radius;

      // Tier A+ SPREAD: Defensive Bullet-Eraser (Cancels standard enemy projectiles)
      if (b.type === 'SPREAD') {
        for (let ebi = 0; ebi < bulletCount; ebi++) {
          const eb = bullets[ebi];
          if (eb.dead || !eb.isEnemy) continue;
          // Erase standard enemy bullets and sniper needles (except heavy bombs and mortars)
          if (eb.type !== 'ENEMY_BOMB' && eb.type !== 'ENEMY_MORTAR') {
            const edx = eb.x - bx;
            const edy = eb.y - by;
            const rCancel = br + eb.radius + 3;
            if (edx >= -rCancel && edx <= rCancel && edy >= -rCancel && edy <= rCancel) {
              if (edx * edx + edy * edy < rCancel * rCancel) {
                eb.dead = true;
                b.dead = true;
                this.particles.createClaySplat(eb.x, eb.y, 5, '#ef5350', '#ffffff');
                this.sound.playEnemyHit();
                break;
              }
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
          } else {
            this.particles.createClaySplat(bx, by, 4, e.color, e.shadowColor);
          }

          const killed = e.takeDamage(b.damage, bx, b.piercing, b.type);
          if (killed) {
            this.handleEnemyDeath(e);
          }

          if (!b.piercing) {
            if (b.type === 'FLAK') this.detonateFlak(b);
            b.dead = true;
            break;
          } else {
            b.hitsLeft--;
            if (b.type === 'PLASMA') {
              b.damage *= 0.65; // Plasma pierce damage decay
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
                  b.damage *= 0.65;
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
          const baseCapsulePoints = Math.round(5000 * worldMult);
          const earned = this.addPlayerScore(baseCapsulePoints);
          this.particles.createFloatingText(px, py - 30, `+ ${c.weaponType}! (+${earned.toLocaleString()})`, '#ffd54f');
        } else if (c instanceof FruitDrop) {
          this.sound.playFruitCollect();
          const earned = this.addPlayerScore(c.points);
          this.particles.createClaySplat(c.x, c.y, 14, '#81c784', '#2e7d32');
          this.particles.createFloatingText(c.x, c.y - 25, `${c.label || ''} +${earned.toLocaleString()}!`, '#ffd54f');
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

    // In-place single-pass compaction for all entity arrays
    this.fastCompact(this.bullets);
    this.fastCompact(this.collectibles);
    this.fastCompact(this.enemies);
  }

  handleEnemyDeath(e) {
    const isHeavy = (e.type === 'BLIMP' || e.type === 'GUNSHIP' || e.type === 'BOMBER' || e.type === 'SHIELD_CRUISER' || e.type === 'JUGGERNAUT' || e.type === 'ACE' || e.type === 'INTERCEPTOR' || e.type === 'VORTEX_DRONE');
    this.sound.playExplosion(isHeavy ? 'large' : 'small');
    this.camera.addTrauma(isHeavy ? 0.35 : 0.15);
    this.particles.createClaySplat(e.x, e.y, isHeavy ? 24 : 14, e.color, e.shadowColor);
    const earned = this.addPlayerScore(e.scoreValue);
    if (isHeavy) {
      this.particles.createFloatingText(e.x, e.y - 25, `+${earned.toLocaleString()}`, '#ffd54f');
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

    // Formation tracking for Fruit Drops
    if (e.formationId && this.formationsTracker.has(e.formationId)) {
      const fInfo = this.formationsTracker.get(e.formationId);
      fInfo.killed++;
      if (fInfo.killed >= fInfo.total) {
        // Guaranteed 2 bonus fruits with tierBoost
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
        this.particles.createFloatingText(e.x, e.y - 35, 'FORMATION CLEARED!', '#69f0ae');
      }
    }

    // Significant increase in fruit drop chance from enemy elimination:
    // Heavy / Elite enemies: Guaranteed 100% drop of 1-2 fruits!
    // Regular enemies: High 45% drop chance!
    if (isHeavy) {
      const fruitCount = Math.random() < 0.45 ? 2 : 1;
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
    } else if (Math.random() < 0.45) {
      // Normal enemies drop fruit frequently
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
      }
    }
  }

  triggerGameOver() {
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(this.dpr, this.dpr);

    // 1. Parallax Clay Background (Rock-solid, completely free from camera/environment shake)
    this.bg.draw(this.ctx);

    // Camera shake (neutralized)
    this.camera.apply(this.ctx);

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

    // 6. Player
    if (this.player.lives > 0) {
      this.player.draw(this.ctx);
    }

    // 7. Particles
    this.particles.draw(this.ctx);

    // 8. HUD Overlay (inside the scaled UHD context so all text & graphics are crisp vector quality)
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.hud.draw(this.ctx, this.player, this.boss, { currentStage: this.currentStage, totalStages: this.totalStages });
    }

    this.ctx.restore();
  }
}
