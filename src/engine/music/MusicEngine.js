// Real-time soundtrack player: sample-accurate lookahead sequencer with dual-deck
// crossfading, bar-quantized transitions, adaptive "rage" layers, per-layer mixer
// strips, procedural hall reverb, tempo-synced delay and a glue compressor.

import { compileTrack, trackDurations } from './Compiler.js';
import { MusicSynth, LAYER_DEFAULTS, createReverbIR } from './Instruments.js';
import { TRACK_DEFS } from './Tracks.js';

const LAYERS = Object.keys(LAYER_DEFAULTS);
const LOOKAHEAD = 0.16;
const TICK_MS = 25;
const MAX_VOICES = 80;
const SHEDDABLE = new Set(['arp', 'hat', 'perc', 'comp', 'counter']);

export class MusicEngine {
  constructor(ctx, output, whiteNoise, pinkNoise) {
    this.ctx = ctx;
    this.output = output;
    this.synth = new MusicSynth(ctx, whiteNoise, pinkNoise);
    this.compiled = {};
    this.decks = [];
    this.current = null;
    this.timer = null;
    this.voiceEnds = [];
    this.rage = false;

    const t = ctx.currentTime;
    // Glue bus
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0.9, t);
    this.glue = ctx.createDynamicsCompressor();
    this.glue.threshold.setValueAtTime(-16, t);
    this.glue.knee.setValueAtTime(12, t);
    this.glue.ratio.setValueAtTime(2.6, t);
    this.glue.attack.setValueAtTime(0.012, t);
    this.glue.release.setValueAtTime(0.22, t);
    this.bus.connect(this.glue);
    this.glue.connect(output);

    // Hall reverb (procedural IR), high-passed input to keep the low end clean
    this.reverbIn = ctx.createGain();
    const revHp = ctx.createBiquadFilter();
    revHp.type = 'highpass';
    revHp.frequency.setValueAtTime(220, t);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = createReverbIR(ctx, 2.8, 2.2);
    this.reverbOut = ctx.createGain();
    this.reverbOut.gain.setValueAtTime(0.55, t);
    this.reverbIn.connect(revHp);
    revHp.connect(this.reverb);
    this.reverb.connect(this.reverbOut);
    this.reverbOut.connect(this.bus);

