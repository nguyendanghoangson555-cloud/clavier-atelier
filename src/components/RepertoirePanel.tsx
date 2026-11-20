import React, { useMemo, useState } from 'react';
import { Music, Play, Search, Trash2, Upload } from 'lucide-react';
import type { DifficultyLevel, SongPiece } from '../types/piano';
import { formatTime } from '../utils/autoPianoEngine';

interface RepertoirePanelProps {
  songs: SongPiece[];
  recordings: SongPiece[];
  activeSongId: string;
  activeTab: 'repertoire' | 'recordings';
  onChangeTab: (tab: 'repertoire' | 'recordings') => void;
  onSelectSong: (song: SongPiece, autoPlay?: boolean) => void;
  onDeleteRecording: (id: string) => void;
  onUploadMidiFile: (file: File) => void;
  midiError: string | null;
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Concert: 'Hòa nhạc',
};

export const RepertoirePanel: React.FC<RepertoirePanelProps> = ({
  songs,
  recordings,
  activeSongId,
  activeTab,
  onChangeTab,
  onSelectSong,
  onDeleteRecording,
  onUploadMidiFile,
  midiError,
}) => {
  const [query, setQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | DifficultyLevel>('All');

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      const matchesDifficulty =
        difficultyFilter === 'All' || s.difficulty === difficultyFilter;
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        s.keySignature.toLowerCase().includes(q);
      return matchesDifficulty && matchesQuery;
    });
  }, [songs, query, difficultyFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadMidiFile(file);
      e.target.value = '';
    }
  };

  return (
    <section
      aria-label="Kho bản nhạc và bản thu"
      className="rounded-xl border border-[#262930] bg-[#16181D] p-5"
    >
      <div className="flex flex-col gap-4 border-b border-[#23262E] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Danh mục thư viện"
          className="inline-flex items-center rounded-lg border border-[#262930] bg-[#111215] p-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'repertoire'}
            onClick={() => onChangeTab('repertoire')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'repertoire'
                ? 'bg-[#252831] text-[#F6F3EC]'
                : 'text-[#8B92A0] hover:text-[#F6F3EC]'
            }`}
          >
            Kho bản nhạc ({songs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recordings'}
            onClick={() => onChangeTab('recordings')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'recordings'
                ? 'bg-[#252831] text-[#F6F3EC]'
                : 'text-[#8B92A0] hover:text-[#F6F3EC]'
            }`}
          >
            Bản thu của tôi ({recordings.length})
          </button>
        </div>

        {activeTab === 'repertoire' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B7280]"
                aria-hidden="true"
              />
              <label htmlFor="repertoire-search" className="sr-only">
                Tìm kiếm bản nhạc
              </label>
              <input
                id="repertoire-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên bài, tác giả, giọng..."
                className="h-9 w-56 rounded-lg border border-[#2C303A] bg-[#111215] pl-8 pr-3 text-xs text-[#F3F1EC] placeholder-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
              />
            </div>

            <div
              role="group"
              aria-label="Lọc theo trình độ"
              className="inline-flex items-center rounded-lg border border-[#262930] bg-[#111215] p-0.5"
            >
              {(['All', 'Beginner', 'Intermediate', 'Concert'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyFilter(level)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficultyFilter === level
                      ? 'bg-[#252831] text-[#F6F3EC]'
                      : 'text-[#8B92A0] hover:text-[#F6F3EC]'
                  }`}
                >
                  {level === 'All' ? 'Tất cả' : DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {midiError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 px-4 py-2.5 text-xs text-[#FCA5A5]"
        >
          {midiError}
        </div>
      )}

      {activeTab === 'repertoire' ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => {
            const isSelected = song.id === activeSongId;
            return (
              <div
                key={song.id}
                className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-[#E5A93C]/70 bg-[#1D2027]'
                    : 'border-[#252830] bg-[#121419] hover:border-[#373C47]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-medium text-[#F6F3EC] leading-snug">
                      {song.title}
                    </h3>
                    <button
                      type="button"
                      aria-label={`Phát ${song.title}`}
                      onClick={() => onSelectSong(song, true)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
                        isSelected
                          ? 'bg-[#E5A93C] text-[#111215]'
                          : 'border border-[#2C303A] bg-[#181B22] text-[#E5E7EB] hover:border-[#E5A93C] hover:text-[#E5A93C]'
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#A3A8B4]">{song.composer}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#21242C] pt-2.5 text-[11px] text-[#8B92A0]">
                  <span>
                    {DIFFICULTY_LABELS[song.difficulty]} · {song.keySignature}
                  </span>
                  <span className="font-mono-tabular">
                    {song.bpm} BPM · {formatTime(song.duration)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* MIDI Import Card */}
          <label className="flex min-h-[116px] flex-col items-center justify-center rounded-lg border border-dashed border-[#343946] bg-[#121419] p-4 text-center transition-colors hover:border-[#E5A93C]/70 hover:bg-[#171A21] cursor-pointer">
            <Upload className="h-5 w-5 text-[#E5A93C]" aria-hidden="true" />
            <span className="mt-2 text-xs font-medium text-[#F3F1EC]">
              Tải tệp MIDI chuẩn (.mid)
            </span>
            <span className="mt-0.5 text-[11px] text-[#8B92A0]">
              Hỗ trợ đa âm và bàn đạp ngân vang
            </span>
            <input
              type="file"
              accept=".mid,.midi"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <div className="mt-4">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-[#252830] bg-[#121419] px-6 py-10 text-center">
              <Music className="h-6 w-6 text-[#6B7280]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-medium text-[#F3F1EC]">
                Chưa có bản thu nào
              </h3>
              <p className="mt-1 max-w-md text-xs text-[#8B92A0]">
                Nhấn nút Thu âm trên bảng điều khiển, chơi đàn bằng chuột hoặc bàn phím máy tính, rồi nhấn Dừng thu để lưu và phát lại bằng auto-piano.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recordings.map((rec) => {
                const isSelected = rec.id === activeSongId;
                return (
                  <div
                    key={rec.id}
                    className={`flex flex-col justify-between rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? 'border-[#E5A93C]/70 bg-[#1D2027]'
                        : 'border-[#252830] bg-[#121419] hover:border-[#373C47]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-medium text-[#F6F3EC]">
                          {rec.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#8B92A0]">
                          {rec.notes.length} nốt · {formatTime(rec.duration)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Phát ${rec.title}`}
                          onClick={() => onSelectSong(rec, true)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E5A93C] text-[#111215] hover:bg-[#EEB854] cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Xóa ${rec.title}`}
                          onClick={() => onDeleteRecording(rec.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C303A] bg-[#181B22] text-[#9CA3AF] hover:border-[#DC2626] hover:text-[#FCA5A5] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
