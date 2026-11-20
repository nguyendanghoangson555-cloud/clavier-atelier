import React, { useRef } from 'react';
import type { HandSide, PianoKeyDescriptor } from '../types/piano';

interface PianoKeyboardProps {
  keys: PianoKeyDescriptor[];
  activeAutoNotes: Map<number, HandSide>;
  activeManualMidis: Set<number>;
  practiceTargetMidis: Set<number>;
  qwertyHints: Record<number, string>;
  showNoteLabels: boolean;
  showQwertyHints: boolean;
  onKeyDown: (midi: number) => void;
  onKeyUp: (midi: number) => void;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  keys,
  activeAutoNotes,
  activeManualMidis,
  practiceTargetMidis,
  qwertyHints,
  showNoteLabels,
  showQwertyHints,
  onKeyDown,
  onKeyUp,
}) => {
  const isPointerDownRef = useRef(false);
  const pointerMidiRef = useRef<number | null>(null);

  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  const handlePointerStart = (midi: number, e: React.PointerEvent) => {
    e.preventDefault();
    isPointerDownRef.current = true;
    if (pointerMidiRef.current !== null && pointerMidiRef.current !== midi) {
      onKeyUp(pointerMidiRef.current);
    }
    pointerMidiRef.current = midi;
    onKeyDown(midi);
  };

  const handlePointerEnter = (midi: number) => {
    if (!isPointerDownRef.current) return;
    if (pointerMidiRef.current !== null && pointerMidiRef.current !== midi) {
      onKeyUp(pointerMidiRef.current);
    }
    pointerMidiRef.current = midi;
    onKeyDown(midi);
  };

  const handlePointerEnd = () => {
    isPointerDownRef.current = false;
    if (pointerMidiRef.current !== null) {
      onKeyUp(pointerMidiRef.current);
      pointerMidiRef.current = null;
    }
  };

  return (
    <div
      className="relative w-full select-none bg-[#14161B]"
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        data-testid="piano-keyboard"
        className="relative h-[168px] sm:h-[195px] w-full"
      >
        {/* White Keys */}
        {whiteKeys.map((key) => {
          const autoHand = activeAutoNotes.get(key.midi);
          const isManual = activeManualMidis.has(key.midi);
          const isPractice = practiceTargetMidis.has(key.midi);
          const isPressed = Boolean(autoHand) || isManual;
          const hint = qwertyHints[key.midi];

          let bgClass =
            'bg-gradient-to-b from-[#F4F1EA] via-[#FAF8F2] to-[#E8E3D8] hover:from-[#FAF8F3] hover:to-[#EFECE3]';
          if (isManual) {
            bgClass = 'bg-gradient-to-b from-[#F5C66D] to-[#E09B24]';
          } else if (autoHand === 'right') {
            bgClass = 'bg-gradient-to-b from-[#F5C76F] to-[#DE9A25]';
          } else if (autoHand === 'left') {
            bgClass = 'bg-gradient-to-b from-[#85CCF2] to-[#3B95CA]';
          } else if (isPractice) {
            bgClass = 'bg-gradient-to-b from-[#FCE6B8] to-[#F3CA7A]';
          }

          return (
            <button
              key={key.midi}
              type="button"
              aria-label={`Phím ${key.noteName}`}
              data-midi={key.midi}
              data-active={isPressed ? 'true' : 'false'}
              onPointerDown={(e) => handlePointerStart(key.midi, e)}
              onPointerEnter={() => handlePointerEnter(key.midi)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!e.repeat) onKeyDown(key.midi);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onKeyUp(key.midi);
                }
              }}
              style={{
                left: `${key.xRatio * 100}%`,
                width: `${key.widthRatio * 100}%`,
              }}
              className={`absolute top-0 bottom-0 border-r border-[#C9C3B6] last:border-r-0 rounded-b-[5px] flex flex-col items-center justify-end pb-2.5 transition-transform duration-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E5A93C] ${bgClass} ${
                isPressed
                  ? 'translate-y-[2px] shadow-[inset_0_3px_8px_rgba(0,0,0,0.35)]'
                  : 'shadow-[inset_0_-4px_0_rgba(0,0,0,0.12)]'
              }`}
            >
              {isPractice && !isPressed && (
                <span
                  className="mb-1.5 h-2 w-2 rounded-full bg-[#B45309]"
                  aria-hidden="true"
                />
              )}
              {showQwertyHints && hint && (
                <span
                  className={`mb-0.5 text-[9px] font-mono-tabular font-semibold leading-none ${
                    isPressed ? 'text-[#111215]' : 'text-[#6B7280]'
                  }`}
                >
                  {hint}
                </span>
              )}
              {(showNoteLabels || key.pitchClass === 'C') && (
                <span
                  className={`text-[10px] font-mono-tabular leading-none ${
                    isPressed
                      ? 'font-semibold text-[#111215]'
                      : key.pitchClass === 'C'
                        ? 'font-semibold text-[#374151]'
                        : 'text-[#78756C]'
                  }`}
                >
                  {key.noteName}
                </span>
              )}
            </button>
          );
        })}

        {/* Black Keys */}
        {blackKeys.map((key) => {
          const autoHand = activeAutoNotes.get(key.midi);
          const isManual = activeManualMidis.has(key.midi);
          const isPractice = practiceTargetMidis.has(key.midi);
          const isPressed = Boolean(autoHand) || isManual;
          const hint = qwertyHints[key.midi];

          let bgClass =
            'bg-gradient-to-b from-[#2B2E36] via-[#18191F] to-[#0D0E12] border-[#0A0B0E]';
          if (isManual || autoHand === 'right') {
            bgClass = 'bg-gradient-to-b from-[#E5A93C] to-[#9E6810] border-[#6E4707]';
          } else if (autoHand === 'left') {
            bgClass = 'bg-gradient-to-b from-[#53AEE3] to-[#1D6A9A] border-[#134B6E]';
          } else if (isPractice) {
            bgClass = 'bg-gradient-to-b from-[#B47D22] to-[#714D12] border-[#4A320A]';
          }

          return (
            <button
              key={key.midi}
              type="button"
              aria-label={`Phím ${key.noteName}`}
              data-midi={key.midi}
              data-active={isPressed ? 'true' : 'false'}
              onPointerDown={(e) => handlePointerStart(key.midi, e)}
              onPointerEnter={() => handlePointerEnter(key.midi)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!e.repeat) onKeyDown(key.midi);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onKeyUp(key.midi);
                }
              }}
              style={{
                left: `${key.xRatio * 100}%`,
                width: `${key.widthRatio * 100}%`,
              }}
              className={`absolute top-0 z-10 h-[62%] rounded-b-[4px] border-x border-b flex flex-col items-center justify-end pb-2 transition-transform duration-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${bgClass} ${
                isPressed
                  ? 'translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.65)]'
                  : 'shadow-[0_6px_12px_rgba(0,0,0,0.75),inset_0_-3px_0_rgba(255,255,255,0.08)]'
              }`}
            >
              {showQwertyHints && hint && (
                <span
                  className={`text-[8px] font-mono-tabular font-semibold leading-none ${
                    isPressed ? 'text-[#111215]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
