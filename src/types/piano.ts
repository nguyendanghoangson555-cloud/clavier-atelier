export type HandSide = 'left' | 'right';

export interface PianoNote {
  id: string;
  midi: number;
  startTime: number; // in seconds at 1.0x speed
  duration: number; // in seconds
  velocity: number; // 0.0 to 1.0
  hand: HandSide;
}

export interface PedalEvent {
  time: number; // in seconds
  active: boolean;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Concert';

export interface SongPiece {
  id: string;
  title: string;
  composer: string;
  era: string;
  difficulty: DifficultyLevel;
  keySignature: string;
  bpm: number;
  duration: number;
  notes: PianoNote[];
  pedals: PedalEvent[];
  source: 'builtin' | 'midi' | 'recorded';
  createdAt?: number;
}

export type PianoVoice = 'grand' | 'upright' | 'electric' | 'harpsichord';

export type HandMode = 'both' | 'right' | 'left';

export type KeyboardRangeMode = '61' | '88';

export interface PianoKeyDescriptor {
  midi: number;
  noteName: string;
  pitchClass: string;
  octave: number;
  isBlack: boolean;
  whiteIndex: number; // index among white keys, or left adjacent white key index for black keys
  xRatio: number; // normalized horizontal position [0..1] across keyboard width
  widthRatio: number; // normalized key width across keyboard width
}

export interface RecordedKeystroke {
  midi: number;
  startTimeMs: number;
  endTimeMs: number;
  velocity: number;
}
