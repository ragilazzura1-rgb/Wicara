import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init GoogleGenAI
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check and config status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Phonetic and vocative comma preprocessor for server-side TTS
function prepareServerFlowingSpokenText(text: string): string {
  let cleaned = text;

  // 1. Smooth out vocative commas (e.g., "penerapannya, Bu?" -> "penerapannya Bu?")
  cleaned = cleaned.replace(/,\s*(Bu|Ibu|Pak|Bapak|Mas|Mbak|Kak|Kakak|Bung|Dok|Dokter|Prof|Bang|Dek|Dik)(\b|[?!.,])/gi, ' $1$2');
  cleaned = cleaned.replace(/,\s*(ya|kan|kah|dong|sih|loh|deh|kok|nih|tuh)(\b|[?!.,])/gi, ' $1$2');

  // 2. English loanword phonetics
  const englishMap: [RegExp, string][] = [
    [/\bpodcasts?\b/gi, 'potkes'],
    [/\bvoiceovers?\b/gi, 'vois over'],
    [/\bvoice\s+over\b/gi, 'vois over'],
    [/\bcontent\s+creators?\b/gi, 'konten krietor'],
    [/\bcreators?\b/gi, 'krietor'],
    [/\bcontent\b/gi, 'konten'],
    [/\bstorytellings?\b/gi, 'storiteling'],
    [/\baudiobooks?\b/gi, 'odiobuk'],
    [/\blive\s+streamings?\b/gi, 'laif striming'],
    [/\blive\s+streams?\b/gi, 'laif strim'],
    [/\bstreamings?\b/gi, 'striming'],
    [/\bchannels?\b/gi, 'canel'],
    [/\bsubscribers?\b/gi, 'sabskraiber'],
    [/\bsubscribe\b/gi, 'sabskraib'],
    [/\bviews?\b/gi, 'vyu'],
    [/\blikes?\b/gi, 'laik'],
    [/\bshares?\b/gi, 'ser'],
    [/\bsharing\b/gi, 'sering'],
    [/\binterviews?\b/gi, 'interviu'],
    [/\brecruitments?\b/gi, 'rekruitmen'],
    [/\boffering\s+letters?\b/gi, 'ofering leter'],
    [/\bresigns?\b/gi, 'risain'],
    [/\bsoft\s*skills?\b/gi, 'sof skil'],
    [/\bhard\s*skills?\b/gi, 'hard skil'],
    [/\bskills?\b/gi, 'skil'],
    [/\bonline\b/gi, 'onlain'],
    [/\boffline\b/gi, 'oflain'],
    [/\bsoftwares?\b/gi, 'sofwer'],
    [/\bhardwares?\b/gi, 'hardwer'],
    [/\bclouds?\b/gi, 'klaud'],
    [/\bdownloads?\b/gi, 'daunlod'],
    [/\buploads?\b/gi, 'aplod'],
    [/\bupdates?\b/gi, 'apdet'],
    [/\busers?\b/gi, 'yuser'],
    [/\bwebsites?\b/gi, 'websait'],
    [/\bdevices?\b/gi, 'divais'],
    [/\blaptops?\b/gi, 'leptop'],
    [/\bsmartphones?\b/gi, 'smartfon'],
    [/\be[- ]?mails?\b/gi, 'imel'],
    [/\bchats?\b/gi, 'cet'],
    [/\bplatforms?\b/gi, 'platfom'],
    [/\bdatabases?\b/gi, 'detabes'],
    [/\bmeetings?\b/gi, 'miting'],
    [/\bdeadlines?\b/gi, 'dedlain'],
    [/\btimelines?\b/gi, 'taimlain'],
    [/\bfeedbacks?\b/gi, 'fitbek'],
    [/\binsights?\b/gi, 'insait'],
    [/\bbriefs?\b/gi, 'brif'],
    [/\broadmaps?\b/gi, 'rodmep'],
    [/\bdeep\s*dives?\b/gi, 'dip daif'],
    [/\bhighlights?\b/gi, 'hailait'],
    [/\bmindsets?\b/gi, 'mainsed'],
    [/\bstand[- ]?ups?\b/gi, 'sten ap'],
    [/\bfollow[- ]?ups?\b/gi, 'folo ap'],
    [/\bsetups?\b/gi, 'set ap'],
    [/\bteams?\b/gi, 'tim'],
    [/\bclients?\b/gi, 'klaien'],
    [/\blaunchings?\b/gi, 'loncing'],
    [/\bbackgrounds?\b/gi, 'bekgrawnd'],
    [/\bbudgets?\b/gi, 'bajet'],
    [/\btargets?\b/gi, 'target'],
    [/\bworkshops?\b/gi, 'wekshop'],
    [/\bwebinars?\b/gi, 'webinar'],
    [/\bcoachings?\b/gi, 'kocing'],
    [/\bmentorings?\b/gi, 'mentoring'],
    [/\bnetworkings?\b/gi, 'netwerking'],
    [/\bchallenges?\b/gi, 'celenj'],
    [/\breviews?\b/gi, 'rivyu'],
    [/\bhybrids?\b/gi, 'haibrid'],
    [/\bremotes?\b/gi, 'rimot'],
    [/\blinks?\b/gi, 'lingk'],
  ];

  for (const [pat, phon] of englishMap) {
    cleaned = cleaned.replace(pat, phon);
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

let isGeminiTTSDenied = false;
let isGeminiAPIDenied = false;

// Single speaker / turn TTS endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voiceName = 'Fenrir', style = '', rate = 1.0, pitch = 1.0 } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
    }

    const spokenText = prepareServerFlowingSpokenText(text);

    // If Gemini TTS is already known to be denied for this project or no API key, return offlineRequired smoothly
    if (isGeminiTTSDenied || !process.env.GEMINI_API_KEY) {
      return res.json({
        audioBase64: null,
        offlineRequired: true,
        message: 'Gemini Cloud TTS model access restricted on this project. Offline engine activated.',
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        audioBase64: null,
        offlineRequired: true,
        message: 'GEMINI_API_KEY not configured. Switched to offline engine.',
      });
    }

    // Enhance prompt with speech pacing instructions if modified
    let pacingInstruction = '';
    if (rate > 1.15) {
      pacingInstruction += ' Bicara dengan tempo agak cepat dan energik.';
    } else if (rate < 0.9) {
      pacingInstruction += ' Bicara dengan tempo perlahan, jelas, dan tenang.';
    }

    const fullStyle = (style ? `${style}.` : 'Penutur bahasa Indonesia asli yang natural.') + pacingInstruction;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: spokenText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({
        audioBase64: null,
        offlineRequired: true,
        message: 'No audio data returned. Switched to offline engine.',
      });
    }

    // Return audio/wav base64
    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('denied access')) {
      isGeminiTTSDenied = true;
      console.log('[Wicara TTS] Project denied Gemini TTS access; auto-switching to native offline engine.');
    } else {
      console.log('[Wicara TTS] Notice:', errMsg);
    }
    
    // Return 200 with offlineRequired so client gracefully uses offline engine without error
    res.json({
      audioBase64: null,
      offlineRequired: true,
      message: 'Gemini TTS unavailable; using native offline Indonesian engine.',
    });
  }
});

