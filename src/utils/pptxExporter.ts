import PptxGenJS from 'pptxgenjs';
import type { PresentationDeck, SlideData, SlideTheme } from '../types/presentation';
import { getTheme } from './deckThemes';

function hex(color: string): string {
  return color.replace('#', '');
}

function renderTitleOrClosingSlide(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  data: SlideData,
  theme: SlideTheme
) {
  // Subtle vertical accent bar on left margin
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.75,
    y: 1.45,
    w: 0.1,
    h: 3.1,
    fill: { color: hex(theme.accent) },
    line: { color: hex(theme.accent) },
  });

  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: 1.15,
      y: 1.4,
      w: 10.5,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: hex(theme.accent),
      fontFace: 'Arial',
      charSpacing: 1.5,
    });
  }

  slide.addText(data.title, {
    x: 1.15,
    y: 1.9,
    w: 10.8,
    h: 1.6,
    fontSize: 36,
    bold: true,
    color: hex(theme.textPrimary),
    fontFace: 'Arial',
    valign: 'top',
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.15,
      y: 3.55,
      w: 10.4,
      h: 1.0,
      fontSize: 17,
      color: hex(theme.textSecondary),
      fontFace: 'Arial',
      valign: 'top',
    });
  }

  if (data.bullets.length > 0) {
    const bulletRuns = data.bullets.map((b) => ({
      text: b,
      options: {
        bullet: data.layout === 'closing',
        breakLine: true,
        fontSize: 14,
        color: hex(theme.textSecondary),
        paraSpaceAfter: 6,
      },
    }));
    slide.addText(bulletRuns, {
      x: 1.15,
      y: 4.85,
      w: 10.5,
      h: 1.8,
      fontFace: 'Arial',
      valign: 'top',
    });
  }
}

function addStandardHeader(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  data: SlideData,
  theme: SlideTheme,
  slideNumber: number,
  totalSlides: number
) {
  // Top thin accent rule
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.75,
    y: 0.55,
    w: 0.65,
    h: 0.06,
    fill: { color: hex(theme.accent) },
    line: { color: hex(theme.accent) },
  });

  if (data.kicker) {
    slide.addText(data.kicker.toUpperCase(), {
      x: 1.55,
      y: 0.43,
      w: 8.5,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: hex(theme.accent),
      fontFace: 'Arial',
    });
  }

  slide.addText(`${slideNumber} / ${totalSlides}`, {
    x: 11.4,
    y: 0.43,
    w: 1.15,
    h: 0.3,
    fontSize: 10,
    color: hex(theme.textSecondary),
    align: 'right',
    fontFace: 'Courier New',
  });

  slide.addText(data.title, {
    x: 0.75,
    y: 0.85,
    w: 11.8,
    h: 0.75,
    fontSize: 25,
    bold: true,
    color: hex(theme.textPrimary),
    fontFace: 'Arial',
    valign: 'top',
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.75,
      y: 1.55,
      w: 11.5,
      h: 0.48,
      fontSize: 14,
      color: hex(theme.textSecondary),
      fontFace: 'Arial',
      valign: 'top',
    });
  }
}

