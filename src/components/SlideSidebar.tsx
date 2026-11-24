import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import type { SlideData, SlideLayout, SlideTheme } from '../types/presentation';
import { LAYOUT_LABELS } from '../utils/deckModel';
import { SlideRenderer } from './SlideRenderer';

interface SlideSidebarProps {
  slides: SlideData[];
  activeSlideId: string;
  theme: SlideTheme;
  onSelectSlide: (id: string) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onMoveSlide: (fromIdx: number, toIdx: number) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
}

export const SlideSidebar: React.FC<SlideSidebarProps> = ({
  slides,
  activeSlideId,
  theme,
  onSelectSlide,
  onAddSlide,
  onMoveSlide,
  onDuplicateSlide,
  onDeleteSlide,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <aside
      aria-label="Danh sách slide"
      className="flex flex-col rounded-xl border border-[#E3E0D8] bg-white lg:w-64 lg:shrink-0"
    >
      <div className="flex items-center justify-between border-b border-[#EDEBE4] px-3.5 py-3">
        <span className="text-xs font-semibold text-[#14171F]">
          Các trang ({slides.length})
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-[#DCD8CE] bg-[#FAF9F6] px-2.5 py-1 text-xs font-medium text-[#14171F] hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thêm slide</span>
          </button>

          {showAddMenu && (
            <div
              role="menu"
              aria-label="Chọn bố cục slide mới"
              className="absolute right-0 top-9 z-30 w-48 rounded-lg border border-[#E3E0D8] bg-white p-1 shadow-lg"
            >
              {(Object.keys(LAYOUT_LABELS) as SlideLayout[]).map((layout) => (
                <button
                  key={layout}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAddSlide(layout);
                    setShowAddMenu(false);
                  }}
                  className="flex w-full items-center rounded-md px-3 py-1.5 text-left text-xs font-medium text-[#2A2F3B] hover:bg-[#F3F2EE] hover:text-[#1E40AF] cursor-pointer"
                >
                  {LAYOUT_LABELS[layout]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal scroll on mobile, vertical rail on desktop */}
      <div className="flex gap-3 overflow-x-auto p-3 lg:max-h-[680px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        {slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          return (
            <div
              key={slide.id}
              className={`group flex shrink-0 flex-col gap-1.5 rounded-lg border p-2 transition-colors w-44 lg:w-full ${
                isActive
                  ? 'border-[#1E40AF] bg-[#EFF4FF]/60'
                  : 'border-[#EAE7DF] bg-[#FAF9F6] hover:border-[#CFCBC0]'
              }`}
            >
              <button
                type="button"
                aria-label={`Chọn slide ${idx + 1}: ${slide.title}`}
                onClick={() => onSelectSlide(slide.id)}
                className="w-full overflow-hidden rounded border border-[#E2DFD7] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
              >
                <SlideRenderer
                  slide={slide}
                  theme={theme}
                  slideIndex={idx}
                  totalSlides={slides.length}
                  compact
                />
              </button>

              <div className="flex items-center justify-between gap-1 px-0.5">
                <span className="font-mono-tabular text-[11px] font-semibold text-[#525866]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Di chuyển slide ${idx + 1} lên`}
                    disabled={idx === 0}
                    onClick={() => onMoveSlide(idx, idx - 1)}
                    className="rounded p-1 text-[#626978] hover:bg-white hover:text-[#14171F] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Di chuyển slide ${idx + 1} xuống`}
                    disabled={idx === slides.length - 1}
                    onClick={() => onMoveSlide(idx, idx + 1)}
                    className="rounded p-1 text-[#626978] hover:bg-white hover:text-[#14171F] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Nhân bản slide ${idx + 1}`}
                    onClick={() => onDuplicateSlide(slide.id)}
                    className="rounded p-1 text-[#626978] hover:bg-white hover:text-[#14171F] cursor-pointer"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xóa slide ${idx + 1}`}
                    disabled={slides.length <= 1}
                    onClick={() => onDeleteSlide(slide.id)}
                    className="rounded p-1 text-[#626978] hover:bg-white hover:text-[#DC2626] disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
