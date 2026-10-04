// In-game Arcade HUD & UI Renderer - Professional UHD Suite
import { ClayRenderer } from '../graphics/ClayRenderer.js';
import { CachedNumberLabel, formatInt } from '../engine/NumberFormat.js';

export class HUD {
  constructor() {
    this.difficulty = 'NORMAL';
    this.difficultyConfig = null;
    this.highScore = 0;
    this.migrateHighScoresIfNeeded();
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
    this.lifeShipFrames = [];
    this.initLifeShipSprites();

    // Fast memoized score formatters (zero allocation per frame)
    this.scoreLabel = new CachedNumberLabel('SKOR: ');
    this.highScoreLabel = new CachedNumberLabel('TERTINGGI: ');
    this._emblemCache = new Map();
  }

  migrateHighScoresIfNeeded() {
    try {
      if (localStorage.getItem('platypus_score_redenominated_v2') !== 'true') {
        const keys = [
          'platypus_highscore',
          'platypus_highscore_BEGINNER',
          'platypus_highscore_EASY',
          'platypus_highscore_NORMAL',
          'platypus_highscore_HARD',
          'platypus_highscore_EXTREME'
        ];
        for (const k of keys) {
          const val = localStorage.getItem(k);
          if (val) {
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) {
              localStorage.setItem(k, Math.floor(num / 10).toString());
            }
          }
        }
        // Also migrate saved game if present
        const savedStr = localStorage.getItem('platypus_saved_game');
        if (savedStr) {
          try {
            const saved = JSON.parse(savedStr);
            if (saved && typeof saved === 'object' && !saved._redenominated) {
              saved.score = Math.floor((saved.score || 0) / 10);
              if (saved.player) {
                saved.player.score = Math.floor((saved.player.score || 0) / 10);
                if (saved.player.nextLifeScore) saved.player.nextLifeScore = Math.floor(saved.player.nextLifeScore / 10);
                if (saved.player.scoreIntervalForLife) saved.player.scoreIntervalForLife = Math.floor(saved.player.scoreIntervalForLife / 10);
              }
              if (saved.nextLifeScore) saved.nextLifeScore = Math.floor(saved.nextLifeScore / 10);
              if (saved.scoreIntervalForLife) saved.scoreIntervalForLife = Math.floor(saved.scoreIntervalForLife / 10);
              saved._redenominated = true;
              localStorage.setItem('platypus_saved_game', JSON.stringify(saved));
            }
          } catch (err) {}
        }
        localStorage.setItem('platypus_score_redenominated_v2', 'true');
      }
    } catch (e) {
      console.warn('High score migration error:', e);
    }
  }

  resetAllHighScores() {
    try {
      const keys = [
        'platypus_highscore',
        'platypus_highscore_BEGINNER',
        'platypus_highscore_EASY',
        'platypus_highscore_NORMAL',
        'platypus_highscore_HARD',
        'platypus_highscore_EXTREME'
      ];
      for (const k of keys) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      console.warn('LocalStorage reset error:', e);
    }
    this.highScore = 0;
    this.highScoreDirty = false;
    this.highScoreSaveTimer = 0;
  }

  initLifeShipSprites() {
    if (typeof document === 'undefined') return;
    const frameCount = 6;
    for (let f = 0; f < frameCount; f++) {
      const off = document.createElement('canvas');
      off.width = 120;
      off.height = 70;
      const octx = off.getContext('2d');
      if (octx) {
        ClayRenderer.drawPlayerShip(octx, 60, 35, 0, false, (f / frameCount) * 6.28, 'NORMAL');
        this.lifeShipFrames.push(off);
      }
    }
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

    // 3. Dynamic Skills & Weapons Dock (Bottom Right - Special Weapon, Speed Boost [X])
    this.drawSkillsAndWeaponsDock(ctx, player);

    // 5. UHD Boss Battle Bar (Top Center - Compact & Solid Dynamic Color)
    if (this.bossHudAlpha > 0.01 && boss) {
      this.drawBossBar(ctx, boss);
    }

    // 7. Centered Announcement Banner
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
    ctx.fillText(this.scoreLabel.get(Math.floor(player.score)), sx, sy + 24);

    let nextY = sy + 44;

    // 2. High Score (Warm Gold Hue) - ONLY displayed when cheat mode is NOT active!
    if (!this.isCheatActive) {
      ctx.font = '700 13px "Fredoka", sans-serif';
      ctx.fillStyle = '#ffe082';
      ctx.fillText(this.highScoreLabel.get(this.highScore), sx, nextY);
      nextY += 20;
    }

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
    const pillY = nextY - 2;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ClayRenderer.drawClayCapsule(ctx, pillX, pillY, pillW, pillH, diffColor, '#1b120c');

    ctx.font = 'bold 10px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 3;
    ctx.fillText(`MODE: ${diffLabel}`, pillX, pillY);

    // 4. Prominent HUD Cheat Active Label (Only when cheat is active)
    if (this.isCheatActive) {
      const cheatPillW = 120;
      const cheatPillH = 18;
      const cheatPillX = pillX + pillW / 2 + 10 + cheatPillW / 2;
      const cheatPillY = pillY;

      const pulse = Math.sin(this.hudTick * 6) * 0.35 + 0.65;
      ctx.shadowColor = 'rgba(244, 67, 54, 0.7)';
      ctx.shadowBlur = 4 + pulse * 5;

      ClayRenderer.drawClayCapsule(ctx, cheatPillX, cheatPillY, cheatPillW, cheatPillH, '#c62828', '#ff5252');

      // Draw crisp vector warning icon
      const triX = cheatPillX - 44;
      const triY = cheatPillY;
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffe082';
      ctx.beginPath();
      ctx.moveTo(triX, triY - 5.5);
      ctx.lineTo(triX + 5.5, triY + 5);
      ctx.lineTo(triX - 5.5, triY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b71c1c';
      ctx.font = 'bold 7.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', triX, triY + 1.2);
      ctx.restore();

      ctx.font = 'bold 9.5px "Luckiest Guy", cursive';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 2;
      ctx.fillText('CURANG AKTIF', cheatPillX + 5, cheatPillY);
    }

    ctx.restore();
  }

  drawLivesPanel(ctx, player) {
    const isInfinite = Boolean(player.infiniteLives);
    const livesText = isInfinite ? '∞' : Math.max(0, player.lives).toString();

    ctx.save();

    // Bottom-Left Anchor
    const iconX = 42;
    const iconY = 688;

    // 1. Draw Player Aircraft Icon (Crisp Clay Vector Graphic from pre-rendered frames)
    ctx.save();
    ctx.translate(iconX, iconY);
    ctx.scale(0.68, 0.68);
    if (this.lifeShipFrames && this.lifeShipFrames.length > 0) {
      const fIdx = Math.floor(this.hudTick * 3) % this.lifeShipFrames.length;
      ctx.drawImage(this.lifeShipFrames[fIdx], -60, -35);
    } else {
      ClayRenderer.drawPlayerShip(ctx, 0, 0, 0, false, this.hudTick * 3, 'NORMAL');
    }
    ctx.restore();

    // 2. Number of Lives right beside the airplane icon
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = 'bold 22px "Luckiest Guy", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`x ${livesText}`, iconX + 34, iconY + 1);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Dynamic Skills & Weapons Dock (Bottom Right)
  // ---------------------------------------------------------------------------
  drawSkillsAndWeaponsDock(ctx, player) {
    if (!player) return;

    const hasSpecial = Boolean(player.activeWeapon && player.activeWeapon !== 'NORMAL');
    const timeLeft = Math.max(0, player.speedBoostTimeLeft || 0);
    const hasSpeedBoost = (timeLeft > 0);

    // Jika seluruh skill/peningkat habis dan senjata normal -> Layar bersih tanpa label
    if (!hasSpecial && !hasSpeedBoost) {
      return;
    }

    let curRightX = 1254;
    const cy = 668;
    const gaugeR = 24;

    ctx.save();

    // 1. Special Weapon Gauge (Hanya jika senjata aktif bukan NORMAL)
    if (hasSpecial) {
      const cx = curRightX - gaugeR;
      this.renderSpecialWeaponGauge(ctx, player, cx, cy, gaugeR);
      curRightX -= (gaugeR * 2 + 18);
    }

    // 2. Peningkat Kecepatan Senjata 2x [X] (Hanya jika sisa durasi > 0)
    if (hasSpeedBoost) {
      const cx = curRightX - gaugeR;
      this.renderSpeedBoostGauge(ctx, player, cx, cy, gaugeR, timeLeft);
      curRightX -= (gaugeR * 2 + 20);
    }

    ctx.restore();
  }

  static WEAPON_CONFIGS = {
    SPREAD: { color: '#ff1744', dot: '#ff5252' },
    LASER: { color: '#00e5ff', dot: '#29b6f6' },
    HOMING: { color: '#00e676', dot: '#69f0ae' },
    FLAK: { color: '#ffd600', dot: '#ffb300' },
    PLASMA: { color: '#e040fb', dot: '#ba68c8' }
  };

  getEmblemSprite(type, active = true) {
    const key = `${type}_${active}`;
    let sprite = this._emblemCache.get(key);
    if (!sprite && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 44;
      c.height = 44;
      const g = c.getContext('2d');
      if (g) {
        if (type === 'SPEED_BOOST') {
          const speedBg = active ? '#e65100' : '#4e342e';
          const speedBorder = active ? '#ffb74d' : '#8d6e63';
          ClayRenderer.drawClayBlob(g, 22, 22, 16, 16, speedBg, speedBorder);
          ClayRenderer.drawWeaponIcon(g, 22, 22, 'SPEED_BOOST', 12, active ? '#fff9c4' : '#ffffff');
        } else {
          const cur = HUD.WEAPON_CONFIGS[type] || { color: '#00e5ff', dot: '#29b6f6' };
          ClayRenderer.drawClayBlob(g, 22, 22, 16, 16, cur.dot, '#1a100a');
          ClayRenderer.drawWeaponIcon(g, 22, 22, type, 13, '#ffffff');
        }
      }
      sprite = c;
      this._emblemCache.set(key, sprite);
    }
    return sprite;
  }

  renderSpecialWeaponGauge(ctx, player, cx, cy, gaugeR) {
    const cur = HUD.WEAPON_CONFIGS[player.activeWeapon] || { color: '#00e5ff', dot: '#29b6f6' };
    const isExpiring = !player.infiniteWeapon && player.weaponTimeLeft <= 3.5;
    const ratio = player.infiniteWeapon ? 1.0 : Math.max(0, Math.min(1, player.weaponTimeLeft / (player.maxWeaponTime || 15.0)));

    // Subtle ambient shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // Background Ring Track
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(20, 15, 12, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, 0, Math.PI * 2);
    ctx.stroke();

    // Active Circular Countdown Arc (No numbers!)
    if (ratio > 0.005) {
      const pulseAlpha = isExpiring ? 0.6 + Math.sin(this.hudTick * 14) * 0.4 : 1.0;
      ctx.globalAlpha = pulseAlpha;
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = cur.color;
      ctx.shadowBlur = isExpiring ? 10 : 5;

      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * ratio;
      ctx.arc(cx, cy, gaugeR, startAngle, endAngle);
      ctx.stroke();
    }

    // Reset shadow & alpha
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // Center Clay Emblem with Weapon Icon (Fast cached sprite blit)
    const emblem = this.getEmblemSprite(player.activeWeapon);
    if (emblem) {
      ctx.drawImage(emblem, cx - 22, cy - 22);
    } else {
      ClayRenderer.drawClayBlob(ctx, cx, cy, 16, 16, cur.dot, '#1a100a');
      ClayRenderer.drawWeaponIcon(ctx, cx, cy, player.activeWeapon, 13, '#ffffff');
    }
  }

  renderSpeedBoostGauge(ctx, player, cx, cy, gaugeR, timeLeft) {
    const maxDuration = player.speedBoostMaxDuration || 15.0;
    const speedRatio = Math.max(0, Math.min(1, timeLeft / maxDuration));
    const isSpeedActive = Boolean(player.speedBoostActive && timeLeft > 0);
    const isExpiring = (timeLeft <= 3.5);

    // Subtle ambient shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // 1. Background Ring Track
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(20, 15, 12, 0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Active Circular Duration Ring
    if (speedRatio > 0.005) {
      const ringAlpha = isExpiring ? 0.6 + Math.sin(this.hudTick * 14) * 0.4 : 1.0;
      ctx.globalAlpha = ringAlpha;
      const ringColor = isSpeedActive ? '#ff9100' : '#ffb74d';
      const glowBlur = isSpeedActive ? (8 + Math.sin(this.hudTick * 12) * 4) : 4;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = glowBlur;

      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * speedRatio;
      ctx.arc(cx, cy, gaugeR, startAngle, endAngle);
      ctx.stroke();
    }

    // Reset shadow & alpha
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // 3. Center Clay Emblem (Fast cached sprite blit)
    const speedEmblem = this.getEmblemSprite('SPEED_BOOST', isSpeedActive);
    if (speedEmblem) {
      ctx.drawImage(speedEmblem, cx - 22, cy - 22);
    } else {
      const speedBg = isSpeedActive ? '#e65100' : '#4e342e';
      const speedBorder = isSpeedActive ? '#ffb74d' : '#8d6e63';
      ClayRenderer.drawClayBlob(ctx, cx, cy, 16, 16, speedBg, speedBorder);
      ClayRenderer.drawWeaponIcon(ctx, cx, cy, 'SPEED_BOOST', 12, isSpeedActive ? '#fff9c4' : '#ffffff');
    }
  }

  // Compatibility stubs
  drawWeaponGauge(ctx, player) {}
  drawActiveSkills(ctx, player) {}
  drawWaveIndicator(ctx, stageInfo) {}

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
      const coreR = Math.max(0, boss.currentHp / (boss.maxTotalHp || 1));
      components = [
        {
          name: 'PERISAI KEBAL',
          alive: boss.isInvulnerable,
          ratio: boss.isInvulnerable ? 1.0 : 0.0,
          statusText: boss.isInvulnerable ? 'AKTIF' : 'OFF',
          icon: '🛡️'
        },
        {
          name: 'HYPER DASH',
          alive: boss.dashState === 'RUSH' || boss.dashState === 'TELEGRAPH',
          ratio: (boss.dashState === 'RUSH' || boss.dashState === 'TELEGRAPH') ? 1.0 : 0.0,
          statusText: boss.dashState === 'RUSH' ? 'RUSH!' : (boss.dashState === 'TELEGRAPH' ? 'CHARGE' : 'SIAP'),
          icon: '⚡'
        },
        {
          name: 'APEX CORE',
          alive: boss.currentHp > 0,
          ratio: coreR,
          statusText: `${Math.ceil(coreR * 100)}%`,
          icon: '🔥'
        }
      ];
    } else if (boss.bossType === 'OMEGA_COLOSSUS') {
      const topR = boss.railTopMaxHp ? Math.max(0, boss.railTopHp / boss.railTopMaxHp) : (boss.railTopAlive ? 1 : 0);
      const botR = boss.railBottomMaxHp ? Math.max(0, boss.railBottomHp / boss.railBottomMaxHp) : (boss.railBottomAlive ? 1 : 0);
      const droneR = boss.droneCoreMaxHp ? Math.max(0, boss.droneCoreHp / boss.droneCoreMaxHp) : (boss.droneCoreAlive ? 1 : 0);
      components = [
        { name: 'TOP RAILGUN', alive: boss.railTopAlive, ratio: topR, icon: '⚡' },
        { name: 'BOT RAILGUN', alive: boss.railBottomAlive, ratio: botR, icon: '⚡' },
        { name: 'DRONE HIVE', alive: boss.droneCoreAlive, ratio: droneR, icon: '🛸' }
      ];
    } else if (boss.bossType === 'GOLIATH_ZEPPELIN') {
      const mortarR = boss.mortarMaxHp ? Math.max(0, boss.mortarHp / boss.mortarMaxHp) : (boss.mortarAlive ? 1 : 0);
      const hangarR = boss.hangarMaxHp ? Math.max(0, boss.hangarHp / boss.hangarMaxHp) : (boss.hangarAlive ? 1 : 0);
      components = [
        { name: 'HEAVY MORTAR', alive: boss.mortarAlive, ratio: mortarR, icon: '💣' },
        { name: 'HANGAR BAY', alive: boss.hangarAlive, ratio: hangarR, icon: '✈️' }
      ];
    } else if (boss.bossType === 'LEVIATHAN_TITAN') {
      const topR = boss.wingTopMaxHp ? Math.max(0, boss.wingTopHp / boss.wingTopMaxHp) : (boss.wingTopAlive ? 1 : 0);
      const botR = boss.wingBottomMaxHp ? Math.max(0, boss.wingBottomHp / boss.wingBottomMaxHp) : (boss.wingBottomAlive ? 1 : 0);
      const podR = boss.missilePodMaxHp ? Math.max(0, boss.missilePodHp / boss.missilePodMaxHp) : (boss.missilePodAlive ? 1 : 0);
      components = [
        { name: 'DORSAL WING', alive: boss.wingTopAlive, ratio: topR, icon: '🪶' },
        { name: 'VENTRAL WING', alive: boss.wingBottomAlive, ratio: botR, icon: '🪶' },
        { name: 'MISSILE POD', alive: boss.missilePodAlive, ratio: podR, icon: '🚀' }
      ];
    } else {
      // Dreadnought
      const topR = boss.turretTopMaxHp ? Math.max(0, boss.turretTopHp / boss.turretTopMaxHp) : (boss.turretTopAlive ? 1 : 0);
      const botR = boss.turretBottomMaxHp ? Math.max(0, boss.turretBottomHp / boss.turretBottomMaxHp) : (boss.turretBottomAlive ? 1 : 0);
      components = [
        { name: 'TURET ATAS', alive: boss.turretTopAlive, ratio: topR, icon: '🎯' },
        { name: 'TURET BAWAH', alive: boss.turretBottomAlive, ratio: botR, icon: '🎯' }
      ];
    }

    const total = components.length;
    const compW = total === 2 ? 148 : 126;
    const compH = 22;
    const gap = total === 2 ? 14 : 10;
    const startX = cx - ((total * compW + (total - 1) * gap) / 2);

    for (let i = 0; i < total; i++) {
      const c = components[i];
      const compX = startX + i * (compW + gap) + compW / 2;
      const compY = sy;

      // 1. Sleek semi-transparent glass capsule container
      const bgColor = c.alive ? 'rgba(20, 30, 40, 0.88)' : 'rgba(38, 18, 22, 0.82)';
      const borderColor = c.alive ? '#37474f' : '#b71c1c';
      ClayRenderer.drawClayCapsule(ctx, compX, compY, compW, compH, bgColor, borderColor);

      // 2. Header text: Icon + Name (Left) and Percentage / Status (Right)
      const textY = compY - 4;
      const padX = 8;
      const leftX = compX - compW / 2 + padX;
      const rightX = compX + compW / 2 - padX;

      // Icon & Name
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '700 9px "Fredoka", sans-serif';
      ctx.fillStyle = c.alive ? '#e0f7fa' : '#78909c';
      ctx.fillText(`${c.icon || '⚙️'} ${c.name}`, leftX, textY);

      // Status / Percent
      ctx.textAlign = 'right';
      ctx.font = 'bold 9px "Fredoka", sans-serif';
      if (c.alive) {
        const pct = c.statusText || `${Math.ceil(c.ratio * 100)}%`;
        ctx.fillStyle = c.ratio > 0.5 ? '#80deea' : (c.ratio > 0.25 ? '#ffe082' : '#ff8a80');
        ctx.fillText(pct, rightX, textY);
      } else {
        ctx.fillStyle = '#ef5350';
        ctx.fillText('💥 HANCUR', rightX, textY);
      }

      // 3. Bottom Row: Sleek Micro HP Gauge Track
      const trackX = leftX;
      const trackY = compY + 3;
      const trackW = compW - padX * 2;
      const trackH = 3.5;

      // Track slot background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(trackX, trackY, trackW, trackH, 1.5);
      ctx.fill();

      // Active fill
      if (c.alive && c.ratio > 0) {
        const fillW = Math.max(2, trackW * Math.min(1.0, c.ratio));
        let barColor = '#00e5ff';
        if (c.ratio <= 0.25) {
          barColor = '#ff1744';
        } else if (c.ratio <= 0.50) {
          barColor = '#ffb300';
        }

        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, fillW, trackH, 1.5);
        ctx.fill();

        // Delicate glass highlight sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, fillW, trackH * 0.45, 1);
        ctx.fill();
      } else if (!c.alive) {
        // Faded offline circuit line
        ctx.fillStyle = 'rgba(255, 23, 68, 0.25)';
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, trackW, trackH, 1.5);
        ctx.fill();
      }
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
