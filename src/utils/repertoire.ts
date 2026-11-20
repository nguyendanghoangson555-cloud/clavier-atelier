import type { HandSide, PedalEvent, PianoNote, SongPiece } from '../types/piano';
import { noteNameToMidi } from './musicTheory';

interface NoteSpec {
  note: string;
  beat: number;
  beats: number;
  hand: HandSide;
  vel?: number;
}

function buildPiece(params: {
  id: string;
  title: string;
  composer: string;
  era: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Concert';
  keySignature: string;
  bpm: number;
  specs: NoteSpec[];
  pedalBeats?: Array<{ beat: number; active: boolean }>;
}): SongPiece {
  const secPerBeat = 60 / params.bpm;
  const notes: PianoNote[] = params.specs.map((s, i) => ({
    id: `${params.id}-${i}`,
    midi: noteNameToMidi(s.note),
    startTime: Number((s.beat * secPerBeat).toFixed(4)),
    duration: Number((Math.max(0.15, s.beats) * secPerBeat).toFixed(4)),
    velocity: s.vel ?? (s.hand === 'right' ? 0.78 : 0.56),
    hand: s.hand,
  }));

  notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);

  const pedals: PedalEvent[] = (params.pedalBeats ?? []).map((p) => ({
    time: Number((p.beat * secPerBeat).toFixed(4)),
    active: p.active,
  }));

  const maxEnd = notes.reduce((acc, n) => Math.max(acc, n.startTime + n.duration), 0);

  return {
    id: params.id,
    title: params.title,
    composer: params.composer,
    era: params.era,
    difficulty: params.difficulty,
    keySignature: params.keySignature,
    bpm: params.bpm,
    duration: Number((maxEnd + 0.8).toFixed(2)),
    notes,
    pedals,
    source: 'builtin',
  };
}

