// Headless runtime test for the soundtrack engine using a mock Web Audio graph.
// Plays every track through its full timeline + loop point, exercises transitions,
// pause/resume, rage and stingers, and reports scheduling errors & voice density.
// Usage: node scripts/test-music-runtime.js
import { MusicEngine } from '../src/engine/music/MusicEngine.js';

let nodesCreated = 0;
let invalid = 0;
class Param {
  constructor(v = 0) { this.value = v; }
  check(...a) { for (const x of a) if (typeof x !== 'number' || !isFinite(x)) { invalid++; if (invalid < 6) console.error('Invalid AudioParam arg', a, new Error().stack.split('\n')[3]); } return this; }
  setValueAtTime(v, t) { return this.check(v, t); }
  linearRampToValueAtTime(v, t) { return this.check(v, t); }
  exponentialRampToValueAtTime(v, t) { if (v <= 0) { invalid++; console.error('exp ramp to <=0', v); } return this.check(v, t); }
  setTargetAtTime(v, t, c) { if (c <= 0) invalid++; return this.check(v, t, c); }
  cancelScheduledValues(t) { return this.check(t); }
}
class Node {
  constructor() { nodesCreated++; this.gain = new Param(1); this.frequency = new Param(440); this.detune = new Param(0); this.Q = new Param(1); this.pan = new Param(0); this.delayTime = new Param(0); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); }
  connect(n) { if (!n) { invalid++; console.error('connect(undefined)'); } return n; }
  disconnect() {}
  start(t) { if (!isFinite(t ?? 0)) invalid++; }
  stop(t) { if (!isFinite(t)) { invalid++; console.error('stop non-finite', t); } }
}
const ctx = {
  currentTime: 0, sampleRate: 8000, state: 'running',
  createGain: () => new Node(), createBiquadFilter: () => new Node(), createOscillator: () => new Node(),
  createBufferSource: () => new Node(), createStereoPanner: () => new Node(), createDelay: () => new Node(),
  createDynamicsCompressor: () => new Node(), createWaveShaper: () => new Node(), createConvolver: () => new Node(),
  createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) })
};
global.setInterval = () => 1;
global.clearInterval = () => {};
global.setTimeout = () => 0;

const engine = new MusicEngine(ctx, new Node(), {}, {});
const advance = (secs) => {
  const end = ctx.currentTime + secs;
  while (ctx.currentTime < end) { ctx.currentTime += 0.025; engine.tick(); }
};

let failures = 0;
for (const key of MusicEngine.listTracks()) {
  const before = nodesCreated;
  invalid = 0;
  engine.stop(0.01);
  advance(0.3);
  const deck = engine.play(key, { quantize: false, force: true });
  if (!deck) { console.error(`✗ ${key}: failed to start`); failures++; continue; }
  const info = engine.info(key);
  let peak = 0;
  const total = info.total + 6; // play past the loop point
  const end = ctx.currentTime + total;
  while (ctx.currentTime < end) {
    ctx.currentTime += 0.025;
    engine.tick();
    const live = engine.voiceEnds.filter(e => e > ctx.currentTime).length;
    peak = Math.max(peak, live);
  }
  const looped = deck.loops > 0;
  const ok = invalid === 0 && looped;
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${key.padEnd(17)} ${Math.round(total)}s simulated, looped=${looped}, peak voices=${peak}, nodes=${nodesCreated - before}, invalid=${invalid}`);
}

// Transition matrix
invalid = 0;
const seq = [
  ['MENU', {}], ['VALLEY', { quantize: true }], ['PAUSED', { quantize: false }], ['VALLEY', { startBar: 12, quantize: false, force: true }],
  ['DREADNOUGHT', { quantize: true }], ['RAGE'], ['OMEGA_COLOSSUS', { quantize: true }], ['OMEGA_CORE_SPAWN', { quantize: true }],
  ['VICTORY', { quantize: false, force: true }], ['GAMEOVER', { quantize: false, force: true }], ['MENU', { quantize: false }]
];
for (const [k, o] of seq) {
  if (k === 'RAGE') { engine.setRage(true); advance(3); engine.setRage(false); continue; }
  engine.play(k, o);
  advance(2.5);
  if (engine.currentKey() !== k) { console.error(`✗ transition to ${k} failed (current ${engine.currentKey()})`); failures++; }
}
engine.seek(5); advance(3); engine.resync();
console.log(`${invalid ? '✗' : '✓'} transition matrix (${seq.length} steps), decks alive=${engine.decks.length}, invalid=${invalid}`);
if (invalid) failures++;

console.log(failures ? `\n${failures} failure(s)` : '\nAll runtime checks passed');
process.exit(failures ? 1 : 0);
