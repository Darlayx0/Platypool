// Music theory primitives for the procedural soundtrack engine.
// Pure functions only (no Web Audio) so they can be unit-checked in Node.

const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NOTE_RE = /^([A-Ga-g])(#|s|b|bb|##)?(-?\d)$/;

/** 'C4' -> 60, 'F#3' -> 54, 'Bb2' -> 46, 'Cs5' -> 73 */
export function noteToMidi(name) {
  const m = NOTE_RE.exec(name);
  if (!m) throw new Error(`Invalid note name "${name}"`);
  let pc = LETTER[m[1].toUpperCase()];
  const acc = m[2] || '';
  if (acc === '#' || acc === 's') pc += 1;
  else if (acc === '##') pc += 2;
  else if (acc === 'b') pc -= 1;
  else if (acc === 'bb') pc -= 2;
  return pc + (parseInt(m[3], 10) + 1) * 12;
}

const SHARP_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export function midiToName(midi) {
  return SHARP_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Chord quality suffix -> intervals (semitones above root).
const CHORD_TABLE = {
  '': [0, 4, 7], 'maj': [0, 4, 7], 'M': [0, 4, 7],
  'm': [0, 3, 7], 'min': [0, 3, 7],
  '5': [0, 7],
  'dim': [0, 3, 6], 'dim7': [0, 3, 6, 9], 'm7b5': [0, 3, 6, 10],
  'aug': [0, 4, 8], '+': [0, 4, 8],
  'sus2': [0, 2, 7], 'sus4': [0, 5, 7], 'sus': [0, 5, 7],
  '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], '69': [0, 4, 7, 9, 14], 'm69': [0, 3, 7, 9, 14],
  '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'mMaj7': [0, 3, 7, 11],
  '7sus': [0, 5, 7, 10], '7sus4': [0, 5, 7, 10], '9sus': [0, 5, 7, 10, 14], '9sus4': [0, 5, 7, 10, 14],
  '13sus': [0, 5, 7, 10, 14, 21], '13sus4': [0, 5, 7, 10, 14, 21],
  'add9': [0, 4, 7, 14], 'madd9': [0, 3, 7, 14], 'sus2add11': [0, 2, 7, 17],
  '9': [0, 4, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14], 'm9': [0, 3, 7, 10, 14], 'mMaj9': [0, 3, 7, 11, 14],
  '11': [0, 7, 10, 14, 17], 'm11': [0, 3, 7, 10, 14, 17],
  'maj7#11': [0, 4, 7, 11, 18], 'maj9#11': [0, 4, 7, 11, 14, 18], 'add#11': [0, 4, 7, 18],
  '13': [0, 4, 7, 10, 14, 21], 'm13': [0, 3, 7, 10, 14, 21], 'maj13': [0, 4, 7, 11, 14, 21],
  '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15], '7#5': [0, 4, 8, 10], '7b13': [0, 4, 7, 10, 20],
  '7#11': [0, 4, 7, 10, 18], '7alt': [0, 4, 10, 13, 20], 'm7b9': [0, 3, 7, 10, 13],
  'mb6': [0, 3, 8], 'phryg': [0, 1, 7], 'quartal': [0, 5, 10, 15]
};

const CHORD_RE = /^([A-G])(#|b)?([^/]*)(?:\/([A-G])(#|b)?)?$/;

/** Parses 'Fmaj9#11', 'Dm7/G', 'Bb13sus' -> { root, bass, intervals, symbol } (pc 0-11). */
export function parseChord(symbol) {
  const m = CHORD_RE.exec(symbol.trim());
  if (!m) throw new Error(`Invalid chord symbol "${symbol}"`);
  const pcOf = (letter, acc) => (LETTER[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + 12) % 12;
  const root = pcOf(m[1], m[2]);
  const quality = m[3] || '';
  const intervals = CHORD_TABLE[quality];
  if (!intervals) throw new Error(`Unknown chord quality "${quality}" in "${symbol}"`);
  const bass = m[4] ? pcOf(m[4], m[5]) : root;
  return { root, bass, intervals, symbol };
}

/** Pitch classes contained in a chord. */
export function chordPitchClasses(chord) {
  const set = new Set(chord.intervals.map(i => (chord.root + i) % 12));
  set.add(chord.bass);
  return set;
}

/**
 * Voice-led close voicing inside [lo, hi].
 * Drops the 5th, then the root, when the chord has more tones than maxNotes,
 * and spreads any minor-2nd clusters to keep the pad transparent (no mud).
 */
export function voiceChord(chord, prev, lo = 52, hi = 76, maxNotes = 5) {
  let ivs = chord.intervals.slice();
  if (ivs.length > maxNotes) ivs = ivs.filter(i => i !== 7);
  if (ivs.length > maxNotes) ivs = ivs.filter(i => i !== 0);
  if (ivs.length > maxNotes) ivs = ivs.slice(0, maxNotes);

  const mid = (lo + hi) / 2;
  let center = mid;
  if (prev && prev.length) {
    const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
    center = avg * 0.7 + mid * 0.3;
  }

  const notes = [];
  for (const iv of ivs) {
    const pc = (chord.root + iv) % 12;
    let best = null;
    for (let m = lo - ((lo - pc) % 12 + 12) % 12; m <= hi + 12; m += 12) {
      if (m < lo || m > hi) continue;
      if (best === null || Math.abs(m - center) < Math.abs(best - center)) best = m;
    }
    if (best === null) best = lo + ((pc - lo) % 12 + 12) % 12;
    if (!notes.includes(best)) notes.push(best);
  }
  notes.sort((a, b) => a - b);

  // Spread minor-2nd clusters (two passes are enough for 5-6 tones).
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < notes.length; i++) {
      if (notes[i] - notes[i - 1] === 1) {
        if (notes[i] + 12 <= hi + 5 && !notes.includes(notes[i] + 12)) notes[i] += 12;
        else if (notes[i - 1] - 12 >= lo - 5 && !notes.includes(notes[i - 1] - 12)) notes[i - 1] -= 12;
        notes.sort((a, b) => a - b);
      }
    }
  }
  return notes;
}

/** Bass note for the chord (honours slash bass) placed in [lo, lo+11]. */
export function bassMidi(chord, lo = 28) {
  return lo + ((chord.bass - lo) % 12 + 12) % 12;
}

/** Midi pitch of chord interval `iv` placed at or above `floor`. */
export function chordToneAbove(chord, iv, floor) {
  const pc = (chord.root + iv) % 12;
  return floor + ((pc - floor) % 12 + 12) % 12;
}

export function thirdOf(chord) {
  const iv = chord.intervals;
  if (iv.includes(4)) return 4;
  if (iv.includes(3)) return 3;
  if (iv.includes(5)) return 5;
  if (iv.includes(2)) return 2;
  return 7;
}

export function seventhOf(chord) {
  const iv = chord.intervals;
  if (iv.includes(10)) return 10;
  if (iv.includes(11)) return 11;
  if (iv.includes(9)) return 9;
  return 12;
}

export function fifthOf(chord) {
  const iv = chord.intervals;
  if (iv.includes(7)) return 7;
  if (iv.includes(6)) return 6;
  if (iv.includes(8)) return 8;
  return 7;
}

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
};

/** 'D dorian' -> Set of pitch classes */
export function scalePitchClasses(keyStr) {
  const [tonic, mode = 'major'] = keyStr.split(/\s+/);
  const m = /^([A-G])(#|b)?$/.exec(tonic);
  if (!m) throw new Error(`Invalid key "${keyStr}"`);
  const root = (LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
  const scale = SCALES[mode];
  if (!scale) throw new Error(`Unknown mode "${mode}"`);
  return new Set(scale.map(s => (root + s) % 12));
}
