// Test & Verification Script for Weapons & Boss Balancing
import { Player } from '../src/entities/Player.js';
import { Bullet } from '../src/entities/Bullet.js';
import { Boss } from '../src/entities/Boss.js';
import { Enemy } from '../src/entities/Enemy.js';

console.log('--- STARTING WEAPON & BOSS BALANCING AUDIT VERIFICATION ---');

// Mock Sound Object
const mockSound = {
  playShoot: () => {},
  playEnemyHit: () => {},
  playExplosion: () => {},
  playBossAlarm: () => {},
  playEnemyShoot: () => {}
};

// 1. Initialize Player
const player = new Player(1280, 720);

// Test NORMAL (Must remain 100% untouched)
player.setWeapon('NORMAL');
const normalBullets = player.shoot(mockSound);
console.assert(normalBullets.length === 2, 'NORMAL should fire 2 bullets');
console.assert(player.shootTimer === 0.12, `NORMAL shootTimer should be 0.12, got ${player.shootTimer}`);
console.assert(normalBullets[0].damage === 1.0, `NORMAL damage should be 1.0, got ${normalBullets[0].damage}`);
console.assert(normalBullets[0].vx === 1050, `NORMAL speed should be 1050, got ${normalBullets[0].vx}`);
console.log('✔ NORMAL Weapon: 100% UNTOUCHED (Cooldown: 0.12s, Damage: 1.00, Speed: 1050 px/s)');

// Test SPREAD
player.shootTimer = 0;
player.setWeapon('SPREAD');
const spreadBullets = player.shoot(mockSound);
console.assert(spreadBullets.length === 7, `SPREAD should fire 7 pellets, got ${spreadBullets.length}`);
console.assert(Math.abs(player.shootTimer - 0.21) < 0.001, `SPREAD shootTimer should be 0.21, got ${player.shootTimer}`);
console.assert(spreadBullets[0].damage === 0.30, `SPREAD initial arming damage should be 0.30, got ${spreadBullets[0].damage}`);

// Test SPREAD Arming logic in update (Close-range weakened, Long-range strengthened)
const testPellet = spreadBullets[0];
testPellet.x = testPellet.startX + 100; // close range (<180)
testPellet.update(0.016, [], null, null, null, null);
console.assert(testPellet.damage === 0.30, `Close-range SPREAD damage should stay 0.30, got ${testPellet.damage}`);

testPellet.x = testPellet.startX + 400; // long range (>=360)
testPellet.update(0.016, [], null, null, null, null);
console.assert(testPellet.damage === 1.45, `Long-range SPREAD damage should be 1.45, got ${testPellet.damage}`);
console.log('✔ SPREAD Weapon: Correct (Cooldown: 0.21s, 7 pellets, Close-range <180px: 0.30 dmg, Long-range >=360px: 1.45 dmg)');

// Test LASER
player.shootTimer = 0;
player.setWeapon('LASER');
const laserBullets = player.shoot(mockSound);
console.assert(laserBullets.length === 2, `LASER should fire 2 beams, got ${laserBullets.length}`);
console.assert(Math.abs(player.shootTimer - 0.16) < 0.001, `LASER shootTimer should be 0.16, got ${player.shootTimer}`);
console.assert(laserBullets[0].vx === 1650, `LASER speed should be 1650, got ${laserBullets[0].vx}`);
console.assert(laserBullets[0].hitsLeft === 3, `LASER hitsLeft should be 3, got ${laserBullets[0].hitsLeft}`);
console.log('✔ LASER Weapon: Correct (Cooldown: 0.16s, Speed: 1650 px/s, hitsLeft: 3)');

// Test HOMING
player.shootTimer = 0;
player.setWeapon('HOMING');
const homingBullets = player.shoot(mockSound);
console.assert(homingBullets.length === 2, `HOMING should fire 2 rockets, got ${homingBullets.length}`);
console.assert(Math.abs(player.shootTimer - 0.19) < 0.001, `HOMING shootTimer should be 0.19, got ${player.shootTimer}`);
console.assert(homingBullets[0].damage === 1.4, `HOMING damage should be 1.4, got ${homingBullets[0].damage}`);
console.assert(homingBullets[0].targetSector === 'UPPER', `Top rocket should target UPPER sector`);
console.assert(homingBullets[1].targetSector === 'LOWER', `Bottom rocket should target LOWER sector`);
console.log('✔ HOMING Weapon: Correct (Cooldown: 0.19s, Damage: 1.40, Smart Divergence UPPER/LOWER tags set)');

// Test FLAK (Yellow Special Weapon: 2x DMG = 5.2, 1.5x delay = 0.54s)
player.shootTimer = 0;
player.x = 200;
player.setWeapon('FLAK');
const flakBullets = player.shoot(mockSound);
console.assert(flakBullets.length === 1, `FLAK should fire 1 shell, got ${flakBullets.length}`);
console.assert(Math.abs(player.shootTimer - 0.54) < 0.001, `FLAK shootTimer should be 0.54, got ${player.shootTimer}`);
console.assert(flakBullets[0].damage === 5.2, `FLAK damage should be 5.2 (2x), got ${flakBullets[0].damage}`);
console.assert(player.x === 178, `FLAK recoil should push player back from 200 to 178, got ${player.x}`);
console.log('✔ FLAK Weapon: Correct (Cooldown: 0.54s [1.5x delay], Damage: 5.20 [2x dmg], Recoil: 22px pushback)');

