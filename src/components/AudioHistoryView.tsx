import React, { useState } from 'react';
import {
  History,
  Download,
  Trash2,
  Play,
  Pause,
  Clock,
  Calendar,
  Layers,
  FileAudio,
  FileText,
  Volume2,
} from 'lucide-react';
import { AudioHistoryItem } from '../types';
import { formatDuration } from '../services/audioUtils';

interface AudioHistoryViewProps {
  historyItems: AudioHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const AudioHistoryView: React.FC<AudioHistoryViewProps> = ({
  historyItems,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/70 border border-slate-700/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <History className="w-3.5 h-3.5" />
              <span>Arsip Riwayat Hasil Audio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Riwayat Audio Percakapan
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Akses cepat seluruh file rekaman hasil render wawancara yang telah diekspor. Unduh kembali
              kapan saja dalam format WAV, MP3, atau WebM tanpa perlu merender ulang.
            </p>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Yakin ingin mengosongkan seluruh riwayat audio?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-800 border border-slate-700 text-slate-400 hover:text-rose-400 text-xs font-medium transition-colors self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Riwayat</span>
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {historyItems.length === 0 ? (
        <div className="text-center py-20 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-3">
            <FileAudio className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Belum Ada Riwayat Ekspor Audio</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Buka studio wawancara dan klik tombol "Ekspor Format" (WAV / MP3 / WebM) untuk menghasilkan file
            percakapan audio pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FileAudio className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{item.projectTitle}</h3>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                      {item.format}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.fileSizeFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDuration(item.durationSeconds)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.turnCount} giliran dialog</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>

                  {item.speakersSummary.length > 0 && (
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-300">Pembicara:</span>
                      {item.speakersSummary.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:border-rose-800 border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Hapus dari riwayat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
