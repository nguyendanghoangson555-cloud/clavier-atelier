import type {
  PresentationDeck,
  SlideColumn,
  SlideData,
  SlideLayout,
  SlideMetric,
  ThemeId,
} from '../types/presentation';

export const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title: 'Trang bìa',
  agenda: 'Nội dung chính',
  'two-column': 'So sánh 2 cột',
  metrics: 'Số liệu KPI',
  timeline: 'Lộ trình cột mốc',
  closing: 'Kết luận & Hành động',
};

const VALID_LAYOUTS = new Set<SlideLayout>([
  'title',
  'agenda',
  'two-column',
  'metrics',
  'timeline',
  'closing',
]);

export function createSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlankSlide(layout: SlideLayout = 'agenda'): SlideData {
  const id = createSlideId();
  if (layout === 'title') {
    return {
      id,
      layout: 'title',
      kicker: 'CHUYÊN ĐỀ',
      title: 'Tiêu đề bài thuyết trình mới',
      subtitle: 'Tóm tắt ngắn gọn thông điệp cốt lõi dành cho người nghe',
      bullets: ['Người trình bày: Nhóm Chiến lược', 'Thời gian: 2026'],
      speakerNotes: 'Giới thiệu tổng quan bối cảnh và mục tiêu của buổi thuyết trình.',
    };
  }
  if (layout === 'metrics') {
    return {
      id,
      layout: 'metrics',
      kicker: 'CHỈ SỐ TRỌNG TÂM',
      title: 'Kết quả tăng trưởng nổi bật',
      subtitle: 'Tổng hợp các chỉ số đo lường hiệu quả trong giai đoạn vừa qua',
      bullets: ['Tỷ lệ giữ chân khách hàng cải thiện đều qua từng quý'],
      metrics: [
        { label: 'Doanh thu tăng trưởng', value: '+42%', delta: 'So với cùng kỳ' },
        { label: 'Người dùng hoạt động', value: '128K', delta: '+18% MoM' },
        { label: 'Chỉ số hài lòng (NPS)', value: '74', delta: 'Mức xuất sắc' },
      ],
      speakerNotes: 'Nhấn mạnh động lực tăng trưởng chính đến từ kênh chuyển đổi tự nhiên.',
    };
  }
  if (layout === 'two-column') {
    return {
      id,
      layout: 'two-column',
      kicker: 'PHÂN TÍCH ĐỐI CHIẾU',
      title: 'So sánh phương án triển khai',
      subtitle: 'Đánh giá lợi ích và thách thức của hai hướng tiếp cận',
      bullets: [],
      columns: [
        {
          heading: 'Phương án A · Mở rộng nhanh',
          items: [
            'Triển khai trong 4 tuần đầu tiên',
            'Tập trung vào nhóm khách hàng mục tiêu sẵn có',
            'Chi phí vận hành ban đầu tối ưu',
          ],
        },
        {
          heading: 'Phương án B · Đầu tư nền tảng',
          items: [
            'Xây dựng hệ thống tự động hóa dài hạn',
            'Tăng khả năng tùy biến cho doanh nghiệp lớn',
            'Biên lợi nhuận cao hơn sau 6 tháng',
          ],
        },
      ],
      speakerNotes: 'Đề xuất kết hợp ưu điểm của cả hai phương án theo từng giai đoạn.',
    };
  }
  if (layout === 'timeline') {
    return {
      id,
      layout: 'timeline',
      kicker: 'LỘ TRÌNH THỰC THI',
      title: 'Kế hoạch hành động theo 4 giai đoạn',
      subtitle: 'Các cột mốc bàn giao chính từ khởi động đến mở rộng',
      bullets: [
        'Giai đoạn 1: Khảo sát nhu cầu và chốt phạm vi sản phẩm',
        'Giai đoạn 2: Xây dựng nguyên mẫu và kiểm thử với 20 khách hàng',
        'Giai đoạn 3: Ra mắt chính thức và tối ưu phễu chuyển đổi',
        'Giai đoạn 4: Mở rộng quy mô và tự động hóa vận hành',
      ],
      speakerNotes: 'Làm rõ trách nhiệm từng bộ phận tại mỗi mốc bàn giao.',
    };
  }
  if (layout === 'closing') {
    return {
      id,
      layout: 'closing',
      kicker: 'BƯỚC TIẾP THEO',
      title: 'Cam kết & Kêu gọi hành động',
      subtitle: 'Cảm ơn quý vị đã lắng nghe — Sẵn sàng thảo luận chi tiết',
      bullets: [
        'Phê duyệt ngân sách và nhân sự nòng cốt trong tuần này',
        'Khởi động buổi họp triển khai đầu tiên vào thứ Hai tới',
        'Theo dõi báo cáo tiến độ định kỳ mỗi 2 tuần',
      ],
      speakerNotes: 'Chốt các đầu việc cần quyết định ngay sau cuộc họp.',
    };
  }

  return {
    id,
    layout: 'agenda',
    kicker: 'LUẬN ĐIỂM CHÍNH',
    title: 'Trọng tâm nội dung cần trình bày',
    subtitle: 'Các ý chính được chắt lọc ngắn gọn và rõ ràng',
    bullets: [
      'Xác định rõ vấn đề cốt lõi đang ảnh hưởng đến hiệu suất chung',
      'Đề xuất giải pháp khả thi dựa trên dữ liệu thực tế',
      'Đo lường tác động và thiết lập cơ chế cải tiến liên tục',
    ],
    speakerNotes: 'Trình bày mạch lạc từng ý và liên hệ ví dụ thực tế.',
  };
}

