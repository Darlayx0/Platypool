// In-game Arcade HUD & UI Renderer - Professional UHD Suite
import { ClayRenderer } from '../graphics/ClayRenderer.js';

export class HUD {
  constructor() {
    this.difficulty = 'NORMAL';
    this.difficultyConfig = null;
    this.highScore = 0;
    this.reloadHighScore();

    this.bannerText = '';
    this.bannerSubtext = '';
    this.bannerLife = 0;
    this.bannerMaxLife = 0;
    this.bannerColor = '#ffd54f';

    // Dynamic UHD Boss Animation States
    this.bossGhostHp = 1.0;
    this.bossDisplayHp = 1.0;
    this.bossHudAlpha = 0;
    this.hudTick = 0;
    this.isCheatActive = false;
    this.highScoreDirty = false;
    this.highScoreSaveTimer = 0;
  }

  flushHighScore() {
    if (!this.highScoreDirty) return;
    this.highScoreDirty = false;
    this.highScoreSaveTimer = 0;
    try {
      const key = this.difficulty ? `platypus_highscore_${this.difficulty}` : 'platypus_highscore';
      localStorage.setItem(key, this.highScore.toString());
      localStorage.setItem('platypus_highscore', this.highScore.toString());
    } catch (e) {}
  }

  setCheatActive(active) {
    this.isCheatActive = Boolean(active);
  }

  setDifficulty(diffId, config) {
    this.flushHighScore();
    this.difficulty = diffId || 'NORMAL';
    this.difficultyConfig = config || null;
    this.reloadHighScore();
  }