export function buildPptxInstance(deck: PresentationDeck): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = deck.title;
  pptx.subject = deck.audience;
  pptx.author = 'SlideCraft Studio';

  const theme = getTheme(deck.themeId);
  const total = deck.slides.length;

  deck.slides.forEach((data, idx) => {
    const slide = pptx.addSlide();
    slide.background = { color: hex(theme.bg) };

    if (data.layout === 'title' || data.layout === 'closing') {
      renderTitleOrClosingSlide(pptx, slide, data, theme);
    } else {
      addStandardHeader(pptx, slide, data, theme, idx + 1, total);

      if (data.layout === 'metrics') {
        const metrics = (data.metrics ?? []).slice(0, 3);
        const cardWidth = 3.7;
        const gap = 0.35;
        metrics.forEach((m, mIdx) => {
          const x = 0.75 + mIdx * (cardWidth + gap);
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y: 2.35,
            w: cardWidth,
            h: 2.4,
            fill: { color: hex(theme.surface) },
            line: { color: hex(theme.border), width: 1 },
            rectRadius: 0.08,
          });
          slide.addText(m.label, {
            x: x + 0.25,
            y: 2.6,
            w: cardWidth - 0.5,
            h: 0.45,
            fontSize: 12,
            bold: true,
            color: hex(theme.textSecondary),
            fontFace: 'Arial',
          });
          slide.addText(m.value, {
            x: x + 0.25,
            y: 3.15,
            w: cardWidth - 0.5,
            h: 0.85,
            fontSize: 32,
            bold: true,
            color: hex(theme.accent),
            fontFace: 'Arial',
          });
          if (m.delta) {
            slide.addText(m.delta, {
              x: x + 0.25,
              y: 4.1,
              w: cardWidth - 0.5,
              h: 0.35,
              fontSize: 11,
              color: hex(theme.textSecondary),
              fontFace: 'Arial',
            });
          }
        });

        if (data.bullets.length > 0) {
          const runs = data.bullets.map((b) => ({
            text: b,
            options: {
              bullet: true,
              breakLine: true,
              fontSize: 14,
              color: hex(theme.textPrimary),
              paraSpaceAfter: 6,
            },
          }));
          slide.addText(runs, {
            x: 0.75,
            y: 5.15,
            w: 11.8,
            h: 1.7,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
      } else if (data.layout === 'two-column') {
        const cols = (data.columns ?? []).slice(0, 2);
        const colW = 5.7;
        const gap = 0.4;
        cols.forEach((col, cIdx) => {
          const x = 0.75 + cIdx * (colW + gap);
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y: 2.25,
            w: colW,
            h: 4.45,
            fill: { color: hex(theme.surface) },
            line: { color: hex(theme.border), width: 1 },
            rectRadius: 0.08,
          });
          slide.addText(col.heading, {
            x: x + 0.3,
            y: 2.5,
            w: colW - 0.6,
            h: 0.5,
            fontSize: 16,
            bold: true,
            color: hex(theme.accent),
            fontFace: 'Arial',
          });
          if (col.items.length > 0) {
            const runs = col.items.map((item) => ({
              text: item,
              options: {
                bullet: true,
                breakLine: true,
                fontSize: 14,
                color: hex(theme.textPrimary),
                paraSpaceAfter: 10,
              },
            }));
            slide.addText(runs, {
              x: x + 0.3,
              y: 3.15,
              w: colW - 0.6,
              h: 3.3,
              fontFace: 'Arial',
              valign: 'top',
            });
          }
        });
      } else if (data.layout === 'timeline') {
        const steps = data.bullets.slice(0, 4);
        const count = Math.max(1, steps.length);
        const stepW = (11.8 - (count - 1) * 0.3) / count;

        // Horizontal connector rail
        slide.addShape(pptx.ShapeType.line, {
          x: 0.75,
          y: 2.85,
          w: 11.8,
          h: 0,
          line: { color: hex(theme.border), width: 2 },
        });

        steps.forEach((step, sIdx) => {
          const x = 0.75 + sIdx * (stepW + 0.3);
          slide.addShape(pptx.ShapeType.ellipse, {
            x: x + 0.1,
            y: 2.65,
            w: 0.42,
            h: 0.42,
            fill: { color: hex(theme.accent) },
            line: { color: hex(theme.accent) },
          });
          slide.addText(`${sIdx + 1}`, {
            x: x + 0.1,
            y: 2.65,
            w: 0.42,
            h: 0.42,
            fontSize: 13,
            bold: true,
            color: hex(theme.accentText),
            align: 'center',
            valign: 'middle',
            fontFace: 'Arial',
          });
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y: 3.25,
            w: stepW,
            h: 3.2,
            fill: { color: hex(theme.surface) },
            line: { color: hex(theme.border), width: 1 },
            rectRadius: 0.08,
          });
          slide.addText(step, {
            x: x + 0.2,
            y: 3.5,
            w: stepW - 0.4,
            h: 2.7,
            fontSize: 13,
            color: hex(theme.textPrimary),
            fontFace: 'Arial',
            valign: 'top',
          });
        });
      } else {
        // Default 'agenda' layout
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.75,
          y: 2.25,
          w: 11.8,
          h: 4.45,
          fill: { color: hex(theme.surface) },
          line: { color: hex(theme.border), width: 1 },
          rectRadius: 0.08,
        });
        if (data.bullets.length > 0) {
          const runs = data.bullets.map((b) => ({
            text: b,
            options: {
              bullet: true,
              breakLine: true,
              fontSize: 16,
              color: hex(theme.textPrimary),
              paraSpaceAfter: 14,
            },
          }));
          slide.addText(runs, {
            x: 1.1,
            y: 2.55,
            w: 11.1,
            h: 3.9,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
      }
    }

    if (data.speakerNotes) {
      slide.addNotes(data.speakerNotes);
    }
  });

  return pptx;
}

export async function downloadDeckPptx(deck: PresentationDeck): Promise<void> {
  const pptx = buildPptxInstance(deck);
  const safeName =
    deck.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'presentation';
  await pptx.writeFile({ fileName: `${safeName}.pptx` });
}
