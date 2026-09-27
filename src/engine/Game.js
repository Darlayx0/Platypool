// Main Game Engine, 15-Stage Director, Multi-Boss System & Collision Engine
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Bullet } from '../entities/Bullet.js';
import { PowerUpCapsule, FruitDrop } from '../entities/PowerUp.js';
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
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD'
};

export const DIFFICULTY_CONFIGS = {
  EASY: {
    id: 'EASY',
    name: 'EASY',
    label: 'MUDAH',
    badgeColor: '#43a047',
    textColor: '#a5d6a7',
    maxLives: 15,
    scoreIntervalForLife: 100000,
    weaponDuration: 20.0,
    keepWeaponOnDeath: true,
    bossGrantsLife: true,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    description: 'Santai: Max 15 Nyawa, Senjata 20s (Tak Hancur Saat Mati), +1 Nyawa tiap 100k Skor & Boss'
  },
  NORMAL: {
    id: 'NORMAL',
    name: 'NORMAL',
    label: 'NORMAL',
    badgeColor: '#f57c00',
    textColor: '#ffe082',
    maxLives: 10,
    scoreIntervalForLife: 250000,
    weaponDuration: 15.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: true,
    weaponDropInterval: { min: 10.0, max: 40.0 },
    description: 'Klasik Arcade: Max 10 Nyawa, Senjata 15s (Hancur Saat Mati), +1 Nyawa tiap 250k Skor & Boss'
  },
  HARD: {
    id: 'HARD',
    name: 'HARD',
    label: 'SULIT',
    badgeColor: '#e53935',
    textColor: '#ffab91',
    maxLives: 5,
    scoreIntervalForLife: 500000,
    weaponDuration: 10.0,
    keepWeaponOnDeath: false,
    bossGrantsLife: false,
    weaponDropInterval: { min: 20.0, max: 40.0 },
    description: 'Tantangan Hardcore: Max 5 Nyawa, Senjata 10s (Drop 20-40s), +1 Nyawa tiap 500k Skor, Boss Tanpa Nyawa'
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
    subtitle: 'TEMBUS PERISAI ENERGI SHIELD CRUISER!',
    biome: 'CYBER_NIGHT',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 260 }));
        game.spawnScoutFormation(5, 480, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 200 }));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 500 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 240 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1350, y: 480 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 120 + i * 180 }));
          });
        }
      }
    ]
  },
  {
    stage: 12,
    title: 'MEDAN RANJAU TERAPUNG',
    subtitle: 'HANCURKAN DRONE PENEBAR RANJAU SEBELUM TERLALU PADAT',
    biome: 'CYBER_NIGHT',
    waves: [
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 240 }));
        game.spawnScoutFormation(5, 420, fid);
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 200 }));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 480 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 320 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 520 })));
      }
    ]
  },
  {
    stage: 13,
    title: 'SKUADRON ELIT EMAS',
    subtitle: 'PILOT ACE MELAKUKAN AKROBATIK LOOP UDARA!',
    biome: 'CYBER_NIGHT',
    waves: [
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.9, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 180 + i * 160 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 460 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 220 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 340 })));
      }
    ]
  },

  // --- STAGE 14: THE EXTENDED GAUNTLET (Marathon Stage!) ---
  {
    stage: 14,
    title: 'SERANGAN TOTAL: GAUNTLET',
    subtitle: 'STAGE MARATON: PERTAHANKAN DIRI DARI 7 GELOMBANG MUSUH!',
    biome: 'CYBER_NIGHT',
    waves: [
      // Wave 1: Swarm
      (game, fid) => {
        game.spawnScoutFormation(6, 260, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.7, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 170 }));
          });
        }
      },
      // Wave 2: Gunships & Snipers
      (game) => {
        game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 240 }));
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 480 }));
      },
      // Wave 3: Bombers & Spinners
      (game) => {
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 150 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 450 }));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'DRONE', x: 1320, y: 220 + i * 110 }));
          });
        }
      },
      // Wave 4: Blimps & Shield Cruisers
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 260 }));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 480 })));
      },
      // Wave 5: Mine Layers & Aces
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 240 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 160 })));
      },
      // Wave 6: Heavy Bastion
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 140 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 520 })));
      },
      // Wave 7: Final All-Star Assault!
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 140 + i * 160 }));
          });
        }
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
          game.scheduleSpawn(0.6 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 150 + i * 140 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.4, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 540 })));
      },
      (game, fid) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 300 }));
        game.spawnScoutFormation(5, 450, fid);
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(0.8 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 160 + i * 140 }));
          });
        }
      }
    ]
  },
  {
    stage: 17,
    title: 'BENTENG SIBER BERLAPIS BAJA',
    subtitle: 'TEMBUS FORMASI PENGAWAL BERPERISAI GANDA',
    biome: 'COSMIC_VOID',
    waves: [
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 200 }));
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 480 }));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1350, y: 340 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1320, y: 460 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 140 })));
        game.scheduleSpawn(1.5, () => game.enemies.push(new Enemy({ type: 'BOMBER', x: 1340, y: 540 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 240 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.5, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 130 + i * 160 }));
          });
        }
      }
    ]
  },
  {
    stage: 18,
    title: 'SKUADRON BADAI BINTANG',
    subtitle: 'PILOT ACE ELIT MENGEPUNG DARI SEGALA SUDUT',
    biome: 'COSMIC_VOID',
    waves: [
      (game) => {
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(i * 0.8, () => {
            game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 160 + i * 180 }));
          });
        }
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 280 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 150 })));
        game.scheduleSpawn(1.2, () => game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 480 })));
      },
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 200 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 440 })));
        for (let i = 0; i < 3; i++) {
          game.scheduleSpawn(1.0 + i * 0.6, () => {
            game.enemies.push(new Enemy({ type: 'STINGER', x: 1320, y: 160 + i * 150 }));
          });
        }
      }
    ]
  },
  {
    stage: 19,
    title: 'BARIKADE TERAKHIR SINGULARITAS',
    subtitle: 'STAGE GAUNTLET KOSMIS: 5 GELOMBANG INTENSITAS TINGGI!',
    biome: 'COSMIC_VOID',
    waves: [
      // Wave 1
      (game, fid) => {
        game.spawnScoutFormation(6, 260, fid);
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
      },
      // Wave 2
      (game) => {
        game.enemies.push(new Enemy({ type: 'SNIPER', x: 1340, y: 160 }));
        game.enemies.push(new Enemy({ type: 'BOMBER', x: 1320, y: 460 }));
      },
      // Wave 3
      (game) => {
        game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1320, y: 220 }));
        game.enemies.push(new Enemy({ type: 'SPINNER', x: 1320, y: 480 }));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'MINE_LAYER', x: 1340, y: 350 })));
      },
      // Wave 4
      (game) => {
        game.enemies.push(new Enemy({ type: 'BLIMP', x: 1340, y: 260 }));
        game.scheduleSpawn(0.8, () => game.enemies.push(new Enemy({ type: 'GUNSHIP', x: 1320, y: 480 })));
      },
      // Wave 5
      (game) => {
        game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 180 }));
        game.scheduleSpawn(0.6, () => game.enemies.push(new Enemy({ type: 'ACE', x: 1320, y: 480 })));
        game.scheduleSpawn(1.0, () => game.enemies.push(new Enemy({ type: 'SHIELD_CRUISER', x: 1340, y: 330 })));
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
  infiniteLives: false,
  startingLives: 10, // 1 to 20
  infiniteWeaponDuration: false,
  weaponDuration: 15 // 5 to 60
};

