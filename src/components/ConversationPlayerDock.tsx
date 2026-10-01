import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Download,
  Sparkles,
  ChevronDown,
  Volume2,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Speaker, TranscriptTurn, TTSMode } from '../types';
import { formatDuration } from '../services/audioUtils';

interface ConversationPlayerDockProps {
  turns: TranscriptTurn[];
  speakers: Record<string, Speaker>;
  isPlaying: boolean;
  activeTurnIndex: number | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRenderAll: () => void;
  isRenderingAll: boolean;
  renderProgress: { current: number; total: number } | null;
  onExport: (format: 'wav' | 'mp3' | 'webm' | 'srt' | 'json') => void;
  ttsMode: TTSMode;
  isExporting: boolean;
}

export const ConversationPlayerDock: React.FC<ConversationPlayerDockProps> = ({
  turns,
  speakers,
  isPlaying,
  activeTurnIndex,
  onPlay,
  onPause,
  onStop,
  onRenderAll,
  isRenderingAll,
  renderProgress,
  onExport,
  ttsMode,
  isExporting,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Calculate approximate total duration
  const totalDuration = turns.reduce((acc, t) => {
    const speaker = speakers[t.speakerId] || Object.values(speakers)[0];
    const dur = t.audioDuration || Math.max(1.5, t.text.split(' ').length / 2.2);
    const pause = t.pacingOverride?.pauseAfter ?? speaker?.pacing.pauseAfter ?? 0.4;
    return acc + dur + pause;
  }, 0);

  // Active speaker details
  const activeTurn = activeTurnIndex !== null ? turns[activeTurnIndex] : null;
  const activeSpeaker = activeTurn ? speakers[activeTurn.speakerId] || Object.values(speakers)[0] : null;

  // Ready status check
  const renderedCount = turns.filter((t) => t.audioBase64).length;
  const isFullyRendered = renderedCount === turns.length && turns.length > 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl text-white">
      {/* Mini Progress Bar Across Top Edge */}
      {isRenderingAll && renderProgress && (
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-indigo-500 h-1 transition-all duration-300"
            style={{
              width: `${(renderProgress.current / renderProgress.total) * 100}%`,
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Active Speaker & Animation */}
          <div className="flex items-center gap-3.5 min-w-[240px]">
            {activeSpeaker ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md transition-transform scale-105"
                  style={{ backgroundColor: activeSpeaker.color }}
                >
                  {activeSpeaker.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{activeSpeaker.name}</span>
                    {isPlaying && (
                      <span className="flex items-center gap-0.5 ml-1">
                        <span className="w-1 h-3.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-4 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-2.5 bg-rose-400 rounded-full animate-bounce" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeTurnIndex !== null
                      ? `Giliran ${activeTurnIndex + 1} dari ${turns.length}`
                      : 'Siap diputar'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-300">Percakapan Wawancara</span>
                  <p className="text-xs text-slate-400">
                    {turns.length} Giliran Bicara • Est. {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-3">
            {/* Play / Pause Master Button */}
            <button
              onClick={isPlaying ? onPause : onPlay}
              disabled={turns.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-105'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Jeda Percakapan</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Putar Percakapan</span>
                </>
              )}
            </button>

            {/* Stop Button */}
            {isPlaying && (
              <button
                onClick={onStop}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Hentikan pemutaran"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Render Progress or Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">Total Durasi:</span>
              <span className="font-semibold text-white">{formatDuration(totalDuration)}</span>
              <span className="text-slate-500">•</span>
              <span className={isFullyRendered ? 'text-emerald-400' : 'text-amber-400'}>
                {renderedCount}/{turns.length} audio siap
              </span>
            </div>
          </div>

          {/* Right: Master Render & Export Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Render All Turns Button */}
            <button
              onClick={onRenderAll}
              disabled={isRenderingAll || turns.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              title="Render semua audio dialog agar lancar tanpa jeda pemrosesan"
            >
              {isRenderingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>
                    Merender ({renderProgress?.current || 0}/{renderProgress?.total || turns.length})...
                  </span>
                </>
              ) : isFullyRendered ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Semua Audio Siap</span>
                  <span className="sm:hidden">Siap</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Render Semua Audio</span>
                </>
              )}
            </button>

            {/* Export Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting || turns.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Format</span>
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </>
                )}
              </button>

              {/* Dropdown Card */}
              {showExportMenu && (
                <div
                  className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fade-in"
                  onClick={() => setShowExportMenu(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Format Audio Percakapan
                  </div>

                  <button
                    onClick={() => onExport('wav')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Audio WAV Studio (.wav)</div>
                      <div className="text-[11px] text-slate-400">Lossless 24kHz kualitas master</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      WAV
                    </span>
                  </button>

                  <button
                    onClick={() => onExport('mp3')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Audio Universal (.mp3)</div>
                      <div className="text-[11px] text-slate-400">Kompatibel untuk sharing & HP</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                      MP3
                    </span>
                  </button>

                  <button
                    onClick={() => onExport('webm')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Audio Ringan WebM (.webm)</div>
                      <div className="text-[11px] text-slate-400">Ukuran file hemat untuk web</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      WEBM
                    </span>
                  </button>

                  <div className="border-t border-slate-800 my-1 pt-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Format Teks & Subtitle
                    </div>

                    <button
                      onClick={() => onExport('srt')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">Subtitle SRT (.srt)</div>
                        <div className="text-[11px] text-slate-400">Untuk video YouTube / Premiere</div>
                      </div>
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      onClick={() => onExport('json')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">Data Proyek JSON (.json)</div>
                        <div className="text-[11px] text-slate-400">Backup transkrip & pacing</div>
                      </div>
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