// 1. Erik Satie - Gymnopédie No. 1 (opening 16 bars, 3/4 time)
function createGymnopedie(): SongPiece {
  const specs: NoteSpec[] = [];
  const pedalBeats: Array<{ beat: number; active: boolean }> = [];

  const addBarBass = (barIndex: number, root: string, chord: string[]) => {
    const b = barIndex * 3;
    specs.push({ note: root, beat: b, beats: 2.8, hand: 'left', vel: 0.48 });
    for (const c of chord) {
      specs.push({ note: c, beat: b + 1, beats: 1.85, hand: 'left', vel: 0.42 });
    }
    pedalBeats.push({ beat: b, active: true });
    pedalBeats.push({ beat: b + 2.85, active: false });
  };

  // Intro 4 bars (Gmaj7 -> Dmaj7)
  addBarBass(0, 'G2', ['B3', 'D4', 'F#4']);
  addBarBass(1, 'D2', ['A3', 'C#4', 'F#4']);
  addBarBass(2, 'G2', ['B3', 'D4', 'F#4']);
  addBarBass(3, 'D2', ['A3', 'C#4', 'F#4']);

  // Melody enters bar 4..15
  const bars: Array<{ root: string; chord: string[] }> = [
    { root: 'G2', chord: ['B3', 'D4', 'F#4'] }, // 4
    { root: 'D2', chord: ['A3', 'C#4', 'F#4'] }, // 5
    { root: 'G2', chord: ['B3', 'D4', 'F#4'] }, // 6
    { root: 'D2', chord: ['A3', 'C#4', 'F#4'] }, // 7
    { root: 'G2', chord: ['B3', 'D4', 'F#4'] }, // 8
    { root: 'D2', chord: ['A3', 'C#4', 'F#4'] }, // 9
    { root: 'G2', chord: ['B3', 'D4', 'F#4'] }, // 10
    { root: 'D2', chord: ['A3', 'C#4', 'F#4'] }, // 11
    { root: 'F#2', chord: ['A3', 'C#4', 'F#4'] }, // 12
    { root: 'B2', chord: ['B3', 'D4', 'F#4'] }, // 13
    { root: 'E2', chord: ['G3', 'B3', 'E4'] }, // 14
    { root: 'E2', chord: ['G3', 'B3', 'D4'] }, // 15
    { root: 'A2', chord: ['A3', 'C#4', 'E4'] }, // 16
    { root: 'D2', chord: ['A3', 'D4', 'F#4'] }, // 17
  ];
  bars.forEach((b, idx) => addBarBass(idx + 4, b.root, b.chord));

  // Right-hand melody
  const melody: NoteSpec[] = [
    // Bar 4-7
    { note: 'F#5', beat: 13, beats: 1, hand: 'right', vel: 0.72 },
    { note: 'A5', beat: 14, beats: 1, hand: 'right', vel: 0.78 },
    { note: 'G5', beat: 15, beats: 1, hand: 'right', vel: 0.75 },
    { note: 'F#5', beat: 16, beats: 1, hand: 'right', vel: 0.72 },
    { note: 'C#5', beat: 17, beats: 1, hand: 'right', vel: 0.68 },
    { note: 'B4', beat: 18, beats: 1, hand: 'right', vel: 0.66 },
    { note: 'C#5', beat: 19, beats: 1, hand: 'right', vel: 0.7 },
    { note: 'D5', beat: 20, beats: 1, hand: 'right', vel: 0.72 },
    { note: 'A4', beat: 21, beats: 2.8, hand: 'right', vel: 0.7 },
    // Bar 8-11
    { note: 'F#4', beat: 24, beats: 2.8, hand: 'right', vel: 0.68 },
    { note: 'F#5', beat: 28, beats: 1, hand: 'right', vel: 0.73 },
    { note: 'A5', beat: 29, beats: 1, hand: 'right', vel: 0.79 },
    { note: 'G5', beat: 30, beats: 1, hand: 'right', vel: 0.75 },
    { note: 'F#5', beat: 31, beats: 1, hand: 'right', vel: 0.72 },
    { note: 'C#5', beat: 32, beats: 1, hand: 'right', vel: 0.68 },
    { note: 'B4', beat: 33, beats: 1, hand: 'right', vel: 0.66 },
    { note: 'C#5', beat: 34, beats: 1, hand: 'right', vel: 0.7 },
    { note: 'D5', beat: 35, beats: 1, hand: 'right', vel: 0.72 },
    // Bar 12-17
    { note: 'A4', beat: 36, beats: 2.8, hand: 'right', vel: 0.7 },
    { note: 'C#5', beat: 39, beats: 2.8, hand: 'right', vel: 0.72 },
    { note: 'F#5', beat: 42, beats: 2.8, hand: 'right', vel: 0.75 },
    { note: 'E5', beat: 45, beats: 2.8, hand: 'right', vel: 0.71 },
    { note: 'A4', beat: 48, beats: 1.5, hand: 'right', vel: 0.66 },
    { note: 'B4', beat: 49.5, beats: 1.5, hand: 'right', vel: 0.68 },
    { note: 'D5', beat: 51, beats: 2.8, hand: 'right', vel: 0.74 },
  ];

  return buildPiece({
    id: 'gymnopedie-1',
    title: 'Gymnopédie No. 1',
    composer: 'Erik Satie',
    era: 'Ấn tượng · 1888',
    difficulty: 'Beginner',
    keySignature: 'Rê trưởng',
    bpm: 72,
    specs: [...specs, ...melody],
    pedalBeats,
  });
}

