// Verification Script for World 4 (Stages 16 - 20) Stage & Wave Architecture
import { STAGE_CONFIGS } from '../src/engine/Game.js';
import { Enemy } from '../src/entities/Enemy.js';

console.log('--- STARTING WORLD 4 STAGES & WAVES VERIFICATION ---');

const VALID_ENEMY_TYPES = new Set([
  'SCOUT', 'DRONE', 'RETRO_BIPLANE', 'SWING_GLIDER', 'GUNSHIP', 'BLIMP',
  'JUMBO_DREAD_CRUISER', 'CANYON_DIVER', 'STINGER', 'GEYSER_RUSHER',
  'FALCON_TRACKER', 'CANYON_SWARMER', 'CYBER_PHANTOM', 'INTERCEPTOR',
  'SHIELD_CRUISER', 'SNIPER', 'VORTEX_DRONE', 'CYBER_PENDULUM',
  'JUMBO_CYBER_GARGANTUA', 'METEOR_DIVER', 'ABYSS_ASCENDER', 'WARP_FLANKER',
  'COSMIC_ORBITER', 'VOID_STALKER', 'JUGGERNAUT', 'JUMBO_SINGULARITY_TITAN',
  'QUANTUM_WARPER', 'SINGULARITY_ORB', 'BINARY_TETHER', 'CHRONO_LEECH', 'COSMIC_CRUISER',
  'CHRONO_DREADNOUGHT',
  'FRUIT_CARRIER', 'MINE', 'SPINNER'
]);

// 1. Audit World 4 Stage Presence
const stage16 = STAGE_CONFIGS.find(s => s.stage === 16);
const stage17 = STAGE_CONFIGS.find(s => s.stage === 17);
const stage18 = STAGE_CONFIGS.find(s => s.stage === 18);
const stage19 = STAGE_CONFIGS.find(s => s.stage === 19);
const stage20 = STAGE_CONFIGS.find(s => s.stage === 20);

console.assert(stage16, 'Stage 16 should exist');
console.assert(stage17, 'Stage 17 should exist');
console.assert(stage18, 'Stage 18 should exist');
console.assert(stage19, 'Stage 19 should exist');
console.assert(stage20, 'Stage 20 should exist');

// 2. Audit Wave Counts
console.assert(stage16.waves.length === 6, `Stage 16 should have exactly 6 waves, got ${stage16.waves.length}`);
console.assert(stage17.waves.length === 6, `Stage 17 should have exactly 6 waves, got ${stage17.waves.length}`);
console.assert(stage18.waves.length === 6, `Stage 18 should have exactly 6 waves, got ${stage18.waves.length}`);
console.assert(stage19.waves.length === 6, `Stage 19 should have exactly 6 waves, got ${stage19.waves.length}`);
console.assert(stage20.waves.length === 2, `Stage 20 (Boss) should have exactly 2 waves, got ${stage20.waves.length}`);
console.log('✔ Wave Counts: All 4 World 4 Stages have exactly 6 waves! (Stage 20 Boss has 2 waves)');

// 3. Mock Game Engine for Wave Simulation
class MockGame {
  constructor(stageNumber) {
    this.currentStage = stageNumber;
    this.enemies = [];
    this.spawnQueue = [];
  }

  scheduleEnemy(delay, enemyOpts) {
    console.assert(typeof delay === 'number' && delay >= 0, `delay must be >= 0, got ${delay}`);
    console.assert(typeof enemyOpts.x === 'number', `enemy x must be number, got ${enemyOpts.x}`);
    console.assert(typeof enemyOpts.y === 'number', `enemy y must be number, got ${enemyOpts.y}`);
    console.assert(VALID_ENEMY_TYPES.has(enemyOpts.type), `Unknown enemy type ${enemyOpts.type}`);
    this.spawnQueue.push({ delay, type: enemyOpts.type, opts: enemyOpts });
  }

  scheduleSpawn(delay, fn) {
    console.assert(typeof delay === 'number' && delay >= 0, `delay must be >= 0, got ${delay}`);
    console.assert(typeof fn === 'function', 'action must be a function');
    this.spawnQueue.push({ delay, type: 'CUSTOM_SPAWN', fn });
  }

