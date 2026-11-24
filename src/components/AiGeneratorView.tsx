import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { GenerateDeckPayload, ThemeId } from '../types/presentation';
import { THEME_LIST } from '../utils/deckThemes';

interface AiGeneratorViewProps {
  isGenerating: boolean;
  error: string | null;
  onGenerate: (payload: GenerateDeckPayload) => void;
  onCancel: () => void;
}

const EXAMPLE_TOPICS = [
  'Kế hoạch Chuyển đổi Số cho Doanh nghiệp SME 2026',
  'Báo cáo Nghiên cứu Thị trường Thương mại Điện tử Việt Nam',
  'Chiến lược Ra mắt Ứng dụng Học Ngoại ngữ Tích hợp AI',
];

export const AiGeneratorView: React.FC<AiGeneratorViewProps> = ({
  isGenerating,
  error,
  onGenerate,
  onCancel,
}) => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Ban điều hành & Đối tác');
  const [slideCount, setSlideCount] = useState(6);
  const [tone, setTone] = useState<GenerateDeckPayload['tone']>('Chuyên nghiệp');
  const [themeId, setThemeId] = useState<ThemeId>('editorial-ivory');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({
      topic: topic.trim(),
      slideCount,
      tone,
      audience: audience.trim() || 'Người nghe đại chúng',
      themeId,
    });
  };

  return (
    <section
      aria-label="Trình tạo bài thuyết trình tự động bằng AI"
      className="mx-auto max-w-3xl rounded-xl border border-[#E3E0D8] bg-white p-6 sm:p-8"
    >
      <div className="border-b border-[#EDEBE4] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#14171F] text-balance">
          Tạo bài thuyết trình PowerPoint tự động
        </h1>
        <p className="mt-2 text-sm text-[#525866]">
          Nhập chủ đề hoặc tóm tắt nội dung. Hệ thống tự động xây dựng cấu trúc slide đa bố cục, số liệu minh họa, ghi chú diễn giả và sẵn sàng xuất ra tệp .pptx.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="ai-topic" className="block text-xs font-semibold text-[#14171F]">
            Chủ đề hoặc mô tả nội dung thuyết trình
          </label>
          <textarea
            id="ai-topic"
            required
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: Kế hoạch mở rộng chuỗi bán lẻ xanh tại 5 thành phố lớn trong năm 2026..."
            className="mt-1.5 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] p-3 text-sm text-[#14171F] placeholder-[#8B91A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
          />

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#626978]">Gợi ý nhanh:</span>
            {EXAMPLE_TOPICS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setTopic(ex)}
                className="rounded-md border border-[#E3E0D8] bg-[#FAF9F6] px-2.5 py-1 text-xs text-[#374151] hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors cursor-pointer"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="ai-audience" className="block text-xs font-semibold text-[#14171F]">
              Đối tượng người nghe
            </label>
            <input
              id="ai-audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
            />
          </div>

          <div>
            <label htmlFor="ai-slide-count" className="block text-xs font-semibold text-[#14171F]">
              Số lượng slide
            </label>
            <select
              id="ai-slide-count"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs font-medium text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
            >
              <option value={4}>4 slide (Ngắn gọn)</option>
              <option value={6}>6 slide (Tiêu chuẩn)</option>
              <option value={8}>8 slide (Chi tiết)</option>
              <option value={10}>10 slide (Chuyên sâu)</option>
            </select>
          </div>

          <div>
            <label htmlFor="ai-tone" className="block text-xs font-semibold text-[#14171F]">
              Phong cách trình bày
            </label>
            <select
              id="ai-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as GenerateDeckPayload['tone'])}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3 text-xs font-medium text-[#14171F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]"
            >
              <option value="Chuyên nghiệp">Chuyên nghiệp</option>
              <option value="Thuyết phục">Thuyết phục</option>
              <option value="Sáng tạo">Sáng tạo</option>
              <option value="Học thuật">Học thuật</option>
            </select>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-[#14171F]">
            Chọn chủ đề màu sắc
          </span>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {THEME_LIST.map((t) => {
              const selected = t.id === themeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#1E40AF] bg-[#EFF4FF]/60'
                      : 'border-[#E6E3DA] bg-[#FAF9F6] hover:border-[#CFCBC0]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: t.bg, borderColor: t.border }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                  >
                    <span style={{ backgroundColor: t.accent }} className="h-3.5 w-3.5 rounded-full" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#14171F]">{t.name}</div>
                    <div className="truncate text-[11px] text-[#626978]">{t.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3 text-xs text-[#B91C1C]"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#EDEBE4] pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#DCD8CE] bg-white px-4 text-xs font-medium text-[#374151] hover:bg-[#FAF9F6] cursor-pointer"
          >
            Quay lại trình biên tập
          </button>
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1E40AF] px-5 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isGenerating ? 'Đang tạo bộ slide...' : 'Tạo bài thuyết trình tự động'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
