// Procedural instrument library for the soundtrack (pure Web Audio, no samples).
// Every patch renders one note or chord into a mixer-strip input node.

import { midiToFreq } from './Theory.js';

// --------------------------------------------------------------------------
// Patch definitions
//   kind 'sub' : subtractive (osc stack -> filter/formants -> amp)
//   kind 'fm'  : 2-operator FM (+ optional tine partial)
//   kind 'add' : additive partials with per-partial decay
// Envelope: a (attack), d (decay), s (sustain 0..1), r (release) in seconds.
// --------------------------------------------------------------------------
export const PATCHES = {
  // ---------------- LEADS ----------------
  sawLead: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -7 }, { t: 'sawtooth', det: 7 }, { t: 'square', ratio: 0.5, g: 0.22 }],
    cutoff: 2300, kt: 0.35, q: 1.1, fenv: { amt: 2400, a: 0.01, d: 0.28, s: 0.35 },
    a: 0.008, d: 0.3, s: 0.78, r: 0.2, gain: 0.11, vib: { rate: 5.4, depth: 11, delay: 0.2 }, glide: 0.07
  },
  neonLead: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -10 }, { t: 'sawtooth', det: 10 }, { t: 'sawtooth', ratio: 2, det: 3, g: 0.18 }],
    cutoff: 1900, kt: 0.4, q: 3.2, fenv: { amt: 3200, a: 0.004, d: 0.22, s: 0.3 },
    a: 0.005, d: 0.25, s: 0.75, r: 0.22, gain: 0.095, vib: { rate: 5.8, depth: 14, delay: 0.22 }, glide: 0.06
  },
  squareLead: {
    kind: 'sub', osc: [{ t: 'square', det: -4 }, { t: 'square', det: 4, g: 0.55 }],
    cutoff: 2100, kt: 0.3, q: 1.8, fenv: { amt: 1800, a: 0.005, d: 0.2, s: 0.3 },
    a: 0.005, d: 0.25, s: 0.65, r: 0.14, gain: 0.075, vib: { rate: 5.6, depth: 12, delay: 0.18 }, glide: 0.05
  },
  superSaw: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -19 }, { t: 'sawtooth', det: -8 }, { t: 'sawtooth', det: 0 }, { t: 'sawtooth', det: 8 }, { t: 'sawtooth', det: 19 }],
    cutoff: 3000, kt: 0.25, q: 0.8, fenv: { amt: 2600, a: 0.02, d: 0.35, s: 0.45 },
    a: 0.012, d: 0.3, s: 0.8, r: 0.28, gain: 0.06, vib: { rate: 5.2, depth: 9, delay: 0.25 }, glide: 0.05
  },
  distLead: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -6 }, { t: 'square', det: 6, g: 0.6 }],
    cutoff: 2600, kt: 0.2, q: 1.4, drive: 3.5, fenv: { amt: 2000, a: 0.005, d: 0.2, s: 0.5 },
    a: 0.005, d: 0.2, s: 0.85, r: 0.15, gain: 0.07, vib: { rate: 6, depth: 16, delay: 0.16 }, glide: 0.05
  },
  flute: {
    kind: 'sub', osc: [{ t: 'sine' }, { t: 'triangle', ratio: 2, g: 0.1 }, { t: 'sine', ratio: 3, g: 0.04 }],
    cutoff: 4200, kt: 0, q: 0.5, a: 0.05, d: 0.2, s: 0.86, r: 0.16, gain: 0.19,
    vib: { rate: 5.1, depth: 15, delay: 0.22 }, noise: { gain: 0.045, freq: 2400, q: 1.4, d: 0.1 }, glide: 0.05
  },
  ocarina: {
    kind: 'sub', osc: [{ t: 'sine' }, { t: 'sine', ratio: 2, g: 0.05 }],
    cutoff: 3000, kt: 0, q: 0.5, a: 0.03, d: 0.15, s: 0.9, r: 0.14, gain: 0.22,
    vib: { rate: 4.8, depth: 12, delay: 0.25 }, noise: { gain: 0.03, freq: 1800, q: 1.2, d: 0.07 }, glide: 0.04
  },
  reed: {
    kind: 'sub', osc: [{ t: 'square' }, { t: 'sawtooth', det: 9, g: 0.45 }],
    cutoff: 1700, kt: 0.3, q: 2.2, fenv: { amt: 900, a: 0.03, d: 0.25, s: 0.5 },
    a: 0.03, d: 0.2, s: 0.82, r: 0.12, gain: 0.07, vib: { rate: 5.6, depth: 18, delay: 0.14 },
    noise: { gain: 0.025, freq: 1500, q: 1, d: 0.08 }, glide: 0.05
  },
  twang: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'square', det: 6, g: 0.35 }],
    cutoff: 1300, kt: 0.45, q: 3, fenv: { amt: 3400, a: 0.002, d: 0.16, s: 0.18 },
    a: 0.002, d: 0.7, s: 0.22, r: 0.25, gain: 0.105, pitch: { amt: -0.6, time: 0.04 },
    vib: { rate: 6.2, depth: 20, delay: 0.28 }, glide: 0.06
  },
  brass: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -5 }, { t: 'sawtooth', det: 5 }],
    cutoff: 650, kt: 0.5, q: 0.9, fenv: { amt: 2800, a: 0.07, d: 0.4, s: 0.45 },
    a: 0.045, d: 0.3, s: 0.82, r: 0.2, gain: 0.11, vib: { rate: 5, depth: 9, delay: 0.3 },
    pitch: { amt: -0.35, time: 0.05 }, glide: 0.06
  },
  brassSection: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -8 }, { t: 'sawtooth', det: 8 }],
    cutoff: 700, kt: 0.4, q: 0.8, fenv: { amt: 2600, a: 0.05, d: 0.3, s: 0.4 },
    a: 0.03, d: 0.25, s: 0.75, r: 0.18, gain: 0.075, hp: 160, pitch: { amt: -0.3, time: 0.04 }
  },
  horn: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'triangle', g: 0.8 }],
    cutoff: 520, kt: 0.5, q: 0.7, fenv: { amt: 1400, a: 0.12, d: 0.5, s: 0.5 },
    a: 0.09, d: 0.4, s: 0.85, r: 0.3, gain: 0.12, vib: { rate: 4.8, depth: 7, delay: 0.35 }, glide: 0.08
  },
  vox: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -5 }, { t: 'sawtooth', det: 5 }],
    formant: [{ f: 750, q: 6, g: 1 }, { f: 1180, q: 8, g: 0.6 }, { f: 2700, q: 10, g: 0.18 }],
    a: 0.09, d: 0.3, s: 0.9, r: 0.35, gain: 0.16, vib: { rate: 5, depth: 13, delay: 0.25 }, glide: 0.08
  },
  // ---------------- KEYS / MALLETS / PLUCKS ----------------
  piano: {
    kind: 'add', partials: [{ r: 1, g: 1, d: 2.6 }, { r: 2, g: 0.42, d: 1.4 }, { r: 3, g: 0.2, d: 0.8 }, { r: 4.02, g: 0.1, d: 0.45 }, { r: 5.03, g: 0.05, d: 0.3 }],
    a: 0.003, s: 0, r: 0.35, gain: 0.13, noise: { gain: 0.03, freq: 2500, q: 0.8, d: 0.03 }
  },
  rhodes: {
    kind: 'fm', ratio: 1, index: 1.5, idxSus: 0.25, idxDecay: 0.7, tine: { r: 7, g: 0.12, d: 0.06 },
    a: 0.003, d: 1.6, s: 0.28, r: 0.4, gain: 0.11, trem: { rate: 4.2, depth: 0.18 }
  },
  celesta: {
    kind: 'fm', ratio: 4, index: 1.8, idxSus: 0.1, idxDecay: 0.25,
    a: 0.002, d: 1.3, s: 0, r: 0.6, gain: 0.12
  },
  glassBell: {
    kind: 'fm', ratio: 2.76, index: 2.6, idxSus: 0.15, idxDecay: 0.6,
    a: 0.002, d: 2.4, s: 0, r: 1.0, gain: 0.08
  },
  kalimba: {
    kind: 'add', partials: [{ r: 1, g: 1, d: 0.9 }, { r: 5.92, g: 0.16, d: 0.1 }, { r: 2, g: 0.08, d: 0.3 }],
    a: 0.002, s: 0, r: 0.3, gain: 0.17
  },
  marimba: {
    kind: 'add', partials: [{ r: 1, g: 1, d: 0.55 }, { r: 3.99, g: 0.32, d: 0.12 }, { r: 10.1, g: 0.06, d: 0.035 }],
    a: 0.002, s: 0, r: 0.2, gain: 0.2
  },
  vibes: {
    kind: 'add', partials: [{ r: 1, g: 1, d: 1.8 }, { r: 4, g: 0.18, d: 0.35 }, { r: 10, g: 0.03, d: 0.08 }],
    a: 0.002, s: 0, r: 0.5, gain: 0.13, trem: { rate: 5.5, depth: 0.3 }
  },
  harp: {
    kind: 'sub', osc: [{ t: 'triangle' }, { t: 'sine', ratio: 2, g: 0.28 }],
    cutoff: 2600, kt: 0.3, q: 0.7, fenv: { amt: 2400, a: 0.002, d: 0.3, s: 0 },
    a: 0.002, d: 1.7, s: 0, r: 0.6, gain: 0.15
  },
  pluck: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'square', det: 5, g: 0.35 }],
    cutoff: 850, kt: 0.5, q: 1.5, fenv: { amt: 3400, a: 0.002, d: 0.14, s: 0 },
    a: 0.002, d: 0.45, s: 0, r: 0.2, gain: 0.09, hp: 140
  },
  pizz: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'triangle', g: 0.6 }],
    cutoff: 1100, kt: 0.5, q: 1, fenv: { amt: 1900, a: 0.002, d: 0.08, s: 0 },
    a: 0.003, d: 0.3, s: 0, r: 0.12, gain: 0.13
  },
  spiccato: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -7 }, { t: 'sawtooth', det: 7 }],
    cutoff: 1500, kt: 0.4, q: 0.9, fenv: { amt: 1600, a: 0.004, d: 0.1, s: 0.2 },
    a: 0.006, d: 0.12, s: 0.4, r: 0.08, gain: 0.095
  },
  organ: {
    kind: 'add', partials: [{ r: 0.5, g: 0.5 }, { r: 1, g: 1 }, { r: 2, g: 0.55 }, { r: 3, g: 0.3 }, { r: 4, g: 0.22 }, { r: 6, g: 0.1 }],
    a: 0.012, s: 1, r: 0.12, gain: 0.05, trem: { rate: 6.4, depth: 0.22 }, hp: 90
  },
  stabSynth: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -12 }, { t: 'sawtooth', det: 12 }],
    cutoff: 1100, kt: 0.3, q: 2.5, fenv: { amt: 3200, a: 0.002, d: 0.16, s: 0.1 },
    a: 0.003, d: 0.25, s: 0.2, r: 0.12, gain: 0.06, hp: 180
  },
  // ---------------- PADS ----------------
  warmPad: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -9 }, { t: 'sawtooth', det: 9 }, { t: 'triangle', ratio: 0.5, g: 0.45 }],
    cutoff: 1150, kt: 0.15, q: 0.6, fenv: { amt: 700, a: 0.7, d: 1.6, s: 0.5 },
    a: 0.5, d: 1.0, s: 0.85, r: 1.1, gain: 0.05, hp: 150
  },
  softPad: {
    kind: 'sub', osc: [{ t: 'triangle', det: -6 }, { t: 'sine', det: 6 }, { t: 'triangle', ratio: 2, g: 0.12 }],
    cutoff: 1700, kt: 0, q: 0.5, a: 0.9, d: 1, s: 0.9, r: 1.6, gain: 0.075, hp: 130
  },
  strings: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -11 }, { t: 'sawtooth', det: 0 }, { t: 'sawtooth', det: 11 }],
    cutoff: 2300, kt: 0.15, q: 0.5, a: 0.38, d: 0.6, s: 0.9, r: 0.9, gain: 0.04, hp: 170,
    vib: { rate: 5.2, depth: 8, delay: 0.35 }
  },
  tremStrings: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -10 }, { t: 'sawtooth', det: 10 }],
    cutoff: 2600, kt: 0.15, q: 0.5, a: 0.12, d: 0.4, s: 0.9, r: 0.4, gain: 0.05, hp: 170,
    trem: { rate: 11, depth: 0.7 }
  },
  choir: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -7 }, { t: 'sawtooth', det: 7 }],
    formant: [{ f: 700, q: 5, g: 1 }, { f: 1100, q: 7, g: 0.65 }, { f: 2600, q: 9, g: 0.22 }],
    a: 0.55, d: 0.6, s: 0.92, r: 1.3, gain: 0.085, vib: { rate: 4.8, depth: 10, delay: 0.4 }
  },
  glassPad: {
    kind: 'sub', osc: [{ t: 'sine' }, { t: 'triangle', ratio: 2, det: 6, g: 0.35 }, { t: 'sine', ratio: 3, det: -5, g: 0.14 }],
    cutoff: 3600, kt: 0, q: 0.5, a: 1.3, d: 1, s: 0.9, r: 2.2, gain: 0.065, hp: 160,
    vib: { rate: 0.35, depth: 9, delay: 0 }
  },
  synthPad: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -13 }, { t: 'sawtooth', det: 13 }, { t: 'square', ratio: 0.5, g: 0.25 }],
    cutoff: 850, kt: 0.1, q: 3, fenv: { amt: 2000, a: 0.9, d: 2.2, s: 0.4 },
    a: 0.25, d: 1, s: 0.9, r: 0.9, gain: 0.045, hp: 160
  },
  darkPad: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -14 }, { t: 'sawtooth', det: 14 }, { t: 'sine', ratio: 0.5, g: 0.4 }],
    cutoff: 700, kt: 0.1, q: 1.4, fenv: { amt: 500, a: 1.2, d: 2, s: 0.6 },
    a: 0.7, d: 1, s: 0.9, r: 1.5, gain: 0.05, hp: 120
  },
  brassPad: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -6 }, { t: 'sawtooth', det: 6 }],
    cutoff: 600, kt: 0.3, q: 0.7, fenv: { amt: 1500, a: 0.35, d: 0.8, s: 0.5 },
    a: 0.25, d: 0.5, s: 0.9, r: 0.6, gain: 0.055, hp: 150
  },
  // ---------------- BASS ----------------
  roundBass: {
    kind: 'sub', osc: [{ t: 'triangle' }, { t: 'sine', g: 0.6 }, { t: 'sawtooth', g: 0.1 }],
    cutoff: 560, kt: 0.3, q: 0.9, fenv: { amt: 900, a: 0.003, d: 0.12, s: 0.2 },
    a: 0.004, d: 0.4, s: 0.65, r: 0.08, gain: 0.25
  },
  slapBass: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'sine', g: 0.85 }],
    cutoff: 460, kt: 0.35, q: 3.2, fenv: { amt: 2400, a: 0.002, d: 0.07, s: 0.1 },
    a: 0.002, d: 0.25, s: 0.55, r: 0.06, gain: 0.19
  },
  synthBass: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'square', ratio: 0.5, g: 0.45 }],
    cutoff: 360, kt: 0.3, q: 5, fenv: { amt: 1900, a: 0.002, d: 0.13, s: 0.15 },
    a: 0.003, d: 0.2, s: 0.72, r: 0.05, gain: 0.16
  },
  subBass: {
    kind: 'sub', osc: [{ t: 'sine' }, { t: 'triangle', g: 0.16 }],
    cutoff: 420, kt: 0, q: 0.5, a: 0.02, d: 0.3, s: 1, r: 0.22, gain: 0.3
  },
  distBass: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -10 }, { t: 'sawtooth', det: 10 }, { t: 'sine', ratio: 0.5, g: 0.5 }],
    cutoff: 850, kt: 0.2, q: 2, drive: 4, fenv: { amt: 1300, a: 0.003, d: 0.12, s: 0.3 },
    a: 0.003, d: 0.2, s: 0.85, r: 0.06, gain: 0.12
  },
  brassBass: {
    kind: 'sub', osc: [{ t: 'sawtooth' }, { t: 'sine', g: 0.85 }],
    cutoff: 340, kt: 0.3, q: 0.8, fenv: { amt: 750, a: 0.03, d: 0.2, s: 0.5 },
    a: 0.025, d: 0.2, s: 0.8, r: 0.1, gain: 0.22
  },
  celloBass: {
    kind: 'sub', osc: [{ t: 'sawtooth', det: -6 }, { t: 'sawtooth', det: 6 }, { t: 'sine', g: 0.5 }],
    cutoff: 700, kt: 0.3, q: 0.8, fenv: { amt: 900, a: 0.005, d: 0.1, s: 0.3 },
    a: 0.006, d: 0.15, s: 0.55, r: 0.07, gain: 0.15
  },
  pickBass: {
    kind: 'sub', osc: [{ t: 'triangle' }, { t: 'sawtooth', g: 0.3 }],
    cutoff: 900, kt: 0.3, q: 1.2, fenv: { amt: 1400, a: 0.002, d: 0.06, s: 0.25 },
    a: 0.002, d: 0.35, s: 0.5, r: 0.07, gain: 0.22
  }
};

