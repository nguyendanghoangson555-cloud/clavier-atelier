import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Chưa cấu hình GEMINI_API_KEY. Vui lòng thiết lập khóa API trong phần Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Lỗi không xác định khi gọi Gemini API.';
  try {
    const parsed = JSON.parse(raw);
    const code = parsed?.error?.code;
    const msg = parsed?.error?.message;
    if (code === 503 || parsed?.error?.status === 'UNAVAILABLE') {
      return 'Máy chủ AI đang quá tải tạm thời (503). Vui lòng thử lại sau vài giây.';
    }
    if (code === 429) {
      return 'Đã vượt quá giới hạn lượt gọi AI tạm thời (429). Vui lòng thử lại sau ít phút.';
    }
    if (msg) return String(msg);
  } catch {
    // raw is plain text
  }
  return raw;
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 700 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/decks/generate', async (req, res) => {
    try {
      const { topic, slideCount = 6, tone = 'Chuyên nghiệp', audience = 'Ban điều hành' } =
        req.body ?? {};

      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        res.status(400).json({ error: 'Vui lòng nhập chủ đề bài thuyết trình.' });
        return;
      }

      const clampedCount = Math.max(3, Math.min(12, Number(slideCount) || 6));
      const ai = getGeminiClient();

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Hãy tạo một bài thuyết trình PowerPoint hoàn chỉnh bằng tiếng Việt cho chủ đề: "${topic.trim()}".
Đối tượng người nghe: ${audience}.
Phong cách trình bày: ${tone}.
Số lượng slide yêu cầu: đúng ${clampedCount} slide.

Yêu cầu phân bổ bố cục đa dạng và hợp lý:
- Slide 1 phải dùng layout "title".
- Slide cuối phải dùng layout "closing".
- Các slide ở giữa phối hợp linh hoạt các layout: "agenda", "metrics" (có 3 chỉ số KPI cụ thể), "two-column" (có 2 cột so sánh), và "timeline" (có 3-4 giai đoạn trong bullets).
- Viết nội dung cô đọng, súc tích chuẩn slide thuyết trình, mỗi gạch đầu dòng 8-18 từ, kèm ghi chú diễn giả (speakerNotes) ngắn gọn cho mỗi slide.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'Bạn là chuyên gia thiết kế bài thuyết trình doanh nghiệp và biên tập nội dung slide PowerPoint tiếng Việt. Luôn trả về JSON hợp lệ theo schema được chỉ định.',
            responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['title', 'slides'],
            properties: {
              title: { type: Type.STRING, description: 'Tiêu đề tổng thể của bài thuyết trình' },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ['layout', 'kicker', 'title', 'subtitle', 'bullets', 'speakerNotes'],
                  properties: {
                    layout: {
                      type: Type.STRING,
                      description:
                        'Một trong các giá trị: title, agenda, two-column, metrics, timeline, closing',
                    },
                    kicker: { type: Type.STRING, description: 'Nhãn mục ngắn phía trên tiêu đề' },
                    title: { type: Type.STRING, description: 'Tiêu đề chính của slide' },
                    subtitle: { type: Type.STRING, description: 'Phụ đề tóm tắt thông điệp' },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Danh sách ý chính ngắn gọn',
                    },
                    columns: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ['heading', 'items'],
                        properties: {
                          heading: { type: Type.STRING },
                          items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                      },
                      description: 'Dùng khi layout là two-column (2 cột)',
                    },
                    metrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ['label', 'value', 'delta'],
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.STRING },
                          delta: { type: Type.STRING },
                        },
                      },
                      description: 'Dùng khi layout là metrics (3 chỉ số)',
                    },
                    speakerNotes: {
                      type: Type.STRING,
                      description: 'Ghi chú dành cho người thuyết trình',
                    },
                  },
                },
              },
            },
          },
        },
        })
      );

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new Error('Mô hình AI không trả về danh sách slide hợp lệ. Vui lòng thử lại.');
      }
      res.json(parsed);
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  app.post('/api/decks/rewrite-slide', async (req, res) => {
    try {
      const { slide, instruction = 'Làm súc tích và sắc bén hơn' } = req.body ?? {};
      if (!slide || !slide.title) {
        res.status(400).json({ error: 'Thiếu dữ liệu slide cần biên tập.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Hãy biên tập lại nội dung slide PowerPoint tiếng Việt sau theo yêu cầu: "${instruction}".
Giữ nguyên layout "${slide.layout}".
Dữ liệu slide hiện tại: ${JSON.stringify(slide)}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'Bạn là biên tập viên thuyết trình chuyên nghiệp. Trả về đúng 1 object JSON của slide đã cải thiện bằng tiếng Việt.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              required: ['layout', 'kicker', 'title', 'subtitle', 'bullets', 'speakerNotes'],
              properties: {
                layout: { type: Type.STRING },
                kicker: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                columns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['heading', 'items'],
                    properties: {
                      heading: { type: Type.STRING },
                      items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                  },
                },
                metrics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['label', 'value', 'delta'],
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                      delta: { type: Type.STRING },
                    },
                  },
                },
                speakerNotes: { type: Type.STRING },
              },
            },
          },
        })
      );

      const rawText = (response.text ?? '{}').trim();
      res.json(JSON.parse(rawText));
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SlideCraft Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
