import type { PianoKeyDescriptor } from '../types/piano';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

// Offsets of black keys relative to their left white key (in white-key-width units)
const BLACK_KEY_OFFSETS: Record<number, number> = {
  1: 0.62, // C#
  3: 0.74, // D#
  6: 0.60, // F#
  8: 0.68, // G#
  10: 0.76, // A#
};

export function isBlackKey(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12;
  return BLACK_PITCH_CLASSES.has(pc);
}

export function midiToNoteName(midi: number): string {
  const clamped = Math.max(0, Math.min(127, Math.round(midi)));
  const pc = clamped % 12;
  const octave = Math.floor(clamped / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!match) {
    throw new Error(`Invalid note name: ${name}`);
  }
  const [, letterRaw, accidental, octaveStr] = match;
  const letter = letterRaw.toUpperCase();
  const baseMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  let pc = baseMap[letter];
  if (accidental === '#') pc += 1;
  if (accidental === 'b') pc -= 1;
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + pc;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function generatePianoKeys(startMidi: number, endMidi: number): {
  keys: PianoKeyDescriptor[];
  whiteKeyCount: number;
} {
  let whiteCount = 0;
  for (let m = startMidi; m <= endMidi; m++) {
    if (!isBlackKey(m)) {
      whiteCount++;
    }
  }

  const whiteWidthRatio = whiteCount > 0 ? 1 / whiteCount : 1;
  const blackWidthRatio = whiteWidthRatio * 0.62;

  const keys: PianoKeyDescriptor[] = [];
  let currentWhiteIdx = -1;

  for (let m = startMidi; m <= endMidi; m++) {
    const black = isBlackKey(m);
    const pc = ((m % 12) + 12) % 12;
    const octave = Math.floor(m / 12) - 1;

    if (!black) {
      currentWhiteIdx++;
      keys.push({
        midi: m,
        noteName: `${NOTE_NAMES[pc]}${octave}`,
        pitchClass: NOTE_NAMES[pc],
        octave,
        isBlack: false,
        whiteIndex: currentWhiteIdx,
        xRatio: currentWhiteIdx * whiteWidthRatio,
        widthRatio: whiteWidthRatio,
      });
    } else {
      const offsetFactor = BLACK_KEY_OFFSETS[pc] ?? 0.65;
      const centerWhiteOffset = currentWhiteIdx + offsetFactor;
      const xRatio = centerWhiteOffset * whiteWidthRatio - blackWidthRatio / 2;
      keys.push({
        midi: m,
        noteName: `${NOTE_NAMES[pc]}${octave}`,
        pitchClass: NOTE_NAMES[pc],
        octave,
        isBlack: true,
        whiteIndex: Math.max(0, currentWhiteIdx),
        xRatio: Math.max(0, Math.min(1 - blackWidthRatio, xRatio)),
        widthRatio: blackWidthRatio,
      });
    }
  }

  return { keys, whiteKeyCount: whiteCount };
}

const CHORD_PATTERNS: Array<{ intervals: number[]; label: string }> = [
  { intervals: [0, 4, 7, 11], label: 'maj7' },
  { intervals: [0, 3, 7, 10], label: 'm7' },
  { intervals: [0, 4, 7, 10], label: '7' },
  { intervals: [0, 3, 6, 10], label: 'm7b5' },
  { intervals: [0, 3, 6, 9], label: 'dim7' },
  { intervals: [0, 4, 7, 9], label: '6' },
  { intervals: [0, 3, 7, 9], label: 'm6' },
  { intervals: [0, 4, 7], label: 'Major' },
  { intervals: [0, 3, 7], label: 'Minor' },
  { intervals: [0, 3, 6], label: 'dim' },
  { intervals: [0, 4, 8], label: 'aug' },
  { intervals: [0, 5, 7], label: 'sus4' },
  { intervals: [0, 2, 7], label: 'sus2' },
];

export function detectChord(activeMidis: number[]): string {
  if (activeMidis.length === 0) return '—';
  const sorted = [...new Set(activeMidis)].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return midiToNoteName(sorted[0]);
  }

  const pitchClasses = [...new Set(sorted.map((m) => ((m % 12) + 12) % 12))];
  if (pitchClasses.length === 1) {
    return `${NOTE_NAMES[pitchClasses[0]]} Octave`;
  }

  // Test each pitch class as potential root, prioritizing lowest played note first
  const orderedRoots = [
    ((sorted[0] % 12) + 12) % 12,
    ...pitchClasses.filter((pc) => pc !== ((sorted[0] % 12) + 12) % 12),
  ];

  for (const root of orderedRoots) {
    const normalized = new Set(pitchClasses.map((pc) => (pc - root + 12) % 12));
    for (const pattern of CHORD_PATTERNS) {
      if (
        pattern.intervals.length === normalized.size &&
        pattern.intervals.every((iv) => normalized.has(iv))
      ) {
        const bassPc = ((sorted[0] % 12) + 12) % 12;
        const slash = bassPc !== root ? `/${NOTE_NAMES[bassPc]}` : '';
        return `${NOTE_NAMES[root]} ${pattern.label}${slash}`;
      }
    }
  }

  if (sorted.length === 2) {
    const semitones = (sorted[1] - sorted[0]) % 12;
    const intervalNames: Record<number, string> = {
      1: 'm2',
      2: 'M2',
      3: 'm3',
      4: 'M3',
      5: 'P4',
      6: 'TT',
      7: 'P5',
      8: 'm6',
      9: 'M6',
      10: 'm7',
      11: 'M7',
    };
    return `${midiToNoteName(sorted[0])} + ${intervalNames[semitones] ?? 'Octave'}`;
  }

  return sorted.slice(0, 4).map(midiToNoteName).join(' · ');
}

// Two-octave intuitive QWERTY piano layout
// Lower row: Z S X D C V G B H N J M (C to B)
// Upper row: Q 2 W 3 E R 5 T 6 Y 7 U I (C+1 to C+2)
const QWERTY_OFFSETS: Record<string, number> = {
  z: 0,
  s: 1,
  x: 2,
  d: 3,
  c: 4,
  v: 5,
  g: 6,
  b: 7,
  h: 8,
  n: 9,
  j: 10,
  m: 11,
  q: 12,
  '2': 13,
  w: 14,
  '3': 15,
  e: 16,
  r: 17,
  '5': 18,
  t: 19,
  '6': 20,
  y: 21,
  '7': 22,
  u: 23,
  i: 24,
  '9': 25,
  o: 26,
  '0': 27,
  p: 28,
};

export function getQwertyToMidiMap(baseOctave: number): Record<string, number> {
  const baseMidi = (baseOctave + 1) * 12; // e.g., octave 3 -> C3 (48)
  const map: Record<string, number> = {};
  for (const [key, offset] of Object.entries(QWERTY_OFFSETS)) {
    const midi = baseMidi + offset;
    if (midi >= 21 && midi <= 108) {
      map[key] = midi;
    }
  }
  return map;
}

export function getMidiToQwertyLabelMap(baseOctave: number): Record<number, string> {
  const forward = getQwertyToMidiMap(baseOctave);
  const reverse: Record<number, string> = {};
  for (const [key, midi] of Object.entries(forward)) {
    if (!reverse[midi]) {
      reverse[midi] = key.toUpperCase();
    }
  }
  return reverse;
}
