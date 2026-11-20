import type {
  HandMode,
  PedalEvent,
  PianoNote,
  RecordedKeystroke,
  SongPiece,
} from '../types/piano';

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function filterNotesByHand(notes: PianoNote[], handMode: HandMode): PianoNote[] {
  if (handMode === 'both') return notes;
  return notes.filter((n) => n.hand === handMode);
}

export function getActiveNotesAtTime(
  notes: PianoNote[],
  timeSec: number,
  transpose = 0
): Array<PianoNote & { effectiveMidi: number }> {
  const result: Array<PianoNote & { effectiveMidi: number }> = [];
  for (const n of notes) {
    if (timeSec >= n.startTime && timeSec < n.startTime + n.duration) {
      result.push({
        ...n,
        effectiveMidi: Math.max(21, Math.min(108, n.midi + transpose)),
      });
    }
  }
  return result;
}

export function getUpcomingNotesInWindow(
  notes: PianoNote[],
  timeSec: number,
  lookaheadSec: number,
  transpose = 0
): Array<PianoNote & { effectiveMidi: number }> {
  const windowEnd = timeSec + lookaheadSec;
  const result: Array<PianoNote & { effectiveMidi: number }> = [];
  for (const n of notes) {
    const noteEnd = n.startTime + n.duration;
    if (noteEnd >= timeSec && n.startTime <= windowEnd) {
      result.push({
        ...n,
        effectiveMidi: Math.max(21, Math.min(108, n.midi + transpose)),
      });
    }
  }
  return result;
}

export function getPedalStateAtTime(pedals: PedalEvent[], timeSec: number): boolean {
  let active = false;
  for (const p of pedals) {
    if (p.time <= timeSec) {
      active = p.active;
    } else {
      break;
    }
  }
  return active;
}

export interface PracticeTarget {
  targetTime: number;
  requiredNotes: PianoNote[];
}

/**
 * In Practice Wait-Mode, finds the earliest uncompleted chord/note cluster
 * at or near the current playback time that the player must press to advance.
 */
export function findNextPracticeTarget(
  notes: PianoNote[],
  currentTime: number,
  completedIds: Set<string>,
  chordWindowSec = 0.045
): PracticeTarget | null {
  let firstUncompleted: PianoNote | null = null;
  for (const n of notes) {
    if (!completedIds.has(n.id) && n.startTime >= currentTime - 0.15) {
      firstUncompleted = n;
      break;
    }
  }
  if (!firstUncompleted) return null;

  const cluster = notes.filter(
    (n) =>
      !completedIds.has(n.id) &&
      Math.abs(n.startTime - firstUncompleted.startTime) <= chordWindowSec
  );

  return {
    targetTime: firstUncompleted.startTime,
    requiredNotes: cluster,
  };
}

export function quantizeRecordedNotes(
  keystrokes: RecordedKeystroke[],
  title = 'Untitled Performance'
): SongPiece | null {
  if (keystrokes.length === 0) return null;

  const sorted = [...keystrokes].sort((a, b) => a.startTimeMs - b.startTimeMs);
  const originMs = sorted[0].startTimeMs;

  const notes: PianoNote[] = sorted.map((ks, idx) => {
    const startTime = Math.max(0, (ks.startTimeMs - originMs) / 1000);
    const duration = Math.max(0.12, (ks.endTimeMs - ks.startTimeMs) / 1000);
    return {
      id: `rec-${idx}-${ks.midi}`,
      midi: Math.max(21, Math.min(108, ks.midi)),
      startTime,
      duration,
      velocity: Math.max(0.3, Math.min(1, ks.velocity)),
      hand: ks.midi < 60 ? 'left' : 'right',
    };
  });

  const maxEnd = notes.reduce((acc, n) => Math.max(acc, n.startTime + n.duration), 0);

  return {
    id: `rec-${Date.now()}`,
    title: title.trim() || 'Bản thu chưa đặt tên',
    composer: 'Bản thu trực tiếp',
    era: 'Tự sáng tác',
    difficulty: 'Intermediate',
    keySignature: 'Tự do',
    bpm: 100,
    duration: Math.max(1, maxEnd + 0.4),
    notes,
    pedals: [],
    source: 'recorded',
    createdAt: Date.now(),
  };
}
