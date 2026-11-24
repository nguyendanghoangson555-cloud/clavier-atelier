import type { SlideTheme, ThemeId } from '../types/presentation';

export const SLIDE_THEMES: Record<ThemeId, SlideTheme> = {
  'editorial-ivory': {
    id: 'editorial-ivory',
    name: 'Biên tập Ngà Sáng',
    description: 'Nền giấy ngà thanh lịch, điểm nhấn xanh Cobalt hiện đại',
    bg: '#FAF9F6',
    surface: '#FFFFFF',
    border: '#E2DFD7',
    textPrimary: '#14171F',
    textSecondary: '#525866',
    accent: '#1E40AF',
    accentText: '#FFFFFF',
    isDark: false,
  },
  'midnight-boardroom': {
    id: 'midnight-boardroom',
    name: 'Hội nghị Đêm',
    description: 'Nền xanh đen sâu sang trọng, điểm nhấn vàng hổ phách',
    bg: '#0F141F',
    surface: '#182030',
    border: '#283348',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    accent: '#E5A93C',
    accentText: '#0F141F',
    isDark: true,
  },
  'sage-botanical': {
    id: 'sage-botanical',
    name: 'Xanh Rừng Thông',
    description: 'Tông xanh xám tự nhiên dịu mắt, phù hợp giáo dục & ESG',
    bg: '#F3F6F2',
    surface: '#FFFFFF',
    border: '#D6E0D3',
    textPrimary: '#18241D',
    textSecondary: '#4B5E52',
    accent: '#236444',
    accentText: '#FFFFFF',
    isDark: false,
  },
  'warm-terracotta': {
    id: 'warm-terracotta',
    name: 'Gốm Sứ Ấm',
    description: 'Sắc kem ấm áp kết hợp cam đất, nổi bật cho thương hiệu',
    bg: '#FBF7F2',
    surface: '#FFFFFF',
    border: '#EAE0D5',
    textPrimary: '#241B17',
    textSecondary: '#66554C',
    accent: '#B44324',
    accentText: '#FFFFFF',
    isDark: false,
  },
};

export const THEME_LIST: SlideTheme[] = Object.values(SLIDE_THEMES);

export function getTheme(themeId: ThemeId): SlideTheme {
  return SLIDE_THEMES[themeId] ?? SLIDE_THEMES['editorial-ivory'];
}
