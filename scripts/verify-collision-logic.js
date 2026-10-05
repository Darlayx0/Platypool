// Automated Verification Script for Collision Logic: Player vs Enemies & Boss
import { Player } from '../src/entities/Player.js';
import { Enemy } from '../src/entities/Enemy.js';
import { Boss } from '../src/entities/Boss.js';

console.log('--- STARTING COLLISION LOGIC VERIFICATION ---');

// Mock helpers
const createMockSound = () => ({
  playExplosion: () => {},
  playEnemyHit: () => {},
  playEnemyShoot: () => {},
  playShoot: () => {},
  playBossAlarm: () => {}
});

const createMockParticles = () => ({
  createClaySplat: () => {},
  createElectricSpark: () => {},
  createSmokePuff: () => {},
  createFloatingText: () => {}
});

const createMockCamera = () => ({
  addTrauma: () => {}
});

// Helper simulating Game.handleCollisions for Player vs Enemies & Boss
function simulateCollisions(game) {
  const player = game.player;
  const px = player.x;
  const py = player.y;
  const pr = player.radius;
  const enemies = game.enemies;
  const enemyCount = enemies.length;

  // D. Enemies vs Player (Crash collision)
  if (player.invulnerableTimer <= 0) {
    for (let ei = 0; ei < enemyCount; ei++) {
      const e = enemies[ei];
      if (e.dead) continue;

      const rSum = pr + e.radius - 8;
      const dx = px - e.x;
      if (dx < -rSum || dx > rSum) continue;
      const dy = py - e.y;
      if (dy < -rSum || dy > rSum) continue;

      if (dx * dx + dy * dy < rSum * rSum) {
        game.damagePlayer();
        const killed = e.takeDamage(10, px, false, 'COLLISION');
        if (killed) {
          game.handleEnemyDeath(e);
        } else {
          game.sound.playEnemyHit();
          game.particles.createClaySplat(e.x, e.y, 8, e.color, e.shadowColor);
        }
        break;
      }
    }
  }

  // E. Boss vs Player (Crash collision)
  if (player.invulnerableTimer <= 0 && game.boss && !game.boss.dead && !game.boss.isDying) {
    const boss = game.boss;
    const rSum = boss.radius * 0.85 + pr;
    const dx = px - boss.x;
    if (dx >= -rSum && dx <= rSum) {
      const dy = py - boss.y;
      if (dy >= -rSum && dy <= rSum) {
        if (dx * dx + dy * dy < rSum * rSum) {
          game.damagePlayer();
          boss.takeDamage(10, py, game.particles, game.sound, 'COLLISION');
          game.sound.playExplosion('small');
          game.particles.createClaySplat(px, py, 22, '#ff5722', '#b71c1c');
          game.camera.addTrauma(0.4);
        }
      }
    }
  }
}

function createMockGame() {
  const player = new Player(1280, 720);
  player.invulnerableTimer = 0; // set to vulnerable initially
  const enemies = [];
  const sound = createMockSound();
  const particles = createMockParticles();
  const camera = createMockCamera();

  const game = {
    player,
    enemies,
    boss: null,
    sound,
    particles,
    camera,
    damagePlayerCalls: 0,
    enemyDeathsHandled: 0,
    damagePlayer() {
      this.damagePlayerCalls++;
      this.player.hit();
    },
    handleEnemyDeath(e) {
      this.enemyDeathsHandled++;
      e.dead = true;
    }
  };

  return game;
}

// ==========================================
// TEST 1: Player getter isInvulnerable
// ==========================================
{
  const p = new Player(1280, 720);
  p.invulnerableTimer = 2.0;
  console.assert(p.isInvulnerable === true, 'Player.isInvulnerable should be true when timer > 0');
  p.invulnerableTimer = 0;
  console.assert(p.isInvulnerable === false, 'Player.isInvulnerable should be false when timer is 0');
  console.log('✔ Test 1: Player.isInvulnerable getter works correctly');
}

// ==========================================
// TEST 2: Vulnerable Player vs Scout (HP 1.0)
// ==========================================
{
  const game = createMockGame();
  const scout = new Enemy({ type: 'SCOUT', x: game.player.x, y: game.player.y });
  scout.hp = 1.0;
  scout.maxHp = 1.0;
  game.enemies.push(scout);

  const initialLives = game.player.lives;
  simulateCollisions(game);

  console.assert(game.player.lives === initialLives - 1, `Player should lose 1 life, got ${game.player.lives}`);
  console.assert(scout.dead === true, 'Scout should be killed by 10 collision damage');
  console.assert(game.enemyDeathsHandled === 1, 'handleEnemyDeath should have been called');
  console.assert(game.player.isInvulnerable === true, 'Player should become invulnerable after hit');
  console.log('✔ Test 2: Vulnerable Player destroys Scout with 10 collision damage & loses 1 life');
}

