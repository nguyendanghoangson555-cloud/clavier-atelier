import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterNotesByHand,
  findNextPracticeTarget,
  formatTime,
  getActiveNotesAtTime,
  getPedalStateAtTime,
  getUpcomingNotesInWindow,
  quantizeRecordedNotes,
} from './autoPianoEngine';
import { parseMidiFile } from './midiParser';
import { BUILTIN_REPERTOIRE } from './repertoire';
import type { PianoNote } from '../types/piano';

test('formatTime formats seconds cleanly as M:SS', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(-3), '0:00');
});

test('active and upcoming note queries honor time windows and transpose', () => {
  const notes: PianoNote[] = [
    { id: 'n1', midi: 60, startTime: 1.0, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'n2', midi: 48, startTime: 2.0, duration: 1.0, velocity: 0.6, hand: 'left' },
    { id: 'n3', midi: 64, startTime: 5.0, duration: 0.5, velocity: 0.8, hand: 'right' },
  ];

  const active = getActiveNotesAtTime(notes, 1.25, 2);
  assert.equal(active.length, 1);
  assert.equal(active[0].effectiveMidi, 62);

  const upcoming = getUpcomingNotesInWindow(notes, 0.5, 2.0, 0);
  assert.equal(upcoming.length, 2);
  assert.deepEqual(
    upcoming.map((n) => n.id),
    ['n1', 'n2']
  );

  assert.equal(filterNotesByHand(notes, 'left').length, 1);
  assert.equal(filterNotesByHand(notes, 'right').length, 2);
});

test('getPedalStateAtTime tracks sustain pedal down/up transitions', () => {
  const pedals = [
    { time: 0.5, active: true },
    { time: 2.0, active: false },
    { time: 3.0, active: true },
  ];
  assert.equal(getPedalStateAtTime(pedals, 0.2), false);
  assert.equal(getPedalStateAtTime(pedals, 1.2), true);
  assert.equal(getPedalStateAtTime(pedals, 2.5), false);
  assert.equal(getPedalStateAtTime(pedals, 3.5), true);
});

test('findNextPracticeTarget groups simultaneous chord notes and skips completed notes', () => {
  const notes: PianoNote[] = [
    { id: 'a', midi: 60, startTime: 1.0, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'b', midi: 64, startTime: 1.02, duration: 0.5, velocity: 0.8, hand: 'right' },
    { id: 'c', midi: 67, startTime: 2.0, duration: 0.5, velocity: 0.8, hand: 'right' },
  ];

  const first = findNextPracticeTarget(notes, 0.9, new Set());
  assert.ok(first);
  assert.deepEqual(
    first.requiredNotes.map((n) => n.id),
    ['a', 'b']
  );

  const second = findNextPracticeTarget(notes, 1.05, new Set(['a', 'b']));
  assert.ok(second);
  assert.deepEqual(
    second.requiredNotes.map((n) => n.id),
    ['c']
  );
});

test('quantizeRecordedNotes converts keystrokes into a valid playable SongPiece', () => {
  const piece = quantizeRecordedNotes(
    [
      { midi: 60, startTimeMs: 1000, endTimeMs: 1400, velocity: 0.8 },
      { midi: 48, startTimeMs: 1500, endTimeMs: 2100, velocity: 0.6 },
    ],
    'My Sketch'
  );
  assert.ok(piece);
  assert.equal(piece.title, 'My Sketch');
  assert.equal(piece.notes.length, 2);
  assert.equal(piece.notes[0].startTime, 0);
  assert.equal(piece.notes[1].startTime, 0.5);
  assert.equal(piece.notes[1].hand, 'left');
});

test('parseMidiFile parses a valid binary SMF track cleanly', () => {
  // Minimal Format 0 MIDI with 1 track, 480 ticks/beat, 120 BPM, C4 quarter note
  const bytes = new Uint8Array([
    // MThd
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, // format 0
    0x00, 0x01, // 1 track
    0x01, 0xe0, // 480 ticks per quarter note
    // MTrk
    0x4d, 0x54, 0x72, 0x6b,
    0x00, 0x00, 0x00, 0x0f, // 15 bytes
    0x00, 0x90, 0x3c, 0x64, // delta 0, Note On C4 (60), vel 100
    0x83, 0x60, 0x80, 0x3c, 0x00, // delta 480 (0x83 0x60), Note Off C4
    0x00, 0xff, 0x2f, 0x00, // End of track
  ]);

  const parsed = parseMidiFile(bytes.buffer, 'test-scale.mid');
  assert.equal(parsed.title, 'test-scale');
  assert.equal(parsed.notes.length, 1);
  assert.equal(parsed.notes[0].midi, 60);
  assert.equal(Math.round(parsed.notes[0].duration * 100) / 100, 0.5);
});

test('builtin repertoire pieces are well-formed and sorted by startTime', () => {
  assert.ok(BUILTIN_REPERTOIRE.length >= 6);
  for (const song of BUILTIN_REPERTOIRE) {
    assert.ok(song.notes.length > 15, `${song.title} should have rich notes`);
    assert.ok(song.duration > 5);
    for (let i = 1; i < song.notes.length; i++) {
      assert.ok(song.notes[i].startTime >= song.notes[i - 1].startTime);
    }
  }
});