  reloadHighScore() {
    this.highScore = 0;
    try {
      const key = this.difficulty ? `platypus_highscore_${this.difficulty}` : 'platypus_highscore';
      const stored = localStorage.getItem(key) || localStorage.getItem('platypus_highscore');
      this.highScore = parseInt(stored || '0', 10);
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }

  showBanner(text, subtext = '', duration = 3.0, color = '#ffd54f') {
    this.bannerText = text;
    this.bannerSubtext = subtext;
    this.bannerLife = duration;
    this.bannerMaxLife = duration;
    this.bannerColor = color;
  }

  update(dt, player, boss) {
    this.hudTick += dt;

    if (player && player.score > this.highScore && !this.isCheatActive) {
      this.highScore = Math.floor(player.score);
      this.highScoreDirty = true;
    }

    if (this.highScoreDirty) {
      this.highScoreSaveTimer += dt;
      if (this.highScoreSaveTimer >= 3.0) {
        this.flushHighScore();
      }
    }

    if (this.bannerLife > 0) {
      this.bannerLife -= dt;
    }

    // Dynamic Boss HUD Smoothing & Ghost Damage
    if (boss && !boss.dead) {
      this.bossHudAlpha = Math.min(1.0, this.bossHudAlpha + dt * 3.0);
      const targetRatio = Math.max(0, Math.min(1, boss.hpRatio));
      this.bossDisplayHp += (targetRatio - this.bossDisplayHp) * Math.min(1.0, dt * 12);

      if (this.bossGhostHp > targetRatio) {
        this.bossGhostHp -= dt * 0.35;
        if (this.bossGhostHp < targetRatio) this.bossGhostHp = targetRatio;
      } else {
        this.bossGhostHp = targetRatio;
      }
    } else {
      this.bossHudAlpha = Math.max(0, this.bossHudAlpha - dt * 2.5);
      if (this.bossHudAlpha <= 0) {
        this.bossGhostHp = 1.0;
        this.bossDisplayHp = 1.0;
      }
    }
  }

  draw(ctx, player, boss, stageInfo = null) {
    ctx.save();

    // 1. Score, High Score & Difficulty Display (Top Left - Frameless Floating)
    this.drawScorePanel(ctx, player, stageInfo);

    // 2. Lives Remaining & Horizontal Fleet of Ships (Bottom Left - Frameless Floating)
    this.drawLivesPanel(ctx, player);

    // 3. Minimal Circular Weapon Countdown (Bottom Right - Only for Special Weapons)
    this.drawWeaponGauge(ctx, player);

    // 4. UHD Boss Battle Bar (Top Center - Compact & Solid Dynamic Color)
    if (this.bossHudAlpha > 0.01 && boss) {
      this.drawBossBar(ctx, boss);
    }

    // 5. Centered Announcement Banner
    if (this.bannerLife > 0) {
      this.drawBanner(ctx);
    }

    ctx.restore();
  }

  drawScorePanel(ctx, player, stageInfo = null) {
    ctx.save();

    // Top-Left Coordinates (Frameless / Floating directly on canvas without card/container)
    const sx = 24;
    const sy = 24;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 1. Current Score (Bold & Crisp Arcade Typography)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Luckiest Guy", cursive';
    ctx.fillText(`SKOR: ${Math.floor(player.score).toLocaleString()}`, sx, sy + 24);

    // 2. High Score (Warm Gold Hue)
    ctx.font = '700 13px "Fredoka", sans-serif';
    ctx.fillStyle = '#ffe082';
    const hsText = this.isCheatActive 
      ? `TERTINGGI: ${this.highScore.toLocaleString()} (NON-AKTIF)` 
      : `TERTINGGI: ${this.highScore.toLocaleString()}`;
    ctx.fillText(hsText, sx, sy + 44);

    // 3. Integrated Clay Difficulty Pill Badge (Standalone floating pill)
    const diffLabel = (this.difficultyConfig && this.difficultyConfig.name) || this.difficulty || 'NORMAL';
    const fallbackColors = {
      BEGINNER: '#00acc1',
      EASY: '#43a047',
      NORMAL: '#f57c00',
      HARD: '#e53935',
      EXTREME: '#ab47bc',
    };
    const diffColor = (this.difficultyConfig && this.difficultyConfig.badgeColor) || fallbackColors[this.difficulty] || '#f57c00';
    
    const pillW = 104;
    const pillH = 18;
    const pillX = sx + pillW / 2;
    const pillY = sy + 62;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ClayRenderer.drawClayCapsule(ctx, pillX, pillY, pillW, pillH, diffColor, '#1b120c');

    ctx.font = 'bold 10px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 3;
    ctx.fillText(`MODE: ${diffLabel}`, pillX, pillY);

    ctx.restore();
  }

  drawLivesPanel(ctx, player) {
    const isInfinite = Boolean(player.infiniteLives);
    const lives = isInfinite ? '∞' : Math.max(0, player.lives);
    const maxLives = isInfinite ? '∞' : (player.maxLives || 10);

    ctx.save();

    // Bottom-Left Anchors (Frameless / Floating directly on canvas without card/container)
    const startX = 26;
    const startY = 688;
    const badgeY = 654;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // 1. Floating Lives Indicator (No Container)
    ctx.font = 'bold 13px "Fredoka", sans-serif';
    ctx.fillStyle = '#ff5252';
    ctx.fillText('❤️', startX, badgeY);

    ctx.font = 'bold 13px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LIVES: ${lives} / ${maxLives}`, startX + 22, badgeY + 1);

    // 2. Ships Tray with Adaptive Spacing & Scale (Lined up from left to right)
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (isInfinite) {
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(startX + i * 30, startY);
        ctx.scale(0.72, 0.72);
        ClayRenderer.drawPlayerShip(ctx, 0, 0, 0, false, this.hudTick * 3, 'NORMAL');
        ctx.restore();
      }
      ctx.font = 'bold 24px "Fredoka", sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('♾️', startX + 5 * 30 + 4, startY);
    } else {
      const shipCount = Math.min(20, Math.max(0, player.lives));
      const scale = shipCount > 15 ? 0.44 : (shipCount > 11 ? 0.50 : (shipCount > 8 ? 0.60 : (shipCount > 5 ? 0.72 : 0.82)));
      const spacing = shipCount > 15 ? 18 : (shipCount > 11 ? 21 : (shipCount > 8 ? 25 : (shipCount > 5 ? 29 : 35)));

      for (let i = 0; i < shipCount; i++) {
        ctx.save();
        ctx.translate(startX + i * spacing, startY);
        ctx.scale(scale, scale);
        ClayRenderer.drawPlayerShip(ctx, 0, 0, 0, false, this.hudTick * 3, 'NORMAL');
        ctx.restore();
      }
    }

    ctx.restore();
  }

