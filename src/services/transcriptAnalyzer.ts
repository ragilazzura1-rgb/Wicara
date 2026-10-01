import { Speaker, TranscriptTurn, VoiceModel } from '../types';
import { INDONESIAN_VOICE_MODELS } from './voiceCatalog';

export interface AnalyzedSpeakerProfile {
  name: string;
  role: string;
  gender: 'male' | 'female';
  voiceModelId: string;
  color: string;
}

export interface TranscriptAnalysisResult {
  title?: string;
  summary?: string;
  speakers: AnalyzedSpeakerProfile[];
  turns: {
    speakerName: string;
    text: string;
  }[];
}

const AVATAR_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#e11d48', // Rose
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
];

// Keywords that indicate document headers or notes, NOT dialogue actors!
const NON_SPEAKER_KEYWORDS = new Set([
  'catatan', 'note', 'notes', 'topik', 'topic', 'waktu', 'tanggal', 'date', 'time',
  'lokasi', 'tempat', 'location', 'pertanyaan', 'jawaban', 'soal', 'konteks', 'context',
  'hasil', 'observasi', 'pengantar', 'pendahuluan', 'kesimpulan', 'deskripsi', 'sesi',
  'part', 'bab', 'segmen', 'pukul', 'jam', 'latar belakang', 'tujuan', 'judul', 'keterangan',
  'info', 'informasi', 'naskah', 'transkrip', 'transkripsi', 'dialog', 'percakapan'
]);

/**
 * Checks if a candidate name is actually a metadata label or note
 */
function isMetadataLabel(rawName: string): boolean {
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  if (!clean || clean.length < 2) return true;

  // Check single words or starts with
  const words = clean.split(/\s+/);
  if (NON_SPEAKER_KEYWORDS.has(words[0])) return true;
  if (words.length > 4) return true; // Too long for a speaker name
  if (/^(pertanyaan|soal|nomor|no|pukul|jam)\s*\d+/i.test(clean)) return true;
  if (/^\d{1,2}[:.]\d{2}/.test(rawName)) return true; // Timestamp

  return false;
}

/**
 * Normalizes and strips stage directions from speaker names.
 * e.g., "Guru (tersenyum)" -> "Guru"
 * e.g., "Peneliti [mencatat]" -> "Peneliti"
 * e.g., "**Ibu Guru**" -> "Ibu Guru"
 */
function cleanSpeakerName(rawName: string): string {
  let name = rawName.replace(/\*{1,2}/g, '').trim();
  // Strip parentheticals like (tersenyum), (p1), [tertawa]
  name = name.replace(/\s*[\(\[][^()\[\]]*[\)\]]/g, '').trim();
  // Strip trailing colons or dashes
  name = name.replace(/[:：\-–—]+$/, '').trim();
  return name;
}

/**
 * Maps variant names into a single canonical entity.
 * e.g., "Guru", "Ibu Guru", "Bu Guru", "Guru Kelas" -> "Guru"
 * e.g., "Peneliti", "Peneliti 1", "Pewawancara" -> "Peneliti"
 */
function getCanonicalClusterName(name: string, allKnownNames: string[]): string {
  const lower = name.toLowerCase();

  // Cluster 1: Guru / Teacher
  if (lower.includes('guru') || lower.includes('pendidik') || lower.includes('pengajar')) {
    const existingGuru = allKnownNames.find((n) => n.toLowerCase().includes('guru'));
    return existingGuru || (lower.includes('ibu') ? 'Ibu Guru' : 'Guru');
  }

  // Cluster 2: Peneliti / Researcher / Pewawancara
  if (lower.includes('peneliti') || lower.includes('pewawancara') || lower.includes('interviewer') || lower.includes('riset')) {
    const existingPeneliti = allKnownNames.find((n) => n.toLowerCase().includes('peneliti') || n.toLowerCase().includes('pewawancara'));
    return existingPeneliti || 'Peneliti';
  }

  // Cluster 3: Host / Moderator
  if (lower.includes('host') || lower.includes('moderator') || lower.includes('mc')) {
    return 'Host';
  }

  // Cluster 4: Narasumber / Expert / Guest
  if (lower.includes('narasumber') || lower.includes('pakar') || lower.includes('ahli') || lower.includes('tamu')) {
    return 'Narasumber';
  }

  // Specific common Indonesian title prefixes: "Ibu Rahma" vs "Rahma"
  for (const known of allKnownNames) {
    const kLower = known.toLowerCase();
    if (kLower !== lower) {
      if (kLower.includes(lower) || lower.includes(kLower)) {
        return known; // Merge to existing
      }
    }
  }

  return name;
}

