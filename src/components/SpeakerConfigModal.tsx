import React, { useState, useEffect } from 'react';
import { X, Volume2, Play, Check, Sliders, User, Info, Mic, Trash2, AlertTriangle, Edit3, MessageSquare } from 'lucide-react';
import { Speaker, TTSMode } from '../types';
import {
  INDONESIAN_VOICE_MODELS,
  getVoiceById,
  findBestVoiceForSpeaker,
  isExplicitMaleVoice,
} from '../services/voiceCatalog';
import { TTSService } from '../services/ttsService';

interface SpeakerConfigModalProps {
  speaker: Speaker;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSpeaker: Speaker) => void;
  onDeleteSpeaker?: (speakerId: string) => void;
  canDelete?: boolean;
  associatedTurnsCount?: number;
  ttsMode: TTSMode;
}

const COLOR_OPTIONS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#e11d48', // Rose
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
];

export const SpeakerConfigModal: React.FC<SpeakerConfigModalProps> = ({
  speaker,
  isOpen,
  onClose,
  onSave,
  onDeleteSpeaker,
  canDelete = true,
  associatedTurnsCount = 0,
  ttsMode,
}) => {
  const [name, setName] = useState(speaker.name);
  const [role, setRole] = useState(speaker.role || 'Pewawancara');
  const [voiceModelId, setVoiceModelId] = useState(speaker.voiceModelId);
  const [color, setColor] = useState(speaker.color);
  const [rate, setRate] = useState(speaker.pacing.rate);
  const [pitch, setPitch] = useState(speaker.pacing.pitch);
  const [pauseAfter, setPauseAfter] = useState(speaker.pacing.pauseAfter);
  const [volume, setVolume] = useState(speaker.pacing.volume);
  const [systemVoiceURI, setSystemVoiceURI] = useState(speaker.systemVoiceURI || '');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(speaker.name);
    setRole(speaker.role || 'Pewawancara');
    setVoiceModelId(speaker.voiceModelId);
    setColor(speaker.color);
    setRate(speaker.pacing.rate);
    setPitch(speaker.pacing.pitch);
    setPauseAfter(speaker.pacing.pauseAfter);
    setVolume(speaker.pacing.volume);
    setSystemVoiceURI(speaker.systemVoiceURI || '');
    setConfirmDelete(false);
  }, [speaker]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setBrowserVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const currentVoice = getVoiceById(voiceModelId);
  const activeDeviceVoice = findBestVoiceForSpeaker(currentVoice.gender, systemVoiceURI);

  const handlePreview = async () => {
    setIsPlayingPreview(true);
    try {
      await TTSService.previewVoice(currentVoice, { rate, pitch }, ttsMode, systemVoiceURI);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingPreview(false);
    }
  };

  const handleApplyPreset = (presetType: 'formal' | 'casual' | 'fast' | 'slow') => {
    switch (presetType) {
      case 'formal':
        setRate(1.0);
        setPitch(currentVoice.gender === 'male' ? 0.90 : 1.0);
        setPauseAfter(0.4);
        break;
      case 'casual':
        setRate(1.05);
        setPitch(currentVoice.gender === 'male' ? 0.98 : 1.05);
        setPauseAfter(0.3);
        break;
      case 'fast':
        setRate(1.18);
        setPitch(currentVoice.gender === 'male' ? 1.0 : 1.10);
        setPauseAfter(0.2);
        break;
      case 'slow':
        setRate(0.88);
        setPitch(currentVoice.gender === 'male' ? 0.85 : 0.95);
        setPauseAfter(0.6);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...speaker,
      name: name.trim() || 'Pembicara',
      role: role.trim() || 'Narasumber',
      voiceModelId,
      color,
      systemVoiceURI: systemVoiceURI || undefined,
      pacing: {
        rate,
        pitch,
        pauseAfter,
        volume,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteSpeaker) {
      onDeleteSpeaker(speaker.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-inner"
              style={{ backgroundColor: color }}
            >
              {name.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Pengaturan Pembicara & Suara
                </h3>
                {associatedTurnsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{associatedTurnsCount} giliran terhubung</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Ganti nama massal, sesuaikan peran, model suara native, dan ritme bicara
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Speaker Identity Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Identitas & Peran Aktor (Ganti Nama Massal)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Nama Aktor / Pembicara</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Terapkan ke semua giliran</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, Ibu Guru, dll."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  ✨ Mengganti nama ini akan otomatis memperbarui nama pembicara pada <strong>{associatedTurnsCount}</strong> giliran percakapan di studio.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Peran / Posisi dalam Wawancara
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Contoh: Pewawancara / Guru Kelas / Pakar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Warna Identitas Visual
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-xl transition-transform ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Indonesian Voice Model Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Model Suara Penutur Asli Indonesia (6 Model)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INDONESIAN_VOICE_MODELS.map((voice) => {
                const isSelected = voiceModelId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setVoiceModelId(voice.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{voice.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            voice.gender === 'male'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {voice.gender === 'male' ? 'Pria' : 'Wanita'}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] font-medium text-indigo-300 mb-1">{voice.archetype}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {voice.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Pacing & Prosody Sliders */}
          <div className="space-y-4 pt-4 border-t border-slate-800 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Kontrol Ritme Bicara (Pacing & Jeda)</span>
              </h4>

              {/* Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('formal')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                >
                  Formal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('casual')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                >
                  Santai
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('fast')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                >
                  Cepat
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('slow')}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition-colors"
                >
                  Pelan
                </button>
              </div>
            </div>

            {/* Slider 1: Rate (Speed) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Kecepatan Artikulasi (Rate)</span>
                <span className="text-indigo-400 font-semibold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.7x (Lambat)</span>
                <span>1.0x (Normal)</span>
                <span>1.5x (Cepat)</span>
              </div>
            </div>

            {/* Slider 2: Pitch */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Tinggi Nada (Pitch Intonasi)</span>
                <span className="text-indigo-400 font-semibold">{pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Berat / Bariton</span>
                <span>Alami</span>
                <span>Tinggi / Sopran</span>
              </div>
            </div>

            {/* Slider 3: Inter-turn Pause */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Jeda Waktu Pergantian Giliran (Turn-Taking Pause)</span>
                <span className="text-indigo-400 font-semibold">{pauseAfter.toFixed(2)} detik</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={pauseAfter}
                onChange={(e) => setPauseAfter(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.1s (Spontan)</span>
                <span>0.4s (Wajar)</span>
                <span>1.5s (Reflektif)</span>
              </div>
            </div>

            {/* Voice Preview Audition */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-400 max-w-[280px] truncate">
                Sampel: <span className="italic text-slate-300">"{currentVoice.sampleQuote}"</span>
              </div>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isPlayingPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {isPlayingPreview ? (
                  <span className="inline-block animate-pulse">Memutar...</span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Uji Coba Suara</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Actions with Delete Option */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap">
            {/* Delete speaker option */}
            {canDelete && onDeleteSpeaker ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Konfirmasi Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/50 hover:bg-rose-950/40 text-rose-400 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pembicara</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Simpan & Terapkan Nama ke Semua Giliran
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