// 2. Ludwig van Beethoven - Für Elise (Main Theme A + B)
function createFurElise(): SongPiece {
  const specs: NoteSpec[] = [];
  const pedalBeats: Array<{ beat: number; active: boolean }> = [];

  const pushPickupAndMain = (offset: number) => {
    const rh: Array<[string, number, number, number?]> = [
      ['E5', 0, 0.5],
      ['D#5', 0.5, 0.5],
      ['E5', 1, 0.5],
      ['D#5', 1.5, 0.5],
      ['E5', 2, 0.5],
      ['B4', 2.5, 0.5],
      ['D5', 3, 0.5],
      ['C5', 3.5, 0.5],
      ['A4', 4, 1.0, 0.8],
      // Phrase 2
      ['C4', 5, 0.5, 0.66],
      ['E4', 5.5, 0.5, 0.7],
      ['A4', 6, 0.5, 0.75],
      ['B4', 6.5, 1.0, 0.78],
      ['E4', 7.5, 0.5, 0.68],
      ['G#4', 8, 0.5, 0.72],
      ['B4', 8.5, 0.5, 0.75],
      ['C5', 9, 1.0, 0.8],
      // Repeat motif
      ['E4', 10, 0.5, 0.68],
      ['E5', 10.5, 0.5],
      ['D#5', 11, 0.5],
      ['E5', 11.5, 0.5],
      ['D#5', 12, 0.5],
      ['E5', 12.5, 0.5],
      ['B4', 13, 0.5],
      ['D5', 13.5, 0.5],
      ['C5', 14, 0.5],
      ['A4', 14.5, 1.0, 0.8],
      // Cadence
      ['C4', 15.5, 0.5, 0.66],
      ['E4', 16, 0.5, 0.7],
      ['A4', 16.5, 0.5, 0.75],
      ['B4', 17, 1.0, 0.78],
      ['E4', 18, 0.5, 0.68],
      ['C5', 18.5, 0.5, 0.75],
      ['B4', 19, 0.5, 0.74],
      ['A4', 19.5, 1.2, 0.8],
    ];
    for (const [note, beat, beats, vel] of rh) {
      specs.push({ note, beat: offset + beat, beats, hand: 'right', vel: vel ?? 0.76 });
    }

    const lh: Array<[string, number, number]> = [
      ['A2', 4, 0.5],
      ['E3', 4.5, 0.5],
      ['A3', 5, 0.8],
      ['E2', 6.5, 0.5],
      ['E3', 7, 0.5],
      ['G#3', 7.5, 0.8],
      ['A2', 9, 0.5],
      ['E3', 9.5, 0.5],
      ['A3', 10, 0.8],
      // Second pass
      ['A2', 14.5, 0.5],
      ['E3', 15, 0.5],
      ['A3', 15.5, 0.8],
      ['E2', 17, 0.5],
      ['E3', 17.5, 0.5],
      ['G#3', 18, 0.8],
      ['A2', 19.5, 0.5],
      ['E3', 20, 0.5],
      ['A3', 20.5, 0.8],
    ];
    for (const [note, beat, beats] of lh) {
      specs.push({ note, beat: offset + beat, beats, hand: 'left', vel: 0.54 });
    }

    pedalBeats.push({ beat: offset + 4, active: true });
    pedalBeats.push({ beat: offset + 6.3, active: false });
    pedalBeats.push({ beat: offset + 6.5, active: true });
    pedalBeats.push({ beat: offset + 8.8, active: false });
    pedalBeats.push({ beat: offset + 9, active: true });
    pedalBeats.push({ beat: offset + 10.4, active: false });
  };

  pushPickupAndMain(0);

  // B Section (C Major lyrical bridge)
  const bOffset = 21.5;
  const rhB: Array<[string, number, number]> = [
    ['B4', 0, 0.5],
    ['C5', 0.5, 0.5],
    ['D5', 1, 0.5],
    ['E5', 1.5, 1.0],
    ['G4', 2.5, 0.5],
    ['F5', 3, 0.5],
    ['E5', 3.5, 0.5],
    ['D5', 4, 1.0],
    ['F4', 5, 0.5],
    ['E5', 5.5, 0.5],
    ['D5', 6, 0.5],
    ['C5', 6.5, 1.0],
    ['E4', 7.5, 0.5],
    ['D5', 8, 0.5],
    ['C5', 8.5, 0.5],
    ['B4', 9, 1.2],
  ];
  for (const [note, beat, beats] of rhB) {
    specs.push({ note, beat: bOffset + beat, beats, hand: 'right', vel: 0.78 });
  }
  const lhB: Array<[string, number, number]> = [
    ['C3', 1.5, 0.5],
    ['G3', 2, 0.5],
    ['C4', 2.5, 0.8],
    ['G2', 4, 0.5],
    ['G3', 4.5, 0.5],
    ['B3', 5, 0.8],
    ['A2', 6.5, 0.5],
    ['E3', 7, 0.5],
    ['A3', 7.5, 0.8],
    ['E2', 9, 0.5],
    ['E3', 9.5, 0.5],
    ['G#3', 10, 1.0],
  ];
  for (const [note, beat, beats] of lhB) {
    specs.push({ note, beat: bOffset + beat, beats, hand: 'left', vel: 0.56 });
  }

  // Final A return
  pushPickupAndMain(bOffset + 11.5);

  return buildPiece({
    id: 'fur-elise',
    title: 'Für Elise, WoO 59',
    composer: 'Ludwig van Beethoven',
    era: 'Cổ điển · 1810',
    difficulty: 'Intermediate',
    keySignature: 'La thứ',
    bpm: 126,
    specs,
    pedalBeats,
  });
}

