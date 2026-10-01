import { VoiceModel } from '../types';

export const INDONESIAN_VOICE_MODELS: VoiceModel[] = [
  // --- 3 PRIA (MEN) ---
  {
    id: 'budi-santoso',
    name: 'Budi Santoso',
    gender: 'male',
    archetype: 'Bariton Formal & Berwibawa',
    description: 'Suara pria dewasa dengan artikulasi mantap, wibawa jurnalistik senior, dan kedalaman nada yang meyakinkan.',
    roleRecommendation: 'Pewawancara senior, pembaca berita, moderator formal, atau dosen penguji.',
    sampleQuote: 'Selamat pagi rekan-rekan. [napas] Pada sesi wawancara ini, kita akan mendalami implementasi kebijakan publik terbaru.',
    avatarColor: '#059669', // Emerald
    defaultPacing: {
      rate: 0.98,
      pitch: 0.95,
      pauseAfter: 0.5,
      volume: 1.0,
    },
    geminiVoiceName: 'Fenrir',
    speechStyleInstruction: 'Penutur asli pria bahasa Indonesia dengan logat baku yang tenang, berwibawa, artikulatif, dan formal.',
    offlinePitchOffset: 0.94, // Real male natural baritone
    offlineRateOffset: 0.98,
  },
  {
    id: 'dimas-pratama',
    name: 'Dimas Pratama',
    gender: 'male',
    archetype: 'Santai, Dinamis & Modern',
    description: 'Suara pemuda kontemporer yang rileks, berenergi positif, dan sangat ekspresif dalam obrolan spontan.',
    roleRecommendation: 'Host podcast, founder startup teknologi, kreator konten, atau narasumber generasi muda.',
    sampleQuote: 'Menarik banget nih! [napas] Gimana ceritanya waktu pertama kali kamu nemuin solusi buat tantangan sebesar itu?',
    avatarColor: '#2563eb', // Blue
    defaultPacing: {
      rate: 1.06,
      pitch: 1.02,
      pauseAfter: 0.35,
      volume: 1.0,
    },
    geminiVoiceName: 'Puck',
    speechStyleInstruction: 'Penutur pria muda Indonesia yang berbicara dengan nada santai, ramah, dinamis, dan bersahabat seperti podcaster.',
    offlinePitchOffset: 1.02, // Real male natural energetic tenor
    offlineRateOffset: 1.05,
  },
  {
    id: 'joko-hartono',
    name: 'Pak Joko Hartono',
    gender: 'male',
    archetype: 'Hangat, Bijaksana & Berpengalaman',
    description: 'Suara pria paruh baya yang tenang, penuh pertimbangan, kebapakan, dan kaya pengalaman hidup.',
    roleRecommendation: 'Narasumber ahli, tokoh masyarakat, pimpinan institusi, atau saksi sejarah.',
    sampleQuote: 'Pengalaman berpuluh tahun ini mengajarkan kita, [jeda] bahwa integritas adalah modal utama dalam kepemimpinan.',
    avatarColor: '#d97706', // Amber
    defaultPacing: {
      rate: 0.90,
      pitch: 0.88,
      pauseAfter: 0.75,
      volume: 1.0,
    },
    geminiVoiceName: 'Charon',
    speechStyleInstruction: 'Penutur pria senior Indonesia dengan intonasi hangat, tenang, bijaksana, tempo teratur dan penuh bobot.',
    offlinePitchOffset: 0.88, // Real male deep resonant mature bass
    offlineRateOffset: 0.90,
  },

  // --- 3 WANITA (WOMEN) ---
  {
    id: 'siti-rahma',
    name: 'Siti Rahma',
    gender: 'female',
    archetype: 'Jelas, Baku & Elegan',
    description: 'Suara wanita dengan intonasi sangat jernih, diksi baku teratur, dan nada netral profesional yang elegan.',
    roleRecommendation: 'Pewawancara HR, penyiar berita nasional, moderator debat, atau peneliti institusi.',
    sampleQuote: 'Terima kasih telah hadir. [napas] Bisakah Anda menjelaskan faktor utama yang mendasari keputusan strategis tersebut?',
    avatarColor: '#e11d48', // Rose
    defaultPacing: {
      rate: 0.98,
      pitch: 1.00,
      pauseAfter: 0.45,
      volume: 1.0,
    },
    geminiVoiceName: 'Kore',
    speechStyleInstruction: 'Penutur wanita Indonesia dengan suara jernih, intonasi baku berita resmi, pengucapan kata sangat jelas dan lugas.',
    offlinePitchOffset: 1.00,
    offlineRateOffset: 0.98,
  },
  {
    id: 'ayu-lestari',
    name: 'Ayu Lestari',
    gender: 'female',
    archetype: 'Hangat, Ramah & Empatis',
    description: 'Suara wanita yang manis, ramah, dan penuh empati. Membuat suasana wawancara terasa nyaman dan terbuka.',
    roleRecommendation: 'Pewawancara human interest, riset pengalaman pengguna (UX), konseling, atau narasi cerita.',
    sampleQuote: 'Bisa ceritakan apa yang sebenarnya kamu rasakan, [napas] saat pertama kali menghadapi situasi yang begitu menantang itu?',
    avatarColor: '#9333ea', // Purple
    defaultPacing: {
      rate: 0.96,
      pitch: 1.06,
      pauseAfter: 0.5,
      volume: 1.0,
    },
    geminiVoiceName: 'Zephyr',
    speechStyleInstruction: 'Penutur wanita Indonesia yang hangat, bersahabat, penuh empati, lembut, dan menenangkan.',
    offlinePitchOffset: 1.06,
    offlineRateOffset: 0.96,
  },
  {
    id: 'dewi-kusuma',
    name: 'Dewi Kusuma',
    gender: 'female',
    archetype: 'Cepat, Tegas & Artikulatif',
    description: 'Suara wanita profesional kontemporer yang tajam, percaya diri, lugas, dan cepat dalam mencerna poin inti.',
    roleRecommendation: 'Analis bisnis & pasar modal, jurnalis investigasi, eksekutif perusahaan, atau debat.',
    sampleQuote: 'Data kuartal ketiga menunjukkan lonjakan yang signifikan. [napas] Bagaimana tim Anda memitigasi risiko operasionalnya?',
    avatarColor: '#0891b2', // Cyan
    defaultPacing: {
      rate: 1.08,
      pitch: 0.98,
      pauseAfter: 0.35,
      volume: 1.0,
    },
    geminiVoiceName: 'Aoede',
    speechStyleInstruction: 'Penutur wanita profesional Indonesia yang berbicara cepat, tegas, artikulatif, cerdas, dan percaya diri.',
    offlinePitchOffset: 0.98,
    offlineRateOffset: 1.06,
  },
];

