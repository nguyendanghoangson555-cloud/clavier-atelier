export type SlideLayout =
  | 'title'
  | 'agenda'
  | 'two-column'
  | 'metrics'
  | 'timeline'
  | 'closing';

export type ThemeId =
  | 'editorial-ivory'
  | 'midnight-boardroom'
  | 'sage-botanical'
  | 'warm-terracotta';

export interface SlideTheme {
  id: ThemeId;
  name: string;
  description: string;
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  isDark: boolean;
}

export interface SlideMetric {
  label: string;
  value: string;
  delta?: string;
}

export interface SlideColumn {
  heading: string;
  items: string[];
}

export interface SlideData {
  id: string;
  layout: SlideLayout;
  kicker?: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  columns?: SlideColumn[];
  metrics?: SlideMetric[];
  speakerNotes?: string;
}

export interface PresentationDeck {
  id: string;
  title: string;
  audience: string;
  tone: string;
  themeId: ThemeId;
  slides: SlideData[];
  updatedAt: number;
}

export interface GenerateDeckPayload {
  topic: string;
  slideCount: number;
  tone: 'Chuyên nghiệp' | 'Thuyết phục' | 'Sáng tạo' | 'Học thuật';
  audience: string;
  themeId: ThemeId;
}