// 3. Moonlight Sonata Op. 27 No. 2 (1st Movement excerpt)
function createMoonlightSonata(): SongPiece {
  const specs: NoteSpec[] = [];
  const pedalBeats: Array<{ beat: number; active: boolean }> = [];

  const chords: Array<{ bass: [string, string]; arp: [string, string, string]; melody?: string }> = [
    { bass: ['C#2', 'C#3'], arp: ['G#3', 'C#4', 'E4'] },
    { bass: ['B1', 'B2'], arp: ['G#3', 'C#4', 'E4'] },
    { bass: ['A1', 'A2'], arp: ['A3', 'C#4', 'E4'] },
    { bass: ['F#1', 'F#2'], arp: ['A3', 'D4', 'F#4'] },
    { bass: ['G#1', 'G#2'], arp: ['G#3', 'C#4', 'E4'], melody: 'G#4' },
    { bass: ['G#1', 'G#2'], arp: ['G#3', 'D#4', 'F#4'], melody: 'G#4' },
    { bass: ['C#2', 'C#3'], arp: ['G#3', 'C#4', 'E4'], melody: 'G#4' },
    { bass: ['C#2', 'C#3'], arp: ['G#3', 'C#4', 'E4'], melody: 'A4' },
    { bass: ['D2', 'D3'], arp: ['A3', 'D4', 'F#4'], melody: 'A4' },
    { bass: ['G#1', 'G#2'], arp: ['G#3', 'C#4', 'E4'], melody: 'G#4' },
    { bass: ['G#1', 'G#2'], arp: ['G#3', 'D#4', 'F#4'], melody: 'F#4' },
    { bass: ['C#2', 'C#3'], arp: ['G#3', 'C#4', 'E4'], melody: 'E4' },
  ];

  chords.forEach((bar, barIdx) => {
    const b = barIdx * 4;
    specs.push({ note: bar.bass[0], beat: b, beats: 3.8, hand: 'left', vel: 0.52 });
    specs.push({ note: bar.bass[1], beat: b, beats: 3.8, hand: 'left', vel: 0.48 });
    pedalBeats.push({ beat: b, active: true });
    pedalBeats.push({ beat: b + 3.85, active: false });

    // 4 triplets per bar (12 sixteenth-triplet pulses)
    for (let group = 0; group < 4; group++) {
      for (let t = 0; t < 3; t++) {
        const beatPos = b + group + t / 3;
        specs.push({
          note: bar.arp[t],
          beat: beatPos,
          beats: 0.3,
          hand: 'right',
          vel: 0.44,
        });
      }
    }

    if (bar.melody) {
      specs.push({ note: bar.melody, beat: b, beats: 2.8, hand: 'right', vel: 0.78 });
      specs.push({ note: bar.melody, beat: b + 3, beats: 0.9, hand: 'right', vel: 0.72 });
    }
  });

  return buildPiece({
    id: 'moonlight-1',
    title: 'Moonlight Sonata (1st Mvt)',
    composer: 'Ludwig van Beethoven',
    era: 'Lãng mạn · 1801',
    difficulty: 'Intermediate',
    keySignature: 'Đô# thứ',
    bpm: 56,
    specs,
    pedalBeats,
  });
}

