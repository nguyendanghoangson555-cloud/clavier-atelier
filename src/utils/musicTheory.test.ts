import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectChord,
  generatePianoKeys,
  getMidiToQwertyLabelMap,
  getQwertyToMidiMap,
  isBlackKey,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
} from './musicTheory';

test('MIDI note name conversions round-trip accurately', () => {
  assert.equal(midiToNoteName(60), 'C4');
  assert.equal(midiToNoteName(69), 'A4');
  assert.equal(midiToNoteName(21), 'A0');
  assert.equal(midiToNoteName(108), 'C8');
  assert.equal(noteNameToMidi('C4'), 60);
  assert.equal(noteNameToMidi('A4'), 69);
  assert.equal(noteNameToMidi('F#3'), 54);
  assert.equal(noteNameToMidi('Db5'), 73);
});

test('MIDI frequency matches A4 = 440Hz equal temperament', () => {
  assert.equal(Math.round(midiToFrequency(69) * 100) / 100, 440);
  assert.equal(Math.round(midiToFrequency(57) * 100) / 100, 220);
  assert.equal(Math.round(midiToFrequency(81) * 100) / 100, 880);
});

test('isBlackKey classifies white and sharp/flat keys properly', () => {
  assert.equal(isBlackKey(60), false); // C4
  assert.equal(isBlackKey(61), true);  // C#4
  assert.equal(isBlackKey(64), false); // E4
  assert.equal(isBlackKey(65), false); // F4
  assert.equal(isBlackKey(66), true);  // F#4
});

test('generatePianoKeys produces exact key counts and valid normalized bounds', () => {
  const layout88 = generatePianoKeys(21, 108);
  assert.equal(layout88.keys.length, 88);
  assert.equal(layout88.whiteKeyCount, 52);

  const layout61 = generatePianoKeys(36, 96);
  assert.equal(layout61.keys.length, 61);
  assert.equal(layout61.whiteKeyCount, 36);

  for (const k of layout61.keys) {
    assert.ok(k.xRatio >= 0 && k.xRatio <= 1);
    assert.ok(k.widthRatio > 0 && k.xRatio + k.widthRatio <= 1.0001);
  }
});

test('detectChord identifies triads, seventh chords, and inversions', () => {
  assert.equal(detectChord([]), '—');
  assert.equal(detectChord([60]), 'C4');
  assert.equal(detectChord([60, 64, 67]), 'C Major');
  assert.equal(detectChord([57, 60, 64]), 'A Minor');
  assert.equal(detectChord([60, 64, 67, 71]), 'C maj7');
  assert.equal(detectChord([64, 67, 72]), 'C Major/E');
});

test('QWERTY keyboard map maps Z to base C and Q to C+1 octave', () => {
  const map = getQwertyToMidiMap(3);
  assert.equal(map['z'], 48); // C3
  assert.equal(map['q'], 60); // C4
  const labels = getMidiToQwertyLabelMap(3);
  assert.equal(labels[48], 'Z');
  assert.equal(labels[60], 'Q');
});
