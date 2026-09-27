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

  // DOM Buttons
  const btnPlayGame = document.getElementById('btn-play-game');
  const btnResume = document.getElementById('btn-resume');
  const btnRestartPause = document.getElementById('btn-restart-pause');
  const btnRetry = document.getElementById('btn-retry');
  const btnPlayAgain = document.getElementById('btn-play-again');

  // HUD Quick Action Buttons
  const btnSound = document.getElementById('btn-sound');
  const btnMusic = document.getElementById('btn-music');
  const btnControlMode = document.getElementById('btn-control-mode');
  const btnAutoFire = document.getElementById('btn-autofire');
  const btnPause = document.getElementById('btn-pause');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  // Stats displays
  const textGameOverStats = document.getElementById('gameover-stats');
  const textGameOverHighscore = document.getElementById('gameover-highscore');
  const textVictoryStats = document.getElementById('victory-stats');

  // Helper to show/hide modals cleanly
  function showModal(modal) {
    [modalStart, modalPause, modalGameOver, modalVictory].forEach(m => {
      if (m !== modal) {
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
    [modalStart, modalPause, modalGameOver, modalVictory].forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
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
    onGameOver: (score, stage, totalStages, wave, highscore, diffConfig) => {
      const diffName = (diffConfig && diffConfig.name) || game.difficulty || 'NORMAL';
      if (textGameOverStats) textGameOverStats.innerText = `Mode: ${diffName} | Skor: ${score.toLocaleString()} | Stage: ${stage} / ${totalStages} (Gelombang ${wave})`;
      if (textGameOverHighscore) textGameOverHighscore.innerText = `Skor Tertinggi (${diffName}): ${highscore.toLocaleString()}`;
      const badge = document.getElementById('gameover-difficulty-badge');
      if (badge) {
        badge.innerText = `MODE: ${diffName}`;
        badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
      }
      showModal(modalGameOver);
    },
    onVictory: (score, totalStages, diffConfig) => {
      const diffName = (diffConfig && diffConfig.name) || game.difficulty || 'NORMAL';
      if (textVictoryStats) textVictoryStats.innerText = `Mode: ${diffName} | Skor Akhir: ${score.toLocaleString()} | SELURUH ${totalStages} STAGE SELESAI!`;
      const badge = document.getElementById('victory-difficulty-badge');
      if (badge) {
        badge.innerText = `MODE: ${diffName}`;
        badge.className = `modal-diff-badge diff-badge-${diffName.toLowerCase()}`;
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

  // Keyboard navigation for all screens/modals
  window.addEventListener('keydown', (e) => {
    // If Start Screen is active
    if (modalStart && (modalStart.classList.contains('active') || modalStart.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        triggerStartGame(e);
      }
      return;
    }

    // If Pause Screen is active
    if (modalPause && (modalPause.classList.contains('active') || modalPause.style.display === 'flex')) {
      if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter') {
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
      }
      return;
    }

    // If Victory Screen is active
    if (modalVictory && (modalVictory.classList.contains('active') || modalVictory.style.display === 'flex')) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        hideAllModals();
        game.restart();
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

  if (btnRestartPause) {
    btnRestartPause.addEventListener('click', () => {
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  // Game Over Retry
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  // Victory Play Again
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      ensureFullscreen();
      hideAllModals();
      game.restart();
    });
  }

  // Sound & Music Toggles
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const sfxOn = game.sound.toggleSFX();
      btnSound.innerHTML = sfxOn ? ICONS.SOUND_ON : ICONS.SOUND_OFF;
      btnSound.title = sfxOn ? 'Suara (SFX) Aktif' : 'Suara (SFX) Mati';
    });
  }

  if (btnMusic) {
    btnMusic.addEventListener('click', () => {
      const musicOn = game.sound.toggleMusic();
      btnMusic.innerHTML = musicOn ? ICONS.MUSIC_ON : ICONS.MUSIC_OFF;
      btnMusic.title = musicOn ? 'Musik Aktif' : 'Musik Mati';
    });
  }

  // Control Mode Toggle (Mouse vs Keyboard)
  if (btnControlMode) {
    btnControlMode.addEventListener('click', () => {
      const mode = input.toggleControlMode();
      btnControlMode.innerHTML = mode === 'MOUSE' ? ICONS.MOUSE : ICONS.KEYBOARD;
      btnControlMode.title = `Mode Kontrol: ${mode === 'MOUSE' ? 'Mouse' : 'Keyboard (WASD)'}`;
    });
  }

  // Auto-Fire Toggle
  if (btnAutoFire) {
    btnAutoFire.addEventListener('click', () => {
      const auto = input.toggleAutoFire();
      btnAutoFire.style.background = auto ? '#f57c00' : 'rgba(46, 32, 28, 0.88)';
      btnAutoFire.style.borderColor = auto ? '#ffb74d' : '#8d6e63';
      btnAutoFire.title = auto ? 'Auto-Fire Aktif' : 'Auto-Fire Mati';
    });
  }

  // Top Bar Pause Button
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      game.togglePause();
    });
  }

  // Fullscreen Toggle
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const wrapper = document.getElementById('game-wrapper');
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(err => console.log(err));
        btnFullscreen.innerHTML = ICONS.FULLSCREEN_EXIT;
      } else {
        document.exitFullscreen().catch(err => console.log(err));
        btnFullscreen.innerHTML = ICONS.FULLSCREEN_ENTER;
      }
    });
  }

  // Main Menu Tab Navigation & Audio Micro-Interactions
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

  // Weapon cards and buttons micro-interaction sound effects
  document.querySelectorAll('.weapon-card, .clay-btn, .hud-icon-btn, .world-item, .instruction-item').forEach(el => {
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