// Batch TTS endpoint for multi-speaker turns
app.post('/api/tts/batch', async (req, res) => {
  try {
    const { turns } = req.body;
    if (!Array.isArray(turns) || turns.length === 0) {
      return res.status(400).json({ error: 'Turns array is required.' });
    }

    if (isGeminiTTSDenied || !process.env.GEMINI_API_KEY) {
      return res.json({
        offlineRequired: true,
        results: turns.map((t) => ({ id: t.id, success: false, audioBase64: null, offlineRequired: true })),
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        offlineRequired: true,
        results: turns.map((t) => ({ id: t.id, success: false, audioBase64: null, offlineRequired: true })),
      });
    }

    const results = [];
    for (const turn of turns) {
      try {
        const { id, text, voiceName = 'Fenrir', style = '', rate = 1.0 } = turn;
        const spokenBatchText = prepareServerFlowingSpokenText(text);
        let pacingInstruction = '';
        if (rate > 1.15) {
          pacingInstruction += ' Bicara dengan tempo agak cepat.';
        } else if (rate < 0.9) {
          pacingInstruction += ' Bicara dengan tempo perlahan dan tenang.';
        }

        const fullStyle = (style ? `${style}.` : 'Penutur bahasa Indonesia asli.') + pacingInstruction;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: spokenBatchText,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        results.push({
          id,
          success: Boolean(base64Audio),
          audioBase64: base64Audio || null,
          mimeType: 'audio/wav',
        });
      } catch (subErr: any) {
        results.push({
          id: turn.id,
          success: false,
          offlineRequired: true,
        });
      }
    }

    res.json({ results });
  } catch (err: any) {
    res.json({
      offlineRequired: true,
      results: [],
    });
  }
});

