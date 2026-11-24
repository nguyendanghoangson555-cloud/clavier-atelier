import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import type { PresentationDeck } from '../types/presentation';
import { getTheme } from '../utils/deckThemes';
import { SlideRenderer } from './SlideRenderer';

interface PresenterOverlayProps {
  deck: PresentationDeck;
  initialIndex: number;
  onClose: () => void;
}

export const PresenterOverlay: React.FC<PresenterOverlayProps> = ({
  deck,
  initialIndex,
  onClose,
}) => {
  const [index, setIndex] = useState(
    Math.max(0, Math.min(deck.slides.length - 1, initialIndex))
  );
  const [showNotes, setShowNotes] = useState(false);

  const theme = getTheme(deck.themeId);
  const currentSlide = deck.slides[index];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIndex((i) => Math.min(deck.slides.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deck.slides.length, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chế độ trình chiếu toàn màn hình"
      className="fixed inset-0 z-50 flex flex-col bg-[#0E1117] text-white"
    >
      {/* Top control bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="text-xs font-medium text-white/80 truncate">{deck.title}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              showNotes
                ? 'border-white/40 bg-white/15 text-white'
                : 'border-white/15 text-white/75 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ghi chú</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thoát</span>
          </button>
        </div>
      </div>

      {/* Center Stage */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div className="w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl">
          <SlideRenderer
            slide={currentSlide}
            theme={theme}
            slideIndex={index}
            totalSlides={deck.slides.length}
          />
        </div>
      </div>

      {/* Optional Speaker Notes strip */}
      {showNotes && (
        <div className="border-t border-white/10 bg-[#151A24] px-6 py-3 text-xs text-white/85">
          <span className="font-semibold text-white">Ghi chú diễn giả: </span>
          {currentSlide.speakerNotes || 'Không có ghi chú cho trang này.'}
        </div>
      )}

      {/* Bottom Prev / Next bar */}
      <div className="flex items-center justify-center gap-4 border-t border-white/10 px-5 py-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3.5 text-xs font-medium text-white disabled:opacity-35 hover:bg-white/10 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>Trang trước</span>
        </button>

        <span className="font-mono-tabular text-xs text-white/80">
          {index + 1} / {deck.slides.length}
        </span>

        <button
          type="button"
          disabled={index === deck.slides.length - 1}
          onClick={() => setIndex((i) => Math.min(deck.slides.length - 1, i + 1))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3.5 text-xs font-medium text-white disabled:opacity-35 hover:bg-white/10 cursor-pointer"
        >
          <span>Trang sau</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
