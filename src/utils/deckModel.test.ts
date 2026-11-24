import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_DECKS,
  createBlankSlide,
  deleteSlide,
  duplicateSlide,
  normalizeGeneratedDeck,
  reorderSlides,
} from './deckModel';
import { buildPptxInstance } from './pptxExporter';

test('normalizeGeneratedDeck sanitizes AI payloads and falls back safely', () => {
  const deck = normalizeGeneratedDeck(
    {
      title: 'Kế hoạch Thương mại Điện tử',
      slides: [
        {
          layout: 'title',
          title: 'Trang mở đầu',
          bullets: ['Mục tiêu 2026'],
        },
        {
          layout: 'unknown-layout',
          title: 'Phân tích thị trường',
          bullets: ['Ý 1', 'Ý 2'],
        },
        {
          layout: 'metrics',
          title: 'KPI',
          metrics: [{ label: 'Tăng trưởng', value: '+35%' }],
        },
      ],
    },
    {
      topic: 'TMĐT',
      audience: 'Nhà đầu tư',
      tone: 'Chuyên nghiệp',
      themeId: 'midnight-boardroom',
    }
  );

  assert.equal(deck.title, 'Kế hoạch Thương mại Điện tử');
  assert.equal(deck.themeId, 'midnight-boardroom');
  assert.equal(deck.slides.length, 3);
  assert.equal(deck.slides[0].layout, 'title');
  assert.equal(deck.slides[1].layout, 'agenda'); // invalid layout falls back to agenda
  assert.equal(deck.slides[2].metrics?.[0].value, '+35%');
});

test('slide CRUD operations (create, reorder, duplicate, delete) maintain invariants', () => {
  const s1 = createBlankSlide('title');
  const s2 = createBlankSlide('metrics');
  const s3 = createBlankSlide('closing');
  const initial = [s1, s2, s3];

  const reordered = reorderSlides(initial, 0, 2);
  assert.deepEqual(
    reordered.map((s) => s.id),
    [s2.id, s3.id, s1.id]
  );

  const duped = duplicateSlide(reordered, s2.id);
  assert.equal(duped.slides.length, 4);
  assert.ok(duped.newSlideId);
  assert.equal(duped.slides[1].id, duped.newSlideId);

  const afterDelete = deleteSlide(duped.slides, s3.id);
  assert.equal(afterDelete.length, 3);

  // Never deletes the last remaining slide
  const single = [s1];
  assert.equal(deleteSlide(single, s1.id).length, 1);
});

test('buildPptxInstance generates a valid .pptx binary ZIP archive', async () => {
  const deck = SAMPLE_DECKS[0];
  const pptx = buildPptxInstance(deck);
  const buffer = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;

  assert.ok(buffer instanceof Uint8Array);
  assert.ok(buffer.byteLength > 5000);
  // Standard ZIP / PPTX signature: 'PK' (0x50, 0x4B)
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4b);
});