    // Tempo-synced stereo delay with damped feedback
    this.delayIn = ctx.createGain();
    this.delay = ctx.createDelay(2.0);
    this.delay.delayTime.setValueAtTime(0.36, t);
    this.delayFb = ctx.createGain();
    this.delayFb.gain.setValueAtTime(0.32, t);
    const dlyLp = ctx.createBiquadFilter();
    dlyLp.type = 'lowpass';
    dlyLp.frequency.setValueAtTime(3200, t);
    const dlyHp = ctx.createBiquadFilter();
    dlyHp.type = 'highpass';
    dlyHp.frequency.setValueAtTime(300, t);
    this.delayOut = ctx.createGain();
    this.delayOut.gain.setValueAtTime(0.5, t);
    this.delayIn.connect(this.delay);
    this.delay.connect(dlyLp);
    dlyLp.connect(dlyHp);
    dlyHp.connect(this.delayFb);
    this.delayFb.connect(this.delay);
    let dlyTail = dlyHp;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(0.35, t);
      dlyHp.connect(pan);
      dlyTail = pan;
    }
    dlyTail.connect(this.delayOut);
    this.delayOut.connect(this.bus);
    this.delayOut.connect(this.reverbIn);
  }

  static listTracks() {
    return Object.keys(TRACK_DEFS);
  }

  hasTrack(key) {
    return Boolean(TRACK_DEFS[key]);
  }

  getTrack(key) {
    if (!TRACK_DEFS[key]) return null;
    if (!this.compiled[key]) {
      try {
        this.compiled[key] = compileTrack(TRACK_DEFS[key], key);
      } catch (e) {
        console.error(`[Music] Failed to compile track ${key}:`, e);
        return null;
      }
    }
    return this.compiled[key];
  }

  /** Compiles every track ahead of time (call during idle to avoid hitches). */
  precompile() {
    for (const k of Object.keys(TRACK_DEFS)) this.getTrack(k);
  }

  isPlaying() {
    return Boolean(this.current && !this.current.ended);
  }

  currentKey() {
    return this.current ? this.current.key : null;
  }

  getPosition() {
    const d = this.current;
    if (!d) return { key: null, bar: 0 };
    return { key: d.key, bar: d.bar };
  }

  info(key = this.currentKey()) {
    const tr = key ? this.getTrack(key) : null;
    if (!tr) return null;
    return Object.assign({ key, name: tr.name, bars: tr.totalBars, loopStart: tr.loopStart }, trackDurations(tr));
  }

  createDeck(key, track, startTime, startBar) {
    const ac = this.ctx;
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, ac.currentTime);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(18000, ac.currentTime);
    filter.Q.setValueAtTime(0.5, ac.currentTime);
    filter.connect(out);
    out.connect(this.bus);

    const revGate = ac.createGain();
    revGate.gain.setValueAtTime(0.0001, ac.currentTime);
    revGate.connect(this.reverbIn);
    const dlyGate = ac.createGain();
    dlyGate.gain.setValueAtTime(0.0001, ac.currentTime);
    dlyGate.connect(this.delayIn);

    const mix = track.mix;
    const strips = {};
    for (const layer of LAYERS) {
      const d = LAYER_DEFAULTS[layer];
      const g = ac.createGain();
      g.gain.setValueAtTime(mix[layer] ?? 1, ac.currentTime);
      let node = g;
      if (d.pan && ac.createStereoPanner) {
        const p = ac.createStereoPanner();
        p.pan.setValueAtTime(d.pan, ac.currentTime);
        g.connect(p);
        node = p;
      }
      node.connect(filter);
      if (d.rev > 0) {
        const s = ac.createGain();
        s.gain.setValueAtTime(d.rev, ac.currentTime);
        node.connect(s);
        s.connect(revGate);
      }
      if (d.dly > 0) {
        const s = ac.createGain();
        s.gain.setValueAtTime(d.dly, ac.currentTime);
        node.connect(s);
        s.connect(dlyGate);
      }
      strips[layer] = g;
    }

    const bar = Math.max(0, Math.min(track.totalBars - 1, startBar | 0));
    return {
      key, track, out, filter, revGate, dlyGate, strips,
      revLevel: Math.min(2.5, (mix.reverb ?? 0.26) * 3.2),
      dlyLevel: Math.min(2, (mix.delay ?? 0.16) * 4),
      bar, step: 0, nextTime: startTime, startTime,
      stopAt: null, ended: false, stopping: false, seekBar: null,
      rage: this.rage ? 1 : 0, loops: 0
    };
  }

  rampDeck(deck, level, t, dur) {
    const pairs = [[deck.out.gain, 1], [deck.revGate.gain, deck.revLevel], [deck.dlyGate.gain, deck.dlyLevel]];
    for (const [param, full] of pairs) {
      const target = Math.max(0.0001, full * level);
      try {
        param.cancelScheduledValues(t);
        param.setValueAtTime(Math.max(0.0001, param.value), t);
        param.linearRampToValueAtTime(target, t + Math.max(0.01, dur));
      } catch (e) {
        param.setValueAtTime(target, t);
      }
    }
  }

  nextBarTime(deck) {
    const bar = deck.track.bars[deck.bar];
    if (!bar) return deck.nextTime;
    if (deck.step === 0) return deck.nextTime;
    return deck.nextTime + (bar.steps - deck.step) * bar.stepDur;
  }

  /**
   * Starts a track.
   * quantize: wait for the current track's next bar line (musical hand-off).
   * fadeIn / fadeOut: crossfade lengths in seconds. startBar: resume position.
   */
  play(key, { quantize = true, force = false, startBar = 0, fadeIn = null, fadeOut = null } = {}) {
    const track = this.getTrack(key);
    if (!track) return null;
    const cur = this.current;
    if (cur && cur.key === key && !cur.stopping && !cur.ended && !force) return cur;

    const ac = this.ctx;
    const now = ac.currentTime;
    let start = now + 0.06;
    const sync = Boolean(cur && quantize && !cur.ended && !cur.stopping);
    if (sync) {
      start = this.nextBarTime(cur);
      if (start < now + 0.05) start += cur.track.bars[cur.bar] ? cur.track.bars[cur.bar].steps * cur.track.bars[cur.bar].stepDur : 0;
      if (start - now > 3.0 || start < now + 0.04) start = now + 0.06;
    }
    const fin = fadeIn ?? (sync ? 0.03 : 0.5);
    const fout = fadeOut ?? (sync ? 0.45 : 0.5);

    for (const d of this.decks) {
      if (d.stopAt === null) {
        d.stopAt = start + fout;
        d.stopping = true;
        this.rampDeck(d, 0, start, fout);
      }
    }

    const deck = this.createDeck(key, track, start, startBar);
    this.rampDeck(deck, 1, start, fin);
    this.decks.push(deck);
    this.current = deck;

    const beats = track.mix.delayBeats ?? 0.75;
    const dt = Math.min(1.9, Math.max(0.05, beats * 60 / track.bpm));
    try {
      this.delay.delayTime.setTargetAtTime(dt, start, 0.05);
    } catch (e) {
      this.delay.delayTime.setValueAtTime(dt, start);
    }

    this.ensureTimer();
    return deck;
  }

  stop(fade = 0.4) {
    const now = this.ctx.currentTime;
    for (const d of this.decks) {
      if (d.stopAt === null || d.stopAt > now + fade) {
        d.stopAt = now + fade;
        d.stopping = true;
        this.rampDeck(d, 0, now, fade);
      }
    }
    this.current = null;
  }

  /** Jumps the current track to `bar` at its next bar line. */
  seek(bar) {
    if (!this.current) return;
    const total = this.current.track.totalBars;
    this.current.seekBar = ((bar | 0) % total + total) % total;
  }

  setRage(on) {
    this.rage = Boolean(on);
    if (this.current) this.current.rage = this.rage ? 1 : 0;
  }

  /** Called when the tab regains focus: skip missed time instead of bursting notes. */
  resync() {
    const now = this.ctx.currentTime;
    for (const d of this.decks) {
      if (!d.ended && d.nextTime < now - 0.2) {
        d.nextTime = now + 0.05;
        d.step = 0;
      }
    }
  }

  ensureTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    const ac = this.ctx;
    if (ac.state !== 'running') return;
    const now = ac.currentTime;
    const horizon = now + LOOKAHEAD;

    for (const d of this.decks) {
      if (!d.ended && d.nextTime < now - 0.25) {
        d.nextTime = now + 0.03;
        d.step = 0;
      }
      this.scheduleDeck(d, horizon);
    }

    const alive = [];
    for (const d of this.decks) {
      if ((d.stopAt !== null && now > d.stopAt + 0.15) || (d.ended && d !== this.current && d.stopAt === null)) {
        this.disposeDeck(d, now);
      } else {
        alive.push(d);
      }
    }
    this.decks = alive;
    if (this.voiceEnds.length > 64) this.voiceEnds = this.voiceEnds.filter(e => e > now);

    if (!this.decks.length && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  disposeDeck(d) {
    // Let reverb/release tails ring out, then free the graph.
    setTimeout(() => {
      try {
        d.out.disconnect();
        d.revGate.disconnect();
        d.dlyGate.disconnect();
      } catch (e) { /* already disconnected */ }
    }, 3500);
  }

  scheduleDeck(deck, horizon) {
    const track = deck.track;
    let guard = 0;
    while (!deck.ended && deck.nextTime < horizon && guard++ < 96) {
      if (deck.stopAt !== null && deck.nextTime >= deck.stopAt) {
        deck.ended = true;
        break;
      }
      if (deck.step === 0 && deck.seekBar !== null) {
        deck.bar = deck.seekBar;
        deck.seekBar = null;
      }
      const bar = track.bars[deck.bar];
      if (deck.step === 0) this.onBarStart(deck, bar, deck.nextTime);

      const evs = bar.grid[deck.step];
      if (evs) {
        for (let i = 0; i < evs.length; i++) this.playEvent(deck, evs[i], deck.nextTime, bar.stepDur);
      }

      deck.nextTime += bar.stepDur;
      deck.step++;
      if (deck.step >= bar.steps) {
        deck.step = 0;
        deck.bar++;
        if (deck.bar >= track.totalBars) {
          if (track.loop) {
            deck.bar = track.loopStart;
            deck.loops++;
          } else {
            deck.ended = true;
          }
        }
      }
    }
  }

  onBarStart(deck, bar, t) {
    const f = bar.filter;
    if (!f) return;
    const p = deck.filter.frequency;
    const barDur = bar.steps * bar.stepDur;
    try {
      p.cancelScheduledValues(t);
      if (f.from !== null && f.from !== undefined) {
        p.setValueAtTime(f.from, t);
        p.exponentialRampToValueAtTime(Math.max(60, f.to), t + Math.max(0.05, f.bars * barDur));
      } else {
        p.setTargetAtTime(Math.max(60, f.to), t, 0.12);
      }
    } catch (e) {
      p.setValueAtTime(f.to, t);
    }
  }

  playEvent(deck, ev, stepTime, stepDur) {
    let vel = ev.v;
    if (ev.layer === 'rage') {
      if (deck.rage < 0.01) return;
      vel *= deck.rage;
    }
    if (this.voiceEnds.length > MAX_VOICES && SHEDDABLE.has(ev.i) && vel < 0.8) {
      const now = this.ctx.currentTime;
      this.voiceEnds = this.voiceEnds.filter(e => e > now);
      if (this.voiceEnds.length > MAX_VOICES) return;
    }
    const strip = deck.strips[ev.i] || deck.strips.lead;
    const t = Math.max(this.ctx.currentTime + 0.002, stepTime + (ev.o || 0) * stepDur);
    let end;
    try {
      if (ev.dr) {
        end = this.synth.drum(ev.p, strip, t, vel, ev, (ev.barSteps || ev.d || 1) * stepDur);
      } else {
        end = this.synth.play(ev.p, strip, t, ev.n, ev.d * stepDur, vel, ev);
      }
    } catch (e) {
      end = t;
    }
    this.voiceEnds.push(end || t + 0.3);
  }
}