  drawWeaponGauge(ctx, player) {
    // If no player or active weapon is normal Pea-Shooter -> DO NOT DISPLAY!
    if (!player || player.activeWeapon === 'NORMAL') {
      return;
    }

    const weapons = {
      SPREAD: { tag: 'SPR', color: '#ff1744', dot: '#ff5252' },
      LASER: { tag: 'LSR', color: '#00e5ff', dot: '#29b6f6' },
      HOMING: { tag: 'HOM', color: '#00e676', dot: '#69f0ae' },
      FLAK: { tag: 'FLK', color: '#ffd600', dot: '#ffb300' },
      PLASMA: { tag: 'PLS', color: '#e040fb', dot: '#ba68c8' }
    };

    const cur = weapons[player.activeWeapon] || { tag: 'WPN', color: '#00e5ff', dot: '#29b6f6' };
    const isExpiring = !player.infiniteWeapon && player.weaponTimeLeft <= 3.5;
    const ratio = player.infiniteWeapon ? 1.0 : Math.max(0, Math.min(1, player.weaponTimeLeft / (player.maxWeaponTime || 15.0)));

    // Position: Sisi Kanan Bawah (Bottom-Right corner)
    const cx = 1234;
    const cy = 674;
    const gaugeR = 24;

    ctx.save();

    // Subtle ambient shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // 1. Circular Background Ring Track
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(20, 15, 12, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Active Circular Countdown Arc (No numbers!)
    if (ratio > 0.005) {
      const pulseAlpha = isExpiring ? 0.6 + Math.sin(this.hudTick * 14) * 0.4 : 1.0;
      ctx.globalAlpha = pulseAlpha;
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = cur.color;
      ctx.shadowBlur = isExpiring ? 10 : 5;

      ctx.beginPath();
      const startAngle = -Math.PI / 2; // 12 o'clock
      const endAngle = startAngle + Math.PI * 2 * ratio;
      ctx.arc(cx, cy, gaugeR, startAngle, endAngle);
      ctx.stroke();
    }

    // Reset shadow and alpha for emblem
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // 3. Center Clay Emblem with Weapon Symbol Tag
    ClayRenderer.drawClayBlob(ctx, cx, cy, 15, 15, cur.dot, '#1a100a');

    ctx.font = 'bold 10px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 2;
    ctx.fillText(cur.tag, cx, cy);

    ctx.restore();
  }

  drawBossBar(ctx, boss) {
    const cx = 640;
    const cy = 36;
    const barW = 440;
    const barH = 38;
    const hpTrackW = 360;
    const hpTrackH = 10;

    ctx.save();
    ctx.globalAlpha = this.bossHudAlpha;

    // 1. Card Container (Sleek Glass-Clay Armor Frame - Compact & Stable, not altered by rage)
    const chassisColor = 'rgba(28, 38, 46, 0.95)';
    const chassisBorder = '#455a64';

    ClayRenderer.drawClayCapsule(ctx, cx, cy, barW, barH, chassisColor, chassisBorder);

    // 2. Boss Emblem & Identity Header (Slightly Smaller)
    const hpPercent = Math.max(0, Math.ceil(boss.hpRatio * 100));
    const titleY = cy - 6;

    // Boss Name
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`⚡ ${boss.title}`, cx - hpTrackW / 2, titleY);

    // Status / Mode Chip
    ctx.textAlign = 'right';
    if (boss.isInvulnerable) {
      ctx.font = 'bold 11px "Fredoka", sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`[ 🛡️ PERISAI ] ${hpPercent}%`, cx + hpTrackW / 2, titleY);
    } else {
      ctx.font = '700 11px "Fredoka", sans-serif';
      ctx.fillStyle = '#90caf9';
      ctx.fillText(`[ TARGET LOCK ] ${hpPercent}%`, cx + hpTrackW / 2, titleY);
    }

    // 3. Health Bar with Ghost Damage Interpolation
    const bx = cx - hpTrackW / 2;
    const by = cy + 4;

    // Track Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, by, hpTrackW, hpTrackH, 5);
    ctx.fill();

    // Ghost Damage Bar (Lags behind real hits for juicy combat feedback)
    if (this.bossGhostHp > this.bossDisplayHp) {
      const ghostW = Math.max(0, hpTrackW * this.bossGhostHp);
      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.roundRect(bx, by, ghostW, hpTrackH, 5);
      ctx.fill();
    }

    // Active Current HP Bar - Solid Dynamic Color from Green to Red (Pure HP percentage, not overridden by rage!)
    const curW = Math.max(0, hpTrackW * this.bossDisplayHp);
    if (curW > 0) {
      // Smooth dynamic HSL transition: 125 (green) at 100% down to 0 (red) at 0%
      const hue = Math.max(0, Math.min(125, boss.hpRatio * 125));
      const hpColor = `hsl(${hue}, 88%, 46%)`;
      ctx.fillStyle = hpColor;
      ctx.beginPath();
      ctx.roundRect(bx, by, curW, hpTrackH, 5);
      ctx.fill();

      // Bevel highlight sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
      ctx.beginPath();
      ctx.roundRect(bx, by, curW, hpTrackH * 0.35, 3);
      ctx.fill();
    }

    // Tactical 25% Quadrant Segment Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.5;
    for (let q = 1; q <= 3; q++) {
      const qx = bx + (hpTrackW * q) / 4;
      ctx.beginPath();
      ctx.moveTo(qx, by);
      ctx.lineTo(qx, by + hpTrackH);
      ctx.stroke();
    }

    // 4. Dedicated Small Rage Warning (Under Boss Health Bar, persists while boss.rageMode is true)
    let subsysOffsetY = cy + barH / 2 + 8;

    if (boss.rageMode) {
      const warnW = 168;
      const warnH = 18;
      const warnY = cy + barH / 2 + 7;

      ctx.save();
      const alertPulse = Math.sin(this.hudTick * 10) * 0.5 + 0.5;
      ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
      ctx.shadowBlur = 6 + alertPulse * 4;

      ClayRenderer.drawClayCapsule(ctx, cx, warnY, warnW, warnH, '#b71c1c', '#ff1744');

      ctx.font = 'bold 10px "Luckiest Guy", cursive';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️ BOSS MENGAMUK!', cx, warnY);
      ctx.restore();

      subsysOffsetY = warnY + warnH / 2 + 10;
    }

    // 5. Subsystems Breakdown Row underneath
    this.drawBossSubsystems(ctx, boss, cx, subsysOffsetY);

    ctx.restore();
  }

