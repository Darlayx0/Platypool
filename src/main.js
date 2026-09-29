// Entry Point for Platypus AI Arcade Game
import { Game } from './engine/Game.js';
import { InputManager } from './engine/Input.js';

function initGameApp() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  const input = new InputManager(canvas);

  // DOM Modals
  const modalStart = document.getElementById('modal-start');
  let cycleDifficulty = null;
  const modalPause = document.getElementById('modal-pause');
  const modalGameOver = document.getElementById('modal-gameover');
  const modalVictory = document.getElementById('modal-victory');
  const modalCheat = document.getElementById('modal-cheat');
  const modalSettings = document.getElementById('modal-settings');
  const modalGuide = document.getElementById('modal-guide');

  // DOM Buttons - Navigation & Actions
  const btnPlayGame = document.getElementById('btn-play-game');
  const btnResume = document.getElementById('btn-resume');
  const btnRestartPause = document.getElementById('btn-restart-pause');
  const btnMenuPause = document.getElementById('btn-menu-pause');
  const btnRetry = document.getElementById('btn-retry');
  const btnMenuGameOver = document.getElementById('btn-menu-gameover');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const btnMenuVictory = document.getElementById('btn-menu-victory');

  // Navigation & Modal triggers
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnSettingsPause = document.getElementById('btn-settings-pause');
  const btnSettingsGameOver = document.getElementById('btn-settings-gameover');
  const btnSettingsVictory = document.getElementById('btn-settings-victory');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const btnSettingsReset = document.getElementById('btn-settings-reset');
  const btnOpenGuide = document.getElementById('btn-open-guide');
  const btnGuideClose = document.getElementById('btn-guide-close');

  // Settings DOM controls
  const settingSfxToggle = document.getElementById('setting-sfx-toggle');
  const settingSfxVolume = document.getElementById('setting-sfx-volume');
  const settingSfxVolBadge = document.getElementById('setting-sfx-vol-badge');
  const btnSfxVolDec = document.getElementById('btn-sfx-vol-dec');
  const btnSfxVolInc = document.getElementById('btn-sfx-vol-inc');
  const wrapSfxSlider = document.getElementById('wrap-sfx-slider');

  const settingMusicToggle = document.getElementById('setting-music-toggle');
  const settingMusicVolume = document.getElementById('setting-music-volume');
  const settingMusicVolBadge = document.getElementById('setting-music-vol-badge');
  const btnMusicVolDec = document.getElementById('btn-music-vol-dec');
  const btnMusicVolInc = document.getElementById('btn-music-vol-inc');
  const wrapMusicSlider = document.getElementById('wrap-music-slider');

  const btnModeMouse = document.getElementById('btn-mode-mouse');
  const btnModeKeyboard = document.getElementById('btn-mode-keyboard');
  const controlModeDesc = document.getElementById('control-mode-desc');
  const settingAutofireToggle = document.getElementById('setting-autofire-toggle');

  // Floating In-Game HUD Top Bar Controls
  const hudTopBar = document.getElementById('hud-top-bar');
  const hudStageBadge = document.getElementById('hud-stage-badge');
  const hudStageText = document.getElementById('hud-stage-text');
  const hudDiffBadge = document.getElementById('hud-diff-badge');
  const hudDiffText = document.getElementById('hud-diff-text');

  const btnHudAutoFire = document.getElementById('btn-hud-autofire');
  const hudAutoFirePip = document.getElementById('hud-autofire-pip');
  const btnHudMode = document.getElementById('btn-hud-mode');
  const hudModeIcon = document.getElementById('hud-mode-icon');
  const hudModeLabel = document.getElementById('hud-mode-label');
  const btnHudUhd = document.getElementById('btn-hud-uhd');
  const hudUhdPip = document.getElementById('hud-uhd-pip');
  const btnHudAudio = document.getElementById('btn-hud-audio');
  const hudAudioIcon = document.getElementById('hud-audio-icon');
  const hudAudioLabel = document.getElementById('hud-audio-label');
  const btnHudSettings = document.getElementById('btn-hud-settings');
  const btnHudFullscreen = document.getElementById('btn-hud-fullscreen');
  const hudFsIcon = document.getElementById('hud-fs-icon');
  const btnHudPause = document.getElementById('btn-hud-pause');

  // Settings Modal Display / UHD controls
  const settingUhdToggle = document.getElementById('setting-uhd-toggle');
  const btnSettingFullscreen = document.getElementById('btn-setting-fullscreen');
  const settingFsBtnLabel = document.getElementById('setting-fs-btn-label');

  // In-Game Floating Toast Notification
  const hudToast = document.getElementById('hud-toast');

  // Cheat DOM Controls
  const btnOpenCheat = document.getElementById('btn-open-cheat');
  const cheatPillIndicator = document.getElementById('cheat-pill-indicator');
  const cheatMasterToggle = document.getElementById('cheat-master-toggle');
  const cheatMasterStatusDesc = document.getElementById('cheat-master-status-desc');
  const cheatControlsPanel = document.getElementById('cheat-controls-panel');
  const cheatTabButtons = document.querySelectorAll('.cheat-tab-btn');
  const cheatTabPanes = document.querySelectorAll('.cheat-tab-pane');

  // Config 1: Awal Stage
  const cheatStageSlider = document.getElementById('cheat-stage-slider');
  const cheatStageValBadge = document.getElementById('cheat-stage-val-badge');
  const cheatStageDesc = document.getElementById('cheat-stage-desc');
  const btnStageDec = document.getElementById('btn-stage-dec');
  const btnStageInc = document.getElementById('btn-stage-inc');
  const quickStageChips = document.querySelectorAll('.quick-chip[data-set-stage]');

  // Config 2: Durasi Senjata Spesial
  const btnToggleDiffWeapon = document.getElementById('btn-toggle-diff-weapon');
  const cheatWeaponValBadge = document.getElementById('cheat-weapon-val-badge');
  const wrapWeaponControls = document.getElementById('wrap-weapon-controls');
  const cheatWeaponSlider = document.getElementById('cheat-weapon-slider');
  const btnWeaponDec = document.getElementById('btn-weapon-dec');
  const btnWeaponInc = document.getElementById('btn-weapon-inc');
  const btnToggleInfiniteWeapon = document.getElementById('btn-toggle-infinite-weapon');
  const quickWeaponChips = document.querySelectorAll('.quick-chip[data-set-weapon]');

  // Config 3: Nyawa Awal
  const btnToggleDiffStartingLives = document.getElementById('btn-toggle-diff-starting-lives');
  const cheatLivesValBadge = document.getElementById('cheat-lives-val-badge');
  const wrapLivesControls = document.getElementById('wrap-lives-controls');
  const cheatLivesSlider = document.getElementById('cheat-lives-slider');
  const btnLivesDec = document.getElementById('btn-lives-dec');
  const btnLivesInc = document.getElementById('btn-lives-inc');
  const btnToggleInfiniteLives = document.getElementById('btn-toggle-infinite-lives');
  const quickLivesChips = document.querySelectorAll('.quick-chip[data-set-lives]');

  // Config 4: Nyawa Maksimal
  const btnToggleDiffMaxLives = document.getElementById('btn-toggle-diff-max-lives');
  const cheatMaxLivesValBadge = document.getElementById('cheat-max-lives-val-badge');
  const wrapMaxLivesControls = document.getElementById('wrap-max-lives-controls');
  const cheatMaxLivesSlider = document.getElementById('cheat-max-lives-slider');
  const btnMaxLivesDec = document.getElementById('btn-max-lives-dec');
  const btnMaxLivesInc = document.getElementById('btn-max-lives-inc');
  const quickMaxLivesChips = document.querySelectorAll('.quick-chip[data-set-max-lives]');

  // Config 5: Interval Skor +1 Nyawa
  const btnToggleDiffScoreInterval = document.getElementById('btn-toggle-diff-score-interval');
  const cheatScoreIntervalValBadge = document.getElementById('cheat-score-interval-val-badge');
  const wrapScoreIntervalControls = document.getElementById('wrap-score-interval-controls');
  const cheatScoreIntervalSlider = document.getElementById('cheat-score-interval-slider');
  const btnScoreIntervalDec = document.getElementById('btn-score-interval-dec');
  const btnScoreIntervalInc = document.getElementById('btn-score-interval-inc');
  const quickScoreIntervalChips = document.querySelectorAll('.quick-chip[data-set-score-interval]');

  // Config 6: Pengganda HP Musuh
  const btnToggleDiffEnemyHp = document.getElementById('btn-toggle-diff-enemy-hp');
  const cheatEnemyHpValBadge = document.getElementById('cheat-enemy-hp-val-badge');
  const wrapEnemyHpControls = document.getElementById('wrap-enemy-hp-controls');
  const cheatEnemyHpSlider = document.getElementById('cheat-enemy-hp-slider');
  const btnEnemyHpDec = document.getElementById('btn-enemy-hp-dec');
  const btnEnemyHpInc = document.getElementById('btn-enemy-hp-inc');
  const quickEnemyHpChips = document.querySelectorAll('.quick-chip[data-set-enemy-hp]');

  // Config 7: Jeda Tembak Musuh
  const btnToggleDiffShootCooldown = document.getElementById('btn-toggle-diff-shoot-cooldown');
  const cheatShootCooldownValBadge = document.getElementById('cheat-shoot-cooldown-val-badge');
  const wrapShootCooldownControls = document.getElementById('wrap-shoot-cooldown-controls');
  const cheatShootCooldownSlider = document.getElementById('cheat-shoot-cooldown-slider');
  const btnShootCooldownDec = document.getElementById('btn-shoot-cooldown-dec');
  const btnShootCooldownInc = document.getElementById('btn-shoot-cooldown-inc');
  const quickShootCooldownChips = document.querySelectorAll('.quick-chip[data-set-shoot-cooldown]');

  // Config 8: Kecepatan Peluru Musuh
  const btnToggleDiffBulletSpeed = document.getElementById('btn-toggle-diff-bullet-speed');
  const cheatBulletSpeedValBadge = document.getElementById('cheat-bullet-speed-val-badge');
  const wrapBulletSpeedControls = document.getElementById('wrap-bullet-speed-controls');
  const cheatBulletSpeedSlider = document.getElementById('cheat-bullet-speed-slider');
  const btnBulletSpeedDec = document.getElementById('btn-bullet-speed-dec');
  const btnBulletSpeedInc = document.getElementById('btn-bullet-speed-inc');
  const quickBulletSpeedChips = document.querySelectorAll('.quick-chip[data-set-bullet-speed]');

  const btnCheatReset = document.getElementById('btn-cheat-reset');
  const btnCheatSave = document.getElementById('btn-cheat-save');

  // Stats & notices displays
  const textGameOverStats = document.getElementById('gameover-stats');
  const textGameOverHighscore = document.getElementById('gameover-highscore');
  const gameoverCheatNotice = document.getElementById('gameover-cheat-notice');
  const textVictoryStats = document.getElementById('victory-stats');
  const victoryCheatNotice = document.getElementById('victory-cheat-notice');

  // Modal navigation manager with history
  const allModals = [modalStart, modalPause, modalGameOver, modalVictory, modalCheat, modalSettings, modalGuide];
  let previousModalBeforeSettings = modalStart;

  // Celebratory Confetti Particle System for Victory Screen
  let confettiAnimId = null;
  const confettiCanvas = document.getElementById('victory-confetti-canvas');
  let confettiParticles = [];

  function startVictoryConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    if (!ctx) return;

    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = [
      '#ffd54f', '#ffb300', '#ff8a65', '#ef5350', 
      '#66bb6a', '#42a5f5', '#ab47bc', '#fff9c4'
    ];

    confettiParticles = [];
    for (let i = 0; i < 95; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * -confettiCanvas.height,
        r: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2.5 + Math.random() * 3.5,
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: 0.04 + Math.random() * 0.08,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

    function renderConfetti() {
      if (!modalVictory || (!modalVictory.classList.contains('active') && modalVictory.style.display !== 'flex')) {
        stopVictoryConfetti();
        return;
      }
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      for (let i = 0; i < confettiParticles.length; i++) {
        const p = confettiParticles[i];
        p.y += p.vy;
        p.x += Math.sin(p.tiltAngle) * 1.5 + p.vx;
        p.tiltAngle += p.tiltSpeed;

        if (p.y > confettiCanvas.height) {
          p.y = -20;
          p.x = Math.random() * confettiCanvas.width;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.tiltAngle);
          ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2);
          ctx.restore();
        }
      }

      confettiAnimId = requestAnimationFrame(renderConfetti);
    }

    renderConfetti();
  }

  function stopVictoryConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    if (confettiCanvas) {
      const ctx = confettiCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function showModal(modal) {
    if (modal !== modalVictory) {
      stopVictoryConfetti();
    }
    allModals.forEach(m => {
      if (m && m !== modal) {
        m.classList.remove('active');
        m.style.display = 'none';
      }
    });
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
    if (hudTopBar) {
      if (modal === modalStart || !modal) {
        hudTopBar.classList.add('hidden');
      } else {
        hudTopBar.classList.remove('hidden');
      }
    }
  }

  function hideAllModals() {
    stopVictoryConfetti();
    allModals.forEach(m => {
      if (m) {
        m.classList.remove('active');
        m.style.display = 'none';
      }
    });
    if (hudTopBar) {
      hudTopBar.classList.remove('hidden');
    }
  }

  // Micro-interaction toast popup for in-game shortcuts
  let toastTimer = null;
  function showToast(text, styleClass = '', duration = 1600) {
    if (!hudToast) return;
    hudToast.innerText = text;
    hudToast.className = `hud-toast ${styleClass}`;
    hudToast.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      hudToast.style.opacity = '0';
      setTimeout(() => {
        hudToast.style.display = 'none';
        hudToast.style.opacity = '1';
      }, 300);
    }, duration);
  }

  // Setup Game with UI callbacks
  const game = new Game(canvas, {
    input,
    onStageChanged: (stage, total, cfg) => {
      syncStageBadge(stage, total);
    },
    onUhdChanged: (isEnabled) => {
      syncUhdUI(isEnabled);
    },
    onPause: (isPaused) => {
      if (isPaused) {
        const diffName = game.difficulty || 'NORMAL';
        const badge = document.getElementById('pause-difficulty-badge');
        if (badge) {
          badge.innerText = `MODE: ${diffName}`;
          badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
        }
        const stageVal = document.getElementById('pause-stage-val');
        const scoreVal = document.getElementById('pause-score-val');
        const livesVal = document.getElementById('pause-lives-val');
        if (stageVal) stageVal.innerText = `Stage ${game.currentStage || 1} / ${game.totalStages || 20}`;
        if (scoreVal) scoreVal.innerText = Math.floor((game.player && game.player.score) || 0).toLocaleString();
        if (livesVal) {
          const l = (game.player && game.player.lives !== undefined) ? game.player.lives : 3;
          livesVal.innerText = `❤️ ${l}`;
        }
        showModal(modalPause);
      } else {
        hideAllModals();
      }
    },
    onGameOver: (score, stage, totalStages, wave, highscore, diffConfig, isCheat) => {
      const diffName = (diffConfig && diffConfig.name) || game.difficulty || 'NORMAL';
      if (textGameOverStats) textGameOverStats.innerText = `Mode: ${diffName} | Skor: ${score.toLocaleString()} | Stage: ${stage} / ${totalStages} (Gelombang ${wave})`;
      if (textGameOverHighscore) textGameOverHighscore.innerText = `Skor Tertinggi (${diffName}): ${highscore.toLocaleString()}`;
      const badge = document.getElementById('gameover-difficulty-badge');
      if (badge) {
        badge.innerText = `MODE: ${diffName}`;
        badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
      }
      if (gameoverCheatNotice) {
        gameoverCheatNotice.style.display = isCheat ? 'inline-block' : 'none';
      }

      // Populate rich clay performance deck
      const scoreDisp = document.getElementById('gameover-score-display');
      const stageDisp = document.getElementById('gameover-stage-val');
      const waveDisp = document.getElementById('gameover-wave-val');
      const highscoreDisp = document.getElementById('gameover-highscore-val');
      const recordBadge = document.getElementById('gameover-new-record');

      if (scoreDisp) scoreDisp.innerText = score.toLocaleString();
      if (stageDisp) stageDisp.innerText = `Stage ${stage} / ${totalStages}`;
      if (waveDisp) waveDisp.innerText = `Gelombang ${wave}`;
      if (highscoreDisp) highscoreDisp.innerText = highscore.toLocaleString();
      if (recordBadge) {
        const isNewRecord = !isCheat && score > 0 && score >= highscore;
        recordBadge.style.display = isNewRecord ? 'inline-flex' : 'none';
      }

      showModal(modalGameOver);
    },
    onVictory: (score, totalStages, diffConfig, isCheat) => {
      const diffName = (diffConfig && diffConfig.name) || game.difficulty || 'NORMAL';
      if (textVictoryStats) textVictoryStats.innerText = `Mode: ${diffName} | Skor Akhir: ${score.toLocaleString()} | SELURUH ${totalStages} STAGE SELESAI!`;
      const badge = document.getElementById('victory-difficulty-badge');
      if (badge) {
        badge.innerText = `MODE: ${diffName}`;
        badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
      }
      if (victoryCheatNotice) {
        victoryCheatNotice.style.display = isCheat ? 'inline-block' : 'none';
      }

      // Populate rich clay victory showcase deck
      const scoreDisp = document.getElementById('victory-score-display');
      const stageDisp = document.getElementById('victory-stage-val');
      const highscoreDisp = document.getElementById('victory-highscore-val');
      const recordBadge = document.getElementById('victory-new-record');
      const rankTitle = document.getElementById('victory-rank-title');

      if (scoreDisp) scoreDisp.innerText = score.toLocaleString();
      if (stageDisp) stageDisp.innerText = `${totalStages} / ${totalStages} SELESAI (100%)`;
      if (highscoreDisp) {
        const curHighScore = (game.hud && game.hud.highScore) || score;
        highscoreDisp.innerText = curHighScore.toLocaleString();
      }
      if (recordBadge) {
        const curHighScore = (game.hud && game.hud.highScore) || 0;
        const isNewRecord = !isCheat && score >= curHighScore;
        recordBadge.style.display = isNewRecord ? 'inline-flex' : 'none';
      }
      if (rankTitle) {
        if (isCheat) {
          rankTitle.innerText = 'PILOT EKSPERIMENTAL (MODE CURANG)';
        } else if (diffName === 'EXTREME') {
          rankTitle.innerText = 'RANK SSS+ • DEWA TEMPUR TANAH LIAT';
        } else if (diffName === 'HARD') {
          rankTitle.innerText = 'RANK S • PANGLIMA UDARA LEGENDARIS';
        } else if (diffName === 'NORMAL') {
          rankTitle.innerText = 'RANK A • PILOT ACE TANGGUH';
        } else {
          rankTitle.innerText = 'RANK B+ • PEJUANG KELAS SATU';
        }
      }

      startVictoryConfetti();
      showModal(modalVictory);
    }
  });

  // SVG Icon definitions for professional HUD controls
  const ICONS = {
    SOUND_ON: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
    SOUND_OFF: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
    MUSIC_ON: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
    MUSIC_OFF: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.27 3L3 4.27l9 9v1.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l4.27 4.27 1.27-1.27L4.27 3zM14 7h4V3h-6v5.18l2 2V7z"/></svg>`,
    MOUSE: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 1.07V9h7c0-4.08-3.05-7.44-7-7.93zM4 15c0 4.42 3.58 8 8 8s8-3.58 8-8v-4H4v4zm7-13.93C7.05 1.56 4 4.92 4 9h7V1.07z"/></svg>`,
    KEYBOARD: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>`,
    FULLSCREEN_ENTER: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
    FULLSCREEN_EXIT: `<svg class="hud-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`
  };

  // Ensure always fullscreen on player interaction
  const ensureFullscreen = () => {
    if (!document.fullscreenElement) {
      const elem = document.documentElement || document.getElementById('game-wrapper');
      if (elem && elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    }
  };

  // Start Game Action
  const triggerStartGame = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    ensureFullscreen();
    hideAllModals();
    game.start();
  };

  if (btnPlayGame) {
    btnPlayGame.addEventListener('click', triggerStartGame);
    btnPlayGame.addEventListener('touchstart', triggerStartGame, { passive: false });
  }

  canvas.addEventListener('click', () => {
    ensureFullscreen();
  });

  // Navigation: Return to Main Menu
  const returnToMainMenu = () => {
    if (game.sound && game.sound.initialized) {
      game.sound.playUiClick();
    }
    game.goToMainMenu();
    showModal(modalStart);
  };

  // ==========================================
  // SETTINGS & AUDIO CONTROLS MANAGER
  // ==========================================
  const SETTINGS_STORAGE = {
    SFX_ENABLED: 'platypus_setting_sfx_enabled',
    SFX_VOLUME: 'platypus_setting_sfx_volume',
    MUSIC_ENABLED: 'platypus_setting_music_enabled',
    MUSIC_VOLUME: 'platypus_setting_music_volume',
    CONTROL_MODE: 'platypus_setting_control_mode',
    AUTOFIRE: 'platypus_setting_autofire',
    UHD_ENABLED: 'platypus_uhd'
  };

  const settingsState = {
    sfxEnabled: localStorage.getItem(SETTINGS_STORAGE.SFX_ENABLED) !== 'false',
    sfxVolume: localStorage.getItem(SETTINGS_STORAGE.SFX_VOLUME) !== null 
      ? parseInt(localStorage.getItem(SETTINGS_STORAGE.SFX_VOLUME), 10) 
      : 85,
    musicEnabled: localStorage.getItem(SETTINGS_STORAGE.MUSIC_ENABLED) !== 'false',
    musicVolume: localStorage.getItem(SETTINGS_STORAGE.MUSIC_VOLUME) !== null 
      ? parseInt(localStorage.getItem(SETTINGS_STORAGE.MUSIC_VOLUME), 10) 
      : 50,
    controlMode: localStorage.getItem(SETTINGS_STORAGE.CONTROL_MODE) || 'MOUSE',
    autoFire: localStorage.getItem(SETTINGS_STORAGE.AUTOFIRE) === 'true',
    uhdEnabled: localStorage.getItem(SETTINGS_STORAGE.UHD_ENABLED) !== 'false'
  };

  // Floating HUD & Settings UI Synchronizers
  function syncStageBadge(stage, total) {
    if (hudStageText) {
      hudStageText.innerText = `STAGE ${stage || 1} / ${total || 20}`;
    }
  }

  function syncDifficultyBadge(diffKey) {
    const key = (diffKey ? diffKey.toUpperCase() : 'NORMAL');
    if (hudDiffText) {
      hudDiffText.innerText = key;
    }
    if (hudDiffBadge) {
      const allThemes = [
        'diff-theme-beginner',
        'diff-theme-easy',
        'diff-theme-normal',
        'diff-theme-hard',
        'diff-theme-extreme'
      ];
      hudDiffBadge.classList.remove(...allThemes);
      hudDiffBadge.classList.add(`diff-theme-${key.toLowerCase()}`);
    }
  }

  function syncAutoFireUI(isActive) {
    if (btnHudAutoFire) {
      btnHudAutoFire.classList.toggle('active', Boolean(isActive));
    }
    if (hudAutoFirePip) {
      hudAutoFirePip.innerText = isActive ? 'ON' : 'OFF';
      hudAutoFirePip.className = `btn-status-pip ${isActive ? 'on' : ''}`;
    }
    if (settingAutofireToggle) {
      settingAutofireToggle.checked = Boolean(isActive);
    }
  }

  function syncControlModeUI(mode) {
    const isMouse = mode === 'MOUSE';
    if (hudModeLabel) {
      hudModeLabel.innerText = isMouse ? 'MOUSE' : 'KEYBOARD';
    }
    if (hudModeIcon) {
      hudModeIcon.innerText = isMouse ? '🖱️' : '⌨️';
    }
    if (btnHudMode) {
      btnHudMode.title = isMouse 
        ? 'Mode Kemudi: MOUSE (Klik untuk beralih ke WASD/Keyboard)' 
        : 'Mode Kemudi: KEYBOARD (Klik untuk beralih ke Mouse)';
    }
    if (btnModeMouse && btnModeKeyboard) {
      if (isMouse) {
        btnModeMouse.classList.add('active');
        btnModeKeyboard.classList.remove('active');
        if (controlModeDesc) controlModeDesc.innerText = 'Pesawat bermanuver mulus mengikuti pergerakan kursor mouse di arena permainan secara presisi.';
      } else {
        btnModeKeyboard.classList.add('active');
        btnModeMouse.classList.remove('active');
        if (controlModeDesc) controlModeDesc.innerText = 'Gunakan tombol W, A, S, D atau Tombol Panah pada keyboard untuk mengemudikan pesawat.';
      }
    }
  }

  function syncUhdUI(isEnabled) {
    settingsState.uhdEnabled = Boolean(isEnabled);
    if (settingUhdToggle) {
      settingUhdToggle.checked = Boolean(isEnabled);
    }
    if (btnHudUhd) {
      btnHudUhd.classList.toggle('active', Boolean(isEnabled));
      btnHudUhd.title = isEnabled 
        ? 'Mode Resolusi UHD Retina/4K Aktif (Klik untuk Mode Standar)' 
        : 'Mode Resolusi Standar Aktif (Klik untuk Aktifkan UHD Retina/4K)';
    }
    if (hudUhdPip) {
      hudUhdPip.innerText = isEnabled ? 'ON' : 'OFF';
      hudUhdPip.className = `btn-status-pip ${isEnabled ? 'on' : ''}`;
    }
  }

  function syncFullscreenUI() {
    const isFs = Boolean(document.fullscreenElement);
    if (hudFsIcon) {
      hudFsIcon.innerText = isFs ? '🗗' : '⛶';
    }
    if (btnHudFullscreen) {
      btnHudFullscreen.title = isFs ? 'Keluar Layar Penuh (ESC)' : 'Mode Layar Penuh';
      btnHudFullscreen.classList.toggle('active', isFs);
    }
    if (settingFsBtnLabel) {
      settingFsBtnLabel.innerText = isFs ? 'Keluar Layar Penuh' : 'Aktifkan Layar Penuh';
    }
    if (btnSettingFullscreen) {
      btnSettingFullscreen.classList.toggle('active', isFs);
    }
  }

  function syncAudioMuteUI(isMuted) {
    if (btnHudAudio) {
      btnHudAudio.classList.toggle('active', Boolean(isMuted));
    }
    if (hudAudioIcon) {
      hudAudioIcon.innerText = isMuted ? '🔇' : '🔊';
    }
    if (hudAudioLabel) {
      hudAudioLabel.innerText = isMuted ? 'MUTE' : 'SUARA';
    }
  }

  const applySettingsToEngine = (notify = false) => {
    game.sound.setSFXEnabled(settingsState.sfxEnabled);
    game.sound.setSFXVolume(settingsState.sfxVolume / 100);
    game.sound.setMusicEnabled(settingsState.musicEnabled);
    game.sound.setMusicVolume(settingsState.musicVolume / 100);
    input.setControlMode(settingsState.controlMode);
    input.setAutoFire(settingsState.autoFire, notify);
    if (typeof game.setUhdEnabled === 'function') {
      game.setUhdEnabled(settingsState.uhdEnabled);
    }
    syncControlModeUI(settingsState.controlMode);
    syncAutoFireUI(settingsState.autoFire);
    syncUhdUI(settingsState.uhdEnabled);
    syncFullscreenUI();
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE.SFX_ENABLED, settingsState.sfxEnabled);
      localStorage.setItem(SETTINGS_STORAGE.SFX_VOLUME, settingsState.sfxVolume);
      localStorage.setItem(SETTINGS_STORAGE.MUSIC_ENABLED, settingsState.musicEnabled);
      localStorage.setItem(SETTINGS_STORAGE.MUSIC_VOLUME, settingsState.musicVolume);
      localStorage.setItem(SETTINGS_STORAGE.CONTROL_MODE, settingsState.controlMode);
      localStorage.setItem(SETTINGS_STORAGE.AUTOFIRE, settingsState.autoFire);
      localStorage.setItem(SETTINGS_STORAGE.UHD_ENABLED, settingsState.uhdEnabled);
    } catch (e) {
      console.warn('LocalStorage error saving settings:', e);
    }
  };

  const syncSettingsUI = () => {
    if (settingSfxToggle) settingSfxToggle.checked = settingsState.sfxEnabled;
    if (wrapSfxSlider) {
      if (settingsState.sfxEnabled) wrapSfxSlider.classList.remove('disabled');
      else wrapSfxSlider.classList.add('disabled');
    }
    if (settingSfxVolume) settingSfxVolume.value = settingsState.sfxVolume;
    if (settingSfxVolBadge) settingSfxVolBadge.innerText = `${settingsState.sfxVolume}%`;

    if (settingMusicToggle) settingMusicToggle.checked = settingsState.musicEnabled;
    if (wrapMusicSlider) {
      if (settingsState.musicEnabled) wrapMusicSlider.classList.remove('disabled');
      else wrapMusicSlider.classList.add('disabled');
    }
    if (settingMusicVolume) settingMusicVolume.value = settingsState.musicVolume;
    if (settingMusicVolBadge) settingMusicVolBadge.innerText = `${settingsState.musicVolume}%`;

    syncControlModeUI(settingsState.controlMode);
    syncAutoFireUI(settingsState.autoFire);
    syncUhdUI(settingsState.uhdEnabled);
    syncFullscreenUI();
  };

  const openSettingsModal = (sourceModal = modalStart) => {
    previousModalBeforeSettings = sourceModal;
    game.sound.init();
    game.sound.playUiClick();
    syncSettingsUI();
    showModal(modalSettings);
  };

  const closeSettingsModal = () => {
    game.sound.init();
    game.sound.playUiClick();
    showModal(previousModalBeforeSettings || modalStart);
  };

  const openGuideModal = () => {
    game.sound.init();
    game.sound.playUiClick();
    showModal(modalGuide);
  };

  const closeGuideModal = () => {
    game.sound.init();
    game.sound.playUiClick();
    showModal(modalStart);
  };

  const resetSettingsDefaults = () => {
    game.sound.init();
    game.sound.playUiClick();
    settingsState.sfxEnabled = true;
    settingsState.sfxVolume = 85;
    settingsState.musicEnabled = true;
    settingsState.musicVolume = 50;
    settingsState.controlMode = 'MOUSE';
    settingsState.autoFire = false;
    settingsState.uhdEnabled = true;
    applySettingsToEngine();
    saveSettings();
    syncSettingsUI();
  };

  // Connect Input AutoFire toggle to Toast notification and Sound
  input.onAutoFireChanged = (isAuto) => {
    settingsState.autoFire = isAuto;
    saveSettings();
    syncAutoFireUI(isAuto);
    if (game.sound && game.sound.initialized) {
      game.sound.playUiToggle(isAuto);
    }
    showToast(isAuto ? '⚡ AUTO-FIRE: AKTIF' : '⚡ AUTO-FIRE: NON-AKTIF', isAuto ? 'active-green' : 'active-amber');
  };

  // Initialize settings in engine and UI
  applySettingsToEngine();
  syncSettingsUI();

  // Keyboard navigation for all screens/modals
  window.addEventListener('keydown', (e) => {
    // If Settings Modal is active
    if (modalSettings && (modalSettings.classList.contains('active') || modalSettings.style.display === 'flex')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        closeSettingsModal();
      }
      return;
    }

    // If Guide Modal is active
    if (modalGuide && (modalGuide.classList.contains('active') || modalGuide.style.display === 'flex')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        closeGuideModal();
      }
      return;
    }

    // If Cheat Modal is active
    if (modalCheat && (modalCheat.classList.contains('active') || modalCheat.style.display === 'flex')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        saveAndCloseCheat();
      }
      return;
    }

    // If Start Screen is active
    if (modalStart && (modalStart.classList.contains('active') || modalStart.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        triggerStartGame(e);
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        if (typeof cycleDifficulty === 'function') cycleDifficulty(-1);
        return;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        if (typeof cycleDifficulty === 'function') cycleDifficulty(1);
        return;
      }
      return;
    }

    // If Pause Screen is active: ESC returns to Main Menu, Enter/Space/P resumes, R restarts, O opens settings
    if (modalPause && (modalPause.classList.contains('active') || modalPause.style.display === 'flex')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        returnToMainMenu();
      } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault();
        game.togglePause();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        if (game.sound) {
          game.sound.setPauseDucking(false);
        }
        hideAllModals();
        game.restart();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        openSettingsModal(modalPause);
      }
      return;
    }

    // If Game Over Screen is active: Enter/Space/R restarts, ESC/M returns to Main Menu, O opens settings
    if (modalGameOver && (modalGameOver.classList.contains('active') || modalGameOver.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR') {
        e.preventDefault();
        hideAllModals();
        game.restart();
      } else if (e.code === 'Escape' || e.code === 'KeyM') {
        e.preventDefault();
        returnToMainMenu();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        openSettingsModal(modalGameOver);
      }
      return;
    }

    // If Victory Screen is active: Enter/Space restarts, ESC/M returns to Main Menu, O opens settings
    if (modalVictory && (modalVictory.classList.contains('active') || modalVictory.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        hideAllModals();
        game.restart();
      } else if (e.code === 'Escape' || e.code === 'KeyM') {
        e.preventDefault();
        returnToMainMenu();
      } else if (e.code === 'KeyO') {
        e.preventDefault();
        openSettingsModal(modalVictory);
      }
      return;
    }

    // In-game shortcuts during active PLAYING state
    if (game && game.state === 1 /* PLAYING */) {
      if (e.code === 'KeyF') {
        e.preventDefault();
        if (game.sound && game.sound.initialized) game.sound.playUiClick();
        if (!document.fullscreenElement) {
          const elem = document.documentElement || document.getElementById('game-wrapper');
          if (elem && elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
        return;
      }
      if (e.code === 'KeyU') {
        e.preventDefault();
        const newUhd = game.toggleUhd();
        settingsState.uhdEnabled = newUhd;
        saveSettings();
        syncUhdUI(newUhd);
        if (game.sound && game.sound.initialized) game.sound.playUiToggle(newUhd);
        showToast(newUhd ? '💎 UHD RETINA 4K: AKTIF' : '🖥️ RESOLUSI: STANDAR 1X', newUhd ? 'active-green' : 'active-amber');
        return;
      }
      if (e.code === 'KeyO') {
        e.preventDefault();
        game.togglePause();
        openSettingsModal(modalPause);
        return;
      }
    }
  });

  // Pause Screen Buttons
  if (btnResume) {
    btnResume.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      game.togglePause();
    });
  }

  if (btnSettingsPause) {
    btnSettingsPause.addEventListener('click', () => {
      openSettingsModal(modalPause);
    });
  }

  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.setPauseDucking(false);
        game.sound.playUiClick();
      }
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnMenuPause) {
    btnMenuPause.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      returnToMainMenu();
    });
  }

  // Navigation Buttons in Main Menu & Modals
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      openSettingsModal(modalStart);
    });
  }
  if (btnSettingsClose) {
    btnSettingsClose.addEventListener('click', closeSettingsModal);
  }
  if (btnSettingsReset) {
    btnSettingsReset.addEventListener('click', resetSettingsDefaults);
  }
  if (btnOpenGuide) {
    btnOpenGuide.addEventListener('click', openGuideModal);
  }
  if (btnGuideClose) {
    btnGuideClose.addEventListener('click', closeGuideModal);
  }

  // Game Over Buttons
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnSettingsGameOver) {
    btnSettingsGameOver.addEventListener('click', () => {
      openSettingsModal(modalGameOver);
    });
  }

  if (btnMenuGameOver) {
    btnMenuGameOver.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      returnToMainMenu();
    });
  }

  // Victory Buttons
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnSettingsVictory) {
    btnSettingsVictory.addEventListener('click', () => {
      openSettingsModal(modalVictory);
    });
  }

  if (btnMenuVictory) {
    btnMenuVictory.addEventListener('click', () => {
      if (game.sound) {
        game.sound.init();
        game.sound.playUiClick();
      }
      returnToMainMenu();
    });
  }

  // ==========================================
  // CHEAT MODE CONTROLLER & MICRO-INTERACTIONS
  // ==========================================
  const STAGE_DESCRIPTIONS = {
    1: 'Lembah Tanah Liat (Misi 1: Sapu Penyelidik Musuh)',
    2: 'Serangan Kumbang (Waspada Penukik Cepat Beracun)',
    3: 'Armada Meriam Biru (Kapal Tempur Gunship)',
    4: 'Konvoi Balon Udara (Balon Tempur Zeppelin)',
    5: 'BENTENG DREADNOUGHT (BOSS DUNIA 1 - IRON DREADNOUGHT)',
    6: 'Ngarai Tanah Senja (Tawon Stinger Berkecepatan Tinggi)',
    7: 'Lorong Penembak Jitu (Sniper Laser Merah Jarak Jauh)',
    8: 'Hujan Bom Tanah Liat (Pelempap Bom Beruntun)',
    9: 'Badai Cakram Berputar (Cakram Gergaji Spinner Memantul)',
    10: 'GOLIATH PENGUASA LANGIT (BOSS DUNIA 2 - GOLIATH ZEPPELIN)',
    11: 'Benteng Malam Cyber (Perisai Energi Shield Cruiser)',
    12: 'Medan Ranjau Terapung (Drone Penebar Ranjau Meledak)',
    13: 'Skuadron Elit Emas (Pilot Ace Akrobatik Loop Udara)',
    14: 'Serangan Total: Gauntlet (Maraton 7 Gelombang Musuh)',
    15: 'TITAN LEVIATHAN (BOSS DUNIA 3 - ULTIMATE CLAY LEVIATHAN)',
    16: 'Gerbang Ruang Kosmis (Memasuki Angkasa Hamburan Kosmos)',
    17: 'Benteng Siber Berlapis Baja (Formasi Pengawal Perisai Ganda)',
    18: 'Skuadron Badai Bintang (Pilot Ace Elit Pengepung)',
    19: 'Barikade Terakhir Singularitas (Gauntlet Kosmis 5 Gelombang)',
    20: 'KOLOSUS CLAY OMEGA (FINAL CLIMAX BOSS - OMEGA CLAY COLOSSUS)'
  };

  const SCORE_INTERVAL_LEVELS = [
    100000,
    250000,
    500000,
    1000000,
    2000000,
    5000000,
    10000000,
    20000000,
    50000000
  ];

  const formatScoreIntervalBadge = (pts) => {
    if (pts >= 1000000) {
      const val = pts / 1000000;
      return `${Number.isInteger(val) ? val : val.toFixed(1)} JUTA PTS`;
    }
    return `${pts.toLocaleString('id-ID')} PTS`;
  };

  const updateDiffOverrideBtn = (btn, isCustom) => {
    if (!btn) return;
    if (isCustom) {
      btn.className = 'diff-override-btn mode-custom';
      btn.innerHTML = '<span class="diff-btn-icon">⚙️</span><span class="diff-btn-text">KUSTOM</span>';
      btn.title = 'Mode Kustom Aktif (Menimpa Difficulty). Klik untuk beralih ke Sesuai Difficulty.';
    } else {
      btn.className = 'diff-override-btn mode-diff';
      btn.innerHTML = '<span class="diff-btn-icon">🔒</span><span class="diff-btn-text">SESUAI DIFFICULTY</span>';
      btn.title = 'Mode Sesuai Difficulty (Abaikan Kustom). Klik untuk mengaktifkan Kustom.';
    }
  };

  let workingCheat = Object.assign({}, game.cheatConfig);

  const updateCheatIndicator = () => {
    if (cheatPillIndicator) {
      const active = game.isCheatActive();
      cheatPillIndicator.className = `cheat-pill-status ${active ? 'active' : 'off'}`;
      cheatPillIndicator.innerText = active ? 'AKTIF' : 'OFF';
    }
  };

  const syncCheatModalUI = () => {
    if (cheatMasterToggle) cheatMasterToggle.checked = Boolean(workingCheat.enabled);
    if (cheatMasterStatusDesc) {
      cheatMasterStatusDesc.innerHTML = workingCheat.enabled 
        ? 'Mode curang saat ini: <strong style="color:#2e7d32;">AKTIF</strong>' 
        : 'Mode curang saat ini: <strong>NON-AKTIF</strong> (Semua konfigurasi diabaikan secara tegas)';
    }
    if (cheatControlsPanel) {
      cheatControlsPanel.classList.toggle('disabled', !workingCheat.enabled);
    }

    // 1. Stage (No toggle button)
    const stage = Math.max(1, Math.min(20, workingCheat.startStage || 1));
    if (cheatStageSlider) cheatStageSlider.value = stage;
    if (cheatStageValBadge) cheatStageValBadge.innerText = `STAGE ${stage}`;
    if (cheatStageDesc) cheatStageDesc.innerText = STAGE_DESCRIPTIONS[stage] || `Stage ${stage}`;

    // 2. Durasi Senjata Spesial (HAS Toggle)
    const weaponCustom = Boolean(workingCheat.overrideWeaponDuration);
    updateDiffOverrideBtn(btnToggleDiffWeapon, weaponCustom);
    if (wrapWeaponControls) wrapWeaponControls.classList.toggle('control-dimmed', !weaponCustom);
    if (!weaponCustom) {
      if (cheatWeaponValBadge) {
        cheatWeaponValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatWeaponValBadge.classList.add('badge-diff');
      }
      if (btnToggleInfiniteWeapon) btnToggleInfiniteWeapon.classList.remove('active');
      if (cheatWeaponSlider) cheatWeaponSlider.disabled = true;
      if (btnWeaponDec) btnWeaponDec.disabled = true;
      if (btnWeaponInc) btnWeaponInc.disabled = true;
    } else if (workingCheat.infiniteWeaponDuration) {
      if (cheatWeaponValBadge) {
        cheatWeaponValBadge.innerText = '∞ TAK TERBATAS';
        cheatWeaponValBadge.classList.remove('badge-diff');
      }
      if (btnToggleInfiniteWeapon) btnToggleInfiniteWeapon.classList.add('active');
      if (cheatWeaponSlider) cheatWeaponSlider.disabled = true;
      if (btnWeaponDec) btnWeaponDec.disabled = true;
      if (btnWeaponInc) btnWeaponInc.disabled = true;
    } else {
      const duration = Math.max(5, Math.min(60, workingCheat.weaponDuration || 15));
      if (cheatWeaponValBadge) {
        cheatWeaponValBadge.innerText = `${duration} DETIK`;
        cheatWeaponValBadge.classList.remove('badge-diff');
      }
      if (btnToggleInfiniteWeapon) btnToggleInfiniteWeapon.classList.remove('active');
      if (cheatWeaponSlider) {
        cheatWeaponSlider.value = duration;
        cheatWeaponSlider.disabled = false;
      }
      if (btnWeaponDec) btnWeaponDec.disabled = false;
      if (btnWeaponInc) btnWeaponInc.disabled = false;
    }

    // 3. Nyawa Awal (HAS Toggle)
    const livesCustom = Boolean(workingCheat.overrideStartingLives);
    updateDiffOverrideBtn(btnToggleDiffStartingLives, livesCustom);
    if (wrapLivesControls) wrapLivesControls.classList.toggle('control-dimmed', !livesCustom);
    if (!livesCustom) {
      if (cheatLivesValBadge) {
        cheatLivesValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatLivesValBadge.classList.add('badge-diff');
      }
      if (btnToggleInfiniteLives) btnToggleInfiniteLives.classList.remove('active');
      if (cheatLivesSlider) cheatLivesSlider.disabled = true;
      if (btnLivesDec) btnLivesDec.disabled = true;
      if (btnLivesInc) btnLivesInc.disabled = true;
    } else if (workingCheat.infiniteLives) {
      if (cheatLivesValBadge) {
        cheatLivesValBadge.innerText = '∞ TAK TERBATAS';
        cheatLivesValBadge.classList.remove('badge-diff');
      }
      if (btnToggleInfiniteLives) btnToggleInfiniteLives.classList.add('active');
      if (cheatLivesSlider) cheatLivesSlider.disabled = true;
      if (btnLivesDec) btnLivesDec.disabled = true;
      if (btnLivesInc) btnLivesInc.disabled = true;
    } else {
      const lives = Math.max(1, Math.min(20, workingCheat.startingLives || 10));
      if (cheatLivesValBadge) {
        cheatLivesValBadge.innerText = `${lives} NYAWA`;
        cheatLivesValBadge.classList.remove('badge-diff');
      }
      if (btnToggleInfiniteLives) btnToggleInfiniteLives.classList.remove('active');
      if (cheatLivesSlider) {
        cheatLivesSlider.value = lives;
        cheatLivesSlider.disabled = false;
      }
      if (btnLivesDec) btnLivesDec.disabled = false;
      if (btnLivesInc) btnLivesInc.disabled = false;
    }

    // 4. Nyawa Maksimal (HAS Toggle)
    const maxLivesCustom = Boolean(workingCheat.overrideMaxLives);
    updateDiffOverrideBtn(btnToggleDiffMaxLives, maxLivesCustom);
    if (wrapMaxLivesControls) wrapMaxLivesControls.classList.toggle('control-dimmed', !maxLivesCustom);
    const maxL = Math.max(1, Math.min(50, workingCheat.maxLives || 20));
    if (!maxLivesCustom) {
      if (cheatMaxLivesValBadge) {
        cheatMaxLivesValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatMaxLivesValBadge.classList.add('badge-diff');
      }
      if (cheatMaxLivesSlider) cheatMaxLivesSlider.disabled = true;
      if (btnMaxLivesDec) btnMaxLivesDec.disabled = true;
      if (btnMaxLivesInc) btnMaxLivesInc.disabled = true;
    } else {
      if (cheatMaxLivesValBadge) {
        cheatMaxLivesValBadge.innerText = `${maxL} NYAWA`;
        cheatMaxLivesValBadge.classList.remove('badge-diff');
      }
      if (cheatMaxLivesSlider) {
        cheatMaxLivesSlider.value = maxL;
        cheatMaxLivesSlider.disabled = false;
      }
      if (btnMaxLivesDec) btnMaxLivesDec.disabled = false;
      if (btnMaxLivesInc) btnMaxLivesInc.disabled = false;
    }

    // 5. Interval Skor +1 Nyawa (HAS Toggle)
    const scoreIntervalCustom = Boolean(workingCheat.overrideScoreInterval);
    updateDiffOverrideBtn(btnToggleDiffScoreInterval, scoreIntervalCustom);
    if (wrapScoreIntervalControls) wrapScoreIntervalControls.classList.toggle('control-dimmed', !scoreIntervalCustom);
    const intervalVal = workingCheat.scoreIntervalForLife || 2000000;
    let bestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < SCORE_INTERVAL_LEVELS.length; i++) {
      const d = Math.abs(SCORE_INTERVAL_LEVELS[i] - intervalVal);
      if (d < minDiff) {
        minDiff = d;
        bestIdx = i;
      }
    }
    if (!scoreIntervalCustom) {
      if (cheatScoreIntervalValBadge) {
        cheatScoreIntervalValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatScoreIntervalValBadge.classList.add('badge-diff');
      }
      if (cheatScoreIntervalSlider) cheatScoreIntervalSlider.disabled = true;
      if (btnScoreIntervalDec) btnScoreIntervalDec.disabled = true;
      if (btnScoreIntervalInc) btnScoreIntervalInc.disabled = true;
    } else {
      if (cheatScoreIntervalValBadge) {
        cheatScoreIntervalValBadge.innerText = formatScoreIntervalBadge(intervalVal);
        cheatScoreIntervalValBadge.classList.remove('badge-diff');
      }
      if (cheatScoreIntervalSlider) {
        cheatScoreIntervalSlider.value = bestIdx;
        cheatScoreIntervalSlider.disabled = false;
      }
      if (btnScoreIntervalDec) btnScoreIntervalDec.disabled = false;
      if (btnScoreIntervalInc) btnScoreIntervalInc.disabled = false;
    }

    // 6. Pengganda HP Musuh (HAS Toggle)
    const enemyHpCustom = Boolean(workingCheat.overrideEnemyHp);
    updateDiffOverrideBtn(btnToggleDiffEnemyHp, enemyHpCustom);
    if (wrapEnemyHpControls) wrapEnemyHpControls.classList.toggle('control-dimmed', !enemyHpCustom);
    const hpMult = Math.max(0.25, Math.min(5.0, Number(workingCheat.enemyHpMult) || 1.0));
    if (!enemyHpCustom) {
      if (cheatEnemyHpValBadge) {
        cheatEnemyHpValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatEnemyHpValBadge.classList.add('badge-diff');
      }
      if (cheatEnemyHpSlider) cheatEnemyHpSlider.disabled = true;
      if (btnEnemyHpDec) btnEnemyHpDec.disabled = true;
      if (btnEnemyHpInc) btnEnemyHpInc.disabled = true;
    } else {
      if (cheatEnemyHpValBadge) {
        cheatEnemyHpValBadge.innerText = `${hpMult.toFixed(2)}× HP`;
        cheatEnemyHpValBadge.classList.remove('badge-diff');
      }
      if (cheatEnemyHpSlider) {
        cheatEnemyHpSlider.value = hpMult;
        cheatEnemyHpSlider.disabled = false;
      }
      if (btnEnemyHpDec) btnEnemyHpDec.disabled = false;
      if (btnEnemyHpInc) btnEnemyHpInc.disabled = false;
    }

    // 7. Jeda Tembak Musuh (HAS Toggle)
    const shootCooldownCustom = Boolean(workingCheat.overrideShootCooldown);
    updateDiffOverrideBtn(btnToggleDiffShootCooldown, shootCooldownCustom);
    if (wrapShootCooldownControls) wrapShootCooldownControls.classList.toggle('control-dimmed', !shootCooldownCustom);
    const cdMult = Math.max(0.25, Math.min(4.0, Number(workingCheat.enemyShootCooldownMult) || 1.0));
    if (!shootCooldownCustom) {
      if (cheatShootCooldownValBadge) {
        cheatShootCooldownValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatShootCooldownValBadge.classList.add('badge-diff');
      }
      if (cheatShootCooldownSlider) cheatShootCooldownSlider.disabled = true;
      if (btnShootCooldownDec) btnShootCooldownDec.disabled = true;
      if (btnShootCooldownInc) btnShootCooldownInc.disabled = true;
    } else {
      if (cheatShootCooldownValBadge) {
        cheatShootCooldownValBadge.innerText = `${cdMult.toFixed(2)}× JEDA`;
        cheatShootCooldownValBadge.classList.remove('badge-diff');
      }
      if (cheatShootCooldownSlider) {
        cheatShootCooldownSlider.value = cdMult;
        cheatShootCooldownSlider.disabled = false;
      }
      if (btnShootCooldownDec) btnShootCooldownDec.disabled = false;
      if (btnShootCooldownInc) btnShootCooldownInc.disabled = false;
    }

    // 8. Kecepatan Peluru Musuh (HAS Toggle)
    const bulletSpeedCustom = Boolean(workingCheat.overrideBulletSpeed);
    updateDiffOverrideBtn(btnToggleDiffBulletSpeed, bulletSpeedCustom);
    if (wrapBulletSpeedControls) wrapBulletSpeedControls.classList.toggle('control-dimmed', !bulletSpeedCustom);
    const spdMult = Math.max(0.25, Math.min(3.0, Number(workingCheat.enemyBulletSpeedMult) || 1.0));
    if (!bulletSpeedCustom) {
      if (cheatBulletSpeedValBadge) {
        cheatBulletSpeedValBadge.innerText = 'SESUAI DIFFICULTY';
        cheatBulletSpeedValBadge.classList.add('badge-diff');
      }
      if (cheatBulletSpeedSlider) cheatBulletSpeedSlider.disabled = true;
      if (btnBulletSpeedDec) btnBulletSpeedDec.disabled = true;
      if (btnBulletSpeedInc) btnBulletSpeedInc.disabled = true;
    } else {
      if (cheatBulletSpeedValBadge) {
        cheatBulletSpeedValBadge.innerText = `${spdMult.toFixed(2)}× KEC.`;
        cheatBulletSpeedValBadge.classList.remove('badge-diff');
      }
      if (cheatBulletSpeedSlider) {
        cheatBulletSpeedSlider.value = spdMult;
        cheatBulletSpeedSlider.disabled = false;
      }
      if (btnBulletSpeedDec) btnBulletSpeedDec.disabled = false;
      if (btnBulletSpeedInc) btnBulletSpeedInc.disabled = false;
    }
  };

  const openCheatModal = () => {
    game.sound.init();
    game.sound.playUiClick();
    workingCheat = Object.assign({}, game.cheatConfig);
    syncCheatModalUI();
    showModal(modalCheat);
  };

  const saveAndCloseCheat = () => {
    game.sound.init();
    game.sound.playUiClick();
    game.setCheatConfig(workingCheat);
    updateCheatIndicator();
    showModal(modalStart);
  };

  const resetCheatDefaults = () => {
    game.sound.init();
    game.sound.playUiClick();
    workingCheat = {
      enabled: false,
      startStage: 1,
      overrideStartingLives: false,
      infiniteLives: false,
      startingLives: 10,
      overrideMaxLives: false,
      maxLives: 20,
      overrideScoreInterval: false,
      scoreIntervalForLife: 2000000,
      overrideWeaponDuration: false,
      infiniteWeaponDuration: false,
      weaponDuration: 15,
      overrideEnemyHp: false,
      enemyHpMult: 1.0,
      overrideShootCooldown: false,
      enemyShootCooldownMult: 1.0,
      overrideBulletSpeed: false,
      enemyBulletSpeedMult: 1.0
    };
    syncCheatModalUI();
  };

  // Cheat event listeners
  if (btnOpenCheat) btnOpenCheat.addEventListener('click', openCheatModal);
  if (btnCheatSave) btnCheatSave.addEventListener('click', saveAndCloseCheat);
  if (btnCheatReset) btnCheatReset.addEventListener('click', resetCheatDefaults);

  // Cheat Segmented Tab Switching
  cheatTabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-cheat-tab');
      if (!targetId) return;

      game.sound.init();
      game.sound.playUiClick();

      cheatTabButtons.forEach(b => b.classList.remove('active'));
      cheatTabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });

    btn.addEventListener('mouseenter', () => {
      game.sound.init();
      game.sound.playUiHover();
    });
  });

  // Master Switch
  if (cheatMasterToggle) {
    cheatMasterToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.enabled = cheatMasterToggle.checked;
      syncCheatModalUI();
    });
  }

  // 1. Awal Stage Interactions
  if (cheatStageSlider) {
    cheatStageSlider.addEventListener('input', () => {
      workingCheat.startStage = parseInt(cheatStageSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnStageDec) {
    btnStageDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.startStage = Math.max(1, (workingCheat.startStage || 1) - 1);
      syncCheatModalUI();
    });
  }
  if (btnStageInc) {
    btnStageInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.startStage = Math.min(20, (workingCheat.startStage || 1) + 1);
      syncCheatModalUI();
    });
  }
  quickStageChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const stg = parseInt(chip.getAttribute('data-set-stage'), 10);
      if (stg) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.startStage = stg;
        syncCheatModalUI();
      }
    });
  });

  // 2. Durasi Senjata Spesial Interactions
  if (btnToggleDiffWeapon) {
    btnToggleDiffWeapon.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideWeaponDuration = !workingCheat.overrideWeaponDuration;
      syncCheatModalUI();
    });
  }
  if (cheatWeaponSlider) {
    cheatWeaponSlider.addEventListener('input', () => {
      workingCheat.overrideWeaponDuration = true;
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = parseInt(cheatWeaponSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnWeaponDec) {
    btnWeaponDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideWeaponDuration = true;
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = Math.max(5, (workingCheat.weaponDuration || 15) - 5);
      syncCheatModalUI();
    });
  }
  if (btnWeaponInc) {
    btnWeaponInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideWeaponDuration = true;
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = Math.min(60, (workingCheat.weaponDuration || 15) + 5);
      syncCheatModalUI();
    });
  }
  if (btnToggleInfiniteWeapon) {
    btnToggleInfiniteWeapon.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideWeaponDuration = true;
      workingCheat.infiniteWeaponDuration = !workingCheat.infiniteWeaponDuration;
      syncCheatModalUI();
    });
  }
  quickWeaponChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const dur = parseInt(chip.getAttribute('data-set-weapon'), 10);
      if (dur) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideWeaponDuration = true;
        workingCheat.infiniteWeaponDuration = false;
        workingCheat.weaponDuration = dur;
        syncCheatModalUI();
      }
    });
  });

  // 3. Nyawa Awal Interactions
  if (btnToggleDiffStartingLives) {
    btnToggleDiffStartingLives.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideStartingLives = !workingCheat.overrideStartingLives;
      syncCheatModalUI();
    });
  }
  if (cheatLivesSlider) {
    cheatLivesSlider.addEventListener('input', () => {
      workingCheat.overrideStartingLives = true;
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = parseInt(cheatLivesSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnLivesDec) {
    btnLivesDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideStartingLives = true;
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = Math.max(1, (workingCheat.startingLives || 10) - 1);
      syncCheatModalUI();
    });
  }
  if (btnLivesInc) {
    btnLivesInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideStartingLives = true;
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = Math.min(20, (workingCheat.startingLives || 10) + 1);
      syncCheatModalUI();
    });
  }
  if (btnToggleInfiniteLives) {
    btnToggleInfiniteLives.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideStartingLives = true;
      workingCheat.infiniteLives = !workingCheat.infiniteLives;
      syncCheatModalUI();
    });
  }
  quickLivesChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const lives = parseInt(chip.getAttribute('data-set-lives'), 10);
      if (lives) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideStartingLives = true;
        workingCheat.infiniteLives = false;
        workingCheat.startingLives = lives;
        syncCheatModalUI();
      }
    });
  });

  // 4. Nyawa Maksimal Interactions
  if (btnToggleDiffMaxLives) {
    btnToggleDiffMaxLives.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideMaxLives = !workingCheat.overrideMaxLives;
      syncCheatModalUI();
    });
  }
  if (cheatMaxLivesSlider) {
    cheatMaxLivesSlider.addEventListener('input', () => {
      workingCheat.overrideMaxLives = true;
      workingCheat.maxLives = parseInt(cheatMaxLivesSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnMaxLivesDec) {
    btnMaxLivesDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideMaxLives = true;
      workingCheat.maxLives = Math.max(1, (workingCheat.maxLives || 20) - 1);
      syncCheatModalUI();
    });
  }
  if (btnMaxLivesInc) {
    btnMaxLivesInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideMaxLives = true;
      workingCheat.maxLives = Math.min(50, (workingCheat.maxLives || 20) + 1);
      syncCheatModalUI();
    });
  }
  quickMaxLivesChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const ml = parseInt(chip.getAttribute('data-set-max-lives'), 10);
      if (ml) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideMaxLives = true;
        workingCheat.maxLives = ml;
        syncCheatModalUI();
      }
    });
  });

  // 5. Interval Skor +1 Nyawa Interactions
  if (btnToggleDiffScoreInterval) {
    btnToggleDiffScoreInterval.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideScoreInterval = !workingCheat.overrideScoreInterval;
      syncCheatModalUI();
    });
  }
  if (cheatScoreIntervalSlider) {
    cheatScoreIntervalSlider.addEventListener('input', () => {
      workingCheat.overrideScoreInterval = true;
      const idx = Math.max(0, Math.min(SCORE_INTERVAL_LEVELS.length - 1, parseInt(cheatScoreIntervalSlider.value, 10)));
      workingCheat.scoreIntervalForLife = SCORE_INTERVAL_LEVELS[idx];
      syncCheatModalUI();
    });
  }
  if (btnScoreIntervalDec) {
    btnScoreIntervalDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideScoreInterval = true;
      const curIdx = parseInt(cheatScoreIntervalSlider ? cheatScoreIntervalSlider.value : 4, 10);
      const newIdx = Math.max(0, curIdx - 1);
      workingCheat.scoreIntervalForLife = SCORE_INTERVAL_LEVELS[newIdx];
      syncCheatModalUI();
    });
  }
  if (btnScoreIntervalInc) {
    btnScoreIntervalInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideScoreInterval = true;
      const curIdx = parseInt(cheatScoreIntervalSlider ? cheatScoreIntervalSlider.value : 4, 10);
      const newIdx = Math.min(SCORE_INTERVAL_LEVELS.length - 1, curIdx + 1);
      workingCheat.scoreIntervalForLife = SCORE_INTERVAL_LEVELS[newIdx];
      syncCheatModalUI();
    });
  }
  quickScoreIntervalChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseInt(chip.getAttribute('data-set-score-interval'), 10);
      if (val) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideScoreInterval = true;
        workingCheat.scoreIntervalForLife = val;
        syncCheatModalUI();
      }
    });
  });

  // 6. Pengganda HP Musuh Interactions
  if (btnToggleDiffEnemyHp) {
    btnToggleDiffEnemyHp.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideEnemyHp = !workingCheat.overrideEnemyHp;
      syncCheatModalUI();
    });
  }
  if (cheatEnemyHpSlider) {
    cheatEnemyHpSlider.addEventListener('input', () => {
      workingCheat.overrideEnemyHp = true;
      workingCheat.enemyHpMult = parseFloat(cheatEnemyHpSlider.value);
      syncCheatModalUI();
    });
  }
  if (btnEnemyHpDec) {
    btnEnemyHpDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideEnemyHp = true;
      const cur = Number(workingCheat.enemyHpMult) || 1.0;
      workingCheat.enemyHpMult = Math.max(0.25, Math.round((cur - 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  if (btnEnemyHpInc) {
    btnEnemyHpInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideEnemyHp = true;
      const cur = Number(workingCheat.enemyHpMult) || 1.0;
      workingCheat.enemyHpMult = Math.min(5.0, Math.round((cur + 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  quickEnemyHpChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const hp = parseFloat(chip.getAttribute('data-set-enemy-hp'));
      if (hp) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideEnemyHp = true;
        workingCheat.enemyHpMult = hp;
        syncCheatModalUI();
      }
    });
  });

  // 7. Jeda Tembak Musuh Interactions
  if (btnToggleDiffShootCooldown) {
    btnToggleDiffShootCooldown.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideShootCooldown = !workingCheat.overrideShootCooldown;
      syncCheatModalUI();
    });
  }
  if (cheatShootCooldownSlider) {
    cheatShootCooldownSlider.addEventListener('input', () => {
      workingCheat.overrideShootCooldown = true;
      workingCheat.enemyShootCooldownMult = parseFloat(cheatShootCooldownSlider.value);
      syncCheatModalUI();
    });
  }
  if (btnShootCooldownDec) {
    btnShootCooldownDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideShootCooldown = true;
      const cur = Number(workingCheat.enemyShootCooldownMult) || 1.0;
      workingCheat.enemyShootCooldownMult = Math.max(0.25, Math.round((cur - 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  if (btnShootCooldownInc) {
    btnShootCooldownInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideShootCooldown = true;
      const cur = Number(workingCheat.enemyShootCooldownMult) || 1.0;
      workingCheat.enemyShootCooldownMult = Math.min(4.0, Math.round((cur + 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  quickShootCooldownChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cd = parseFloat(chip.getAttribute('data-set-shoot-cooldown'));
      if (cd) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideShootCooldown = true;
        workingCheat.enemyShootCooldownMult = cd;
        syncCheatModalUI();
      }
    });
  });

  // 8. Kecepatan Peluru Musuh Interactions
  if (btnToggleDiffBulletSpeed) {
    btnToggleDiffBulletSpeed.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideBulletSpeed = !workingCheat.overrideBulletSpeed;
      syncCheatModalUI();
    });
  }
  if (cheatBulletSpeedSlider) {
    cheatBulletSpeedSlider.addEventListener('input', () => {
      workingCheat.overrideBulletSpeed = true;
      workingCheat.enemyBulletSpeedMult = parseFloat(cheatBulletSpeedSlider.value);
      syncCheatModalUI();
    });
  }
  if (btnBulletSpeedDec) {
    btnBulletSpeedDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideBulletSpeed = true;
      const cur = Number(workingCheat.enemyBulletSpeedMult) || 1.0;
      workingCheat.enemyBulletSpeedMult = Math.max(0.25, Math.round((cur - 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  if (btnBulletSpeedInc) {
    btnBulletSpeedInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.overrideBulletSpeed = true;
      const cur = Number(workingCheat.enemyBulletSpeedMult) || 1.0;
      workingCheat.enemyBulletSpeedMult = Math.min(3.0, Math.round((cur + 0.1) * 20) / 20);
      syncCheatModalUI();
    });
  }
  quickBulletSpeedChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const spd = parseFloat(chip.getAttribute('data-set-bullet-speed'));
      if (spd) {
        game.sound.init();
        game.sound.playUiClick();
        workingCheat.overrideBulletSpeed = true;
        workingCheat.enemyBulletSpeedMult = spd;
        syncCheatModalUI();
      }
    });
  });

  // Initial sync of the main menu subtle cheat badge
  updateCheatIndicator();

  // ==========================================
  // SETTINGS MODAL INTERACTIVE CONTROLS
  // ==========================================
  // 1. SFX Toggle
  if (settingSfxToggle) {
    settingSfxToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.sfxEnabled = settingSfxToggle.checked;
      game.sound.setSFXEnabled(settingsState.sfxEnabled);
      saveSettings();
      syncSettingsUI();
    });
  }

  // SFX Volume Slider & Stepper Buttons
  if (settingSfxVolume) {
    settingSfxVolume.addEventListener('input', () => {
      settingsState.sfxVolume = parseInt(settingSfxVolume.value, 10);
      game.sound.setSFXVolume(settingsState.sfxVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }
  if (btnSfxVolDec) {
    btnSfxVolDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.sfxVolume = Math.max(0, settingsState.sfxVolume - 5);
      game.sound.setSFXVolume(settingsState.sfxVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }
  if (btnSfxVolInc) {
    btnSfxVolInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.sfxVolume = Math.min(100, settingsState.sfxVolume + 5);
      game.sound.setSFXVolume(settingsState.sfxVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }

  // 2. Music Toggle
  if (settingMusicToggle) {
    settingMusicToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.musicEnabled = settingMusicToggle.checked;
      game.sound.setMusicEnabled(settingsState.musicEnabled);
      saveSettings();
      syncSettingsUI();
    });
  }

  // Music Volume Slider & Stepper Buttons
  if (settingMusicVolume) {
    settingMusicVolume.addEventListener('input', () => {
      settingsState.musicVolume = parseInt(settingMusicVolume.value, 10);
      game.sound.setMusicVolume(settingsState.musicVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }
  if (btnMusicVolDec) {
    btnMusicVolDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.musicVolume = Math.max(0, settingsState.musicVolume - 5);
      game.sound.setMusicVolume(settingsState.musicVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }
  if (btnMusicVolInc) {
    btnMusicVolInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.musicVolume = Math.min(100, settingsState.musicVolume + 5);
      game.sound.setMusicVolume(settingsState.musicVolume / 100);
      saveSettings();
      syncSettingsUI();
    });
  }

  // 3. Control Mode Toggle Buttons (Mouse vs Keyboard)
  if (btnModeMouse) {
    btnModeMouse.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.controlMode = 'MOUSE';
      input.setControlMode('MOUSE');
      saveSettings();
      syncSettingsUI();
    });
  }
  if (btnModeKeyboard) {
    btnModeKeyboard.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      settingsState.controlMode = 'KEYBOARD';
      input.setControlMode('KEYBOARD');
      saveSettings();
      syncSettingsUI();
    });
  }

  // 4. Auto-Fire Default Setting
  if (settingAutofireToggle) {
    settingAutofireToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiClick();
      input.setAutoFire(settingAutofireToggle.checked);
    });
  }

  // 5. UHD Toggle Setting in Settings Modal
  if (settingUhdToggle) {
    settingUhdToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiToggle(settingUhdToggle.checked);
      const newUhd = game.setUhdEnabled(settingUhdToggle.checked);
      settingsState.uhdEnabled = newUhd;
      saveSettings();
      syncUhdUI(newUhd);
      showToast(newUhd ? '💎 UHD RETINA 4K: AKTIF' : '🖥️ RESOLUSI: STANDAR 1X', newUhd ? 'active-green' : 'active-amber');
    });
  }

  // 6. Fullscreen Setting Button in Settings Modal
  if (btnSettingFullscreen) {
    btnSettingFullscreen.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      if (!document.fullscreenElement) {
        const elem = document.documentElement || document.getElementById('game-wrapper');
        if (elem && elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    });
  }

  // ==========================================
  // FLOATING HUD TOP BAR BUTTON LISTENERS
  // ==========================================
  if (btnHudAutoFire) {
    btnHudAutoFire.addEventListener('click', (e) => {
      e.stopPropagation();
      input.setAutoFire(!input.autoFire, true);
    });
  }

  if (btnHudMode) {
    btnHudMode.addEventListener('click', (e) => {
      e.stopPropagation();
      const newMode = settingsState.controlMode === 'MOUSE' ? 'KEYBOARD' : 'MOUSE';
      settingsState.controlMode = newMode;
      input.setControlMode(newMode);
      saveSettings();
      syncControlModeUI(newMode);
      if (game.sound && game.sound.initialized) game.sound.playUiClick();
      showToast(newMode === 'MOUSE' ? '🖱️ MODE KEMUDI: MOUSE' : '⌨️ MODE KEMUDI: KEYBOARD', 'active-cyan');
    });
  }

  if (btnHudUhd) {
    btnHudUhd.addEventListener('click', (e) => {
      e.stopPropagation();
      const newUhd = game.toggleUhd();
      settingsState.uhdEnabled = newUhd;
      saveSettings();
      syncUhdUI(newUhd);
      if (game.sound && game.sound.initialized) game.sound.playUiToggle(newUhd);
      showToast(newUhd ? '💎 UHD RETINA 4K: AKTIF' : '🖥️ RESOLUSI: STANDAR 1X', newUhd ? 'active-green' : 'active-amber');
    });
  }

  if (btnHudAudio) {
    btnHudAudio.addEventListener('click', (e) => {
      e.stopPropagation();
      game.sound.init();
      const isMuted = game.sound.toggleMute();
      syncAudioMuteUI(isMuted);
      showToast(isMuted ? '🔇 SUARA: DIMATIKAN (MUTE)' : '🔊 SUARA: DIAKTIFKAN', isMuted ? 'active-amber' : 'active-green');
    });
  }

  if (btnHudSettings) {
    btnHudSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      if (game.sound && game.sound.initialized) game.sound.playUiClick();
      if (game.state === 1 /* PLAYING */) {
        game.togglePause();
      }
      openSettingsModal(modalPause);
    });
  }

  if (btnHudFullscreen) {
    btnHudFullscreen.addEventListener('click', (e) => {
      e.stopPropagation();
      if (game.sound && game.sound.initialized) game.sound.playUiClick();
      if (!document.fullscreenElement) {
        const elem = document.documentElement || document.getElementById('game-wrapper');
        if (elem && elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    });
  }

  if (btnHudPause) {
    btnHudPause.addEventListener('click', (e) => {
      e.stopPropagation();
      if (game.sound && game.sound.initialized) game.sound.playUiClick();
      game.togglePause();
    });
  }

  document.addEventListener('fullscreenchange', () => {
    syncFullscreenUI();
  });

  // Guide Modal Tab Navigation & Audio Micro-Interactions
  const tabButtons = document.querySelectorAll('.clay-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      game.sound.init();
      game.sound.playUiClick();

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });

    btn.addEventListener('mouseenter', () => {
      game.sound.init();
      game.sound.playUiHover();
    });
  });

  // Weapon cards, buttons, steppers, and chips micro-interaction sound effects
  document.querySelectorAll('.weapon-card, .clay-btn, .clay-nav-btn, .world-item, .instruction-item, .clay-subtle-cheat-btn, .quick-chip, .clay-step-btn, .clay-opt-toggle, .mode-seg-btn, .shortcut-pill, .clay-diff-card, .diff-matrix-table tbody tr, .clay-stepper-arrow, .diff-pip, .clay-diff-pill').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (game.sound && game.sound.initialized) {
        game.sound.playUiHover();
      }
    });
  });

  // Clicking weapon chip in Tab 1 jumps to Arsenal Tab (Tab 2)
  document.querySelectorAll('.weapon-chips-wrap .weapon-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      game.sound.init();
      game.sound.playUiClick();

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      const weaponTabBtn = document.querySelector('.clay-tab-btn[data-tab="tab-weapons"]');
      if (weaponTabBtn) weaponTabBtn.classList.add('active');

      const weaponsPane = document.getElementById('tab-weapons');
      if (weaponsPane) weaponsPane.classList.add('active');

      const targetWeapon = chip.getAttribute('data-target-weapon');
      if (targetWeapon) {
        const card = document.querySelector(`.weapon-card[data-weapon="${targetWeapon}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          card.style.transform = 'scale(1.04)';
          setTimeout(() => { card.style.transform = ''; }, 400);
        }
      }
    });
  });

  // ========================================================
  // Minimalist Elegant Difficulty Stepper (Arrow & Color Feedback)
  // ========================================================
  const DIFFICULTY_ORDER = ['BEGINNER', 'EASY', 'NORMAL', 'HARD', 'EXTREME'];

  const diffPrevBtn = document.getElementById('btn-diff-prev');
  const diffNextBtn = document.getElementById('btn-diff-next');
  const diffDisplayName = document.getElementById('diff-current-name');
  const diffPill = document.getElementById('clay-diff-pill');
  const diffStepperSection = document.getElementById('difficulty-stepper-section');
  const mainMenuCard = document.querySelector('.main-menu-card');
  const diffPips = document.querySelectorAll('.diff-pip');
  const weaponNoticeText = document.getElementById('weapon-notice-text');
  const tabWeaponsBtn = document.querySelector('.clay-tab-btn[data-tab="tab-weapons"]');

  const updateDifficultyUI = (diffKey, direction = 0) => {
    const key = (diffKey ? diffKey.toUpperCase() : 'NORMAL');
    syncDifficultyBadge(key);

    // Update Difficulty Name with Motion UI
    if (diffDisplayName) {
      diffDisplayName.classList.remove('diff-slide-in-right', 'diff-slide-in-left', 'diff-pop');
      void diffDisplayName.offsetWidth; // Force CSS reflow to restart animation reliably
      diffDisplayName.innerText = key;
      if (direction > 0) {
        diffDisplayName.classList.add('diff-slide-in-right');
      } else if (direction < 0) {
        diffDisplayName.classList.add('diff-slide-in-left');
      } else {
        diffDisplayName.classList.add('diff-pop');
      }
    }

    // Dynamic Color Feedback Themes
    const themeClass = `diff-theme-${key.toLowerCase()}`;
    const allThemeClasses = [
      'diff-theme-beginner',
      'diff-theme-easy',
      'diff-theme-normal',
      'diff-theme-hard',
      'diff-theme-extreme'
    ];

    if (diffPill) {
      diffPill.classList.remove(...allThemeClasses);
      diffPill.classList.add(themeClass);
      diffPill.classList.remove('clay-pulse');
      void diffPill.offsetWidth;
      diffPill.classList.add('clay-pulse');
    }

    if (diffStepperSection) {
      diffStepperSection.classList.remove(...allThemeClasses);
      diffStepperSection.classList.add(themeClass);
    }

    if (mainMenuCard) {
      mainMenuCard.classList.remove(...allThemeClasses);
      mainMenuCard.classList.add(themeClass);
    }

    // Minimalist 5-Pip Stage Indicator Dots
    diffPips.forEach(pip => {
      const pipDiff = pip.getAttribute('data-difficulty');
      if (pipDiff === key) {
        pip.classList.add('active');
      } else {
        pip.classList.remove('active');
      }
    });

    // Update weapon guide information dynamically
    if (tabWeaponsBtn) {
      const dur = key === 'BEGINNER' ? '25S' : (key === 'EASY' ? '20S' : (key === 'HARD' ? '10S' : (key === 'EXTREME' ? '8S' : '15S')));
      tabWeaponsBtn.innerHTML = `<span class="tab-icon">⚡</span> SENJATA (${dur})`;
    }

    if (weaponNoticeText) {
      const dur = key === 'BEGINNER' ? '25 detik' : (key === 'EASY' ? '20 detik' : (key === 'HARD' ? '10 detik' : (key === 'EXTREME' ? '8 detik' : '15 detik')));
      weaponNoticeText.innerHTML = `⏱️ Seluruh 5 tipe senjata spesial memiliki durasi aktif <strong>${dur}</strong> sebelum kembali ke Pea-Shooter!`;
    }
  };

  cycleDifficulty = (direction = 1) => {
    const currentKey = game.difficulty || 'NORMAL';
    let idx = DIFFICULTY_ORDER.indexOf(currentKey);
    if (idx === -1) idx = 2; // Default NORMAL
    const nextIdx = (idx + direction + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length;
    const nextKey = DIFFICULTY_ORDER[nextIdx];

    game.sound.init();
    game.sound.playUiClick();
    game.setDifficulty(nextKey);
    updateDifficultyUI(nextKey, direction);
  };

  // Sync initial selection from game instance (which reads localStorage)
  updateDifficultyUI(game.difficulty || 'NORMAL', 0);

  // Stepper Arrow Button Listeners
  if (diffPrevBtn) {
    diffPrevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cycleDifficulty(-1);
    });
  }

  if (diffNextBtn) {
    diffNextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cycleDifficulty(1);
    });
  }

  // Pip clicks (Direct jump to difficulty)
  diffPips.forEach(pip => {
    pip.addEventListener('click', (e) => {
      e.preventDefault();
      const targetDiff = pip.getAttribute('data-difficulty');
      if (targetDiff && targetDiff !== game.difficulty) {
        const curIdx = DIFFICULTY_ORDER.indexOf(game.difficulty || 'NORMAL');
        const targetIdx = DIFFICULTY_ORDER.indexOf(targetDiff);
        const dir = targetIdx > curIdx ? 1 : -1;
        game.sound.init();
        game.sound.playUiClick();
        game.setDifficulty(targetDiff);
        updateDifficultyUI(targetDiff, dir);
      }
    });
  });

  // Mobile Touch Swipe on Difficulty Stepper Section
  let stepperTouchStartX = 0;
  if (diffStepperSection) {
    diffStepperSection.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        stepperTouchStartX = e.changedTouches[0].clientX;
      }
    }, { passive: true });

    diffStepperSection.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = e.changedTouches[0].clientX - stepperTouchStartX;
        if (Math.abs(deltaX) > 40) {
          if (deltaX < 0) {
            cycleDifficulty(1); // Swipe left -> Next
          } else {
            cycleDifficulty(-1); // Swipe right -> Prev
          }
        }
      }
    }, { passive: true });
  }

  console.log('Platypus AI Arcade initialized successfully!');
}

// Ensure execution whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGameApp);
} else {
  initGameApp();
}