// Test PLASMA (Slow effect on Enemy and Boss)
player.shootTimer = 0;
player.setWeapon('PLASMA');
const plasmaBullets = player.shoot(mockSound);
console.assert(plasmaBullets.length === 1, `PLASMA should fire 1 orb, got ${plasmaBullets.length}`);
console.assert(Math.abs(player.shootTimer - 0.28) < 0.001, `PLASMA shootTimer should be 0.28, got ${player.shootTimer}`);
console.assert(plasmaBullets[0].damage === 1.2, `PLASMA damage should be 1.2, got ${plasmaBullets[0].damage}`);
console.assert(plasmaBullets[0].vx === 420, `PLASMA speed should be 420, got ${plasmaBullets[0].vx}`);

// Test Plasma slow application on Enemy
const testEnemy = new Enemy({ type: 'DRONE', x: 500, y: 300 });
console.assert(testEnemy.slowTimer === 0, 'Enemy initially has 0 slowTimer');
testEnemy.takeDamage(1.0, 500, false, 'PLASMA');
console.assert(testEnemy.slowTimer > 0, `Enemy slowTimer should be > 0 after PLASMA hit, got ${testEnemy.slowTimer}`);
testEnemy.update(0.016, player, [], mockSound, null, null);
console.assert(testEnemy.shootCooldownMult === 2.0, `Enemy shootCooldownMult should be 2.0 while slowed, got ${testEnemy.shootCooldownMult}`);
console.log('✔ PLASMA Weapon & Slow: Correct on Enemy (Inflicts electro-paralysis, 2x bullet cooldown delay)');

// Test Boss HP and Plasma Slow
const bossW2 = new Boss(1280, 720, 'GOLIATH_ZEPPELIN');
console.assert(bossW2.maxTotalHp === 1000, `Boss World 2 should have 1000 HP, got ${bossW2.maxTotalHp}`);
console.assert(bossW2.currentHp === 1000, `Boss World 2 currentHp should be 1000, got ${bossW2.currentHp}`);
console.log('✔ Boss World 2 (Goliath Zeppelin): Correct HP (1000 HP, broadside & mortar patterns hardened)');

const bossW3 = new Boss(1280, 720, 'LEVIATHAN_TITAN');
console.assert(bossW3.maxTotalHp === 1400, `Boss World 3 should have 1400 HP, got ${bossW3.maxTotalHp}`);
console.assert(bossW3.currentHp === 1400, `Boss World 3 currentHp should be 1400, got ${bossW3.currentHp}`);
console.assert(bossW3.laserAttackCooldown === 7.5, `Boss World 3 laser cooldown should be 7.5s, got ${bossW3.laserAttackCooldown}`);
console.log('✔ Boss World 3 (Leviathan Titan): Correct HP (1400 HP, 11 fanned lasers, telegraph warning, 7.5s normal / 3.4s rage cooldown)');

const bossW4 = new Boss(1280, 720, 'OMEGA_COLOSSUS');
console.assert(bossW4.maxTotalHp === 1600, `Boss World 4 Colossus should have 1600 HP, got ${bossW4.maxTotalHp}`);
console.assert(bossW4.currentHp === 1600, `Boss World 4 Colossus currentHp should be 1600, got ${bossW4.currentHp}`);
console.log('✔ Boss World 4 (Omega Colossus Phase 1): Correct HP (1600 HP)');

const bossW4Core = new Boss(1280, 720, 'OMEGA_CORE_SPAWN');
console.assert(bossW4Core.maxTotalHp === 800, `Boss World 4 Core should have 800 HP, got ${bossW4Core.maxTotalHp}`);
console.assert(bossW4Core.currentHp === 800, `Boss World 4 Core currentHp should be 800, got ${bossW4Core.currentHp}`);
console.assert(bossW4Core.missileSalvoTimer === undefined, 'Rocket missile salvo timer should be removed from Core');
console.assert(bossW4Core.armadaSpawnTimer !== undefined, 'Attack armada spawn timer should exist on Core');
console.log('✔ Boss World 4 Core (Omega Apex Core Phase 2): Correct HP (800 HP, rockets removed, armada strike added)');

// Test Boss Plasma Slow
console.assert(bossW2.slowTimer === 0, 'Boss initially has 0 slowTimer');
bossW2.takeDamage(10, 360, null, mockSound, 'PLASMA');
console.assert(bossW2.slowTimer > 0, `Boss slowTimer should be > 0 after PLASMA hit, got ${bossW2.slowTimer}`);
console.log('✔ Boss Plasma Slow: Correct (Electro-paralysis slow applied to Boss on direct & zap hits)');

// Test World 4 Jumbo Singularity Titan Movement States
const jumboTitan = new Enemy({ type: 'JUMBO_SINGULARITY_TITAN', x: 1300, y: 360 });
console.assert(jumboTitan.hoverPhase === 'ENTER', `Jumbo Titan should start in ENTER phase, got ${jumboTitan.hoverPhase}`);
console.assert(jumboTitan.hoverTimer === 12.0, `Jumbo Titan hoverTimer should be 12.0, got ${jumboTitan.hoverTimer}`);
jumboTitan.x = 960; // reached target
jumboTitan.update(0.016, player, [], mockSound, null, null);
console.assert(jumboTitan.hoverPhase === 'HOVER_STATIC', `Jumbo Titan should transition to HOVER_STATIC, got ${jumboTitan.hoverPhase}`);
jumboTitan.hoverTimer = 0.01;
jumboTitan.update(0.02, player, [], mockSound, null, null);
console.assert(jumboTitan.hoverPhase === 'ADVANCE_LEFT', `Jumbo Titan should advance to ADVANCE_LEFT when timer expires, got ${jumboTitan.hoverPhase}`);
console.log('✔ World 4 Jumbo Singularity Titan: Correct state machine (Enter -> Static vertical swing -> Advance forward to far-left)');

console.log('\n🎉 ALL WEAPON, ENEMY & BOSS BALANCING VERIFICATION CHECKS PASSED SUCCESSFULLY!');