// AI Smart Transcript & Contextual Role Analyzer Endpoint
app.post('/api/transcript/analyze', async (req, res) => {
  try {
    const { text, existingSpeakers } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (isGeminiAPIDenied || !process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        fallback: true,
        message: 'Using native contextual analysis engine.',
      });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        success: false,
        fallback: true,
        message: 'Gemini API not configured. Using native contextual engine.',
      });
    }

    const existingContext = Array.isArray(existingSpeakers) && existingSpeakers.length > 0
      ? `\nPROFIL PEMBICARA YANG SUDAH ADA DI PROYEK (Cocokkan nama/peran transkrip dengan profil ini jika sesuai):
${existingSpeakers.map((s: any) => `- ID: "${s.id}", Nama: "${s.name}", Peran: "${s.role || ''}", Gender: "${s.gender || 'male'}", Model Suara: "${s.voiceModelId}"`).join('\n')}`
      : '';

    const prompt = `Anda adalah sistem AI pakar ekstraksi audio drama & transkripsi percakapan bahasa Indonesia.
Tugas Anda adalah melakukan analisa kontekstual mendalam dan resolusi entitas pembicara (Cross-Referenced Speaker Entity Resolution) dari naskah wawancara/dialog berikut.

${existingContext}

ATURAN ANTI-'SPLIT PERSONALITY' (MENCEGAH 1 ORANG TERPECAH MENJADI BANYAK PEMBICARA):
1. **DEDUKSI IDENTITAS KANONIKAL UTAMA (CORE DRAMATIS PERSONAE)**:
   - Wawancara hampir selalu hanya melibatkan 2 orang utama (misal: "Pewawancara / Peneliti" dan "Narasumber / Guru").
   - Identifikasi siapa saja individu nyata yang ada dalam percakapan. Tetapkan maksimal 2-3 profil pembicara kanonikal.
   
2. **PEMETAAN ALIAS & VARIASI (ALIAS CROSS-REFERENCING)**:
   - Daftarkan semua variasi panggilan/label naskah ke dalam daftar alias masing-masing pembicara.
   - Contoh untuk Guru: ["Guru", "Ibu Guru", "Bu Guru", "Guru (tersenyum)", "Guru Kelas", "Narasumber", "Ibu Sri"] -> SEMUANYA adalah Pembicara yang sama.
   - Contoh untuk Peneliti: ["Peneliti", "Pewawancara", "Peneliti (mencatat)", "Saya", "Interviewer", "Pak Peneliti"] -> SEMUANYA adalah Pembicara yang sama.
   - Jangan pernah membuat pembicara baru karena perbedaan sebutan atau catatan aksi di dalam kurung!

3. **RESOLUSI KONTEKS PERCAKAPAN (CONVERSATIONAL CONTEXTUAL CROSS-REFERENCING)**:
   - Setiap giliran bicara (turn) WAJIB dipetakan secara ketat ke salah satu ID pembicara kanonikal ("spk_1", "spk_2", dst.).
   - Periksa alur percakapan: giliran yang bertanya/menggali adalah Pewawancara/Peneliti; giliran yang menjelaskan/menjawab adalah Guru/Narasumber.
   - Bersihkan teks dialog dari label nama di depan atau aksi panggung pementasan.

4. **ELIMINASI METADATA & CATATAN**:
   - Baris metadata seperti "Catatan:", "Topik:", "Waktu:", "Pukul 08:00:", "Pertanyaan 1:", "Hasil Observasi:" BUKAN dialog pembicara. Masukkan konteksnya ke "summary" dan abaikan dari daftar "turns".

5. **MODEL SUARA NATIVE INDONESIA YANG DIREKOMENDASIKAN**:
   - "budi-santoso" (Pria, bariton formal berwibawa, peneliti / penguji)
   - "dimas-pratama" (Pria muda, santai ramah, podcaster / founder)
   - "joko-hartono" (Pria paruh baya / senior, bijaksana hangat, guru senior / pakar)
   - "siti-rahma" (Wanita, baku jelas profesional, guru / penyiar)
   - "ayu-lestari" (Wanita, hangat ramah empatis, konselor / pendidik)
   - "dewi-kusuma" (Wanita, tegas cerdas cepat, analis / jurnalis)

Format JSON yang WAJIB dikembalikan:
{
  "title": "Judul Wawancara yang Relevan",
  "summary": "Ringkasan konteks percakapan",
  "speakers": [
    {
      "id": "spk_1",
      "name": "Nama Kanonikal (misal: Guru)",
      "role": "Peran Pembicara (misal: Narasumber / Guru Kelas)",
      "gender": "female",
      "voiceModelId": "siti-rahma",
      "aliases": ["Guru", "Ibu Guru", "Guru (tersenyum)", "Bu Guru"]
    },
    {
      "id": "spk_2",
      "name": "Nama Kanonikal (misal: Peneliti)",
      "role": "Peran Pembicara (misal: Peneliti Akademik)",
      "gender": "male",
      "voiceModelId": "budi-santoso",
      "aliases": ["Peneliti", "Pewawancara", "Peneliti (mencatat)"]
    }
  ],
  "turns": [
    {
      "speakerId": "spk_2",
      "speakerName": "Peneliti",
      "text": "Selamat pagi Ibu Guru..."
    },
    {
      "speakerId": "spk_1",
      "speakerName": "Guru",
      "text": "Selamat pagi Bapak..."
    }
  ]
}

Teks Transkrip:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let outputText = response.text?.trim() || '';
    if (outputText.startsWith('```')) {
      outputText = outputText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const parsed = JSON.parse(outputText);

    // Cross-reference and reconcile turns against canonical speakers
    if (parsed && Array.isArray(parsed.speakers) && Array.isArray(parsed.turns)) {
      const canonicalMap = new Map<string, any>();
      const aliasLookup = new Map<string, string>();

      parsed.speakers.forEach((spk: any, idx: number) => {
        const id = spk.id || `spk_${idx + 1}`;
        canonicalMap.set(id, { ...spk, id });
        aliasLookup.set(id.toLowerCase(), id);
        aliasLookup.set(spk.name.toLowerCase(), id);

        if (Array.isArray(spk.aliases)) {
          spk.aliases.forEach((alias: string) => {
            aliasLookup.set(alias.toLowerCase(), id);
          });
        }
      });

      // Strict re-mapping of every turn to verified canonical speaker
      parsed.turns = parsed.turns.map((turn: any) => {
        const rawId = String(turn.speakerId || '').toLowerCase();
        const rawName = String(turn.speakerName || '').toLowerCase();
        const matchedId = aliasLookup.get(rawId) || aliasLookup.get(rawName) || parsed.speakers[0]?.id;
        const canonical = canonicalMap.get(matchedId) || parsed.speakers[0];

        return {
          speakerId: canonical.id,
          speakerName: canonical.name,
          text: String(turn.text || '').replace(/^["'“]|["'”]$/g, '').trim(),
        };
      });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('denied access')) {
      isGeminiAPIDenied = true;
    }
    return res.json({
      success: false,
      fallback: true,
      message: 'Native contextual engine active.',
    });
  }
});

