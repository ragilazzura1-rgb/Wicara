import React, { useState } from 'react';
import {
  Users,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Volume2,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { VoiceModel, TTSMode } from '../types';
import { INDONESIAN_VOICE_MODELS, detectEdgeNaturalVoices } from '../services/voiceCatalog';
import { TTSService } from '../services/ttsService';

interface VoiceCatalogViewProps {
  ttsMode: TTSMode;
  onAssignToSpeaker?: (voice: VoiceModel) => void;
}

export const VoiceCatalogView: React.FC<VoiceCatalogViewProps> = ({
  ttsMode,
  onAssignToSpeaker,
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [testPacing, setTestPacing] = useState<Record<string, { rate: number; pitch: number }>>({});
  const edgeInfo = detectEdgeNaturalVoices();

  const filteredVoices = INDONESIAN_VOICE_MODELS.filter((v) => {
    if (filterGender === 'all') return true;
    return v.gender === filterGender;
  });

  const handleAudition = async (voice: VoiceModel) => {
    if (playingVoiceId === voice.id) {
      TTSService.stopPlayback();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    const pacing = testPacing[voice.id] || {
      rate: voice.defaultPacing.rate,
      pitch: voice.defaultPacing.pitch,
    };

    try {
      await TTSService.previewVoice(voice, pacing, ttsMode);
    } catch (e) {
      console.error(e);
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const updateVoicePacing = (voiceId: string, field: 'rate' | 'pitch', value: number) => {
    setTestPacing((prev) => {
      const current = prev[voiceId] || { rate: 1.0, pitch: 1.0 };
      return {
        ...prev,
        [voiceId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Model Vokal Penutur Asli Indonesia</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              6 Model Suara Native Indonesia
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Koleksi suara autentik penutur asli bahasa Indonesia: 3 karakter Pria (formal berwibawa,
              podcast kasual, tetua bijaksana) dan 3 karakter Wanita (penyiar baku elegan, ramah empatis,
              analis tegas). Masing-masing dapat dikustomisasi tempo dan intonasinya.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 self-start md:self-auto shrink-0">
            <button
              onClick={() => setFilterGender('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterGender === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua (6)
            </button>
            <button
              onClick={() => setFilterGender('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterGender === 'male'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 Pria (Men)
            </button>
            <button
              onClick={() => setFilterGender('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterGender === 'female'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 Wanita (Women)
            </button>
          </div>
        </div>
      </div>

      {/* Edge Neural Voice Info Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Optimalisasi Suara Alami (Microsoft Edge & Verbatim)</span>
              {edgeInfo.hasArdi && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  ✨ Ardi & Gadis Terdeteksi
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Di Microsoft Edge, model suara <strong>Microsoft Ardi (Pria)</strong> dan <strong>Microsoft Gadis (Wanita)</strong> aktif otomatis bebas kuota. Gabungkan dengan penanda <code>[napas]</code> dan <code>[jeda]</code> untuk intonasi dan ritme manusiawi.
            </div>
          </div>
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVoices.map((voice) => {
          const isPlaying = playingVoiceId === voice.id;
          const pacing = testPacing[voice.id] || {
            rate: voice.defaultPacing.rate,
            pitch: voice.defaultPacing.pitch,
          };

          return (
            <div
              key={voice.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group"
            >
              <div>
                {/* Voice Card Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md"
                      style={{ backgroundColor: voice.avatarColor }}
                    >
                      {voice.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{voice.name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            voice.gender === 'male'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {voice.gender === 'male' ? 'Pria' : 'Wanita'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-indigo-400">{voice.archetype}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {voice.description}
                </p>

                {/* Recommendation pill */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-4 text-xs">
                  <span className="font-semibold text-slate-300 block mb-1">
                    Rekomendasi Peran:
                  </span>
                  <span className="text-slate-400">{voice.roleRecommendation}</span>
                </div>

                {/* Sample Quote Card */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-4 text-xs">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                    Kutipan Contoh:
                  </span>
                  <p className="italic text-slate-300">"{voice.sampleQuote}"</p>
                </div>

                {/* Live Pacing Test Sliders */}
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 mb-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-300">Uji Tempo Bicara (Speed):</span>
                    <span className="font-mono text-indigo-400">{pacing.rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={pacing.rate}
                    onChange={(e) => updateVoicePacing(voice.id, 'rate', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-slate-300">Uji Nada (Pitch):</span>
                    <span className="font-mono text-indigo-400">{pacing.pitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.02"
                    value={pacing.pitch}
                    onChange={(e) => updateVoicePacing(voice.id, 'pitch', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleAudition(voice)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold shadow-md transition-all ${
                    isPlaying
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Hentikan Audisi</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Dengarkan Suara ({pacing.rate.toFixed(1)}x)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
