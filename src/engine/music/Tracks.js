// =============================================================================
// PLATYPUS — ORIGINAL SOUNDTRACK
// All music is synthesized live (Web Audio). Each track is a compact score that
// the compiler (Compiler.js) expands into a long, varied, seamlessly looping
// arrangement. Phrase syntax: 'NOTE:steps' (16 steps = 1 bar), '_' = rest,
// '!' accent, '?' soft, '^' staccato, '>' glide. See COMPOSING.md.
//
// LEITMOTIF — "The Clay Motif": 5-1-2-3 (G C D E in C major), stated by the
// Main Menu, re-orchestrated for Pause, transposed for Victory, turned minor
// for Game Over and inverted for the Final Boss.
// =============================================================================

import { defineTrack, V, tp } from './Compiler.js';

// -----------------------------------------------------------------------------
// MAIN THEME material (C major)
// -----------------------------------------------------------------------------
const MENU_INTRO = 'Cmaj9 | Am9 | Fmaj9 | G13sus G7';
const MENU_A_CHORDS = 'Cmaj9 | Am9 | Fmaj9 | G9sus G7 | Cmaj9 | Em7 A7 | Dm9 | G13sus G7';
const MENU_A_LEAD =
  'G4:2 C5:2 D5:2 E5:6 G5:2 E5:2 | D5:4 C5:2 B4:2 C5:8 | A4:2 C5:2 E5:2 G5:6 A5:2 G5:2 | F5:4 E5:2 D5:2 B4:8 | ' +
  'G4:2 C5:2 D5:2 E5:6 G5:2 A5:2 | B5:4 G5:2 E5:2 C#5:2 E5:2 G5:4 | F5:4 E5:2 D5:2 A5:6 F5:2 | G5:6 F5:2 D5:4 B4:4';
const MENU_A_GUIDE = 'E4:16 | E4:16 | E4:16 | D4:8 D4:8 | E4:16 | D4:8 C#4:8 | C4:16 | B3:16';

const MENU_B_CHORDS = 'Fmaj9 | E7sus E7 | Am9 | Gm9 C9 | Fmaj9 | Bb13 | Em7 A7b9 | Dm9 G13sus';
const MENU_B_LEAD =
  'A5:6 G5:2 E5:4 C5:4 | D5:4 B4:4 G#4:8 | A4:2 B4:2 C5:2 E5:6 G5:4 | F5:6 D5:2 E5:4 Bb4:4 | ' +
  'A5:4 C6:4 G5:4 E5:4 | D6:6 C6:2 G5:4 F5:4 | G5:4 E5:4 C#5:4 Bb4:4 | A4:4 D5:2 E5:2 F5:4 G5:4';

const MENU_C_CHORDS = 'Abmaj7 | Bbadd9 | Cmaj9 | Cmaj9 | Abmaj7 | Bb9sus | Dm9 | G7sus G7';
const MENU_C_COUNTER = 'G5:8 C6:8 | D6:8 Bb5:8 | E6:16 | G5:16 | Eb6:8 C6:8 | C6:8 F6:8 | E6:8 D6:8 | C6:8 B5:8';

// -----------------------------------------------------------------------------
// GAME OVER material (A minor -> hopeful C major)
// -----------------------------------------------------------------------------
const GO_A_CHORDS = 'Am9 | Fmaj7 | Dm9 | E7sus E7 | Am9 | Fmaj9 | Dm7 G7 | Cmaj7';
const GO_A_LEAD =
  'E4:2 A4:2 B4:2 C5:6 E5:2 C5:2 | C5:4 B4:2 A4:2 E4:8 | F4:2 A4:2 C5:2 E5:6 D5:2 C5:2 | B4:8 G#4:8 | ' +
  'E4:2 A4:2 B4:2 C5:6 E5:2 G5:2 | A5:6 G5:2 E5:4 C5:4 | D5:4 F5:4 B4:4 D5:4 | E5:12 _:4';
const GO_A_GUIDE = 'C4:16 | A3:16 | C4:16 | D4:8 D4:8 | C4:16 | C4:16 | C4:8 B3:8 | B3:16';
const GO_B_CHORDS = 'Fmaj9 | G6 | Em7 | Am9 | Dm9 | G13sus G7 | Cmaj9 | E7sus E7';
const GO_B_LEAD =
  'A4:4 C5:4 G5:8 | B4:4 D5:4 E5:8 | G5:6 E5:2 D5:4 B4:4 | C5:4 B4:4 A4:8 | ' +
  'F5:4 E5:4 D5:4 A4:4 | C5:8 B4:8 | E5:4 G5:4 B5:4 D6:4 | B5:8 G#5:8';

// -----------------------------------------------------------------------------
// VICTORY material (Main theme lifted to D major)
// -----------------------------------------------------------------------------
const VIC_A_CHORDS = 'Dmaj9 | Bm9 | Gmaj9 | A9sus A7 | Dmaj9 | F#m7 B7 | Em9 | A13sus A7';
const VIC_B_CHORDS = 'Gmaj9 | F#7sus F#7 | Bm9 | Am9 D9 | Gmaj9 | C13 | F#m7 B7b9 | Em9 A13sus';

// -----------------------------------------------------------------------------
// WORLD 1 — VALLEY (G major, bright & organic)
// -----------------------------------------------------------------------------
const VAL_INTRO = 'Gmaj7 | Cadd9 | Gmaj7 | D7sus D7';
const VAL_A_CHORDS = 'Gmaj7 | Cadd9 | Em7 | D7sus D7 | Gmaj7 | Cmaj7 | Am7 | D7sus D7';
const VAL_A_LEAD =
  'D5:2 G5:2 F#5:2 G5:2 A5:4 B5:4 | G5:4 E5:2 D5:2 E5:8 | B4:2 D5:2 E5:2 G5:2 F#5:4 E5:4 | D5:8 C5:2 A4:2 F#4:4 | ' +
  'D5:2 G5:2 F#5:2 G5:2 A5:4 B5:4 | C6:4 B5:2 G5:2 E5:8 | A5:2 G5:2 E5:2 C5:2 D5:4 E5:4 | D5:8 F#5:4 A5:4';
