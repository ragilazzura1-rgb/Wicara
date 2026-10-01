import { TranscriptTurn, Speaker } from '../types';

export type PauseOptimizationPreset = 'adaptive' | 'podcast' | 'formal' | 'investigative';

export interface TurnPauseAnalysis {
  turnIndex: number;
  speakerName: string;
  speakerRole?: string;
  textSnippet: string;
  currentPause: number;
  recommendedPause: number;
  reason: string;
  transitionType: 'handover' | 'continuation' | 'interjection' | 'question_response' | 'trailing_ellipsis';
}

export interface PauseOptimizationSummary {
  preset: PauseOptimizationPreset;
  totalTurns: number;
  handoverCount: number;
  averagePauseBefore: number;
  averagePauseAfter: number;
  estimatedTimeSavedSeconds: number;
  analyses: TurnPauseAnalysis[];
}

/**
 * Intelligent Pause-Optimizer Engine:
 * Analyzes conversational turn structures, speaker pacing profiles, and punctuation patterns
 * to calculate the most natural, human-sounding rhythm and pause intervals.
 */
export class PauseOptimizerService {
  /**
   * Calculates optimized pause for a single turn
   */
  static calculateTurnPause(
    turn: TranscriptTurn,
    speaker: Speaker | undefined,
    nextTurn: TranscriptTurn | undefined,
    preset: PauseOptimizationPreset = 'adaptive'
  ): { pauseAfter: number; reason: string; transitionType: TurnPauseAnalysis['transitionType'] } {
    const text = turn.text.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const speakerRate = turn.pacingOverride?.rate ?? speaker?.pacing.rate ?? 1.0;
    const baseSpeakerPause = speaker?.pacing.pauseAfter ?? 0.45;

    // Determine transition type
    const isLastTurn = !nextTurn;
    const isSameSpeaker = nextTurn && nextTurn.speakerId === turn.speakerId;
    const endsWithQuestion = /[?？]$/.test(text) || /\?\s*$/.test(text);
    const endsWithEllipsis = /\.{3,}$/.test(text) || /…$/.test(text) || /\[jeda\]/i.test(text);
    const endsWithExclamation = /[!！]$/.test(text);
    const isShortInterjection = wordCount <= 3 && !endsWithQuestion;

    let basePause = baseSpeakerPause;
    let transitionType: TurnPauseAnalysis['transitionType'] = 'handover';
    let reason = 'Jeda transisi antar pembicara standar.';

    if (isLastTurn) {
      basePause = 0.5;
      transitionType = 'handover';
      reason = 'Penutup percakapan.';
    } else if (isShortInterjection) {
      // Short interjection agreement e.g., "Ya, betul.", "Tentu saja."
      basePause = 0.28;
      transitionType = 'interjection';
      reason = 'Sahutan singkat: jeda dipercepat agar sahut-menyahut responsif.';
    } else if (endsWithQuestion) {
      // Question asking for handover
      basePause = 0.48;
      transitionType = 'question_response';
      reason = 'Pertanyaan: jeda natural sebelum narasumber mulai merespons.';
    } else if (endsWithEllipsis) {
      // Thoughtful reflection
      basePause = 0.65;
      transitionType = 'trailing_ellipsis';
      reason = 'Jeda kontemplatif reflektif (...) sebelum poin berikutnya.';
    } else if (isSameSpeaker) {
      // Same speaker continuing
      basePause = 0.32;
      transitionType = 'continuation';
      reason = 'Napas lanjutan pembicara yang sama.';
    } else if (endsWithExclamation) {
      basePause = 0.38;
      transitionType = 'handover';
      reason = 'Pernyataan tegas/antusias: jeda berenergi.';
    }

    // Apply Style Preset Multipliers
    let presetMultiplier = 1.0;
    if (preset === 'podcast') {
      // Snappy, fast-paced podcast conversation
      presetMultiplier = 0.82;
      if (transitionType === 'question_response') presetMultiplier = 0.88;
    } else if (preset === 'formal') {
      // Dignified, polite formal interview
      presetMultiplier = 1.15;
    } else if (preset === 'investigative') {
      // Deep documentary / investigative narrative
      presetMultiplier = 1.35;
    } else {
      // Adaptive: adjust proportionally to speaker's speaking rate
      // Fast speaker -> tighter pause, slow speaker -> room to breathe
      if (speakerRate > 1.1) {
        presetMultiplier = 0.85;
      } else if (speakerRate < 0.9) {
        presetMultiplier = 1.18;
      }
    }

    // Calculate final calibrated pause (bounded safely between 0.20s and 1.20s)
    let optimized = basePause * presetMultiplier;
    optimized = Math.max(0.2, Math.min(1.2, Math.round(optimized * 100) / 100));

    return {
      pauseAfter: optimized,
      reason,
      transitionType,
    };
  }

  /**
   * Analyzes all turns in the project and generates an optimization summary
   */
  static analyzeProjectPauses(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    preset: PauseOptimizationPreset = 'adaptive'
  ): PauseOptimizationSummary {
    let totalPauseBefore = 0;
    let totalPauseAfter = 0;
    let handoverCount = 0;

    const analyses: TurnPauseAnalysis[] = turns.map((turn, i) => {
      const speaker = speakers[turn.speakerId];
      const nextTurn = turns[i + 1];
      const currentPause = turn.pacingOverride?.pauseAfter ?? speaker?.pacing.pauseAfter ?? 0.45;

      const { pauseAfter, reason, transitionType } = this.calculateTurnPause(turn, speaker, nextTurn, preset);

      totalPauseBefore += currentPause;
      totalPauseAfter += pauseAfter;
      if (nextTurn && nextTurn.speakerId !== turn.speakerId) {
        handoverCount++;
      }

      return {
        turnIndex: i,
        speakerName: speaker?.name || 'Pembicara',
        speakerRole: speaker?.role,
        textSnippet: turn.text.slice(0, 50) + (turn.text.length > 50 ? '...' : ''),
        currentPause,
        recommendedPause: pauseAfter,
        reason,
        transitionType,
      };
    });

    const averagePauseBefore = turns.length > 0 ? totalPauseBefore / turns.length : 0;
    const averagePauseAfter = turns.length > 0 ? totalPauseAfter / turns.length : 0;
    const estimatedTimeSavedSeconds = Math.max(0, totalPauseBefore - totalPauseAfter);

    return {
      preset,
      totalTurns: turns.length,
      handoverCount,
      averagePauseBefore: Math.round(averagePauseBefore * 100) / 100,
      averagePauseAfter: Math.round(averagePauseAfter * 100) / 100,
      estimatedTimeSavedSeconds: Math.round(estimatedTimeSavedSeconds * 10) / 10,
      analyses,
    };
  }

  /**
   * Applies optimized pauses across all turns in the project
   */
  static optimizeAllTurns(
    turns: TranscriptTurn[],
    speakers: Record<string, Speaker>,
    preset: PauseOptimizationPreset = 'adaptive'
  ): TranscriptTurn[] {
    return turns.map((turn, i) => {
      const speaker = speakers[turn.speakerId];
      const nextTurn = turns[i + 1];
      const { pauseAfter } = this.calculateTurnPause(turn, speaker, nextTurn, preset);

      return {
        ...turn,
        pacingOverride: {
          rate: turn.pacingOverride?.rate ?? speaker?.pacing.rate ?? 1.0,
          pitch: turn.pacingOverride?.pitch ?? speaker?.pacing.pitch ?? 1.0,
          pauseAfter,
          volume: turn.pacingOverride?.volume ?? 1.0,
        },
      };
    });
  }
}
