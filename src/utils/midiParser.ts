import type { PedalEvent, PianoNote, SongPiece } from '../types/piano';

interface RawTempoEvent {
  tick: number;
  microsecondsPerBeat: number;
}

interface RawNoteEvent {
  tick: number;
  midi: number;
  velocity: number;
  isOn: boolean;
  channel: number;
}

interface RawPedalEvent {
  tick: number;
  active: boolean;
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, false);
}

function readVarLen(bytes: Uint8Array, offset: number): { value: number; nextOffset: number } {
  let value = 0;
  let idx = offset;
  while (idx < bytes.length) {
    const byte = bytes[idx++];
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return { value, nextOffset: idx };
    }
  }
  throw new Error('Unexpected end of MIDI variable-length quantity');
}

function ticksToSeconds(tick: number, division: number, tempos: RawTempoEvent[]): number {
  let lastTick = 0;
  let lastSeconds = 0;
  let currentTempo = 500000; // default 120 BPM

  for (const tempo of tempos) {
    if (tempo.tick >= tick) break;
    const deltaTicks = tempo.tick - lastTick;
    lastSeconds += (deltaTicks / division) * (currentTempo / 1_000_000);
    lastTick = tempo.tick;
    currentTempo = tempo.microsecondsPerBeat;
  }

  return lastSeconds + ((tick - lastTick) / division) * (currentTempo / 1_000_000);
}

export function parseMidiFile(buffer: ArrayBuffer, fileName = 'Imported MIDI'): SongPiece {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.length < 14) {
    throw new Error('Tệp MIDI quá ngắn hoặc bị hỏng.');
  }

  const headerId = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (headerId !== 'MThd') {
    throw new Error('Định dạng đầu tệp MIDI không hợp lệ.');
  }

  const headerLength = readUint32(view, 4);
  const trackCount = readUint16(view, 10);
  const division = readUint16(view, 12);

  if ((division & 0x8000) !== 0) {
    throw new Error('Không hỗ trợ tệp MIDI dùng mã thời gian SMPTE.');
  }

  let offset = 8 + headerLength;
  const tempos: RawTempoEvent[] = [];
  const rawNotes: RawNoteEvent[] = [];
  const rawPedals: RawPedalEvent[] = [];
  let parsedTitle = fileName.replace(/\.(mid|midi)$/i, '');

  for (let t = 0; t < trackCount && offset + 8 <= bytes.length; t++) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkLength = readUint32(view, offset + 4);
    offset += 8;

    const trackEnd = Math.min(bytes.length, offset + chunkLength);
    if (chunkId !== 'MTrk') {
      offset = trackEnd;
      continue;
    }

    let tick = 0;
    let runningStatus = 0;

    while (offset < trackEnd) {
      const vlq = readVarLen(bytes, offset);
      tick += vlq.value;
      offset = vlq.nextOffset;
      if (offset >= trackEnd) break;

      let status = bytes[offset];
      if (status < 0x80) {
        status = runningStatus;
      } else {
        offset++;
        if (status < 0xf0) {
          runningStatus = status;
        }
      }

      if (status === 0xff) {
        // Meta event
        if (offset >= trackEnd) break;
        const metaType = bytes[offset++];
        const lenInfo = readVarLen(bytes, offset);
        offset = lenInfo.nextOffset;
        const metaEnd = Math.min(trackEnd, offset + lenInfo.value);

        if (metaType === 0x51 && lenInfo.value === 3 && offset + 2 < trackEnd) {
          const usPerBeat = (bytes[offset] << 16) | (bytes[offset + 1] << 8) | bytes[offset + 2];
          tempos.push({ tick, microsecondsPerBeat: usPerBeat });
        } else if (metaType === 0x03 && t === 0 && lenInfo.value > 0) {
          const text = new TextDecoder().decode(bytes.slice(offset, metaEnd)).trim();
          if (text) parsedTitle = text;
        }
        offset = metaEnd;
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx
        const lenInfo = readVarLen(bytes, offset);
        offset = Math.min(trackEnd, lenInfo.nextOffset + lenInfo.value);
      } else {
        const eventType = status & 0xf0;
        const channel = status & 0x0f;
        if (eventType === 0xc0 || eventType === 0xd0) {
          offset += 1;
        } else if (eventType === 0x90) {
          const midi = bytes[offset++];
          const vel = bytes[offset++];
          if (channel !== 9) {
            // Skip GM percussion channel
            rawNotes.push({
              tick,
              midi,
              velocity: vel / 127,
              isOn: vel > 0,
              channel,
            });
          }
        } else if (eventType === 0x80) {
          const midi = bytes[offset++];
          offset++; // release velocity
          if (channel !== 9) {
            rawNotes.push({
              tick,
              midi,
              velocity: 0,
              isOn: false,
              channel,
            });
          }
        } else if (eventType === 0xb0) {
          const controller = bytes[offset++];
          const value = bytes[offset++];
          if (controller === 64) {
            rawPedals.push({ tick, active: value >= 64 });
          }
        } else {
          offset += 2;
        }
      }
    }

    offset = trackEnd;
  }

  tempos.sort((a, b) => a.tick - b.tick);
  rawNotes.sort((a, b) => a.tick - b.tick);
  rawPedals.sort((a, b) => a.tick - b.tick);

  const openNotes = new Map<string, { startTick: number; velocity: number }>();
  const notes: PianoNote[] = [];
  let noteSeq = 0;

  for (const ev of rawNotes) {
    const key = `${ev.channel}-${ev.midi}`;
    if (ev.isOn) {
      if (!openNotes.has(key)) {
        openNotes.set(key, { startTick: ev.tick, velocity: Math.max(0.2, ev.velocity) });
      }
    } else {
      const start = openNotes.get(key);
      if (start) {
        openNotes.delete(key);
        const startTime = ticksToSeconds(start.startTick, division, tempos);
        const endTime = ticksToSeconds(ev.tick, division, tempos);
        const duration = Math.max(0.08, endTime - startTime);
        notes.push({
          id: `midi-${noteSeq++}`,
          midi: Math.max(21, Math.min(108, ev.midi)),
          startTime,
          duration,
          velocity: start.velocity,
          hand: ev.midi < 60 ? 'left' : 'right',
        });
      }
    }
  }

  notes.sort((a, b) => a.startTime - b.startTime || a.midi - b.midi);

  const pedals: PedalEvent[] = rawPedals.map((p) => ({
    time: ticksToSeconds(p.tick, division, tempos),
    active: p.active,
  }));

  const firstTempoUs = tempos[0]?.microsecondsPerBeat ?? 500000;
  const bpm = Math.round(60_000_000 / firstTempoUs);
  const maxEnd = notes.reduce((acc, n) => Math.max(acc, n.startTime + n.duration), 0);

  if (notes.length === 0) {
    throw new Error('Không tìm thấy nốt piano hợp lệ trong tệp MIDI này.');
  }

  return {
    id: `midi-${Date.now()}`,
    title: parsedTitle,
    composer: 'MIDI đã nhập',
    era: 'Tùy chỉnh',
    difficulty: notes.length > 350 ? 'Concert' : 'Intermediate',
    keySignature: 'Tự động',
    bpm,
    duration: Math.max(1, maxEnd + 0.5),
    notes,
    pedals,
    source: 'midi',
    createdAt: Date.now(),
  };
}