const VAL_A_GUIDE = 'B3:16 | E4:16 | G4:16 | C4:8 C4:8 | B3:16 | B3:16 | C4:16 | C4:8 C4:8';
const VAL_B_CHORDS = 'Cmaj7 | Bm7 | Am7 | D9 | Cmaj7 | B7 | Em7 A7 | Am7 D7';
const VAL_B_LEAD =
  'E5:6 G5:2 B5:8 | A5:4 F#5:4 D5:8 | C5:4 E5:4 G5:4 A5:4 | F#5:6 E5:2 D5:8 | ' +
  'E5:6 G5:2 C6:8 | B5:4 A5:4 F#5:4 D#5:4 | E5:4 G5:4 C#5:4 E5:4 | C5:4 A4:4 F#4:4 A4:4';
const VAL_C_CHORDS = 'Ebmaj7 | F6 | Gmaj7 | Gmaj7 | Ebmaj7 | F6 | Gmaj7 | D7sus D7';
const VAL_C_COUNTER = 'Bb5:8 G5:8 | A5:8 C6:8 | B5:16 | D5:16 | Bb5:8 G5:8 | C6:8 A5:8 | B5:8 D6:8 | A5:8 F#5:8';

// -----------------------------------------------------------------------------
// WORLD 2 — CANYON (D Dorian / A Phrygian-dominant, desert western)
// -----------------------------------------------------------------------------
const CAN_INTRO = 'Dm9 | C | Bbmaj7 | A7sus A7';
const CAN_A_CHORDS = 'Dm9 | C | Bbmaj7 | A7sus A7 | Dm9 | C | Bbmaj7 | A7b9';
const CAN_A_LEAD =
  'D4:2 F4:2 A4:2 C5:4 A4:2 E5:4 | E5:6 D5:2 C5:4 G4:4 | F4:2 Bb4:2 D5:2 F5:6 E5:2 D5:2 | D5:8 C#5:4 E5:4 | ' +
  'A5:6 G5:2 F5:4 E5:4 | G5:6 E5:2 C5:8 | D5:4 F5:4 A5:8 | Bb5:4 A5:4 G5:4 C#5:4';
const CAN_A_GUIDE = 'F4:16 | E4:16 | D4:16 | E4:8 E4:8 | F4:16 | G4:16 | F4:16 | E4:16';
const CAN_B_CHORDS = 'Bbmaj7 | A7 | Gm9 | A7b9 | Bbmaj7 | A7 | Gm6 | A7sus A7';
const CAN_B_LEAD =
  'D5:4 F5:4 A5:8 | G5:4 F5:2 E5:2 C#5:8 | Bb4:4 D5:4 A5:8 | G5:4 Bb5:4 A5:8 | ' +
  'F5:4 D5:4 Bb4:8 | C#5:4 E5:4 G5:8 | E5:4 D5:4 Bb4:8 | A4:8 C#5:8';
const CAN_C_CHORDS = 'Dm | Dm | Bb | C | Dm | Dm | Bb | A7';
const R_DM = 'D4:2 D4:2 A4:2 D4:2 F4:2 D4:2 A4:2 C5:2';
const R_BB = 'D4:2 D4:2 F4:2 D4:2 Bb4:2 D4:2 F4:2 A4:2';
const R_C = 'C4:2 C4:2 G4:2 C4:2 E4:2 C4:2 G4:2 C5:2';
const R_A7 = 'A3:2 C#4:2 E4:2 G4:2 A4:2 G4:2 E4:2 C#4:2';
const CAN_C_RIFF = [R_DM, R_DM, R_BB, R_C, R_DM, R_DM, R_BB, R_A7].join(' | ');
const CAN_C_LEAD = 'A4:32 | F4:16 | G4:16 | A4:16 | D5:16 | D5:8 F5:8 | E5:16';

// -----------------------------------------------------------------------------
// WORLD 3 — CYBER NIGHT (A minor synthwave)
// -----------------------------------------------------------------------------
const CYB_INTRO = 'Am9 | Fmaj9 | Cmaj7 | G';
const CYB_A_CHORDS = 'Am9 | Fmaj9 | Cmaj7 | G | Am9 | Fmaj9 | Dm9 | E7sus E7';
const CYB_A_LEAD =
  'E5:4 A5:4 B5:2 C6:2 B5:4 | A5:6 G5:2 E5:8 | G5:4 E5:2 C5:2 D5:4 E5:4 | D5:6 B4:2 G4:8 | ' +
  'E5:4 A5:4 B5:2 C6:2 E6:4 | C6:6 A5:2 G5:8 | F5:4 E5:4 D5:4 A5:4 | A5:8 G#5:8';
const CYB_B_CHORDS = 'Fmaj7 | G | Em7 | Am7 | Fmaj7 | G | Dm7 | E7';
const CYB_B_LEAD =
  'C6:8 A5:8 | B5:8 D6:8 | G6:8 E6:4 D6:4 | E6:8 C6:8 | A5:4 C6:4 E6:8 | D6:4 B5:4 G5:8 | F5:4 A5:4 C6:8 | B5:8 G#5:8';
const CYB_C_CHORDS = 'Fmaj9 | Em7 | Dm9 | Am9 | Fmaj9 | Em7 | Dm9 | E7sus E7';

