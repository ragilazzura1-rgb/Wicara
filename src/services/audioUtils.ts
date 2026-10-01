import { TranscriptTurn, Speaker } from '../types';

let audioCtxInstance: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtxInstance) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtxInstance = new AudioCtx();
  }
  if (audioCtxInstance.state === 'suspended') {
    audioCtxInstance.resume();
  }
  return audioCtxInstance;
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const cleanBase64 = base64.replace(/^data:audio\/\w+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer or Uint8Array to base64
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decode audio data (from base64 or ArrayBuffer) into an AudioBuffer
export async function decodeAudioData(data: string | ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const buffer = typeof data === 'string' ? base64ToArrayBuffer(data) : data;
  return await ctx.decodeAudioData(buffer.slice(0));
}

// Generate silence AudioBuffer
export function generateSilenceBuffer(durationSeconds: number, sampleRate = 24000): AudioBuffer {
  const ctx = getAudioContext();
  const length = Math.max(1, Math.floor(durationSeconds * sampleRate));
  return ctx.createBuffer(1, length, sampleRate);
}

export interface SilenceTrimOptions {
  /** Silence threshold in normalized linear amplitude (0.0 to 1.0). Default: 0.006 (~-44dB) */
  threshold?: number;
  /** Keep leading natural breath padding (in seconds). Default: 0.035 (35ms) */
  leadInSeconds?: number;
  /** Keep trailing natural room resonance padding (in seconds). Default: 0.060 (60ms) */
  leadOutSeconds?: number;
  /** Max allowed internal non-speech gap before compacting (in seconds). Default: 0.35 (350ms) */
  maxInternalSilenceSec?: number;
  /** Target compacted internal breath gap duration (in seconds). Default: 0.20 (200ms) */
  targetInternalSilenceSec?: number;
}

/**
 * Automatically detects and trims excessive leading, trailing, and internal
 * non-speech silence gaps in synthesized audio to ensure natural human cadence.
 */
export function trimAndNormalizeSilence(
  audioBuffer: AudioBuffer,
  options: SilenceTrimOptions = {}
): AudioBuffer {
  const threshold = options.threshold ?? 0.006;
  const leadInSec = options.leadInSeconds ?? 0.035;
  const leadOutSec = options.leadOutSeconds ?? 0.060;
  const maxInternalSilenceSec = options.maxInternalSilenceSec ?? 0.35;
  const targetInternalSilenceSec = options.targetInternalSilenceSec ?? 0.20;

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const totalSamples = audioBuffer.length;

  if (totalSamples === 0) {
    return generateSilenceBuffer(0.05, sampleRate);
  }

  // Window size for RMS calculation: 10ms
  const windowSize = Math.max(16, Math.floor(sampleRate * 0.01));
  const numWindows = Math.floor(totalSamples / windowSize);
  const rmsValues = new Float32Array(numWindows);

  // Compute energy profile across all channels
  for (let w = 0; w < numWindows; w++) {
    let sumSq = 0;
    const startIdx = w * windowSize;
    for (let c = 0; c < numChannels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      for (let i = 0; i < windowSize; i++) {
        const val = channelData[startIdx + i] || 0;
        sumSq += val * val;
      }
    }
    rmsValues[w] = Math.sqrt(sumSq / (windowSize * numChannels));
  }

  // Find first active speech window
  let firstActiveWindow = -1;
  for (let w = 0; w < numWindows; w++) {
    if (rmsValues[w] > threshold) {
      firstActiveWindow = w;
      break;
    }
  }

  // Find last active speech window
  let lastActiveWindow = -1;
  for (let w = numWindows - 1; w >= 0; w--) {
    if (rmsValues[w] > threshold) {
      lastActiveWindow = w;
      break;
    }
  }

  // If no speech detected above threshold, return a tiny gentle silence
  if (firstActiveWindow === -1 || lastActiveWindow === -1 || firstActiveWindow > lastActiveWindow) {
    return generateSilenceBuffer(0.1, sampleRate);
  }

  // Calculate start and end samples with natural padding
  const rawStartSample = firstActiveWindow * windowSize;
  const rawEndSample = Math.min(totalSamples, (lastActiveWindow + 1) * windowSize);

  const leadInSamples = Math.floor(leadInSec * sampleRate);
  const leadOutSamples = Math.floor(leadOutSec * sampleRate);

  const startSample = Math.max(0, rawStartSample - leadInSamples);
  const endSample = Math.min(totalSamples, rawEndSample + leadOutSamples);

  // Identify internal silence gaps inside [startSample, endSample] that exceed maxInternalSilenceSec
  const maxGapWindows = Math.floor(maxInternalSilenceSec / 0.01);
  const targetGapSamples = Math.floor(targetInternalSilenceSec * sampleRate);

  interface Segment {
    start: number;
    end: number;
  }
  const segments: Segment[] = [];
  let currentSegmentStart = startSample;
  let inSilence = false;
  let silenceStartWindow = 0;

  for (let w = firstActiveWindow; w <= lastActiveWindow; w++) {
    const isSilent = rmsValues[w] <= threshold;
    if (isSilent && !inSilence) {
      inSilence = true;
      silenceStartWindow = w;
    } else if (!isSilent && inSilence) {
      inSilence = false;
      const gapWindows = w - silenceStartWindow;
      if (gapWindows >= maxGapWindows) {
        // Cut current speech segment before excessive silence
        const segmentEnd = silenceStartWindow * windowSize + Math.floor(leadOutSec * 0.5 * sampleRate);
        if (segmentEnd > currentSegmentStart) {
          segments.push({ start: currentSegmentStart, end: Math.min(totalSamples, segmentEnd) });
        }
        // Next segment starts after silence with subtle lead-in
        currentSegmentStart = Math.max(0, w * windowSize - Math.floor(leadInSec * 0.5 * sampleRate));
      }
    }
  }

  // Add the final segment
  if (currentSegmentStart < endSample) {
    segments.push({ start: currentSegmentStart, end: endSample });
  }

  // If no excessive internal gaps were split, just extract single trimmed block
  if (segments.length <= 1) {
    const trimmedLength = endSample - startSample;
    const ctx = getAudioContext();
    const resultBuffer = ctx.createBuffer(numChannels, trimmedLength, sampleRate);

    // 15ms fade-in / fade-out to prevent clicks
    const fadeSamples = Math.min(Math.floor(sampleRate * 0.015), Math.floor(trimmedLength / 4));

    for (let c = 0; c < numChannels; c++) {
      const src = audioBuffer.getChannelData(c);
      const dst = resultBuffer.getChannelData(c);
      for (let i = 0; i < trimmedLength; i++) {
        let sample = src[startSample + i] || 0;
        if (i < fadeSamples) {
          // Smooth half-cosine fade-in
          sample *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
        } else if (i > trimmedLength - fadeSamples) {
          // Smooth half-cosine fade-out
          const k = trimmedLength - i;
          sample *= 0.5 * (1 - Math.cos((Math.PI * k) / fadeSamples));
        }
        dst[i] = sample;
      }
    }
    return resultBuffer;
  }

  // Stitch compacted segments together with target internal pauses
  let totalCompactedSamples = 0;
  segments.forEach((seg, idx) => {
    totalCompactedSamples += seg.end - seg.start;
    if (idx < segments.length - 1) {
      totalCompactedSamples += targetGapSamples;
    }
  });

  const ctx = getAudioContext();
  const compactedBuffer = ctx.createBuffer(numChannels, totalCompactedSamples, sampleRate);
  const fadeSamples = Math.min(Math.floor(sampleRate * 0.015), 512);

  for (let c = 0; c < numChannels; c++) {
    const src = audioBuffer.getChannelData(c);
    const dst = compactedBuffer.getChannelData(c);
    let writeOffset = 0;

    segments.forEach((seg, idx) => {
      const segLen = seg.end - seg.start;
      for (let i = 0; i < segLen; i++) {
        let sample = src[seg.start + i] || 0;
        // Fade in first segment and fade out last segment
        if (idx === 0 && i < fadeSamples) {
          sample *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
        } else if (idx === segments.length - 1 && i > segLen - fadeSamples) {
          const k = segLen - i;
          sample *= 0.5 * (1 - Math.cos((Math.PI * k) / fadeSamples));
        }
        dst[writeOffset + i] = sample;
      }
      writeOffset += segLen;

      if (idx < segments.length - 1) {
        // Natural zero-level breath pause
        writeOffset += targetGapSamples;
      }
    });
  }

  return compactedBuffer;
}

/**
 * High-level helper to decode, trim silence, and re-encode to clean base64 audio
 */
export async function cleanSynthesizedTurnAudio(
  data: string | ArrayBuffer,
  options?: SilenceTrimOptions
): Promise<{
  audioBase64: string;
  duration: number;
  trimmedSeconds: number;
  cleanBuffer: AudioBuffer;
}> {
  const originalBuf = await decodeAudioData(data);
  const cleanBuf = trimAndNormalizeSilence(originalBuf, options);
  const wavBlob = audioBufferToWavBlob(cleanBuf);
  const arrayBuf = await wavBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(arrayBuf);
  const trimmedSeconds = Math.max(0, originalBuf.duration - cleanBuf.duration);

  return {
    audioBase64: base64,
    duration: cleanBuf.duration,
    trimmedSeconds,
    cleanBuffer: cleanBuf,
  };
}

// Concatenate multiple AudioBuffers with pauses into a single AudioBuffer
export async function concatenateAudioBuffers(
  buffers: AudioBuffer[],
  pausesBetween: number[]
): Promise<AudioBuffer> {
  if (buffers.length === 0) {
    return generateSilenceBuffer(0.1);
  }

  // Pre-clean each buffer before concatenation to guarantee zero dead-air overlap
  const cleanedBuffers = buffers.map((b) => trimAndNormalizeSilence(b));

  const sampleRate = cleanedBuffers[0].sampleRate;
  const numChannels = 1; // standard mono for dialogue

  let totalSamples = 0;
  for (let i = 0; i < cleanedBuffers.length; i++) {
    totalSamples += cleanedBuffers[i].length;
    if (i < cleanedBuffers.length - 1) {
      const pauseSec = pausesBetween[i] ?? 0.4;
      totalSamples += Math.floor(pauseSec * sampleRate);
    }
  }

  const ctx = getAudioContext();
  const mergedBuffer = ctx.createBuffer(numChannels, totalSamples, sampleRate);
  const channelData = mergedBuffer.getChannelData(0);

  let currentOffset = 0;
  for (let i = 0; i < cleanedBuffers.length; i++) {
    const buf = cleanedBuffers[i];
    const sourceData = buf.getChannelData(0);
    channelData.set(sourceData, currentOffset);
    currentOffset += buf.length;

    if (i < cleanedBuffers.length - 1) {
      const pauseSec = pausesBetween[i] ?? 0.4;
      const pauseSamples = Math.floor(pauseSec * sampleRate);
      currentOffset += pauseSamples;
    }
  }

  return mergedBuffer;
}

// Convert AudioBuffer to a valid RIFF WAV Blob (16-bit PCM, standard lossless WAV)
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = audioBuffer.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV Header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = audioBuffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert AudioBuffer to MP3-compatible WebM/WAV container Blob
export async function audioBufferToFormatBlob(
  audioBuffer: AudioBuffer,
  format: 'wav' | 'mp3' | 'webm'
): Promise<Blob> {
  const cleanBuffer = trimAndNormalizeSilence(audioBuffer);
  const wavBlob = audioBufferToWavBlob(cleanBuffer);

  if (format === 'wav') {
    return wavBlob;
  }

  if (format === 'webm' || format === 'mp3') {
    try {
      const mime = format === 'webm' ? 'audio/webm;codecs=opus' : 'audio/mp3';
      if (MediaRecorder.isTypeSupported(mime)) {
        return await renderWithMediaRecorder(cleanBuffer, mime);
      }
    } catch {
      // Fallback
    }
    return new Blob([await wavBlob.arrayBuffer()], {
      type: format === 'mp3' ? 'audio/mpeg' : 'audio/webm',
    });
  }

  return wavBlob;
}

function renderWithMediaRecorder(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.start();
    source.start(0);
    source.onended = () => {
      setTimeout(() => recorder.stop(), 100);
    };
  });
}