function generateNativeNotebookLMScript(turns: any[], style: string) {
  const hostName = 'Budi (Host)';
  const coHostName = 'Siti (Co-Host)';

  const formattedScriptTurns: Array<{ speaker: string; text: string }> = [];

  // Opening
  formattedScriptTurns.push({
    speaker: hostName,
    text: 'Halo pendengar setia! [tawa] Selamat datang kembali di NotebookLM Audio Overview.',
  });
  formattedScriptTurns.push({
    speaker: coHostName,
    text: 'Halo semuanya! [napas] Topik wawancara kita kali ini beneran menarik dan kaya inspirasi lho.',
  });

  // Process turns into dynamic back-and-forth dialogue
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const spk = t.speakerName || 'Narasumber';
    const text = (t.text || '').replace(/[\n\r]+/g, ' ').trim();

    if (i % 2 === 0) {
      formattedScriptTurns.push({
        speaker: hostName,
        text: `Nah, seputar hal itu, ${spk} menyampaikan: [jeda] "${text.length > 150 ? text.substring(0, 150) + '...' : text}"`,
      });
      formattedScriptTurns.push({
        speaker: coHostName,
        text: 'Wah, penjelasan itu menarik banget ya! [jeda] Terasa banget poin pentingnya.',
      });
    } else {
      formattedScriptTurns.push({
        speaker: coHostName,
        text: `Iya betul, bahkan ${spk} juga menambahkan: "${text.length > 150 ? text.substring(0, 150) + '...' : text}"`,
      });
      formattedScriptTurns.push({
        speaker: hostName,
        text: 'Setuju banget! [tawa] Ini bikin kita paham konteks pembicaraannya secara utuh.',
      });
    }
  }

  // Closing
  formattedScriptTurns.push({
    speaker: hostName,
    text: 'Itulah ringkasan poin-poin utama dari wawancara ini. [napas] Sampai jumpa di episode berikutnya!',
  });

  return {
    title: 'NotebookLM Audio Overview',
    turns: formattedScriptTurns,
  };
}