export function isExplicitMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const combined = `${voice.name} ${voice.voiceURI}`.toLowerCase();

  // Female keywords instantly reject
  if (
    combined.includes('female') ||
    combined.includes('gadis') ||
    combined.includes('siti') ||
    combined.includes('damayanti') ||
    combined.includes('wanita') ||
    combined.includes('perempuan') ||
    combined.includes('zira') ||
    combined.includes('samantha') ||
    combined.includes('victoria') ||
    combined.includes('karen') ||
    combined.includes('fiona') ||
    combined.includes('helena') ||
    combined.includes('catherine') ||
    combined.includes('moira') ||
    combined.includes('tessa') ||
    combined.includes('yasmin')
  ) {
    return false;
  }

  // Male keywords
  return (
    combined.includes('male') ||
    combined.includes('ardi') ||
    combined.includes('andika') ||
    combined.includes('osman') ||
    combined.includes('fikri') ||
    combined.includes('pria') ||
    combined.includes('laki') ||
    combined.includes('man') ||
    combined.includes('boy') ||
    combined.includes('guy') ||
    combined.includes('david') ||
    combined.includes('mark') ||
    combined.includes('george') ||
    combined.includes('richard') ||
    combined.includes('stefan') ||
    combined.includes('jorge') ||
    combined.includes('diego') ||
    combined.includes('carlos') ||
    combined.includes('daniel') ||
    combined.includes('thomas') ||
    combined.includes('alex') ||
    combined.includes('fred') ||
    combined.includes('bruce') ||
    combined.includes('dfz#male')
  );
}

