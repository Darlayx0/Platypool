// Track compiler: turns compact, human-readable track definitions (sections, chord
// symbols, melodic phrases, rhythmic grids) into a flat per-bar/per-step event timeline
// that the Web Audio sequencer in Sound.js can schedule sample-accurately.
//
// See COMPOSING.md in this folder for the full authoring guide.

import {
  noteToMidi, midiToName, parseChord, voiceChord, bassMidi,
  chordToneAbove, thirdOf, seventhOf, fifthOf
} from './Theory.js';
import { BASS_PATTERNS, ARP_PATTERNS, COMP_PATTERNS, GROOVES, FILLS } from './Patterns.js';

/** Variant marker: V(a, b, c) -> value cycles a, b, c on each new occurrence of the section. */
export const V = (...variants) => ({ __v: variants });

/** Transposes every note name inside a phrase string by `semis` semitones. */
export function tp(phrase, semis) {
  return phrase.replace(/([A-G])(#|s|b)?(-?\d)/g, (m) => midiToName(noteToMidi(m) + semis));
}

/** Repeats a phrase/grid string n times. */
export function rep(str, n) {
  return Array.from({ length: n }, () => str).join(' ');
}

export function defineTrack(def) {
  def.__isTrack = true;
  return def;
}

// Default drum voice -> synth patch and mixer layer.
export const DRUM_DEFAULTS = {
  k: ['kick', 'kick'], s: ['snare', 'snare'], c: ['clap', 'snare'], rim: ['rim', 'snare'], sn: ['snap', 'perc'],
  h: ['hat', 'hat'], oh: ['openhat', 'hat'], sh: ['shaker', 'hat'], ride: ['ride', 'hat'],
  t1: ['tomHi', 'toms'], t2: ['tomMid', 'toms'], t3: ['tomLo', 'toms'], tk: ['taiko', 'toms'],
  tim: ['timpani', 'toms'], mt: ['metal', 'perc'], tri: ['triangle', 'perc'], cg: ['conga', 'perc'],
  wb: ['woodblock', 'perc'], cr: ['crash', 'cym'], gong: ['gong', 'cym'], sw: ['swell', 'cym']
};

const DRUM_VEL = { X: 1.0, x: 0.72, o: 0.4 };
const TOKEN_RE = /^(\[[^\]]+\]|[A-Ga-g](?:#|s|b)?-?\d|_|r)(?::(\d+(?:\.\d+)?))?([!?^>]*)$/;

/** Parses a melodic phrase: 'G4:2 E5:4! D5:1 C5 | _:4 [C5,E5]:8' */
export function parsePhrase(str, barSteps, label = 'phrase') {
  const events = [];
  const warnings = [];
  let pos = 0;
  let lastDur = 4;
  const tokens = str.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok === '|') {
      if (Math.abs(pos % barSteps) > 1e-6) warnings.push(`${label}: barline at step ${pos} is not on a bar boundary (bar = ${barSteps} steps)`);
      continue;
    }
    const m = TOKEN_RE.exec(tok);
    if (!m) throw new Error(`${label}: invalid token "${tok}"`);
    const dur = m[2] ? parseFloat(m[2]) : lastDur;
    lastDur = dur;
    const flags = m[3] || '';
    if (m[1] !== '_' && m[1] !== 'r') {
      const notes = m[1].startsWith('[')
        ? m[1].slice(1, -1).split(',').map(s => noteToMidi(s.trim()))
        : [noteToMidi(m[1])];
      events.push({
        s: pos,
        d: dur,
        n: notes,
        v: flags.includes('!') ? 1.0 : flags.includes('?') ? 0.58 : 0.8,
        g: flags.includes('^') ? 0.45 : 0.94,
        glide: flags.includes('>')
      });
    }
    pos += dur;
  }
  return { events, length: pos, warnings };
}

function parseGrid(str, steps, label) {
  const g = str.replace(/[\s|]/g, '');
  if (g.length !== steps) throw new Error(`${label}: grid "${str}" has ${g.length} steps, expected ${steps}`);
  const out = [];
  for (let i = 0; i < g.length; i++) {
    const ch = g[i];
    if (ch === '.' || ch === '-') continue;
    let d = 1;
    while (i + d < g.length && g[i + d] === '-') d++;
    out.push({ s: i, d, ch });
  }
  return out;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveVariants(value, occ) {
  if (value && typeof value === 'object') {
    if (Array.isArray(value.__v)) {
      return resolveVariants(value.__v[occ % value.__v.length], occ);
    }
    if (Array.isArray(value)) return value.map(v => resolveVariants(v, occ));
    const out = {};
    for (const k of Object.keys(value)) out[k] = resolveVariants(value[k], occ);
    return out;
  }
  return value;
}

function pickPerBar(value, barIdx) {
  if (Array.isArray(value)) return value[barIdx % value.length];
  return value;
}

function swingOffset(step, swing, shuffle) {
  if (step !== Math.floor(step)) return 0;
  let o = 0;
  if (swing && step % 2 === 1) o += swing;
  if (shuffle) {
    const r = step % 4;
    if (r === 2) o += shuffle * 2;
    else if (r === 1 || r === 3) o += shuffle;
  }
  return o;
}

function parseChordBars(chords, bars, prevLast, label) {
  if (!chords) {
    const c = prevLast || parseChord('C');
    return Array.from({ length: bars }, () => [c]);
  }
  const rawBars = chords.split('|').map(b => b.trim()).filter(b => b.length);
  const parsed = [];
  for (const rb of rawBars) {
    if (rb === '%') {
      parsed.push(parsed.length ? parsed[parsed.length - 1] : [prevLast || parseChord('C')]);
      continue;
    }
    try {
      parsed.push(rb.split(/\s+/).map(sym => parseChord(sym)));
    } catch (e) {
      throw new Error(`${label}: ${e.message}`);
    }
  }
  return Array.from({ length: bars }, (_, i) => parsed[i % parsed.length]);
}

/**
 * Compiles a track definition into a playable timeline.
 * Returns { key, name, bars, loopStart, totalBars, ... }.
 */
export function compileTrack(def, key = def.key || def.name) {
  const warnings = [];
  const trackSteps = def.steps || 16;
  const passes = def.passes || 2;
  const loopFrom = def.loopFrom || 0;
  const form = def.form || Object.keys(def.sections);
  const ranges = Object.assign({ pad: [52, 76], comp: [55, 79], arp: [62, 84], bass: 28 }, def.ranges || {});
  const mix = Object.assign({
    lead: 1, counter: 0.75, riff: 0.85, pad: 0.85, comp: 0.75, bass: 1, arp: 0.7,
    kick: 1, snare: 0.9, hat: 0.7, perc: 0.7, toms: 0.9, cym: 0.6,
    reverb: 0.26, delay: 0.16, delayBeats: 0.75, arpWidth: 1, humanize: 1
  }, def.mix || {});
  const inst = Object.assign({
    lead: 'sawLead', counter: 'flute', riff: 'brass', pad: 'warmPad', comp: 'rhodes', bass: 'roundBass', arp: 'pluck'
  }, def.inst || {});
  const kit = def.kit || {};
  const grooveLib = Object.assign({}, GROOVES, def.grooves || {});
  const fillLib = Object.assign({}, FILLS, def.fills || {});

  // 1. Timeline of section occurrences
  const order = [];
  for (let i = 0; i < loopFrom; i++) order.push(form[i]);
  for (let p = 0; p < passes; p++) for (let i = loopFrom; i < form.length; i++) order.push(form[i]);
  if (loopFrom >= form.length) {
    throw new Error(`${key}: loopFrom (${loopFrom}) must be smaller than form length (${form.length})`);
  }
  const occCount = {};
  const entries = order.map((name) => {
    const raw = def.sections[name];
    if (!raw) throw new Error(`${key}: form references unknown section "${name}"`);
    const occ = occCount[name] = (occCount[name] === undefined ? 0 : occCount[name] + 1);
    const spec = resolveVariants(raw, occ);
    return { name, occ, spec };
  });

  // 2. Bars with chord segments
  const bars = [];
  let prevLastChord = null;
  let loopStart = 0;
  entries.forEach((entry, ei) => {
    if (ei === loopFrom) loopStart = bars.length;
    const spec = entry.spec;
    const steps = spec.steps || trackSteps;
    const bpm = spec.bpm || def.bpm;
    const nBars = spec.bars || (spec.chords ? spec.chords.split('|').filter(b => b.trim()).length : 4);
    const chordBars = parseChordBars(spec.chords, nBars, prevLastChord, `${key}.${entry.name}`);
    entry.startBar = bars.length;
    entry.nBars = nBars;
    entry.steps = steps;
    for (let b = 0; b < nBars; b++) {
      const chordsInBar = chordBars[b];
      const segLen = steps / chordsInBar.length;
      const segs = chordsInBar.map((chord, i) => ({ chord, s: Math.round(i * segLen), len: 0 }));
      segs.forEach((sg, i) => { sg.len = (i + 1 < segs.length ? segs[i + 1].s : steps) - sg.s; });
      bars.push({
        entry, barInSection: b, steps, bpm, stepDur: 60 / bpm / 4, segs,
        grid: Array.from({ length: steps }, () => null)
      });
      prevLastChord = chordsInBar[chordsInBar.length - 1];
    }
  });

  // 3. Voice-led voicings (stateful across the whole timeline, wraps naturally into loop)
  let prevPad = null, prevComp = null, prevArp = null;
  for (const bar of bars) {
    const r = Object.assign({}, ranges, bar.entry.spec.ranges || {});
    for (const sg of bar.segs) {
      sg.pad = voiceChord(sg.chord, prevPad, r.pad[0], r.pad[1], 5);
      sg.comp = voiceChord(sg.chord, prevComp, r.comp[0], r.comp[1], 4);
      const arpBase = voiceChord(sg.chord, prevArp, r.arp[0], r.arp[0] + 13, 4);
      sg.arp = arpBase.concat(arpBase.map(n => n + 12));
      sg.bass = bassMidi(sg.chord, r.bass);
      prevPad = sg.pad; prevComp = sg.comp; prevArp = arpBase;
    }
  }

  const segAt = (bar, step) => {
    for (let i = bar.segs.length - 1; i >= 0; i--) if (step >= bar.segs[i].s) return bar.segs[i];
    return bar.segs[0];
  };
  const nextSegAfter = (barIdx, seg) => {
    const bar = bars[barIdx];
    const i = bar.segs.indexOf(seg);
    if (i + 1 < bar.segs.length) return bar.segs[i + 1];
    const nb = bars[(barIdx + 1) < bars.length ? barIdx + 1 : loopStart];
    return nb.segs[0];
  };

  const swing = def.swing || 0;
  const shuffle = def.shuffle || 0;

  const push = (barIdx, localStep, ev, humanAmt) => {
    const bar = bars[barIdx];
    if (!bar) return;
    const si = Math.floor(localStep + 1e-6);
    if (si < 0 || si >= bar.steps) return;
    const rng = bar.rng;
    const sw = swingOffset(localStep, bar.entry.spec.swing ?? swing, bar.entry.spec.shuffle ?? shuffle);
    const hum = humanAmt ? (rng() - 0.5) * humanAmt * mix.humanize : 0;
    ev.o = (localStep - si) + sw + hum;
    ev.v = Math.max(0.05, Math.min(1.25, ev.v * (bar.entry.spec.energy ?? 1) * (1 + (rng() - 0.5) * 0.08 * mix.humanize)));
    if (!bar.grid[si]) bar.grid[si] = [];
    bar.grid[si].push(ev);
  };

  bars.forEach((bar, bi) => { bar.rng = mulberry32(hashStr(`${key}:${bi}`)); });

  // 4. Events
  entries.forEach((entry) => {
    const spec = entry.spec;
    const steps = entry.steps;
    const lbl = `${key}.${entry.name}`;
    const instFor = (layer) => (spec.inst && spec.inst[layer]) || inst[layer];
    const shift = spec.shift || {};

    const placePhrase = (layer, phrase, flag) => {
      if (!phrase) return;
      const parsed = parsePhrase(phrase, steps, `${lbl}.${layer}`);
      parsed.warnings.forEach(w => warnings.push(w));
      const total = entry.nBars * steps;
      if (parsed.length > total + 1e-6) warnings.push(`${lbl}.${layer}: phrase is ${parsed.length} steps but section is ${total}`);
      let prevNote = null;
      for (const e of parsed.events) {
        if (e.s >= total) break;
        const barIdx = entry.startBar + Math.floor(e.s / steps);
        const notes = e.n.map(n => n + (shift[layer] || 0));
        const sgc = segAt(bars[barIdx], e.s % steps);
        push(barIdx, e.s % steps, {
          i: layer, p: instFor(layer), n: notes, d: Math.min(e.d, total - e.s), v: e.v, g: e.g,
          gl: e.glide && prevNote !== null ? prevNote : undefined, layer: flag, cs: sgc.chord.symbol
        }, 0.06);
        prevNote = notes[notes.length - 1];
      }
    };

    const placeChordGrid = (layer, value, lib, voicingKey, flag) => {
      if (!value) return;
      for (let b = 0; b < entry.nBars; b++) {
        const barIdx = entry.startBar + b;
        const bar = bars[barIdx];
        let g = pickPerBar(value, b);
        if (g === true) g = 'pad';
        if (!g) continue;
        if (lib[g]) g = lib[g];
        const hits = parseGrid(g, steps, `${lbl}.${layer}`);
        for (const h of hits) {
          let start = h.s;
          const end = h.s + h.d;
          while (start < end) {
            const sg = segAt(bar, start);
            const segEnd = Math.min(end, sg.s + sg.len);
            push(barIdx, start, {
              i: layer, p: instFor(layer), n: sg[voicingKey].slice(), d: segEnd - start,
              v: h.ch === 'X' ? 1 : 0.78, g: 1, layer: flag
            }, 0.03);
            start = segEnd;
          }
        }
      }
    };

    const placeBass = (value, flag) => {
      if (!value) return;
      for (let b = 0; b < entry.nBars; b++) {
        const barIdx = entry.startBar + b;
        const bar = bars[barIdx];
        let g = pickPerBar(value, b);
        if (!g) continue;
        if (BASS_PATTERNS[g]) g = BASS_PATTERNS[g];
        const hits = parseGrid(g, steps, `${lbl}.bass`);
        for (const h of hits) {
          const sg = segAt(bar, h.s);
          const ch = sg.chord;
          const r = sg.bass;
          let n = r, v = (h.s % 4 === 0) ? 1 : 0.84, gate = 0.92;
          switch (h.ch) {
            case 'R': n = r; break;
            case 'O': n = r + 12; break;
            case 'L': n = (r - 12 >= 23) ? r - 12 : r; break;
            case '5': n = chordToneAbove(ch, fifthOf(ch), r + 1); break;
            case '3': n = chordToneAbove(ch, thirdOf(ch), r + 1); break;
            case '7': n = chordToneAbove(ch, seventhOf(ch) % 12, r + 1); break;
            case 'b': { const t = nextSegAfter(barIdx, sg).bass; n = t - 1; if (n < r - 7) n += 12; break; }
            case 'a': { const t = nextSegAfter(barIdx, sg).bass; n = t + 1; if (n > r + 9) n -= 12; break; }
            case 'x': n = r; v = 0.34; gate = 0.22; break;
            default: throw new Error(`${lbl}.bass: unknown token "${h.ch}"`);
          }
          push(barIdx, h.s, { i: 'bass', p: instFor('bass'), n: [n], d: h.d, v, g: gate, layer: flag }, 0.02);
        }
      }
    };

    const placeArp = (value, flag) => {
      if (!value) return;
      for (let b = 0; b < entry.nBars; b++) {
        const barIdx = entry.startBar + b;
        const bar = bars[barIdx];
        let g = pickPerBar(value, b);
        if (!g) continue;
        if (ARP_PATTERNS[g]) g = ARP_PATTERNS[g];
        const hits = parseGrid(g, steps, `${lbl}.arp`);
        for (const h of hits) {
          const sg = segAt(bar, h.s);
          const tones = sg.arp;
          const idx = parseInt(h.ch, 36) - 1;
          if (isNaN(idx) || idx < 0) throw new Error(`${lbl}.arp: invalid token "${h.ch}"`);
          const n = tones[idx % tones.length] + 12 * Math.floor(idx / tones.length);
          push(barIdx, h.s, {
            i: 'arp', p: instFor('arp'), n: [n], d: h.d, v: (h.s % 4 === 0) ? 0.86 : 0.7, g: 0.9,
            pan: ((h.s % 2) ? 0.34 : -0.34) * mix.arpWidth, layer: flag
          }, 0.03);
        }
      }
    };

    const resolveGroove = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        const g = grooveLib[val];
        if (!g) throw new Error(`${lbl}: unknown groove "${val}"`);
        return g;
      }
      return Array.isArray(val) ? val : [val];
    };
    const resolveFill = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        const f = fillLib[val];
        if (!f) throw new Error(`${lbl}: unknown fill "${val}"`);
        return f;
      }
      return val;
    };

    const placeDrums = (grooveVal, fillVal, crash, flag) => {
      const groove = resolveGroove(grooveVal);
      const fill = resolveFill(fillVal);
      if (!groove && !fill && !crash) return;
      for (let b = 0; b < entry.nBars; b++) {
        const barIdx = entry.startBar + b;
        const bar = bars[barIdx];
        let pattern = groove ? Object.assign({}, groove[b % groove.length]) : {};
        if (fill && b === entry.nBars - 1) {
          if (fill._clear) pattern = {};
          for (const k of Object.keys(fill)) if (k !== '_clear') pattern[k] = fill[k];
        }
        if (crash && b === 0) {
          pattern.cr = (pattern.cr && pattern.cr.replace(/\s/g, '')[0] !== '.') ? pattern.cr : 'X' + '.'.repeat(steps - 1);
        }
        for (const voice of Object.keys(pattern)) {
          const def0 = DRUM_DEFAULTS[voice];
          if (!def0) throw new Error(`${lbl}: unknown drum voice "${voice}"`);
          const hits = parseGrid(pattern[voice], steps, `${lbl}.drums.${voice}`);
          for (const h of hits) {
            const sg = segAt(bar, h.s);
            let n;
            if (voice === 'tim') n = 40 + ((sg.chord.root - 40) % 12 + 12) % 12;
            push(barIdx, h.s, {
              i: def0[1], p: kit[voice] || def0[0], dr: voice, n, d: h.d,
              v: DRUM_VEL[h.ch] ?? 0.72, g: 1, layer: flag,
              barSteps: voice === 'sw' ? steps - h.s : undefined
            }, (voice === 'k' && h.s % 4 === 0) ? 0 : 0.025);
          }
        }
      }
    };

    placePhrase('lead', spec.lead);
    placePhrase('counter', spec.counter);
    placePhrase('riff', spec.riff);
    placeChordGrid('pad', spec.pad, COMP_PATTERNS, 'pad');
    placeChordGrid('comp', spec.comp, COMP_PATTERNS, 'comp');
    placeBass(spec.bass);
    placeArp(spec.arp);
    placeDrums(spec.drums, spec.fill, spec.crash);

    const rage = spec.rage !== undefined ? spec.rage : def.rage;
    if (rage) {
      placePhrase('riff', rage.riff, 'rage');
      placeArp(rage.arp, 'rage');
      placeChordGrid('comp', rage.comp, COMP_PATTERNS, 'comp', 'rage');
      placeDrums(rage.drums, null, false, 'rage');
    }

    // Section-level filter automation on the deck low-pass
    const first = bars[entry.startBar];
    if (first) {
      first.sectionStart = true;
      const f = spec.filter;
      if (Array.isArray(f)) first.filter = { from: f[0], to: f[1], bars: entry.nBars };
      else if (typeof f === 'number') first.filter = { from: null, to: f, bars: 0.5 };
      else first.filter = { from: null, to: 18000, bars: 0.5 };
    }
  });

  // Freeze bars (drop build-time fields)
  const outBars = bars.map(b => ({
    steps: b.steps, stepDur: b.stepDur, bpm: b.bpm, grid: b.grid,
    section: b.entry.name, sectionStart: Boolean(b.sectionStart), filter: b.filter || null
  }));

  return {
    key,
    name: def.name,
    bpm: def.bpm,
    steps: trackSteps,
    scale: def.scale,
    loop: def.loop !== false,
    loopStart,
    totalBars: outBars.length,
    bars: outBars,
    mix,
    priority: def.priority || 0,
    warnings
  };
}

/** Duration helpers used by the validator / jukebox. */
export function trackDurations(compiled) {
  let intro = 0, body = 0;
  compiled.bars.forEach((b, i) => {
    const d = b.steps * b.stepDur;
    if (i < compiled.loopStart) intro += d; else body += d;
  });
  return { intro, body, total: intro + body };
}
