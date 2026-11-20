import React, { useEffect, useRef } from 'react';
import type { HandMode, PedalEvent, PianoKeyDescriptor, PianoNote } from '../types/piano';
import { filterNotesByHand, getPedalStateAtTime, getUpcomingNotesInWindow } from '../utils/autoPianoEngine';

interface PianoRollCanvasProps {
  keys: PianoKeyDescriptor[];
  notes: PianoNote[];
  pedals: PedalEvent[];
  currentTimeRef: React.MutableRefObject<number>;
  displayTime: number;
  isPlaying: boolean;
  handMode: HandMode;
  transpose: number;
  lookaheadSeconds?: number;
  activePracticeNoteIds?: Set<string>;
}

export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({
  keys,
  notes,
  pedals,
  currentTimeRef,
  displayTime,
  isPlaying,
  handMode,
  transpose,
  lookaheadSeconds = 3.2,
  activePracticeNoteIds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so the render loop doesn't tear down on prop changes
  const propsRef = useRef({
    keys,
    notes,
    pedals,
    handMode,
    transpose,
    lookaheadSeconds,
    activePracticeNoteIds,
  });
  propsRef.current = {
    keys,
    notes,
    pedals,
    handMode,
    transpose,
    lookaheadSeconds,
    activePracticeNoteIds,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(160, Math.floor(rect.height));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    const drawFrame = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(160, Math.floor(rect.height));

      const {
        keys: currentKeys,
        notes: songNotes,
        pedals: songPedals,
        handMode: currentHandMode,
        transpose: currentTranspose,
        lookaheadSeconds: lookahead,
        activePracticeNoteIds: practiceIds,
      } = propsRef.current;

      const t = currentTimeRef.current;

      // 1. Acoustic stage background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0D0E12');
      bgGrad.addColorStop(1, '#151820');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Build quick lookup from midi -> key descriptor
      const keyMap = new Map<number, PianoKeyDescriptor>();
      for (const k of currentKeys) {
        keyMap.set(k.midi, k);
      }

      // 2. Vertical octave & white-key guide lanes
      for (const k of currentKeys) {
        if (k.isBlack) continue;
        const x = k.xRatio * width;
        if (k.pitchClass === 'C') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          ctx.fillStyle = 'rgba(243, 241, 236, 0.30)';
          ctx.font = '500 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(k.noteName, x + 5, height - 10);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      // 3. Horizontal beat-grid time lines (every 0.5s)
      const pixelsPerSec = height / lookahead;
      const firstGrid = Math.ceil(t * 2) / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let g = firstGrid; g <= t + lookahead; g += 0.5) {
        const y = height - (g - t) * pixelsPerSec;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4. Sustain pedal subtle amber tint along bottom edge when active
      const pedalDown = getPedalStateAtTime(songPedals, t);
      if (pedalDown) {
        const pedalGrad = ctx.createLinearGradient(0, height - 28, 0, height);
        pedalGrad.addColorStop(0, 'rgba(229, 169, 60, 0)');
        pedalGrad.addColorStop(1, 'rgba(229, 169, 60, 0.16)');
        ctx.fillStyle = pedalGrad;
        ctx.fillRect(0, height - 28, width, 28);
      }

      // 5. Render falling notes
      const filteredNotes = filterNotesByHand(songNotes, currentHandMode);
      const visibleNotes = getUpcomingNotesInWindow(filteredNotes, t, lookahead, currentTranspose);

      for (const note of visibleNotes) {
        const key = keyMap.get(note.effectiveMidi);
        if (!key) continue;

        const pad = key.isBlack ? 1 : 1.5;
        const x = key.xRatio * width + pad;
        const w = Math.max(4, key.widthRatio * width - pad * 2);

        const bottomY = height - (note.startTime - t) * pixelsPerSec;
        const noteHeight = Math.max(10, note.duration * pixelsPerSec - 2);
        const topY = bottomY - noteHeight;

        const isActive = t >= note.startTime && t < note.startTime + note.duration;
        const isPracticeTarget = practiceIds?.has(note.id) ?? false;

        // Color coding: Right hand warm amber gold (#E5A93C), Left hand cool cerulean (#4EA8DE)
        const isRight = note.hand === 'right';
        let fillTop = isRight ? '#F0BA54' : '#63B7E8';
        let fillBottom = isRight ? '#C58319' : '#2C7DB2';

        if (key.isBlack) {
          fillTop = isRight ? '#D99422' : '#4595C6';
          fillBottom = isRight ? '#9B650D' : '#20608B';
        }

        const clampedBottom = Math.min(height, bottomY);
        const clampedTop = Math.max(-20, topY);
        const clampedHeight = clampedBottom - clampedTop;
        if (clampedHeight <= 0) continue;

        const grad = ctx.createLinearGradient(0, clampedTop, 0, clampedBottom);
        grad.addColorStop(0, fillTop);
        grad.addColorStop(1, fillBottom);

        ctx.save();
        if (isActive || isPracticeTarget) {
          ctx.shadowColor = isRight ? 'rgba(229, 169, 60, 0.55)' : 'rgba(99, 183, 232, 0.55)';
          ctx.shadowBlur = 12;
        }

        const radius = Math.min(5, w / 2, clampedHeight / 2);
        ctx.beginPath();
        ctx.roundRect(x, clampedTop, w, clampedHeight, radius);
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp highlight cap at the top edge of the bar
        ctx.strokeStyle = isActive || isPracticeTarget
          ? '#FFFFFF'
          : isRight
            ? 'rgba(255, 236, 194, 0.45)'
            : 'rgba(196, 234, 255, 0.45)';
        ctx.lineWidth = isPracticeTarget ? 1.8 : 1;
        ctx.stroke();

        // Subtle note label inside wide enough notes
        if (w >= 18 && clampedHeight >= 18) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(17, 18, 21, 0.85)';
          ctx.font = '600 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(key.noteName, x + w / 2, clampedBottom - 5);
        }
        ctx.restore();

        // Strike flash on the bottom impact rail
        if (isActive) {
          ctx.fillStyle = isRight ? 'rgba(240, 186, 84, 0.85)' : 'rgba(99, 183, 232, 0.85)';
          ctx.fillRect(x, height - 3, w, 3);
        }
      }

      // 6. Strike line felt rail at bottom
      ctx.fillStyle = '#5B1E24'; // Traditional grand piano red felt rail
      ctx.fillRect(0, height - 3, width, 3);
    };

    const observer = new ResizeObserver(() => {
      resizeCanvas();
      drawFrame();
    });
    observer.observe(container);
    resizeCanvas();
    drawFrame();

    if (isPlaying) {
      const loop = () => {
        drawFrame();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [
    currentTimeRef,
    displayTime,
    isPlaying,
    keys,
    notes,
    pedals,
    handMode,
    transpose,
    lookaheadSeconds,
    activePracticeNoteIds,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative h-[220px] sm:h-[270px] lg:h-[310px] w-full overflow-hidden bg-[#0D0E12]"
    >
      <canvas
        ref={canvasRef}
        data-testid="piano-roll-canvas"
        className="block h-full w-full"
        aria-label="Bảng hiển thị nốt rơi tự động"
      />
      {/* Legend overlay */}
      <div className="pointer-events-none absolute right-3 top-2.5 flex items-center gap-4 text-[11px] font-medium text-[#A3A8B4]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-xs bg-[#E5A93C]" aria-hidden="true" />
          Tay phải
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-xs bg-[#53AEE3]" aria-hidden="true" />
          Tay trái
        </span>
      </div>
    </div>
  );
};
