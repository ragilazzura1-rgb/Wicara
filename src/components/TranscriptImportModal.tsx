import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { Speaker, TranscriptTurn } from '../types';
import {
  AnalyzedSpeakerProfile,
  analyzeTranscriptWithAI,
} from '../services/transcriptAnalyzer';
import { INDONESIAN_VOICE_MODELS, getVoiceById } from '../services/voiceCatalog';

interface TranscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    newTurns: TranscriptTurn[],
    newSpeakers: Speaker[],
    replaceAll?: boolean,
    title?: string
  ) => void;
  existingSpeakers: Speaker[];
}

export const TranscriptImportModal: React.FC<TranscriptImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingSpeakers,
}) => {
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    speakers: AnalyzedSpeakerProfile[];
    turns: { speakerName: string; text: string }[];
    title: string;
    summary?: string;
    source: 'ai' | 'heuristic';
  } | null>(null);

  const [importMode, setImportMode] = useState<'append' | 'replace'>('replace');

  if (!isOpen) return null;

  const handleStartAnalysis = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTranscriptWithAI(rawText, existingSpeakers);
      setAnalysisResult(result);
    } catch (e) {
      console.error('Error analyzing transcript:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateSpeakerVoice = (speakerIndex: number, newVoiceId: string) => {
    if (!analysisResult) return;
    const updated = [...analysisResult.speakers];
    updated[speakerIndex] = {
      ...updated[speakerIndex],
      voiceModelId: newVoiceId,
      gender: INDONESIAN_VOICE_MODELS.find((v) => v.id === newVoiceId)?.gender || updated[speakerIndex].gender,
    };
    setAnalysisResult({ ...analysisResult, speakers: updated });
  };

  const handleUpdateSpeakerRole = (speakerIndex: number, newRole: string) => {
    if (!analysisResult) return;
    const updated = [...analysisResult.speakers];
    updated[speakerIndex] = {
      ...updated[speakerIndex],
      role: newRole,
    };
    setAnalysisResult({ ...analysisResult, speakers: updated });
  };

  const handleConfirmImport = () => {
    if (!analysisResult || analysisResult.turns.length === 0) return;

    // Build or match speakers
    const speakerNameToIdMap: Record<string, string> = {};
    const createdSpeakers: Speaker[] = [];

    analysisResult.speakers.forEach((profile, index) => {
      // Look for match in existing speakers
      const existing = existingSpeakers.find(
        (s) => s.name.toLowerCase() === profile.name.toLowerCase()
      );

      if (existing) {
        speakerNameToIdMap[profile.name] = existing.id;
      } else {
        const newId = 'spk-imp-' + Date.now() + '-' + index;
        speakerNameToIdMap[profile.name] = newId;

        const voiceModel = getVoiceById(profile.voiceModelId);
        createdSpeakers.push({
          id: newId,
          name: profile.name,
          voiceModelId: profile.voiceModelId,
          role: profile.role,
          color: profile.color,
          pacing: {
            rate: voiceModel.defaultPacing.rate,
            pitch: voiceModel.defaultPacing.pitch,
            pauseAfter: voiceModel.defaultPacing.pauseAfter,
            volume: 1.0,
          },
        });
      }
    });

    // Build transcript turns
    const finalTurns: TranscriptTurn[] = analysisResult.turns.map((turn, idx) => {
      let matchedSpeakerId = speakerNameToIdMap[turn.speakerName];
      if (!matchedSpeakerId) {
        // Fallback to first speaker
        matchedSpeakerId = Object.values(speakerNameToIdMap)[0] || existingSpeakers[0]?.id || 'spk-1';
      }

      return {
        id: 'turn-imp-' + Date.now() + '-' + idx,
        speakerId: matchedSpeakerId,
        text: turn.text,
        status: 'idle',
      };
    });

    onImport(
      finalTurns,
      createdSpeakers,
      importMode === 'replace',
      analysisResult.title
    );
    onClose();
  };

  // Sample Transcripts
  const handleLoadSample = (sampleType: 'guru' | 'job' | 'tech') => {
    if (sampleType === 'guru') {
      setRawText(`Catatan: Sesi wawancara penelitian di ruang guru pada pukul 09:00 WIB.
Topik: Evaluasi Efektivitas Media Pembelajaran Berbasis Audio.

Peneliti: Selamat pagi Ibu Guru, terima kasih banyak atas kesediaannya meluangkan waktu di sela-sela jam mengajar hari ini.
Guru (sambil tersenyum): Selamat pagi Bapak. Sama-sama, senang sekali bisa berbagi pengalaman mengenai proses pembelajaran anak-anak di kelas.
Peneliti: Bagaimana respon dan tingkat konsentrasi para siswa ketika Ibu menerapkan materi pembelajaran berbasis audio?
Guru: Menarik sekali, anak-anak terlihat jauh lebih antusias dan fokus mendengarkan, terutama saat ada narasi dialog interaktif yang hidup.`);
    } else if (sampleType === 'job') {
      setRawText(`Pewawancara: Selamat pagi Ibu Siti, terima kasih sudah hadir di sesi wawancara akhir untuk posisi Lead Engineer ini.
Siti: Selamat pagi Bapak Budi. Senang sekali bisa berdiskusi langsung dengan tim pimpinan hari ini.
Pewawancara: Bisa Anda ceritakan pengalaman paling menantang saat memimpin transformasi arsitektur sistem di perusahaan sebelumnya?
Siti: Tentu. Pada kuartal ketiga tahun lalu, kami harus memigrasikan database utama dengan jutaan pengguna tanpa downtime, dan kunci keberhasilannya adalah komunikasi intensif serta automated testing.`);
    } else {
      setRawText(`Dimas: Halo semuanya! Balik lagi di Wicara Tech Podcast. Hari ini kita kedatangan tamu spesial, Pak Joko Hartono, praktisi AI dan data governance.
Joko: Halo Dimas, terima kasih atas undangannya. Topik etika AI dan regulasi data memang sedang sangat relevan untuk industri kita.
Dimas: Betul banget Pak. Gimana pandangan Bapak soal kesiapan talenta digital di Indonesia dalam menghadapi lonjakan automasi AI?
Joko: Menurut pengamatan saya, fondasi teknis kita sudah kuat, yang perlu diperdalam adalah integritas algoritma dan kepekaan sosial.`);
    }
    setAnalysisResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Impor & Analisa Cerdas Naskah Wawancara
              </h3>
              <p className="text-xs text-slate-400">
                Otomatis kenali aktor, analisa peran, tentukan model suara native, dan pisahkan dialog
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Input text if not analyzed yet or wants to re-input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tempel Draf Teks / Naskah Wawancara
              </label>

              {/* Sample Chips */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px]">Muat Contoh:</span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('guru')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] border border-indigo-500/40 transition-colors font-medium"
                >
                  Guru & Peneliti (2 Aktor)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('job')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                >
                  Wawancara Kerja
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('tech')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                >
                  Podcast AI
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (analysisResult) setAnalysisResult(null);
              }}
              placeholder={`Tempel teks percakapan Anda di sini dalam format apa saja:\n- Nama: Dialog\n- [Nama] Dialog\n- Teks kutipan ("Halo," kata Budi)\n- Transkrip ber-timestamp [00:15] Nama: ...`}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed resize-y shadow-inner"
            />

            {/* Analyze Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                💡 Mendukung pemisahan otomatis aktor, peran, dan rekomendasi suara native Indonesia.
              </span>

              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={!rawText.trim() || isAnalyzing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisa Peran & Percakapan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Analisa Otomatis Peran & Aktor</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Analysis Results Review */}
          {analysisResult && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-fade-in">
              {/* Summary Header */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Analisa Selesai
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      {analysisResult.source === 'ai' ? '✨ Gemini AI' : '⚡ Kontekstual Heuristik'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {analysisResult.title}
                  </h4>
                  {analysisResult.summary && (
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {analysisResult.summary}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Ditemukan</div>
                  <div className="text-sm font-semibold text-white">
                    {analysisResult.speakers.length} Aktor • {analysisResult.turns.length} Giliran
                  </div>
                </div>
              </div>

              {/* Analyzed Actors / Speakers Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                      Daftar Aktor & Karakter Suara Teranalisa ({analysisResult.speakers.length})
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Anda dapat mengubah model suara sebelum menerapkan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.speakers.map((spk, idx) => {
                    const voice = getVoiceById(spk.voiceModelId);
                    const turnCount = analysisResult.turns.filter(
                      (t) => t.speakerName.toLowerCase() === spk.name.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                              style={{ backgroundColor: spk.color }}
                            >
                              {spk.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {spk.name}
                              </div>
                              <input
                                type="text"
                                value={spk.role}
                                onChange={(e) => handleUpdateSpeakerRole(idx, e.target.value)}
                                className="text-[11px] text-slate-400 bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:outline-none focus:border-indigo-400 focus:text-white"
                                title="Klik untuk mengedit peran"
                              />
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                            {turnCount} giliran
                          </span>
                        </div>

                        {/* Voice Model Selector Dropdown */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Model Suara Native:
                          </label>
                          <select
                            value={spk.voiceModelId}
                            onChange={(e) => handleUpdateSpeakerVoice(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <optgroup label="3 Pria Native Indonesia">
                              {INDONESIAN_VOICE_MODELS.filter((v) => v.gender === 'male').map((v) => (
                                <option key={v.id} value={v.id}>
                                  [Pria] {v.name} ({v.archetype})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="3 Wanita Native Indonesia">
                              {INDONESIAN_VOICE_MODELS.filter((v) => v.gender === 'female').map((v) => (
                                <option key={v.id} value={v.id}>
                                  [Wanita] {v.name} ({v.archetype})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Turn Sequence Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                    Pratinjau Percakapan ({analysisResult.turns.length} Giliran)
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Format dialog bersih tanpa label
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                  {analysisResult.turns.map((turn, tIdx) => {
                    const matchedSpeaker = analysisResult.speakers.find(
                      (s) => s.name.toLowerCase() === turn.speakerName.toLowerCase()
                    );
                    const spkColor = matchedSpeaker?.color || '#6366f1';

                    return (
                      <div
                        key={tIdx}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5"
                      >
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0 mt-0.5"
                          style={{ backgroundColor: spkColor }}
                        >
                          {turn.speakerName}
                        </span>
                        <p className="text-slate-200 text-xs leading-relaxed flex-1">
                          {turn.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Import Option: Append vs Replace */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">Mode Penerapan ke Studio:</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      importMode === 'replace'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✨ Ganti Seluruh Naskah (Mulai Bersih)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      importMode === 'append'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    + Tambahkan ke Bawah Naskah Aktif
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Batal
          </button>

          {analysisResult && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan ke Linimasa Studio ({analysisResult.turns.length} Giliran)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