/**
 * Heuristically infers gender from Indonesian titles, honorifics, and names.
 */
export function inferIndonesianGender(name: string): 'male' | 'female' {
  const lower = name.toLowerCase();

  const malePrefixes = ['pak', 'bapak', 'mas', 'bung', 'abang', 'om', 'ikhwan', 'mr', 'tuan'];
  const femalePrefixes = ['bu', 'ibu', 'mbak', 'nona', 'tante', 'umi', 'mrs', 'ms', 'puan', 'sister'];

  const maleNames = [
    'budi', 'dimas', 'joko', 'hartono', 'santoso', 'pratama', 'agus', 'ahmad', 'bayu',
    'doni', 'hendro', 'reza', 'fikri', 'fajar', 'andi', 'ilham', 'rizky', 'arief', 'surya',
    'adi', 'putra', 'wahyu', 'bagus', 'dani', 'fahmi', 'yusuf', 'taufik', 'eka', 'gilang',
  ];

  const femaleNames = [
    'siti', 'ayu', 'dewi', 'rahma', 'lestari', 'kusuma', 'putri', 'anita', 'rina',
    'dian', 'maya', 'sari', 'indah', 'mega', 'ratna', 'nur', 'wulandari', 'fitri',
    'tari', 'kartika', 'nadia', 'lia', 'annisa', 'mutia', 'tiara', 'clara', 'nisa',
  ];

  for (const prefix of malePrefixes) {
    if (new RegExp(`\\b${prefix}\\b`, 'i').test(lower)) return 'male';
  }
  for (const prefix of femalePrefixes) {
    if (new RegExp(`\\b${prefix}\\b`, 'i').test(lower)) return 'female';
  }

  for (const mName of maleNames) {
    if (lower.includes(mName)) return 'male';
  }
  for (const fName of femaleNames) {
    if (lower.includes(fName)) return 'female';
  }

  // In Indonesian school/education context, "Guru" without prefix is commonly female, "Peneliti" male/neutral
  if (lower.includes('guru')) return 'female';
  if (lower.includes('peneliti')) return 'male';

  return 'male';
}

/**
 * Infers role based on Indonesian conversational context.
 */
export function inferIndonesianRole(name: string, sampleDialogue: string[]): string {
  const lower = name.toLowerCase();

  if (lower.includes('guru')) return 'Narasumber / Guru Pengajar';
  if (lower.includes('peneliti')) return 'Pewawancara / Peneliti Akademik';
  if (lower.includes('pewawancara') || lower.includes('host') || lower.includes('moderator')) return 'Pewawancara / Host';
  if (lower.includes('narasumber') || lower.includes('ahli') || lower.includes('pakar') || lower.includes('tamu')) return 'Narasumber / Pakar';
  if (lower.includes('dokter') || lower.includes('dr.')) return 'Pakar Medis / Konsultan';
  if (lower.includes('kandidat') || lower.includes('pelamar')) return 'Kandidat Pelamar';

  const totalQuestions = sampleDialogue.filter((d) => d.includes('?')).length;
  const questionRatio = sampleDialogue.length > 0 ? totalQuestions / sampleDialogue.length : 0;

  if (questionRatio >= 0.4) {
    return 'Pewawancara';
  } else {
    return 'Narasumber';
  }
}

/**
 * Assigns optimal voice model from 6 Indonesian models based on gender and role.
 */
export function selectVoiceModelForProfile(
  gender: 'male' | 'female',
  role: string,
  assignedModels: string[]
): string {
  if (gender === 'male') {
    const isPenelitiOrHost = role.toLowerCase().includes('peneliti') || role.toLowerCase().includes('pewawancara') || role.toLowerCase().includes('host');
    const isSenior = role.toLowerCase().includes('tetua') || role.toLowerCase().includes('pakar') || role.toLowerCase().includes('senior');

    if (isSenior && !assignedModels.includes('joko-hartono')) return 'joko-hartono';
    if (isPenelitiOrHost && !assignedModels.includes('budi-santoso')) return 'budi-santoso';
    if (!assignedModels.includes('dimas-pratama')) return 'dimas-pratama';

    const maleIds = ['budi-santoso', 'dimas-pratama', 'joko-hartono'];
    const unassigned = maleIds.find((id) => !assignedModels.includes(id));
    return unassigned || maleIds[assignedModels.length % maleIds.length];
  } else {
    const isGuruOrHR = role.toLowerCase().includes('guru') || role.toLowerCase().includes('hr') || role.toLowerCase().includes('penyiar') || role.toLowerCase().includes('baku');
    const isEmpathic = role.toLowerCase().includes('ramah') || role.toLowerCase().includes('konselor') || role.toLowerCase().includes('cerita');

    if (isGuruOrHR && !assignedModels.includes('siti-rahma')) return 'siti-rahma';
    if (isEmpathic && !assignedModels.includes('ayu-lestari')) return 'ayu-lestari';
    if (!assignedModels.includes('dewi-kusuma')) return 'dewi-kusuma';

    const femaleIds = ['siti-rahma', 'ayu-lestari', 'dewi-kusuma'];
    const unassigned = femaleIds.find((id) => !assignedModels.includes(id));
    return unassigned || femaleIds[assignedModels.length % femaleIds.length];
  }
}

