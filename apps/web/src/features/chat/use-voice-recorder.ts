'use client';

import { useCallback, useRef, useState } from 'react';

import { getAuthToken } from '@/shared/api/client';
import { env } from '@/shared/config/env';

export type VoiceRecorderState = 'idle' | 'recording' | 'processing';

interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  /** Normalised 0–1 frequency levels (32 bins) updated at ~30fps during recording */
  levels: number[];
  /** Elapsed recording time in whole seconds */
  duration: number;
  /** Error code — shown as toast / inline message */
  error: string | null;
  start: () => Promise<void>;
  stop: (locale: string) => Promise<void>;
  cancel: () => void;
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export function useVoiceRecorder(
  onTranscribed: (text: string) => void,
): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [levels, setLevels] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  // Stable ref so `stop` always sees the latest `onTranscribed` without being
  // recreated on every render.
  const onTranscribedRef = useRef(onTranscribed);
  onTranscribedRef.current = onTranscribed;

  const cleanupRefs = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timerRef.current !== null) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    mediaRecorderRef.current = null;
    rafRef.current = null;
    timerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);

    // Guard: MediaRecorder not available (old browsers / non-HTTPS)
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('micUnavailable');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Web Audio — waveform analyser
      const AudioCtx =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;

      // MediaRecorder
      const mime = pickMimeType();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100); // collect in 100 ms chunks
      mediaRecorderRef.current = mr;

      // Duration counter — 1 second granularity
      startTimeRef.current = Date.now();
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Waveform loop at ~30fps
      const frequencyBuffer = new Uint8Array(analyser.frequencyBinCount);
      let frame = 0;
      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        frame++;
        if (frame % 2 !== 0) return; // ~30 fps
        analyser.getByteFrequencyData(frequencyBuffer);
        const bars = 32;
        const step = Math.floor(frequencyBuffer.length / bars);
        const out: number[] = [];
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += frequencyBuffer[i * step + j];
          out.push(sum / step / 255);
        }
        setLevels(out);
      };
      tick();

      setState('recording');

      // Haptic feedback on supported devices
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (e) {
      const name = e instanceof Error ? e.name : '';
      setError(name === 'NotAllowedError' ? 'micDenied' : 'micError');
      setState('idle');
    }
  }, []);

  const stop = useCallback(async (locale: string) => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;

    const mime = mr.mimeType || 'audio/webm';

    const blobReady = new Promise<Blob>((resolve) => {
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: mime }));
    });
    mr.stop();
    const blob = await blobReady;
    cleanupRefs();

    // Guard: recording too short for Whisper (< 1 KB ≈ < ~0.5s)
    if (blob.size < 1000) {
      setState('idle');
      setLevels([]);
      setDuration(0);
      setError('tooShort');
      return;
    }

    setState('processing');

    try {
      const fd = new FormData();
      const ext = mime.includes('webm') ? 'webm' : 'mp4';
      fd.append('audio', blob, `rec.${ext}`);
      fd.append('language', locale);

      const token = getAuthToken();
      const res = await fetch(`${env.apiUrl}/api/chat/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) throw new Error(`transcribe ${res.status}`);

      const { text } = (await res.json()) as { text: string };
      onTranscribedRef.current(text);
    } catch {
      setError('transcribeError');
    } finally {
      setState('idle');
      setLevels([]);
      setDuration(0);
    }
  }, [cleanupRefs]);

  const cancel = useCallback(() => {
    // Stop MediaRecorder without resolving the blob promise — just discard
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null; // prevent blob resolution
      mediaRecorderRef.current.stop();
    }
    cleanupRefs();
    setState('idle');
    setLevels([]);
    setDuration(0);
  }, [cleanupRefs]);

  return { state, levels, duration, error, start, stop, cancel };
}