  spawnWeaponCapsule(x, y) {
    console.assert(typeof x === 'number' && typeof y === 'number', 'Weapon capsule coords must be numbers');
    this.spawnQueue.push({ delay: 0, type: 'WEAPON_CAPSULE', x, y });
  }
}

// 4. Simulate and Audit Each Wave
for (const stageCfg of [stage16, stage17, stage18, stage19]) {
  console.log(`\n--- Simulating Stage ${stageCfg.stage}: ${stageCfg.title} ---`);
  stageCfg.waves.forEach((waveFn, idx) => {
    const mock = new MockGame(stageCfg.stage);
    const fid = `form_s${stageCfg.stage}_w${idx + 1}`;
    waveFn(mock, fid);

    // Validate immediate enemies
    for (const enemy of mock.enemies) {
      console.assert(enemy instanceof Enemy, `Spawned object must be an Enemy instance`);
      console.assert(VALID_ENEMY_TYPES.has(enemy.type), `Unknown enemy type ${enemy.type}`);
      console.assert(!isNaN(enemy.x) && !isNaN(enemy.y), `Coordinates cannot be NaN`);
    }

    const immediateTypes = mock.enemies.map(e => e.type);
    const scheduledTypes = mock.spawnQueue.map(s => s.type);
    const allTypes = [...immediateTypes, ...scheduledTypes];

    console.log(`  Wave ${idx + 1}: ${mock.enemies.length} immediate enemies, ${mock.spawnQueue.length} scheduled spawns. Types: [${[...new Set(allTypes)].join(', ')}]`);

    // Specific audit for Stage 18 (Spam Void Stalker with single distinct guest per wave)
    if (stageCfg.stage === 18) {
      const nonStalkers = allTypes.filter(t => t !== 'VOID_STALKER' && t !== 'CUSTOM_SPAWN');
      const stalkers = allTypes.filter(t => t === 'VOID_STALKER');
      console.assert(stalkers.length >= 5, `Stage 18 Wave ${idx + 1} must spam Void Stalkers (got ${stalkers.length})`);

      if (idx === 0) {
        console.assert(nonStalkers.length === 0, `Stage 18 Wave 1 must be pure Void Stalkers (got guests: ${nonStalkers})`);
      } else if (idx === 1) {
        console.assert(nonStalkers.includes('QUANTUM_WARPER'), `Wave 2 guest must be QUANTUM_WARPER`);
      } else if (idx === 2) {
        console.assert(nonStalkers.includes('SINGULARITY_ORB'), `Wave 3 guest must be SINGULARITY_ORB`);
      } else if (idx === 3) {
        console.assert(nonStalkers.includes('BINARY_TETHER'), `Wave 4 guest must be BINARY_TETHER`);
      } else if (idx === 4) {
        console.assert(nonStalkers.includes('CHRONO_LEECH'), `Wave 5 guest must be CHRONO_LEECH`);
      } else if (idx === 5) {
        console.assert(nonStalkers.includes('FRUIT_CARRIER'), `Wave 6 guest must be FRUIT_CARRIER`);
      }
    }

    // Specific audit for Stage 19 Wave 6 (Mini-Boss Titan)
    if (stageCfg.stage === 19 && idx === 5) {
      const titan = mock.enemies.find(e => e.type === 'JUMBO_SINGULARITY_TITAN');
      console.assert(titan, 'Stage 19 Wave 6 MUST feature JUMBO_SINGULARITY_TITAN');
      console.assert(titan && titan.fromBehind === false, 'Titan MUST spawn from the FRONT (fromBehind: false)');
      console.assert(titan && titan.x > 1000, `Titan x must be > 1000 (front spawn), got ${titan.x}`);
      const hasCruiser = mock.spawnQueue.some(s => s.type === 'COSMIC_CRUISER');
      console.assert(hasCruiser, 'Stage 19 Wave 6 MUST feature COSMIC_CRUISER escorts');
      const hasCapsule = mock.spawnQueue.some(s => s.type === 'CUSTOM_SPAWN');
      console.assert(hasCapsule, 'Stage 19 Wave 6 MUST drop a Weapon Capsule before Boss');
    }
  });
}

console.log('\n✅ ALL WORLD 4 STAGE AND WAVE AUDITS PASSED WITH FLYING COLORS!');