// -----------------------------------------------------------------------------
// WORLD 4 — COSMIC VOID (E Lydian, weightless)
// -----------------------------------------------------------------------------
const COS_INTRO = 'Emaj9 | F#/E | Emaj9 | F#/E';
const COS_A_CHORDS = 'Emaj9 | F#/E | D#m7 | C#m9 | Emaj9 | F#/E | Bmaj7 | C#m7 F#7sus';
const COS_A_LEAD =
  'B4:8 F#5:8 | A#5:12 G#5:4 | F#5:8 C#5:8 | D#5:8 E5:4 G#5:4 | B5:8 D#6:8 | C#6:8 A#5:8 | F#5:8 D#5:8 | E5:8 B4:4 C#5:4';
const COS_B_CHORDS = 'C#m9 | Bmaj7/D# | Emaj9 | F#/E | G#m7 | F#/A# | Bsus2 | F#7sus';
const COS_B_LEAD =
  'G#5:8 D#5:8 | F#5:8 A#5:8 | B5:16 | A#5:8 C#6:8 | D#6:8 B5:8 | C#6:8 F#5:8 | C#5:8 F#5:8 | E5:8 B4:8';
const COS_C_CHORDS = 'Cmaj7#11 | D/C | Emaj9 | Emaj9 | Cmaj7#11 | D/C | Bsus2 | F#7sus';
const COS_C_COUNTER = 'G5:8 B5:8 | A5:8 F#5:8 | G#5:16 | B5:16 | E6:8 B5:8 | F#6:8 D6:8 | C#6:16 | B5:16';

// -----------------------------------------------------------------------------
// BOSS 1 — IRON DREADNOUGHT (C minor military march)
// -----------------------------------------------------------------------------
const DRD_A_CHORDS = 'Cm | Cm | Ab | G | Cm | Cm | Fm | G7';
const DRD_A_LEAD =
  'C5:6 G4:2 C5:2 D5:2 Eb5:4 | D5:4 C5:2 Bb4:2 G4:8 | Ab4:6 C5:2 Eb5:4 F5:4 | D5:8 B4:8 | ' +
  'C5:6 G4:2 C5:2 D5:2 Eb5:4 | G5:8 Eb5:4 C5:4 | F5:4 Ab5:4 C6:4 Ab5:4 | G5:4 F5:4 D5:4 B4:4';
const DRD_B_CHORDS = 'Ab | Bb | Eb | Cm | Ab | Bb | Fm7 | G7sus G7';
const DRD_B_LEAD = 'C6:8 Ab5:8 | Bb5:8 D6:8 | Eb6:8 G5:8 | C6:16 | Eb6:8 C6:8 | D6:8 F6:8 | Eb6:8 C6:8 | C6:8 B5:8';

// -----------------------------------------------------------------------------
// BOSS 2 — GOLIATH ZEPPELIN (D Phrygian-dominant swashbuckler)
// -----------------------------------------------------------------------------
const GOL_A_CHORDS = 'D | Eb | D | Cm | Gm | Eb | Cm | D';
const GOL_A_LEAD =
  'D5:2 Eb5:2 F#5:2 G5:2 A5:6 F#5:2 | G5:4 Bb5:4 Eb5:8 | F#5:2 G5:2 A5:2 Bb5:2 A5:6 F#5:2 | G5:4 Eb5:4 C5:8 | ' +
  'D5:2 G5:2 Bb5:2 D6:2 C6:4 Bb5:4 | Bb5:6 G5:2 Eb5:8 | C5:4 Eb5:4 G5:4 Eb5:4 | F#5:8 D5:8';
const GOL_B_CHORDS = 'Gm | Cm | D | D | Gm | Eb | D | D';
const GOL_B_LEAD = 'G5:8 Bb5:8 | C6:8 G5:8 | A5:8 F#5:4 A5:4 | D5:16 | Bb5:8 D6:8 | Eb6:8 Bb5:8 | A5:4 C6:4 A5:4 D6:4 | F#5:16';

// -----------------------------------------------------------------------------
// BOSS 3 — LEVIATHAN TITAN (F# minor industrial)
// -----------------------------------------------------------------------------
const LEV_A_CHORDS = 'F#m | F#m | D | E | F#m | F#m | Bm | C#7';
const LEV_A_LEAD =
  'F#4:3 F#4:3 A4:2 C#5:4 B4:2 A4:2 | C#5:4 E5:4 F#5:8 | D5:3 D5:3 F#5:2 A5:4 F#5:2 E5:2 | G#5:8 E5:4 B4:4 | ' +
  'F#5:3 F#5:3 A5:2 C#6:4 B5:2 A5:2 | C#6:8 A5:8 | B5:4 D6:4 F#6:4 D6:4 | G#5:4 B5:4 F5:4 C#5:4';
const LEV_B_CHORDS = 'D | E | F#m | F#m | D | E | C#7sus C#7 | C#7';
const LEV_B_LEAD = 'A5:8 F#5:8 | G#5:8 B5:8 | C#6:16 | A5:8 F#5:8 | D6:8 A5:8 | B5:8 E6:8 | F#6:8 F6:8 | G#5:8 C#6:8';

// -----------------------------------------------------------------------------
// BOSS 4 — OMEGA COLOSSUS (Bb minor cosmic epic, phase 1)
// -----------------------------------------------------------------------------
const OMC_A_CHORDS = 'Bbm | Gb | Ebm | F | Bbm | Gb | Db | F7';
const OMC_A_LEAD = 'F5:8 Bb5:8 | Db6:8 Bb5:4 Gb5:4 | Gb5:8 Eb5:8 | F5:8 A5:8 | Bb5:8 Db6:8 | Bb5:8 Db6:4 Eb6:4 | F6:8 Db6:8 | C6:4 Eb6:4 A5:8';
const OMC_B_CHORDS = 'Gb | Ab | Fm | Bbm | Gb | Ab | F7sus | F7';
const OMC_B_LEAD = 'Bb5:16 | C6:8 Eb6:8 | F6:8 C6:8 | Db6:16 | Gb5:8 Bb5:8 | Ab5:8 C6:8 | Bb5:16 | A5:16';

