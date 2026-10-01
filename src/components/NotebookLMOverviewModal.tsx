import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Radio,
  Play,
  Pause,
  Download,
  Share2,
  Zap,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  Bot,
  Flame,
  Globe,
  ShieldCheck,
  Trash2,
  RefreshCw,
  FileCode,
  Languages,
  Cpu,
} from 'lucide-react';
import { TranscriptTurn, Speaker, AudioAuditReport, VerboseGenerationLogEntry } from '../types';
import { TTSService } from '../services/ttsService';
import { formatDuration, downloadBlob } from '../services/audioUtils';

interface NotebookLMOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  turns: TranscriptTurn[];
  speakers: Record<string, Speaker>;
  projectTitle: string;
}

export const NotebookLMOverviewModal: React.FC<NotebookLMOverviewModalProps> = ({
  isOpen,
  onClose,
  turns,
  speakers,
  projectTitle,
}) => {
  const [selectedStyle, setSelectedStyle] = useState<'podcast' | 'deep_dive' | 'summary'>('podcast');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [scriptFallbackData, setScriptFallbackData] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Podcast speech player states
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [activePodcastTurnIdx, setActivePodcastTurnIdx] = useState<number | null>(null);
  const [activeSpeakerName, setActiveSpeakerName] = useState<string>('');

  // Diagnostic Audit, Cache & Verbose Log states
  const [auditReport, setAuditReport] = useState<AudioAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [cacheClearNotice, setCacheClearNotice] = useState<string | null>(null);
  const [verboseLogs, setVerboseLogs] = useState<VerboseGenerationLogEntry[]>([]);
  const [showVerboseLogs, setShowVerboseLogs] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnosticAudit = async () => {
    setIsAuditing(true);
    const report = await TTSService.auditAudioQuality(turns, speakers, audioBase64);
    setAuditReport(report);
    setIsAuditing(false);
  };

  const handleForceClearCacheAndRerender = async () => {
    const clearResult = TTSService.clearAudioCache();
    setCacheClearNotice(`Cache audio (${clearResult.clearedCount} blok) dibersihkan. Memulai render ulang bersih...`);
    setAudioBase64(null);
    setScriptFallbackData(null);
    setAuditReport(null);
    setTimeout(() => {
      setCacheClearNotice(null);
    }, 4000);
    handleGenerate();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setAudioBase64(null);
    setScriptFallbackData(null);
    TTSService.stopPlayback();
    setIsPodcastPlaying(false);

    const result = await TTSService.generateNotebookLMOverview(turns, speakers, selectedStyle);

    setIsGenerating(false);

    if (result.verboseLog) {
      setVerboseLogs((prev) => [result.verboseLog!, ...prev]);
    }

    if (result.audioBase64) {
      setAudioBase64(result.audioBase64);
      const audioUrl = `data:audio/wav;base64,${result.audioBase64}`;
      const tempAudio = new Audio(audioUrl);
      tempAudio.onloadedmetadata = () => {
        setAudioDuration(tempAudio.duration || 120);
      };
    } else if (result.scriptFallback) {
      setScriptFallbackData(result.scriptFallback);
    } else {
      setErrorMessage(result.message || 'Menggunakan mesin pementasan lisan lokal.');
    }
  };

  const handlePlayPodcastSpeech = () => {
    if (!scriptFallbackData || !Array.isArray(scriptFallbackData.turns)) return;

    if (isPodcastPlaying) {
      TTSService.stopPlayback();
      setIsPodcastPlaying(false);
      setActivePodcastTurnIdx(null);
      return;
    }

    setIsPodcastPlaying(true);
    TTSService.speakNotebookLMPodcast(
      scriptFallbackData.turns,
      (idx, speaker) => {
        setActivePodcastTurnIdx(idx);
        setActiveSpeakerName(speaker);
      },
      () => {
        setIsPodcastPlaying(false);
        setActivePodcastTurnIdx(null);
      }
    );
  };

  const togglePlay = () => {
    if (!audioBase64) return;

    if (!audioRef.current) {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Error playing native audio:', e);
      });
    }
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    const byteCharacters = atob(audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });

    const sanitized = projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 30);
    downloadBlob(blob, `${sanitized}_notebooklm_native_overview.wav`);
  };

  const styles = [
    {
      id: 'podcast' as const,
      title: '🎙️ Podcast Duo Overview',
      tag: 'Gaya NotebookLM Paling Populer',
      description: 'Obrolan santai 2 pembicara (Budi & Siti) dengan tawa alami, interjeksi hangat, dan alur percakapan seperti siaran radio favorit.',
      color: 'border-indigo-500 bg-indigo-950/40 text-indigo-300',
    },
    {
      id: 'deep_dive' as const,
      title: '💬 Wawancara Eksklusif Deep-Dive',
      tag: 'Format Formal & Analitis',
      description: 'Penyampaian jurnalistik mendalam dengan intonasi artikulatif, pertanyaan tajam, dan pemaparan berwibawa.',
      color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
    },
    {
      id: 'summary' as const,
      title: '⚡ Ringkasan Kilat 2 Menit',
      tag: 'Cepat & Padat',
      description: 'Poin-poin inti wawancara disampaikan dengan tempo cepat, berenergi, dan langsung ke inti pembahasan.',
      color: 'border-amber-500 bg-amber-950/40 text-amber-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Glowing Gemini Gradient */}
        <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>NotebookLM Audio Overview</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-indigo-500 to-purple-500 text-white tracking-wider">
                    Google Native Audio
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Hasilkan siaran podcast 2 pembicara dengan emosi, tawa, dan dinamika suara lisan manusia
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Style Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Pilih Format Audio Overview
            </label>
            <div className="grid grid-cols-1 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedStyle === s.id
                      ? `${s.color} ring-1 ring-indigo-500 shadow-md`
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{s.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {s.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action trigger button */}
          {!audioBase64 && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproduksi Audio Native NotebookLM...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>Hasilkan Audio Overview ({turns.length} Giliran Transkrip)</span>
                </>
              )}
            </button>
          )}

          {/* Diagnostic Tool & Fresh Render Control Panel */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Alat Diagnostik & Audit Kinerja Audio</span>
              </div>

              {/* Force Clear Cache Button */}
              <button
                type="button"
                onClick={handleForceClearCacheAndRerender}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                title="Hapus paksa semua blok audio yang tersimpan dan lakukan render ulang bersih"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Bersihkan Cache & Render Ulang</span>
              </button>
            </div>

            {cacheClearNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{cacheClearNotice}</span>
              </div>
            )}

            {/* Run Audit Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isAuditing}
                onClick={handleRunDiagnosticAudit}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/80 text-indigo-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis Character Encoding, Language Tagging & API Payload...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Audit Diagnostik Kualitas (Encoding, Tagging & Payload API)</span>
                  </>
                )}
              </button>
            </div>

            {/* Diagnostic Report Display */}
            {auditReport && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${auditReport.isValid ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>Laporan Audit Kualitas NotebookLM</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                    auditReport.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    Skor: {auditReport.overallScore} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Character Encoding */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-indigo-400" /> Character Encoding
                      </span>
                      <span className={`font-bold ${auditReport.characterEncoding.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {auditReport.characterEncoding.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">Sample: "{auditReport.characterEncoding.cleanedTextSample}"</p>
                  </div>

                  {/* Language Tagging */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Languages className="w-3 h-3 text-purple-400" /> Language Tagging
                      </span>
                      <span className={`font-bold ${auditReport.languageTagging.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {auditReport.languageTagging.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{auditReport.languageTagging.detectedLang}</p>
                  </div>

                  {/* API Payload Structure */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-pink-400" /> API Payload Schema
                      </span>
                      <span className={`font-bold ${auditReport.apiPayloadStructure.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {auditReport.apiPayloadStructure.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Schema JSON: {auditReport.apiPayloadStructure.schemaValid ? 'Valid 100%' : 'Perlu Penyesuaian'}</p>
                  </div>

                  {/* Audio Sample Integrity */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-emerald-400" /> Sample Integrity
                      </span>
                      <span className={`font-bold ${auditReport.audioIntegrity.status === 'pass' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {auditReport.audioIntegrity.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {auditReport.audioIntegrity.sampleRateHz ? `${auditReport.audioIntegrity.sampleRateHz} Hz` : 'Mencakup skrip lisan'}
                    </p>
                  </div>
                </div>

                {auditReport.suggestedFixes.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-amber-300">
                      <Sparkles className="w-3 h-3" /> Rekomendasi Optimalisasi:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {auditReport.suggestedFixes.map((fix, idx) => (
                        <li key={idx}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {/* Verbose Generation Log Panel Toggle */}
            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowVerboseLogs(!showVerboseLogs)}
                className="w-full flex items-center justify-between text-xs text-indigo-300 font-semibold hover:text-indigo-200 transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verbose Generation Log ({verboseLogs.length} Entri API Mentah)</span>
                </span>
                <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800/60 font-mono text-indigo-300">
                  {showVerboseLogs ? 'Sembunyikan' : 'Tampilkan JSON Mentah'}
                </span>
              </button>

              {showVerboseLogs && (
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1 animate-fade-in text-[11px]">
                  {verboseLogs.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center italic">
                      Belum ada log API. Klik "Hasilkan Audio Overview" untuk merekam payload JSON mentah.
                    </div>
                  ) : (
                    verboseLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-1.5">
                          <span className="text-indigo-400 font-bold">{log.endpoint}</span>
                          <div className="flex items-center gap-2">
                            <span className={log.responseStatus === 200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              HTTP {log.responseStatus}
                            </span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {/* Raw Request Payload */}
                        <div className="space-y-1">
                          <span className="text-amber-300 text-[10px] uppercase font-bold tracking-wider">
                            Raw Request Payload (Dikirim ke Server):
                          </span>
                          <pre className="p-2 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto text-[10px] leading-tight border border-slate-800/60">
                            {JSON.stringify(log.requestPayload, null, 2)}
                          </pre>
                        </div>

                        {/* Raw API Response */}
                        <div className="space-y-1">
                          <span className="text-emerald-300 text-[10px] uppercase font-bold tracking-wider">
                            Raw API Response (Diterima dari Server):
                          </span>
                          <pre className="p-2 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto text-[10px] leading-tight border border-slate-800/60 max-h-36 overflow-y-auto">
                            {JSON.stringify(log.responseData, null, 2)}
                          </pre>
                        </div>

                        {log.notes && (
                          <div className="text-[10px] text-indigo-300 italic pt-1 border-t border-slate-900">
                            Catatan Diagnostik: {log.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-3">
              <Bot className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Generated Script Podcast View with Real Speech Synthesis */}
          {scriptFallbackData && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Siaran Podcast Lisan NotebookLM Ready!</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  Suara Manusia ID-ID (Budi & Siti)
                </span>
              </div>

              {/* Player Action Controls */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={handlePlayPodcastSpeech}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transition-all shrink-0 ${
                    isPodcastPlaying
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
                  }`}
                >
                  {isPodcastPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {isPodcastPlaying ? (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                          <span className="text-emerald-300">{activeSpeakerName} sedang berbicara...</span>
                        </>
                      ) : (
                        <span>Putar Siaran Podcast Lisan (Budi & Siti)</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isPodcastPlaying
                      ? 'Mendengarkan siaran langsung dengan suara manusia asli bahasa Indonesia'
                      : 'Klik tombol play di atas untuk mendengarkan Budi & Siti saling bersahut-sahutan lisan'}
                  </p>
                </div>
              </div>

              {/* Interactive Script Turns View */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 rounded-xl bg-slate-950 p-3 border border-slate-800/80 text-xs">
                {Array.isArray(scriptFallbackData.turns) &&
                  scriptFallbackData.turns.map((t: any, idx: number) => {
                    const isActive = activePodcastTurnIdx === idx;
                    const isMale = (t.speaker || '').toLowerCase().includes('budi') || (t.speaker || '').toLowerCase().includes('host');
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-indigo-900/40 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-md'
                            : 'bg-slate-900/60 border-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold text-[11px] ${isMale ? 'text-indigo-400' : 'text-purple-400'}`}>
                            {t.speaker || 'Host'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold animate-pulse">
                              Sedang Bicara...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">"{t.text}"</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Generated Native Audio Player Card */}
          {audioBase64 && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-indigo-500/40 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Audio Native Berhasil Dihasilkan!
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Model: Gemini 3.8 Native Audio</span>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all shrink-0"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-mono">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(audioDuration || 60)}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full transition-all duration-100"
                      style={{
                        width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Proses Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Audio (.WAV)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Menggunakan infrastruktur Gemini Native Audio Google secara langsung.</span>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
