// Web Audio API Procedural Dynamic Sound & Soundtrack Synthesizer for Platypus Game
// High-Fidelity, Smooth ADSR Envelopes, Multi-World Soundtracks & Intense Boss Themes
import { N, TRACKS } from './MusicTracks.js';

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

    // Music Sequencing & State Machine
    this.TRACKS = TRACKS;
    this.currentBiome = 'VALLEY';
    this.isBossMusic = false;
    this.currentBossType = null;
    this.musicMode = 'MENU'; // 'MENU' | 'GAMEPLAY' | 'BOSS' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.initialized = false;
    this.isMusicPlaying = false;
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
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? (this.musicVolume * 0.42) : 0, this.ctx.currentTime);

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

      // 8. Event handlers for browser visibility, tab focus & audio unlock
      this.setupVisibilityAndFocusHandlers();

      this.initialized = true;
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
      if (this.ctx && this.isMusicPlaying && this.schedulerTimer) {
        // If system was suspended or backgrounded, resync note timer to avoid bursting past missed steps
        if (this.nextNoteTime < this.ctx.currentTime - 0.15) {
          this.nextNoteTime = this.ctx.currentTime + 0.04;
          this.musicStep = Math.floor(this.musicStep / 16) * 16;
        }
      }
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
    window.addEventListener('keydown', unlockAudio, { passive: true });
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
      const target = this.musicEnabled ? (this.musicVolume * 0.45) : 0;
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
      const target = this.musicEnabled ? (this.musicVolume * 0.45) : 0;
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

  playPulseBlast() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Layer 1: Sub-bass heavy thump + expanding resonant sweep
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(340, t);
    osc1.frequency.exponentialRampToValueAtTime(32, t + 0.42);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(2600, t);
    filter1.frequency.exponentialRampToValueAtTime(60, t + 0.42);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.55, t + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.sfxGain);

    osc1.start(t);
    osc1.stop(t + 0.46);

    // Layer 2: High-voltage ionization resonant sweep
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    const filter2 = this.ctx.createBiquadFilter();

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(880, t);
    osc2.frequency.exponentialRampToValueAtTime(140, t + 0.32);

    filter2.type = 'bandpass';
    filter2.Q.setValueAtTime(4.0, t);
    filter2.frequency.setValueAtTime(3200, t);
    filter2.frequency.exponentialRampToValueAtTime(400, t + 0.32);

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.linearRampToValueAtTime(0.22, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(this.sfxGain);

    osc2.start(t);
    osc2.stop(t + 0.36);
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
  // =========================================================================
  // --- PROFESSIONAL MULTI-BAR POLYPHONIC DYNAMIC SOUNDTRACK ENGINE ---
  // =========================================================================

  getMusicTrack() {
    if (this.musicMode === 'MENU') {
      return this.TRACKS.MENU;
    }
    if (this.musicMode === 'PAUSED') {
      return this.TRACKS.PAUSED;
    }
    if (this.musicMode === 'GAMEOVER') {
      return this.TRACKS.GAMEOVER;
    }
    if (this.musicMode === 'VICTORY') {
      return this.TRACKS.VICTORY;
    }

    if (this.isBossMusic) {
      if (this.currentBossType && this.TRACKS[this.currentBossType]) {
        return this.TRACKS[this.currentBossType];
      }
      // Biome-based fallback if bossType is not explicitly supplied
      switch (this.currentBiome) {
        case 'CANYON':
          return this.TRACKS.GOLIATH_ZEPPELIN;
        case 'CYBER_NIGHT':
          return this.TRACKS.LEVIATHAN_TITAN;
        case 'COSMIC_VOID':
          return this.TRACKS.OMEGA_COLOSSUS;
        case 'VALLEY':
        default:
          return this.TRACKS.DREADNOUGHT;
      }
    }

    // World Exploration Soundtracks
    switch (this.currentBiome) {
      case 'CANYON':
        return this.TRACKS.CANYON;
      case 'CYBER_NIGHT':
        return this.TRACKS.CYBER_NIGHT;
      case 'COSMIC_VOID':
        return this.TRACKS.COSMIC_VOID;
      case 'VALLEY':
      default:
        return this.TRACKS.VALLEY;
    }
  }

  setBiome(biomeKey, isBoss = false) {
    const validBiomes = ['VALLEY', 'CANYON', 'CYBER_NIGHT', 'COSMIC_VOID'];
    if (validBiomes.includes(biomeKey)) {
      this.currentBiome = biomeKey;
      this.isBossMusic = Boolean(isBoss);
      this.musicMode = 'GAMEPLAY';

      if (this.musicEnabled && (!this.isMusicPlaying || !this.schedulerTimer)) {
        this.playMusic({ biome: biomeKey, isBoss: this.isBossMusic, forceRestart: false, fadeIn: true });
      }
    }
  }

  setBossMode(isBoss, biomeKey = null, bossType = null) {
    this.isBossMusic = Boolean(isBoss);
    if (biomeKey) this.currentBiome = biomeKey;
    if (bossType) this.currentBossType = bossType;
    this.musicMode = this.isBossMusic ? 'BOSS' : 'GAMEPLAY';

    if (this.musicEnabled && (!this.isMusicPlaying || !this.schedulerTimer)) {
      this.playMusic({ biome: this.currentBiome, isBoss: this.isBossMusic, bossType: this.currentBossType, forceRestart: false, fadeIn: true });
    }
  }

  transitionToBiome(biomeKey, isBoss = false) {
    const changed = this.currentBiome !== biomeKey || this.isBossMusic !== isBoss;
    this.setBiome(biomeKey, isBoss);
    if (this.isMusicPlaying && changed) {
      // Quantize to clean 16-step bar boundary for musical transition
      this.musicStep = (this.musicStep % 16 === 0) ? this.musicStep : Math.ceil(this.musicStep / 16) * 16;
    }
  }

  transitionToBoss(biomeKey = null, bossType = null) {
    this.setBossMode(true, biomeKey, bossType);
    if (this.isMusicPlaying) {
      this.musicStep = (this.musicStep % 16 === 0) ? this.musicStep : Math.ceil(this.musicStep / 16) * 16;
    }
  }

  restartMusic({ biome = null, isBoss = false, bossType = null } = {}) {
    if (biome) this.currentBiome = biome;
    this.isBossMusic = Boolean(isBoss);
    if (bossType) this.currentBossType = bossType;
    this.playMusic({ biome: this.currentBiome, isBoss: this.isBossMusic, bossType: this.currentBossType, forceRestart: true, fadeIn: true });
  }

  playMusic({ biome = null, isBoss = null, bossType = null, mode = null, forceRestart = false, fadeIn = true, startStep = 0 } = {}) {
    this.init();
    this.resume();

    if (biome) this.currentBiome = biome;
    if (isBoss !== null && isBoss !== undefined) this.isBossMusic = Boolean(isBoss);
    if (bossType) this.currentBossType = bossType;
    if (mode) {
      this.musicMode = mode;
    } else {
      this.musicMode = this.isBossMusic ? 'BOSS' : (this.musicMode === 'MENU' ? 'MENU' : 'GAMEPLAY');
    }

    if (!this.musicEnabled) return;

    if (this.isPausedDucked && this.musicMode !== 'PAUSED') {
      this.setPauseDucking(false);
    }

    if (this.isMusicPlaying && this.schedulerTimer && !forceRestart) {
      return;
    }

    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.musicStep = startStep;
      this.nextNoteTime = t + 0.05;
      this.isMusicPlaying = true;

      if (this.musicDuckingGain) {
        try {
          this.musicDuckingGain.gain.cancelScheduledValues(t);
          if (fadeIn) {
            this.musicDuckingGain.gain.setValueAtTime(0.001, t);
            this.musicDuckingGain.gain.linearRampToValueAtTime(1.0, t + 0.25);
          } else {
            this.musicDuckingGain.gain.setValueAtTime(1.0, t);
          }
        } catch (e) {
          this.musicDuckingGain.gain.setValueAtTime(1.0, t);
        }
      }

      this.schedulerTimer = setInterval(() => {
        this.scheduleMusicLookahead();
      }, 25);
    }
  }

  startMusic(forceRestart = false) {
    this.playMusic({ forceRestart });
  }

  stopMusic({ fadeDuration = 0.2 } = {}) {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.isMusicPlaying = false;

    if (this.ctx && this.musicDuckingGain && fadeDuration > 0) {
      const t = this.ctx.currentTime;
      try {
        this.musicDuckingGain.gain.cancelScheduledValues(t);
        this.musicDuckingGain.gain.setValueAtTime(this.musicDuckingGain.gain.value, t);
        this.musicDuckingGain.gain.linearRampToValueAtTime(0.001, t + fadeDuration);
        setTimeout(() => {
          if (!this.isMusicPlaying && this.musicDuckingGain && this.ctx) {
            this.musicDuckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
          }
        }, fadeDuration * 1000 + 40);
      } catch (e) {
        this.musicDuckingGain.gain.setValueAtTime(0.001, t);
      }
    }
  }

  goToMainMenu() {
    this.musicMode = 'MENU';
    this.isBossMusic = false;
    this.currentBossType = null;
    this.savedMusicState = null;
    if (this.musicEnabled) {
      this.playMusic({ mode: 'MENU', forceRestart: true, fadeIn: true });
    } else {
      this.stopMusic({ fadeDuration: 0.2 });
    }
  }

  setPauseState(isPaused) {
    if (isPaused) {
      if (this.musicMode !== 'PAUSED') {
        this.savedMusicState = {
          mode: this.musicMode,
          biome: this.currentBiome,
          isBoss: this.isBossMusic,
          bossType: this.currentBossType,
          step: this.musicStep
        };
        this.playMusic({ mode: 'PAUSED', forceRestart: true, fadeIn: true });
      }
    } else {
      if (this.savedMusicState) {
        const s = this.savedMusicState;
        this.savedMusicState = null;
        this.playMusic({
          mode: s.mode,
          biome: s.biome,
          isBoss: s.isBoss,
          bossType: s.bossType,
          startStep: s.step,
          forceRestart: true,
          fadeIn: true
        });
      } else {
        this.playMusic({ biome: this.currentBiome, isBoss: this.isBossMusic, forceRestart: true, fadeIn: true });
      }
    }
  }

  setPauseDucking(isPaused) {
    this.setPauseState(isPaused);
  }

  onGameOver() {
    this.musicMode = 'GAMEOVER';
    this.stopMusic({ fadeDuration: 0.25 });
    this.playGameOverJingle();
  }

  playGameOverJingle() {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime + 0.05;
    const notes = [
      { freq: 440.00, dur: 0.16 }, // A4
      { freq: 392.00, dur: 0.16 }, // G4
      { freq: 349.23, dur: 0.16 }, // F4
      { freq: 329.63, dur: 0.22 }, // E4
      { freq: 293.66, dur: 0.24 }, // D4
      { freq: 220.00, dur: 0.55 }  // A3
    ];

    let offset = 0;
    notes.forEach((note) => {
      const noteTime = t + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, noteTime);
      filter.frequency.exponentialRampToValueAtTime(350, noteTime + note.dur);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.24, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + note.dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(noteTime);
      osc.stop(noteTime + note.dur + 0.05);

      offset += note.dur * 0.85;
    });

    // Automatically transition to the reflective Game Over ambient loop
    setTimeout(() => {
      if (this.musicMode === 'GAMEOVER' && this.musicEnabled) {
        this.playMusic({ mode: 'GAMEOVER', forceRestart: true, fadeIn: true });
      }
    }, 1500);
  }

  onVictory() {
    this.musicMode = 'VICTORY';
    this.stopMusic({ fadeDuration: 0.25 });
    this.playVictoryFanfare();
  }

  playVictoryFanfare() {
    if (!this.sfxEnabled || !this.ctx || this.isMuted) return;
    this.resume();
    const t = this.ctx.currentTime + 0.05;
    const fanfareNotes = [
      { freq: 523.25, dur: 0.12, offset: 0.00 }, // C5
      { freq: 523.25, dur: 0.12, offset: 0.14 }, // C5
      { freq: 523.25, dur: 0.12, offset: 0.28 }, // C5
      { freq: 659.25, dur: 0.28, offset: 0.42 }, // E5
      { freq: 783.99, dur: 0.22, offset: 0.72 }, // G5
      { freq: 1046.50, dur: 0.65, offset: 0.96 } // C6
    ];

    fanfareNotes.forEach((n) => {
      const noteTime = t + n.offset;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(n.freq, noteTime);
      osc2.frequency.setValueAtTime(n.freq * 1.002, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + n.dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(noteTime + n.dur + 0.05);
      osc2.stop(noteTime + n.dur + 0.05);
    });

    // Start looped celebratory victory anthem after fanfare concludes
    setTimeout(() => {
      if (this.musicMode === 'VICTORY' && this.musicEnabled) {
        this.playVictoryLoop();
      }
    }, 1750);
  }

  playVictoryLoop() {
    if (!this.musicEnabled || !this.ctx) return;
    this.playMusic({ mode: 'VICTORY', forceRestart: true, fadeIn: true });
  }

  scheduleMusicLookahead() {
    if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;

    if (this.nextNoteTime < this.ctx.currentTime - 0.20) {
      this.nextNoteTime = this.ctx.currentTime + 0.04;
      this.musicStep = Math.floor(this.musicStep / 16) * 16;
    }

    const track = this.getMusicTrack();
    if (!track) return;

    const stepDuration = 60 / track.bpm / 4; // 16th notes
    const lookaheadTime = 0.12; // 120ms lookahead window

    let iterations = 0;
    while (this.nextNoteTime < this.ctx.currentTime + lookaheadTime && iterations < 32) {
      this.scheduleMusicStep(track, this.musicStep, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.musicStep++;
      iterations++;
    }
  }

  scheduleMusicStep(track, stepIndex, time, stepDuration) {
    const totalSteps = track.totalSteps || 128;
    const idx = stepIndex % totalSteps;

    // 1. Polyphonic Chord Pad Channel (Highpass decoupled from bass + subtle stereo widening)
    if (track.chords && track.chords[idx]) {
      const chordDuration = (track.chordDuration || 16) * stepDuration;
      this.schedulePadChord(track.chords[idx], time, chordDuration, idx);
    }

    // 2. Bass Channel (Warm, punchy, tightly filtered, centered)
    const bassFreq = track.bassSeq ? track.bassSeq[idx] : 0;
    if (bassFreq > 0) {
      this.scheduleBass(bassFreq, time, stepDuration, track.bassWave || 'triangle', track.bassFilter || 650);
    }

    // 3. Lead Melody Channel (Dual Detuned Silky Lead with delayed pitch vibrato LFO)
    const leadFreq = track.leadSeq ? track.leadSeq[idx] : 0;
    if (leadFreq > 0) {
      const hasVibrato = track.leadVibrato !== false;
      this.scheduleLead(leadFreq, time, stepDuration, track.leadWave || 'triangle', track.leadFilter || 2400, track.delaySend || 0.28, hasVibrato);
    }

    // 4. Arpeggiator / Crystal Bell Channel (Hypnotic Ping-Pong Stereo Panning)
    const arpFreq = track.arpSeq ? track.arpSeq[idx] : 0;
    if (arpFreq > 0) {
      this.scheduleArp(arpFreq, time, stepDuration, idx);
    }

    // 5. Rhythm & Percussion Section
    if (track.kickSet && track.kickSet.has(idx)) {
      this.scheduleKick(time, this.isBossMusic || track.kickHeavy);
    }

    if (track.snareSet && track.snareSet.has(idx)) {
      this.scheduleSnare(time, this.isBossMusic);
    }

    if (track.hatSet && track.hatSet.has(idx)) {
      const isAccent = (idx % 4 === 2) || (idx % 8 === 0);
      this.scheduleHiHat(time, isAccent, idx);
    }

    if (track.percSet && track.percSet.has(idx)) {
      this.scheduleWoodblock(time, 780, 0.06);
    }
  }

  schedulePadChord(chordNotes, time, duration, stepIdx = 0) {
    if (!this.ctx || !chordNotes || chordNotes.length === 0 || !this.musicEnabled) return;
    const padGain = this.ctx.createGain();

    // Lowpass filter for analog warmth
    const padLowpass = this.ctx.createBiquadFilter();
    padLowpass.type = 'lowpass';
    padLowpass.frequency.setValueAtTime(1450, time);
    padLowpass.Q.setValueAtTime(0.7, time);

    // Highpass filter at 170Hz: Decouples chords from bassline, eliminating acoustic mud
    const padHighpass = this.ctx.createBiquadFilter();
    padHighpass.type = 'highpass';
    padHighpass.frequency.setValueAtTime(170, time);
    padHighpass.Q.setValueAtTime(0.7, time);

    const noteGain = 0.085 / Math.max(1, chordNotes.length);
    padGain.gain.setValueAtTime(0.0001, time);
    padGain.gain.linearRampToValueAtTime(noteGain, time + 0.08); // 80ms gentle plush attack
    padGain.gain.setValueAtTime(noteGain, time + Math.max(0.08, duration - 0.10));
    padGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    padLowpass.connect(padHighpass);
    padHighpass.connect(padGain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      // Gentle stereo drift between chords
      const panVal = ((stepIdx / 16) % 2 === 0) ? -0.15 : 0.15;
      panner.pan.setValueAtTime(panVal, time);
      padGain.connect(panner);
      panner.connect(this.musicGain);
    } else {
      padGain.connect(this.musicGain);
    }

    chordNotes.forEach((freq, noteIdx) => {
      if (!freq || freq <= 0) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      // Subtle micro-detuning across voices creates lush chorus width
      const detuneFactor = 1.0 + (noteIdx - Math.floor(chordNotes.length / 2)) * 0.0012;
      osc.frequency.setValueAtTime(freq * detuneFactor, time);
      osc.connect(padLowpass);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    });
  }

  scheduleLead(freq, time, stepDuration, wave = 'triangle', filterCutoff = 2400, delaySend = 0.28, hasVibrato = true) {
    if (!this.ctx || !freq || freq <= 0 || !this.musicEnabled) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = wave;
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.0024, time); // Silky warm +4.1 cents chorus

    // Expressive Filter Envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff * 1.15, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, filterCutoff * 0.55), time + stepDuration * 1.1);
    filter.Q.setValueAtTime(1.6, time);

    const targetGain = this.isBossMusic ? 0.15 : 0.125;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(targetGain, time + 0.012); // Clean 12ms attack (zero click)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 1.35);

    // Natural Delayed Pitch Vibrato LFO (Singing analog expressiveness)
    if (hasVibrato && stepDuration >= 0.11) {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(5.2, time); // 5.2 Hz human vocal/instrument vibrato rate

      lfoGain.gain.setValueAtTime(0, time);
      lfoGain.gain.setValueAtTime(0, time + 0.07); // 70ms natural delay before vibrato blooms
      lfoGain.gain.linearRampToValueAtTime(3.4, time + Math.min(0.24, stepDuration * 0.9)); // 3.4 Hz depth

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      lfo.start(time);
      lfo.stop(time + stepDuration * 1.4);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    if (this.delayNode && delaySend > 0) {
      const delaySendGain = this.ctx.createGain();
      delaySendGain.gain.setValueAtTime(delaySend, time);
      gain.connect(delaySendGain);
      delaySendGain.connect(this.delayNode);
    }

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + stepDuration * 1.4);
    osc2.stop(time + stepDuration * 1.4);
  }

  scheduleBass(freq, time, stepDuration, wave = 'triangle', filterCutoff = 650) {
    if (!this.ctx || !freq || freq <= 0 || !this.musicEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(130, time + stepDuration * 0.85);
    filter.Q.setValueAtTime(1.2, time);

    const targetGain = this.isBossMusic ? 0.26 : 0.22;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(targetGain, time + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain); // Centered punch

    osc.start(time);
    osc.stop(time + stepDuration);
  }

  scheduleArp(freq, time, stepDuration, stepIdx = 0) {
    if (!this.ctx || !freq || freq <= 0 || !this.musicEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + stepDuration * 0.85);

    const targetGain = this.isBossMusic ? 0.095 : 0.075;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(targetGain, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + stepDuration * 0.85);

    osc.connect(filter);
    filter.connect(gain);

    // Ping-Pong Stereo Panning: Alternates left and right on every 16th note!
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      const panVal = (stepIdx % 2 === 0) ? -0.36 : 0.36;
      panner.pan.setValueAtTime(panVal, time);
      gain.connect(panner);
      panner.connect(this.musicGain);
    } else {
      gain.connect(this.musicGain);
    }

    if (this.delayNode) {
      const send = this.ctx.createGain();
      send.gain.setValueAtTime(0.24, time);
      gain.connect(send);
      send.connect(this.delayNode);
    }

    osc.start(time);
    osc.stop(time + stepDuration * 0.9);
  }

  scheduleKick(time, heavy = false) {
    if (!this.ctx || !this.musicEnabled) return;

    // Body sub oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 130 : 100, time);
    osc.frequency.exponentialRampToValueAtTime(34, time + 0.12);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(heavy ? 0.44 : 0.32, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.15);

    // Transient attack click (ensures crisp acoustic punch)
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(260, time);
    click.frequency.exponentialRampToValueAtTime(45, time + 0.018);

    clickGain.gain.setValueAtTime(0.12, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    click.connect(clickGain);
    clickGain.connect(this.musicGain);
    click.start(time);
    click.stop(time + 0.022);
  }

  scheduleSnare(time, isBoss = false) {
    if (!this.ctx || !this.musicEnabled || !this.whiteNoiseBuffer) return;

    // 1. Noise snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(isBoss ? 0.16 : 0.115, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.12);

    // 2. Body thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.065);

    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.linearRampToValueAtTime(0.14, time + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.075);
  }

  scheduleHiHat(time, isAccent = false, stepIdx = 0) {
    if (!this.ctx || !this.musicEnabled || !this.whiteNoiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7400, time);
    filter.Q.setValueAtTime(2.8, time);

    const volume = isAccent ? 0.065 : 0.035;
    const decay = isAccent ? 0.055 : 0.030;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(0.20, time); // Natural drum kit hi-hat placement
      gain.connect(panner);
      panner.connect(this.musicGain);
    } else {
      gain.connect(this.musicGain);
    }

    noise.start(time);
    noise.stop(time + decay + 0.005);
  }

  scheduleWoodblock(time, pitch = 780, volume = 0.06) {
    if (!this.ctx || !this.musicEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, time);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, time + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(pitch, time);
    filter.Q.setValueAtTime(4.0, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    osc.connect(filter);
    filter.connect(gain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(-0.22, time); // Natural percussion placement
      gain.connect(panner);
      panner.connect(this.musicGain);
    } else {
      gain.connect(this.musicGain);
    }

    osc.start(time);
    osc.stop(time + 0.05);
  }
}
