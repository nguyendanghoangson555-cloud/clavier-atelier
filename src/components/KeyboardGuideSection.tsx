import React from 'react';

interface KeyboardGuideSectionProps {
  baseOctave: number;
  onClose: () => void;
}

export const KeyboardGuideSection: React.FC<KeyboardGuideSectionProps> = ({
  baseOctave,
  onClose,
}) => {
  return (
    <section
      aria-label="Hướng dẫn bàn phím và phím tắt"
      className="rounded-xl border border-[#262930] bg-[#16181D] p-5"
    >
      <div className="flex items-center justify-between border-b border-[#23262E] pb-3.5">
        <div>
          <h2 className="font-display text-lg font-medium text-[#F6F3EC]">
            Hướng dẫn bàn phím &amp; luyện tập
          </h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            Đánh đàn trực tiếp bằng bàn phím máy tính, vuốt qua các phím hoặc tập theo chế độ Chờ bấm phím.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#2C303A] bg-[#111215] px-3 py-1.5 text-xs font-medium text-[#E5E7EB] hover:border-[#3F4452] cursor-pointer"
        >
          Quay lại thư viện
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#23262E] bg-[#121419] p-4">
          <h3 className="text-xs font-semibold text-[#E5A93C]">
            Quãng tám thấp (C{baseOctave} – B{baseOctave})
          </h3>
          <p className="mt-2 font-mono-tabular text-xs leading-relaxed text-[#D1D5DB]">
            Phím trắng: Z · X · C · V · B · N · M
          </p>
          <p className="mt-1 font-mono-tabular text-xs leading-relaxed text-[#9CA3AF]">
            Phím đen: S · D · G · H · J
          </p>
        </div>

        <div className="rounded-lg border border-[#23262E] bg-[#121419] p-4">
          <h3 className="text-xs font-semibold text-[#53AEE3]">
            Quãng tám cao (C{baseOctave + 1} – E{baseOctave + 2})
          </h3>
          <p className="mt-2 font-mono-tabular text-xs leading-relaxed text-[#D1D5DB]">
            Phím trắng: Q · W · E · R · T · Y · U · I · O · P
          </p>
          <p className="mt-1 font-mono-tabular text-xs leading-relaxed text-[#9CA3AF]">
            Phím đen: 2 · 3 · 5 · 6 · 7 · 9 · 0
          </p>
        </div>

        <div className="rounded-lg border border-[#23262E] bg-[#121419] p-4">
          <h3 className="text-xs font-semibold text-[#F3F1EC]">Phím tắt điều khiển</h3>
          <ul className="mt-2 space-y-1 text-xs text-[#9CA3AF]">
            <li>
              <span className="font-mono-tabular text-[#F3F1EC]">Space</span> — Phát hoặc Tạm dừng Auto-Piano
            </li>
            <li>
              <span className="font-mono-tabular text-[#F3F1EC]">Shift</span> — Giữ bàn đạp ngân vang
            </li>
            <li>
              <span className="font-mono-tabular text-[#F3F1EC]">[ / ]</span> — Tăng / giảm quãng tám bàn phím
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
