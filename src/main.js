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

  // In-Game Floating Toast Notification
  const hudToast = document.getElementById('hud-toast');

  // Cheat DOM Controls
  const btnOpenCheat = document.getElementById('btn-open-cheat');
  const cheatPillIndicator = document.getElementById('cheat-pill-indicator');
  const cheatMasterToggle = document.getElementById('cheat-master-toggle');
  const cheatMasterStatusDesc = document.getElementById('cheat-master-status-desc');
  const cheatControlsPanel = document.getElementById('cheat-controls-panel');
  const cheatStageSlider = document.getElementById('cheat-stage-slider');
  const cheatStageValBadge = document.getElementById('cheat-stage-val-badge');
  const cheatStageDesc = document.getElementById('cheat-stage-desc');
  const btnStageDec = document.getElementById('btn-stage-dec');
  const btnStageInc = document.getElementById('btn-stage-inc');
  const quickStageChips = document.querySelectorAll('.quick-chip[data-set-stage]');

  const cheatLivesSlider = document.getElementById('cheat-lives-slider');
  const cheatLivesValBadge = document.getElementById('cheat-lives-val-badge');
  const btnLivesDec = document.getElementById('btn-lives-dec');
  const btnLivesInc = document.getElementById('btn-lives-inc');
  const btnToggleInfiniteLives = document.getElementById('btn-toggle-infinite-lives');

  const cheatWeaponSlider = document.getElementById('cheat-weapon-slider');
  const cheatWeaponValBadge = document.getElementById('cheat-weapon-val-badge');
  const btnWeaponDec = document.getElementById('btn-weapon-dec');
  const btnWeaponInc = document.getElementById('btn-weapon-inc');
  const btnToggleInfiniteWeapon = document.getElementById('btn-toggle-infinite-weapon');

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

  function showModal(modal) {
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
  }

  function hideAllModals() {
    allModals.forEach(m => {
      if (m) {
        m.classList.remove('active');
        m.style.display = 'none';
      }
    });
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
    onPause: (isPaused) => {
      if (isPaused) {
        const diffName = game.difficulty || 'NORMAL';
        const badge = document.getElementById('pause-difficulty-badge');
        if (badge) {
          badge.innerText = `MODE: ${diffName}`;
          badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
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
    AUTOFIRE: 'platypus_setting_autofire'
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
    autoFire: localStorage.getItem(SETTINGS_STORAGE.AUTOFIRE) === 'true'
  };

  const applySettingsToEngine = (notify = false) => {
    game.sound.setSFXEnabled(settingsState.sfxEnabled);
    game.sound.setSFXVolume(settingsState.sfxVolume / 100);
    game.sound.setMusicEnabled(settingsState.musicEnabled);
    game.sound.setMusicVolume(settingsState.musicVolume / 100);
    input.setControlMode(settingsState.controlMode);
    input.setAutoFire(settingsState.autoFire, notify);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE.SFX_ENABLED, settingsState.sfxEnabled);
      localStorage.setItem(SETTINGS_STORAGE.SFX_VOLUME, settingsState.sfxVolume);
      localStorage.setItem(SETTINGS_STORAGE.MUSIC_ENABLED, settingsState.musicEnabled);
      localStorage.setItem(SETTINGS_STORAGE.MUSIC_VOLUME, settingsState.musicVolume);
      localStorage.setItem(SETTINGS_STORAGE.CONTROL_MODE, settingsState.controlMode);
      localStorage.setItem(SETTINGS_STORAGE.AUTOFIRE, settingsState.autoFire);
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

    if (btnModeMouse && btnModeKeyboard) {
      if (settingsState.controlMode === 'MOUSE') {
        btnModeMouse.classList.add('active');
        btnModeKeyboard.classList.remove('active');
        if (controlModeDesc) controlModeDesc.innerText = 'Pesawat bermanuver mulus mengikuti pergerakan kursor mouse di arena permainan secara presisi.';
      } else {
        btnModeKeyboard.classList.add('active');
        btnModeMouse.classList.remove('active');
        if (controlModeDesc) controlModeDesc.innerText = 'Gunakan tombol W, A, S, D atau Tombol Panah pada keyboard untuk mengemudikan pesawat.';
      }
    }

    if (settingAutofireToggle) settingAutofireToggle.checked = settingsState.autoFire;
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
    applySettingsToEngine();
    saveSettings();
    syncSettingsUI();
  };

  // Connect Input AutoFire toggle to Toast notification and Sound
  input.onAutoFireChanged = (isAuto) => {
    settingsState.autoFire = isAuto;
    saveSettings();
    if (game.sound && game.sound.initialized) {
      game.sound.playUiClick();
    }
    if (settingAutofireToggle) {
      settingAutofireToggle.checked = isAuto;
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
      }
      return;
    }

    // If Pause Screen is active: ESC returns to Main Menu, Enter/Space/P resumes, R restarts
    if (modalPause && (modalPause.classList.contains('active') || modalPause.style.display === 'flex')) {
      if (e.code === 'Escape') {
        e.preventDefault();
        returnToMainMenu();
      } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyP') {
        e.preventDefault();
        game.togglePause();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        hideAllModals();
        game.restart();
      }
      return;
    }

    // If Game Over Screen is active
    if (modalGameOver && (modalGameOver.classList.contains('active') || modalGameOver.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR') {
        e.preventDefault();
        hideAllModals();
        game.restart();
      } else if (e.code === 'Escape' || e.code === 'KeyM') {
        e.preventDefault();
        returnToMainMenu();
      }
      return;
    }

    // If Victory Screen is active
    if (modalVictory && (modalVictory.classList.contains('active') || modalVictory.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        hideAllModals();
        game.restart();
      } else if (e.code === 'Escape' || e.code === 'KeyM') {
        e.preventDefault();
        returnToMainMenu();
      }
      return;
    }
  });

  // Pause Screen Buttons
  if (btnResume) {
    btnResume.addEventListener('click', () => {
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
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnMenuPause) {
    btnMenuPause.addEventListener('click', () => {
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
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnMenuGameOver) {
    btnMenuGameOver.addEventListener('click', () => {
      returnToMainMenu();
    });
  }

  // Victory Buttons
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  if (btnMenuVictory) {
    btnMenuVictory.addEventListener('click', () => {
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
        : 'Mode curang saat ini: <strong>NON-AKTIF</strong>';
    }
    if (cheatControlsPanel) {
      if (workingCheat.enabled) {
        cheatControlsPanel.classList.remove('disabled');
      } else {
        cheatControlsPanel.classList.add('disabled');
      }
    }

    // Stage
    const stage = Math.max(1, Math.min(20, workingCheat.startStage || 1));
    if (cheatStageSlider) cheatStageSlider.value = stage;
    if (cheatStageValBadge) cheatStageValBadge.innerText = `STAGE ${stage}`;
    if (cheatStageDesc) cheatStageDesc.innerText = STAGE_DESCRIPTIONS[stage] || `Stage ${stage}`;

    // Lives
    if (workingCheat.infiniteLives) {
      if (cheatLivesValBadge) cheatLivesValBadge.innerText = '∞ TAK TERBATAS';
      if (btnToggleInfiniteLives) btnToggleInfiniteLives.classList.add('active');
      if (cheatLivesSlider) cheatLivesSlider.disabled = true;
      if (btnLivesDec) btnLivesDec.disabled = true;
      if (btnLivesInc) btnLivesInc.disabled = true;
    } else {
      const lives = Math.max(1, Math.min(20, workingCheat.startingLives || 10));
      if (cheatLivesValBadge) cheatLivesValBadge.innerText = `${lives} NYAWA`;
      if (cheatLivesSlider) {
        cheatLivesSlider.value = lives;
        cheatLivesSlider.disabled = false;
      }
      if (btnToggleInfiniteLives) btnToggleInfiniteLives.classList.remove('active');
      if (btnLivesDec) btnLivesDec.disabled = false;
      if (btnLivesInc) btnLivesInc.disabled = false;
    }

    // Weapon duration
    if (workingCheat.infiniteWeaponDuration) {
      if (cheatWeaponValBadge) cheatWeaponValBadge.innerText = '∞ TAK TERBATAS';
      if (btnToggleInfiniteWeapon) btnToggleInfiniteWeapon.classList.add('active');
      if (cheatWeaponSlider) cheatWeaponSlider.disabled = true;
      if (btnWeaponDec) btnWeaponDec.disabled = true;
      if (btnWeaponInc) btnWeaponInc.disabled = true;
    } else {
      const duration = Math.max(5, Math.min(60, workingCheat.weaponDuration || 15));
      if (cheatWeaponValBadge) cheatWeaponValBadge.innerText = `${duration} DETIK`;
      if (cheatWeaponSlider) {
        cheatWeaponSlider.value = duration;
        cheatWeaponSlider.disabled = false;
      }
      if (btnToggleInfiniteWeapon) btnToggleInfiniteWeapon.classList.remove('active');
      if (btnWeaponDec) btnWeaponDec.disabled = false;
      if (btnWeaponInc) btnWeaponInc.disabled = false;
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
      infiniteLives: false,
      startingLives: 10,
      infiniteWeaponDuration: false,
      weaponDuration: 15
    };
    syncCheatModalUI();
  };

  // Cheat event listeners
  if (btnOpenCheat) btnOpenCheat.addEventListener('click', openCheatModal);
  if (btnCheatSave) btnCheatSave.addEventListener('click', saveAndCloseCheat);
  if (btnCheatReset) btnCheatReset.addEventListener('click', resetCheatDefaults);

  if (cheatMasterToggle) {
    cheatMasterToggle.addEventListener('change', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.enabled = cheatMasterToggle.checked;
      syncCheatModalUI();
    });
  }

  // Stage interactions
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

  // Lives interactions
  if (cheatLivesSlider) {
    cheatLivesSlider.addEventListener('input', () => {
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = parseInt(cheatLivesSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnLivesDec) {
    btnLivesDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = Math.max(1, (workingCheat.startingLives || 10) - 1);
      syncCheatModalUI();
    });
  }
  if (btnLivesInc) {
    btnLivesInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteLives = false;
      workingCheat.startingLives = Math.min(20, (workingCheat.startingLives || 10) + 1);
      syncCheatModalUI();
    });
  }
  if (btnToggleInfiniteLives) {
    btnToggleInfiniteLives.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteLives = !workingCheat.infiniteLives;
      syncCheatModalUI();
    });
  }

  // Weapon interactions
  if (cheatWeaponSlider) {
    cheatWeaponSlider.addEventListener('input', () => {
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = parseInt(cheatWeaponSlider.value, 10);
      syncCheatModalUI();
    });
  }
  if (btnWeaponDec) {
    btnWeaponDec.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = Math.max(5, (workingCheat.weaponDuration || 15) - 5);
      syncCheatModalUI();
    });
  }
  if (btnWeaponInc) {
    btnWeaponInc.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteWeaponDuration = false;
      workingCheat.weaponDuration = Math.min(60, (workingCheat.weaponDuration || 15) + 5);
      syncCheatModalUI();
    });
  }
  if (btnToggleInfiniteWeapon) {
    btnToggleInfiniteWeapon.addEventListener('click', () => {
      game.sound.init();
      game.sound.playUiClick();
      workingCheat.infiniteWeaponDuration = !workingCheat.infiniteWeaponDuration;
      syncCheatModalUI();
    });
  }

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
  document.querySelectorAll('.weapon-card, .clay-btn, .clay-nav-btn, .world-item, .instruction-item, .clay-subtle-cheat-btn, .quick-chip, .clay-step-btn, .clay-opt-toggle, .mode-seg-btn, .shortcut-pill, .difficulty-btn').forEach(el => {
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

  // Difficulty Selection Handlers
  const diffButtons = document.querySelectorAll('.difficulty-btn');
  const diffDescBox = document.getElementById('difficulty-description-banner');
  const weaponNoticeText = document.getElementById('weapon-notice-text');
  const tabWeaponsBtn = document.querySelector('.clay-tab-btn[data-tab="tab-weapons"]');

  const diffDescriptions = {
    EASY: `<span class="desc-highlight">Santai (Easy):</span> Max 15 Nyawa • Durasi Senjata 20s (Tak Hancur Saat Mati) • Drop 10–40s • +1 Nyawa tiap 100k Skor & Kalahkan Boss`,
    NORMAL: `<span class="desc-highlight">Klasik Arcade (Normal):</span> Max 10 Nyawa • Durasi Senjata 15s (Hancur Saat Mati) • Drop 10–40s • +1 Nyawa tiap 250k Skor & Kalahkan Boss`,
    HARD: `<span class="desc-highlight">Tantangan Hardcore (Hard):</span> Max 5 Nyawa • Durasi Senjata 10s • Drop Lebih Jarang (20–40s) • +1 Nyawa tiap 500k Skor • Boss Tanpa Nyawa!`
  };

  const updateDifficultyUI = (diffKey) => {
    diffButtons.forEach(b => {
      if (b.getAttribute('data-difficulty') === diffKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (diffDescBox && diffDescriptions[diffKey]) {
      diffDescBox.innerHTML = diffDescriptions[diffKey];
    }

    if (tabWeaponsBtn) {
      const dur = diffKey === 'EASY' ? '20S' : (diffKey === 'HARD' ? '10S' : '15S');
      tabWeaponsBtn.innerHTML = `<span class="tab-icon">⚡</span> ARSENAL SENJATA (${dur})`;
    }

    if (weaponNoticeText) {
      const dur = diffKey === 'EASY' ? '20 detik' : (diffKey === 'HARD' ? '10 detik' : '15 detik');
      weaponNoticeText.innerHTML = `⏱️ Seluruh 5 tipe senjata spesial memiliki durasi aktif <strong>${dur}</strong> sebelum kembali ke Pea-Shooter!`;
    }
  };

  // Sync initial selection from game instance (which reads localStorage)
  updateDifficultyUI(game.difficulty);

  diffButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const diffKey = btn.getAttribute('data-difficulty');
      if (diffKey) {
        game.sound.init();
        game.sound.playUiClick();
        game.setDifficulty(diffKey);
        updateDifficultyUI(diffKey);
      }
    });
  });

  console.log('Platypus AI Arcade initialized successfully!');
}

// Ensure execution whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGameApp);
} else {
  initGameApp();
}