// Default mixer strip settings per layer (pan, reverb send, delay send).
export const LAYER_DEFAULTS = {
  lead: { pan: 0, rev: 0.34, dly: 0.32 },
  counter: { pan: -0.26, rev: 0.42, dly: 0.22 },
  riff: { pan: 0.18, rev: 0.3, dly: 0.08 },
  pad: { pan: 0, rev: 0.55, dly: 0 },
  comp: { pan: 0.2, rev: 0.34, dly: 0.1 },
  bass: { pan: 0, rev: 0.03, dly: 0 },
  arp: { pan: 0, rev: 0.38, dly: 0.28 },
  kick: { pan: 0, rev: 0.02, dly: 0 },
  snare: { pan: 0.04, rev: 0.2, dly: 0 },
  hat: { pan: 0.22, rev: 0.08, dly: 0 },
  perc: { pan: -0.24, rev: 0.24, dly: 0.04 },
  toms: { pan: 0, rev: 0.3, dly: 0 },
  cym: { pan: -0.1, rev: 0.32, dly: 0 }
};

const DRUM_KIT = {
  kick: { f0: 115, f1: 42, pt: 0.09, d: 0.32, click: 0.11, gain: 0.5 },
  kickSoft: { f0: 92, f1: 44, pt: 0.08, d: 0.26, click: 0.05, gain: 0.38 },
  kickPunch: { f0: 140, f1: 45, pt: 0.06, d: 0.24, click: 0.16, gain: 0.52 },
  kick808: { f0: 75, f1: 40, pt: 0.12, d: 0.85, click: 0.06, gain: 0.5 },
  kickHeavy: { f0: 160, f1: 38, pt: 0.08, d: 0.4, click: 0.2, gain: 0.56, drive: true },
  snare: { tone: 190, toneD: 0.07, nf: 1500, nd: 0.14, ng: 0.17, tg: 0.13 },
  snareTight: { tone: 230, toneD: 0.05, nf: 2200, nd: 0.09, ng: 0.15, tg: 0.1 },
  snareFat: { tone: 170, toneD: 0.11, nf: 1100, nd: 0.22, ng: 0.19, tg: 0.17 },
  snareBrush: { tone: 0, toneD: 0, nf: 900, nd: 0.16, ng: 0.09, tg: 0, brush: true },
  snareMarch: { tone: 260, toneD: 0.05, nf: 3000, nd: 0.18, ng: 0.17, tg: 0.09, q: 1.5 },
  snareRock: { tone: 200, toneD: 0.09, nf: 1300, nd: 0.2, ng: 0.2, tg: 0.16 }
};

