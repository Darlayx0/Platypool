// Web Audio API Procedural Dynamic Sound & Soundtrack Synthesizer for Platypus Game
// High-Fidelity, Smooth ADSR Envelopes, Multi-World Soundtracks & Intense Boss Themes
import { MusicEngine } from './music/MusicEngine.js';
import { TRACK_DEFS } from './music/Tracks.js';

// Music bus gain scale applied to the user's music volume (single source of truth).
const MUSIC_BUS_SCALE = 0.5;
const OVERLAY_MODES = new Set(['MENU', 'PAUSED', 'GAMEOVER', 'VICTORY']);
const BIOME_BOSS = { VALLEY: 'DREADNOUGHT', CANYON: 'GOLIATH_ZEPPELIN', CYBER_NIGHT: 'LEVIATHAN_TITAN', COSMIC_VOID: 'OMEGA_COLOSSUS' };

export class SoundController {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.85;
    this.musicVolume = 0.50;
    this.isMuted = false;

    // Audio Routing Nodes
    this.masterGain = null;
    this.masterCompressor = null;
    this.warmthFilter = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.musicFilter = null; // Dynamic lowpass for pause / lo-fi ducking sweep
    this.musicDuckingGain = null; // Smooth crossfades, stage transitions, and pause ducking
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayFilter = null;

    // Music State Machine (playback itself lives in this.music = MusicEngine)
    this.music = null;
    this.currentBiome = 'VALLEY';
    this.isBossMusic = false;
    this.currentBossType = null;
    this.bossRage = false;
    this.musicMode = 'MENU'; // 'MENU' | 'GAMEPLAY' | 'BOSS' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'
    this.initialized = false;
    this.isPausedDucked = false;
    this.listenersAttached = false;
    this.savedMusicState = null;

