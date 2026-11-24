import React, { useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type { SlideData, SlideLayout, ThemeId } from '../types/presentation';
import { LAYOUT_LABELS } from '../utils/deckModel';
import { THEME_LIST } from '../utils/deckThemes';

interface SlideInspectorProps {
  slide: SlideData;
  themeId: ThemeId;
  isRewriting: boolean;
  rewriteError: string | null;
  onUpdateSlide: (updated: SlideData) => void;
  onChangeTheme: (themeId: ThemeId) => void;
  onRewriteWithAi: (instruction: string) => void;
}

export const SlideInspector: React.FC<SlideInspectorProps> = ({
  slide,
  themeId,
  isRewriting,
  rewriteError,
  onUpdateSlide,
  onChangeTheme,
  onRewriteWithAi,
}) => {
  const [rewritePrompt, setRewritePrompt] = useState('Viết súc tích, chuyên nghiệp và giàu tính thuyết phục hơn');

  const handleLayoutChange = (nextLayout: SlideLayout) => {
    const updated: SlideData = { ...slide, layout: nextLayout };
    if (nextLayout === 'metrics' && (!updated.metrics || updated.metrics.length === 0)) {
      updated.metrics = [
        { label: 'Chỉ số tăng trưởng', value: '+38%', delta: 'So với quý trước' },
        { label: 'Khách hàng mới', value: '1.250', delta: '+24% MoM' },
        { label: 'Hiệu suất vận hành', value: '96%', delta: 'Đạt mục tiêu' },
      ];
    }
    if (nextLayout === 'two-column' && (!updated.columns || updated.columns.length < 2)) {
      updated.columns = [
        {
          heading: 'Trọng tâm 1',
          items: updated.bullets.slice(0, 2).length > 0 ? updated.bullets.slice(0, 2) : ['Luận điểm cốt lõi 1'],
        },
        {
          heading: 'Trọng tâm 2',
          items: updated.bullets.slice(2, 4).length > 0 ? updated.bullets.slice(2, 4) : ['Luận điểm cốt lõi 2'],
        },
      ];
    }
    onUpdateSlide(updated);
  };

  const updateBullet = (idx: number, val: string) => {
    const next = [...slide.bullets];
    next[idx] = val;
    onUpdateSlide({ ...slide, bullets: next });
  };

  const removeBullet = (idx: number) => {
    const next = slide.bullets.filter((_, i) => i !== idx);
    onUpdateSlide({ ...slide, bullets: next });
  };

  const addBullet = () => {
    onUpdateSlide({ ...slide, bullets: [...slide.bullets, 'Nội dung điểm mới'] });
  };

  return (
    <aside
      aria-label="Chỉnh sửa nội dung và giao diện slide"
      className="flex flex-col gap-5 rounded-xl border border-[#E3E0D8] bg-white p-4 sm:p-5 lg:w-[350px] lg:shrink-0"
    >
      {/* Theme Swatches */}
      <div>
        <h2 className="text-xs font-semibold text-[#14171F]">Chủ đề thiết kế</h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {THEME_LIST.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTheme(t.id)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] ${
                  active
                    ? 'border-[#1E40AF] bg-[#EFF4FF]/60'
                    : 'border-[#E6E3DA] bg-[#FAF9F6] hover:border-[#CFCBC0]'
                }`}
              >
                <span
                  style={{ backgroundColor: t.bg, borderColor: t.border }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                  aria-hidden="true"
                >
                  <span style={{ backgroundColor: t.accent }} className="h-2.5 w-2.5 rounded-full" />
                </span>
                <span className="truncate text-[11px] font-medium text-[#17191E]">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#EDEBE4]" />

      {/* Layout Selector */}
      <div>
        <label htmlFor="slide-layout-select" className="block text-xs font-semibold text-[#14171F]">
          Bố cục trang
        </label>
        <select
          id="slide-layout-select"
          value={slide.layout}
          onChange={(e) => handleLayoutChange(e.target.value as SlideLayout)}
          className="mt-1.5 h-9 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs font-medium text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
        >
          {(Object.keys(LAYOUT_LABELS) as SlideLayout[]).map((layout) => (
            <option key={layout} value={layout}>
              {LAYOUT_LABELS[layout]}
            </option>
          ))}
        </select>
      </div>

      {/* Text Fields */}
      <div className="space-y-3">
        <div>
          <label htmlFor="slide-kicker" className="block text-xs font-medium text-[#525866]">
            Nhãn mục (Kicker)
          </label>
          <input
            id="slide-kicker"
            type="text"
            value={slide.kicker ?? ''}
            onChange={(e) => onUpdateSlide({ ...slide, kicker: e.target.value })}
            placeholder="Ví dụ: CHIẾN LƯỢC · 2026"
            className="mt-1 h-9 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          />
        </div>

        <div>
          <label htmlFor="slide-title" className="block text-xs font-medium text-[#525866]">
            Tiêu đề slide
          </label>
          <input
            id="slide-title"
            type="text"
            value={slide.title}
            onChange={(e) => onUpdateSlide({ ...slide, title: e.target.value })}
            className="mt-1 h-9 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs font-medium text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          />
        </div>

        <div>
          <label htmlFor="slide-subtitle" className="block text-xs font-medium text-[#525866]">
            Phụ đề tóm tắt
          </label>
          <textarea
            id="slide-subtitle"
            rows={2}
            value={slide.subtitle ?? ''}
            onChange={(e) => onUpdateSlide({ ...slide, subtitle: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] p-2.5 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          />
        </div>
      </div>

      {/* Layout-specific editors */}
      {slide.layout === 'metrics' && slide.metrics && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-[#14171F]">Các chỉ số KPI</div>
          {slide.metrics.map((m, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-1.5 rounded-lg border border-[#EAE7DF] bg-[#FAF9F6] p-2">
              <input
                type="text"
                aria-label={`Tên chỉ số ${idx + 1}`}
                value={m.label}
                onChange={(e) => {
                  const next = [...(slide.metrics ?? [])];
                  next[idx] = { ...m, label: e.target.value };
                  onUpdateSlide({ ...slide, metrics: next });
                }}
                placeholder="Nhãn"
                className="col-span-3 rounded border border-[#DCD8CE] bg-white px-2 py-1 text-[11px]"
              />
              <input
                type="text"
                aria-label={`Giá trị chỉ số ${idx + 1}`}
                value={m.value}
                onChange={(e) => {
                  const next = [...(slide.metrics ?? [])];
                  next[idx] = { ...m, value: e.target.value };
                  onUpdateSlide({ ...slide, metrics: next });
                }}
                placeholder="Giá trị"
                className="col-span-1 rounded border border-[#DCD8CE] bg-white px-2 py-1 font-mono-tabular text-[11px] font-semibold"
              />
              <input
                type="text"
                aria-label={`Biến động chỉ số ${idx + 1}`}
                value={m.delta ?? ''}
                onChange={(e) => {
                  const next = [...(slide.metrics ?? [])];
                  next[idx] = { ...m, delta: e.target.value };
                  onUpdateSlide({ ...slide, metrics: next });
                }}
                placeholder="Ghi chú"
                className="col-span-2 rounded border border-[#DCD8CE] bg-white px-2 py-1 text-[11px]"
              />
            </div>
          ))}
        </div>
      )}

      {slide.layout === 'two-column' && slide.columns && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#14171F]">Nội dung 2 cột</div>
          {slide.columns.map((col, cIdx) => (
            <div key={cIdx} className="space-y-2 rounded-lg border border-[#EAE7DF] bg-[#FAF9F6] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  aria-label={`Tiêu đề cột ${cIdx + 1}`}
                  value={col.heading}
                  onChange={(e) => {
                    const nextCols = [...(slide.columns ?? [])];
                    nextCols[cIdx] = { ...col, heading: e.target.value };
                    onUpdateSlide({ ...slide, columns: nextCols });
                  }}
                  className="w-full rounded border border-[#DCD8CE] bg-white px-2.5 py-1.5 text-xs font-semibold"
                />
                <button
                  type="button"
                  aria-label={`Thêm mục vào cột ${cIdx + 1}`}
                  onClick={() => {
                    const nextCols = [...(slide.columns ?? [])];
                    nextCols[cIdx] = { ...col, items: [...col.items, 'Ý mới'] };
                    onUpdateSlide({ ...slide, columns: nextCols });
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-[#DCD8CE] bg-white px-2 py-1 text-[11px] font-medium text-[#1E40AF] hover:border-[#1E40AF] cursor-pointer"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span>Thêm</span>
                </button>
              </div>
              {col.items.map((item, iIdx) => (
                <div key={iIdx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    aria-label={`Mục ${iIdx + 1} cột ${cIdx + 1}`}
                    value={item}
                    onChange={(e) => {
                      const nextCols = [...(slide.columns ?? [])];
                      const nextItems = [...col.items];
                      nextItems[iIdx] = e.target.value;
                      nextCols[cIdx] = { ...col, items: nextItems };
                      onUpdateSlide({ ...slide, columns: nextCols });
                    }}
                    className="w-full rounded border border-[#DCD8CE] bg-white px-2.5 py-1 text-[11px]"
                  />
                  <button
                    type="button"
                    aria-label={`Xóa mục ${iIdx + 1} cột ${cIdx + 1}`}
                    onClick={() => {
                      const nextCols = [...(slide.columns ?? [])];
                      nextCols[cIdx] = {
                        ...col,
                        items: col.items.filter((_, idx) => idx !== iIdx),
                      };
                      onUpdateSlide({ ...slide, columns: nextCols });
                    }}
                    className="rounded p-1 text-[#626978] hover:bg-[#FEE2E2] hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {slide.layout !== 'two-column' && (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#14171F]">
              {slide.layout === 'timeline' ? 'Các mốc giai đoạn' : 'Các ý chính'}
            </span>
            <button
              type="button"
              onClick={addBullet}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1E40AF] hover:underline cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Thêm dòng</span>
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {slide.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <textarea
                  rows={2}
                  aria-label={`Nội dung dòng ${idx + 1}`}
                  value={bullet}
                  onChange={(e) => updateBullet(idx, e.target.value)}
                  className="w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] p-2 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
                />
                <button
                  type="button"
                  aria-label={`Xóa dòng ${idx + 1}`}
                  onClick={() => removeBullet(idx)}
                  className="mt-1 rounded p-1.5 text-[#626978] hover:bg-[#FEE2E2] hover:text-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speaker Notes */}
      <div>
        <label htmlFor="speaker-notes" className="block text-xs font-medium text-[#525866]">
          Ghi chú diễn giả
        </label>
        <textarea
          id="speaker-notes"
          rows={2}
          value={slide.speakerNotes ?? ''}
          onChange={(e) => onUpdateSlide({ ...slide, speakerNotes: e.target.value })}
          placeholder="Ghi chú hỗ trợ khi thuyết trình..."
          className="mt-1 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] p-2.5 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
        />
      </div>

      <div className="h-px bg-[#EDEBE4]" />

      {/* AI Rewrite Single Slide */}
      <div>
        <label htmlFor="ai-rewrite-instruction" className="block text-xs font-semibold text-[#14171F]">
          Biên tập slide này với AI
        </label>
        <input
          id="ai-rewrite-instruction"
          type="text"
          value={rewritePrompt}
          onChange={(e) => setRewritePrompt(e.target.value)}
          className="mt-1.5 h-8 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-2.5 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
        />
        {rewriteError && (
          <p role="alert" className="mt-1.5 text-[11px] text-[#DC2626]">
            {rewriteError}
          </p>
        )}
        <button
          type="button"
          disabled={isRewriting}
          onClick={() => onRewriteWithAi(rewritePrompt)}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#1E40AF]/25 bg-[#EFF4FF] px-3 text-xs font-semibold text-[#1E40AF] hover:bg-[#E0EAFF] disabled:opacity-60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isRewriting ? 'Đang biên tập lại...' : 'Tinh chỉnh slide bằng AI'}</span>
        </button>
      </div>
    </aside>
  );
};
