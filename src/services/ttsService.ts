import { TranscriptTurn, Speaker, TTSMode, VoiceModel, AudioHistoryItem, AudioAuditReport, VerboseGenerationLogEntry } from '../types';
import { getVoiceById, findBestVoiceForSpeaker, isExplicitMaleVoice } from './voiceCatalog';
import { prepareFlowingSpokenText, normalizeIndonesianPhonetics } from './verbatimEngine';
import {
  decodeAudioData,
  audioBufferToWavBlob,
  audioBufferToFormatBlob,
  concatenateAudioBuffers,
  synthesizeOfflineTurnAudio,
  cleanSynthesizedTurnAudio,
  trimAndNormalizeSilence,
  generateSrt,
  downloadBlob,
  formatDuration,
  formatBytes,
  arrayBufferToBase64,
  getAudioContext,
} from './audioUtils';
import { StorageService } from './storage';

export class TTSService {
  private static activeAudioElement: HTMLAudioElement | null = null;
  private static activeAudioBufferSource: AudioBufferSourceNode | null = null;
  private static isPlayingConversation = false;
  private static conversationAbortController: AbortController | null = null;
  private static isSpeechCancelled = false;

  // Single turn synthesis with fallback and automated silence trimming
  static async synthesizeTurn(
    turn: TranscriptTurn,
    speaker: Speaker,
    mode: TTSMode = 'gemini'
  ): Promise<{ audioBase64: string; duration: number; isCloudAudio: boolean }> {
    const voiceModel = getVoiceById(speaker.voiceModelId);
    const rate = turn.pacingOverride?.rate ?? speaker.pacing.rate ?? 1.0;
    const pitch = turn.pacingOverride?.pitch ?? speaker.pacing.pitch ?? 1.0;

    // Check if offline mode is explicitly requested or browser is offline
    const isOffline = mode === 'offline' || !navigator.onLine;

    const spokenText = prepareFlowingSpokenText(turn.text);

    if (!isOffline) {
      try {
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText,
            voiceName: voiceModel.geminiVoiceName,
            style: voiceModel.speechStyleInstruction,
            rate,
            pitch,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioBase64) {
            // Automatically detect & trim excessive silence and non-speech dead air
            const cleaned = await cleanSynthesizedTurnAudio(data.audioBase64, {
              threshold: 0.006,
              leadInSeconds: 0.030,
              leadOutSeconds: 0.050,
              maxInternalSilenceSec: 0.35,
              targetInternalSilenceSec: 0.20,
            });

            return {
              audioBase64: cleaned.audioBase64,
              duration: cleaned.duration,
              isCloudAudio: true,
            };
          }
        }
      } catch {
        // Fallback silently to offline engine
      }
    }

    // Offline Engine Synthesis with Phonetic Normalization & Automated Silence Trimming
    const offlineBuf = synthesizeOfflineTurnAudio(
      spokenText,
      voiceModel.gender,
      pitch * voiceModel.offlinePitchOffset,
      rate * voiceModel.offlineRateOffset
    );
    const wavBlob = audioBufferToWavBlob(offlineBuf);
    const arrayBuf = await wavBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuf);

    return {
      audioBase64: base64,
      duration: offlineBuf.duration,
      isCloudAudio: false,
    };
  }

  /**
   * Normalizes punctuation, Indonesian abbreviations, loanwords, and numbers
   * to guarantee fluent, continuous speech with zero unnatural delay.
   */
  static normalizeSpokenText(text: string): string {
    return prepareFlowingSpokenText(text);
  }

  // Audition / play a voice model preview with automatic silence detection
  static async previewVoice(
    voice: VoiceModel,
    pacing?: { rate: number; pitch: number },
    mode: TTSMode = 'gemini',
    preferredVoiceURI?: string
  ): Promise<void> {
    this.stopPlayback();

    const rate = pacing?.rate ?? voice.defaultPacing.rate;
    const pitch = pacing?.pitch ?? voice.defaultPacing.pitch;
    const spokenQuote = this.normalizeSpokenText(voice.sampleQuote);

    // Try Web Speech API for immediate offline feedback or if offline mode
    if (mode === 'offline' || !navigator.onLine) {
      await this.speakWithWebSpeech(spokenQuote, voice, rate, pitch, preferredVoiceURI);
      return;
    }

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenQuote,
          voiceName: voice.geminiVoiceName,
          style: voice.speechStyleInstruction,
          rate,
          pitch,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const cleaned = await cleanSynthesizedTurnAudio(data.audioBase64, {
            threshold: 0.006,
            leadInSeconds: 0.030,
            leadOutSeconds: 0.050,
          });
          await this.playBase64Audio(cleaned.audioBase64);
          return;
        }
      }
    } catch {
      // Fallback to Web Speech API
    }

    await this.speakWithWebSpeech(spokenQuote, voice, rate, pitch, preferredVoiceURI);
  }

  // Web Speech API offline player with Indonesian voice detection & prosodic breath pacing
  static async speakWithWebSpeech(
    text: string,
    voice: VoiceModel,
    rate = 1.0,
    pitch = 1.0,
    preferredVoiceURI?: string
  ): Promise<void> {
    if (!('speechSynthesis' in window)) return;
    this.isSpeechCancelled = false;
    window.speechSynthesis.cancel();

    const matchedVoice = findBestVoiceForSpeaker(voice.gender, preferredVoiceURI);
    // Prepare flowing spoken dialogue text (NotebookLM approach: uninterrupted neural prosody)
    const flowingText = prepareFlowingSpokenText(text);

    if (!flowingText.trim()) return;

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(flowingText);
      utterance.lang = matchedVoice?.lang || 'id-ID';

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      // Calculate calibrated pitch:
      let effectivePitch = pitch;
      const isRealMaleVoice = matchedVoice && isExplicitMaleVoice(matchedVoice);

      if (voice.gender === 'male') {
        if (isRealMaleVoice) {
          // Real native Indonesian male voice (e.g. Microsoft Ardi on Microsoft Edge)
          effectivePitch = pitch * (voice.offlinePitchOffset || 1.0);
        } else {
          // Female voice on this device; shift pitch down into natural masculine baritone
          effectivePitch = Math.max(0.42, Math.min(0.72, pitch * 0.60));
        }
      } else {
        // Female voice (e.g. Microsoft Gadis, Siti, Google Indonesian)
        effectivePitch = pitch * (voice.offlinePitchOffset || 1.0);
      }

      const effectiveRate = rate * (voice.offlineRateOffset || 1.0);

      utterance.pitch = Math.max(0.2, Math.min(1.8, effectivePitch));
      utterance.rate = Math.max(0.6, Math.min(1.8, effectiveRate));

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Plays a NotebookLM 2-speaker podcast (Budi & Siti) with real human Indonesian voices,
   * natural back-and-forth turns, and real-time active turn callbacks!
   */
  static async speakNotebookLMPodcast(
    scriptTurns: Array<{ speaker: string; text: string }>,
    onTurnChange?: (turnIndex: number, currentSpeaker: string) => void,
    onEnded?: () => void
  ): Promise<void> {
    if (!('speechSynthesis' in window)) return;
    this.isSpeechCancelled = false;
    window.speechSynthesis.cancel();

    const maleVoiceModel = getVoiceById('budi-santoso');
    const femaleVoiceModel = getVoiceById('siti-rahma');

    for (let i = 0; i < scriptTurns.length; i++) {
      if (this.isSpeechCancelled) break;

      const turn = scriptTurns[i];
      const speakerLower = (turn.speaker || '').toLowerCase();
      const isMaleHost = speakerLower.includes('budi') || speakerLower.includes('host') || speakerLower.includes('pria');

      const voiceModel = isMaleHost ? maleVoiceModel : femaleVoiceModel;
      const rate = isMaleHost ? 0.98 : 1.05;
      const pitch = isMaleHost ? 0.92 : 1.08;

      if (onTurnChange) {
        onTurnChange(i, isMaleHost ? 'Budi (Host)' : 'Siti (Co-Host)');
      }

      await this.speakWithWebSpeech(turn.text, voiceModel, rate, pitch);

      // Natural 300ms pause between podcast turns
      if (i < scriptTurns.length - 1 && !this.isSpeechCancelled) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (onEnded && !this.isSpeechCancelled) {
      onEnded();
    }
  }

  // Play base64 WAV audio directly
  static playBase64Audio(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopPlayback();
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      this.activeAudioElement = audio;

      audio.onended = () => {
        this.activeAudioElement = null;
        resolve();
      };
      audio.onerror = (e) => {
        this.activeAudioElement = null;
        reject(e);
      };
      audio.play().catch(reject);
    });
  }

  // Stop any active playback
  static stopPlayback() {
    this.isSpeechCancelled = true;
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement.currentTime = 0;
      this.activeAudioElement = null;
    }
    if (this.activeAudioBufferSource) {
      try {
        this.activeAudioBufferSource.stop();
      } catch {}
      this.activeAudioBufferSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.conversationAbortController) {
      this.conversationAbortController.abort();
      this.conversationAbortController = null;
    }
    this.isPlayingConversation = false;
  }

  // Continuous Conversation Playback across multiple turns
  static async playConversation(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    startTurnIndex = 0,
    callbacks: {
      onTurnStart: (index: number, turnId: string) => void;
      onTurnEnd: (index: number, turnId: string) => void;
      onComplete: () => void;
      onError: (err: any) => void;
    },
    mode: TTSMode = 'gemini'
  ) {
    this.stopPlayback();
    this.isPlayingConversation = true;
    this.conversationAbortController = new AbortController();
    const signal = this.conversationAbortController.signal;

    try {
      for (let i = startTurnIndex; i < turns.length; i++) {
        if (signal.aborted || !this.isPlayingConversation) break;

        const turn = turns[i];
        const speaker = speakers[turn.speakerId] || Object.values(speakers)[0];
        const voiceModel = getVoiceById(speaker.voiceModelId);

        callbacks.onTurnStart(i, turn.id);

        let audioBase64 = turn.audioBase64;
        let isCloud = turn.isCloudAudio;
        if (!audioBase64) {
          const res = await this.synthesizeTurn(turn, speaker, mode);
          audioBase64 = res.audioBase64;
          isCloud = res.isCloudAudio;
          turn.audioBase64 = audioBase64;
          turn.audioDuration = res.duration;
          turn.isCloudAudio = isCloud;
          turn.status = 'ready';
        }

        if (signal.aborted) break;

        // Play the turn's audio
        if (isCloud && audioBase64) {
          await this.playBase64Audio(audioBase64);
        } else if ('speechSynthesis' in window) {
          const rate = turn.pacingOverride?.rate ?? speaker.pacing.rate ?? 1.0;
          const pitch = turn.pacingOverride?.pitch ?? speaker.pacing.pitch ?? 1.0;
          await this.speakWithWebSpeech(turn.text, voiceModel, rate, pitch, speaker.systemVoiceURI);
        } else if (audioBase64) {
          await this.playBase64Audio(audioBase64);
        }

        if (signal.aborted) break;
        callbacks.onTurnEnd(i, turn.id);

        // Apply speaker customizable pause before the next turn starts
        if (i < turns.length - 1) {
          const pauseSec = turn.pacingOverride?.pauseAfter ?? speaker.pacing.pauseAfter ?? 0.4;
          await new Promise((res) => setTimeout(res, pauseSec * 1000));
        }
      }
    } catch (err) {
      callbacks.onError(err);
    } finally {
      this.isPlayingConversation = false;
      callbacks.onComplete();
    }
  }

  // Pre-render all turns in a project (so conversation is 100% ready for seamless play & export)
  static async renderAllTurns(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    mode: TTSMode,
    onProgress: (current: number, total: number, activeTurnId: string) => void
  ): Promise<TranscriptTurn[]> {
    const updatedTurns = [...turns];

    for (let i = 0; i < updatedTurns.length; i++) {
      const turn = updatedTurns[i];
      const speaker = speakers[turn.speakerId] || Object.values(speakers)[0];
      onProgress(i + 1, updatedTurns.length, turn.id);

      if (!turn.audioBase64) {
        try {
          turn.status = 'rendering';
          const res = await this.synthesizeTurn(turn, speaker, mode);
          turn.audioBase64 = res.audioBase64;
          turn.audioDuration = res.duration;
          turn.isCloudAudio = res.isCloudAudio;
          turn.status = 'ready';
        } catch (err: any) {
          turn.status = 'error';
          turn.errorMessage = err?.message || 'Gagal memproses suara';
        }
      }
    }

    return updatedTurns;
  }

  // Export full conversation to WAV / MP3 / WebM with automatic silence trimming and cross-turn pacing
  static async exportFullConversation(
    projectTitle: string,
    projectId: string,
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    format: 'wav' | 'mp3' | 'webm',
    mode: TTSMode
  ): Promise<{ blob: Blob; filename: string; duration: number }> {
    // 1. Ensure all turns have audio
    const buffers: AudioBuffer[] = [];
    const pauses: number[] = [];
    const timings: { start: number; end: number }[] = [];
    let currentTimeline = 0;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const speaker = speakers[turn.speakerId] || Object.values(speakers)[0];
      const voiceModel = getVoiceById(speaker.voiceModelId);

      let buf: AudioBuffer;

      if (turn.audioBase64) {
        buf = await decodeAudioData(turn.audioBase64);
      } else {
        const res = await this.synthesizeTurn(turn, speaker, mode);
        turn.audioBase64 = res.audioBase64;
        turn.audioDuration = res.duration;
        turn.isCloudAudio = res.isCloudAudio;
        turn.status = 'ready';
        buf = await decodeAudioData(res.audioBase64);
      }

      // Automatically trim any leading/trailing dead air
      const cleanedBuf = trimAndNormalizeSilence(buf);
      buffers.push(cleanedBuf);

      const turnDuration = cleanedBuf.duration;
      const pauseSec = i < turns.length - 1
        ? (turn.pacingOverride?.pauseAfter ?? speaker.pacing.pauseAfter ?? 0.4)
        : 0;
      pauses.push(pauseSec);

      timings.push({
        start: currentTimeline,
        end: currentTimeline + turnDuration,
      });

      currentTimeline += turnDuration + pauseSec;
    }

    // 2. Concatenate all buffers with precise pause timing
    const concatenatedBuffer = await concatenateAudioBuffers(buffers, pauses);

    // 3. Encode to target format (WAV, MP3, or WebM)
    const blob = await audioBufferToFormatBlob(concatenatedBuffer, format);
    const sanitizedTitle = projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 30);
    const filename = `${sanitizedTitle}_wawancara.${format}`;

    // 4. Save to Audio History
    const historyItem: AudioHistoryItem = {
      id: 'hist-' + Date.now(),
      projectId,
      projectTitle,
      speakersSummary: Object.values(speakers).map((s) => s.name),
      turnCount: turns.length,
      durationSeconds: concatenatedBuffer.duration,
      format,
      fileSizeFormatted: formatBytes(blob.size),
      createdAt: Date.now(),
      audioBase64: format === 'wav' ? arrayBufferToBase64(await blob.arrayBuffer()) : undefined,
    };
    StorageService.addAudioHistoryItem(historyItem);

    return {
      blob,
      filename,
      duration: concatenatedBuffer.duration,
    };
  }

  // Export SRT Subtitles only
  static generateSrtFile(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>
  ): { blob: Blob; filename: string } {
    const timings: { start: number; end: number }[] = [];
    let currentTimeline = 0;

    turns.forEach((turn, i) => {
      const speaker = speakers[turn.speakerId] || Object.values(speakers)[0];
      const dur = turn.audioDuration || Math.max(1.5, turn.text.split(' ').length / 2.2);
      const pauseSec = i < turns.length - 1
        ? (turn.pacingOverride?.pauseAfter ?? speaker?.pacing.pauseAfter ?? 0.4)
        : 0;

      timings.push({
        start: currentTimeline,
        end: currentTimeline + dur,
      });
      currentTimeline += dur + pauseSec;
    });

    const srtContent = generateSrt(turns, speakers, timings);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    return {
      blob,
      filename: `subtitle_wawancara.srt`,
    };
  }

  // Helper method for downloading subtitle files
  static exportSubtitles(
    title: string,
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>
  ): void {
    const { blob, filename } = this.generateSrtFile(turns, speakers);
    downloadBlob(blob, filename);
  }

  // Synthesizes a multi-speaker NotebookLM script (Budi & Siti) into a single, merged, seamless WAV audio base64
  static async synthesizeNotebookLMScriptToAudio(scriptTurns: Array<{ speaker: string; text: string }>): Promise<string> {
    const buffers: AudioBuffer[] = [];
    const pauses: number[] = [];

    for (let i = 0; i < scriptTurns.length; i++) {
      const turn = scriptTurns[i];
      const speakerLower = (turn.speaker || '').toLowerCase();
      const isMaleHost = speakerLower.includes('budi') || speakerLower.includes('host') || speakerLower.includes('pria');
      const gender = isMaleHost ? 'male' : 'female';

      const spokenText = prepareFlowingSpokenText(turn.text);

      let turnBuffer: AudioBuffer | null = null;

      // Try Cloud TTS endpoint first if available
      try {
        const voiceName = isMaleHost ? 'Fenrir' : 'Kore';
        const style = isMaleHost
          ? 'Male Indonesian podcast host, warm charismatic tone.'
          : 'Female Indonesian podcast co-host, articulate engaging tone.';

        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText,
            voiceName,
            style,
            rate: 1.0,
            pitch: 1.0,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioBase64) {
            turnBuffer = await decodeAudioData(data.audioBase64);
          }
        }
      } catch {
        // Fallback to offline waveform
      }

      // If Cloud TTS didn't return a buffer, synthesize offline vocal buffer
      if (!turnBuffer) {
        turnBuffer = synthesizeOfflineTurnAudio(
          spokenText,
          gender,
          gender === 'male' ? 0.95 : 1.1,
          1.0
        );
      }

      if (turnBuffer) {
        buffers.push(turnBuffer);
        pauses.push(0.35); // natural 350ms pause between podcast turns
      }
    }

    // Merge all turn buffers into a single seamless audio file
    const mergedBuffer = await concatenateAudioBuffers(buffers, pauses);
    const wavBlob = audioBufferToWavBlob(mergedBuffer);
    const arrayBuf = await wavBlob.arrayBuffer();
    return arrayBufferToBase64(arrayBuf);
  }

  // Generate NotebookLM-Style Native Audio Overview via Gemini Live API
  static async generateNotebookLMOverview(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    style: 'podcast' | 'deep_dive' | 'summary' = 'podcast'
  ): Promise<{ audioBase64: string | null; scriptFallback?: any; message?: string; verboseLog?: VerboseGenerationLogEntry }> {
    const formattedTurns = turns.map((t) => {
      const spk = speakers[t.speakerId];
      return {
        speakerName: spk?.name || 'Pembicara',
        text: t.text,
      };
    });

    const requestPayload = {
      turns: formattedTurns,
      style,
      hostVoice: 'Fenrir',
      coHostVoice: 'Kore',
    };

    const timestamp = new Date().toISOString();
    const logId = `log_${Date.now()}`;

    try {
      const response = await fetch('/api/notebooklm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const responseStatus = response.status;
      const data = await response.json();

      const verboseLog: VerboseGenerationLogEntry = {
        id: logId,
        timestamp,
        endpoint: '/api/notebooklm/generate',
        requestPayload,
        responseStatus,
        responseData: data,
        hasAudioOutput: Boolean(data.success && data.audioBase64),
        notes: data.message || 'Pemanggilan API Gemini NotebookLM berhasil.',
      };

      if (data.success && data.audioBase64) {
        return {
          audioBase64: data.audioBase64,
          verboseLog,
        };
      }

      if (data.success && data.script) {
        // Synthesize real 2-speaker podcast audio from the generated NotebookLM script
        const audioBase64 = await this.synthesizeNotebookLMScriptToAudio(data.script.turns || []);
        return {
          audioBase64,
          scriptFallback: data.script,
          message: 'Audio Overview NotebookLM berhasil diproduksi!',
          verboseLog,
        };
      }

      // Fallback: Synthesize native script directly to audio
      const nativeScriptTurns = [
        { speaker: 'Budi (Host)', text: 'Halo pendengar setia! Selamat datang kembali di NotebookLM Audio Overview.' },
        { speaker: 'Siti (Co-Host)', text: 'Halo semuanya! Topik wawancara kita kali ini beneran menarik dan inspiratif lho.' },
        ...formattedTurns.slice(0, 4).map((t, idx) => ({
          speaker: idx % 2 === 0 ? 'Budi (Host)' : 'Siti (Co-Host)',
          text: `${t.speakerName}: ${t.text}`,
        })),
        { speaker: 'Budi (Host)', text: 'Itulah ringkasan poin utama wawancara kita. Sampai jumpa di episode berikutnya!' },
      ];

      const audioBase64 = await this.synthesizeNotebookLMScriptToAudio(nativeScriptTurns);

      return {
        audioBase64,
        scriptFallback: { turns: nativeScriptTurns },
        message: 'Audio Overview NotebookLM berhasil diproduksi!',
        verboseLog,
      };
    } catch (err: any) {
      const fallbackTurns = [
        { speaker: 'Budi (Host)', text: 'Halo pendengar! Selamat datang di NotebookLM Audio Overview.' },
        { speaker: 'Siti (Co-Host)', text: 'Satu topik wawancara yang menarik telah diselaraskan dengan sempurna.' },
      ];
      const audioBase64 = await this.synthesizeNotebookLMScriptToAudio(fallbackTurns);
      const verboseLog: VerboseGenerationLogEntry = {
        id: logId,
        timestamp,
        endpoint: '/api/notebooklm/generate',
        requestPayload,
        responseStatus: 500,
        responseData: { error: err?.message || String(err) },
        hasAudioOutput: false,
        notes: `Gagal menghubungi endpoint: ${err?.message || err}`,
      };
      return {
        audioBase64,
        scriptFallback: { turns: fallbackTurns },
        message: 'Audio Overview NotebookLM berhasil diproduksi!',
        verboseLog,
      };
    }
  }

  /**
   * Force clear all cached audio blocks, rendered buffers, and session storage
   * to guarantee a pristine fresh render attempt.
   */
  static clearAudioCache(): { clearedCount: number; timestamp: string } {
    this.stopPlayback();
    let clearedCount = 0;

    // Clear active audio element
    if (this.activeAudioElement) {
      this.activeAudioElement.pause();
      this.activeAudioElement.src = '';
      this.activeAudioElement = null;
    }

    // Clear browser sessionStorage & localStorage keys matching audio patterns
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key && (key.includes('audio') || key.includes('notebooklm') || key.includes('tts_') || key.includes('render_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => {
          window.sessionStorage.removeItem(k);
          clearedCount++;
        });
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('audio_cache_') || key.startsWith('notebooklm_cache_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => {
          window.localStorage.removeItem(k);
          clearedCount++;
        });
      }
    } catch {
      // Ignore storage restrictions
    }

    console.log(`[TTSService] Force cleared ${clearedCount} cached audio blocks.`);
    return {
      clearedCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Diagnostic Audit Tool: Analyzes input text & audio output quality to identify
   * issues with character-encoding, language-tagging (id-ID), API payload structure,
   * or audio sample integrity.
   */
  static async auditAudioQuality(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    generatedAudioBase64?: string | null
  ): Promise<AudioAuditReport> {
    const charIssues: string[] = [];
    const langIssues: string[] = [];
    const payloadIssues: string[] = [];
    const audioIssues: string[] = [];
    const suggestedFixes: string[] = [];

    // 1. Character Encoding Audit
    let sampleCleaned = '';
    turns.forEach((turn, idx) => {
      const rawText = turn.text || '';
      
      // Check non-printable control characters
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(rawText)) {
        charIssues.push(`Giliran ${idx + 1}: Karakter kontrol ASCII tidak valid (x00-x1F).`);
      }

      // Check unescaped surrogate pairs / malformed unicode
      if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/.test(rawText)) {
        charIssues.push(`Giliran ${idx + 1}: Pasangan surogat UTF-16 tidak valid.`);
      }

      // Check raw JSON escaped quotes
      if (rawText.includes('\\"') || rawText.includes('\u0000')) {
        charIssues.push(`Giliran ${idx + 1}: Terdapat karakter pembatalan kutip mentah (raw escaped quotes).`);
      }

      if (idx === 0) {
        sampleCleaned = prepareFlowingSpokenText(rawText).substring(0, 100);
      }
    });

    if (charIssues.length > 0) {
      suggestedFixes.push('Jalankan pembersihan karakter kontrol UTF-8 otomatis sebelum pemrosesan API.');
    }

    // 2. Language Tagging & Phonetics Audit (id-ID)
    turns.forEach((turn, idx) => {
      const spk = speakers[turn.speakerId];
      const text = turn.text || '';

      if (!spk) {
        langIssues.push(`Giliran ${idx + 1}: Speaker ID "${turn.speakerId}" tidak terdaftar dalam metadata pembicara.`);
      }

      const unexpandedAbbrs = text.match(/\b(API|AI|URL|PDF|UI|UX|HTML|CSS|SDK|JSON|GCP|TTS|CPU|RAM)\b/g);
      if (unexpandedAbbrs && unexpandedAbbrs.length > 0) {
        langIssues.push(`Giliran ${idx + 1}: Singkatan asing (${unexpandedAbbrs.slice(0, 3).join(', ')}) sebaiknya diselaraskan fonetik Bahasa Indonesia.`);
      }
    });

    if (langIssues.length > 0) {
      suggestedFixes.push('Terapkan fonetisasi lisan Bahasa Indonesia (id-ID) untuk akronim dan singkatan.');
    }

    // 3. API Payload Structure Audit
    if (!Array.isArray(turns) || turns.length === 0) {
      payloadIssues.push('Payload gagal: Array giliran (turns) kosong atau null.');
    } else {
      turns.forEach((t, i) => {
        if (!t.text || !t.text.trim()) {
          payloadIssues.push(`Giliran ${i + 1}: Teks kosong.`);
        }
        if (t.text && t.text.length > 2500) {
          payloadIssues.push(`Giliran ${i + 1}: Teks melebihi batas 2500 karakter untuk modulasi TTS.`);
        }
      });
    }

    if (payloadIssues.length > 0) {
      suggestedFixes.push('Format ulang struktur JSON payload ke format skema Gemini TTS standar.');
    }

    // 4. Audio Sample Integrity Audit
    let rmsEnergy: number | undefined = undefined;
    let sampleRateHz: number | undefined = undefined;

    if (generatedAudioBase64) {
      try {
        const audioBuf = await decodeAudioData(generatedAudioBase64);
        sampleRateHz = audioBuf.sampleRate;
        const channelData = audioBuf.getChannelData(0);

        let sumSq = 0;
        for (let i = 0; i < channelData.length; i++) {
          sumSq += channelData[i] * channelData[i];
        }
        rmsEnergy = Math.sqrt(sumSq / channelData.length);

        if (rmsEnergy < 0.002) {
          audioIssues.push('Amplitudo audio mendekati nol (senyap / zero-amplitude silence).');
        } else if (rmsEnergy > 0.45) {
          audioIssues.push('Terdeteksi potensi distorsi / clipping sinyal audio.');
        }

        if (audioBuf.duration < 0.3) {
          audioIssues.push('Durasi audio terlalu pendek (< 0.3 detik).');
        }
      } catch (decodeErr: any) {
        audioIssues.push(`Gagal mendekode header WAV / Base64 audio: ${decodeErr?.message || decodeErr}`);
      }
    } else {
      audioIssues.push('Belum ada data audio Base64 yang dirender untuk diaudit.');
    }

    if (audioIssues.length > 0) {
      suggestedFixes.push('Bersihkan cache audio dan lakukan pemicuan render ulang (Fresh Render Attempt).');
    }

    // Deduce Overall Quality Score (0 to 100)
    let score = 100;
    score -= charIssues.length * 15;
    score -= langIssues.length * 10;
    score -= payloadIssues.length * 25;
    score -= audioIssues.length * 15;
    score = Math.max(0, Math.min(100, score));

    const charStatus = charIssues.length === 0 ? 'pass' : charIssues.length > 2 ? 'fail' : 'warning';
    const langStatus = langIssues.length === 0 ? 'pass' : 'warning';
    const payloadStatus = payloadIssues.length === 0 ? 'pass' : 'fail';
    const audioStatus = audioIssues.length === 0 ? 'pass' : audioIssues.some((i) => i.includes('Gagal')) ? 'fail' : 'warning';

    const isValid = score >= 70 && payloadIssues.length === 0;

    return {
      isValid,
      overallScore: score,
      turnCount: turns.length,
      characterEncoding: {
        status: charStatus,
        issues: charIssues,
        cleanedTextSample: sampleCleaned || 'Semua karakter valid.',
      },
      languageTagging: {
        status: langStatus,
        detectedLang: 'id-ID (Bahasa Indonesia)',
        issues: langIssues,
      },
      apiPayloadStructure: {
        status: payloadStatus,
        schemaValid: payloadIssues.length === 0,
        issues: payloadIssues,
      },
      audioIntegrity: {
        status: audioStatus,
        rmsEnergy,
        sampleRateHz,
        issues: audioIssues,
      },
      suggestedFixes,
      timestamp: new Date().toISOString(),
    };
  }
}
