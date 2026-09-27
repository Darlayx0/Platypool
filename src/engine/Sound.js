// Web Audio API Procedural Dynamic Sound & Soundtrack Synthesizer for Platypus Game
// High-Fidelity, Smooth ADSR Envelopes, Multi-World Soundtracks & Intense Boss Themes

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
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayFilter = null;

    // Music Sequencing & State
    this.currentBiome = 'VALLEY';
    this.isBossMusic = false;
    this.currentBossType = null;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.initialized = false;

    // Pre-allocated noise buffers for zero latency and garbage collection
    this.whiteNoiseBuffer = null;
    this.pinkNoiseBuffer = null;
  }

  init() {
    if (this.initialized) return;
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
      this.masterGain.gain.setValueAtTime(0.72, this.ctx.currentTime);

      // Chain: Sub-buses -> Warmth Filter -> Compressor -> Master Gain -> Destination
      this.warmthFilter.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // 4. SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.warmthFilter);

      // 5. Music Bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? (this.musicVolume * 0.45) : 0, this.ctx.currentTime);
      this.musicGain.connect(this.warmthFilter);

      // 6. Stereo Spatial Delay / Reverb Line (Adds lush acoustic depth to synth plucks & leads)
      this.delayNode = this.ctx.createDelay();
      this.delayNode.delayTime.setValueAtTime(0.24, this.ctx.currentTime);

      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.setValueAtTime(0.28, this.ctx.currentTime);

      this.delayFilter = this.ctx.createBiquadFilter();
      this.delayFilter.type = 'lowpass';
      this.delayFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);

      this.delayNode.connect(this.delayFilter);
      this.delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayFilter.connect(this.musicGain);

      // 7. Initialize Noise Buffers
      this.initNoiseBuffers();

      this.initialized = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.musicEnabled) {
        this.startMusic();
      }
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

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.sfxGain && this.ctx) {
      const target = this.sfxEnabled ? this.sfxVolume : 0;
      this.sfxGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.musicGain && this.ctx) {
      const target = this.musicEnabled ? (this.musicVolume * 0.45) : 0;
      this.musicGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  setSFXEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    if (this.sfxGain && this.ctx) {
      const target = this.sfxEnabled ? this.sfxVolume : 0;
      this.sfxGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    return this.sfxEnabled;
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicGain && this.ctx) {
      const target = this.musicEnabled ? (this.musicVolume * 0.45) : 0;
      this.musicGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    if (this.musicEnabled) {
      this.startMusic();
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
    this.resume();

    const t = this.ctx.currentTime;
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
    this.resume();

    // Tactile plasticine "squish-thud" with gentle highpass impact transient
    const t = this.ctx.currentTime;
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

  playUiHover() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.035);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playUiClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.055);
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
  // --- PROCEDURAL DYNAMIC SOUNDTRACK ENGINE (WEB AUDIO LOOKAHEAD SCHEDULER) ---
  // =========================================================================

  setBiome(biomeKey, isBoss = false) {
    const validBiomes = ['VALLEY', 'CANYON', 'CYBER_NIGHT', 'COSMIC_VOID'];
    if (validBiomes.includes(biomeKey)) {
      this.currentBiome = biomeKey;
      this.isBossMusic = isBoss;
    }
  }

  setBossMode(isBoss, biomeKey = null, bossType = null) {
    this.isBossMusic = isBoss;
    if (biomeKey) this.currentBiome = biomeKey;
    if (bossType) this.currentBossType = bossType;
  }

  getMusicTrack() {
    // 8 distinct tracks: 4 World exploration tracks + 4 intense Boss battle tracks!
    if (this.isBossMusic) {
      switch (this.currentBiome) {
        case 'CANYON':
          // Boss 2: Goliath Zeppelin (Heavy Steampunk Industrial Pulse)
          return {
            bpm: 148,
            bassWave: 'sawtooth',
            leadWave: 'square',
            bassSeq: [73.42, 0, 73.42, 82.41, 73.42, 0, 87.31, 98.0, 73.42, 0, 73.42, 110.0, 98.0, 87.31, 82.41, 65.41],
            leadSeq: [293.66, 293.66, 0, 329.63, 349.23, 0, 392.0, 0, 440.0, 392.0, 349.23, 329.63, 293.66, 0, 349.23, 392.0],
            arpSeq:  [0, 587.33, 0, 659.25, 0, 698.46, 0, 783.99, 0, 587.33, 0, 659.25, 0, 783.99, 0, 880.0],
            hasSubKick: true
          };
        case 'CYBER_NIGHT':
          // Boss 3: Ultimate Clay Leviathan (Fast Acid Dark Synth Cosmic Showdown)
          return {
            bpm: 156,
            bassWave: 'sawtooth',
            leadWave: 'sawtooth',
            bassSeq: [82.41, 82.41, 92.50, 82.41, 110.0, 82.41, 98.0, 123.47, 82.41, 82.41, 130.81, 123.47, 110.0, 98.0, 92.50, 73.42],
            leadSeq: [329.63, 0, 369.99, 392.0, 0, 440.0, 493.88, 0, 523.25, 493.88, 440.0, 392.0, 369.99, 0, 440.0, 493.88],
            arpSeq:  [659.25, 0, 739.99, 0, 783.99, 0, 880.0, 0, 987.77, 0, 880.0, 0, 783.99, 0, 739.99, 0],
            hasSubKick: true
          };
        case 'COSMIC_VOID':
          // Boss 4: Omega Clay Colossus (The Climax Apocalyptic Final Showdown!)
          return {
            bpm: 164,
            bassWave: 'sawtooth',
            leadWave: 'square',
            bassSeq: [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 98.0, 116.54, 65.41, 65.41, 130.81, 116.54, 98.0, 87.31, 77.78, 58.27],
            leadSeq: [523.25, 0, 587.33, 622.25, 0, 698.46, 783.99, 0, 830.61, 783.99, 698.46, 622.25, 587.33, 0, 698.46, 783.99],
            arpSeq:  [1046.5, 0, 1174.66, 0, 1244.51, 0, 1396.91, 0, 1567.98, 0, 1396.91, 0, 1244.51, 0, 1174.66, 0],
            hasSubKick: true
          };
        case 'VALLEY':
        default:
          // Boss 1: Iron Clay Dreadnought (Driving Militaristic March)
          return {
            bpm: 142,
            bassWave: 'sawtooth',
            leadWave: 'square',
            bassSeq: [73.42, 73.42, 0, 87.31, 73.42, 73.42, 98.0, 87.31, 73.42, 73.42, 0, 110.0, 98.0, 87.31, 73.42, 65.41],
            leadSeq: [293.66, 0, 311.13, 293.66, 0, 349.23, 392.0, 0, 293.66, 349.23, 440.0, 0, 415.3, 392.0, 349.23, 311.13],
            arpSeq:  [0, 587.33, 0, 622.25, 0, 698.46, 0, 784.0, 0, 880.0, 0, 784.0, 0, 698.46, 0, 587.33],
            hasSubKick: true
          };
      }
    }

    // World Exploration Soundtracks (Peaceful, Groovy, Thematic, Polished)
    switch (this.currentBiome) {
      case 'CANYON':
        // World 2: Sunset Canyon (Dorian Spanish/Western Steampunk Vibe)
        return {
          bpm: 125,
          bassWave: 'triangle',
          leadWave: 'triangle',
          bassSeq: [73.42, 0, 0, 110.0, 73.42, 0, 98.0, 0, 82.41, 0, 0, 110.0, 73.42, 82.41, 87.31, 98.0],
          leadSeq: [293.66, 0, 329.63, 0, 349.23, 392.0, 0, 440.0, 0, 392.0, 349.23, 0, 329.63, 0, 293.66, 0],
          arpSeq:  [0, 440.0, 523.25, 0, 587.33, 0, 440.0, 0, 0, 392.0, 440.0, 0, 523.25, 0, 392.0, 0],
          hasSubKick: false
        };
      case 'CYBER_NIGHT':
        // World 3: Midnight Cyber-Clay (Lush 80s Synthwave / Neon Stratosphere)
        return {
          bpm: 132,
          bassWave: 'sawtooth',
          leadWave: 'sawtooth',
          bassSeq: [92.50, 0, 92.50, 0, 82.41, 0, 82.41, 0, 73.42, 0, 73.42, 0, 82.41, 0, 87.31, 0],
          leadSeq: [369.99, 0, 440.0, 0, 493.88, 554.37, 0, 440.0, 369.99, 0, 329.63, 0, 369.99, 0, 440.0, 0],
          arpSeq:  [739.99, 880.0, 987.77, 880.0, 739.99, 659.25, 739.99, 880.0, 987.77, 1108.73, 987.77, 880.0, 739.99, 659.25, 739.99, 880.0],
          hasSubKick: true
        };
      case 'COSMIC_VOID':
        // World 4: The Cosmic Singularity (Progressive Celestial Space Opera)
        return {
          bpm: 136,
          bassWave: 'triangle',
          leadWave: 'sine',
          bassSeq: [61.74, 0, 61.74, 92.50, 73.42, 0, 110.0, 0, 82.41, 0, 82.41, 123.47, 92.50, 0, 110.0, 92.50],
          leadSeq: [493.88, 0, 554.37, 0, 587.33, 659.25, 0, 739.99, 0, 659.25, 587.33, 0, 554.37, 0, 493.88, 0],
          arpSeq:  [987.77, 0, 1108.73, 0, 1174.66, 0, 1318.51, 0, 1479.98, 0, 1318.51, 0, 1174.66, 0, 1108.73, 0],
          hasSubKick: true
        };
      case 'VALLEY':
      default:
        // World 1: Clay Valley (Upbeat, Whimsical, Organic Clay Odyssey)
        return {
          bpm: 120,
          bassWave: 'triangle',
          leadWave: 'square',
          bassSeq: [110, 0, 110, 130.8, 146.8, 0, 164.8, 130.8, 110, 0, 110, 98, 110, 123.5, 130.8, 146.8],
          leadSeq: [440, 0, 523.25, 0, 587.33, 659.25, 0, 523.25, 440, 392, 440, 0, 523.25, 0, 659.25, 0],
          arpSeq:  [0, 523.25, 0, 659.25, 0, 783.99, 0, 1046.5, 0, 783.99, 0, 659.25, 0, 523.25, 0, 783.99],
          hasSubKick: false
        };
    }
  }

  startMusic() {
    this.stopMusic();
    if (!this.musicEnabled || !this.ctx) return;
    this.resume();

    this.musicStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Run high-frequency lookahead scheduler (25ms loop for sample-accurate scheduling)
    this.schedulerTimer = setInterval(() => {
      this.scheduleMusicLookahead();
    }, 25);
  }

  scheduleMusicLookahead() {
    if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;

    const track = this.getMusicTrack();
    const stepDuration = 60 / track.bpm / 4; // 16th notes
    const lookaheadTime = 0.12; // 120ms lookahead window

    while (this.nextNoteTime < this.ctx.currentTime + lookaheadTime) {
      this.scheduleMusicStep(track, this.musicStep, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.musicStep++;
    }
  }

  scheduleMusicStep(track, stepIndex, time, stepDuration) {
    const idx = stepIndex % 16;
    const bassFreq = track.bassSeq[idx];
    const leadFreq = track.leadSeq[idx];
    const arpFreq = track.arpSeq[idx];

    // 1. Bass Voice
    if (bassFreq > 0) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      const bFilter = this.ctx.createBiquadFilter();

      bOsc.type = track.bassWave;
      bOsc.frequency.setValueAtTime(bassFreq, time);

      bFilter.type = 'lowpass';
      bFilter.frequency.setValueAtTime(track.bassWave === 'sawtooth' ? 1400 : 750, time);
      bFilter.frequency.exponentialRampToValueAtTime(180, time + stepDuration * 0.9);

      bGain.gain.setValueAtTime(0.001, time);
      bGain.gain.linearRampToValueAtTime(this.isBossMusic ? 0.32 : 0.26, time + 0.008);
      bGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.95);

      bOsc.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(this.musicGain);

      bOsc.start(time);
      bOsc.stop(time + stepDuration);
    }

    // 2. Lead Melody Voice
    if (leadFreq > 0) {
      const lOsc = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();
      const lFilter = this.ctx.createBiquadFilter();

      lOsc.type = track.leadWave;
      lOsc.frequency.setValueAtTime(leadFreq, time);

      // Subtle warm filter so lead sounds soft and pleasing
      lFilter.type = 'lowpass';
      lFilter.frequency.setValueAtTime(track.leadWave === 'sawtooth' ? 2200 : 1600, time);

      lGain.gain.setValueAtTime(0.001, time);
      lGain.gain.linearRampToValueAtTime(this.isBossMusic ? 0.16 : 0.13, time + 0.012);
      lGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 1.4);

      lOsc.connect(lFilter);
      lFilter.connect(lGain);
      lGain.connect(this.musicGain);

      // Send subtle portion to stereo delay
      if (this.delayNode) {
        lGain.connect(this.delayNode);
      }

      lOsc.start(time);
      lOsc.stop(time + stepDuration * 1.45);
    }

    // 3. Arpeggiator / Harmonic Bell Voice
    if (arpFreq > 0 && Math.random() > 0.08) {
      const aOsc = this.ctx.createOscillator();
      const aGain = this.ctx.createGain();

      aOsc.type = 'sine';
      aOsc.frequency.setValueAtTime(arpFreq, time);

      aGain.gain.setValueAtTime(0.001, time);
      aGain.gain.linearRampToValueAtTime(this.isBossMusic ? 0.12 : 0.09, time + 0.005);
      aGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.8);

      aOsc.connect(aGain);
      aGain.connect(this.musicGain);

      if (this.delayNode) {
        aGain.connect(this.delayNode);
      }

      aOsc.start(time);
      aOsc.stop(time + stepDuration * 0.85);
    }

    // 4. Rhythm Section (Percussion: Kick, Snare, Hi-hats)
    if (idx === 0 || idx === 8) {
      // Punchy warm kick drum
      this.scheduleKick(time, track.hasSubKick || this.isBossMusic);
    }

    if (idx === 4 || idx === 12) {
      // Snare drum on 2 and 4
      this.scheduleSnare(time, this.isBossMusic);
    }

    if (idx % 2 === 0) {
      // Hi-hat groove
      const isAccent = (idx === 2 || idx === 6 || idx === 10 || idx === 14);
      this.scheduleHiHat(time, isAccent ? 0.06 : 0.03);
    }
  }

  scheduleKick(time, heavy = false) {
    if (!this.ctx || !this.musicEnabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 120 : 90, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(heavy ? 0.42 : 0.3, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  scheduleSnare(time, isBoss = false) {
    if (!this.ctx || !this.musicEnabled || !this.whiteNoiseBuffer) return;

    // 1. Noise snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(isBoss ? 0.16 : 0.11, time + 0.004);
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
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(70, time + 0.07);

    oscGain.gain.setValueAtTime(0.001, time);
    oscGain.gain.linearRampToValueAtTime(0.14, time + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  scheduleHiHat(time, volume = 0.04) {
    if (!this.ctx || !this.musicEnabled || !this.whiteNoiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  stopMusic() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }
}