// 4. Pachelbel - Canon in D (Concert Arrangement)
function createCanonInD(): SongPiece {
  const specs: NoteSpec[] = [];
  const pedalBeats: Array<{ beat: number; active: boolean }> = [];

  const prog: Array<{ bass: string; arp: string[] }> = [
    { bass: 'D2', arp: ['A2', 'D3', 'F#3', 'A3'] },
    { bass: 'A1', arp: ['E2', 'A2', 'C#3', 'E3'] },
    { bass: 'B1', arp: ['F#2', 'B2', 'D3', 'F#3'] },
    { bass: 'F#1', arp: ['C#2', 'F#2', 'A2', 'C#3'] },
    { bass: 'G1', arp: ['D2', 'G2', 'B2', 'D3'] },
    { bass: 'D1', arp: ['A2', 'D3', 'F#3', 'A3'] },
    { bass: 'G1', arp: ['D2', 'G2', 'B2', 'D3'] },
    { bass: 'A1', arp: ['E2', 'A2', 'C#3', 'E3'] },
  ];

  // Cycle 1: Chorale melody
  const melody1 = ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5'];
  prog.forEach((step, idx) => {
    const b = idx * 2;
    specs.push({ note: step.bass, beat: b, beats: 1.9, hand: 'left', vel: 0.56 });
    specs.push({ note: step.arp[1], beat: b + 0.5, beats: 1.3, hand: 'left', vel: 0.45 });
    specs.push({ note: step.arp[2], beat: b + 1.0, beats: 0.9, hand: 'left', vel: 0.46 });
    specs.push({ note: melody1[idx], beat: b, beats: 1.85, hand: 'right', vel: 0.76 });
    pedalBeats.push({ beat: b, active: true });
    pedalBeats.push({ beat: b + 1.9, active: false });
  });

  // Cycle 2: Flowing eighth-note variation
  const melody2: string[][] = [
    ['D5', 'F#5', 'A5', 'G5'],
    ['F#5', 'D5', 'F#5', 'E5'],
    ['D5', 'B4', 'D5', 'A5'],
    ['G5', 'B5', 'A5', 'G5'],
    ['F#5', 'D5', 'E5', 'C#5'],
    ['D5', 'F#5', 'A5', 'F#5'],
    ['B4', 'G5', 'F#5', 'E5'],
    ['D5', 'E5', 'F#5', 'G5'],
  ];

  prog.forEach((step, idx) => {
    const b = 16 + idx * 2;
    specs.push({ note: step.bass, beat: b, beats: 1.9, hand: 'left', vel: 0.58 });
    step.arp.forEach((n, j) => {
      specs.push({ note: n, beat: b + j * 0.5, beats: 0.48, hand: 'left', vel: 0.48 });
    });
    melody2[idx].forEach((n, j) => {
      specs.push({ note: n, beat: b + j * 0.5, beats: 0.46, hand: 'right', vel: 0.78 });
    });
    pedalBeats.push({ beat: b, active: true });
    pedalBeats.push({ beat: b + 1.9, active: false });
  });

  // Final D resolve
  specs.push({ note: 'D2', beat: 32, beats: 3.5, hand: 'left', vel: 0.62 });
  specs.push({ note: 'A2', beat: 32, beats: 3.5, hand: 'left', vel: 0.52 });
  specs.push({ note: 'F#4', beat: 32, beats: 3.5, hand: 'right', vel: 0.72 });
  specs.push({ note: 'D5', beat: 32, beats: 3.5, hand: 'right', vel: 0.8 });
  pedalBeats.push({ beat: 32, active: true });
  pedalBeats.push({ beat: 35.5, active: false });

  return buildPiece({
    id: 'canon-in-d',
    title: 'Canon in D Major',
    composer: 'Johann Pachelbel',
    era: 'Baroque · 1680',
    difficulty: 'Intermediate',
    keySignature: 'Rê trưởng',
    bpm: 76,
    specs,
    pedalBeats,
  });
}