// -----------------------------------------------------------------------------
// FINAL BOSS — OMEGA CORE SPAWN (leitmotif in minor, climbing a semitone)
// -----------------------------------------------------------------------------
const OCS_A_CHORDS = 'Bbm | Gb | Db | Ab | Bbm | Gb | Ebm | F';
const OCS_A_LEAD =
  'F5:2 Bb5:2 C6:2 Db6:6 F6:2 Db6:2 | C6:4 Bb5:2 Ab5:2 Bb5:8 | Ab5:2 Db6:2 F6:2 Eb6:6 Db6:2 C6:2 | C6:8 Eb6:8 | ' +
  'F5:2 Bb5:2 C6:2 Db6:6 F6:2 Gb6:2 | Gb6:6 F6:2 Db6:8 | Eb6:4 Gb6:4 Bb5:8 | A5:4 C6:4 F6:8';
const OCS_B_CHORDS = 'Bm | G | D | A | Bm | G | Em | F#';

// Shared grooves
const G = {
  valley: [{ k: 'X.....x...X.....', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.', wb: '..x.......x..x..', sh: 'oooooooooooooooo' }],
  canyon: [{ k: 'X.......X.x.....', c: '........X.......', sh: 'o.o.o.o.o.o.o.o.', cg: '..x..x.....x.x..' }],
  canyonDrive: [{ k: 'X..X..X.X..X..X.', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.', t3: '..............xx' }],
  cosmic: [{ k: 'X.........X.....', s: '........X.......', h: '..x...x...x...x.', tri: 'x...............' }],
  dread: [{ k: 'X.......X.......', s: 'X.ooX.o.X.ooXoXo', tim: 'X.......X.......' }],
  dreadB: [{ k: 'X.....X...X.....', s: '....X.......X...', tim: 'X...X...X...X...', h: 'x.x.x.x.x.x.x.x.' }],
  zeppelin: [{ k: 'X.....X...X.....', tk: 'X.......X...x.x.', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' }],
  colossus: [{ k: 'X...............', tk: 'X.......X.....x.', s: '........X.......', tim: 'X.......X.......' }],
  colossusB: [{ k: 'X.....X...X.....', tk: 'X...X...X...X...', s: '....X.......X...', h: 'x.x.x.x.x.x.x.x.' }],
  core: [{ k: 'X.....X...X..X..', s: '....X..o....X..o', h: 'xxxxxxxxxxxxxxxx', oh: '..............x.' }]
};

export const TRACK_DEFS = {
  // ===========================================================================
  // MAIN MENU — "Clay Odyssey" (identity theme)
  // ===========================================================================
  MENU: defineTrack({
    name: 'Clay Odyssey — Main Theme', bpm: 100, scale: 'C major', swing: 0.12,
    inst: { lead: 'ocarina', counter: 'horn', pad: 'warmPad', comp: 'rhodes', bass: 'pickBass', arp: 'kalimba' },
    kit: { k: 'kickSoft', s: 'snareBrush' },
    mix: { reverb: 0.3, delayBeats: 0.75, kick: 0.85 },
    form: ['intro', 'A', 'B', 'A', 'C'], loopFrom: 1, passes: 3,
    sections: {
      intro: { chords: MENU_INTRO, pad: 'pad', arp: 'sparkle', filter: [500, 9000], fill: { sw: 'X...............' }, energy: 0.85 },
      A: {
        chords: MENU_A_CHORDS, lead: MENU_A_LEAD, pad: 'pad', bass: 'pop', drums: 'softPop',
        counter: V(null, MENU_A_GUIDE, null),
        comp: V('charleston', 'push', 'push'),
        arp: V(null, 'sparkle', 'broken8'),
        inst: V({ lead: 'ocarina' }, { lead: 'flute' }, { lead: 'vibes' }),
        fill: V('snare', 'toms', 'snare'), crash: true
      },
      B: {
        chords: MENU_B_CHORDS, lead: MENU_B_LEAD, pad: 'pad', comp: 'push', bass: 'popPush', arp: 'broken8', drums: 'pop',
        inst: V({ lead: 'flute' }, { lead: 'squareLead' }, { lead: 'flute' }),
        counter: V(null, null, tp(MENU_B_LEAD, -12)), fill: 'toms', crash: true
      },
      C: {
        chords: MENU_C_CHORDS, counter: MENU_C_COUNTER, inst: { counter: 'celesta' },
        pad: 'pad', bass: 'twoFeel', arp: 'harp8', drums: 'sparse', filter: [1400, 16000], fill: 'build'
      }
    }
  }),

  // ===========================================================================
  // PAUSE — "Quiet Workshop" (main theme, re-orchestrated low intensity)
  // ===========================================================================
  PAUSED: defineTrack({
    name: 'Clay Odyssey — Quiet Workshop (Pause)', bpm: 72, scale: 'C major', swing: 0.18,
    inst: { lead: 'vibes', counter: 'kalimba', pad: 'softPad', comp: 'rhodes', bass: 'subBass', arp: 'celesta' },
    kit: { k: 'kickSoft', s: 'snareBrush' },
    mix: { reverb: 0.42, lead: 0.85, kick: 0.55, snare: 0.5, hat: 0.5, comp: 0.6, bass: 0.8 },
    form: ['A', 'B'], passes: 3,
    sections: {
      A: {
        chords: MENU_A_CHORDS, pad: 'pad', comp: 'charleston', bass: 'twoFeel', filter: 2800,
        lead: V(MENU_A_LEAD, null, MENU_A_LEAD),
        counter: V(null, MENU_A_LEAD, null),
        drums: V('none', 'sparse', 'none'),
        arp: V(null, 'twinkle', null)
      },
      B: {
        chords: MENU_B_CHORDS, pad: 'pad', comp: 'half', bass: 'twoFeel', filter: 2600,
        lead: V(tp(MENU_B_LEAD, -12), null, MENU_B_LEAD),
        counter: V(null, MENU_B_LEAD, null),
        drums: V('sparse', 'none', 'sparse'),
        arp: V('twinkle', null, null)
      }
    }
  }),

  // ===========================================================================
  // GAME OVER — "Clay Dust" (stinger -> reflective loop that turns hopeful)
  // ===========================================================================
  GAMEOVER: defineTrack({
    name: 'Clay Dust — Fallen Hero', bpm: 66, scale: 'A minor',
    inst: { lead: 'piano', counter: 'strings', pad: 'softPad', comp: 'piano', bass: 'subBass', arp: 'harp' },
    kit: { k: 'kickSoft', s: 'snareBrush' },
    mix: { reverb: 0.44, delayBeats: 0.5, lead: 1.1, kick: 0.6, snare: 0.5, bass: 0.8 },
    form: ['stinger', 'A', 'B'], loopFrom: 1, passes: 3,
    sections: {
      stinger: {
        bpm: 80, chords: 'Am | Fmaj7 E7 | Am | Am',
        lead: 'E5:4 D5:4 C5:4 B4:4 | A4:8 G#4:8 | A4:32', inst: { lead: 'brass' },
        pad: 'pad', bass: 'whole',
        drums: [{ tim: 'X...............', cr: 'X...............' }, { tim: 'X.......X.......' }, { gong: 'X...............' }, {}]
      },
      A: {
        chords: GO_A_CHORDS, lead: GO_A_LEAD, pad: 'pad', bass: 'twoFeel',
        counter: V(null, GO_A_GUIDE, GO_A_GUIDE),
        arp: V(null, null, 'up8'),
        drums: V('none', 'sparse', 'softPop'),
        inst: V({}, {}, { lead: 'horn' })
      },
      B: {
        chords: GO_B_CHORDS, lead: GO_B_LEAD, pad: 'pad', bass: 'twoFeel',
        comp: V(null, 'quarters', 'quarters'),
        arp: V('up8', null, 'up8'),
        drums: V('none', 'sparse', 'softPop'),
        inst: V({}, { lead: 'strings' }, {})
      }
    }
  }),

  // ===========================================================================
  // VICTORY — "Colossal Triumph" (fanfare -> anthem on the main theme, D major)
  // ===========================================================================
  VICTORY: defineTrack({
    name: 'Colossal Triumph — Victory Anthem', bpm: 128, scale: 'D major',
    inst: { lead: 'brass', counter: 'strings', pad: 'strings', comp: 'brassSection', bass: 'roundBass', arp: 'harp' },
    kit: { k: 'kickPunch', s: 'snareFat' },
    mix: { reverb: 0.32, delayBeats: 0.75 },
    form: ['fanfare', 'A', 'B'], loopFrom: 1, passes: 3,
    sections: {
      fanfare: {
        chords: 'D | G/D D | D',
        lead: 'A4:2 A4:2 A4:2 D5:6 F#5:2 E5:2 | D5:4 G5:4 F#5:4 A5:4 | D6:16!',
        pad: 'pad', comp: 'brassHits', bass: 'whole',
        drums: [{ tim: 'X.X.X.X.X...X...', cr: 'X...............' }, { s: 'XoXoXoXoXxXxXXXX' }, { cr: 'X...............', tim: 'X...............' }]
      },
      A: {
        chords: VIC_A_CHORDS, lead: tp(MENU_A_LEAD, 2), pad: 'pad', comp: 'stabs', bass: 'octave8', drums: 'pop', crash: true,
        arp: V('harp16', 'up16', 'harp16'),
        counter: V(null, tp(MENU_A_GUIDE, 2), tp(MENU_A_GUIDE, 2)),
        inst: V({ lead: 'brass' }, { lead: 'superSaw' }, { lead: 'brass' }),
        fill: 'snare'
      },
      B: {
        chords: VIC_B_CHORDS, lead: tp(MENU_B_LEAD, 2), pad: 'pad', comp: 'push', bass: 'pop', drums: 'pop', arp: 'broken8', crash: true,
        inst: V({ lead: 'horn' }, { lead: 'superSaw' }, { lead: 'brass' }),
        fill: V('toms', 'build', 'toms')
      }
    }
  }),

  // ===========================================================================
  // WORLD 1 — VALLEY "Clay Valley Picnic"
  // ===========================================================================
  VALLEY: defineTrack({
    name: 'Clay Valley Picnic (World 1)', bpm: 116, scale: 'G major', swing: 0.2,
    inst: { lead: 'flute', counter: 'strings', pad: 'softPad', comp: 'marimba', bass: 'pickBass', arp: 'kalimba' },
    kit: { k: 'kickSoft', s: 'snareTight' },
    grooves: { valley: G.valley },
    mix: { reverb: 0.26 },
    form: ['intro', 'A', 'B', 'A', 'C'], loopFrom: 1, passes: 3,
    sections: {
      intro: { chords: VAL_INTRO, comp: 'offbeat8', bass: 'twoFeel', drums: 'sparse', arp: 'sparkle', fill: 'snare', energy: 0.85 },
      A: {
        chords: VAL_A_CHORDS, lead: VAL_A_LEAD, comp: 'offbeat8', pad: 'pad', bass: 'shuffle', drums: 'valley', crash: true,
        inst: V({ lead: 'flute' }, { lead: 'ocarina' }, { lead: 'pizz' }),
        counter: V(null, VAL_A_GUIDE, VAL_A_GUIDE),
        arp: V(null, 'twinkle', 'sparkle'), fill: V('snare', 'toms', 'snare')
      },
      B: {
        chords: VAL_B_CHORDS, lead: VAL_B_LEAD, comp: 'skank', pad: 'pad', bass: 'walk', drums: 'funky', arp: 'broken8',
        inst: V({ lead: 'ocarina' }, { lead: 'flute' }, { lead: 'vibes' }), fill: 'toms'
      },
      C: {
        chords: VAL_C_CHORDS, counter: VAL_C_COUNTER, inst: { counter: 'ocarina' },
        pad: 'pad', comp: 'half', bass: 'twoFeel', drums: 'halfTime', arp: 'harp8', fill: 'build'
      }
    }
  }),

  // ===========================================================================
  // WORLD 2 — CANYON "Sunset Mesa Run"
  // ===========================================================================
  CANYON: defineTrack({
    name: 'Sunset Mesa Run (World 2)', bpm: 104, scale: 'D dorian', swing: 0.08,
    inst: { lead: 'twang', counter: 'horn', riff: 'spiccato', pad: 'strings', comp: 'harp', bass: 'pickBass', arp: 'pluck' },
    kit: { k: 'kick', s: 'snareRock' },
    grooves: { canyon: G.canyon, canyonDrive: G.canyonDrive },
    mix: { reverb: 0.34, delayBeats: 0.75, delay: 0.2 },
    form: ['intro', 'A', 'B', 'A', 'C'], loopFrom: 1, passes: 3,
    sections: {
      intro: { chords: CAN_INTRO, pad: 'pad', comp: 'charleston', bass: 'whole', drums: { sh: 'o.o.o.o.o.o.o.o.' }, filter: [700, 12000], fill: { sw: 'X...............' } },
      A: {
        chords: CAN_A_CHORDS, lead: CAN_A_LEAD, pad: 'pad', comp: 'charleston', bass: 'dub', drums: 'canyon', crash: true,
        inst: V({ lead: 'twang' }, { lead: 'reed' }, { lead: 'twang' }),
        counter: V(null, CAN_A_GUIDE, null),
        arp: V(null, null, 'broken8'), fill: 'toms'
      },
      B: {
        chords: CAN_B_CHORDS, lead: CAN_B_LEAD, pad: 'pad', comp: 'push', bass: 'synco', drums: 'canyon', arp: 'poly3',
        inst: V({ lead: 'reed' }, { lead: 'twang' }, { lead: 'reed' }), fill: 'tomsRoll'
      },
      C: {
        chords: CAN_C_CHORDS, lead: CAN_C_LEAD, riff: CAN_C_RIFF, pad: 'pad', bass: 'gallop', drums: 'canyonDrive',
        inst: V({ lead: 'horn' }, { lead: 'brass' }, { lead: 'horn' }), fill: 'build', crash: true
      }
    }
  }),

  // ===========================================================================
  // WORLD 3 — CYBER NIGHT "Neon Clay Boulevard"
  // ===========================================================================
  CYBER_NIGHT: defineTrack({
    name: 'Neon Clay Boulevard (World 3)', bpm: 122, scale: 'A minor',
    inst: { lead: 'neonLead', counter: 'superSaw', pad: 'synthPad', comp: 'stabSynth', bass: 'synthBass', arp: 'pluck' },
    kit: { k: 'kickPunch', s: 'snareFat' },
    mix: { reverb: 0.3, delayBeats: 0.75, delay: 0.22, arp: 0.6 },
    form: ['intro', 'A', 'B', 'A', 'C'], loopFrom: 1, passes: 3,
    sections: {
      intro: { chords: CYB_INTRO, pad: 'pad', arp: 'up16', bass: 'whole', filter: [350, 9000], drums: { h: '..x...x...x...x.' }, fill: 'build' },
      A: {
        chords: CYB_A_CHORDS, lead: CYB_A_LEAD, pad: 'pad', bass: 'octave8', arp: 'up16', drums: 'synthwave', crash: true,
        comp: V(null, 'offbeat8', 'stabs'),
        inst: V({ lead: 'neonLead' }, { lead: 'squareLead' }, { lead: 'neonLead' }),
        counter: V(null, null, tp(CYB_A_LEAD, -12)), fill: V('snare', 'build', 'snare')
      },
      B: {
        chords: CYB_B_CHORDS, lead: CYB_B_LEAD, inst: { lead: 'superSaw' }, pad: 'pad', comp: 'offbeat8',
        bass: 'octave16', arp: 'updown16', drums: 'fourFloor', crash: true, fill: 'snare'
      },
      C: {
        chords: CYB_C_CHORDS, pad: 'pad', arp: 'wave16', bass: 'whole', filter: [400, 9000],
        drums: { h: 'x.x.x.x.x.x.x.x.' }, fill: 'build',
        counter: V(null, CYB_B_LEAD, null), inst: { counter: 'glassBell' }
      }
    }
  }),

  // ===========================================================================
  // WORLD 4 — COSMIC VOID "Lullaby of the Singularity"
  // ===========================================================================
  COSMIC_VOID: defineTrack({
    name: 'Lullaby of the Singularity (World 4)', bpm: 88, scale: 'E lydian',
    inst: { lead: 'vox', counter: 'glassBell', pad: 'glassPad', comp: 'celesta', bass: 'subBass', arp: 'celesta' },
    kit: { k: 'kick808', s: 'snareFat' },
    grooves: { cosmic: G.cosmic },
    mix: { reverb: 0.5, delayBeats: 1.5, delay: 0.26, arp: 0.55 },
    ranges: { pad: [52, 79] },
    form: ['intro', 'A', 'B', 'A', 'C'], loopFrom: 1, passes: 3,
    sections: {
      intro: { chords: COS_INTRO, pad: 'pad', arp: 'twinkle', bass: 'whole', filter: [400, 12000], drums: 'ambient', fill: { sw: 'X...............' } },
      A: {
        chords: COS_A_CHORDS, lead: COS_A_LEAD, pad: 'pad', bass: 'halfTime', arp: 'sparkle', drums: 'cosmic', crash: true,
        inst: V({ lead: 'vox' }, { lead: 'flute' }, { lead: 'vox' }),
        counter: V(null, tp(COS_A_LEAD, 12), null)
      },
      B: {
        chords: COS_B_CHORDS, lead: COS_B_LEAD, pad: 'pad', bass: 'halfTime', arp: 'harp8', drums: 'cosmic', comp: 'half',
        inst: V({ lead: 'glassBell' }, { lead: 'vox' }, { lead: 'ocarina' }), fill: { sw: 'X...............' }
      },
      C: {
        chords: COS_C_CHORDS, counter: COS_C_COUNTER, pad: 'pad', inst: { pad: 'choir' },
        bass: 'whole', arp: 'harp8', drums: 'ambient', filter: [900, 14000]
      }
    }
  }),

  // ===========================================================================
  // BOSS 1 — "Iron Dreadnought March"
  // ===========================================================================
  DREADNOUGHT: defineTrack({
    name: 'Iron Dreadnought March (Boss 1)', bpm: 138, scale: 'C minor', priority: 1,
    inst: { lead: 'brass', counter: 'horn', pad: 'strings', comp: 'brassSection', bass: 'celloBass', arp: 'spiccato' },
    kit: { k: 'kickPunch', s: 'snareMarch' },
    grooves: { dread: G.dread, dreadB: G.dreadB },
    mix: { reverb: 0.3, kick: 1.05, snare: 0.95 },
    form: ['intro', 'A', 'B', 'C'], loopFrom: 1, passes: 3,
    rage: { arp: 'up16', drums: { tk: 'X..X..X.X..X..X.' } },
    sections: {
      intro: { chords: 'Cm | G', pad: 'pad', bass: 'roll8', drums: [{ s: 'XoXoXoXoXoXoXoXo', tim: 'X...............' }, { s: 'XoXoXoXoXxXxXXXX', tim: 'X...X...X.X.XXXX' }], filter: [600, 16000] },
      A: {
        chords: DRD_A_CHORDS, lead: DRD_A_LEAD, pad: 'pad', comp: 'brassHits', bass: 'march', drums: 'dread', crash: true,
        inst: V({ lead: 'brass' }, { lead: 'horn' }, { lead: 'distLead' }), fill: 'roll'
      },
      B: {
        chords: DRD_B_CHORDS, lead: DRD_B_LEAD, pad: 'pad', comp: 'pulse8', bass: 'gallop', drums: 'dreadB', crash: true,
        counter: V(null, tp(DRD_B_LEAD, -12), tp(DRD_B_LEAD, -12)), fill: 'toms'
      },
      C: { chords: 'Cm | Db | G | G', pad: 'pad', bass: 'pedal', arp: 'pulse16', drums: [{ tim: 'X.......X.......' }, { tim: 'X.......X.......' }, { tim: 'X...X...X...X...' }, { s: 'XoXoXoXoXxXxXXXX', tim: 'X.X.X.X.XXXXXXXX' }] }
    }
  }),

  // ===========================================================================
  // BOSS 2 — "Goliath Zeppelin Duel"
  // ===========================================================================
  GOLIATH_ZEPPELIN: defineTrack({
    name: 'Goliath Zeppelin Duel (Boss 2)', bpm: 146, scale: 'D phrygianDominant', priority: 1,
    inst: { lead: 'twang', counter: 'brass', pad: 'tremStrings', comp: 'pizz', bass: 'celloBass', arp: 'spiccato' },
    kit: { k: 'kick', s: 'snareRock' },
    grooves: { zeppelin: G.zeppelin },
    mix: { reverb: 0.32, delay: 0.14 },
    form: ['intro', 'A', 'B', 'C'], loopFrom: 1, passes: 3,
    rage: { arp: 'poly3x16', drums: { tk: 'X.X...X.X.X...X.' } },
    sections: {
      intro: { chords: 'D | Eb', pad: 'pad', bass: 'gallop', drums: [{ tk: 'X.......X.......' }, { tk: 'X...X...X.X.XXXX', s: '........XoXoXXXX' }], filter: [800, 16000] },
      A: {
        chords: GOL_A_CHORDS, lead: GOL_A_LEAD, pad: 'pad', comp: 'offbeat8', bass: 'gallop', drums: 'zeppelin', crash: true,
        inst: V({ lead: 'twang' }, { lead: 'distLead' }, { lead: 'twang' }), fill: 'toms'
      },
      B: {
        chords: GOL_B_CHORDS, lead: GOL_B_LEAD, inst: { lead: 'brass' }, pad: 'pad', comp: 'pulse8', bass: 'driving', drums: 'epic', crash: true,
        counter: V(null, tp(GOL_B_LEAD, -12), null), fill: 'tomsRoll'
      },
      C: { chords: 'D | Eb | D | Eb', pad: 'pad', bass: 'pedal', arp: 'poly3x16', drums: [{ tk: 'X.......X.......' }, { tk: 'X.......X...X...' }, { tk: 'X...X...X...X...' }, { tk: 'X.X.X.X.XXXXXXXX', s: '........XoXoXXXX' }] }
    }
  }),

  // ===========================================================================
  // BOSS 3 — "Leviathan Titan Showdown"
  // ===========================================================================
  LEVIATHAN_TITAN: defineTrack({
    name: 'Leviathan Titan Showdown (Boss 3)', bpm: 150, scale: 'F# minor', priority: 1,
    inst: { lead: 'distLead', counter: 'superSaw', pad: 'darkPad', comp: 'stabSynth', bass: 'distBass', arp: 'pluck' },
    kit: { k: 'kickHeavy', s: 'snareRock' },
    mix: { reverb: 0.24, delay: 0.12, bass: 0.95, kick: 1.05 },
    form: ['intro', 'A', 'B', 'C'], loopFrom: 1, passes: 3,
    rage: { arp: 'gate16', drums: { mt: '..x...x...x...x.', c: '....X.......X...' } },
    sections: {
      intro: { chords: 'F#m | F#m', pad: 'pad', bass: 'roll16', drums: [{ k: 'X...X...X...X...' }, { k: 'X.X.X.X.XXXXXXXX', sw: 'X...............' }], filter: [300, 16000] },
      A: {
        chords: LEV_A_CHORDS, lead: LEV_A_LEAD, pad: 'pad', comp: 'stabs', bass: 'driving', drums: 'industrial', crash: true,
        inst: V({ lead: 'distLead' }, { lead: 'neonLead' }, { lead: 'distLead' }), fill: 'snare'
      },
      B: {
        chords: LEV_B_CHORDS, lead: LEV_B_LEAD, inst: { lead: 'superSaw' }, pad: 'pad', comp: 'offbeat8', bass: 'roll8', arp: 'up16', drums: 'breakbeat', crash: true,
        counter: V(null, null, tp(LEV_B_LEAD, -12)), fill: 'build'
      },
      C: { chords: 'F#m | D | E | C#7', pad: 'pad', bass: 'whole', arp: 'up16', drums: 'halfTime', filter: [500, 14000], fill: 'build' }
    }
  }),

  // ===========================================================================
  // BOSS 4 — "Omega Colossus Apocalypse" (phase 1)
  // ===========================================================================
  OMEGA_COLOSSUS: defineTrack({
    name: 'Omega Colossus Apocalypse (Boss 4)', bpm: 140, scale: 'Bb minor', priority: 1,
    inst: { lead: 'brass', counter: 'vox', pad: 'choir', comp: 'organ', bass: 'brassBass', arp: 'spiccato' },
    kit: { k: 'kickHeavy', s: 'snareFat' },
    grooves: { colossus: G.colossus, colossusB: G.colossusB },
    mix: { reverb: 0.4, comp: 0.6 },
    form: ['intro', 'A', 'B', 'C'], loopFrom: 1, passes: 3,
    rage: { arp: 'pulse16', drums: { tk: 'X..X..X...X..X..', tim: 'X.......X.......' } },
    sections: {
      intro: { chords: 'Bbm | Bbm', pad: 'pad', comp: 'pad', bass: 'whole', drums: [{ gong: 'X...............' }, { tim: 'X...X...X.X.XXXX' }], filter: [500, 16000] },
      A: {
        chords: OMC_A_CHORDS, lead: OMC_A_LEAD, pad: 'pad', comp: 'half', bass: 'epic', drums: 'colossus', crash: true,
        inst: V({ lead: 'brass' }, { lead: 'horn' }, { lead: 'superSaw' }), fill: 'toms'
      },
      B: {
        chords: OMC_B_CHORDS, lead: OMC_B_LEAD, inst: { lead: 'vox' }, pad: 'pad', comp: 'quarters', bass: 'march', arp: 'up8', drums: 'colossusB', crash: true,
        counter: V(null, tp(OMC_B_LEAD, -12), null), fill: 'tomsRoll'
      },
      C: { chords: 'Bbm | Bbm | Gb | F', pad: 'pad', comp: 'pad', bass: 'whole', drums: [{ gong: 'X...............' }, {}, { tim: 'X.......X.......' }, { tim: 'X...X...X.X.XXXX', sw: 'X...............' }] }
    }
  }),

  // ===========================================================================
  // FINAL BOSS — "Singularity Overdrive" (phase 2 climax)
  // ===========================================================================
  OMEGA_CORE_SPAWN: defineTrack({
    name: 'Singularity Overdrive (Final Boss)', bpm: 164, scale: 'Bb minor', priority: 2,
    inst: { lead: 'superSaw', counter: 'vox', pad: 'choir', comp: 'stabSynth', bass: 'distBass', arp: 'pluck' },
    kit: { k: 'kickHeavy', s: 'snareFat' },
    grooves: { core: G.core },
    mix: { reverb: 0.3, delay: 0.14, arp: 0.6 },
    form: ['intro', 'A', 'B', 'C'], loopFrom: 1, passes: 3,
    rage: { arp: 'cascade16', drums: { tk: 'X...X...X...X...', mt: '..x...x...x...x.' } },
    sections: {
      intro: { chords: 'Bbm | Bbm', pad: 'pad', bass: 'roll16', arp: 'up16', drums: [{ k: 'X...X...X...X...' }, { k: 'X.X.X.X.XXXXXXXX', s: '........XoXoXXXX', sw: 'X...............' }], filter: [300, 16000] },
      A: {
        chords: OCS_A_CHORDS, lead: OCS_A_LEAD, pad: 'pad', comp: 'offbeat8', bass: 'octave8', arp: 'up16', drums: 'core', crash: true,
        inst: V({ lead: 'superSaw' }, { lead: 'distLead' }, { lead: 'superSaw' }), fill: 'snare'
      },
      B: {
        chords: OCS_B_CHORDS, lead: tp(OCS_A_LEAD, 1), pad: 'pad', comp: 'stabs', bass: 'roll8', arp: 'updown16', drums: 'industrial', crash: true,
        counter: V(tp(OCS_A_LEAD, -11), null, tp(OCS_A_LEAD, -11)), fill: 'build'
      },
      C: { chords: 'Gb | Ab | Bbm | Bbm', pad: 'pad', bass: 'whole', arp: 'wave16', drums: 'halfTime', filter: [600, 16000], fill: 'build' }
    }
  })
};
