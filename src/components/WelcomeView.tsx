import React, { useState, useEffect } from 'react';
import {
  Mic,
  Plus,
  FileText,
  Users,
  History,
  Sparkles,
  Command,
  Play,
  Pause,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Wind,
  Layers,
  HelpCircle,
  Laptop,
  Check,
} from 'lucide-react';
import { InterviewProject } from '../types';
import { INDONESIAN_VOICE_MODELS, detectEdgeNaturalVoices, getVoiceById } from '../services/voiceCatalog';
import { TTSService } from '../services/ttsService';

interface WelcomeViewProps {
  onGoToStudio: () => void;
  onNewProject: () => void;
  onOpenImport: () => void;
  onGoToVoices: () => void;
  onGoToHistory: () => void;
  onAutoEnrichCurrentProject: () => void;
  currentProject: InterviewProject | null;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onGoToStudio,
  onNewProject,
  onOpenImport,
  onGoToVoices,
  onGoToHistory,
  onAutoEnrichCurrentProject,
  currentProject,
}) => {
  const [edgeInfo, setEdgeInfo] = useState<{ hasArdi: boolean; hasGadis: boolean; isEdge: boolean }>({
    hasArdi: false,
    hasGadis: false,
    isEdge: false,
  });

  // Interactive Audition State
  const [isPlayingRaw, setIsPlayingRaw] = useState(false);
  const [isPlayingVerbatim, setIsPlayingVerbatim] = useState(false);
  const [auditionVoiceGender, setAuditionVoiceGender] = useState<'male' | 'female'>('male');

  // Custom Sandbox State
  const [sandboxText, setSandboxText] = useState(
    'Halo rekan-rekan! [napas] Terima kasih sudah hadir di sesi wawancara ini. [jeda] Bagaimana implementasi AI pada divisi SDM dan KPI Anda tahun 2025 ini?'
  );
  const [isPlayingSandbox, setIsPlayingSandbox] = useState(false);

  useEffect(() => {
    const updateEdgeDetection = () => {
      setEdgeInfo(detectEdgeNaturalVoices());
    };
    updateEdgeDetection();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateEdgeDetection;
    }
  }, []);

  const selectedVoice = auditionVoiceGender === 'male'
    ? getVoiceById('budi-santoso')
    : getVoiceById('siti-rahma');

  // Demo 1: Raw monotonic without verbatim tags
  const handlePlayRawDemo = async () => {
    TTSService.stopPlayback();
    if (isPlayingRaw) {
      setIsPlayingRaw(false);
      return;
    }
    setIsPlayingRaw(true);
    setIsPlayingVerbatim(false);
    setIsPlayingSandbox(false);

    try {
      const rawText =
        'Selamat pagi. Bagaimana implementasi AI pada divisi SDM dan KPI di perusahaan Anda tahun 2025 ini?';
      await TTSService.speakWithWebSpeech(rawText, selectedVoice, 1.05, 1.0);
    } finally {
      setIsPlayingRaw(false);
    }
  };

  // Demo 2: Naturalized with breathing, prosody, and verbatim tags
  const handlePlayVerbatimDemo = async () => {
    TTSService.stopPlayback();
    if (isPlayingVerbatim) {
      setIsPlayingVerbatim(false);
      return;
    }
    setIsPlayingVerbatim(true);
    setIsPlayingRaw(false);
    setIsPlayingSandbox(false);

    try {
      const verbatimText =
        'Selamat pagi rekan-rekan. [napas] Bagaimana implementasi AI pada divisi SDM dan KPI di perusahaan Anda, [jeda] tahun 2025 ini?';
      await TTSService.speakWithWebSpeech(verbatimText, selectedVoice, 0.98, 0.98);
    } finally {
      setIsPlayingVerbatim(false);
    }
  };

  // Sandbox play
  const handlePlaySandbox = async () => {
    TTSService.stopPlayback();
    if (isPlayingSandbox) {
      setIsPlayingSandbox(false);
      return;
    }
    setIsPlayingSandbox(true);
    try {
      await TTSService.speakWithWebSpeech(sandboxText, selectedVoice, 0.98, 0.98);
    } finally {
      setIsPlayingSandbox(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 animate-fade-in text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Studio TTS Percakapan Wawancara Indonesia</span>
            </span>

            {/* Microsoft Edge Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                edgeInfo.hasArdi || edgeInfo.isEdge
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>
                {edgeInfo.hasArdi
                  ? '✨ Microsoft Ardi & Gadis (Neural Edge) Aktif!'
                  : 'Rekomendasi Terbaik: Microsoft Edge (Suara Alami Bebas Kuota)'}
              </span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Ubah Naskah Wawancara Menjadi{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-rose-400 bg-clip-text text-transparent">
              Percakapan Audio Hidup
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            Selamat datang di <strong>Wicara Studio</strong>. Hadirkan dialog multi-pembicara yang realistis
            dengan <strong>6 model suara penutur asli Indonesia</strong> (3 Pria & 3 Wanita), kontrol ritme bicara,
            optimasi pernapasan <em>verbatim breath marks</em>, serta ekspor format master WAV, MP3, WebM, dan subtitle SRT.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onGoToStudio}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>Buka Studio Wawancara</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-sm font-medium transition-all"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Impor Transkrip Teks</span>
            </button>

            <button
              onClick={onGoToVoices}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-sm font-medium transition-all"
            >
              <Users className="w-4 h-4 text-violet-400" />
              <span>Katalog 6 Model Suara</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Demonstration: Komparasi Suara Kaku vs Natural Verbatim */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Dengarkan Langsung Perbedaannya</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Komparasi Audio: TTS Standar vs. Wicara Verbatim Alami
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Dengarkan bagaimana jeda napas, ritme santai, dan intonasi kalimat tanya mengubah teks kaku menjadi percakapan hidup.
            </p>
          </div>

          {/* Voice Gender Switcher for Audition */}
          <div className="flex items-center gap-2 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 self-start md:self-auto shrink-0">
            <button
              onClick={() => setAuditionVoiceGender('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                auditionVoiceGender === 'male'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suara Pria ({edgeInfo.hasArdi ? 'Microsoft Ardi' : 'Budi Santoso'})
            </button>
            <button
              onClick={() => setAuditionVoiceGender('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                auditionVoiceGender === 'female'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suara Wanita ({edgeInfo.hasGadis ? 'Microsoft Gadis' : 'Siti Rahma'})
            </button>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Raw Monotonic */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Sebelum: TTS Standar (Kaku & Cepat)
                </span>
                <span className="text-[11px] text-slate-500">Tanpa Verbatim</span>
              </div>
              <p className="text-xs text-slate-300 font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                "Selamat pagi. Bagaimana implementasi AI pada divisi SDM dan KPI di perusahaan Anda tahun 2025 ini?"
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                ⚠️ Karakteristik: Monoton, kata-kata bertabrakan tanpa jeda napas, singkatan dibaca datar.
              </p>
            </div>

            <button
              onClick={handlePlayRawDemo}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                isPlayingRaw
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isPlayingRaw ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingRaw ? 'Sedang Memutar...' : 'Putar Contoh Kaku'}</span>
            </button>
          </div>

          {/* Option B: Natural Verbatim */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/40 space-y-3 flex flex-col justify-between ring-1 ring-indigo-500/30 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Sesudah: Wicara Verbatim Alami (Bernapas & Berirama)
                </span>
                <span className="text-[11px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Mode Alami
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-mono bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 leading-relaxed">
                "Selamat pagi rekan-rekan. <strong className="text-emerald-400">[napas]</strong> Bagaimana implementasi AI pada divisi SDM dan KPI di perusahaan Anda, <strong className="text-amber-400">[jeda]</strong> tahun 2025 ini?"
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                ✨ Karakteristik: Jeda bernapas mikro yang halus (110ms), intonasi naik di akhir kalimat tanya, lafal akronim lisan (<em>e-ai</em>, <em>es-de-em</em>, <em>ka-pe-i</em>) tanpa keheningan kaku.
              </p>
            </div>

            <button
              onClick={handlePlayVerbatimDemo}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold shadow-md transition-all ${
                isPlayingVerbatim
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isPlayingVerbatim ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingVerbatim ? 'Sedang Memutar...' : 'Putar Contoh Natural (Verbatim)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Pusat Pintasan Cepat Aplikasi (Quick Action Shortcuts) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Pusat Pintasan Cepat Aplikasi</h2>
            <p className="text-xs text-slate-400">Akses langsung seluruh fitur utama Wicara dalam satu klik</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Shortcut 1 */}
          <div
            onClick={onGoToStudio}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">
                Studio Wawancara Aktif
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kelola linimasa dialog, atur giliran bicara pembicara, dan putar percakapan audio secara utuh.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Buka Editor ({currentProject?.turns.length || 0} Giliran)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Shortcut 2 */}
          <div
            onClick={onNewProject}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors mb-1">
                Buat Proyek & Template Siap Pakai
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mulai naskah wawancara kosong atau gunakan template siap pakai (Wawancara Kerja HR, Podcast AI, Investigasi Desa).
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Pilih Template & Buat</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Shortcut 3 */}
          <div
            onClick={onOpenImport}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors mb-1">
                Impor Transkrip Teks Otomatis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tempel draf transkrip berformat <code>"Pembicara: Teks"</code> untuk otomatis memisahkan giliran bicara.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Buka Parser Transkrip</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Shortcut 4 */}
          <div
            onClick={onGoToVoices}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors mb-1">
                6 Suara Native Indonesia
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dengarkan audisi 3 suara pria (Budi, Dimas, Pak Joko) dan 3 suara wanita (Siti, Ayu, Dewi).
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Audisi Sampel Suara</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Shortcut 5 */}
          <div
            onClick={onAutoEnrichCurrentProject}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors mb-1">
                Perkaya Verbatim & Napas
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sisipkan otomatis penanda hembusan napas <code>[napas]</code>, jeda ragu <code>[jeda]</code>, dan gumaman <code>[hmm]</code> agar dialog hidup.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-violet-400 group-hover:translate-x-1 transition-transform">
              <span>Naturalisasi Proyek Aktif</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Shortcut 6 */}
          <div
            onClick={onGoToHistory}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/60 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors mb-1">
                Riwayat & Ekspor Audio
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Akses cepat master audio WAV, MP3, WebM yang sudah dirender dan unduh subtitle SRT kapan saja.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Lihat Arsip Audio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Keyboard Shortcuts & Tips Suara Natural */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Keyboard Shortcuts Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Pintasan Keyboard (Keyboard Shortcuts)</h3>
          </div>
          <p className="text-xs text-slate-400">
            Percepat alur kerja pengeditan dan pemutaran transkrip wawancara dengan pintasan keyboard berikut:
          </p>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Putar / Jeda Percakapan</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Spasi (Space)
              </kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Hentikan Pemutaran Audio</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Esc
              </kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Tambah Giliran Bicara Baru</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Ctrl + N / ⌘ + N
              </kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Impor Transkrip Teks Otomatis</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Ctrl + I / ⌘ + I
              </kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Buka Menu Ekspor Format Audio</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Ctrl + E / ⌘ + E
              </kbd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-300">Pindah Antar Tab (Beranda s/d Riwayat)</span>
              <kbd className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-mono text-indigo-300 font-semibold shadow-inner">
                Ctrl + 1 ... 5
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Rahasia Suara Alami (Verbatim & Microsoft Edge) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Rahasia Suara Wawancara Natural & Verbatim</h3>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <strong className="text-blue-400 block mb-1">1. Mengapa Microsoft Edge adalah Rekomendasi Utama:</strong>
              Microsoft Edge memiliki model suara neural bahasa Indonesia tercanggih di dunia: <strong>Microsoft Ardi Online (Natural)</strong> untuk pria dan <strong>Microsoft Gadis Online (Natural)</strong> untuk wanita. Suara ini bekerja otomatis, gratis, tanpa batas kuota API, dan menghasilkan artikulasi kata yang sangat mirip manusia asli.
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <strong className="text-emerald-400 block mb-1">2. Gunakan Penanda Verbatim pada Teks Dialog:</strong>
              Manusia tidak berbicara terus menerus seperti robot; mereka mengambil napas dan berpikir. Sistem menggunakan timing mikro yang kontekstual agar tidak ada jeda kaku:
              <ul className="mt-1.5 space-y-1 text-slate-400 list-disc list-inside">
                <li><code className="text-indigo-300">[napas]</code>: Jeda hembusan napas mikro halus (110ms) di antara anak kalimat.</li>
                <li><code className="text-indigo-300">[jeda]</code>: Jeda kontemplatif alami (220ms) sebelum poin penting.</li>
                <li><code className="text-indigo-300">[hmm]</code>: Gumaman berpikir singkat ("Mmm,") khas narasumber ahli.</li>
                <li><code className="text-indigo-300">[ya]</code>: Penegasan dialog cepat ("Ya,") penyambung obrolan.</li>
                <li><code className="text-indigo-300">[ehem]</code>: Transisi vokal ("Ehm,").</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <strong className="text-violet-400 block mb-1">3. Normalisasi Fonetik & Intonasi Pertanyaan:</strong>
              Wicara otomatis mengonversi singkatan (seperti <em>AI</em> menjadi <em>e-ai</em>, <em>HRD</em> menjadi <em>ha-er-de</em>, dan <em>Rp</em> menjadi <em>rupiah</em>) serta menaikkan nada intonasi pada tanda tanya <code className="text-indigo-300">?</code> sehingga terdengar seperti pertanyaan alami khas Indonesia.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Verbatim Sandbox */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Uji Coba Cepat Suara Verbatim (Sandbox)</h3>
          </div>
          <span className="text-xs text-slate-400">
            Ketik kalimat apa saja dan sertakan <code className="text-indigo-300">[napas]</code> atau <code className="text-indigo-300">[jeda]</code>
          </span>
        </div>

        <textarea
          rows={3}
          value={sandboxText}
          onChange={(e) => setSandboxText(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans resize-y"
          placeholder="Ketik teks dialog dengan tag [napas], [jeda], [hmm]..."
        />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px]">Sisip tag:</span>
            <button
              type="button"
              onClick={() => setSandboxText((prev) => prev + ' [napas] ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[11px]"
            >
              + [napas]
            </button>
            <button
              type="button"
              onClick={() => setSandboxText((prev) => prev + ' [jeda] ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px]"
            >
              + [jeda]
            </button>
            <button
              type="button"
              onClick={() => setSandboxText((prev) => prev + ' [hmm] ')}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-violet-300 border border-slate-700 text-[11px]"
            >
              + [hmm]
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePlaySandbox}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                isPlayingSandbox
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isPlayingSandbox ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlayingSandbox ? 'Sedang Membaca...' : 'Uji Ucapkan Teks Ini'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
