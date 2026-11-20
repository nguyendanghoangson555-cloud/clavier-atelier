import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { KeyboardGuideSection } from './components/KeyboardGuideSection';
import { PianoKeyboard } from './components/PianoKeyboard';
import { PianoRollCanvas } from './components/PianoRollCanvas';
import { RepertoirePanel } from './components/RepertoirePanel';
import { TransportControls } from './components/TransportControls';
import type {
  HandMode,
  HandSide,
  KeyboardRangeMode,
  PianoVoice,
  RecordedKeystroke,
  SongPiece,
} from './types/piano';
import {
  filterNotesByHand,
  findNextPracticeTarget,
  getActiveNotesAtTime,
  getPedalStateAtTime,
  quantizeRecordedNotes,
} from './utils/autoPianoEngine';
import { parseMidiFile } from './utils/midiParser';
import {
  detectChord,
  generatePianoKeys,
  getMidiToQwertyLabelMap,
  getQwertyToMidiMap,
} from './utils/musicTheory';
import { pianoAudio } from './utils/pianoAudio';
import { BUILTIN_REPERTOIRE } from './utils/repertoire';

const RECORDINGS_STORAGE_KEY = 'clavier_atelier_recordings_v1';

function loadSavedRecordings(): SongPiece[] {
  try {
    const raw = window.localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [songs, setSongs] = useState<SongPiece[]>(BUILTIN_REPERTOIRE);
  const [recordings, setRecordings] = useState<SongPiece[]>(() => loadSavedRecordings());
  const [activeSongId, setActiveSongId] = useState<string>(BUILTIN_REPERTOIRE[0].id);

  const [activeView, setActiveView] = useState<'studio' | 'repertoire' | 'recordings' | 'guide'>('studio');
  const [libraryTab, setLibraryTab] = useState<'repertoire' | 'recordings'>('repertoire');

  // Playback & studio parameters
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    }
    return false;
  });
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [transpose, setTranspose] = useState<number>(0);
  const [waitMode, setWaitMode] = useState<boolean>(false);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(false);
  const [manualSustain, setManualSustain] = useState<boolean>(false);
  const [autoPedalActive, setAutoPedalActive] = useState<boolean>(false);
  const [handMode, setHandMode] = useState<HandMode>('both');
  const [voice, setVoice] = useState<PianoVoice>('grand');
  const [volume, setVolume] = useState<number>(0.78);
  const [keyboardRange, setKeyboardRange] = useState<KeyboardRangeMode>('61');
  const [showNoteLabels, setShowNoteLabels] = useState<boolean>(true);
  const [showQwertyHints, setShowQwertyHints] = useState<boolean>(true);
  const [baseOctave, setBaseOctave] = useState<number>(3);
  const [midiError, setMidiError] = useState<string | null>(null);

  // Live keys & recording state
  const [activeManualMidis, setActiveManualMidis] = useState<Set<number>>(() => new Set());
  const [activeAutoNotes, setActiveAutoNotes] = useState<Map<number, HandSide>>(() => new Map());
  const [practiceTargetIds, setPracticeTargetIds] = useState<Set<string>>(() => new Set());
  const [practiceTargetMidis, setPracticeTargetMidis] = useState<Set<number>>(() => new Set());
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const repertoireSectionRef = useRef<HTMLDivElement | null>(null);

  // Playback refs for zero-jitter 60fps loop
  const currentTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const completedPracticeIdsRef = useRef<Set<string>>(new Set());
  const openRecordedKeystrokesRef = useRef<Map<number, { startTimeMs: number; velocity: number }>>(
    new Map()
  );
  const finishedRecordedKeystrokesRef = useRef<RecordedKeystroke[]>([]);

  const activeSong = useMemo(() => {
    return (
      songs.find((s) => s.id === activeSongId) ??
      recordings.find((r) => r.id === activeSongId) ??
      songs[0]
    );
  }, [songs, recordings, activeSongId]);

  const filteredSongNotes = useMemo(
    () => filterNotesByHand(activeSong.notes, handMode),
    [activeSong.notes, handMode]
  );

  // Keyboard geometry: 61-key (C2=36..C7=96) or 88-key (A0=21..C8=108)
  const { keys } = useMemo(() => {
    return keyboardRange === '61' ? generatePianoKeys(36, 96) : generatePianoKeys(21, 108);
  }, [keyboardRange]);

  const qwertyToMidi = useMemo(() => getQwertyToMidiMap(baseOctave), [baseOctave]);
  const qwertyHints = useMemo(() => getMidiToQwertyLabelMap(baseOctave), [baseOctave]);

  // Persist recordings
  useEffect(() => {
    try {
      window.localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(recordings));
    } catch {
      // Ignore quota issues
    }
  }, [recordings]);

  // Sync audio volume & voice
  useEffect(() => {
    pianoAudio.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    pianoAudio.setVoice(voice);
  }, [voice]);

  useEffect(() => {
    pianoAudio.setSustain(manualSustain || (isPlaying && autoPedalActive));
  }, [manualSustain, autoPedalActive, isPlaying]);

  // Helper to update auto-keyboard visual state at any timestamp
  const syncVisualKeysAtTime = useCallback(
    (timeSec: number) => {
      const active = getActiveNotesAtTime(filteredSongNotes, timeSec, transpose);
      const nextMap = new Map<number, HandSide>();
      for (const n of active) {
        nextMap.set(n.effectiveMidi, n.hand);
      }
      setActiveAutoNotes(nextMap);
      setAutoPedalActive(getPedalStateAtTime(activeSong.pedals, timeSec));
    },
    [filteredSongNotes, activeSong.pedals, transpose]
  );

  const handleRestart = useCallback(() => {
    pianoAudio.stopAll();
    currentTimeRef.current = 0;
    completedPracticeIdsRef.current.clear();
    setDisplayTime(0);
    setPracticeTargetIds(new Set());
    setPracticeTargetMidis(new Set());
    syncVisualKeysAtTime(0);
  }, [syncVisualKeysAtTime]);

  const handleSeek = useCallback(
    (timeSec: number) => {
      pianoAudio.stopAll();
      const clamped = Math.max(0, Math.min(activeSong.duration, timeSec));
      currentTimeRef.current = clamped;
      completedPracticeIdsRef.current.clear();
      for (const n of filteredSongNotes) {
        if (n.startTime < clamped - 0.05) {
          completedPracticeIdsRef.current.add(n.id);
        }
      }
      setDisplayTime(clamped);
      syncVisualKeysAtTime(clamped);
    },
    [activeSong.duration, filteredSongNotes, syncVisualKeysAtTime]
  );

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        pianoAudio.stopAll();
        return false;
      }
      if (currentTimeRef.current >= activeSong.duration - 0.15) {
        currentTimeRef.current = 0;
        completedPracticeIdsRef.current.clear();
        setDisplayTime(0);
      }
      return true;
    });
  }, [activeSong.duration]);

  const handleSelectSong = useCallback(
    (song: SongPiece, autoPlay = false) => {
      pianoAudio.stopAll();
      setActiveSongId(song.id);
      currentTimeRef.current = 0;
      completedPracticeIdsRef.current.clear();
      setDisplayTime(0);
      setActiveAutoNotes(new Map());
      setPracticeTargetIds(new Set());
      setPracticeTargetMidis(new Set());
      setAutoPedalActive(false);
      setIsPlaying(autoPlay);
      setMidiError(null);
    },
    []
  );

  // Manual key press / release (mouse, touch, or QWERTY)
  const handleManualKeyDown = useCallback(
    (midi: number) => {
      pianoAudio.noteOn(`manual-${midi}`, midi, 0.82);

      setActiveManualMidis((prev) => {
        if (prev.has(midi)) return prev;
        const next = new Set(prev);
        next.add(midi);
        return next;
      });

      if (isRecording) {
        if (!openRecordedKeystrokesRef.current.has(midi)) {
          openRecordedKeystrokesRef.current.set(midi, {
            startTimeMs: performance.now(),
            velocity: 0.82,
          });
        }
      }

      // Check Wait-for-Note Practice mode advancement
      if (waitMode && isPlayingRef.current) {
        const target = findNextPracticeTarget(
          filteredSongNotes,
          currentTimeRef.current,
          completedPracticeIdsRef.current
        );
        if (target) {
          const matchingNote = target.requiredNotes.find(
            (n) => Math.max(21, Math.min(108, n.midi + transpose)) === midi
          );
          if (matchingNote) {
            completedPracticeIdsRef.current.add(matchingNote.id);
            const remaining = target.requiredNotes.filter(
              (n) => !completedPracticeIdsRef.current.has(n.id)
            );
            if (remaining.length === 0) {
              setPracticeTargetIds(new Set());
              setPracticeTargetMidis(new Set());
              // Nudge slightly past targetTime so clock flows smoothly into next phrase
              currentTimeRef.current = Math.max(currentTimeRef.current, target.targetTime + 0.02);
            } else {
              setPracticeTargetIds(new Set(remaining.map((n) => n.id)));
              setPracticeTargetMidis(
                new Set(remaining.map((n) => Math.max(21, Math.min(108, n.midi + transpose))))
              );
            }
          }
        }
      }
    },
    [isRecording, waitMode, filteredSongNotes, transpose]
  );

  const handleManualKeyUp = useCallback(
    (midi: number) => {
      pianoAudio.noteOff(`manual-${midi}`);

      setActiveManualMidis((prev) => {
        if (!prev.has(midi)) return prev;
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });

      if (isRecording) {
        const open = openRecordedKeystrokesRef.current.get(midi);
        if (open) {
          openRecordedKeystrokesRef.current.delete(midi);
          finishedRecordedKeystrokesRef.current.push({
            midi,
            startTimeMs: open.startTimeMs,
            endTimeMs: performance.now(),
            velocity: open.velocity,
          });
        }
      }
    },
    [isRecording]
  );

  // Toggle Studio Recording
  const handleToggleRecord = useCallback(() => {
    if (!isRecording) {
      openRecordedKeystrokesRef.current.clear();
      finishedRecordedKeystrokesRef.current = [];
      setIsRecording(true);
    } else {
      const nowMs = performance.now();
      for (const [midi, open] of openRecordedKeystrokesRef.current.entries()) {
        finishedRecordedKeystrokesRef.current.push({
          midi,
          startTimeMs: open.startTimeMs,
          endTimeMs: nowMs,
          velocity: open.velocity,
        });
      }
      openRecordedKeystrokesRef.current.clear();
      setIsRecording(false);

      const newPiece = quantizeRecordedNotes(
        finishedRecordedKeystrokesRef.current,
        `Bản thu #${recordings.length + 1}`
      );
      if (newPiece) {
        setRecordings((prev) => [newPiece, ...prev]);
        setActiveSongId(newPiece.id);
        currentTimeRef.current = 0;
        setDisplayTime(0);
        setLibraryTab('recordings');
        setActiveView('recordings');
      }
    }
  }, [isRecording, recordings.length]);

  // Main Auto-Piano Scheduler Loop
  useEffect(() => {
    if (!isPlaying) return;

    let rafId = 0;
    let lastTs = performance.now();
    let lastUiSyncTs = 0;
    let lastBeatIdx = -1;
    const triggeredNoteIds = new Set<string>();
    const activeAutoIds = new Set<string>();

    // Seed already-passed notes so seeking doesn't burst old notes
    for (const n of filteredSongNotes) {
      if (n.startTime < currentTimeRef.current - 0.04) {
        triggeredNoteIds.add(n.id);
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - lastTs) / 1000);
      lastTs = now;

      let prevTime = currentTimeRef.current;
      let nextTime = prevTime + dt * speed;
      let waitingForUser = false;

      // Practice Wait-for-Note logic
      if (waitMode) {
        const target = findNextPracticeTarget(
          filteredSongNotes,
          prevTime,
          completedPracticeIdsRef.current
        );
        if (target && nextTime >= target.targetTime) {
          nextTime = target.targetTime;
          waitingForUser = true;
          const nextIds = new Set(target.requiredNotes.map((n) => n.id));
          const nextMidis = new Set(
            target.requiredNotes.map((n) => Math.max(21, Math.min(108, n.midi + transpose)))
          );
          setPracticeTargetIds(nextIds);
          setPracticeTargetMidis(nextMidis);
        }
      } else {
        setPracticeTargetIds((prev) => (prev.size > 0 ? new Set() : prev));
        setPracticeTargetMidis((prev) => (prev.size > 0 ? new Set() : prev));
      }

      if (!waitingForUser) {
        // Trigger notes crossing startTime
        for (const n of filteredSongNotes) {
          if (!triggeredNoteIds.has(n.id) && n.startTime <= nextTime && n.startTime >= prevTime - 0.08) {
            triggeredNoteIds.add(n.id);
            activeAutoIds.add(n.id);
            const effectiveMidi = Math.max(21, Math.min(108, n.midi + transpose));
            pianoAudio.noteOn(`auto-${n.id}`, effectiveMidi, n.velocity);
          }

          if (activeAutoIds.has(n.id) && n.startTime + n.duration <= nextTime) {
            activeAutoIds.delete(n.id);
            pianoAudio.noteOff(`auto-${n.id}`);
          }
        }

        // Metronome pulse
        if (metronomeEnabled && activeSong.bpm > 0) {
          const secPerBeat = 60 / activeSong.bpm;
          const beatIdx = Math.floor(nextTime / secPerBeat);
          if (beatIdx !== lastBeatIdx && beatIdx >= 0) {
            lastBeatIdx = beatIdx;
            pianoAudio.playMetronomeTick(beatIdx % 4 === 0);
          }
        }
      }

      // End of song or loop
      if (nextTime >= activeSong.duration) {
        if (loopEnabled) {
          pianoAudio.stopAll();
          triggeredNoteIds.clear();
          activeAutoIds.clear();
          completedPracticeIdsRef.current.clear();
          nextTime = 0;
          prevTime = 0;
          lastBeatIdx = -1;
        } else {
          currentTimeRef.current = activeSong.duration;
          setDisplayTime(activeSong.duration);
          setActiveAutoNotes(new Map());
          setAutoPedalActive(false);
          pianoAudio.stopAll();
          setIsPlaying(false);
          return;
        }
      }

      currentTimeRef.current = nextTime;

      // Throttle React DOM state updates to ~20fps for crisp UI without 60Hz React churn
      if (now - lastUiSyncTs >= 50) {
        lastUiSyncTs = now;
        setDisplayTime(nextTime);
        syncVisualKeysAtTime(nextTime);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [
    isPlaying,
    speed,
    transpose,
    waitMode,
    loopEnabled,
    metronomeEnabled,
    filteredSongNotes,
    activeSong.bpm,
    activeSong.duration,
    syncVisualKeysAtTime,
  ]);

  // Global QWERTY Keyboard Listener
  useEffect(() => {
    const heldQwerty = new Map<string, number>();

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) handleTogglePlay();
        return;
      }

      if (e.key === 'Shift') {
        if (!e.repeat) setManualSustain(true);
        return;
      }

      if (e.key === '[' && !e.repeat) {
        setBaseOctave((o) => Math.max(1, o - 1));
        return;
      }
      if (e.key === ']' && !e.repeat) {
        setBaseOctave((o) => Math.min(5, o + 1));
        return;
      }

      const keyLower = e.key.toLowerCase();
      const midi = qwertyToMidi[keyLower];
      if (midi !== undefined && !e.repeat && !heldQwerty.has(keyLower)) {
        e.preventDefault();
        heldQwerty.set(keyLower, midi);
        handleManualKeyDown(midi);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setManualSustain(false);
        return;
      }
      const keyLower = e.key.toLowerCase();
      const midi = heldQwerty.get(keyLower);
      if (midi !== undefined) {
        heldQwerty.delete(keyLower);
        handleManualKeyUp(midi);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [qwertyToMidi, handleManualKeyDown, handleManualKeyUp, handleTogglePlay]);

  // MIDI file upload handler
  const handleUploadMidiFile = useCallback(
    async (file: File) => {
      try {
        setMidiError(null);
        const buffer = await file.arrayBuffer();
        const parsedSong = parseMidiFile(buffer, file.name);
        setSongs((prev) => [parsedSong, ...prev]);
        handleSelectSong(parsedSong, true);
      } catch (err) {
        setMidiError(err instanceof Error ? err.message : 'Không thể đọc tệp MIDI này.');
      }
    },
    [handleSelectSong]
  );

  const handleHeaderViewSelect = (view: 'studio' | 'repertoire' | 'recordings' | 'guide') => {
    setActiveView(view);
    if (view === 'repertoire') {
      setLibraryTab('repertoire');
      repertoireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (view === 'recordings') {
      setLibraryTab('recordings');
      repertoireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (view === 'guide') {
      repertoireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Combined active MIDI notes for live chord readout
  const combinedActiveMidis = useMemo(() => {
    const all = new Set<number>(activeManualMidis);
    for (const midi of activeAutoNotes.keys()) {
      all.add(midi);
    }
    return [...all];
  }, [activeManualMidis, activeAutoNotes]);

  const chordDisplay = useMemo(() => detectChord(combinedActiveMidis), [combinedActiveMidis]);
  const sustainVisualActive = manualSustain || (isPlaying && autoPedalActive);
  const playbackStateAttr = isPlaying
    ? practiceTargetIds.size > 0
      ? 'waiting'
      : 'playing'
    : 'paused';

  return (
    <div
      data-state={playbackStateAttr}
      className="min-h-screen bg-[#111215] text-[#F3F1EC] flex flex-col"
    >
      <Header
        activeView={activeView}
        onSelectView={handleHeaderViewSelect}
        onTriggerMidiImport={() => fileInputRef.current?.click()}
      />

      {/* Hidden global MIDI file input triggered by Header CTA */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mid,.midi"
        aria-label="Nhập tệp MIDI chuẩn"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleUploadMidiFile(f);
            e.target.value = '';
          }
        }}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-5 px-4 py-5 sm:px-6">
        {/* Piece Title & Live Chord / Pedal Readout Strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#F6F3EC] text-balance">
              {activeSong.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF]">
              <span>{activeSong.composer}</span>
              <span aria-hidden="true" className="mx-2 text-[#4B5563]">
                ·
              </span>
              <span>{activeSong.era}</span>
              <span aria-hidden="true" className="mx-2 text-[#4B5563]">
                ·
              </span>
              <span>{activeSong.keySignature}</span>
              <span aria-hidden="true" className="mx-2 text-[#4B5563]">
                ·
              </span>
              <span className="font-mono-tabular whitespace-nowrap">
                {Math.round(activeSong.bpm * speed)} BPM
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-[#23262E] pt-2.5 sm:border-t-0 sm:pt-0">
            <div>
              <div className="text-[11px] font-medium text-[#8B92A0]">Hòa âm hiện tại</div>
              <div
                data-testid="chord-readout"
                className="font-mono-tabular text-sm font-medium text-[#F6F3EC]"
              >
                {chordDisplay}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-[#8B92A0]">Bàn đạp ngân</div>
              <div
                data-testid="pedal-readout"
                className={`font-mono-tabular text-sm font-medium ${
                  sustainVisualActive ? 'text-[#E5A93C]' : 'text-[#6B7280]'
                }`}
              >
                {sustainVisualActive ? 'Đang giữ' : 'Đang nhả'}
              </div>
            </div>
            {waitMode && practiceTargetMidis.size > 0 && (
              <div>
                <div className="text-[11px] font-medium text-[#E5A93C]">Gợi ý tập đàn</div>
                <div className="text-sm font-medium text-[#F6D08A]">
                  Bấm phím đang sáng
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transport & Studio Deck */}
        <TransportControls
          isPlaying={isPlaying}
          isRecording={isRecording}
          currentTime={displayTime}
          duration={activeSong.duration}
          speed={speed}
          transpose={transpose}
          waitMode={waitMode}
          loopEnabled={loopEnabled}
          metronomeEnabled={metronomeEnabled}
          sustainHeld={manualSustain}
          handMode={handMode}
          voice={voice}
          volume={volume}
          keyboardRange={keyboardRange}
          showNoteLabels={showNoteLabels}
          showQwertyHints={showQwertyHints}
          baseOctave={baseOctave}
          onTogglePlay={handleTogglePlay}
          onRestart={handleRestart}
          onSeek={handleSeek}
          onChangeSpeed={setSpeed}
          onChangeTranspose={(delta) => setTranspose((t) => Math.max(-6, Math.min(6, t + delta)))}
          onToggleWaitMode={() => setWaitMode((w) => !w)}
          onToggleLoop={() => setLoopEnabled((l) => !l)}
          onToggleMetronome={() => setMetronomeEnabled((m) => !m)}
          onToggleSustain={() => setManualSustain((s) => !s)}
          onChangeHandMode={setHandMode}
          onChangeVoice={setVoice}
          onChangeVolume={setVolume}
          onChangeRange={setKeyboardRange}
          onToggleNoteLabels={() => setShowNoteLabels((v) => !v)}
          onToggleQwertyHints={() => setShowQwertyHints((v) => !v)}
          onChangeOctave={(delta) => setBaseOctave((o) => Math.max(1, Math.min(5, o + delta)))}
          onToggleRecord={handleToggleRecord}
        />

        {/* Primary Focal Anchor: Falling-Note Piano Roll + Interactive Piano Keyboard */}
        <div className="w-full overflow-x-auto rounded-xl border border-[#282B33] bg-[#14161B] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]">
          <div className={`flex flex-col w-full ${keyboardRange === '88' ? 'min-w-[980px]' : 'min-w-[760px]'}`}>
            <PianoRollCanvas
              keys={keys}
              notes={activeSong.notes}
              pedals={activeSong.pedals}
              currentTimeRef={currentTimeRef}
              displayTime={displayTime}
              isPlaying={isPlaying}
              handMode={handMode}
              transpose={transpose}
              activePracticeNoteIds={practiceTargetIds}
            />
            <PianoKeyboard
              keys={keys}
              activeAutoNotes={activeAutoNotes}
              activeManualMidis={activeManualMidis}
              practiceTargetMidis={practiceTargetMidis}
              qwertyHints={qwertyHints}
              showNoteLabels={showNoteLabels}
              showQwertyHints={showQwertyHints}
              onKeyDown={handleManualKeyDown}
              onKeyUp={handleManualKeyUp}
            />
          </div>
        </div>

        {/* Repertoire / Recordings / Keyboard Guide Section */}
        <div ref={repertoireSectionRef}>
          {activeView === 'guide' ? (
            <KeyboardGuideSection
              baseOctave={baseOctave}
              onClose={() => setActiveView('studio')}
            />
          ) : (
            <RepertoirePanel
              songs={songs}
              recordings={recordings}
              activeSongId={activeSong.id}
              activeTab={libraryTab}
              onChangeTab={setLibraryTab}
              onSelectSong={handleSelectSong}
              onDeleteRecording={(id) =>
                setRecordings((prev) => prev.filter((r) => r.id !== id))
              }
              onUploadMidiFile={handleUploadMidiFile}
              midiError={midiError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
