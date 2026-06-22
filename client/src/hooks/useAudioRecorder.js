import { useState, useRef, useCallback } from 'react';

const RECORD_SECONDS = 12;

// Encode a Float32Array of PCM samples into a proper WAV file buffer.
// AudD requires 16-bit PCM WAV — sending raw webm/opus fails silently.
function encodeWAV(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2; // 2 bytes per 16-bit sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert float32 [-1, 1] → int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

// Merge multiple Float32Array chunks into a single one
function mergeBuffers(chunks, totalLength) {
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

export function useAudioRecorder() {
  const [state, setState] = useState('idle'); // idle | recording | processing | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const chunksRef = useRef([]);
  const totalSamplesRef = useRef(0);
  const timerRef = useRef(null);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const record = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      setError(null);
      setProgress(0);
      setState('recording');
      chunksRef.current = [];
      totalSamplesRef.current = 0;

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            // Disable all processing — these strip out ambient audio from speakers
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
          },
        });
      } catch (err) {
        setState('error');
        const msg = err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow mic access and try again.'
          : `Mic error: ${err.message}`;
        setError(msg);
        reject(new Error(msg));
        return;
      }

      streamRef.current = stream;

      // Use Web Audio API to get raw PCM samples (no container format issues)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const sampleRate = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);

      // ScriptProcessor gives us raw float32 PCM chunks
      // bufferSize 4096 is a good balance of latency vs overhead
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(channelData));
        totalSamplesRef.current += channelData.length;
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Progress ticker
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setProgress(Math.min(elapsed / RECORD_SECONDS, 1));
      }, 100);

      // Auto-stop after RECORD_SECONDS
      setTimeout(() => {
        stopRecording();
        setState('processing');
        setProgress(1);

        try {
          const allSamples = mergeBuffers(chunksRef.current, totalSamplesRef.current);
          const wavBuffer = encodeWAV(allSamples, sampleRate);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          console.log(`WAV size: ${(wavBlob.size / 1024).toFixed(1)} KB, sampleRate: ${sampleRate}`);
          resolve(wavBlob);
        } catch (encErr) {
          setState('error');
          setError('Failed to encode audio');
          reject(encErr);
        }
      }, RECORD_SECONDS * 1000);
    });
  }, [stopRecording]);

  const reset = useCallback(() => {
    stopRecording();
    setState('idle');
    setProgress(0);
    setError(null);
    chunksRef.current = [];
    totalSamplesRef.current = 0;
  }, [stopRecording]);

  return { state, progress, error, record, reset };
}
