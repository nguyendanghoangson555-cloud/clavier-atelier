import React from 'react';
import { Download } from 'lucide-react';

export type WorkspaceTab = 'editor' | 'ai-generator' | 'templates';

interface HeaderProps {
  activeTab: WorkspaceTab;
  isExporting: boolean;
  onSelectTab: (tab: WorkspaceTab) => void;
  onStartPresent: () => void;
  onExportPptx: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isExporting,
  onSelectTab,
  onStartPresent,
  onExportPptx,
}) => {
  return (
    <header className="w-full border-b border-[#E3E0D8] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('editor');
          }}
          className="font-display text-xl font-bold tracking-tight text-[#14171F] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded"
        >
          SlideCraft
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-7">
          <button
            type="button"
            onClick={() => onSelectTab('editor')}
            className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded ${
              activeTab === 'editor'
                ? 'text-[#14171F] after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-[#1E40AF]'
                : 'text-[#626978] hover:text-[#14171F]'
            }`}
          >
            Trình biên tập
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('ai-generator')}
            className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded ${
              activeTab === 'ai-generator'
                ? 'text-[#14171F] after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-[#1E40AF]'
                : 'text-[#626978] hover:text-[#14171F]'
            }`}
          >
            Tạo tự động AI
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('templates')}
            className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded ${
              activeTab === 'templates'
                ? 'text-[#14171F] after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-[#1E40AF]'
                : 'text-[#626978] hover:text-[#14171F]'
            }`}
          >
            Kho mẫu
          </button>
          <button
            type="button"
            onClick={onStartPresent}
            className="py-1 text-sm font-medium text-[#626978] hover:text-[#14171F] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] rounded"
          >
            Trình chiếu
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={onExportPptx}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E40AF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF] focus-visible:ring-offset-2"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất .pptx'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav
        aria-label="Điều hướng di động"
        className="flex md:hidden items-center gap-5 overflow-x-auto border-t border-[#EDEBE4] px-4 py-2"
      >
        <button
          type="button"
          onClick={() => onSelectTab('editor')}
          className={`py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'editor'
              ? 'text-[#1E40AF] font-semibold'
              : 'text-[#626978]'
          }`}
        >
          Trình biên tập
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('ai-generator')}
          className={`py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ai-generator'
              ? 'text-[#1E40AF] font-semibold'
              : 'text-[#626978]'
          }`}
        >
          Tạo tự động AI
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('templates')}
          className={`py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'templates'
              ? 'text-[#1E40AF] font-semibold'
              : 'text-[#626978]'
          }`}
        >
          Kho mẫu
        </button>
        <button
          type="button"
          onClick={onStartPresent}
          className="py-1 text-xs font-medium text-[#626978] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Trình chiếu
        </button>
      </nav>
    </header>
  );
};
