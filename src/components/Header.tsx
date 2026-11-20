import React from 'react';
import { Upload } from 'lucide-react';

interface HeaderProps {
  activeView: 'studio' | 'repertoire' | 'recordings' | 'guide';
  onSelectView: (view: 'studio' | 'repertoire' | 'recordings' | 'guide') => void;
  onTriggerMidiImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onTriggerMidiImport,
}) => {
  const navItems: Array<{ id: 'studio' | 'repertoire' | 'recordings' | 'guide'; label: string }> = [
    { id: 'studio', label: 'Sân khấu đàn' },
    { id: 'repertoire', label: 'Kho bản nhạc' },
    { id: 'recordings', label: 'Bản thu của tôi' },
    { id: 'guide', label: 'Hướng dẫn phím' },
  ];

  return (
    <header className="w-full border-b border-[#262930] bg-[#13151A]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('studio');
          }}
          className="font-display text-xl font-semibold tracking-tight text-[#F6F3EC] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] rounded"
        >
          Clavier Atelier
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] rounded ${
                  isActive
                    ? 'text-[#F6F3EC] after:absolute after:inset-x-0 after:-bottom-[15px] after:h-[2px] after:bg-[#E5A93C]'
                    : 'text-[#9CA3AF] hover:text-[#F6F3EC]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onTriggerMidiImport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E5A93C] px-4 py-2 text-xs font-semibold text-[#111215] hover:bg-[#EEB854] active:scale-[0.99] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F3EC]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Nhập MIDI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