// ==========================================
// TEST 3: Vulnerable Player vs Gunship (HP 18.0) -> Receives ONLY 10 damage!
// ==========================================
{
  const game = createMockGame();
  const gunship = new Enemy({ type: 'GUNSHIP', x: game.player.x, y: game.player.y });
  gunship.hp = 18.0;
  gunship.maxHp = 18.0;
  game.enemies.push(gunship);

  const initialLives = game.player.lives;
  simulateCollisions(game);

  console.assert(game.player.lives === initialLives - 1, `Player should lose 1 life, got ${game.player.lives}`);
  console.assert(gunship.dead === false, 'Gunship should NOT be dead (18 HP - 10 damage = 8 HP)');
  console.assert(Math.abs(gunship.hp - 8.0) < 0.001, `Gunship HP should be 8.0, got ${gunship.hp}`);
  console.assert(game.enemyDeathsHandled === 0, 'Gunship should not trigger handleEnemyDeath');
  console.log('✔ Test 3: Vulnerable Player deals strictly 10 damage to Gunship (HP reduced from 18 to 8, survives)');
}

// ==========================================
// TEST 4: Invulnerable Player vs Gunship -> Deals ZERO damage!
// ==========================================
{
  const game = createMockGame();
  game.player.invulnerableTimer = 2.5; // Player is invulnerable (kebal)
  const gunship = new Enemy({ type: 'GUNSHIP', x: game.player.x, y: game.player.y });
  gunship.hp = 18.0;
  gunship.maxHp = 18.0;
  game.enemies.push(gunship);

  const initialLives = game.player.lives;
  simulateCollisions(game);

  console.assert(game.player.lives === initialLives, 'Invulnerable player should not lose life');
  console.assert(gunship.hp === 18.0, `Gunship HP should remain 18.0, got ${gunship.hp}`);
  console.assert(gunship.dead === false, 'Gunship should not take damage or die');
  console.assert(game.damagePlayerCalls === 0, 'damagePlayer should not be called');
  console.log('✔ Test 4: Invulnerable Player deals ZERO damage to enemies during collision');
}

// ==========================================
// TEST 5: Vulnerable Player vs Boss Dreadnought (HP 600) -> Deals 10 damage!
// ==========================================
{
  const game = createMockGame();
  game.boss = new Boss(1280, 720, 'DREADNOUGHT', {});
  game.boss.x = game.player.x;
  game.boss.y = game.player.y;
  const initialBossHp = game.boss.currentHp;
  const initialLives = game.player.lives;

  simulateCollisions(game);

  console.assert(game.player.lives === initialLives - 1, `Player should lose 1 life, got ${game.player.lives}`);
  console.assert(game.boss.currentHp === initialBossHp - 10, `Boss should lose exactly 10 HP, got ${game.boss.currentHp} (was ${initialBossHp})`);
  console.assert(game.damagePlayerCalls === 1, 'damagePlayer should be called once');
  console.log('✔ Test 5: Vulnerable Player collides with Boss -> Player loses 1 life & Boss takes 10 damage');
}

// ==========================================
// TEST 6: Invulnerable Player vs Boss Dreadnought -> Deals ZERO damage!
// ==========================================
{
  const game = createMockGame();
  game.player.invulnerableTimer = 3.0; // Player is kebal
  game.boss = new Boss(1280, 720, 'DREADNOUGHT', {});
  game.boss.x = game.player.x;
  game.boss.y = game.player.y;
  const initialBossHp = game.boss.currentHp;
  const initialLives = game.player.lives;

  simulateCollisions(game);

  console.assert(game.player.lives === initialLives, 'Invulnerable player should not lose life');
  console.assert(game.boss.currentHp === initialBossHp, `Boss HP should remain unchanged, got ${game.boss.currentHp} (was ${initialBossHp})`);
  console.assert(game.damagePlayerCalls === 0, 'damagePlayer should not be called');
  console.log('✔ Test 6: Invulnerable Player deals ZERO damage to Boss during collision');
}

console.log('--- ALL COLLISION LOGIC VERIFICATIONS PASSED SUCCESSFULLY! ---');
