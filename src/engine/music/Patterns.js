// Reusable rhythmic grids for the procedural soundtrack compiler.
// Every grid is one bar long (16 steps = 16th notes unless a section overrides `steps`).
// Spaces inside grids are ignored, so grids can be grouped per beat: 'R--- 5--- R--- 5---'.
//
// BASS tokens:  R root (or slash bass) | 5 fifth | O octave up | L octave down | 3 third | 7 seventh
//               b chromatic approach (semitone below next chord's bass) | a approach from above
//               x dead/ghost note | - tie (extend previous) | . rest
// ARP tokens:   1-9, a-c = index into ascending chord tones (wraps up an octave) | - tie | . rest
// COMP tokens:  X accented chord hit | x normal hit | - tie | . rest
// DRUM tokens:  X accent | x normal | o ghost | - (ignored) | . rest

export const BASS_PATTERNS = {
  whole: 'R--------------- ',
  half: 'R-------R-------',
  root4: 'R---R---R---R---',
  root8: 'R-R-R-R-R-R-R-R-',
  twoFeel: 'R-------5-------',
  march: 'R---5---R---5---',
  walk: 'R---3---5---b---',
  pop: 'R-.R..R-R-.R..5-',
  popPush: 'R-.R..R-R-.R.-b-',
  funk: 'R-.x.RO.R-.x.5.b',
  octave8: 'R-O-R-O-R-O-R-O-',
  octave16: 'RORORORORORORORO',
  roll16: 'RRRRRRRRRRRRRRRR',
  roll8: 'R.R.R.R.R.R.R.R.',
  gallop: 'R-RRR-RRR-RRR-RR',
  halfTime: 'R-------..R-5---',
  dub: 'R-----R-..R-5---',
  epic: 'R-------R---R---',
  pulse: 'R-.RR-.RR-.RR-.R',
  shuffle: 'R-.R5-.5O-.O5-.b',
  pedal: 'R-R-R-R-R-R-R-R-',
  driving: 'R.RRR.RRR.RRR.RR',
  synco: 'R--R--R-R--R--5-',
  stomp: 'R-..R-..R-..R-RR'
};

export const ARP_PATTERNS = {
  up16: '1234123412341234',
  up8: '1-2-3-4-1-2-3-4-',
  updown16: '1234543212345432',
  updown8: '1-2-3-4-5-4-3-2-',
  broken8: '1-3-2-4-1-3-2-4-',
  alberti: '1323132313231323',
  harp8: '1-2-3-4-5-6-7-8-',
  harp16: '1234567876543212',
  cascade16: '8765432187654321',
  poly3: '1-2-3-1-2-3-1-2-',
  poly3x16: '1231231231231231',
  sparkle: '..5...3...6...4.',
  twinkle: '5-.-3-.-6-.-4-.-',
  wave16: '1234565432345654',
  pulse16: '1111222233334444',
  pedal16: '5151515151515151',
  gate16: '3434343434343434'
};

export const COMP_PATTERNS = {
  pad: 'X---------------',
  half: 'X-------X-------',
  quarters: 'X---x---X---x---',
  offbeat8: '..X-..X-..X-..X-',
  skank: '....X-......X-..',
  charleston: 'X-----X---------',
  stabs: 'X-....x-......x-',
  pulse8: 'X-x-x-x-X-x-x-x-',
  gated16: 'XxXxXxXxXxXxXxXx',
  push: 'X-----x---X---x-',
  anticipate: 'X-----------..x-',
  brassHits: 'X..X..X...X.X...',
  waltz: 'X---x---x---',
  sevenEight: 'X---x---x-x---'
};

// Drum grooves: arrays of bars, cycled across a section.
export const GROOVES = {
  none: [{}],
  softPop: [{
    k: 'X.....x.X.......',
    s: '....X.......X...',
    h: 'x.o.x.o.x.o.x.o.'
  }],
  pop: [{
    k: 'X.....X.X.....x.',
    s: '....X.......X...',
    h: 'x.x.x.x.x.x.x.x.'
  }, {
    k: 'X.....X.X.x.....',
    s: '....X.......X..o',
    h: 'x.x.x.x.x.x.x.o.',
    oh: '..............x.'
  }],
  funky: [{
    k: 'X..x..X...X..x..',
    s: '....X..o.o..X..o',
    h: 'xoxoxoxoxoxoxoxo'
  }],
  shuffle: [{
    k: 'X.....X.X.......',
    s: '....X.......X...',
    h: 'x.x.x.x.x.x.x.x.'
  }],
  halfTime: [{
    k: 'X.......X.x.....',
    s: '........X.......',
    h: 'x.x.x.x.x.x.x.x.'
  }],
  fourFloor: [{
    k: 'X...X...X...X...',
    c: '....X.......X...',
    h: '..x...x...x...x.',
    sh: 'o.o.o.o.o.o.o.o.'
  }],
  synthwave: [{
    k: 'X...X...X...X...',
    s: '....X.......X...',
    h: 'x.x.x.x.x.x.x.x.',
    oh: '..o...o...o...o.'
  }],
  march: [{
    k: 'X.......X.......',
    s: 'X.ooX.o.X.ooXoXo'
  }],
  epic: [{
    k: 'X.....X...X.....',
    tk: 'X.......X...x.x.',
    s: '....X.......X...'
  }],
  breakbeat: [{
    k: 'X.........XX....',
    s: '....X..o.o..X...',
    h: 'x.x.x.x.x.x.x.x.'
  }],
  industrial: [{
    k: 'X..X..X...X..X..',
    s: '....X.......X...',
    mt: '......x.......x.',
    h: 'xoxoxoxoxoxoxoxo'
  }],
  sparse: [{
    k: 'X...............',
    rim: '..........x.....',
    sh: 'o.o.o.o.o.o.o.o.'
  }],
  ambient: [{
    tri: 'x...............'
  }]
};

export const FILLS = {
  snare: { k: 'X.......X.......', s: '....X.X.XoXoXXXX' },
  toms: { k: 'X.......X.......', s: '....X...........', t1: '........XX......', t2: '..........XX....', t3: '............XXXX' },
  build: { k: 'X...X...X...X...', s: 'X...X...X.X.XXXX', sw: 'X...............' },
  stop: { k: 'X...............', s: '............X.X.' },
  roll: { s: 'XoXoXoXoXxXxXXXX', k: 'X.......X.......' },
  tomsRoll: { t3: 'X.X.X.X.........', t2: '........X.X.....', t1: '............XXXX', k: 'X.......X.......' }
};