/**
 * Robust Client-Side Heuristic Parser for Indonesian Transcripts
 */
export function analyzeTranscriptHeuristic(
  rawText: string,
  existingSpeakers: Speaker[] = []
): {
  speakers: AnalyzedSpeakerProfile[];
  turns: { speakerName: string; text: string }[];
  title: string;
} {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const rawTurns: { speakerName: string; text: string }[] = [];
  const speakerDialogues: Record<string, string[]> = {};
  const canonicalNamesPool: string[] = [];

  let currentSpeaker = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Clean timestamps: e.g. [00:12], (14:32), 00:05:20
    const cleanLine = line.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, '').trim();

    // Pattern 1: Standard "Name: dialogue" or "**Name**: dialogue"
    const colonMatch = cleanLine.match(/^\*{0,2}([^:\n]{1,40})\*{0,2}\s*[:：]\s*(.+)$/);

    // Pattern 2: Bracketed "[Name] dialogue"
    const bracketMatch = !colonMatch && cleanLine.match(/^\[([^[\]\n]{1,35})\]\s*(.+)$/);

    let extractedName = '';
    let extractedText = '';

    if (colonMatch) {
      const rawCand = colonMatch[1].trim();
      if (!isMetadataLabel(rawCand)) {
        extractedName = cleanSpeakerName(rawCand);
        extractedText = colonMatch[2].trim();
      }
    } else if (bracketMatch) {
      const rawCand = bracketMatch[1].trim();
      if (!isMetadataLabel(rawCand)) {
        extractedName = cleanSpeakerName(rawCand);
        extractedText = bracketMatch[2].trim();
      }
    }

    if (extractedName && extractedText) {
      // Canonicalize name to prevent "Guru (tersenyum)" vs "Guru" vs "Ibu Guru" becoming 3 people
      const canonical = getCanonicalClusterName(extractedName, canonicalNamesPool);
      if (!canonicalNamesPool.includes(canonical)) {
        canonicalNamesPool.push(canonical);
      }

      currentSpeaker = canonical;
      rawTurns.push({ speakerName: currentSpeaker, text: extractedText });
      if (!speakerDialogues[currentSpeaker]) speakerDialogues[currentSpeaker] = [];
      speakerDialogues[currentSpeaker].push(extractedText);
    } else {
      // Continuation of previous turn or skip metadata line
      if (rawTurns.length > 0) {
        // If line is not a metadata block, append to previous dialogue
        if (!isMetadataLabel(cleanLine.split(/[:：]/)[0])) {
          rawTurns[rawTurns.length - 1].text += ' ' + cleanLine;
          if (currentSpeaker && speakerDialogues[currentSpeaker]) {
            const idx = speakerDialogues[currentSpeaker].length - 1;
            speakerDialogues[currentSpeaker][idx] += ' ' + cleanLine;
          }
        }
      }
    }
  }

  // If no turns found, create simple fallback
  if (rawTurns.length === 0) {
    const spk1 = existingSpeakers[0]?.name || 'Pewawancara';
    const spk2 = existingSpeakers[1]?.name || 'Narasumber';
    lines.forEach((l, idx) => {
      const spk = idx % 2 === 0 ? spk1 : spk2;
      rawTurns.push({ speakerName: spk, text: l });
      if (!speakerDialogues[spk]) speakerDialogues[spk] = [];
      speakerDialogues[spk].push(l);
    });
  }

  // Build speaker profiles
  const uniqueNames = Object.keys(speakerDialogues);
  const speakerProfiles: AnalyzedSpeakerProfile[] = [];
  const assignedModels: string[] = [];

  uniqueNames.forEach((name, idx) => {
    const existing = existingSpeakers.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );

    const gender = existing
      ? (INDONESIAN_VOICE_MODELS.find((v) => v.id === existing.voiceModelId)?.gender || inferIndonesianGender(name))
      : inferIndonesianGender(name);

    const role = existing?.role || inferIndonesianRole(name, speakerDialogues[name] || []);
    const voiceModelId = existing?.voiceModelId || selectVoiceModelForProfile(gender, role, assignedModels);
    assignedModels.push(voiceModelId);

    const color = existing?.color || AVATAR_COLORS[idx % AVATAR_COLORS.length];

    speakerProfiles.push({
      name,
      role,
      gender,
      voiceModelId,
      color,
    });
  });

  // Infer title
  let title = 'Wawancara Terimpor';
  if (speakerProfiles.length === 2) {
    title = `Wawancara: ${speakerProfiles[0].name} & ${speakerProfiles[1].name}`;
  } else if (speakerProfiles.length > 2) {
    title = `Diskusi: ${speakerProfiles.map((s) => s.name).join(', ')}`;
  }

  return {
    speakers: speakerProfiles,
    turns: rawTurns,
    title,
  };
}

