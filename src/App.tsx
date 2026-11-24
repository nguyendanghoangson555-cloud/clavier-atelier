import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import { AiGeneratorView } from './components/AiGeneratorView';
import { Header, type WorkspaceTab } from './components/Header';
import { PresenterOverlay } from './components/PresenterOverlay';
import { SlideInspector } from './components/SlideInspector';
import { SlideRenderer } from './components/SlideRenderer';
import { SlideSidebar } from './components/SlideSidebar';
import { TemplateGalleryView } from './components/TemplateGalleryView';
import type {
  GenerateDeckPayload,
  PresentationDeck,
  SlideData,
  SlideLayout,
  ThemeId,
} from './types/presentation';
import {
  LAYOUT_LABELS,
  SAMPLE_DECKS,
  createBlankSlide,
  deleteSlide,
  duplicateSlide,
  normalizeGeneratedDeck,
  normalizeSlide,
  reorderSlides,
} from './utils/deckModel';
import { getTheme } from './utils/deckThemes';
import { downloadDeckPptx } from './utils/pptxExporter';

const DECK_STORAGE_KEY = 'slidecraft_active_deck_v1';

function loadInitialDeck(): PresentationDeck {
  try {
    const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PresentationDeck;
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to curated sample deck
  }
  return SAMPLE_DECKS[0];
}