export function reorderSlides(
  slides: SlideData[],
  fromIndex: number,
  toIndex: number
): SlideData[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= slides.length ||
    toIndex >= slides.length ||
    fromIndex === toIndex
  ) {
    return slides;
  }
  const copy = [...slides];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

export function duplicateSlide(slides: SlideData[], slideId: string): {
  slides: SlideData[];
  newSlideId: string | null;
} {
  const idx = slides.findIndex((s) => s.id === slideId);
  if (idx === -1) return { slides, newSlideId: null };
  const orig = slides[idx];
  const copy: SlideData = {
    ...orig,
    id: createSlideId(),
    title: `${orig.title} (Bản sao)`,
    bullets: [...orig.bullets],
    columns: orig.columns?.map((c) => ({ heading: c.heading, items: [...c.items] })),
    metrics: orig.metrics?.map((m) => ({ ...m })),
  };
  const next = [...slides];
  next.splice(idx + 1, 0, copy);
  return { slides: next, newSlideId: copy.id };
}

export function deleteSlide(slides: SlideData[], slideId: string): SlideData[] {
  if (slides.length <= 1) return slides;
  return slides.filter((s) => s.id !== slideId);
}

interface RawSlideInput {
  layout?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  bullets?: unknown;
  columns?: unknown;
  metrics?: unknown;
  speakerNotes?: string;
}

export function normalizeSlide(raw: RawSlideInput, index: number): SlideData {
  const layout: SlideLayout = VALID_LAYOUTS.has(raw.layout as SlideLayout)
    ? (raw.layout as SlideLayout)
    : index === 0
      ? 'title'
      : 'agenda';

  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets
        .map((b) => String(b ?? '').trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const columns: SlideColumn[] | undefined = Array.isArray(raw.columns)
    ? raw.columns
        .slice(0, 2)
        .map((c: unknown) => {
          const obj = (c ?? {}) as { heading?: unknown; items?: unknown };
          return {
            heading: String(obj.heading ?? 'Nhóm nội dung').trim() || 'Nhóm nội dung',
            items: Array.isArray(obj.items)
              ? obj.items.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 5)
              : [],
          };
        })
        .filter((c) => c.heading || c.items.length > 0)
    : undefined;

  const metrics: SlideMetric[] | undefined = Array.isArray(raw.metrics)
    ? raw.metrics
        .slice(0, 4)
        .map((m: unknown) => {
          const obj = (m ?? {}) as { label?: unknown; value?: unknown; delta?: unknown };
          return {
            label: String(obj.label ?? 'Chỉ số').trim() || 'Chỉ số',
            value: String(obj.value ?? '—').trim() || '—',
            delta: obj.delta ? String(obj.delta).trim() : undefined,
          };
        })
    : undefined;

  return {
    id: createSlideId(),
    layout,
    kicker: raw.kicker ? String(raw.kicker).trim() : undefined,
    title: String(raw.title ?? `Slide ${index + 1}`).trim() || `Slide ${index + 1}`,
    subtitle: raw.subtitle ? String(raw.subtitle).trim() : undefined,
    bullets:
      bullets.length > 0 || layout === 'two-column' || layout === 'metrics'
        ? bullets
        : ['Nội dung đang được biên tập'],
    columns:
      layout === 'two-column'
        ? columns && columns.length >= 2
          ? columns
          : [
              { heading: 'Cột 1', items: bullets.slice(0, 2) },
              { heading: 'Cột 2', items: bullets.slice(2, 4) },
            ]
        : columns,
    metrics:
      layout === 'metrics'
        ? metrics && metrics.length > 0
          ? metrics
          : [{ label: 'Chỉ số chính', value: '100%' }]
        : metrics,
    speakerNotes: raw.speakerNotes ? String(raw.speakerNotes).trim() : '',
  };
}