    // Pre-allocated noise buffers for zero latency and garbage collection
    this.whiteNoiseBuffer = null;
    this.pinkNoiseBuffer = null;
  }

  init() {
    if (this.initialized) {
      this.resume();
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // 1. Master Dynamics Compressor (Prevents clipping/harshness, provides warm broadcast-grade mastering)
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(20, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.14, this.ctx.currentTime);

      // 2. Analog Warmth Lowpass Filter (Eliminates digital aliasing and ear-piercing harshness)
      this.warmthFilter = this.ctx.createBiquadFilter();
      this.warmthFilter.type = 'lowpass';
      this.warmthFilter.frequency.setValueAtTime(14500, this.ctx.currentTime);
      this.warmthFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      // 3. Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.72, this.ctx.currentTime);

      // Chain: Sub-buses -> Warmth Filter -> Compressor -> Master Gain -> Destination
      this.warmthFilter.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // 4. SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.warmthFilter);

      // 5. Music Bus Architecture:
      // Music Voices -> musicGain -> Studio 3-Band Parametric EQ (LowShelf + MidDip + HighAir) -> musicFilter -> musicDuckingGain -> warmthFilter
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? (this.musicVolume * MUSIC_BUS_SCALE) : 0, this.ctx.currentTime);

      // Studio 3-Band Parametric EQ for pristine acoustic transparency ("Jernih & Bebas Lumpur/Muddiness")
      // Band 1: Low-Shelf (115Hz, +1.5dB) - Deep rounded analog warmth without boominess
      this.musicEQLow = this.ctx.createBiquadFilter();
      this.musicEQLow.type = 'lowshelf';
      this.musicEQLow.frequency.setValueAtTime(115, this.ctx.currentTime);
      this.musicEQLow.gain.setValueAtTime(1.5, this.ctx.currentTime);

      // Band 2: Peaking Mid-Dip (440Hz, -3.2dB, Q=1.3) - Eliminates the boxy buildup where digital saw/tri harmonics clash
      this.musicEQMid = this.ctx.createBiquadFilter();
      this.musicEQMid.type = 'peaking';
      this.musicEQMid.frequency.setValueAtTime(440, this.ctx.currentTime);
      this.musicEQMid.Q.setValueAtTime(1.3, this.ctx.currentTime);
      this.musicEQMid.gain.setValueAtTime(-3.2, this.ctx.currentTime);

      // Band 3: High-Shelf Air (7800Hz, +2.4dB) - Silky sheen, crystal sparkle for bells, hats & harmonics
      this.musicEQHigh = this.ctx.createBiquadFilter();
      this.musicEQHigh.type = 'highshelf';
      this.musicEQHigh.frequency.setValueAtTime(7800, this.ctx.currentTime);
      this.musicEQHigh.gain.setValueAtTime(2.4, this.ctx.currentTime);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(18000, this.ctx.currentTime);
      this.musicFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.musicDuckingGain = this.ctx.createGain();
      this.musicDuckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Routing through Studio Master EQ chain
      this.musicGain.connect(this.musicEQLow);
      this.musicEQLow.connect(this.musicEQMid);
      this.musicEQMid.connect(this.musicEQHigh);
      this.musicEQHigh.connect(this.musicFilter);
      this.musicFilter.connect(this.musicDuckingGain);
      this.musicDuckingGain.connect(this.warmthFilter);

      // 6. Stereo Spatial Delay / Reverb Line (Adds lush acoustic depth to synth plucks & leads)
      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.setValueAtTime(0.24, this.ctx.currentTime);

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.26, this.ctx.currentTime);

      this.delayFilter = this.ctx.createBiquadFilter();
      this.delayFilter.type = 'lowpass';
      this.delayFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);

      this.delayNode.connect(this.delayFilter);
      this.delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);

      if (this.ctx.createStereoPanner) {
        this.delayPanner = this.ctx.createStereoPanner();
        this.delayPanner.pan.setValueAtTime(0.26, this.ctx.currentTime);
        this.delayFilter.connect(this.delayPanner);
        this.delayPanner.connect(this.musicGain);
      } else {
        this.delayFilter.connect(this.musicGain);
      }

      // 7. Initialize Noise Buffers
      this.initNoiseBuffers();

      // 8. Adaptive soundtrack engine (owns its own reverb, delay & glue compressor)
      this.music = new MusicEngine(this.ctx, this.musicGain, this.whiteNoiseBuffer, this.pinkNoiseBuffer);
      this.initialized = true;
      this.installJukebox();

      // 9. Event handlers for browser visibility, tab focus & audio unlock
      this.setupVisibilityAndFocusHandlers();

      this.resume();
    } catch (e) {
      console.warn('Web Audio not supported or failed to initialize:', e);
    }
  }

  initNoiseBuffers() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2; // 2 seconds buffer

    // White Noise
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const wData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      wData[i] = Math.random() * 2 - 1;
    }

    // Pink / Brown Clay Noise (Warmer, softer low-frequency rumble for natural physical impacts)
    this.pinkNoiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const pData = this.pinkNoiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  setupVisibilityAndFocusHandlers() {
    if (this.listenersAttached || typeof document === 'undefined' || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const handleResumeAndResync = () => {
      this.resume();
      // If the tab was backgrounded, skip missed time instead of bursting past steps
      if (this.music) this.music.resync();
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResumeAndResync();
      }
    });

    window.addEventListener('focus', () => {
      handleResumeAndResync();
    });

    // Unconditional user gesture listeners to unlock AudioContext autoplay policies across all browsers
    const unlockAudio = () => {
      this.resume();
      if (this.musicMode === 'MENU' && this.musicEnabled && !this.isMusicPlaying) {
        this.playMusic({ mode: 'MENU', fadeIn: true });
      }
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    // Eager playback attempt if audio policy allows immediate play
    if (this.musicMode === 'MENU' && this.musicEnabled && !this.isMusicPlaying) {
      this.playMusic({ mode: 'MENU', fadeIn: true });
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.sfxGain && this.ctx) {
      const target = this.sfxEnabled ? this.sfxVolume : 0;
      const t = this.ctx.currentTime;
      try {
        this.sfxGain.gain.cancelScheduledValues(t);
        this.sfxGain.gain.setTargetAtTime(target, t, 0.05);
      } catch (e) {
        this.sfxGain.gain.setValueAtTime(target, t);
      }
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.musicGain && this.ctx) {
      const target = this.musicEnabled ? (this.musicVolume * MUSIC_BUS_SCALE) : 0;
      const t = this.ctx.currentTime;
      try {
        this.musicGain.gain.cancelScheduledValues(t);
        this.musicGain.gain.setTargetAtTime(target, t, 0.05);
      } catch (e) {
        this.musicGain.gain.setValueAtTime(target, t);
      }
    }
  }

  setSFXEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    if (this.sfxGain && this.ctx) {
      const target = this.sfxEnabled ? this.sfxVolume : 0;
      const t = this.ctx.currentTime;
      try {
        this.sfxGain.gain.cancelScheduledValues(t);
        this.sfxGain.gain.setTargetAtTime(target, t, 0.05);
      } catch (e) {
        this.sfxGain.gain.setValueAtTime(target, t);
      }
    }
    return this.sfxEnabled;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicGain && this.ctx) {
      const target = this.musicEnabled ? (this.musicVolume * MUSIC_BUS_SCALE) : 0;
      const t = this.ctx.currentTime;
      try {
        this.musicGain.gain.cancelScheduledValues(t);
        this.musicGain.gain.setTargetAtTime(target, t, 0.05);
      } catch (e) {
        this.musicGain.gain.setValueAtTime(target, t);
      }
    }
    if (this.musicEnabled) {
      this.playMusic({ mode: this.musicMode, biome: this.currentBiome, isBoss: this.isBossMusic, bossType: this.currentBossType, forceRestart: false });
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSFX() {
    return this.setSFXEnabled(!this.sfxEnabled);
  }

  toggleMusic() {
    return this.setMusicEnabled(!this.musicEnabled);
  }

  // --- SOUND EFFECTS (SFX) WITH PROFESSIONAL SMOOTH TIMBRE ---

  playShoot(type = 'NORMAL') {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    if (type === 'SPREAD') {
      // Punchy organic triple burst with warm stereo spread
      const pitches = [440, 520, 610];
      pitches.forEach((freq, idx) => {
        const delay = idx * 0.018;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + delay);
        osc.frequency.exponentialRampToValueAtTime(140, t + delay + 0.11);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, t + delay);
        filter.frequency.exponentialRampToValueAtTime(400, t + delay + 0.11);

        gain.gain.setValueAtTime(0.001, t + delay);
        gain.gain.linearRampToValueAtTime(0.24, t + delay + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + delay);
        osc.stop(t + delay + 0.12);
      });
    } else if (type === 'LASER') {
      // Shimmering sci-fi crystal beam with harmonic warmth
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(840, t);
      osc1.frequency.exponentialRampToValueAtTime(260, t + 0.16);
      osc2.frequency.setValueAtTime(1260, t);
      osc2.frequency.exponentialRampToValueAtTime(390, t + 0.16);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(450, t + 0.16);
      filter.Q.setValueAtTime(2.5, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.26, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.17);
      osc2.stop(t + 0.17);
    } else if (type === 'HOMING') {
      // Missile thruster ignition whoosh + ascending acoustic turbine whine
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.09);
      osc.frequency.linearRampToValueAtTime(340, t + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.15);

      // Low end thrust rumble
      this.playPinkNoise(t, 0.12, 0.18, 380);
    } else if (type === 'FLAK') {
      // Deep physical clay mortar cannon thud (satisfying tactile hollow thump)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.15);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.15);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.38, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);

      this.playPinkNoise(t, 0.14, 0.22, 500);
    } else if (type === 'PLASMA') {
      // High-voltage electric crackle with resonant snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.linearRampToValueAtTime(860, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.15);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(3.0, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } else if (type === 'NORMAL_BOOSTED') {
      // Supersonic boosted clay pellet: punchy laser ping with warm analog body
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.055);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);
      filter.frequency.exponentialRampToValueAtTime(600, t + 0.055);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.26, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } else {
      // NORMAL: Round organic clay pellet pop (pleasant, comfortable on the ears, zero fatigue)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(390, t);
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.065);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.065);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  playEnemyShoot() {
    if (!this.sfxEnabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (t - (this.lastEnemyShootTime || 0) < 0.035) return;
    this.lastEnemyShootTime = t;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.09);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.095);
  }

  playEnemyHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (t - (this.lastEnemyHitTime || 0) < 0.038) return;
    this.lastEnemyHitTime = t;
    this.resume();

    // Tactile plasticine "squish-thud" with gentle highpass impact transient
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.05);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.055);
  }

  playExplosion(size = 'small') {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const isLarge = size === 'large';
    const isMedium = size === 'medium';
    const duration = isLarge ? 0.75 : (isMedium ? 0.45 : 0.28);
    const peakVolume = isLarge ? 0.65 : (isMedium ? 0.48 : 0.36);

    // 1. Warm pink clay rubble & debris burst
    this.playPinkNoise(t, duration, peakVolume, isLarge ? 550 : 750);

    // 2. Punchy transient click
    this.playWhiteNoise(t, 0.03, peakVolume * 0.4, 1800);

    // 3. Deep sub-harmonic punch (sine drop)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isLarge ? 130 : 95, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + duration);

    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(isLarge ? 0.55 : 0.38, t + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + duration + 0.01);
  }

  playPowerUpCycle(index = 0) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const pitches = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    const freq = pitches[index % pitches.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  playPowerUpCollect() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    // Shimmering 4-note ascending fanfare with stereo reflection
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      // Connect to spatial delay for lush arcade shimmer
      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(startTime);
      osc.stop(startTime + 0.19);
    });
  }

  playExtraLife() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    // Triumphant 1-UP arcade victory fanfare (Harmonized Major chord arpeggio)
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(startTime);
      osc.stop(startTime + 0.23);
    });
  }


  playSpecialDropSpawn() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Fast arpeggiated crystal chime
    const notes = [659.25, 880.0, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, st + 0.16);

      gain.gain.setValueAtTime(0.001, st);
      gain.gain.linearRampToValueAtTime(0.18, st + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(st);
      osc.stop(st + 0.20);
    });
  }

  playSpeedToggle(active) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (active) {
      // Ascending electric pip
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(980, t + 0.09);
    } else {
      // Descending power down click
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);
    }

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.10);
  }

  playSpecialDropCollect() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [659.25, 880.0, 1174.66, 1567.98]; // E5, A5, D6, G6
    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  playEmptyClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  playFruitCollect() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.09);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  playBossAlarm() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    // Cinematic deep brass warning siren / horn
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const startTime = t + i * 0.38;
      const osc = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      oscSub.type = 'triangle';

      osc.frequency.setValueAtTime(260, startTime);
      osc.frequency.exponentialRampToValueAtTime(520, startTime + 0.26);

      oscSub.frequency.setValueAtTime(130, startTime);
      oscSub.frequency.exponentialRampToValueAtTime(260, startTime + 0.26);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.38, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

      osc.connect(filter);
      oscSub.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      oscSub.start(startTime);
      osc.stop(startTime + 0.33);
      oscSub.stop(startTime + 0.33);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : 0.72;
      const t = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setTargetAtTime(target, t, 0.04);
      } catch (e) {
        this.masterGain.gain.setValueAtTime(target, t);
      }
    }
    return this.isMuted;
  }

  playUiHover() {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, t);
    osc.frequency.exponentialRampToValueAtTime(840, t + 0.035);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playUiClick() {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Layer 1: Tactile clay pop (frequency sweep down)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.045);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);

    // Layer 2: Subtle soft acoustic click transient
    this.playPinkNoise(t, 0.02, 0.08, 1200);
  }

  playUiToggle(isOn = true) {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startF = isOn ? 340 : 620;
    const endF = isOn ? 680 : 280;
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(endF, t + 0.045);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playUiTab() {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.03);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // --- HELPER NOISE PLAYERS ---

  playWhiteNoise(time, duration, volume, filterFreq = 2000) {
    if (!this.ctx || !this.whiteNoiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  playPinkNoise(time, duration, volume, filterFreq = 600) {
    if (!this.ctx || !this.pinkNoiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.pinkNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(60, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  // =========================================================================
  // --- ADAPTIVE SOUNDTRACK (delegates to MusicEngine) ---
  // Tracks: src/engine/music/Tracks.js · Engine: src/engine/music/MusicEngine.js
  // =========================================================================

  resolveTrackKey() {
    switch (this.musicMode) {
      case 'MENU': return 'MENU';
      case 'PAUSED': return 'PAUSED';
      case 'GAMEOVER': return 'GAMEOVER';
      case 'VICTORY': return 'VICTORY';
      default: break;
    }
    if (this.isBossMusic) {
      if (this.currentBossType && TRACK_DEFS[this.currentBossType]) return this.currentBossType;
      return BIOME_BOSS[this.currentBiome] || 'DREADNOUGHT';
    }
    return TRACK_DEFS[this.currentBiome] ? this.currentBiome : 'VALLEY';
  }

  getMusicTrack() {
    return this.music ? this.music.getTrack(this.resolveTrackKey()) : null;
  }

  get isMusicPlaying() {
    return Boolean(this.music && this.music.isPlaying());
  }

  set isMusicPlaying(_v) { /* derived from the engine; kept for backwards compatibility */ }

  /** Bar-based position exposed as legacy 16-step index (used by save games). */
  get musicStep() {
    return this.music ? this.music.getPosition().bar * 16 : 0;
  }

  set musicStep(step) {
    if (this.music && typeof step === 'number' && step > 0) this.music.seek(Math.floor(step / 16));
  }

  syncMusic({ quantize = true, force = false, startBar = 0, fadeIn = null, fadeOut = null } = {}) {
    if (!this.musicEnabled) return;
    if (!this.music) this.init();
    if (!this.music) return;
    this.resume();
    this.music.setRage(this.bossRage && this.musicMode === 'BOSS');
    this.music.play(this.resolveTrackKey(), { quantize, force, startBar, fadeIn, fadeOut });
  }

  setBiome(biomeKey, isBoss = false) {
    if (!TRACK_DEFS[biomeKey]) return;
    this.currentBiome = biomeKey;
    this.isBossMusic = Boolean(isBoss);
    if (!this.isBossMusic) this.bossRage = false;
    this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';
    this.syncMusic({ quantize: true });
  }

  setBossMode(isBoss, biomeKey = null, bossType = null) {
    const wasType = this.currentBossType;
    if (biomeKey) this.currentBiome = biomeKey;
    if (bossType) this.currentBossType = bossType;
    this.isBossMusic = Boolean(isBoss);
    if (!this.isBossMusic || bossType !== wasType) this.bossRage = false;
    // Leaving boss mode while a menu / end screen / pause owns the music must not hijack it.
    if (!this.isBossMusic && OVERLAY_MODES.has(this.musicMode)) {
      if (this.savedMusicState) {
        this.savedMusicState.isBoss = false;
        this.savedMusicState.mode = 'GAMEPLAY';
      }
      return;
    }
    this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';
    this.syncMusic({ quantize: true });
  }

  /** Adaptive intensity: called by the game when a boss becomes enraged. */
  setBossRage(isRaging) {
    this.bossRage = Boolean(isRaging);
    if (this.music) this.music.setRage(this.bossRage && this.musicMode === 'BOSS');
  }

  transitionToBiome(biomeKey, isBoss = false) {
    this.setBiome(biomeKey, isBoss);
  }

  transitionToBoss(biomeKey = null, bossType = null) {
    this.setBossMode(true, biomeKey, bossType);
  }

  restartMusic({ biome = null, isBoss = false, bossType = null } = {}) {
    if (biome) this.currentBiome = biome;
    this.isBossMusic = Boolean(isBoss);
    if (bossType) this.currentBossType = bossType;
    this.bossRage = false;
    this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';
    this.syncMusic({ quantize: false, force: true });
  }

  playMusic({ biome = null, isBoss = null, bossType = null, mode = null, forceRestart = false, fadeIn = true, startStep = 0 } = {}) {
    this.init();
    if (biome) this.currentBiome = biome;
    if (isBoss !== null && isBoss !== undefined) this.isBossMusic = Boolean(isBoss);
    if (bossType) this.currentBossType = bossType;
    if (mode) {
      this.musicMode = mode;
    } else if (!OVERLAY_MODES.has(this.musicMode)) {
      this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';
    }
    this.syncMusic({
      quantize: false,
      force: forceRestart,
      startBar: Math.floor((startStep || 0) / 16),
      fadeIn: fadeIn ? 0.5 : 0.02
    });
  }

  startMusic(forceRestart = false) {
    this.playMusic({ forceRestart });
  }

  stopMusic({ fadeDuration = 0.2 } = {}) {
    if (this.music) this.music.stop(Math.max(0.02, fadeDuration));
  }

  goToMainMenu() {
    this.musicMode = 'MENU';
    this.isBossMusic = false;
    this.currentBossType = null;
    this.bossRage = false;
    this.savedMusicState = null;
    if (this.musicEnabled) {
      this.syncMusic({ quantize: false, fadeIn: 0.8, fadeOut: 0.6 });
    } else {
      this.stopMusic({ fadeDuration: 0.2 });
    }
  }

  setPauseState(isPaused) {
    if (isPaused) {
      if (this.musicMode === 'PAUSED') return;
      const pos = this.music ? this.music.getPosition() : { bar: 0 };
      this.savedMusicState = {
        mode: this.musicMode,
        biome: this.currentBiome,
        isBoss: this.isBossMusic,
        bossType: this.currentBossType,
        rage: this.bossRage,
        bar: pos.bar
      };
      this.musicMode = 'PAUSED';
      this.syncMusic({ quantize: false, force: true, fadeIn: 0.7, fadeOut: 0.45 });
      return;
    }
    if (this.musicMode !== 'PAUSED' && !this.savedMusicState) return;
    const s = this.savedMusicState;
    this.savedMusicState = null;
    if (s) {
      this.currentBiome = s.biome;
      this.isBossMusic = s.isBoss;
      this.currentBossType = s.bossType;
      this.bossRage = s.rage;
      this.musicMode = s.mode === 'PAUSED' ? (s.isBoss ? 'BOSS' : 'GAMEPLAY') : s.mode;
      this.syncMusic({ quantize: false, force: true, startBar: s.bar, fadeIn: 0.55, fadeOut: 0.4 });
    } else {
      this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';
      this.syncMusic({ quantize: false, force: true, fadeIn: 0.55, fadeOut: 0.4 });
    }
  }

  setPauseDucking(isPaused) {
    this.setPauseState(isPaused);
  }

  /** Game Over: stinger flows straight into the reflective loop (same track, no gap). */
  onGameOver() {
    this.musicMode = 'GAMEOVER';
    this.bossRage = false;
    this.savedMusicState = null;
    this.syncMusic({ quantize: false, force: true, fadeIn: 0.02, fadeOut: 0.35 });
  }

  /** Victory: fanfare flows straight into the anthem loop (same track, no gap). */
  onVictory() {
    this.musicMode = 'VICTORY';
    this.bossRage = false;
    this.savedMusicState = null;
    this.syncMusic({ quantize: false, force: true, fadeIn: 0.02, fadeOut: 0.35 });
  }

  playVictoryLoop() {
    this.onVictory();
  }

  /** Debug jukebox: open the game with ?jukebox to get window.jukebox in the console. */
  installJukebox() {
    if (typeof window === 'undefined' || !/[?&]jukebox\b/.test(window.location.search || '')) return;
    window.jukebox = {
      list: () => MusicEngine.listTracks(),
      play: (key, startBar = 0) => { this.init(); this.music.play(key, { quantize: false, force: true, startBar }); return this.music.info(key); },
      rage: (on = true) => this.music && this.music.setRage(on),
      seek: (bar) => this.music && this.music.seek(bar),
      info: () => this.music && Object.assign(this.music.info() || {}, this.music.getPosition()),
      stop: () => this.stopMusic({ fadeDuration: 0.5 })
    };
    console.info('[Jukebox] Ready:', MusicEngine.listTracks().join(', '));
  }
}
