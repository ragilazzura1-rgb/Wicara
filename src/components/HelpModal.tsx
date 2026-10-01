import React from 'react';
import { X, Mic, Users, Sliders, WifiOff, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Panduan Studio Wicara TTS</h3>
              <p className="text-xs text-slate-400">Cara mengubah transkrip wawancara menjadi percakapan hidup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                1. Enam Model Suara Native Indonesia (3 Pria & 3 Wanita)
              </h4>
              <p className="text-slate-400 mb-2">
                Aplikasi ini dilengkapi 6 persona suara asli Indonesia yang dirancang khusus untuk interaksi dialog:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-emerald-400">Budi Santoso (Pria):</span> Bariton formal & berwibawa untuk jurnalis senior.
                </li>
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-rose-400">Siti Rahma (Wanita):</span> Jernih, baku, dan elegan untuk moderator berita.
                </li>
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-blue-400">Dimas Pratama (Pria):</span> Santai, modern, dan dinamis untuk podcast.
                </li>
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-purple-400">Ayu Lestari (Wanita):</span> Hangat, ramah, dan empatis untuk cerita human interest.
                </li>
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-amber-400">Pak Joko Hartono (Pria):</span> Tenang, bijaksana, dan kebapakan untuk tetua/ahli.
                </li>
                <li className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <span className="font-bold text-cyan-400">Dewi Kusuma (Wanita):</span> Cepat, tegas, dan artikulatif untuk analisis bisnis.
                </li>
              </ul>
              <div className="mt-2.5 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
                ⭐ <strong>Jaminan Penutur Asli Bahasa Indonesia:</strong> Sistem secara ketat mengunci fonem bahasa Indonesia dan memblokir suara bahasa asing (Inggris). Untuk suara pria Indonesia neural paling natural (<strong>Microsoft Ardi</strong>), gunakan browser <strong>Microsoft Edge</strong> di Windows atau aktifkan suara pria di pengaturan Speech Services Android.
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                2. Kustomisasi Pacing Bicara & Jeda Antar Pembicara
              </h4>
              <p className="text-slate-400">
                Setiap pembicara dapat disesuaikan tempo bicaranya (0.5x hingga 2.0x), nada suara (pitch),
                dan jeda pergantian giliran bicara (0.1s - 2.5s) agar dialog antar dua orang terdengar alami
                seperti manusia bernapas dan merespons.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                3. Dukungan Mode Offline Sepenuhnya
              </h4>
              <p className="text-slate-400">
                Saat internet mati atau tombol Offline diaktifkan, aplikasi otomatis menggunakan Web Speech API
                lokal bahasa Indonesia dan Web Audio Synthesizer, sehingga Anda tetap bisa memutar dan mengekspor
                file audio WAV tanpa kuota internet!
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                4. Ekspor ke Berbagai Format Audio & Subtitle
              </h4>
              <p className="text-slate-400">
                Ekspor seluruh percakapan dalam format <strong>WAV studio lossless</strong>, <strong>MP3 universal</strong>,
                <strong>WebM hemat ruang</strong>, atau <strong>subtitle SRT</strong> yang siap dimasukkan ke editor video
                (Premiere, CapCut, DaVinci).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Mengerti, Lanjutkan ke Studio
          </button>
        </div>
      </div>
    </div>
  );
};
