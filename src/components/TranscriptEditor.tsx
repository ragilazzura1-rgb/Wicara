import React, { useState } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Settings,
  Sparkles,
  FileText,
  Sliders,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Volume2,
  UserPlus,
  Wind,
  Eraser,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  Edit3,
  BookOpen,
  Mic,
  ArrowRight,
  Check,
  X,
  MessageSquare,
  Zap,
  Radio,
} from 'lucide-react';
import { Speaker, TranscriptTurn, TTSMode } from '../types';
import { getVoiceById, INDONESIAN_VOICE_MODELS } from '../services/voiceCatalog';
import { formatDuration } from '../services/audioUtils';
import { PauseOptimizerModal } from './PauseOptimizerModal';

interface TranscriptEditorProps {
  turns: TranscriptTurn[];
  speakers: Record<string, Speaker>;
  activeTurnIndex: number | null;
  isPlaying: boolean;
  onPlayTurn: (turnIndex: number) => void;
  onUpdateTurn: (turnIndex: number, updated: TranscriptTurn) => void;
  onDeleteTurn: (turnIndex: number) => void;
  onDuplicateTurn: (turnIndex: number) => void;
  onClearAllTurns: () => void;
  onAddTurn: (speakerId?: string) => void;
  onMoveTurn: (fromIndex: number, toIndex: number) => void;
  onOpenSpeakerConfig: (speaker: Speaker) => void;
  onDeleteSpeaker: (speakerId: string) => void;
  onBulkRenameSpeaker?: (speakerId: string, newName: string) => void;
  onDeleteCurrentProject?: () => void;
  onOpenImport: () => void;
  onAddSpeaker: () => void;
  onAutoEnrich: (style: 'podcast' | 'formal' | 'investigative' | 'naturalizer') => void;
  onApplyPauseOptimization?: (optimizedTurns: TranscriptTurn[]) => void;
  onOpenNotebookLMOverview?: () => void;
  ttsMode: TTSMode;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  turns,
  speakers,
  activeTurnIndex,
  isPlaying,
  onPlayTurn,
  onUpdateTurn,
  onDeleteTurn,
  onDuplicateTurn,
  onClearAllTurns,
  onAddTurn,
  onMoveTurn,
  onOpenSpeakerConfig,
  onDeleteSpeaker,
  onBulkRenameSpeaker,
  onDeleteCurrentProject,
  onOpenImport,
  onAddSpeaker,
  onAutoEnrich,
  onApplyPauseOptimization,
  onOpenNotebookLMOverview,
  ttsMode,
}) => {
  const [editingPacingTurnId, setEditingPacingTurnId] = useState<string | null>(null);
  const [showEnrichMenu, setShowEnrichMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
  const [isPauseOptimizerOpen, setIsPauseOptimizerOpen] = useState(false);
  const [renamingSpeaker, setRenamingSpeaker] = useState<{ id: string; name: string; turnsCount: number } | null>(null);
  const [newSpeakerNameInput, setNewSpeakerNameInput] = useState('');

  const speakerList = Object.values(speakers);
  const totalWords = turns.reduce((acc, t) => acc + (t.text.trim().split(/\s+/).filter(Boolean).length || 0), 0);
  const totalChars = turns.reduce((acc, t) => acc + t.text.length, 0);

  const insertVerbatimTag = (turnIndex: number, tag: string) => {
    const turn = turns[turnIndex];
    onUpdateTurn(turnIndex, {
      ...turn,
      text: turn.text.trim() + (turn.text.trim() ? ' ' : '') + tag + ' ',
      audioBase64: undefined,
      status: 'idle',
    });
  };

  const handleClearTurnText = (turnIndex: number) => {
    const turn = turns[turnIndex];
    onUpdateTurn(turnIndex, {
      ...turn,
      text: '',
      audioBase64: undefined,
      status: 'idle',
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, turnIndex: number) => {
    // Ctrl+Enter or Cmd+Enter to create a new turn immediately below!
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const currentTurn = turns[turnIndex];
      const nextSpeaker = speakerList.find((s) => s.id !== currentTurn.speakerId) || speakerList[0];
      onAddTurn(nextSpeaker?.id);
    }
  };

  const handleStartQuickRename = (spk: Speaker, turnsCount: number) => {
    setRenamingSpeaker({ id: spk.id, name: spk.name, turnsCount });
    setNewSpeakerNameInput(spk.name);
  };

  const handleApplyQuickRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSpeaker || !newSpeakerNameInput.trim()) return;
    if (onBulkRenameSpeaker) {
      onBulkRenameSpeaker(renamingSpeaker.id, newSpeakerNameInput.trim());
    }
    setRenamingSpeaker(null);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Action Bar: Speakers summary, Total stats & Quick Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Row 1: Speakers Roster */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Aktor & Karakter Suara ({speakerList.length})
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                • Klik aktor untuk edit suara & ganti nama massal
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {speakerList.map((spk) => {
                const voice = getVoiceById(spk.voiceModelId);
                const spkTurnsCount = turns.filter((t) => t.speakerId === spk.id).length;

                return (
                  <div
                    key={spk.id}
                    className="flex items-center rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all group overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenSpeakerConfig(spk)}
                      className="flex items-center gap-2 px-3 py-2 text-left"
                    >
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: spk.color }}
                      >
                        {spk.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1">
                          <span>{spk.name}</span>
                          <Settings className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {voice.name} • {spkTurnsCount} giliran
                        </div>
                      </div>
                    </button>

                    {/* Quick Rename Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartQuickRename(spk, spkTurnsCount);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 transition-colors border-l border-slate-700/60"
                      title={`Ganti nama massal "${spk.name}" di semua giliran`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick delete speaker button if multiple speakers */}
                    {speakerList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSpeaker(spk.id);
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors border-l border-slate-700/60"
                        title={`Hapus ${spk.name} dari proyek`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onAddSpeaker}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Aktor Baru</span>
              </button>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap">
            {/* Auto-enrich Verbatim Naturalizer */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEnrichMenu(!showEnrichMenu)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-xs font-semibold text-violet-300 hover:text-white transition-all shadow-sm"
                title="Perkaya dialog dengan percakapan luwes khas NotebookLM & jeda alami"
              >
                <Wind className="w-4 h-4 text-violet-400" />
                <span>Perkaya Dialog Alami</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </button>

              {showEnrichMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fade-in"
                  onClick={() => setShowEnrichMenu(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Gaya Percakapan Alami
                  </div>
                  <button
                    type="button"
                    onClick={() => onAutoEnrich('podcast')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Gaya Podcast Kasual</div>
                      <div className="text-[11px] text-slate-400">Pembuka ramah & diksi 'Ya, betul', 'Nah'</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAutoEnrich('formal')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Gaya Wawancara Formal</div>
                      <div className="text-[11px] text-slate-400">Artikulasi tertata & transisi sopan</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAutoEnrich('investigative')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800 text-left text-slate-200 hover:text-white transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">Gaya Investigasi Reflektif</div>
                      <div className="text-[11px] text-slate-400">Jeda kontemplatif (...) antar poin</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenNotebookLMOverview}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all"
              title="Hasilkan siaran audio podcast 2 pembicara alami dengan Gemini Native Audio (NotebookLM Style)"
            >
              <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>✨ NotebookLM Audio Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPauseOptimizerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-300 hover:text-white transition-colors"
              title="Otomatiskan jeda hening dan ritme alami percakapan berdasarkan profil pembicara"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Optimasi Jeda</span>
            </button>

            <button
              type="button"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Impor Teks</span>
            </button>

            <button
              type="button"
              onClick={() => onAddTurn()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Giliran</span>
            </button>
          </div>
        </div>

        {/* Row 2: Stats & Clear All / Delete Project Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span><strong>{turns.length}</strong> Giliran</span>
            <span>•</span>
            <span><strong>{totalWords}</strong> Kata</span>
            <span>•</span>
            <span><strong>{totalChars}</strong> Karakter</span>
            <span>•</span>
            <span>Est. Durasi: <strong>{formatDuration(totalWords / 2.3)}</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {turns.length > 0 && (
              <div>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2 bg-rose-950/40 p-1 rounded-xl border border-rose-800/60">
                    <span className="text-rose-400 text-xs font-medium px-1">Hapus semua percakapan?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllTurns();
                        setShowClearConfirm(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                    >
                      Ya, Bersihkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-800 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                    title="Kosongkan seluruh percakapan di proyek ini"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Bersihkan Giliran</span>
                  </button>
                )}
              </div>
            )}

            {onDeleteCurrentProject && (
              <div>
                {showDeleteProjectConfirm ? (
                  <div className="flex items-center gap-2 bg-rose-950/80 p-1 rounded-xl border border-rose-800 animate-fade-in">
                    <span className="text-rose-200 text-xs font-medium px-1">Hapus seluruh proyek ini?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCurrentProject();
                        setShowDeleteProjectConfirm(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Ya, Hapus Proyek
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteProjectConfirm(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteProjectConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-800 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 text-xs transition-colors"
                    title="Hapus proyek ini secara permanen dari studio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Proyek Ini</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Bulk Rename Modal */}
      {renamingSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ganti Nama Pembicara Massal</h3>
                  <p className="text-xs text-slate-400">Ubah nama untuk semua giliran yang terkait</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRenamingSpeaker(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyQuickRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Baru Pembicara
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSpeakerNameInput}
                  onChange={(e) => setNewSpeakerNameInput(e.target.value)}
                  placeholder="Ketik nama baru..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Nama ini akan diterapkan secara serentak ke <strong>{renamingSpeaker.turnsCount}</strong> giliran percakapan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenamingSpeaker(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan ke Semua Giliran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversation Timeline Turns or Clean Starter Canvas */}
      {turns.length === 0 ? (
        /* Rich Interactive Blank Starter Canvas for Studio */
        <div className="space-y-6 animate-fade-in">
          {/* Main Hero Starter Box */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-900/90 border border-indigo-500/20 p-8 sm:p-10 text-center shadow-xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
                <Mic className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Studio Pembuatan Wawancara Baru
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                Mulai membuat drama audio percakapan atau transkrip wawancara bahasa Indonesia dengan kualitas neural alami ala NotebookLM.
              </p>
            </div>

            {/* 2 Primary Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8 text-left">
              {/* Option 1: Import raw text */}
              <div
                onClick={onOpenImport}
                className="p-6 rounded-3xl bg-slate-900/90 hover:bg-indigo-950/30 border border-slate-700/80 hover:border-indigo-500/80 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Paling Cepat
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 mb-1.5 flex items-center gap-1">
                    <span>Impor Naskah Lengkap</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Tempel teks mentah transkrip wawancara atau naskah dialog. AI secara otomatis mendeteksi pembicara dan memecahnya ke linimasa bersih.
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Dialog Impor Teks</span>
                </button>
              </div>

              {/* Option 2: Write from scratch */}
              <div
                onClick={() => onAddTurn()}
                className="p-6 rounded-3xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Kustom Manual
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-300 mb-1.5 flex items-center gap-1">
                    <span>Tulis Dialog Baris Demi Baris</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Mulai dengan menambahkan giliran bicara pertama. Anda dapat memilih pembicara, mengatur intonasi nada, dan menyisipkan jeda dialog.
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Giliran Pertama</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Turns Timeline List */
        <div className="space-y-4">
          {turns.map((turn, index) => {
            const speaker = speakers[turn.speakerId] || speakerList[0];
            const voice = getVoiceById(speaker?.voiceModelId || 'budi-santoso');
            const isActive = activeTurnIndex === index;
            const wordsCount = turn.text.trim().split(/\s+/).filter(Boolean).length;
            const charCount = turn.text.length;
            const effectiveRate = turn.pacingOverride?.rate ?? speaker?.pacing.rate ?? 1.0;
            const effectivePitch = turn.pacingOverride?.pitch ?? speaker?.pacing.pitch ?? 1.0;
            const effectivePause = turn.pacingOverride?.pauseAfter ?? speaker?.pacing.pauseAfter ?? 0.4;

            return (
              <div
                key={turn.id}
                className={`relative rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80 shadow-sm'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: speaker?.color || '#6366f1' }}
                  />
                )}

                <div className="p-4 sm:p-5 pl-5 sm:pl-6 space-y-3">
                  {/* Turn Top Row: Speaker selection & Turn index & Actions */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {/* Speaker Badge & Switcher */}
                      <div className="relative">
                        <select
                          value={turn.speakerId}
                          onChange={(e) => {
                            onUpdateTurn(index, { ...turn, speakerId: e.target.value, audioBase64: undefined });
                          }}
                          className="pl-9 pr-8 py-1.5 rounded-xl font-bold text-xs text-white appearance-none cursor-pointer focus:outline-none shadow-sm transition-all"
                          style={{
                            backgroundColor: speaker?.color || '#4f46e5',
                          }}
                        >
                          {speakerList.map((spk) => (
                            <option key={spk.id} value={spk.id} className="bg-slate-900 text-white">
                              {spk.name} ({getVoiceById(spk.voiceModelId).name})
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center pointer-events-none text-[10px] font-bold text-white">
                          {speaker?.name.charAt(0) || 'P'}
                        </div>
                      </div>

                      {/* Turn Number & Word Stats */}
                      <span className="text-xs text-slate-400 font-mono font-semibold">#{index + 1}</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        {wordsCount} kata ({charCount} huruf) • est. {formatDuration(wordsCount / 2.3 / effectiveRate)}
                      </span>

                      {/* Status indicator */}
                      {turn.audioBase64 ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Siap ({formatDuration(turn.audioDuration || 0)})</span>
                        </span>
                      ) : turn.status === 'rendering' ? (
                        <span className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full animate-pulse">
                          <span>Merender audio...</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Turn Actions: Play turn, pacing tweak, reorder, duplicate, delete */}
                    <div className="flex items-center gap-1">
                      {/* Play Single Turn Button */}
                      <button
                        type="button"
                        onClick={() => onPlayTurn(index)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                          isActive && isPlaying
                            ? 'bg-amber-600 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                        title="Putar giliran ini"
                      >
                        {isActive && isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Jeda</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Putar</span>
                          </>
                        )}
                      </button>

                      {/* Pacing override button */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPacingTurnId(editingPacingTurnId === turn.id ? null : turn.id)
                        }
                        className={`p-1.5 rounded-xl border text-slate-400 hover:text-white transition-colors ${
                          turn.pacingOverride
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'border-slate-800 hover:bg-slate-800'
                        }`}
                        title="Sesuaikan pacing tempo/jeda khusus giliran ini"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => index > 0 && onMoveTurn(index, index - 1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                        title="Pindah ke atas"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => index < turns.length - 1 && onMoveTurn(index, index + 1)}
                        disabled={index === turns.length - 1}
                        className="p-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-20"
                        title="Pindah ke bawah"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => onDuplicateTurn(index)}
                        className="p-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors hidden sm:block"
                        title="Gandakan giliran ini"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Clear text */}
                      {turn.text.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleClearTurnText(index)}
                          className="p-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-amber-300 transition-colors"
                          title="Kosongkan teks dialog ini"
                        >
                          <Eraser className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteTurn(index)}
                        className="p-1.5 rounded-xl border border-slate-800 hover:bg-rose-950/40 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Hapus giliran ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Dialogue Text Area */}
                  <textarea
                    rows={Math.max(2, Math.min(6, Math.ceil(turn.text.length / 85)))}
                    value={turn.text}
                    onChange={(e) => {
                      onUpdateTurn(index, {
                        ...turn,
                        text: e.target.value,
                        audioBase64: undefined,
                        status: 'idle',
                      });
                    }}
                    onKeyDown={(e) => handleTextareaKeyDown(e, index)}
                    placeholder="Ketik atau edit dialog wawancara di sini... (Tekan Ctrl+Enter untuk tambah giliran baru)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed font-sans shadow-inner"
                  />

                  {/* Verbatim Quick Tag Inserters */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 font-medium">Sisip Cepat:</span>
                      <button
                        type="button"
                        onClick={() => insertVerbatimTag(index, '...')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-amber-600/30 text-amber-300 border border-slate-700/80 hover:border-amber-500 transition-colors"
                        title="Jeda berpikir kontemplatif (...)"
                      >
                        + Jeda (...)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVerbatimTag(index, 'Mmm,')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-violet-300 border border-slate-700/80 hover:border-violet-500 transition-colors"
                        title="Gumaman berpikir 'Mmm,'"
                      >
                        + Mmm,
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVerbatimTag(index, 'Ya,')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700/80 hover:border-emerald-500 transition-colors"
                        title="Afirmasi santai 'Ya,'"
                      >
                        + Ya,
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVerbatimTag(index, 'Nah,')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-blue-300 border border-slate-700/80 hover:border-blue-500 transition-colors"
                        title="Penyambung dialog 'Nah,'"
                      >
                        + Nah,
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVerbatimTag(index, '?')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700/80 hover:border-indigo-500 transition-colors"
                        title="Tanda tanya untuk intonasi naik"
                      >
                        + ?
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      💡 Tip: Tekan <strong>Ctrl + Enter</strong> di dalam kotak teks untuk membuat giliran baru.
                    </span>
                  </div>

                  {/* Pacing Override Drawer (if toggled) */}
                  {editingPacingTurnId === turn.id && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3 animate-fade-in text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                          Kustomisasi Pacing Khusus Giliran #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTurn(index, { ...turn, pacingOverride: undefined, audioBase64: undefined });
                          }}
                          className="text-[10px] text-slate-400 hover:text-white underline"
                        >
                          Reset ke Default Pembicara
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Tempo:</span>
                            <span className="text-white font-semibold">{effectiveRate.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.7"
                            max="1.5"
                            step="0.05"
                            value={effectiveRate}
                            onChange={(e) => {
                              onUpdateTurn(index, {
                                ...turn,
                                audioBase64: undefined,
                                pacingOverride: {
                                  rate: parseFloat(e.target.value),
                                  pitch: effectivePitch,
                                  pauseAfter: effectivePause,
                                  volume: 1.0,
                                },
                              });
                            }}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Pitch:</span>
                            <span className="text-white font-semibold">{effectivePitch.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.05"
                            value={effectivePitch}
                            onChange={(e) => {
                              onUpdateTurn(index, {
                                ...turn,
                                audioBase64: undefined,
                                pacingOverride: {
                                  rate: effectiveRate,
                                  pitch: parseFloat(e.target.value),
                                  pauseAfter: effectivePause,
                                  volume: 1.0,
                                },
                              });
                            }}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Jeda Setelah:</span>
                            <span className="text-white font-semibold">{effectivePause.toFixed(2)}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.5"
                            step="0.05"
                            value={effectivePause}
                            onChange={(e) => {
                              onUpdateTurn(index, {
                                ...turn,
                                audioBase64: undefined,
                                pacingOverride: {
                                  rate: effectiveRate,
                                  pitch: effectivePitch,
                                  pauseAfter: parseFloat(e.target.value),
                                  volume: 1.0,
                                },
                              });
                            }}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Quick Pause Preset Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-medium">Pintas Jeda Alami:</span>
                        {[
                          { label: '0.28s (Sahutan Cepat)', val: 0.28 },
                          { label: '0.45s (Standar Alami)', val: 0.45 },
                          { label: '0.65s (Reflektif / Tanya)', val: 0.65 },
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            type="button"
                            onClick={() => {
                              onUpdateTurn(index, {
                                ...turn,
                                audioBase64: undefined,
                                pacingOverride: {
                                  rate: effectiveRate,
                                  pitch: effectivePitch,
                                  pauseAfter: btn.val,
                                  volume: 1.0,
                                },
                              });
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                              Math.abs(effectivePause - btn.val) < 0.03
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pause Optimizer Intelligent Modal */}
      <PauseOptimizerModal
        isOpen={isPauseOptimizerOpen}
        onClose={() => setIsPauseOptimizerOpen(false)}
        turns={turns}
        speakers={speakers}
        onApplyOptimization={(optTurns) => {
          if (onApplyPauseOptimization) {
            onApplyPauseOptimization(optTurns);
          }
        }}
      />
    </div>
  );
};