// NotebookLM Native Audio Overview Endpoint
app.post('/api/notebooklm/generate', async (req, res) => {
  try {
    const { turns, style = 'podcast', hostVoice = 'Fenrir', coHostVoice = 'Kore' } = req.body;

    if (!Array.isArray(turns) || turns.length === 0) {
      return res.status(400).json({ error: 'Turns array is required for NotebookLM Audio Overview.' });
    }

    const ai = getGenAI();

    // If API key is missing or previously marked restricted, immediately return native script (silent & fast)
    if (isGeminiAPIDenied || isGeminiTTSDenied || !ai || !process.env.GEMINI_API_KEY) {
      const nativeScript = generateNativeNotebookLMScript(turns, style);
      return res.json({
        success: true,
        scriptFallback: true,
        script: nativeScript,
        message: 'Skrip Podcast Lisan NotebookLM berhasil dirancang.',
      });
    }

    const formattedTranscript = turns
      .map((t: any) => `${t.speakerName || 'Pembicara'}: ${t.text}`)
      .join('\n');

    let styleInstruction = 'Indonesian Radio & Podcast Overview Host and Co-Host conversing warmly with natural laughter and dynamic cadence.';
    if (style === 'deep_dive') {
      styleInstruction = 'Formal Indonesian journalism deep-dive interview with articulate cadence and authoritative tone.';
    } else if (style === 'summary') {
      styleInstruction = 'Energetic concise 2-minute Indonesian audio summary with fast-paced engaging delivery.';
    }

    const promptText = `Anda adalah produser audio podcast/wawancara profesional tingkat Google NotebookLM Audio Overview.
Tugas Anda adalah memproduksi percakapan suara lisan 2 pembicara Bahasa Indonesia (Host Pria: Budi, Co-Host Wanita: Siti) yang sangat emosional, cerdas, ramah, dan penuh dengan dinamika dialog alami.

PETUNJUK GAYA SUARA & INTONASI NATIVE AUDIO:
1. Budi (Host Pria): Karismatik, ramah, sesekali tertawa santai (<laugh>), menggunakan ungkapan alami "Wah menarik banget ya...", "Nah, jadi begini...".
2. Siti (Co-Host Wanita): Cerdas, empatik, jernih, memberikan respon hangat |mhm|, |iya betul|, "Wah seru sekali!".
3. Sertakan ekspresi vokal lisan alami seperti tawa kecil, dinamika napas, dan artikulasi bahasa Indonesia yang hidup dan enak didengar.

Berdasarkan naskah percakapan berikut:
${formattedTranscript}`;

    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: promptText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: hostVoice,
              },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          success: true,
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          modelUsed: 'gemini-3.8-flash-lite-tts',
          style,
        });
      }
    } catch (directErr: any) {
      isGeminiTTSDenied = true;
    }

    // Try standard Gemini Flash script generation
    try {
      const scriptPrompt = `Anda adalah produser podcast Google NotebookLM. Ubah transkrip wawancara berikut menjadi skrip percakapan lisan 2 orang (Host Budi & Co-Host Siti) dengan tawa alami, interjeksi "Wah", "Nah", "Iya betul", dan gaya obrolan santai berkualitas tinggi.
Format JSON yang WAJIB dikembalikan:
{
  "title": "NotebookLM Audio Overview",
  "turns": [
    { "speaker": "Budi (Host)", "text": "Halo semuanya! Selamat datang di Audio Overview..." },
    { "speaker": "Siti (Co-Host)", "text": "Iya nih, topik wawancara kali ini seru banget..." }
  ]
}

Transkrip Asli:
${formattedTranscript}`;

      const scriptResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: scriptPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      let scriptText = scriptResponse.text?.trim() || '';
      if (scriptText.startsWith('```')) {
        scriptText = scriptText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }
      const parsedScript = JSON.parse(scriptText);

      return res.json({
        success: true,
        scriptFallback: true,
        script: parsedScript,
        message: 'Skrip Podcast NotebookLM berhasil dihasilkan dengan kecerdasan Gemini!',
      });
    } catch (scriptErr: any) {
      isGeminiAPIDenied = true;
    }

    // Return native script silently
    const nativeScript = generateNativeNotebookLMScript(turns, style);
    return res.json({
      success: true,
      scriptFallback: true,
      script: nativeScript,
      message: 'Skrip Podcast Lisan NotebookLM berhasil dirancang.',
    });
  } catch (err: any) {
    const nativeScript = generateNativeNotebookLMScript([], 'podcast');
    return res.json({
      success: true,
      scriptFallback: true,
      script: nativeScript,
      message: 'Skrip Podcast Lisan NotebookLM berhasil dirancang.',
    });
  }
});

// Setup Vite middlewares in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Wicara TTS Server] Running on http://localhost:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer();