export class Game {
  constructor(canvas, uiHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiHooks = uiHooks || {};

    this.width = canvas.width;
    this.height = canvas.height;

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

    this.player = new Player(this.width, this.height);
    this.player.reset(this.difficultyConfig, this.getCheatOverrides());

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

  isCheatActive() {
    return Boolean(this.cheatConfig && this.cheatConfig.enabled);
  }

  getCheatOverrides() {
    if (!this.isCheatActive()) return null;
    return {
      infiniteLives: Boolean(this.cheatConfig.infiniteLives),
      startingLives: parseInt(this.cheatConfig.startingLives, 10) || 10,
      infiniteWeaponDuration: Boolean(this.cheatConfig.infiniteWeaponDuration),
      weaponDuration: parseFloat(this.cheatConfig.weaponDuration) || 15
    };
  }

  setCheatConfig(newConfig) {
    this.cheatConfig = Object.assign({}, this.cheatConfig, newConfig);
    try {
      localStorage.setItem('platypus_cheat_config', JSON.stringify(this.cheatConfig));
    } catch (e) {}
    if (this.hud) {
      this.hud.setCheatActive(this.isCheatActive());
    }
    if (this.state === GAME_STATES.MENU && this.player) {
      this.player.reset(this.difficultyConfig, this.getCheatOverrides());
    }
  }

  goToMainMenu() {
    this.state = GAME_STATES.MENU;
    this.sound.stopMusic();
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
    this.currentWave = 1;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.stageTransitionTimer = 0;
    this.isTransitioningStage = false;
    this.formationsTracker.clear();

    const cfg = this.currentStageConfig;
    this.bg.setBiome(cfg.biome);
    this.sound.setBiome(cfg.biome, false);

    this.state = GAME_STATES.PLAYING;
    this.lastTime = performance.now();
    this.hud.showBanner(`STAGE ${startStage}: ${cfg.title}`, cfg.subtitle, 3.5);
  }

  restart() {
    this.start();
  }

  addPlayerScore(points) {
    const livesAwarded = this.player.addScore(points);
    if (livesAwarded > 0) {
      this.sound.playExtraLife();
      this.camera.addTrauma(0.35);
      this.particles.createClaySplat(this.player.x, this.player.y, 25, '#ffd54f', '#66bb6a');
      const scoreIntervalFormatted = (this.player.scoreIntervalForLife || 250000).toLocaleString();
      this.particles.createFloatingText(
        this.player.x,
        this.player.y - 35,
        `+${livesAwarded} NYAWA (${scoreIntervalFormatted} SKOR)!`,
        '#69f0ae'
      );
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      if (this.uiHooks.onPause) this.uiHooks.onPause(true);
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.lastTime = performance.now();
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
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
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
        this.bullets.splice(i, 1);
      }
    }

    // 5. Update Enemies
    const extraEnemies = [];
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const alive = e.update(dt, this.player, this.bullets, this.sound, extraEnemies);
      if (!alive || e.dead) {
        this.enemies.splice(i, 1);
      }
    }
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
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const alive = c.update(dt);
      if (!alive || c.dead) {
        this.collectibles.splice(i, 1);
      }
    }

    // 8. Collisions
    this.handleCollisions();
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
    this.sound.setBossMode(true, cfg.biome, bossType);
    this.camera.addTrauma(0.6);
    this.boss = new Boss(this.width, this.height, bossType);
  }

  handleBossDefeated() {
    const bossType = this.boss.bossType;
    this.boss = null;
    const cfg = this.currentStageConfig;
    this.sound.setBossMode(false, cfg.biome);

    // Penambahan nyawa setiap berhasil mengalahkan boss (hanya jika diizinkan di mode ini)
    if (this.difficultyConfig && this.difficultyConfig.bossGrantsLife) {
      if (this.player.lives < this.player.maxLives) {
        this.player.lives++;
        this.sound.playExtraLife();
        this.camera.addTrauma(0.4);
        this.particles.createClaySplat(this.player.x, this.player.y, 25, '#ffd54f', '#66bb6a');
        this.particles.createFloatingText(this.player.x, this.player.y - 40, '+1 NYAWA (BERHASIL LEWATI WORLD)!', '#69f0ae');
      }
    }

    if (bossType === 'OMEGA_COLOSSUS' || this.currentStage === this.totalStages) {
      // Final Boss Defeated!
      this.addPlayerScore(250000);
      this.particles.createFloatingText(640, 360, '+250,000 FINAL VICTORY BONUS!', '#ffd54f');
      this.triggerVictory();
    } else {
      // World Boss Defeated (Stage 5, 10, or 15)
      let bonus = 25000;
      if (bossType === 'LEVIATHAN_TITAN') bonus = 120000;
      else if (bossType === 'GOLIATH_ZEPPELIN') bonus = 60000;
      this.addPlayerScore(bonus);
      this.particles.createFloatingText(640, 360, `+${bonus.toLocaleString()} BOSS CLEARED!`, '#ffd54f');
      this.handleStageCleared();
    }
  }

  handleStageCleared() {
    const world = Math.min(4, Math.max(1, Math.floor((this.currentStage - 1) / 5) + 1));
    const bonus = Math.round(this.currentStage * 2500 * (1 + (world - 1) * 0.5));
    this.addPlayerScore(bonus);
    this.sound.playPowerUpCollect();

    this.hud.showBanner(
      `STAGE ${this.currentStage} SELESAI!`,
      `BONUS SKOR: +${bonus.toLocaleString()}! PERSIAPKAN DIRI KE STAGE BERIKUTNYA...`,
      3.2,
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
    this.sound.setBiome(cfg.biome, false);

    this.hud.showBanner(`STAGE ${this.currentStage}: ${cfg.title}`, cfg.subtitle, 3.5);
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
    this.particles.createClaySplat(b.x, b.y, 8, '#fbc02d', '#f57f17');

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      this.bullets.push(new Bullet({
        x: b.x,
        y: b.y,
        vx: Math.cos(a) * 460,
        vy: Math.sin(a) * 460,
        damage: 1.3,
        type: 'FLAK_SHRAPNEL',
        radius: 5,
        life: 0.4
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
    // A. Player Bullets vs Enemies
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (b.isEnemy) continue;

      // 1. Bullets vs Enemies
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (e.dead) continue;

        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          this.sound.playEnemyHit();
          if (b.type === 'PLASMA') {
            this.particles.createElectricSpark(b.x, b.y, 4, '#ea80fc', '#ffffff');
          } else {
            this.particles.createClaySplat(b.x, b.y, 4, e.color, e.shadowColor);
          }

          const killed = e.takeDamage(b.damage, b.x, b.piercing);
          if (killed) {
            this.handleEnemyDeath(e);
          }

          if (!b.piercing) {
            if (b.type === 'FLAK') this.detonateFlak(b);
            this.bullets.splice(bi, 1);
            break;
          } else {
            b.hitsLeft--;
            if (b.hitsLeft <= 0) {
              this.bullets.splice(bi, 1);
              break;
            }
          }
        }
      }

      // 2. Bullets vs Boss
      if (this.boss && !this.boss.dead && bi < this.bullets.length) {
        const bBoss = this.bullets[bi];
        if (!bBoss.isEnemy) {
          const bossDist = Math.hypot(this.boss.x - bBoss.x, this.boss.y - bBoss.y);
          if (bossDist < this.boss.radius + bBoss.radius + 35) {
            this.sound.playEnemyHit();
            this.camera.addTrauma(0.08);
            if (bBoss.type === 'PLASMA') {
              this.particles.createElectricSpark(bBoss.x, bBoss.y, 4, '#ea80fc', '#ffffff');
            } else {
              this.particles.createClaySplat(bBoss.x, bBoss.y, 5, '#90a4ae', '#37474f');
            }

            this.boss.takeDamage(bBoss.damage, bBoss.y, this.particles, this.sound);

            if (!bBoss.piercing) {
              if (bBoss.type === 'FLAK') this.detonateFlak(bBoss);
              this.bullets.splice(bi, 1);
              continue;
            } else {
              bBoss.hitsLeft--;
              if (bBoss.hitsLeft <= 0) {
                this.bullets.splice(bi, 1);
                continue;
              }
            }
          }
        }
      }

      // Player bullets pass through powerup drops (no collision check with PowerUpCapsule)
    }

    // B. Player vs Collectibles
    for (let ci = this.collectibles.length - 1; ci >= 0; ci--) {
      const c = this.collectibles[ci];
      if (c.dead) continue;

      const dist = Math.hypot(c.x - this.player.x, c.y - this.player.y);
      if (dist < c.radius + this.player.radius) {
        c.dead = true;

        if (c instanceof PowerUpCapsule) {
          this.player.setWeapon(c.weaponType);
          this.sound.playPowerUpCollect();
          this.camera.addTrauma(0.15);
          this.particles.createClaySplat(this.player.x, this.player.y, 20, '#ffd54f', '#ff6f00');
          this.particles.createFloatingText(this.player.x, this.player.y - 30, `+ ${c.weaponType}!`, '#ffd54f');
          this.addPlayerScore(5000);
        } else if (c instanceof FruitDrop) {
          this.sound.playFruitCollect();
          this.addPlayerScore(c.points);
          this.particles.createClaySplat(c.x, c.y, 10, '#81c784', '#2e7d32');
          this.particles.createFloatingText(c.x, c.y - 25, `+${c.points.toLocaleString()}!`, '#ffd54f');
        }
      }
    }

    // C. Enemy Bullets vs Player
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      if (!b.isEnemy) continue;

      const pDist = Math.hypot(this.player.x - b.x, this.player.y - b.y);
      if (pDist < this.player.radius + b.radius - 4) {
        this.bullets.splice(bi, 1);
        this.damagePlayer();
        break;
      }
    }

    // D. Enemies vs Player (Crash collision)
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (dist < this.player.radius + e.radius - 8) {
        this.damagePlayer();
        e.takeDamage(10);
        if (e.dead) this.handleEnemyDeath(e);
        break;
      }
    }
  }

  handleEnemyDeath(e) {
    const isHeavy = (e.type === 'BLIMP' || e.type === 'GUNSHIP' || e.type === 'BOMBER' || e.type === 'SHIELD_CRUISER');
    this.sound.playExplosion(isHeavy ? 'large' : 'small');
    this.camera.addTrauma(isHeavy ? 0.35 : 0.15);
    this.particles.createClaySplat(e.x, e.y, isHeavy ? 24 : 14, e.color, e.shadowColor);
    this.addPlayerScore(e.scoreValue);

    // If Mine died, detonate into fragments
    if (e.type === 'MINE') {
      this.detonateMine(e);
    }

    // Formation tracking for Fruit Drops
    if (e.formationId && this.formationsTracker.has(e.formationId)) {
      const fInfo = this.formationsTracker.get(e.formationId);
      fInfo.killed++;
      if (fInfo.killed >= fInfo.total) {
        const fruits = ['CHERRY', 'BANANA', 'APPLE', 'STAR'];
        const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
        this.collectibles.push(new FruitDrop(e.x, e.y, randomFruit, this.currentStage));
        this.particles.createFloatingText(e.x, e.y - 35, 'FORMATION CLEARED!', '#69f0ae');
      }
    }

    // Heavy enemies chance to drop fruit or power-up capsule
    if (isHeavy && Math.random() > 0.4) {
      this.collectibles.push(new FruitDrop(e.x, e.y, 'STAR', this.currentStage));
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
    this.sound.stopMusic();
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
    this.sound.stopMusic();
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
    this.ctx.clearRect(0, 0, this.width, this.height);

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

    this.ctx.restore();

    // 8. HUD Overlay
    if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
      this.hud.draw(this.ctx, this.player, this.boss);
    }
  }
}