// 5. Claude Debussy - Clair de Lune (Nocturnal Opening)
function createClairDeLune(): SongPiece {
  const specs: NoteSpec[] = [];
  const pedalBeats: Array<{ beat: number; active: boolean }> = [];

  // Lush parallel thirds & warm Db bass (9/8 feel mapped cleanly to 4.5-beat bars)
  const phrases: Array<{ bass?: string[]; thirds: Array<[string, string, number, number]> }> = [
    {
      bass: ['F3', 'Ab3'],
      thirds: [
        ['F5', 'Ab5', 1.5, 2.5],
        ['Db5', 'F5', 4.0, 1.5],
      ],
    },
    {
      bass: ['Eb3', 'Gb3'],
      thirds: [
        ['Eb5', 'Gb5', 5.5, 1.0],
        ['Db5', 'F5', 6.5, 0.5],
        ['Eb5', 'Gb5', 7.0, 1.0],
        ['C5', 'Eb5', 8.0, 2.0],
      ],
    },
    {
      bass: ['Db3', 'F3'],
      thirds: [
        ['Db5', 'F5', 10.0, 1.0],
        ['C5', 'Eb5', 11.0, 0.5],
        ['Db5', 'F5', 11.5, 1.0],
        ['Bb4', 'Db5', 12.5, 2.0],
      ],
    },
    {
      bass: ['Gb2', 'Db3', 'Bb3'],
      thirds: [
        ['Db5', 'F5', 14.5, 1.5],
        ['C5', 'Eb5', 16.0, 1.0],
        ['Bb4', 'Db5', 17.0, 1.0],
        ['Ab4', 'C5', 18.0, 2.5],
      ],
    },
    {
      bass: ['Db2', 'Ab2', 'F3'],
      thirds: [
        ['F4', 'Ab4', 20.5, 3.5],
      ],
    },
  ];

  phrases.forEach((p, idx) => {
    const barStart = p.thirds[0][2];
    if (p.bass) {
      p.bass.forEach((bNote) => {
        specs.push({ note: bNote, beat: Math.max(0, barStart - 0.5), beats: 3.8, hand: 'left', vel: 0.46 });
      });
    }
    pedalBeats.push({ beat: Math.max(0, barStart - 0.5), active: true });
    pedalBeats.push({ beat: barStart + 3.2, active: false });

    p.thirds.forEach(([n1, n2, beat, dur]) => {
      specs.push({ note: n1, beat, beats: dur, hand: 'right', vel: 0.65 });
      specs.push({ note: n2, beat, beats: dur, hand: 'right', vel: 0.74 });
    });
    if (idx === phrases.length - 1) {
      pedalBeats.push({ beat: 23.8, active: false });
    }
  });

  return buildPiece({
    id: 'clair-de-lune',
    title: 'Clair de Lune (Opening)',
    composer: 'Claude Debussy',
    era: 'Ấn tượng · 1905',
    difficulty: 'Concert',
    keySignature: 'Rê giáng trưởng',
    bpm: 64,
    specs,
    pedalBeats,
  });
}

// 6. Petzold / Bach - Minuet in G Major (Two-Part Counterpoint)
function createMinuetInG(): SongPiece {
  const specs: NoteSpec[] = [];

  const rh: Array<[string, number, number]> = [
    ['D5', 0, 1], ['G4', 1, 0.5], ['A4', 1.5, 0.5], ['B4', 2, 0.5], ['C5', 2.5, 0.5],
    ['D5', 3, 1], ['G4', 4, 1], ['G4', 5, 1],
    ['E5', 6, 1], ['C5', 7, 0.5], ['D5', 7.5, 0.5], ['E5', 8, 0.5], ['F#5', 8.5, 0.5],
    ['G5', 9, 1], ['G4', 10, 1], ['G4', 11, 1],
    ['C5', 12, 1], ['D5', 13, 0.5], ['C5', 13.5, 0.5], ['B4', 14, 0.5], ['A4', 14.5, 0.5],
    ['B4', 15, 1], ['C5', 16, 0.5], ['B4', 16.5, 0.5], ['A4', 17, 0.5], ['G4', 17.5, 0.5],
    ['F#4', 18, 1], ['G4', 19, 0.5], ['A4', 19.5, 0.5], ['B4', 20, 0.5], ['G4', 20.5, 0.5],
    ['A4', 21, 2.8],
  ];

  const lh: Array<[string, number, number]> = [
    ['G3', 0, 2], ['B3', 2, 1],
    ['A3', 3, 1], ['B3', 4, 1], ['G3', 5, 1],
    ['C4', 6, 2.8],
    ['B3', 9, 2.8],
    ['A3', 12, 2.8],
    ['G3', 15, 2.8],
    ['D4', 18, 2], ['B3', 20, 1],
    ['D3', 21, 2.8],
  ];

  for (const [note, beat, beats] of rh) {
    specs.push({ note, beat, beats, hand: 'right', vel: 0.76 });
  }
  for (const [note, beat, beats] of lh) {
    specs.push({ note, beat, beats, hand: 'left', vel: 0.58 });
  }

  return buildPiece({
    id: 'minuet-in-g',
    title: 'Minuet in G Major',
    composer: 'J.S. Bach / C. Petzold',
    era: 'Baroque · 1725',
    difficulty: 'Beginner',
    keySignature: 'Son trưởng',
    bpm: 112,
    specs,
  });
}

export const BUILTIN_REPERTOIRE: SongPiece[] = [
  createFurElise(),
  createGymnopedie(),
  createMoonlightSonata(),
  createCanonInD(),
  createClairDeLune(),
  createMinuetInG(),
];
