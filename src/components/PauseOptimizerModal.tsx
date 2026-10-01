import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Zap,
  Check,
  ArrowRight,
  HelpCircle,
  TrendingDown,
  Layers,
  MessageSquare,
  Users,
} from 'lucide-react';
import { TranscriptTurn, Speaker } from '../types';
import {
  PauseOptimizerService,
  PauseOptimizationPreset,
  PauseOptimizationSummary,
} from '../services/pauseOptimizer';

interface PauseOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  turns: TranscriptTurn[];
  speakers: Record<string, Speaker>;
  onApplyOptimization: (optimizedTurns: TranscriptTurn[], preset: PauseOptimizationPreset) => void;
}

export const PauseOptimizerModal: React.FC<PauseOptimizerModalProps> = ({
  isOpen,
  onClose,
  turns,
  speakers,
  onApplyOptimization,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PauseOptimizationPreset>('adaptive');

  const summary: PauseOptimizationSummary = useMemo(() => {
    return PauseOptimizerService.analyzeProjectPauses(turns, speakers, selectedPreset);
  }, [turns, speakers, selectedPreset]);

  if (!isOpen) return null;

  const handleApply = () => {
    const optimized = PauseOptimizerService.optimizeAllTurns(turns, speakers, selectedPreset);
    onApplyOptimization(optimized, selectedPreset);
    onClose();
  };

  const presets = [
    {
      id: 'adaptive' as PauseOptimizationPreset,
      label: 'Adaptif Cerdas',
      icon: Sparkles,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'Menyesuaikan jeda otomatis mengikuti kecepatan bicara tiap aktor dan tipe kalimat (tanya vs jawaban).',
      tag: 'Rekomendasi Utama',
    },
    {
      id: 'podcast' as PauseOptimizationPreset,
      label: 'Podcast Dinamis',
      icon: Zap,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Jeda transisi dipercepat (0.25s - 0.40s) untuk gaya obrolan santai, energik, dan responsif.',
      tag: 'Cepat & Mengalir',
    },
    {
      id: 'formal' as PauseOptimizationPreset,
      label: 'Wawancara Formal',
      icon: Clock,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Jeda tertata dan sopan (0.45s - 0.60s) memberikan bobot wibawa pada setiap pergantian pembicara.',
      tag: 'Resmi & Tertib',
    },
    {
      id: 'investigative' as PauseOptimizationPreset,
      label: 'Investigasi / Naratif',
      icon: SlidersHorizontal,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      description: 'Jeda kontemplatif mendalam (0.60s - 0.85s) cocok untuk narasi reflektif dan dokumenter.',
      tag: 'Reflektif',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Pengoptimal Jeda Cerdas (*Pause-Optimizer*)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Otomatiskan ritme natural antar tanda baca, pertanyaan, dan giliran bicara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-time Impact Metrics Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Rata-rata Jeda Saat Ini</div>
              <div className="text-lg font-bold text-slate-300">{summary.averagePauseBefore}s</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
              <div className="text-[11px] text-indigo-300 mb-1">Rata-rata Setelah Optimasi</div>
              <div className="text-lg font-bold text-indigo-400">{summary.averagePauseAfter}s</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center">
              <div className="text-[11px] text-emerald-300 mb-1">Titik Pergantian Aktor</div>
              <div className="text-lg font-bold text-emerald-400">{summary.handoverCount} kali</div>
            </div>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Pilih Gaya Ritme Percakapan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 font-semibold text-xs text-white">
                        <Icon className="w-4 h-4 text-indigo-400" />
                        <span>{p.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.color}`}>
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turn by Turn Preview Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pratinjau Penyesuaian Ritme ({summary.analyses.length} Giliran)
              </label>
              <span className="text-[11px] text-slate-400">Dihitung otomatis per kalimat</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 rounded-2xl border border-slate-800 p-2 bg-slate-950/60">
              {summary.analyses.map((an) => (
                <div
                  key={an.turnIndex}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-[11px]">
                        #{an.turnIndex + 1} {an.speakerName}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">({an.reason})</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate italic">"{an.textSnippet}"</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 line-through">
                      {an.currentPause}s
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold text-xs">
                      {an.recommendedPause}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Terapkan Optimasi Jeda ({summary.analyses.length} Giliran)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