  drawBossSubsystems(ctx, boss, cx, sy) {
    ctx.save();
    let components = [];

    if (boss.bossType === 'OMEGA_CORE_SPAWN') {
      components = [
        { name: 'MUTANT EYE', alive: boss.coreHp > 360 },
        { name: 'PERISAI KEBAL', alive: boss.isInvulnerable },
        { name: 'HYPER RUSH', alive: true }
      ];
    } else if (boss.bossType === 'OMEGA_COLOSSUS') {
      components = [
        { name: 'TOP RAILGUN', alive: boss.railTopAlive },
        { name: 'BOT RAILGUN', alive: boss.railBottomAlive },
        { name: 'DRONE HIVE', alive: boss.droneCoreAlive }
      ];
    } else if (boss.bossType === 'GOLIATH_ZEPPELIN') {
      components = [
        { name: 'HEAVY MORTAR', alive: boss.mortarAlive },
        { name: 'HANGAR BAY', alive: boss.hangarAlive }
      ];
    } else if (boss.bossType === 'LEVIATHAN_TITAN') {
      components = [
        { name: 'DORSAL WING', alive: boss.wingTopAlive },
        { name: 'VENTRAL WING', alive: boss.wingBottomAlive },
        { name: 'MISSILE POD', alive: boss.missilePodAlive }
      ];
    } else {
      // Dreadnought
      components = [
        { name: 'TOP TURRET', alive: boss.turretTopAlive },
        { name: 'BOTTOM TURRET', alive: boss.turretBottomAlive }
      ];
    }

    const total = components.length;
    const compW = 120;
    const gap = 12;
    const startX = cx - ((total * compW + (total - 1) * gap) / 2);

    for (let i = 0; i < total; i++) {
      const c = components[i];
      const compX = startX + i * (compW + gap) + compW / 2;
      const compY = sy;

      const bgColor = c.alive ? 'rgba(33, 49, 60, 0.85)' : 'rgba(46, 20, 20, 0.85)';
      const borderColor = c.alive ? '#00e5ff' : '#d32f2f';
      const textColor = c.alive ? '#e0f7fa' : '#ef9a9a';
      const statusDot = c.alive ? '#00e676' : '#d50000';

      ClayRenderer.drawClayCapsule(ctx, compX, compY, compW, 18, bgColor, borderColor);

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(compX - compW / 2 + 10, compY, 4, 0, Math.PI * 2);
      ctx.fillStyle = statusDot;
      ctx.fill();

      // Text label
      ctx.font = '700 10px Fredoka, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.name, compX + 4, compY);
    }

    ctx.restore();
  }

  drawBanner(ctx) {
    const alpha = Math.min(1.0, this.bannerLife * 2, (this.bannerMaxLife - this.bannerLife) * 4);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = 'center';

    // Big Title
    ctx.font = 'bold 44px Luckiest Guy, cursive';
    ctx.fillStyle = this.bannerColor;
    ctx.strokeStyle = '#271612';
    ctx.lineWidth = 8;
    ctx.strokeText(this.bannerText, 640, 320);
    ctx.fillText(this.bannerText, 640, 320);

    // Subtext
    if (this.bannerSubtext) {
      ctx.font = 'bold 22px Fredoka, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.strokeText(this.bannerSubtext, 640, 365);
      ctx.fillText(this.bannerSubtext, 640, 365);
    }
    ctx.restore();
  }
}
