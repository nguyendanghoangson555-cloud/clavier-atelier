import React from 'react';
import type { SlideData, SlideTheme } from '../types/presentation';

interface SlideRendererProps {
  slide: SlideData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  compact?: boolean;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  theme,
  slideIndex,
  totalSlides,
  compact = false,
}) => {
  const isTitleOrClosing = slide.layout === 'title' || slide.layout === 'closing';

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
      }}
      className={`relative aspect-video w-full overflow-hidden select-none flex flex-col justify-between ${
        compact ? 'p-3 text-[7px]' : 'p-4 sm:p-10 lg:p-12'
      }`}
    >
      {isTitleOrClosing ? (
        <div className="my-auto flex items-stretch gap-3 sm:gap-6">
          <div
            style={{ backgroundColor: theme.accent }}
            className={compact ? 'w-1 shrink-0 rounded-full' : 'w-1 sm:w-1.5 shrink-0 rounded-full'}
          />
          <div className="flex flex-col justify-center min-w-0">
            {slide.kicker && (
              <div
                style={{ color: theme.accent }}
                className={`font-semibold tracking-wider uppercase ${
                  compact ? 'text-[6px] mb-1' : 'text-[10px] sm:text-xs mb-1.5 sm:mb-2.5'
                }`}
              >
                {slide.kicker}
              </div>
            )}
            <h2
              className={`font-display font-bold leading-[1.15] tracking-tight text-balance ${
                compact ? 'text-[11px]' : 'text-lg sm:text-4xl lg:text-[42px]'
              }`}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p
                style={{ color: theme.textSecondary }}
                className={`leading-relaxed ${
                  compact ? 'mt-1 text-[6px] line-clamp-2' : 'mt-1.5 sm:mt-4 max-w-3xl text-xs sm:text-lg line-clamp-2 sm:line-clamp-none'
                }`}
              >
                {slide.subtitle}
              </p>
            )}
            {slide.bullets.length > 0 && (
              <ul
                style={{ color: theme.textSecondary }}
                className={
                  compact
                    ? 'mt-1.5 space-y-0.5 text-[5.5px]'
                    : 'mt-2.5 sm:mt-6 space-y-1 sm:space-y-1.5 text-[11px] sm:text-sm'
                }
              >
                {slide.bullets.slice(0, compact ? 2 : 4).map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {slide.layout === 'closing' && (
                      <span
                        style={{ backgroundColor: theme.accent }}
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Header Zone */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  style={{ backgroundColor: theme.accent }}
                  className={compact ? 'h-0.5 w-3 shrink-0' : 'h-[3px] w-7 shrink-0'}
                />
                {slide.kicker && (
                  <span
                    style={{ color: theme.accent }}
                    className={`font-semibold tracking-wider uppercase truncate ${
                      compact ? 'text-[5.5px]' : 'text-[11px]'
                    }`}
                  >
                    {slide.kicker}
                  </span>
                )}
              </div>
              <span
                style={{ color: theme.textSecondary }}
                className={`font-mono-tabular shrink-0 ${
                  compact ? 'text-[5.5px]' : 'text-xs'
                }`}
              >
                {slideIndex + 1} / {totalSlides}
              </span>
            </div>

            <h2
              className={`font-display font-bold tracking-tight leading-tight text-balance ${
                compact ? 'mt-1 text-[9.5px] line-clamp-1' : 'mt-2.5 text-xl sm:text-2xl lg:text-[30px]'
              }`}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p
                style={{ color: theme.textSecondary }}
                className={compact ? 'mt-0.5 text-[5.5px] line-clamp-1' : 'mt-1.5 text-xs sm:text-sm'}
              >
                {slide.subtitle}
              </p>
            )}
          </div>

          {/* Body Zone */}
          <div className={compact ? 'mt-1.5 flex-1 overflow-hidden' : 'mt-5 flex-1 flex flex-col justify-center overflow-hidden'}>
            {slide.layout === 'metrics' ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className={`grid grid-cols-3 ${compact ? 'gap-1.5' : 'gap-4'}`}>
                  {(slide.metrics ?? []).slice(0, 3).map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                      className={`rounded-lg border flex flex-col justify-between ${
                        compact ? 'p-1.5' : 'p-4 sm:p-5'
                      }`}
                    >
                      <div
                        style={{ color: theme.textSecondary }}
                        className={compact ? 'text-[5px] truncate' : 'text-xs font-medium'}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{ color: theme.accent }}
                        className={`font-display font-bold font-mono-tabular ${
                          compact ? 'mt-0.5 text-[9px]' : 'mt-2 text-2xl sm:text-3xl lg:text-4xl'
                        }`}
                      >
                        {m.value}
                      </div>
                      {m.delta && (
                        <div
                          style={{ color: theme.textSecondary }}
                          className={compact ? 'text-[4.5px] truncate' : 'mt-1.5 text-[11px]'}
                        >
                          {m.delta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {!compact && slide.bullets.length > 0 && (
                  <ul className="space-y-1.5 text-xs sm:text-sm">
                    {slide.bullets.slice(0, 2).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          style={{ backgroundColor: theme.accent }}
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : slide.layout === 'two-column' ? (
              <div className={`grid grid-cols-2 h-full ${compact ? 'gap-1.5' : 'gap-4 sm:gap-5'}`}>
                {(slide.columns ?? []).slice(0, 2).map((col, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    }}
                    className={`rounded-lg border flex flex-col ${
                      compact ? 'p-1.5' : 'p-4 sm:p-5'
                    }`}
                  >
                    <div
                      style={{ color: theme.accent }}
                      className={`font-semibold ${
                        compact ? 'text-[6px] mb-0.5 truncate' : 'text-sm sm:text-base mb-3'
                      }`}
                    >
                      {col.heading}
                    </div>
                    <ul className={compact ? 'space-y-0.5 text-[5px]' : 'space-y-2.5 text-xs sm:text-sm'}>
                      {col.items.slice(0, compact ? 3 : 5).map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 leading-snug">
                          <span
                            style={{ backgroundColor: theme.accent }}
                            className={
                              compact
                                ? 'mt-1 h-1 w-1 shrink-0 rounded-full'
                                : 'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full'
                            }
                          />
                          <span className={compact ? 'line-clamp-1' : ''}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : slide.layout === 'timeline' ? (
              <div className="relative">
                <div
                  style={{ backgroundColor: theme.border }}
                  className={compact ? 'mb-1.5 h-px w-full' : 'mb-4 h-0.5 w-full'}
                />
                <div
                  className={`grid ${
                    slide.bullets.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'
                  } ${compact ? 'gap-1' : 'gap-3'}`}
                >
                  {slide.bullets.slice(0, 4).map((step, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                      className={`rounded-lg border flex flex-col ${
                        compact ? 'p-1' : 'p-3.5'
                      }`}
                    >
                      <span
                        style={{
                          backgroundColor: theme.accent,
                          color: theme.accentText,
                        }}
                        className={`inline-flex items-center justify-center rounded-full font-mono-tabular font-bold ${
                          compact ? 'h-2.5 w-2.5 text-[5px] mb-1' : 'h-6 w-6 text-xs mb-2.5'
                        }`}
                      >
                        {sIdx + 1}
                      </span>
                      <p
                        className={`leading-snug ${
                          compact ? 'text-[5px] line-clamp-3' : 'text-xs sm:text-[13px]'
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Agenda / Standard bullets */
              <div
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
                className={`rounded-lg border h-full flex flex-col justify-center ${
                  compact ? 'p-2' : 'p-5 sm:p-6'
                }`}
              >
                <ul className={compact ? 'space-y-1 text-[5.5px]' : 'space-y-3 text-sm sm:text-base'}>
                  {slide.bullets.slice(0, compact ? 4 : 6).map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 leading-snug">
                      <span
                        style={{ backgroundColor: theme.accent }}
                        className={
                          compact
                            ? 'mt-1 h-1 w-1 shrink-0 rounded-full'
                            : 'mt-2 h-2 w-2 shrink-0 rounded-full'
                        }
                      />
                      <span className={compact ? 'line-clamp-1' : ''}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
