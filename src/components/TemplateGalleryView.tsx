import React from 'react';
import { FilePlus2, Play } from 'lucide-react';
import type { PresentationDeck } from '../types/presentation';
import { getTheme } from '../utils/deckThemes';
import { SlideRenderer } from './SlideRenderer';

interface TemplateGalleryViewProps {
  templates: PresentationDeck[];
  onSelectTemplate: (deck: PresentationDeck) => void;
  onCreateBlankDeck: () => void;
}

export const TemplateGalleryView: React.FC<TemplateGalleryViewProps> = ({
  templates,
  onSelectTemplate,
  onCreateBlankDeck,
}) => {
  return (
    <section
      aria-label="Kho mẫu bài thuyết trình có sẵn"
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14171F]">
            Kho mẫu bài thuyết trình
          </h1>
          <p className="mt-1 text-sm text-[#525866]">
            Chọn một bộ slide dựng sẵn để chỉnh sửa nhanh hoặc bắt đầu từ bản trống.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateBlankDeck}
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-[#DCD8CE] bg-white px-4 text-xs font-semibold text-[#14171F] hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors cursor-pointer"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          <span>Tạo bài thuyết trình trống</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {templates.map((tpl) => {
          const theme = getTheme(tpl.themeId);
          return (
            <div
              key={tpl.id}
              className="flex flex-col overflow-hidden rounded-xl border border-[#E3E0D8] bg-white"
            >
              <div className="border-b border-[#EDEBE4]">
                <SlideRenderer
                  slide={tpl.slides[0]}
                  theme={theme}
                  slideIndex={0}
                  totalSlides={tpl.slides.length}
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-[#14171F] truncate">
                    {tpl.title}
                  </h2>
                  <p className="mt-1 text-xs text-[#626978]">
                    {tpl.slides.length} slide · {tpl.audience} · {theme.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tpl)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1E40AF] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Sử dụng mẫu này</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