/**
 * AI-Powered Full Transcript Analyzer with automatic speaker deduplication and consolidation
 */
export async function analyzeTranscriptWithAI(
  rawText: string,
  existingSpeakers: Speaker[] = []
): Promise<{
  speakers: AnalyzedSpeakerProfile[];
  turns: { speakerName: string; text: string }[];
  title: string;
  summary?: string;
  source: 'ai' | 'heuristic';
}> {
  try {
    const response = await fetch('/api/transcript/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawText,
        existingSpeakers: existingSpeakers.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          gender: INDONESIAN_VOICE_MODELS.find((v) => v.id === s.voiceModelId)?.gender || 'male',
          voiceModelId: s.voiceModelId,
        })),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data.turns) && result.data.turns.length > 0) {
        const data = result.data;
        const assignedModels: string[] = [];

        // Deduplicate and canonicalize AI speakers
        const rawAiSpeakers = data.speakers || [];
        const canonicalPool: string[] = [];
        const canonicalSpeakersMap: Record<string, any> = {};

        rawAiSpeakers.forEach((s: any) => {
          const rawName = cleanSpeakerName(s.name || '');
          if (!rawName || isMetadataLabel(rawName)) return;

          const canonical = getCanonicalClusterName(rawName, canonicalPool);
          if (!canonicalPool.includes(canonical)) {
            canonicalPool.push(canonical);
          }
          if (!canonicalSpeakersMap[canonical]) {
            canonicalSpeakersMap[canonical] = {
              ...s,
              name: canonical,
            };
          }
        });

        // Remap turns strictly to canonical entities
        const remappedTurns: { speakerName: string; text: string }[] = [];
        data.turns.forEach((t: any) => {
          const rawSpeaker = cleanSpeakerName(t.speakerName || '');
          if (!rawSpeaker || isMetadataLabel(rawSpeaker)) return;

          const canonical = getCanonicalClusterName(rawSpeaker, canonicalPool);
          if (t.text && t.text.trim()) {
            remappedTurns.push({
              speakerName: canonical,
              text: t.text.trim(),
            });
          }
        });

        const speakerKeys = Object.keys(canonicalSpeakersMap);
        const speakers: AnalyzedSpeakerProfile[] = speakerKeys.map((name, idx) => {
          const s = canonicalSpeakersMap[name];
          const existing = existingSpeakers.find(
            (ex) => ex.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(ex.name.toLowerCase())
          );

          const gender: 'male' | 'female' = existing
            ? (INDONESIAN_VOICE_MODELS.find((v) => v.id === existing.voiceModelId)?.gender || inferIndonesianGender(name))
            : s.gender === 'female'
            ? 'female'
            : inferIndonesianGender(name);

          const validVoice = existing?.voiceModelId || (INDONESIAN_VOICE_MODELS.some((v) => v.id === s.voiceModelId)
            ? s.voiceModelId
            : selectVoiceModelForProfile(gender, s.role || 'Pewawancara', assignedModels));
          assignedModels.push(validVoice);

          return {
            name,
            role: s.role || existing?.role || inferIndonesianRole(name, []),
            gender,
            voiceModelId: validVoice,
            color: existing?.color || AVATAR_COLORS[idx % AVATAR_COLORS.length],
          };
        });

        if (speakers.length > 0 && remappedTurns.length > 0) {
          return {
            title: data.title || 'Wawancara Teranalisa',
            summary: data.summary,
            speakers,
            turns: remappedTurns,
            source: 'ai',
          };
        }
      }
    }
  } catch {
    // Graceful fallback to native contextual heuristic parser
  }

  const fallback = analyzeTranscriptHeuristic(rawText, existingSpeakers);
  return {
    ...fallback,
    source: 'heuristic',
  };
}
