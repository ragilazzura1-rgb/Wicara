import { InterviewProject, AudioHistoryItem, TTSMode } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'wicara_interview_projects_v1',
  ACTIVE_PROJECT: 'wicara_active_project_id_v1',
  TTS_MODE: 'wicara_tts_mode_v1',
  AUDIO_HISTORY: 'wicara_audio_history_v1',
};

// Initial default templates in authentic Bahasa Indonesia
export const DEFAULT_PROJECTS: InterviewProject[] = [
  {
    id: 'proj-rekrutmen-tech',
    title: 'Wawancara Kerja: Engineering Lead & HR Manager',
    description: 'Sesi wawancara kerja mendalam antara manajer HR dan kandidat senior mengenai pengalaman kepemimpinan teknis dan problem solving.',
    category: 'rekrutmen',
    tags: ['HR', 'Karir', 'Teknologi', 'Leadership'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    speakers: [
      {
        id: 'spk-hr',
        name: 'Siti Rahma (HR Manager)',
        voiceModelId: 'siti-rahma',
        color: '#e11d48',
        role: 'Pewawancara',
        pacing: {
          rate: 1.0,
          pitch: 1.0,
          pauseAfter: 0.45,
          volume: 1.0,
        },
      },
      {
        id: 'spk-kandidat',
        name: 'Dimas Pratama (Kandidat)',
        voiceModelId: 'dimas-pratama',
        color: '#2563eb',
        role: 'Narasumber',
        pacing: {
          rate: 1.08,
          pitch: 1.02,
          pauseAfter: 0.4,
          volume: 1.0,
        },
      },
    ],
    turns: [
      {
        id: 'turn-1',
        speakerId: 'spk-hr',
        text: 'Selamat pagi Mas Dimas, terima kasih sudah meluangkan waktu untuk hadir di tahap wawancara strategis hari ini.',
        status: 'idle',
      },
      {
        id: 'turn-2',
        speakerId: 'spk-kandidat',
        text: 'Selamat pagi Ibu Siti, senang sekali mendapat kesempatan berdiskusi langsung dengan tim Anda.',
        status: 'idle',
      },
      {
        id: 'turn-3',
        speakerId: 'spk-hr',
        text: 'Bisa diceritakan bagaimana pendekatan Anda ketika memimpin tim dalam menyelesaikan insiden sistem skala besar di bawah tekanan deadline yang ketat?',
        status: 'idle',
      },
      {
        id: 'turn-4',
        speakerId: 'spk-kandidat',
        text: 'Kunci utamanya adalah komunikasi transparan dan pembagian peran yang terukur. Pertama kami melakukan triase sistematis, lalu mengisolasi bottleneck sebelum mengimplementasikan solusi jangka panjang.',
        status: 'idle',
      },
      {
        id: 'turn-5',
        speakerId: 'spk-hr',
        text: 'Sangat baik. Nilai kolaborasi apa yang menurut Anda paling krusial untuk menjaga motivasi tim teknik tetap tinggi?',
        status: 'idle',
      },
      {
        id: 'turn-6',
        speakerId: 'spk-kandidat',
        text: 'Menurut saya, rasa kepemilikan bersama dan budaya tidak saling menyalahkan saat kegagalan terjadi, melainkan fokus belajar secara kolektif.',
        status: 'idle',
      },
    ],
  },
  {
    id: 'proj-podcast-startup',
    title: 'Podcast Wicara Tech: Masa Depan AI di Indonesia',
    description: 'Bincang santai dan berbobot antara podcaster teknologi dengan founder startup AI perempuan mengenai etika dan transformasi industri kreatif.',
    category: 'podcast',
    tags: ['Podcast', 'Artificial Intelligence', 'Inovasi'],
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    updatedAt: Date.now() - 1000 * 60 * 30,
    speakers: [
      {
        id: 'spk-host-dimas',
        name: 'Dimas Pratama (Host)',
        voiceModelId: 'dimas-pratama',
        color: '#2563eb',
        role: 'Host Podcast',
        pacing: {
          rate: 1.12,
          pitch: 1.05,
          pauseAfter: 0.35,
          volume: 1.0,
        },
      },
      {
        id: 'spk-guest-dewi',
        name: 'Dewi Kusuma (AI Founder)',
        voiceModelId: 'dewi-kusuma',
        color: '#0891b2',
        role: 'Bintang Tamu',
        pacing: {
          rate: 1.15,
          pitch: 1.05,
          pauseAfter: 0.4,
          volume: 1.0,
        },
      },
    ],
    turns: [
      {
        id: 'p-1',
        speakerId: 'spk-host-dimas',
        text: 'Halo kawan kreatif! Selamat datang di Wicara Tech. Hari ini kita kedatangan sosok luar biasa di industri kecerdasan buatan, Mbak Dewi Kusuma!',
        status: 'idle',
      },
      {
        id: 'p-2',
        speakerId: 'spk-guest-dewi',
        text: 'Halo Mas Dimas, halo semuanya! Senang banget akhirnya bisa ngobrol santai di podcast yang selalu inspiratif ini.',
        status: 'idle',
      },
      {
        id: 'p-3',
        speakerId: 'spk-host-dimas',
        text: 'Mbak Dewi, banyak orang cemas AI bakal menggantikan profesi kreatif. Menurut pandangan Mbak sendiri, batasnya ada di mana?',
        status: 'idle',
      },
      {
        id: 'p-4',
        speakerId: 'spk-guest-dewi',
        text: 'AI adalah pengganda kemampuan, bukan pengganti esensi kemanusiaan. Rasa empati, intuisi kultural, dan keaslian rasa tetap menjadi ranah eksklusif manusia.',
        status: 'idle',
      },
      {
        id: 'p-5',
        speakerId: 'spk-host-dimas',
        text: 'Keren banget poinnya! Jadi kuncinya adalah sinergi cerdas antara teknologi dan kreativitas lokal ya.',
        status: 'idle',
      },
    ],
  },
  {
    id: 'proj-investigasi-desa',
    title: 'Investigasi Jurnalistik: Kearifan Hutan Adat',
    description: 'Wawancara mendalam jurnalis senior investigasi dengan sesepuh adat mengenai pelestarian hutan hujan dan ketahanan pangan nusantara.',
    category: 'jurnalistik',
    tags: ['Jurnalistik', 'Lingkungan', 'Budaya', 'Investigasi'],
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    speakers: [
      {
        id: 'spk-jurnalis-budi',
        name: 'Budi Santoso (Jurnalis)',
        voiceModelId: 'budi-santoso',
        color: '#059669',
        role: 'Pewawancara',
        pacing: {
          rate: 0.98,
          pitch: 0.95,
          pauseAfter: 0.6,
          volume: 1.0,
        },
      },
      {
        id: 'spk-tokoh-joko',
        name: 'Pak Joko Hartono (Tetua Adat)',
        voiceModelId: 'joko-hartono',
        color: '#d97706',
        role: 'Narasumber Senior',
        pacing: {
          rate: 0.88,
          pitch: 0.84,
          pauseAfter: 0.8,
          volume: 1.0,
        },
      },
    ],
    turns: [
      {
        id: 'inv-1',
        speakerId: 'spk-jurnalis-budi',
        text: 'Selamat sore Pak Joko. Kami melihat kawasan hutan lindung di desa ini tetap hijau asri meski dikelilingi ekspansi industri.',
        status: 'idle',
      },
      {
        id: 'inv-2',
        speakerId: 'spk-tokoh-joko',
        text: 'Sore Mas Budi. Sejak ratusan tahun silam, leluhur kami telah menanamkan petuah bahwa tanah dan air adalah titipan anak cucu, bukan warisan untuk dihabiskan.',
        status: 'idle',
      },
      {
        id: 'inv-3',
        speakerId: 'spk-jurnalis-budi',
        text: 'Bagaimana warga desa menjaga komitmen adat ini di tengah godaan ekonomi modern yang begitu gencar?',
        status: 'idle',
      },
      {
        id: 'inv-4',
        speakerId: 'spk-tokoh-joko',
        text: 'Kuncinya adalah musyawarah dan rasa cukup. Saat kita merawat alam dengan hormat, hutan pun akan memberi kehidupan yang berkah bagi setiap generasi.',
        status: 'idle',
      },
    ],
  },
];

export const StorageService = {
  getProjects(): InterviewProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
        return DEFAULT_PROJECTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROJECTS;
    }
  },

  saveProjects(projects: InterviewProject[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  },

  getActiveProjectId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
    if (saved) return saved;
    return DEFAULT_PROJECTS[0]?.id || '';
  },

  setActiveProjectId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, id);
  },

  getTTSMode(): TTSMode {
    const saved = localStorage.getItem(STORAGE_KEYS.TTS_MODE);
    if (saved === 'offline' || saved === 'gemini') {
      return saved;
    }
    return 'gemini';
  },

  setTTSMode(mode: TTSMode) {
    localStorage.setItem(STORAGE_KEYS.TTS_MODE, mode);
  },

  getAudioHistory(): AudioHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIO_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAudioHistory(items: AudioHistoryItem[]) {
    try {
      // Keep up to 50 items to avoid quota overload
      const trimmed = items.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.AUDIO_HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save audio history:', e);
    }
  },

  addAudioHistoryItem(item: AudioHistoryItem) {
    const existing = this.getAudioHistory();
    const updated = [item, ...existing];
    this.saveAudioHistory(updated);
  },

  deleteAudioHistoryItem(id: string) {
    const existing = this.getAudioHistory();
    const filtered = existing.filter((it) => it.id !== id);
    this.saveAudioHistory(filtered);
  },
};