export function isExplicitFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const combined = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  return (
    combined.includes('female') ||
    combined.includes('gadis') ||
    combined.includes('siti') ||
    combined.includes('damayanti') ||
    combined.includes('wanita') ||
    combined.includes('perempuan') ||
    combined.includes('zira') ||
    combined.includes('samantha') ||
    combined.includes('victoria') ||
    combined.includes('karen') ||
    combined.includes('dfz#female') ||
    !isExplicitMaleVoice(voice)
  );
}

export function findBestVoiceForSpeaker(
  targetGender: 'male' | 'female',
  preferredVoiceURI?: string
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const availableVoices = window.speechSynthesis.getVoices();
  if (availableVoices.length === 0) return null;

  // 1. If explicit preferred URI matches
  if (preferredVoiceURI) {
    const matched = availableVoices.find((v) => v.voiceURI === preferredVoiceURI);
    if (matched) return matched;
  }

  if (targetGender === 'male') {
    // 2a. Priority 1: Indonesian native male voice (Microsoft Ardi Online Neural, Microsoft Andika, Android dfz#male, etc.)
    const idMale = availableVoices.find(
      (v) => (v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')) && isExplicitMaleVoice(v)
    );
    if (idMale) return idMale;

    // 2b. Priority 2: Malay male voice (Microsoft Osman / Malay male has identical phonetic rules and speaks natural Southeast Asian)
    const msMale = availableVoices.find(
      (v) => (v.lang.startsWith('ms') || v.name.toLowerCase().includes('malay')) && isExplicitMaleVoice(v)
    );
    if (msMale) return msMale;

    // 2c. Priority 3: Local device Indonesian voice (localService = true allows pitch shifting into deep baritone)
    const localId = availableVoices.find(
      (v) => (v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')) && v.localService
    );
    if (localId) return localId;

    // 2d. Priority 4: Any native Indonesian voice (will be pitch-shifted into masculine baritone)
    const anyId = availableVoices.find(
      (v) => v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')
    );
    if (anyId) return anyId;
  } else {
    // Female
    // Priority 1: Indonesian female voice (Microsoft Gadis Online Neural, Siti, Damayanti, Google Bahasa Indonesia)
    const idFemale = availableVoices.find(
      (v) => (v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')) && isExplicitFemaleVoice(v)
    );
    if (idFemale) return idFemale;

    const anyId = availableVoices.find(
      (v) => v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')
    );
    if (anyId) return anyId;
  }

  // Strictly fallback ONLY to Indonesian or Malay voice, NEVER foreign/English voices!
  return (
    availableVoices.find((v) => v.lang.startsWith('id') || v.lang.startsWith('in') || v.name.toLowerCase().includes('indonesia')) ||
    availableVoices.find((v) => v.lang.startsWith('ms') || v.name.toLowerCase().includes('malay')) ||
    availableVoices[0] ||
    null
  );
}

export function detectEdgeNaturalVoices(): { hasArdi: boolean; hasGadis: boolean; isEdge: boolean } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { hasArdi: false, hasGadis: false, isEdge: false };
  }
  const voices = window.speechSynthesis.getVoices();
  const hasArdi = voices.some(
    (v) => (v.lang.startsWith('id') || v.lang.startsWith('in')) && v.name.toLowerCase().includes('ardi')
  );
  const hasGadis = voices.some(
    (v) => (v.lang.startsWith('id') || v.lang.startsWith('in')) && v.name.toLowerCase().includes('gadis')
  );
  const isEdge = navigator.userAgent.includes('Edg/');

  return { hasArdi, hasGadis, isEdge };
}

export function getVoiceById(id: string): VoiceModel {
  return INDONESIAN_VOICE_MODELS.find((v) => v.id === id) || INDONESIAN_VOICE_MODELS[0];
}

export function getVoicesByGender(gender: 'male' | 'female'): VoiceModel[] {
  return INDONESIAN_VOICE_MODELS.filter((v) => v.gender === gender);
}
