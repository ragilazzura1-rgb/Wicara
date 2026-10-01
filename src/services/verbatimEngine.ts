import { TranscriptTurn } from '../types';

/**
 * Normalizes punctuation, Indonesian abbreviations, loanwords, and numbers
 * into phonetically readable Indonesian, eliminating awkward delays and mispronunciations.
 */
export function normalizeIndonesianPhonetics(text: string): string {
  let normalized = text;

  // 1. Indonesian Written Short Abbreviation Formats (Chat, Transcripts, Business Documents)
  const indonesianShortAbbrMap: [RegExp, string][] = [
    // Slashes and formal abbreviation connectors
    [/\bs\/d\b|\bs\.d\.\b/gi, 'sampai dengan'],
    [/\ba\/n\b|\ba\.n\.\b/gi, 'atas nama'],
    [/\bd\/a\b|\bd\.a\.\b/gi, 'dengan alamat'],
    [/\bu\/p\b|\bu\.p\.\b/gi, 'untuk perhatian'],
    [/\bdan\/atau\b/gi, 'dan atau'],
    [/\bc\/o\b/gi, 'care of'],
    [/\bw\/\b/gi, 'dengan'],
    [/\bw\/o\b/gi, 'tanpa'],

    // Common informal & transcript chat abbreviations
    [/\byg\.?\b/gi, 'yang'],
    [/\bdgn\.?\b/gi, 'dengan'],
    [/\butk\.?\b/gi, 'untuk'],
    [/\bkrn\.?\b/gi, 'karena'],
    [/\bsdh\.?\b/gi, 'sudah'],
    [/\bblm\.?\b/gi, 'belum'],
    [/\btdk\.?\b/gi, 'tidak'],
    [/\bgak\.?\b|\bgk\.?\b|\bngga\.?\b/gi, 'nggak'],
    [/\bbkn\.?\b/gi, 'bukan'],
    [/\bgmn\.?\b/gi, 'gimana'],
    [/\bbgt\.?\b/gi, 'banget'],
    [/\bbbrp\.?\b/gi, 'beberapa'],
    [/\bthd\.?\b/gi, 'terhadap'],
    [/\btsb\.?\b/gi, 'tersebut'],
    [/\bthn\.?\b/gi, 'tahun'],
    [/\bbln\.?\b/gi, 'bulan'],
    [/\btgl\.?\b/gi, 'tanggal'],
    [/\borg\.?\b/gi, 'orang'],
    [/\bdkk\.?\b/gi, 'dan kawan-kawan'],
    [/\bdll\.?\b/gi, 'dan lain-lain'],
    [/\bdsb\.?\b/gi, 'dan sebagainya'],
    [/\bdst\.?\b/gi, 'dan seterusnya'],
    [/\byth\.?\b/gi, 'yang terhormat'],
    [/\bno\.?\b/gi, 'nomor'],
    [/\bhal\.?\b/gi, 'halaman'],
    [/\bjln?\.?\b/gi, 'jalan'],
    [/\brt\.?\b/gi, 'R-T'],
    [/\brw\.?\b/gi, 'R-W'],
    [/\bkab\.?\b/gi, 'kabupaten'],
    [/\bkec\.?\b/gi, 'kecamatan'],
    [/\bkel\.?\b/gi, 'kelurahan'],
    [/\bprov\.?\b/gi, 'provinsi'],
    [/\bdrg\.?\b/gi, 'dokter gigi'],
    [/\bdr\.?\b/gi, 'dokter'],
    [/\bprof\.?\b/gi, 'profesor'],
    [/\btn\.?\b/gi, 'tuan'],
    [/\bny\.?\b/gi, 'nyonya'],
    [/\bnn\.?\b/gi, 'nona'],
    [/\bust\.?\b|\bustadz\.?\b/gi, 'ustaz'],
    [/\bpt\.?\b/gi, 'Perseroan Terbatas'],
    [/\bcv\.?\b/gi, 'si-vi'],
    [/\btbk\.?\b/gi, 'Terbuka'],
  ];

  for (const [pattern, expanded] of indonesianShortAbbrMap) {
    normalized = normalized.replace(pattern, expanded);
  }

  // 2. Reduplication with numeral 2 (e.g. kata2 -> kata-kata, teman2 -> teman-teman)
  normalized = normalized.replace(/\b([a-zA-Z]{2,})2\b/g, '$1-$1');

  // 3. Currency: Rp 50.000 / Rp. 1.500.000 / Rp50rb / Rp 2,5 juta
  normalized = normalized.replace(/Rp\.?\s*(\d+(?:\.\d+)*)(?:\s*(rb|ribu|jt|juta))?/gi, (_, amount, unit) => {
    const cleanAmount = amount.replace(/\./g, '');
    const num = parseInt(cleanAmount, 10);
    let spokenAmount = cleanAmount;

    if (unit) {
      const u = unit.toLowerCase();
      if (u.startsWith('rb') || u.startsWith('ribu')) {
        spokenAmount = `${num} ribu`;
      } else if (u.startsWith('jt') || u.startsWith('juta')) {
        spokenAmount = `${num} juta`;
      }
    } else if (num >= 1000000) {
      const jt = Math.floor(num / 1000000);
      const sisa = num % 1000000;
      spokenAmount = sisa > 0 ? `${jt} juta ${Math.floor(sisa / 1000)} ribu` : `${jt} juta`;
    } else if (num >= 1000) {
      const rb = Math.floor(num / 1000);
      const sisa = num % 1000;
      spokenAmount = sisa > 0 ? `${rb} ribu ${sisa}` : `${rb} ribu`;
    }

    return `${spokenAmount} rupiah `;
  });

  // 4. English Tech, Business, and Media Loanwords -> Indonesian Phonetic Transliterations
  const englishLoanwordsMap: [RegExp, string][] = [
    // Audio, Media & Content
    [/\bpodcasts?\b/gi, 'potkes'],
    [/\bvoiceovers?\b/gi, 'vois over'],
    [/\bvoice\s+over\b/gi, 'vois over'],
    [/\bshowcase\b/gi, 'sokes'],
    [/\bbroadcasts?\b/gi, 'brodkas'],
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
    [/\bviewers?\b/gi, 'vyuer'],
    [/\bviews?\b/gi, 'vyu'],
    [/\blikes?\b/gi, 'laik'],
    [/\bshares?\b/gi, 'ser'],
    [/\bsharing\b/gi, 'sering'],
    [/\bhost\b/gi, 'hos'],
    [/\bco[- ]?hosts?\b/gi, 'ko-hos'],
    [/\bguests?\b/gi, 'ges'],

    // Interview & Hiring
    [/\binterviews?\b/gi, 'interviu'],
    [/\binterviewers?\b/gi, 'interviuer'],
    [/\binterviewees?\b/gi, 'interviui'],
    [/\brecruitments?\b/gi, 'rekruitmen'],
    [/\bheadhunters?\b/gi, 'hedhanter'],
    [/\boffering\s+letters?\b/gi, 'ofering leter'],
    [/\bofferings?\b/gi, 'ofering'],
    [/\boffers?\b/gi, 'ofer'],
    [/\bonboardings?\b/gi, 'onbording'],
    [/\boffboardings?\b/gi, 'ofbording'],
    [/\bresigns?\b/gi, 'risain'],
    [/\bresignations?\b/gi, 'risignesyen'],
    [/\bsoft\s*skills?\b/gi, 'sof skil'],
    [/\bhard\s*skills?\b/gi, 'hard skil'],
    [/\bskills?\b/gi, 'skil'],
    [/\bjobdesk\b/gi, 'jobdes'],
    [/\bjob\s*desks?\b/gi, 'jobdes'],
    [/\bjob\s*descriptions?\b/gi, 'job deskripsen'],
    [/\buser\s*interviews?\b/gi, 'yuser interviu'],

    // Tech & Computing
    [/\bonline\b/gi, 'onlain'],
    [/\boffline\b/gi, 'oflain'],
    [/\bsoftwares?\b/gi, 'sofwer'],
    [/\bhardwares?\b/gi, 'hardwer'],
    [/\bclouds?\b/gi, 'klaud'],
    [/\bdownloads?\b/gi, 'daunlod'],
    [/\bdownloadings?\b/gi, 'daunloding'],
    [/\buploads?\b/gi, 'aplod'],
    [/\buploadings?\b/gi, 'aploding'],
    [/\bupdates?\b/gi, 'apdet'],
    [/\bupdatings?\b/gi, 'apdeting'],
    [/\bupgraded?\b/gi, 'apgred'],
    [/\bupgrades?\b/gi, 'apgred'],
    [/\bupgradings?\b/gi, 'apgreding'],
    [/\busers?\b/gi, 'yuser'],
    [/\bwebsites?\b/gi, 'websait'],
    [/\bsites?\b/gi, 'sait'],
    [/\bdevices?\b/gi, 'divais'],
    [/\blaptops?\b/gi, 'leptop'],
    [/\bsmartphones?\b/gi, 'smartfon'],
    [/\bhandphones?\b/gi, 'henfon'],
    [/\be[- ]?mails?\b/gi, 'imel'],
    [/\bchatting\b/gi, 'ceting'],
    [/\bchats?\b/gi, 'cet'],
    [/\blogins?\b/gi, 'login'],
    [/\blogouts?\b/gi, 'logaut'],
    [/\bsign[- ]?in\b/gi, 'sain in'],
    [/\bsign[- ]?up\b/gi, 'sain ap'],
    [/\bpasswords?\b/gi, 'paswerd'],
    [/\baccounts?\b/gi, 'akaun'],
    [/\bplatforms?\b/gi, 'platfom'],
    [/\bdatabases?\b/gi, 'detabes'],
    [/\bfront[- ]?ends?\b/gi, 'front en'],
    [/\bback[- ]?ends?\b/gi, 'bek en'],
    [/\bfull[- ]?stacks?\b/gi, 'ful stek'],
    [/\bdevelopers?\b/gi, 'diveloper'],
    [/\bengineers?\b/gi, 'enjiner'],
    [/\bfeatures?\b/gi, 'ficer'],
    [/\btools?\b/gi, 'tuls'],
    [/\bframeworks?\b/gi, 'fremwek'],
    [/\bworkflows?\b/gi, 'wekflo'],
    [/\bcode\s*reviews?\b/gi, 'kod rivyu'],
    [/\bdeploy(ment)?s?\b/gi, 'deploi'],
    [/\bbackup(s)?\b/gi, 'bekap'],
    [/\bbugs?\b/gi, 'bag'],
    [/\bissues?\b/gi, 'isyu'],

    // Work, Business & Agility
    [/\bmeetings?\b/gi, 'miting'],
    [/\bdeadlines?\b/gi, 'dedlain'],
    [/\btimelines?\b/gi, 'taimlain'],
    [/\bfeedbacks?\b/gi, 'fitbek'],
    [/\binsights?\b/gi, 'insait'],
    [/\bbriefs?\b/gi, 'brif'],
    [/\bbenchmarks?\b/gi, 'bencmark'],
    [/\broadmaps?\b/gi, 'rodmep'],
    [/\bdeep\s*dives?\b/gi, 'dip daif'],
    [/\bhighlights?\b/gi, 'hailait'],
    [/\bkey\s*takeaways?\b/gi, 'ki tekawei'],
    [/\bmindsets?\b/gi, 'mainsed'],
    [/\bjourneys?\b/gi, 'jerni'],
    [/\bpitchings?\b/gi, 'picing'],
    [/\bpitches?\b/gi, 'pic'],
    [/\bstand[- ]?ups?\b/gi, 'sten ap'],
    [/\bfollow[- ]?ups?\b/gi, 'folo ap'],
    [/\bsetups?\b/gi, 'set ap'],
    [/\bset[- ]ups?\b/gi, 'set ap'],
    [/\bteam\s*leaders?\b/gi, 'tim lider'],
    [/\bleaders?\b/gi, 'lider'],
    [/\bteams?\b/gi, 'tim'],
    [/\bclients?\b/gi, 'klaien'],
    [/\blaunchings?\b/gi, 'loncing'],
    [/\blaunchs?\b/gi, 'lonc'],
    [/\bbackgrounds?\b/gi, 'bekgrawnd'],
    [/\bbrainstormings?\b/gi, 'bren storming'],
    [/\bbudgets?\b/gi, 'bajet'],
    [/\btargets?\b/gi, 'target'],
    [/\btemplates?\b/gi, 'templet'],
    [/\bchecklists?\b/gi, 'ceklist'],
    [/\bworkshops?\b/gi, 'wekshop'],
    [/\bwebinars?\b/gi, 'webinar'],
    [/\bcoachings?\b/gi, 'kocing'],
    [/\bmentorings?\b/gi, 'mentoring'],
    [/\bnetworkings?\b/gi, 'netwerking'],
    [/\bchallenges?\b/gi, 'celenj'],
    [/\bperformances?\b/gi, 'performans'],
    [/\breviews?\b/gi, 'rivyu'],
    [/\bresearches?\b/gi, 'riset'],
    [/\bsurveys?\b/gi, 'servei'],
    [/\bhybrids?\b/gi, 'haibrid'],
    [/\bremotes?\b/gi, 'rimot'],
    [/\blinks?\b/gi, 'lingk'],
    [/\bbest\s*practices?\b/gi, 'bes praktis'],
    [/\bcase\s*stud(y|ies)\b/gi, 'kes stadi'],
    [/\brule\s*of\s*thumb\b/gi, 'rul of tam'],
  ];

  for (const [pattern, phonetic] of englishLoanwordsMap) {
    normalized = normalized.replace(pattern, phonetic);
  }

  // 5. Common Indonesian Acronyms
  const acronymMap: Record<string, string> = {
    '\\bAI\\b': 'e-ai',
    '\\bGenAI\\b': 'jen-e-ai',
    '\\bUI/UX\\b': 'yu-ai yu-eks',
    '\\bUI\\b': 'yu-ai',
    '\\bUX\\b': 'yu-eks',
    '\\bHRD\\b': 'ha-er-de',
    '\\bHR\\b': 'ha-er',
    '\\bCEO\\b': 'si-i-o',
    '\\bCTO\\b': 'si-ti-o',
    '\\bCOO\\b': 'si-o-o',
    '\\bCFO\\b': 'si-ef-o',
    '\\bCMO\\b': 'si-em-o',
    '\\bIT\\b': 'ai-ti',
    '\\bSOP\\b': 'es-o-pe',
    '\\bKPI\\b': 'ka-pe-i',
    '\\bOKRs?\\b': 'o-ka-er',
    '\\bB2B\\b': 'bi tu bi',
    '\\bB2C\\b': 'bi tu si',
    '\\bUMKM\\b': 'u-em-ka-em',
    '\\bKTP\\b': 'ka-te-pe',
    '\\bBPJS\\b': 'be-pe-je-es',
    '\\bSDM\\b': 'es-de-em',
    '\\bPNS\\b': 'pe-en-es',
    '\\bASN\\b': 'a-es-en',
    '\\bBUMN\\b': 'be-u-em-en',
    '\\bAPBN\\b': 'a-pe-be-en',
    '\\bAPBD\\b': 'a-pe-be-de',
    '\\bPPN\\b': 'pe-pe-en',
    '\\bPPh\\b': 'pe-pe-ha',
    '\\bUU\\b': 'Undang-Undang',
    '\\bUUD\\b': 'U-U-D',
    '\\bQA\\b': 'kiu-e',
    '\\bQC\\b': 'kiu-si',
    '\\bMVP\\b': 'em-vi-pi',
    '\\bFGD\\b': 'ef-ji-di',
    '\\bAPI\\b': 'a-pi-ai',
    '\\bTTS\\b': 'ti-ti-es',
    '\\bSRT\\b': 'es-er-te',
    '\\bWAV\\b': 'wav',
    '\\bMP3\\b': 'em-pi-tri',
  };

  for (const [pattern, phonetic] of Object.entries(acronymMap)) {
    normalized = normalized.replace(new RegExp(pattern, 'gi'), phonetic);
  }

  // 6. Percentage: 85% -> 85 persen
  normalized = normalized.replace(/(\d+)\s*%/g, '$1 persen');

  // 7. Time: 08.00 WIB / 14:30 WITA
  normalized = normalized.replace(/(\d{1,2})[.:](\d{2})\s*(WIB|WITA|WIT)?/gi, (_, h, m, tz) => {
    const zone = tz ? ` ${tz.toUpperCase().split('').join('-')}` : '';
    if (m === '00') return `pukul ${h}${zone}`;
    return `pukul ${h} lewat ${m} menit${zone}`;
  });

  // 8. Years: 2020-2035 spoken conversion
  normalized = normalized.replace(/\b202([0-9])\b/g, 'dua ribu dua puluh $1');
  normalized = normalized.replace(/\b203([0-9])\b/g, 'dua ribu tiga puluh $1');

  // 9. Ordinal numbers: ke-1, ke-2, ke-3, dst
  normalized = normalized.replace(/\bke-1\b/gi, 'kesatu');
  normalized = normalized.replace(/\bke-2\b/gi, 'kedua');
  normalized = normalized.replace(/\bke-3\b/gi, 'ketiga');
  normalized = normalized.replace(/\bke-4\b/gi, 'keempat');
  normalized = normalized.replace(/\bke-5\b/gi, 'kelima');
  normalized = normalized.replace(/\bke-(\d+)\b/gi, (_, n) => `ke-${n}`);

  return normalized;
}

