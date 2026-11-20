import React from 'react';
import {
  Circle,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import type { HandMode, KeyboardRangeMode, PianoVoice } from '../types/piano';
import { formatTime } from '../utils/autoPianoEngine';

interface TransportControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  transpose: number;
  waitMode: boolean;
  loopEnabled: boolean;
  metronomeEnabled: boolean;
  sustainHeld: boolean;
  handMode: HandMode;
  voice: PianoVoice;
  volume: number;
  keyboardRange: KeyboardRangeMode;
  showNoteLabels: boolean;
  showQwertyHints: boolean;
  baseOctave: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeTranspose: (delta: number) => void;
  onToggleWaitMode: () => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onToggleSustain: () => void;
  onChangeHandMode: (mode: HandMode) => void;
  onChangeVoice: (voice: PianoVoice) => void;
  onChangeVolume: (vol: number) => void;
  onChangeRange: (range: KeyboardRangeMode) => void;
  onToggleNoteLabels: () => void;
  onToggleQwertyHints: () => void;
  onChangeOctave: (delta: number) => void;
  onToggleRecord: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  isRecording,
  currentTime,
  duration,
  speed,
  transpose,
  waitMode,
  loopEnabled,
  metronomeEnabled,
  sustainHeld,
  handMode,
  voice,
  volume,
  keyboardRange,
  showNoteLabels,
  showQwertyHints,
  baseOctave,
  onTogglePlay,
  onRestart,
  onSeek,
  onChangeSpeed,
  onChangeTranspose,
  onToggleWaitMode,
  onToggleLoop,
  onToggleMetronome,
  onToggleSustain,
  onChangeHandMode,
  onChangeVoice,
  onChangeVolume,
  onChangeRange,
  onToggleNoteLabels,
  onToggleQwertyHints,
  onChangeOctave,
  onToggleRecord,
}) => {
  const speeds = [0.5, 0.75, 1, 1.25];

  return (
    <section
      aria-label="Bảng điều khiển auto-piano"
      className="rounded-xl border border-[#262930] bg-[#16181D] p-4 sm:p-5"
    >
      {/* Row 1: Primary Playback & Timeline Scrubber */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E5A93C] px-5 text-sm font-semibold text-[#111215] hover:bg-[#EEB854] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F3EC]"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Phát Tự Động</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestart}
            aria-label="Chơi lại từ đầu"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2C303A] bg-[#1D2027] px-3.5 text-xs font-medium text-[#E5E7EB] hover:border-[#3F4452] hover:bg-[#232730] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Chơi lại</span>
          </button>

          <button
            type="button"
            onClick={onToggleRecord}
            aria-pressed={isRecording}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
              isRecording
                ? 'border-[#DC2626] bg-[#DC2626]/15 text-[#FCA5A5]'
                : 'border-[#2C303A] bg-[#1D2027] text-[#E5E7EB] hover:border-[#3F4452] hover:bg-[#232730]'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current text-[#EF4444]" aria-hidden="true" />
                <span>Dừng thu</span>
              </>
            ) : (
              <>
                <Circle className="h-3.5 w-3.5 fill-[#EF4444] text-[#EF4444]" aria-hidden="true" />
                <span>Thu âm</span>
              </>
            )}
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex flex-1 items-center gap-3 lg:max-w-md xl:max-w-lg">
          <span className="w-10 text-right font-mono-tabular text-xs text-[#9CA3AF]">
            {formatTime(currentTime)}
          </span>
          <label htmlFor="song-scrubber" className="sr-only">
            Vị trí phát
          </label>
          <input
            id="song-scrubber"
            type="range"
            min={0}
            max={Math.max(1, duration)}
            step={0.05}
            value={Math.min(duration, currentTime)}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="studio-slider w-full"
          />
          <span className="w-10 font-mono-tabular text-xs text-[#9CA3AF]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Speed & Loop */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Tốc độ phát"
            className="inline-flex items-center rounded-lg border border-[#262930] bg-[#111215] p-0.5"
          >
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`rounded-md px-2.5 py-1.5 font-mono-tabular text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
                  speed === s
                    ? 'bg-[#252831] text-[#F3F1EC]'
                    : 'text-[#8B92A0] hover:text-[#F3F1EC]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleLoop}
            aria-pressed={loopEnabled}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
              loopEnabled
                ? 'border-[#E5A93C]/50 bg-[#E5A93C]/12 text-[#F3C677]'
                : 'border-[#262930] bg-[#111215] text-[#9CA3AF] hover:text-[#F3F1EC]'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Lặp lại</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3.5 h-px bg-[#23262E]" />

      {/* Row 2: Instrument Voice, Practice Wait Mode, Hand Focus, Keyboard Options */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        {/* Left group: Voice + Hand focus + Wait Mode */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="voice-select" className="text-xs font-medium text-[#9CA3AF] whitespace-nowrap">
              Âm sắc
            </label>
            <select
              id="voice-select"
              value={voice}
              onChange={(e) => onChangeVoice(e.target.value as PianoVoice)}
              className="h-8 rounded-lg border border-[#2C303A] bg-[#111215] px-2 text-xs font-medium text-[#F3F1EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              <option value="grand">Đại dương cầm</option>
              <option value="upright">Piano đứng ấm</option>
              <option value="electric">Piano điện</option>
              <option value="harpsichord">Harpsichord</option>
            </select>
          </div>

          <div
            role="group"
            aria-label="Chọn tay luyện tập"
            className="inline-flex items-center rounded-lg border border-[#262930] bg-[#111215] p-0.5"
          >
            {(['both', 'right', 'left'] as HandMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeHandMode(mode)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
                  handMode === mode
                    ? 'bg-[#252831] text-[#F3F1EC]'
                    : 'text-[#8B92A0] hover:text-[#F3F1EC]'
                }`}
              >
                {mode === 'both' ? 'Hai tay' : mode === 'right' ? 'Tay phải' : 'Tay trái'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleWaitMode}
            aria-pressed={waitMode}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
              waitMode
                ? 'border-[#E5A93C] bg-[#E5A93C]/15 text-[#F6D08A]'
                : 'border-[#2C303A] bg-[#111215] text-[#9CA3AF] hover:text-[#F3F1EC]'
            }`}
          >
            <span>Chờ bấm phím</span>
            <span className="font-mono-tabular text-[11px]">{waitMode ? 'BẬT' : 'TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSustain}
            aria-pressed={sustainHeld}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
              sustainHeld
                ? 'border-[#E5A93C] bg-[#E5A93C]/15 text-[#F6D08A]'
                : 'border-[#2C303A] bg-[#111215] text-[#9CA3AF] hover:text-[#F3F1EC]'
            }`}
          >
            <span>Ngân vang</span>
            <span className="font-mono-tabular text-[11px]">{sustainHeld ? 'GIỮ' : 'TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMetronome}
            aria-pressed={metronomeEnabled}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
              metronomeEnabled
                ? 'border-[#53AEE3] bg-[#53AEE3]/15 text-[#A5DDF9]'
                : 'border-[#2C303A] bg-[#111215] text-[#9CA3AF] hover:text-[#F3F1EC]'
            }`}
          >
            <span>Đếm nhịp</span>
          </button>
        </div>

        {/* Right group: Transpose, Range, Labels, Volume */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
            <span>Dịch giọng</span>
            <button
              type="button"
              aria-label="Giảm 1 nửa cung"
              onClick={() => onChangeTranspose(-1)}
              className="h-7 w-7 rounded border border-[#2C303A] bg-[#111215] font-mono-tabular text-[#E5E7EB] hover:bg-[#232730] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              -
            </button>
            <span className="w-6 text-center font-mono-tabular text-[#F3F1EC]">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button
              type="button"
              aria-label="Tăng 1 nửa cung"
              onClick={() => onChangeTranspose(1)}
              className="h-7 w-7 rounded border border-[#2C303A] bg-[#111215] font-mono-tabular text-[#E5E7EB] hover:bg-[#232730] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
            <span>Quãng</span>
            <button
              type="button"
              aria-label="Giảm quãng tám bàn phím"
              onClick={() => onChangeOctave(-1)}
              className="h-7 w-7 rounded border border-[#2C303A] bg-[#111215] font-mono-tabular text-[#E5E7EB] hover:bg-[#232730] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              -
            </button>
            <span className="w-6 text-center font-mono-tabular text-[#F3F1EC]">
              C{baseOctave}
            </span>
            <button
              type="button"
              aria-label="Tăng quãng tám bàn phím"
              onClick={() => onChangeOctave(1)}
              className="h-7 w-7 rounded border border-[#2C303A] bg-[#111215] font-mono-tabular text-[#E5E7EB] hover:bg-[#232730] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              +
            </button>
          </div>

          <div
            role="group"
            aria-label="Số phím đàn"
            className="inline-flex items-center rounded-lg border border-[#262930] bg-[#111215] p-0.5"
          >
            <button
              type="button"
              onClick={() => onChangeRange('61')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                keyboardRange === '61'
                  ? 'bg-[#252831] text-[#F3F1EC]'
                  : 'text-[#8B92A0] hover:text-[#F3F1EC]'
              }`}
            >
              61 Phím
            </button>
            <button
              type="button"
              onClick={() => onChangeRange('88')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                keyboardRange === '88'
                  ? 'bg-[#252831] text-[#F3F1EC]'
                  : 'text-[#8B92A0] hover:text-[#F3F1EC]'
              }`}
            >
              88 Phím
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleNoteLabels}
            aria-pressed={showNoteLabels}
            className={`h-8 rounded-lg border px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showNoteLabels
                ? 'border-[#3F4452] bg-[#252831] text-[#F3F1EC]'
                : 'border-[#262930] bg-[#111215] text-[#8B92A0] hover:text-[#F3F1EC]'
            }`}
          >
            Tên nốt
          </button>

          <button
            type="button"
            onClick={onToggleQwertyHints}
            aria-pressed={showQwertyHints}
            className={`h-8 rounded-lg border px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showQwertyHints
                ? 'border-[#3F4452] bg-[#252831] text-[#F3F1EC]'
                : 'border-[#262930] bg-[#111215] text-[#8B92A0] hover:text-[#F3F1EC]'
            }`}
          >
            Phím tắt
          </button>

          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-[#9CA3AF]" aria-hidden="true" />
            <label htmlFor="master-volume" className="sr-only">
              Âm lượng chính
            </label>
            <input
              id="master-volume"
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="studio-slider w-16"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
