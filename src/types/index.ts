export type Gender = 'male' | 'female';

export interface VoiceModel {
  id: string;
  name: string;
  gender: Gender;
  archetype: string;
  description: string;
  roleRecommendation: string;
  sampleQuote: string;
  avatarColor: string;
  defaultPacing: {
    rate: number;      // 0.5 - 2.0 (1.0 default)
    pitch: number;     // 0.7 - 1.3 (1.0 default)
    pauseAfter: number;// seconds, e.g. 0.4
    volume: number;    // 0.0 - 1.0 (1.0 default)
  };
  geminiVoiceName: string; // 'Fenrir' | 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Aoede'
  speechStyleInstruction: string;
  offlinePitchOffset: number; // for Web Speech API pitch
  offlineRateOffset: number;  // for Web Speech API rate
}

export interface SpeakerPacing {
  rate: number;
  pitch: number;
  pauseAfter: number; // pause in seconds after this speaker finishes a turn
  volume: number;
}

export interface Speaker {
  id: string;
  name: string;
  voiceModelId: string;
  pacing: SpeakerPacing;
  color: string;
  role?: string; // e.g. "Pewawancara / Host" or "Narasumber"
  systemVoiceURI?: string;
}

export interface TranscriptTurn {
  id: string;
  speakerId: string;
  text: string;
  pacingOverride?: Partial<SpeakerPacing>;
  audioBase64?: string;
  audioDuration?: number; // in seconds
  isCloudAudio?: boolean;
  status: 'idle' | 'rendering' | 'ready' | 'error';
  errorMessage?: string;
}

export interface InterviewProject {
  id: string;
  title: string;
  description: string;
  category: 'rekrutmen' | 'podcast' | 'jurnalistik' | 'akademik' | 'panel' | 'kustom';
  speakers: Speaker[];
  turns: TranscriptTurn[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface AudioHistoryItem {
  id: string;
  projectId: string;
  projectTitle: string;
  speakersSummary: string[];
  turnCount: number;
  durationSeconds: number;
  format: 'wav' | 'mp3' | 'webm';
  createdAt: number;
  audioBase64?: string;
  fileSizeFormatted: string;
  tags?: string[];
}

export type TTSMode = 'gemini' | 'offline';

export type ExportFormat = 'wav' | 'mp3' | 'webm' | 'json' | 'srt';

export interface VerboseGenerationLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  requestPayload: any;
  responseStatus: number;
  responseData: any;
  hasAudioOutput: boolean;
  notes?: string;
}

export interface AudioAuditReport {
  isValid: boolean;
  overallScore: number; // 0 - 100
  turnCount: number;
  characterEncoding: {
    status: 'pass' | 'warning' | 'fail';
    issues: string[];
    cleanedTextSample: string;
  };
  languageTagging: {
    status: 'pass' | 'warning' | 'fail';
    detectedLang: string;
    issues: string[];
  };
  apiPayloadStructure: {
    status: 'pass' | 'warning' | 'fail';
    schemaValid: boolean;
    issues: string[];
  };
  audioIntegrity: {
    status: 'pass' | 'warning' | 'fail';
    rmsEnergy?: number;
    sampleRateHz?: number;
    issues: string[];
  };
  suggestedFixes: string[];
  timestamp: string;
}