/**
 * NotebookLM-Style Flowing Spoken Text Preprocessor:
 * 1. Resolves comma vocatives (e.g., "penerapannya, Bu?" -> "penerapannya Bu?") so speech flows seamlessly without jarring staccato pauses.
 * 2. Normalizes punctuation marks (semicolons, quotes, slashes) into natural flowing transitions.
 * 3. Expands Indonesian abbreviations and transliterates English loanwords.
 */
export function prepareFlowingSpokenText(text: string): string {
  let cleaned = normalizeIndonesianPhonetics(text);

  // 1. Remove commas before vocatives/honorifics and short conversational particles
  // In Indonesian dialogue, honorifics (Bu, Pak, Mas, Mbak) and particles (ya, kan, dong, sih)
  // are pronounced in one continuous intonational contour.
  cleaned = cleaned.replace(/,\s*(Bu|Ibu|Pak|Bapak|Mas|Mbak|Kak|Kakak|Bung|Dok|Dokter|Prof|Bang|Dek|Dik)(\b|[?!.,])/gi, ' $1$2');
  cleaned = cleaned.replace(/,\s*(ya|kan|kah|dong|sih|loh|deh|kok|nih|tuh|yuk)(\b|[?!.,])/gi, ' $1$2');
  cleaned = cleaned.replace(/,\s*(dan|atau|tapi|lalu|terus|maka|sehingga)\b/gi, ' $1');

  // 2. Strip quotation marks & quotes which cause artificial speech hesitation
  cleaned = cleaned.replace(/["'“”«»]/g, '');

  // 3. Semicolons and colons: convert to gentle comma or period
  cleaned = cleaned.replace(/;\s*/g, ', ');
  cleaned = cleaned.replace(/:\s*/g, ', ');

  // 4. Convert verbatim markers into natural spoken transitions:
  cleaned = cleaned.replace(/([^,;.!?\n])\s*\[napas\]/gi, '$1,');
  cleaned = cleaned.replace(/\[napas\]|\(napas\)/gi, ' ');
  cleaned = cleaned.replace(/\[jeda\]|\(jeda\)/gi, '...');
  cleaned = cleaned.replace(/\[hmm\]|\[mmm\]/gi, 'Mmm, ');
  cleaned = cleaned.replace(/\[ya\]/gi, 'Ya, ');
  cleaned = cleaned.replace(/\[ehem\]/gi, 'Ehm, ');
  cleaned = cleaned.replace(/\[tertawa\]|\(tertawa\)|\[senyum\]|\(tersenyum\)/gi, '');

  // 5. Clean up redundant punctuation (e.g., ", ," -> ", ", "... ..." -> "...", ", ." -> ".")
  cleaned = cleaned.replace(/,\s*,+/g, ',');
  cleaned = cleaned.replace(/\.{4,}/g, '...');
  cleaned = cleaned.replace(/,\s*\./g, '.');
  cleaned = cleaned.replace(/,\s*\?/g, '?');
  cleaned = cleaned.replace(/,\s*!/g, '!');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export type VerbatimStyle = 'podcast' | 'formal' | 'investigative' | 'naturalizer';

/**
 * NotebookLM-Inspired Conversational Dialogue Enricher:
 * Adds conversational warmth, collaborative podcast pacing, and natural discourse
 * markers rather than awkward robotic silence breaks.
 */
export function autoEnrichVerbatim(
  turns: TranscriptTurn[],
  style: VerbatimStyle = 'podcast'
): TranscriptTurn[] {
  return turns.map((turn, index) => {
    let enriched = turn.text.trim();

    // Clean any old raw pause tags that might have caused stutters
    enriched = enriched.replace(/\[napas\]/gi, ',');
    enriched = enriched.replace(/\[jeda\]/gi, '...');
    enriched = enriched.replace(/,\s*,+/g, ',');

    if (style === 'podcast') {
      // Natural conversational podcast banter:
      // Turn 0: warm opener if not present
      if (index === 0 && !enriched.startsWith('Halo') && !enriched.startsWith('Selamat')) {
        enriched = 'Halo rekan-rekan, ' + enriched;
      }
      // Odd turns (answers / responses): conversational bridges
      else if (index % 2 === 1 && !enriched.startsWith('Ya') && !enriched.startsWith('Betul') && !enriched.startsWith('Mmm') && !enriched.startsWith('Nah')) {
        const connectors = ['Ya, betul sekali. ', 'Nah, jadi begini... ', 'Menarik sekali pertanyaannya. '];
        enriched = connectors[index % connectors.length] + enriched;
      }
    } else if (style === 'formal') {
      // Professional interview: clear punctuation and polite transitions
      if (index === 0 && !enriched.startsWith('Selamat') && !enriched.startsWith('Terima kasih')) {
        enriched = 'Selamat siang, ' + enriched;
      }
    } else if (style === 'investigative') {
      // Thoughtful investigative dialogue
      if (index % 2 === 1) {
        enriched = enriched.replace(/\.\s+(Namun|Tetapi|Sebenarnya)\b/g, '... Namun');
      }
    }

    return {
      ...turn,
      text: enriched,
      audioBase64: undefined, // invalidate cache so new flowing audio plays
      status: 'idle',
    };
  });
}

/**
 * Returns a comparison of text before and after verbatim enhancement for preview demos
 */
export function getVerbatimComparison(): {
  rawSample: string;
  verbatimSample: string;
  explanation: string;
} {
  return {
    rawSample:
      'Lalu soal penerapannya, Bu? s/d tgl 1 Okt 2026, bgmn podcast & live streaming kita, ya?',
    verbatimSample:
      'Lalu soal penerapannya Bu? sampai dengan tanggal 1 Oktober 2026, bagaimana potkes dan laif striming kita ya?',
    explanation:
      'Terinspirasi dari arsitektur audio NotebookLM: singkatan informal (s/d, tgl, bgmn) diuraikan lancar, koma sebelum sebutan subjek/partikel dihilangkan agar intonasi bersambung, dan istilah asing dilafalkan dengan fonetik Indonesia alami.',
  };
}