function makeDriveCurve(k) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

export class MusicSynth {
  constructor(ctx, whiteNoise, pinkNoise) {
    this.ctx = ctx;
    this.white = whiteNoise;
    this.pink = pinkNoise;
    this.curves = {};
  }

  curve(k) {
    const key = k.toFixed(2);
    if (!this.curves[key]) this.curves[key] = makeDriveCurve(k);
    return this.curves[key];
  }

  /** Plays a melodic patch (single note or chord). Returns the voice end time. */
  play(patchName, out, t, notes, dur, vel, ev = {}) {
    const p = PATCHES[patchName];
    if (!p) return this.play('sawLead', out, t, notes, dur, vel, ev);
    let dest = out;
    if (ev.pan !== undefined && this.ctx.createStereoPanner) {
      const pn = this.ctx.createStereoPanner();
      pn.pan.setValueAtTime(ev.pan, t);
      pn.connect(out);
      dest = pn;
    }
    if (p.kind === 'fm') return this.fm(p, dest, t, notes, dur, vel, ev);
    if (p.kind === 'add') return this.additive(p, dest, t, notes, dur, vel, ev);
    return this.subtractive(p, dest, t, notes, dur, vel, ev);
  }

  ampEnv(param, p, t, gate, peak) {
    const A = Math.max(0.002, p.a);
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + A);
    if (p.s < 0.999) param.setTargetAtTime(Math.max(0.0001, peak * p.s), t + A, Math.max(0.01, (p.d || 0.3) / 3));
    param.setTargetAtTime(0.0001, t + gate, Math.max(0.008, (p.r || 0.1) / 4));
    const relEnd = t + gate + (p.r || 0.1) * 1.4 + 0.05;
    if (p.s < 0.02) return Math.min(relEnd, t + A + (p.d || 0.3) * 1.7 + 0.05);
    return relEnd;
  }

  subtractive(p, out, t, notes, dur, vel, ev) {
    const ac = this.ctx;
    const gate = Math.max(dur * (ev.g ?? 1), (p.a || 0.005) + 0.01);
    const norm = 1 / Math.sqrt(notes.length);
    const amp = ac.createGain();
    const end = this.ampEnv(amp.gain, p, t, gate, p.gain * vel * norm);

    // Filter stage
    let head;      // node oscillators feed into
    let tail;      // node feeding the amp
    const avgFreq = midiToFreq(notes.reduce((a, b) => a + b, 0) / notes.length);
    if (p.formant) {
      head = ac.createGain();
      tail = ac.createGain();
      for (const fm of p.formant) {
        const bp = ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(fm.f, t);
        bp.Q.setValueAtTime(fm.q, t);
        const g = ac.createGain();
        g.gain.setValueAtTime(fm.g * 2.2, t);
        head.connect(bp); bp.connect(g); g.connect(tail);
      }
    } else {
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      const kt = p.kt ? Math.pow(avgFreq / 261.6, p.kt) : 1;
      const base = Math.min(16000, p.cutoff * kt * (0.65 + 0.35 * vel));
      lp.Q.setValueAtTime(p.q || 0.7, t);
      if (p.fenv) {
        const fe = p.fenv;
        const peakF = Math.min(17000, base + fe.amt * (0.6 + 0.4 * vel));
        const susF = base + (peakF - base) * fe.s;
        lp.frequency.setValueAtTime(base, t);
        lp.frequency.linearRampToValueAtTime(peakF, t + Math.max(0.002, fe.a));
        lp.frequency.setTargetAtTime(susF, t + Math.max(0.002, fe.a), Math.max(0.01, fe.d / 3));
        lp.frequency.setTargetAtTime(base, t + gate, Math.max(0.01, (p.r || 0.1) / 3));
      } else {
        lp.frequency.setValueAtTime(base, t);
      }
      head = lp;
      tail = lp;
    }

    let post = tail;
    if (p.drive) {
      const ws = ac.createWaveShaper();
      ws.curve = this.curve(p.drive);
      ws.oversample = '2x';
      post.connect(ws);
      post = ws;
    }
    if (p.hp) {
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(p.hp, t);
      hp.Q.setValueAtTime(0.6, t);
      post.connect(hp);
      post = hp;
    }
    if (p.trem) {
      const tg = ac.createGain();
      tg.gain.setValueAtTime(1 - p.trem.depth / 2, t);
      const lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(p.trem.rate, t);
      const lg = ac.createGain();
      lg.gain.setValueAtTime(p.trem.depth / 2, t);
      lfo.connect(lg); lg.connect(tg.gain);
      lfo.start(t); lfo.stop(end);
      post.connect(tg);
      post = tg;
    }
    post.connect(amp);
    amp.connect(out);

    // Shared vibrato LFO
    let vibGain = null;
    if (p.vib && gate > p.vib.delay + 0.05) {
      const lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(p.vib.rate, t);
      vibGain = ac.createGain();
      vibGain.gain.setValueAtTime(0, t);
      if (p.vib.delay > 0) vibGain.gain.setValueAtTime(0, t + p.vib.delay);
      vibGain.gain.linearRampToValueAtTime(p.vib.depth, t + p.vib.delay + 0.3);
      lfo.connect(vibGain);
      lfo.start(t);
      lfo.stop(end);
    }

    const glideFrom = ev.gl !== undefined ? midiToFreq(ev.gl) : null;
    for (const midi of notes) {
      const f = midiToFreq(midi);
      for (const o of p.osc) {
        const osc = ac.createOscillator();
        osc.type = o.t;
        const ratio = o.ratio || 1;
        if (glideFrom && notes.length === 1) {
          osc.frequency.setValueAtTime(glideFrom * ratio, t);
          osc.frequency.exponentialRampToValueAtTime(f * ratio, t + (p.glide || 0.06));
        } else {
          osc.frequency.setValueAtTime(f * ratio, t);
        }
        if (o.det) osc.detune.setValueAtTime(o.det, t);
        if (p.pitch) {
          osc.detune.setValueAtTime((o.det || 0) + p.pitch.amt * 100, t);
          osc.detune.setTargetAtTime(o.det || 0, t, p.pitch.time / 3);
        }
        if (vibGain) vibGain.connect(osc.detune);
        if (o.g !== undefined && o.g !== 1) {
          const og = ac.createGain();
          og.gain.setValueAtTime(o.g, t);
          osc.connect(og); og.connect(head);
        } else {
          osc.connect(head);
        }
        osc.start(t);
        osc.stop(end);
      }
    }

    if (p.noise) this.noiseBurst(out, t, p.noise, vel * norm);
    return end;
  }

  fm(p, out, t, notes, dur, vel, ev) {
    const ac = this.ctx;
    const gate = Math.max(dur * (ev.g ?? 1), (p.a || 0.003) + 0.01);
    const norm = 1 / Math.sqrt(notes.length);
    const amp = ac.createGain();
    const end = this.ampEnv(amp.gain, p, t, gate, p.gain * vel * norm);
    let post = amp;
    if (p.trem) {
      const tg = ac.createGain();
      tg.gain.setValueAtTime(1 - p.trem.depth / 2, t);
      const lfo = ac.createOscillator();
      lfo.frequency.setValueAtTime(p.trem.rate, t);
      const lg = ac.createGain();
      lg.gain.setValueAtTime(p.trem.depth / 2, t);
      lfo.connect(lg); lg.connect(tg.gain);
      lfo.start(t); lfo.stop(end);
      amp.connect(tg);
      post = tg;
    }
    post.connect(out);

    for (const midi of notes) {
      const f = midiToFreq(midi);
      const car = ac.createOscillator();
      car.type = 'sine';
      car.frequency.setValueAtTime(f, t);
      const mod = ac.createOscillator();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(f * p.ratio, t);
      const mg = ac.createGain();
      const depth = p.index * f * p.ratio * (0.6 + 0.4 * vel);
      mg.gain.setValueAtTime(depth, t);
      mg.gain.setTargetAtTime(depth * (p.idxSus ?? 0.2), t, Math.max(0.01, p.idxDecay / 3));
      mod.connect(mg); mg.connect(car.frequency);
      car.connect(amp);
      car.start(t); mod.start(t);
      car.stop(end); mod.stop(end);

      if (p.tine) {
        const tn = ac.createOscillator();
        tn.type = 'sine';
        tn.frequency.setValueAtTime(f * p.tine.r, t);
        const tg = ac.createGain();
        tg.gain.setValueAtTime(0.0001, t);
        tg.gain.linearRampToValueAtTime(p.tine.g, t + 0.002);
        tg.gain.setTargetAtTime(0.0001, t + 0.003, p.tine.d / 3);
        tn.connect(tg); tg.connect(amp);
        tn.start(t); tn.stop(Math.min(end, t + p.tine.d * 3 + 0.05));
      }
    }
    return end;
  }

  additive(p, out, t, notes, dur, vel, ev) {
    const ac = this.ctx;
    const gate = Math.max(dur * (ev.g ?? 1), (p.a || 0.003) + 0.01);
    const norm = 1 / Math.sqrt(notes.length);
    const amp = ac.createGain();
    const maxD = Math.max(...p.partials.map(x => x.d || 0.5));
    const envP = Object.assign({}, p, { d: p.s < 0.02 ? maxD : (p.d || 0.3) });
    const end = this.ampEnv(amp.gain, envP, t, gate, p.gain * vel * norm);
    let post = amp;
    if (p.hp) {
      const hp = ac.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(p.hp, t);
      post.connect(hp);
      post = hp;
    }
    if (p.trem) {
      const tg = ac.createGain();
      tg.gain.setValueAtTime(1 - p.trem.depth / 2, t);
      const lfo = ac.createOscillator();
      lfo.frequency.setValueAtTime(p.trem.rate, t);
      const lg = ac.createGain();
      lg.gain.setValueAtTime(p.trem.depth / 2, t);
      lfo.connect(lg); lg.connect(tg.gain);
      lfo.start(t); lfo.stop(end);
      post.connect(tg);
      post = tg;
    }
    post.connect(out);

    for (const midi of notes) {
      const f = midiToFreq(midi);
      for (const pt of p.partials) {
        const pf = f * pt.r;
        if (pf > 16000) continue;
        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pf, t);
        const g = ac.createGain();
        if (p.s < 0.02 && pt.d) {
          g.gain.setValueAtTime(pt.g, t);
          g.gain.setTargetAtTime(0.0001, t + 0.002, pt.d / 3);
        } else {
          g.gain.setValueAtTime(pt.g, t);
        }
        osc.connect(g); g.connect(amp);
        osc.start(t);
        osc.stop(p.s < 0.02 && pt.d ? Math.min(end, t + pt.d * 2.2 + 0.05) : end);
      }
    }
    if (p.noise) this.noiseBurst(out, t, p.noise, vel * norm);
    return end;
  }

  noiseBurst(out, t, n, vel) {
    const ac = this.ctx;
    const src = ac.createBufferSource();
    src.buffer = this.white;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(n.freq, t);
    bp.Q.setValueAtTime(n.q || 1, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(n.gain * vel, t + 0.008);
    g.gain.setTargetAtTime(0.0001, t + 0.01, n.d / 3);
    src.connect(bp); bp.connect(g); g.connect(out);
    src.start(t, Math.random() * 1.5);
    src.stop(t + n.d * 2 + 0.05);
  }

  // ---------------------------------------------------------------------
  // DRUMS
  // ---------------------------------------------------------------------
  drum(name, out, t, vel, ev = {}, dur = 0.5) {
    const kit = DRUM_KIT[name];
    if (kit && name.startsWith('kick')) return this.kick(kit, out, t, vel);
    if (kit && name.startsWith('snare')) return this.snare(kit, out, t, vel);
    switch (name) {
      case 'clap': return this.clap(out, t, vel);
      case 'hat': return this.hat(out, t, vel, 0.04, 7600);
      case 'openhat': return this.hat(out, t, vel * 0.8, 0.28, 7000);
      case 'shaker': return this.shaker(out, t, vel);
      case 'ride': return this.ride(out, t, vel);
      case 'crash': return this.crash(out, t, vel);
      case 'tomHi': return this.tom(out, t, vel, 230, 165);
      case 'tomMid': return this.tom(out, t, vel, 165, 115);
      case 'tomLo': return this.tom(out, t, vel, 112, 72);
      case 'taiko': return this.taiko(out, t, vel);
      case 'timpani': return this.timpani(out, t, vel, ev.n || 43);
      case 'gong': return this.gong(out, t, vel);
      case 'metal': return this.metal(out, t, vel);
      case 'triangle': return this.triangle(out, t, vel);
      case 'conga': return this.conga(out, t, vel);
      case 'woodblock': return this.woodblock(out, t, vel);
      case 'rim': return this.rim(out, t, vel);
      case 'snap': return this.snap(out, t, vel);
      case 'swell': return this.swell(out, t, vel, dur);
      default: return t;
    }
  }

  env(g, t, peak, a, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(0.0001, t + a, d / 4);
  }

  noiseSrc(t, pink = false) {
    const src = this.ctx.createBufferSource();
    src.buffer = pink ? this.pink : this.white;
    src.start(t, Math.random() * 1.6);
    return src;
  }

  kick(k, out, t, vel) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(k.f0, t);
    osc.frequency.exponentialRampToValueAtTime(k.f1, t + k.pt);
    const g = ac.createGain();
    this.env(g, t, k.gain * vel, 0.003, k.d);
    let node = osc;
    if (k.drive) {
      const ws = ac.createWaveShaper();
      ws.curve = this.curve(2.2);
      osc.connect(ws);
      node = ws;
    }
    node.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + k.d * 1.3 + 0.05);

    const click = ac.createOscillator();
    click.type = 'triangle';
    click.frequency.setValueAtTime(1800, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.012);
    const cg = ac.createGain();
    this.env(cg, t, k.click * vel, 0.001, 0.016);
    click.connect(cg); cg.connect(out);
    click.start(t); click.stop(t + 0.03);
    return t + k.d * 1.3;
  }

  snare(s, out, t, vel) {
    const ac = this.ctx;
    if (s.tone) {
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(s.tone, t);
      osc.frequency.exponentialRampToValueAtTime(s.tone * 0.68, t + s.toneD);
      const g = ac.createGain();
      this.env(g, t, s.tg * vel, 0.002, s.toneD * 1.3);
      osc.connect(g); g.connect(out);
      osc.start(t); osc.stop(t + s.toneD * 2 + 0.03);
    }
    const n = this.noiseSrc(t);
    const f = ac.createBiquadFilter();
    if (s.brush) {
      f.type = 'bandpass';
      f.frequency.setValueAtTime(s.nf * 3, t);
      f.Q.setValueAtTime(0.6, t);
    } else {
      f.type = s.q ? 'bandpass' : 'highpass';
      f.frequency.setValueAtTime(s.nf, t);
      if (s.q) f.Q.setValueAtTime(s.q, t);
    }
    const g = ac.createGain();
    this.env(g, t, s.ng * vel, s.brush ? 0.012 : 0.002, s.nd);
    n.connect(f); f.connect(g); g.connect(out);
    n.stop(t + s.nd * 1.6 + 0.03);
    return t + s.nd * 1.6;
  }

  clap(out, t, vel) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1250, t);
    f.Q.setValueAtTime(1.1, t);
    const g = ac.createGain();
    const pk = 0.2 * vel;
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.011;
      g.gain.linearRampToValueAtTime(pk, tt + 0.001);
      g.gain.linearRampToValueAtTime(pk * 0.25, tt + 0.009);
    }
    g.gain.linearRampToValueAtTime(pk * 0.8, t + 0.035);
    g.gain.setTargetAtTime(0.0001, t + 0.036, 0.045);
    n.connect(f); f.connect(g); g.connect(out);
    n.stop(t + 0.3);
    return t + 0.3;
  }

  hat(out, t, vel, decay, freq) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(freq, t);
    const bp = ac.createBiquadFilter();
    bp.type = 'peaking';
    bp.frequency.setValueAtTime(10500, t);
    bp.gain.setValueAtTime(6, t);
    const g = ac.createGain();
    this.env(g, t, 0.075 * vel, 0.001, decay);
    n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
    n.stop(t + decay * 1.5 + 0.02);
    return t + decay * 1.5;
  }

  shaker(out, t, vel) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(6200, t);
    bp.Q.setValueAtTime(1.4, t);
    const g = ac.createGain();
    this.env(g, t, 0.06 * vel, 0.012, 0.06);
    n.connect(bp); bp.connect(g); g.connect(out);
    n.stop(t + 0.12);
    return t + 0.12;
  }

  ride(out, t, vel) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(5200, t);
    const g = ac.createGain();
    this.env(g, t, 0.04 * vel, 0.001, 0.55);
    n.connect(hp); hp.connect(g); g.connect(out);
    n.stop(t + 0.8);
    const ping = ac.createOscillator();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(3150, t);
    const pg = ac.createGain();
    this.env(pg, t, 0.022 * vel, 0.001, 0.5);
    ping.connect(pg); pg.connect(out);
    ping.start(t); ping.stop(t + 0.7);
    return t + 0.8;
  }

  crash(out, t, vel) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3800, t);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(14000, t);
    lp.frequency.setTargetAtTime(6000, t, 0.5);
    const g = ac.createGain();
    this.env(g, t, 0.11 * vel, 0.002, 1.8);
    n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    n.stop(t + 2.2);
    return t + 2.2;
  }

  tom(out, t, vel, f0, f1) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + 0.18);
    const g = ac.createGain();
    this.env(g, t, 0.3 * vel, 0.002, 0.34);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + 0.45);
    const n = this.noiseSrc(t, true);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f0 * 6, t);
    const ng = ac.createGain();
    this.env(ng, t, 0.06 * vel, 0.001, 0.06);
    n.connect(lp); lp.connect(ng); ng.connect(out);
    n.stop(t + 0.1);
    return t + 0.45;
  }

  taiko(out, t, vel) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(96, t);
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.25);
    const g = ac.createGain();
    this.env(g, t, 0.42 * vel, 0.003, 0.75);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + 0.95);
    const n = this.noiseSrc(t, true);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    const ng = ac.createGain();
    this.env(ng, t, 0.22 * vel, 0.002, 0.12);
    n.connect(lp); lp.connect(ng); ng.connect(out);
    n.stop(t + 0.2);
    return t + 0.95;
  }

  timpani(out, t, vel, midi) {
    const ac = this.ctx;
    const f = midiToFreq(midi);
    const g = ac.createGain();
    this.env(g, t, 0.3 * vel, 0.004, 1.5);
    g.connect(out);
    [[1, 1], [1.5, 0.35], [1.99, 0.18]].forEach(([r, amp]) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * r * 1.025, t);
      osc.frequency.exponentialRampToValueAtTime(f * r, t + 0.08);
      const og = ac.createGain();
      og.gain.setValueAtTime(amp, t);
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + 1.8);
    });
    const n = this.noiseSrc(t, true);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(700, t);
    const ng = ac.createGain();
    this.env(ng, t, 0.12 * vel, 0.002, 0.1);
    n.connect(lp); lp.connect(ng); ng.connect(out);
    n.stop(t + 0.15);
    return t + 1.8;
  }

  gong(out, t, vel) {
    const ac = this.ctx;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.13 * vel, t + 0.06);
    g.gain.setTargetAtTime(0.0001, t + 0.07, 1.1);
    g.connect(out);
    [1, 1.48, 2.15, 2.93, 3.71, 4.9].forEach((r, i) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(62 * r, t);
      osc.frequency.linearRampToValueAtTime(62 * r * 0.985, t + 3);
      const og = ac.createGain();
      og.gain.setValueAtTime(1 / (i + 1.3), t);
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + 4.5);
    });
    return t + 4.5;
  }

  metal(out, t, vel) {
    const ac = this.ctx;
    const g = ac.createGain();
    this.env(g, t, 0.1 * vel, 0.001, 0.28);
    g.connect(out);
    [1, 2.76, 5.4, 8.93].forEach((r, i) => {
      const osc = ac.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(520 * r, t);
      const og = ac.createGain();
      og.gain.setValueAtTime(1 / (i + 1), t);
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + 0.4);
    });
    const n = this.noiseSrc(t);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3000, t);
    const ng = ac.createGain();
    this.env(ng, t, 0.05 * vel, 0.001, 0.05);
    n.connect(hp); hp.connect(ng); ng.connect(out);
    n.stop(t + 0.08);
    return t + 0.4;
  }

  triangle(out, t, vel) {
    const ac = this.ctx;
    const g = ac.createGain();
    this.env(g, t, 0.045 * vel, 0.001, 1.3);
    g.connect(out);
    [1, 2.4, 3.9].forEach((r, i) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2480 * r, t);
      const og = ac.createGain();
      og.gain.setValueAtTime(1 / (i * 2 + 1), t);
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + 1.6);
    });
    return t + 1.6;
  }

  conga(out, t, vel) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.05);
    const g = ac.createGain();
    this.env(g, t, 0.16 * vel, 0.002, 0.18);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + 0.25);
    return t + 0.25;
  }

  woodblock(out, t, vel) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.03);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(820, t);
    bp.Q.setValueAtTime(3.5, t);
    const g = ac.createGain();
    this.env(g, t, 0.14 * vel, 0.001, 0.05);
    osc.connect(bp); bp.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + 0.08);
    return t + 0.08;
  }

  rim(out, t, vel) {
    const ac = this.ctx;
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1650, t);
    const g = ac.createGain();
    this.env(g, t, 0.09 * vel, 0.001, 0.03);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + 0.05);
    const n = this.noiseSrc(t);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3200, t);
    const ng = ac.createGain();
    this.env(ng, t, 0.06 * vel, 0.001, 0.025);
    n.connect(bp); bp.connect(ng); ng.connect(out);
    n.stop(t + 0.05);
    return t + 0.05;
  }

  snap(out, t, vel) {
    const ac = this.ctx;
    const n = this.noiseSrc(t);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, t);
    bp.Q.setValueAtTime(2, t);
    const g = ac.createGain();
    this.env(g, t, 0.14 * vel, 0.001, 0.05);
    n.connect(bp); bp.connect(g); g.connect(out);
    n.stop(t + 0.08);
    return t + 0.08;
  }

  swell(out, t, vel, dur) {
    const ac = this.ctx;
    const len = Math.max(0.4, dur);
    const n = this.noiseSrc(t);
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1200, t);
    hp.frequency.exponentialRampToValueAtTime(6000, t + len);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * vel, t + len - 0.02);
    g.gain.linearRampToValueAtTime(0.0001, t + len + 0.03);
    n.connect(hp); hp.connect(g); g.connect(out);
    n.stop(t + len + 0.05);
    return t + len + 0.05;
  }
}

/** Generates a lush, damped stereo reverb impulse response procedurally. */
export function createReverbIR(ctx, seconds = 2.6, decay = 2.4) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const ir = ctx.createBuffer(2, len, rate);
  const pre = Math.floor(rate * 0.014);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const tt = (i - pre) / rate;
      const env = Math.pow(1 - tt / seconds, decay) * Math.exp(-tt * 1.6);
      // Progressive high-frequency damping for a natural hall tail
      const damp = 0.85 - 0.75 * Math.min(1, tt / seconds);
      lp += damp * ((Math.random() * 2 - 1) - lp);
      data[i] = lp * env;
    }
    // Early reflections
    const refl = ch === 0 ? [0.019, 0.031, 0.047, 0.066] : [0.023, 0.037, 0.052, 0.071];
    refl.forEach((r, i) => {
      const idx = Math.floor(rate * r);
      if (idx < len) data[idx] += (0.5 - i * 0.09) * (ch === 0 ? 1 : -1);
    });
  }
  return ir;
}