// Synthesize a speech-like vocal resonance audio buffer
export function synthesizeOfflineTurnAudio(
  text: string,
  gender: 'male' | 'female',
  pitchMult = 1.0,
  rateMult = 1.0
): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const baseDurationSec = Math.max(1.2, (words / 2.2) / Math.max(0.5, rateMult));
  const totalSamples = Math.floor(baseDurationSec * sampleRate);
  
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  const f0 = gender === 'male' ? 120 * pitchMult : 210 * pitchMult;
  
  const syllables = Math.max(3, Math.floor(words * 2.8));
  const syllableLength = totalSamples / syllables;

  // Formant frequencies (Hz) for human vocal tract resonance
  const f1 = gender === 'male' ? 500 : 650;
  const f2 = gender === 'male' ? 1400 : 1800;

  let f1Prev = 0;
  let f2Prev = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    
    // Syllable rhythmic envelope
    const sylPhase = (i % syllableLength) / syllableLength;
    const sylEnvelope = Math.pow(Math.sin(Math.PI * sylPhase), 1.5);
    
    // Smooth fade in / out
    const attackSamples = sampleRate * 0.04;
    const decaySamples = sampleRate * 0.08;
    let mainEnv = 1;
    if (i < attackSamples) mainEnv = i / attackSamples;
    else if (i > totalSamples - decaySamples) mainEnv = (totalSamples - i) / decaySamples;

    // Glottal pulse source (asymmetric vocal fold excitation)
    const pitchPeriod = sampleRate / (f0 * (1 + 0.02 * Math.sin(2 * Math.PI * 4 * t)));
    const pulsePhase = (i % pitchPeriod) / pitchPeriod;
    const glottalPulse = pulsePhase < 0.6 ? Math.sin(Math.PI * pulsePhase / 0.6) : -Math.sin(Math.PI * (pulsePhase - 0.6) / 0.4) * 0.2;

    // Soft formant resonance filtering
    const f1Out = glottalPulse + 0.85 * f1Prev * Math.cos(2 * Math.PI * f1 / sampleRate);
    const f2Out = glottalPulse + 0.75 * f2Prev * Math.cos(2 * Math.PI * f2 / sampleRate);
    f1Prev = f1Out;
    f2Prev = f2Out;

    const breathNoise = (Math.random() * 2 - 1) * 0.02;

    data[i] = (f1Out * 0.25 + f2Out * 0.15 + breathNoise) * sylEnvelope * mainEnv * 0.22;
  }

  return trimAndNormalizeSilence(buffer);
}

// Generate SRT Subtitle format
export function generateSrt(
  turns: TranscriptTurn[],
  speakers: Record<string, Speaker>,
  timings: { start: number; end: number }[]
): string {
  let srt = '';
  turns.forEach((turn, idx) => {
    const timing = timings[idx] || { start: idx * 3, end: (idx + 1) * 3 };
    const speaker = speakers[turn.speakerId];
    const speakerName = speaker?.name || 'Pembicara';

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const millis = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    };

    srt += `${idx + 1}\n`;
    srt += `${formatTime(timing.start)} --> ${formatTime(timing.end)}\n`;
    srt += `[${speakerName}]: ${turn.text}\n\n`;
  });
  return srt;
}

// Download any Blob to the user's filesystem
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

// Format duration into mm:ss
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format file size
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