export function normalizeGeneratedDeck(
  raw: {
    title?: string;
    slides?: RawSlideInput[];
  },
  options: {
    topic: string;
    audience: string;
    tone: string;
    themeId: ThemeId;
  }
): PresentationDeck {
  const rawSlides = Array.isArray(raw.slides) ? raw.slides : [];
  const slides =
    rawSlides.length > 0
      ? rawSlides.map((s, i) => normalizeSlide(s, i))
      : [createBlankSlide('title'), createBlankSlide('agenda'), createBlankSlide('closing')];

  return {
    id: `deck-${Date.now()}`,
    title: String(raw.title ?? options.topic).trim() || options.topic,
    audience: options.audience,
    tone: options.tone,
    themeId: options.themeId,
    slides,
    updatedAt: Date.now(),
  };
}

export const SAMPLE_DECKS: PresentationDeck[] = [
  {
    id: 'sample-strategy-2026',
    title: 'Chiến lược Tăng trưởng Sản phẩm AI 2026',
    audience: 'Ban điều hành & Đầu tư',
    tone: 'Chuyên nghiệp',
    themeId: 'editorial-ivory',
    updatedAt: Date.now(),
    slides: [
      {
        id: 's1-title',
        layout: 'title',
        kicker: 'ĐỊNH HƯỚNG CHIẾN LƯỢC · 2026',
        title: 'Chiến lược Tăng trưởng Sản phẩm AI 2026',
        subtitle: 'Tăng tốc chuyển đổi doanh nghiệp vừa và nhỏ thông qua quy trình tự động hóa thông minh',
        bullets: ['Bộ phận Chiến lược Sản phẩm', 'Trình bày Quý 4 · Phiên bản Ban điều hành'],
        speakerNotes: 'Chào mừng ban điều hành. Hôm nay chúng ta tập trung vào 3 trụ cột mở rộng sản phẩm trong năm 2026.',
      },
      {
        id: 's1-metrics',
        layout: 'metrics',
        kicker: 'HIỆU SUẤT HIỆN TẠI',
        title: 'Đà tăng trưởng vững chắc qua 4 quý liên tiếp',
        subtitle: 'Nhu cầu tự động hóa tài liệu văn phòng tăng mạnh ở nhóm khách hàng SME',
        bullets: ['Tỷ lệ chuyển đổi từ dùng thử sang trả phí đạt mức cao nhất từ trước tới nay'],
        metrics: [
          { label: 'Doanh thu định kỳ (ARR)', value: '48,5 Tỷ', delta: '+64% YoY' },
          { label: 'Doanh nghiệp sử dụng', value: '3.420', delta: '+410 trong Q3' },
          { label: 'Mức độ hài lòng (CSAT)', value: '94,2%', delta: '+5,1 điểm' },
        ],
        speakerNotes: 'Nhấn mạnh con số 48,5 tỷ ARR đến từ việc giảm thời gian thao tác thủ công cho khách hàng.',
      },
      {
        id: 's1-two-col',
        layout: 'two-column',
        kicker: 'BÀI TOÁN THỊ TRƯỜNG',
        title: 'Khoảng cách giữa kỳ vọng và công cụ hiện tại',
        subtitle: 'Người dùng mất nhiều thời gian căn chỉnh bố cục hơn là đầu tư cho nội dung cốt lõi',
        bullets: [],
        columns: [
          {
            heading: 'Hiện trạng thủ công',
            items: [
              'Mất 4–6 giờ để hoàn thiện 1 bộ slide báo cáo 15 trang',
              'Thiếu nhất quán màu sắc và phông chữ giữa các phòng ban',
              'Khó chuyển đổi nhanh từ ghi chú họp sang bản trình bày',
            ],
          },
          {
            heading: 'Giải pháp Tự động hóa',
            items: [
              'Sinh dàn ý và nội dung slide hoàn chỉnh dưới 30 giây',
              'Hệ thống chủ đề chuẩn thiết kế, tự cân chỉnh bố cục',
              'Xuất trực tiếp tệp .pptx tương thích PowerPoint & Keynote',
            ],
          },
        ],
        speakerNotes: 'So sánh trực diện nỗi đau của đội ngũ văn phòng và giá trị cốt lõi của sản phẩm mới.',
      },
      {
        id: 's1-timeline',
        layout: 'timeline',
        kicker: 'LỘ TRÌNH TRIỂN KHAI',
        title: '4 cột mốc trọng yếu trong năm 2026',
        subtitle: 'Phân bổ nguồn lực kỹ thuật và thương mại theo từng quý',
        bullets: [
          'Quý 1: Ra mắt bộ tạo slide tự động đa bố cục và xuất .pptx chuẩn',
          'Quý 2: Tích hợp nhập dữ liệu bảng tính và biểu đồ thông minh',
          'Quý 3: Phát hành không gian cộng tác nhóm theo thời gian thực',
          'Quý 4: Mở rộng thị trường Đông Nam Á với gói Doanh nghiệp',
        ],
        speakerNotes: 'Quý 1 và Quý 2 ưu tiên độ chính xác của bố cục và khả năng xuất tệp PowerPoint mượt mà.',
      },
      {
        id: 's1-closing',
        layout: 'closing',
        kicker: 'QUYẾT NGHỊ ĐỀ XUẤT',
        title: 'Sẵn sàng bước vào giai đoạn tăng tốc',
        subtitle: 'Cảm ơn quý vị — Kính mời ban điều hành trao đổi và đặt câu hỏi',
        bullets: [
          'Phê duyệt gói đầu tư R&D cho lõi sinh bố cục tự động trong tháng này',
          'Mở rộng chương trình thử nghiệm sớm cho 50 khách hàng chiến lược',
          'Đánh giá KPI đợt 1 sau 60 ngày triển khai',
        ],
        speakerNotes: 'Xin ý kiến phê duyệt ngân sách Q1 từ Ban điều hành.',
      },
    ],
  },
  {
    id: 'sample-coffee-launch',
    title: 'Kế hoạch Ra mắt Thương hiệu Cà phê Đặc sản',
    audience: 'Đội ngũ Marketing & Đối tác',
    tone: 'Sáng tạo',
    themeId: 'warm-terracotta',
    updatedAt: Date.now(),
    slides: [
      {
        id: 's2-title',
        layout: 'title',
        kicker: 'RA MẮT THƯƠNG HIỆU',
        title: 'Highland Roast — Cà phê Đặc sản Cao nguyên',
        subtitle: 'Chiến dịch định vị hương vị nguyên bản từ nông trại Lâm Đồng đến bàn làm việc hiện đại',
        bullets: ['Phòng Tiếp thị Thương hiệu', 'Chiến dịch Mùa Thu 2026'],
        speakerNotes: 'Giới thiệu câu chuyện thương hiệu gắn liền vùng nguyên liệu Cầu Đất.',
      },
      {
        id: 's2-agenda',
        layout: 'agenda',
        kicker: 'TRỤ CỘT TRUYỀN THÔNG',
        title: 'Ba điểm chạm chinh phục khách hàng thành thị',
        subtitle: 'Kết hợp trải nghiệm tại điểm bán và câu chuyện truy xuất nguồn gốc',
        bullets: [
          'Bao bì tối giản có mã QR xem nhật ký rang xay và độ cao vùng trồng',
          'Chuỗi sự kiện thử nếm cuối tuần tại các không gian sáng tạo',
          'Gói thuê bao giao cà phê hạt tươi định kỳ hàng tuần cho văn phòng',
        ],
        speakerNotes: 'Tập trung vào nhóm khách hàng trẻ yêu thích sự minh bạch nguồn gốc.',
      },
      {
        id: 's2-metrics',
        layout: 'metrics',
        kicker: 'MỤC TIÊU 90 NGÀY ĐẦU',
        title: 'Chỉ tiêu độ phủ và chuyển đổi chiến dịch',
        subtitle: 'Đo lường đồng thời nhận diện thương hiệu và doanh số kênh trực tuyến',
        bullets: ['Tối ưu chi phí thu hút khách hàng mới thông qua giới thiệu bạn bè'],
        metrics: [
          { label: 'Điểm bán đối tác', value: '45', delta: 'TP.HCM & Hà Nội' },
          { label: 'Đơn thuê bao tháng', value: '1.800', delta: 'Mục tiêu Q3' },
          { label: 'Tỷ lệ quay lại', value: '62%', delta: 'Chu kỳ 30 ngày' },
        ],
        speakerNotes: 'Mục tiêu 1.800 đơn thuê bao là điểm hòa vốn cho xưởng rang mới.',
      },
      {
        id: 's2-closing',
        layout: 'closing',
        kicker: 'HÀNH ĐỘNG NGAY',
        title: 'Cùng lan tỏa hương vị nguyên bản',
        subtitle: 'Liên hệ nhóm Thương hiệu để nhận bộ ấn phẩm truyền thông chi tiết',
        bullets: [
          'Chốt danh sách 15 đối tác quán cà phê tiên phong trước ngày 15',
          'Hoàn thiện bộ ảnh sản phẩm và video câu chuyện nông dân',
        ],
        speakerNotes: 'Cảm ơn các đối tác đã tham gia buổi giới thiệu.',
      },
    ],
  },
];
