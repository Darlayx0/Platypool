// Soundtrack validator: compiles every track and checks structure, timing and harmony.
// Usage: node scripts/validate-music.js
import { compileTrack, trackDurations } from '../src/engine/music/Compiler.js';
import { TRACK_DEFS } from '../src/engine/music/Tracks.js';
import { PATCHES } from '../src/engine/music/Instruments.js';
import { parseChord, chordPitchClasses, midiToName } from '../src/engine/music/Theory.js';

const DRUM_PATCHES = new Set(['kick', 'kickSoft', 'kickPunch', 'kick808', 'kickHeavy', 'snare', 'snareTight', 'snareFat',
  'snareBrush', 'snareMarch', 'snareRock', 'clap', 'hat', 'openhat', 'shaker', 'ride', 'crash', 'tomHi', 'tomMid', 'tomLo',
  'taiko', 'timpani', 'gong', 'metal', 'triangle', 'conga', 'woodblock', 'rim', 'snap', 'swell']);

let errors = 0;
let totalWarnings = 0;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

for (const key of Object.keys(TRACK_DEFS)) {
  let tr;
  try {
    tr = compileTrack(TRACK_DEFS[key], key);
  } catch (e) {
    console.error(`✗ ${key}: ${e.message}`);
    errors++;
    continue;
  }
  const issues = [...tr.warnings];
  let events = 0;
  let clashes = 0;
  const layers = new Set();
  tr.bars.forEach((bar, bi) => {
    bar.grid.forEach((evs, si) => {
      if (!evs) return;
      for (const ev of evs) {
        events++;
        layers.add(ev.i);
        if (ev.dr ? !DRUM_PATCHES.has(ev.p) : !PATCHES[ev.p]) issues.push(`bar ${bi} step ${si}: unknown patch "${ev.p}"`);
        if (!ev.dr && ev.n) {
          for (const m of ev.n) if (m < 23 || m > 100) issues.push(`bar ${bi}: ${ev.i} note ${midiToName(m)} out of range`);
        }
        // Harmony check: sustained melody notes a semitone above a chord tone (b9 clash).
        if (ev.cs && ev.d >= 4 && ev.layer !== 'rage') {
          const pcs = chordPitchClasses(parseChord(ev.cs));
          for (const m of ev.n) {
            const pc = m % 12;
            if (!pcs.has(pc) && pcs.has((pc + 11) % 12)) {
              clashes++;
              issues.push(`bar ${bi} (${bar.section}) step ${si}: ${ev.i} ${midiToName(m)} clashes with ${ev.cs}`);
            }
          }
        }
      }
    });
  });
  const d = trackDurations(tr);
  const status = issues.length ? '⚠' : '✓';
  console.log(`${status} ${key.padEnd(17)} ${tr.name}`);
  console.log(`   ${tr.totalBars} bars, intro ${fmt(d.intro)}, unique loop ${fmt(d.body)}, ${events} events, layers: ${[...layers].join(',')}`);
  if (clashes) console.log(`   harmony clashes: ${clashes}`);
  issues.slice(0, 12).forEach(w => console.log(`   - ${w}`));
  if (issues.length > 12) console.log(`   ... ${issues.length - 12} more`);
  totalWarnings += issues.length;
}

console.log(`\n${errors} error(s), ${totalWarnings} warning(s)`);
process.exit(errors ? 1 : 0);