export default function App() {
  const [deck, setDeck] = useState<PresentationDeck>(() => loadInitialDeck());
  const [activeSlideId, setActiveSlideId] = useState<string>(() => deck.slides[0].id);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('editor');
  const [isPresenting, setIsPresenting] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // Ignore storage quota issues
    }
  }, [deck]);

  const activeSlideIndex = useMemo(() => {
    const idx = deck.slides.findIndex((s) => s.id === activeSlideId);
    return idx >= 0 ? idx : 0;
  }, [deck.slides, activeSlideId]);

  const activeSlide = deck.slides[activeSlideIndex] ?? deck.slides[0];
  const activeTheme = useMemo(() => getTheme(deck.themeId), [deck.themeId]);

  const handleUpdateSlide = (updated: SlideData) => {
    setDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      slides: prev.slides.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleAddSlide = (layout: SlideLayout) => {
    const newSlide = createBlankSlide(layout);
    setDeck((prev) => {
      const next = [...prev.slides];
      next.splice(activeSlideIndex + 1, 0, newSlide);
      return { ...prev, updatedAt: Date.now(), slides: next };
    });
    setActiveSlideId(newSlide.id);
  };

  const handleMoveSlide = (fromIdx: number, toIdx: number) => {
    setDeck((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      slides: reorderSlides(prev.slides, fromIdx, toIdx),
    }));
  };

  const handleDuplicateSlide = (id: string) => {
    setDeck((prev) => {
      const { slides, newSlideId } = duplicateSlide(prev.slides, id);
      if (newSlideId) setActiveSlideId(newSlideId);
      return { ...prev, updatedAt: Date.now(), slides };
    });
  };

  const handleDeleteSlide = (id: string) => {
    setDeck((prev) => {
      const nextSlides = deleteSlide(prev.slides, id);
      if (id === activeSlideId && nextSlides.length > 0) {
        const nextIdx = Math.min(activeSlideIndex, nextSlides.length - 1);
        setActiveSlideId(nextSlides[nextIdx].id);
      }
      return { ...prev, updatedAt: Date.now(), slides: nextSlides };
    });
  };

  const handleChangeTheme = (themeId: ThemeId) => {
    setDeck((prev) => ({ ...prev, themeId, updatedAt: Date.now() }));
  };

  const handleGenerateDeck = async (payload: GenerateDeckPayload) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45000);
    try {
      setIsGenerating(true);
      setGenerateError(null);
      const res = await fetch('/api/decks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo bài thuyết trình từ máy chủ.');
      }
      const nextDeck = normalizeGeneratedDeck(data, {
        topic: payload.topic,
        audience: payload.audience,
        tone: payload.tone,
        themeId: payload.themeId,
      });
      setDeck(nextDeck);
      setActiveSlideId(nextDeck.slides[0].id);
      setActiveTab('editor');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenerateError('Yêu cầu tạo slide quá thời gian chờ. Vui lòng thử lại.');
      } else {
        setGenerateError(
          err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo bài thuyết trình.'
        );
      }
    } finally {
      window.clearTimeout(timer);
      setIsGenerating(false);
    }
  };

  const handleRewriteWithAi = async (instruction: string) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 30000);
    try {
      setIsRewriting(true);
      setRewriteError(null);
      const res = await fetch('/api/decks/rewrite-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: activeSlide, instruction }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể biên tập lại slide.');
      }
      const normalized = normalizeSlide(data, activeSlideIndex);
      handleUpdateSlide({ ...normalized, id: activeSlide.id });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRewriteError('Yêu cầu biên tập slide quá thời gian chờ.');
      } else {
        setRewriteError(
          err instanceof Error ? err.message : 'Lỗi kết nối khi biên tập slide.'
        );
      }
    } finally {
      window.clearTimeout(timer);
      setIsRewriting(false);
    }
  };

  const handleExportPptx = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      await downloadDeckPptx(deck);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Không thể xuất tệp PowerPoint (.pptx).'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectTemplate = (template: PresentationDeck) => {
    const cloned: PresentationDeck = {
      ...template,
      id: `deck-${Date.now()}`,
      updatedAt: Date.now(),
      slides: template.slides.map((s) => ({
        ...s,
        bullets: [...s.bullets],
        columns: s.columns?.map((c) => ({ heading: c.heading, items: [...c.items] })),
        metrics: s.metrics?.map((m) => ({ ...m })),
      })),
    };
    setDeck(cloned);
    setActiveSlideId(cloned.slides[0].id);
    setActiveTab('editor');
  };

  const handleCreateBlankDeck = () => {
    const titleSlide = createBlankSlide('title');
    const agendaSlide = createBlankSlide('agenda');
    const closingSlide = createBlankSlide('closing');
    const blank: PresentationDeck = {
      id: `deck-${Date.now()}`,
      title: 'Bài thuyết trình mới',
      audience: 'Chung',
      tone: 'Chuyên nghiệp',
      themeId: 'editorial-ivory',
      slides: [titleSlide, agendaSlide, closingSlide],
      updatedAt: Date.now(),
    };
    setDeck(blank);
    setActiveSlideId(titleSlide.id);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#17191E] flex flex-col">
      <Header
        activeTab={activeTab}
        isExporting={isExporting}
        onSelectTab={setActiveTab}
        onStartPresent={() => setIsPresenting(true)}
        onExportPptx={handleExportPptx}
      />

      {exportError && (
        <div
          role="alert"
          className="mx-auto mt-3 w-full max-w-[1440px] px-4 sm:px-6"
        >
          <div className="rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-2.5 text-xs text-[#B91C1C]">
            {exportError}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
        {activeTab === 'ai-generator' ? (
          <AiGeneratorView
            isGenerating={isGenerating}
            error={generateError}
            onGenerate={handleGenerateDeck}
            onCancel={() => setActiveTab('editor')}
          />
        ) : activeTab === 'templates' ? (
          <TemplateGalleryView
            templates={SAMPLE_DECKS}
            onSelectTemplate={handleSelectTemplate}
            onCreateBlankDeck={handleCreateBlankDeck}
          />
        ) : (
          <div className="space-y-4">
            {/* Deck Context & Quick Actions Bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#E3E0D8] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <label htmlFor="deck-title-input" className="sr-only">
                  Tên bài thuyết trình
                </label>
                <input
                  id="deck-title-input"
                  type="text"
                  value={deck.title}
                  onChange={(e) =>
                    setDeck((prev) => ({
                      ...prev,
                      title: e.target.value,
                      updatedAt: Date.now(),
                    }))
                  }
                  className="font-display text-lg font-bold text-[#14171F] bg-transparent border-0 p-0 focus:outline-none focus:ring-0 truncate"
                />
                <p className="text-xs text-[#626978]">
                  <span className="font-mono-tabular">{deck.slides.length} slide</span>
                  {' · '}
                  <span>{activeTheme.name}</span>
                  {' · '}
                  <span>Bố cục: {LAYOUT_LABELS[activeSlide.layout]}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('ai-generator')}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1E40AF]/25 bg-[#EFF4FF] px-3.5 text-xs font-semibold text-[#1E40AF] hover:bg-[#E0EAFF] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tạo bộ slide mới bằng AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPresenting(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCD8CE] bg-[#FAF9F6] px-3.5 text-xs font-medium text-[#14171F] hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>Trình chiếu</span>
                </button>
              </div>
            </div>

            {/* 3-Zone Studio Workspace */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <SlideSidebar
                slides={deck.slides}
                activeSlideId={activeSlide.id}
                theme={activeTheme}
                onSelectSlide={setActiveSlideId}
                onAddSlide={handleAddSlide}
                onMoveSlide={handleMoveSlide}
                onDuplicateSlide={handleDuplicateSlide}
                onDeleteSlide={handleDeleteSlide}
              />

              {/* Center 16:9 Live Preview Stage */}
              <section
                aria-label="Khung xem trước slide"
                className="flex-1 min-w-0 space-y-3"
              >
                <div
                  data-testid="active-slide-stage"
                  className="overflow-hidden rounded-xl border border-[#DFDCD3] bg-white shadow-[0_20px_50px_-15px_rgba(20,23,31,0.14)]"
                >
                  <SlideRenderer
                    slide={activeSlide}
                    theme={activeTheme}
                    slideIndex={activeSlideIndex}
                    totalSlides={deck.slides.length}
                  />
                </div>

                {/* Stage Stepper */}
                <div className="flex items-center justify-between rounded-xl border border-[#E3E0D8] bg-white px-4 py-2.5">
                  <button
                    type="button"
                    disabled={activeSlideIndex === 0}
                    onClick={() =>
                      setActiveSlideId(deck.slides[Math.max(0, activeSlideIndex - 1)].id)
                    }
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F3F2EE] disabled:opacity-35 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Slide trước</span>
                  </button>

                  <span className="font-mono-tabular text-xs font-medium text-[#525866]">
                    Trang {activeSlideIndex + 1} / {deck.slides.length}
                  </span>

                  <button
                    type="button"
                    disabled={activeSlideIndex === deck.slides.length - 1}
                    onClick={() =>
                      setActiveSlideId(
                        deck.slides[Math.min(deck.slides.length - 1, activeSlideIndex + 1)].id
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#F3F2EE] disabled:opacity-35 cursor-pointer"
                  >
                    <span>Slide tiếp</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </section>

              <SlideInspector
                slide={activeSlide}
                themeId={deck.themeId}
                isRewriting={isRewriting}
                rewriteError={rewriteError}
                onUpdateSlide={handleUpdateSlide}
                onChangeTheme={handleChangeTheme}
                onRewriteWithAi={handleRewriteWithAi}
              />
            </div>
          </div>
        )}
      </main>

      {isPresenting && (
        <PresenterOverlay
          deck={deck}
          initialIndex={activeSlideIndex}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
}
