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
  }

  setDifficulty(diffId, config) {
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

    if (player && player.score > this.highScore) {
      this.highScore = Math.floor(player.score);
      try {
        const key = this.difficulty ? `platypus_highscore_${this.difficulty}` : 'platypus_highscore';
        localStorage.setItem(key, this.highScore.toString());
        localStorage.setItem('platypus_highscore', this.highScore.toString());
      } catch (e) {}
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

  draw(ctx, player, boss) {
    ctx.save();

    // 1. Score, Highscore & Combo Display (Top Left)
    this.drawScorePanel(ctx, player);

    // 2. Lives Remaining Fleet (Bottom Left)
    this.drawLivesPanel(ctx, player);

    // 3. Dynamic UHD Weapon Dock (Bottom Center)
    this.drawWeaponGauge(ctx, player);

    // 4. UHD Boss Battle Bar (Top Center - ONLY shown during Boss Battles, Clean Screen otherwise!)
    if (this.bossHudAlpha > 0.01 && boss) {
      this.drawBossBar(ctx, boss);
    }

    // 5. Centered Announcement Banner
    if (this.bannerLife > 0) {
      this.drawBanner(ctx);
    }

    ctx.restore();
  }

  drawScorePanel(ctx, player) {
    ctx.save();
    // Glassmorphic Clay Plate for Score
    const sx = 20;
    const sy = 24;

    ClayRenderer.drawClayCapsule(ctx, sx + 95, sy + 38, 205, 54, 'rgba(46, 32, 28, 0.88)', '#1b120c');

    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;

    // Current Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Luckiest Guy, cursive';
    ctx.fillText(`SKOR: ${Math.floor(player.score).toLocaleString()}`, sx + 14, sy + 32);

    // High Score
    ctx.font = '700 13px Fredoka, sans-serif';
    ctx.fillStyle = '#ffecb3';
    ctx.fillText(`TERTINGGI: ${this.highScore.toLocaleString()}`, sx + 14, sy + 52);

    // Difficulty Pill Badge below score panel
    const diffLabel = (this.difficultyConfig && this.difficultyConfig.name) || this.difficulty || 'NORMAL';
    const diffColor = (this.difficultyConfig && this.difficultyConfig.badgeColor) || '#f57c00';
    ClayRenderer.drawClayCapsule(ctx, sx + 52, sy + 76, 96, 20, diffColor, '#1b120c');
    ctx.font = 'bold 11px Luckiest Guy, cursive';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 3;
    ctx.fillText(`MODE: ${diffLabel}`, sx + 52, sy + 77);

    // Dynamic Multiplier / Combo Badge
    if (player.combo > 1) {
      const pulse = 1 + Math.sin(this.hudTick * 8) * 0.08;
      ctx.save();
      ctx.translate(sx + 215, sy + 38);
      ctx.scale(pulse, pulse);
      ClayRenderer.drawClayCapsule(ctx, 0, 0, 80, 24, '#f57c00', '#b23c17');
      ctx.font = 'bold 12px Luckiest Guy, cursive';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${player.combo.toFixed(1)} COMBO`, 0, 1);
      ctx.restore();
    }

    ctx.restore();
  }

  drawLivesPanel(ctx, player) {
    const lives = Math.max(0, player.lives);
    const maxLives = player.maxLives || 10;

    ctx.save();

    // 1. Subtle Clay Life Indicator Badge
    const badgeX = 24;
    const badgeY = 652;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.fillStyle = '#ff5252';
    ctx.fillText('❤️', badgeX, badgeY);

    ctx.font = 'bold 13px Luckiest Guy, cursive';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(`LIVES: ${lives} / ${maxLives}`, badgeX + 22, badgeY + 1);

    // 2. Ships Tray with Adaptive Spacing & Scale (supporting up to 15 lives smoothly)
    const startX = 26;
    const startY = 688;
    const scale = lives > 11 ? 0.50 : (lives > 8 ? 0.60 : (lives > 5 ? 0.72 : 0.82));
    const spacing = lives > 11 ? 21 : (lives > 8 ? 25 : (lives > 5 ? 29 : 35));

    for (let i = 0; i < lives; i++) {
      ctx.save();
      ctx.translate(startX + i * spacing, startY);
      ctx.scale(scale, scale);
      ClayRenderer.drawPlayerShip(ctx, 0, 0, 0, false, 0, 'NORMAL');
      ctx.restore();
    }

    ctx.restore();
  }

  drawWeaponGauge(ctx, player) {
    const cx = 640;
    const cy = 682;
    const cardW = 380;
    const cardH = 54;

    const weapons = {
      NORMAL: { name: 'PEA-SHOOTER', tag: 'STD', color: '#ffb300', dot: '#ffd54f', desc: 'STANDARD ISSUE - UNLIMITED' },
      SPREAD: { name: 'SPREAD SHOT', tag: 'SPR', color: '#ef5350', dot: '#ff1744', desc: 'TRIPLE CONE SPREAD' },
      LASER: { name: 'SONIC LASER', tag: 'LSR', color: '#00e5ff', dot: '#29b6f6', desc: 'CONTINUOUS PIERCING BEAM' },
      HOMING: { name: 'HOMING MISSILES', tag: 'HOM', color: '#00e676', dot: '#69f0ae', desc: 'SEEKING SMART CLAY MISSILES' },
      FLAK: { name: 'CLAY FLAK BOMB', tag: 'FLK', color: '#ffd600', dot: '#ffb300', desc: 'HIGH EXPLOSIVE AREA BURST' },
      PLASMA: { name: 'PLASMA ARC', tag: 'PLS', color: '#e040fb', dot: '#ba68c8', desc: 'CHAIN LIGHTNING ELECTRICITY' }
    };

    const cur = weapons[player.activeWeapon] || weapons.NORMAL;
    const isSpecial = player.activeWeapon !== 'NORMAL';
    const isExpiring = isSpecial && player.weaponTimeLeft <= 4.0;

    ctx.save();

    // 1. Sleek Clay Dock Container
    let dockBorder = '#1c130e';
    let dockBg = 'rgba(38, 25, 21, 0.92)';

    // Pulse red/amber when weapon is expiring (< 4s)
    if (isExpiring) {
      const alertPulse = Math.sin(this.hudTick * 12) * 0.5 + 0.5;
      dockBorder = alertPulse > 0.5 ? '#ff1744' : '#d84315';
    }

    ClayRenderer.drawClayCapsule(ctx, cx, cy, cardW, cardH, dockBg, dockBorder);

    // 2. High-Tech Stylized Weapon Emblem (Left)
    const badgeX = cx - cardW / 2 + 36;
    const badgeY = cy;

    // Glowing aura behind badge
    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 18, 0, Math.PI * 2);
    ctx.fillStyle = cur.color;
    ctx.globalAlpha = isExpiring ? 0.4 + Math.sin(this.hudTick * 14) * 0.3 : 0.25;
    ctx.fill();
    ctx.restore();

    // Clay Emblem Blob
    ClayRenderer.drawClayBlob(ctx, badgeX, badgeY, 14, 14, cur.dot, '#1a100a');
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cur.tag, badgeX, badgeY);

    // 3. Weapon Name & Subtitle
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    if (isSpecial) {
      // Special Weapon Active: Name + Timer Bar + Digital Countdown
      ctx.font = 'bold 15px Luckiest Guy, cursive';
      ctx.fillStyle = cur.color;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(cur.name, badgeX + 22, cy - 6);

      // Remaining Seconds Countdown
      const timeLeft = Math.max(0, player.weaponTimeLeft);
      ctx.font = '700 12px Fredoka, sans-serif';
      ctx.fillStyle = isExpiring ? '#ff5252' : '#ffffff';
      ctx.textAlign = 'right';
      ctx.fillText(`⏱️ ${timeLeft.toFixed(1)}s / 15.0s`, cx + cardW / 2 - 20, cy - 6);

      // Dual-Layer Progress Gauge
      const ratio = Math.max(0, Math.min(1, player.weaponTimeLeft / player.maxWeaponTime));
      const barX = badgeX + 22;
      const barY = cy + 4;
      const barW = cardW - 84;
      const barH = 8;

      // Track
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();

      // Active Fill with Gradient
      const fillW = barW * ratio;
      if (fillW > 0) {
        const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        fillGrad.addColorStop(0, cur.color);
        fillGrad.addColorStop(1, isExpiring ? '#ff1744' : '#ffffff');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillW, barH, 4);
        ctx.fill();

        // Tip Glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(barX + fillW, barY + barH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Normal Pea-Shooter: Clean Standard Issue Display
      ctx.font = 'bold 16px Luckiest Guy, cursive';
      ctx.fillStyle = cur.color;
      ctx.fillText(cur.name, badgeX + 22, cy + 1);

      ctx.font = '600 12px Fredoka, sans-serif';
      ctx.fillStyle = '#bcaaa4';
      ctx.textAlign = 'right';
      ctx.fillText(cur.desc, cx + cardW / 2 - 20, cy + 1);
    }

    ctx.restore();
  }

  drawBossBar(ctx, boss) {
    const cx = 640;
    const cy = 48;
    const barW = 560;
    const barH = 54;
    const hpTrackW = 460;
    const hpTrackH = 14;

    ctx.save();
    ctx.globalAlpha = this.bossHudAlpha;

    // 1. Card Container (Sleek Glass-Clay Armor Frame)
    const isRage = boss.rageMode;
    const chassisColor = isRage
      ? (Math.floor(this.hudTick * 8) % 2 === 0 ? '#4a1515' : '#2b0d0d')
      : 'rgba(28, 38, 46, 0.95)';
    const chassisBorder = isRage ? '#ff1744' : '#455a64';

    ClayRenderer.drawClayCapsule(ctx, cx, cy, barW, barH, chassisColor, chassisBorder);

    // 2. Boss Emblem & Identity Header
    const hpPercent = Math.max(0, Math.ceil(boss.hpRatio * 100));
    const titleY = cy - 8;

    // Boss Name
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px Luckiest Guy, cursive';
    ctx.fillStyle = isRage ? '#ff5252' : '#ffd54f';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`⚡ ${boss.title}`, cx - hpTrackW / 2, titleY);

    // Status / Mode Chip
    ctx.textAlign = 'right';
    if (isRage) {
      ctx.font = 'bold 13px Fredoka, sans-serif';
      ctx.fillStyle = '#ff1744';
      ctx.fillText(`[ OVERLOAD - BERSERK ] ${hpPercent}%`, cx + hpTrackW / 2, titleY);
    } else {
      ctx.font = '700 13px Fredoka, sans-serif';
      ctx.fillStyle = '#90caf9';
      ctx.fillText(`[ TARGET LOCK ] ${hpPercent}%`, cx + hpTrackW / 2, titleY);
    }

    // 3. Health Bar with Ghost Damage Interpolation
    const bx = cx - hpTrackW / 2;
    const by = cy + 6;

    // Track Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, by, hpTrackW, hpTrackH, 7);
    ctx.fill();

    // Ghost Damage Bar (Lags behind real hits for juicy combat feedback)
    if (this.bossGhostHp > this.bossDisplayHp) {
      const ghostW = Math.max(0, hpTrackW * this.bossGhostHp);
      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.roundRect(bx, by, ghostW, hpTrackH, 7);
      ctx.fill();
    }

    // Active Current HP Bar
    const curW = Math.max(0, hpTrackW * this.bossDisplayHp);
    if (curW > 0) {
      const hpGrad = ctx.createLinearGradient(bx, 0, bx + hpTrackW, 0);
      if (isRage) {
        hpGrad.addColorStop(0, '#ff1744');
        hpGrad.addColorStop(0.5, '#ff5252');
        hpGrad.addColorStop(1, '#ff8a80');
      } else {
        hpGrad.addColorStop(0, '#43a047');
        hpGrad.addColorStop(0.5, '#fbc02d');
        hpGrad.addColorStop(1, '#e53935');
      }
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, curW, hpTrackH, 7);
      ctx.fill();

      // Bevel highlight sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.roundRect(bx, by, curW, hpTrackH * 0.4, 4);
      ctx.fill();
    }

    // Tactical 25% Quadrant Segment Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 2;
    for (let q = 1; q <= 3; q++) {
      const qx = bx + (hpTrackW * q) / 4;
      ctx.beginPath();
      ctx.moveTo(qx, by);
      ctx.lineTo(qx, by + hpTrackH);
      ctx.stroke();
    }

    // 4. Subsystems Breakdown Row underneath
    this.drawBossSubsystems(ctx, boss, cx, cy + barH / 2 + 10);

    ctx.restore();
  }

  drawBossSubsystems(ctx, boss, cx, sy) {
    ctx.save();
    let components = [];

    if (boss.bossType === 'OMEGA_COLOSSUS') {
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
