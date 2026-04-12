# Voice Input (Whisper Transcription) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mic button to `SendMessageForm` that records audio via MediaRecorder, sends it to a new `POST /api/chat/transcribe` backend endpoint, and inserts the Whisper-transcribed text into the textarea.

**Architecture:** New backend method `ChatService.transcribeAudio` proxies audio blobs to OpenAI Whisper and enforces a 10 req/min Redis rate limit per user. A new React hook `useVoiceRecorder` manages MediaRecorder + Web Audio waveform state and calls the endpoint. `SendMessageForm` conditionally renders idle/recording/processing UI states.

**Tech Stack:** NestJS `FileInterceptor` (multer bundled in `@nestjs/platform-express`), `@types/multer`, OpenAI Whisper API (`whisper-1`), MediaRecorder API, Web Audio API `AnalyserNode`, `requestAnimationFrame`, `next-intl` `useLocale`.

---

## File Map

| Action   | Path                                                          | Responsibility |
|----------|---------------------------------------------------------------|----------------|
| Install  | `apps/api` devDependencies                                    | `@types/multer` for `Express.Multer.File` TS type |
| Modify   | `apps/api/.env.example`                                       | Add `OPENAI_API_KEY=` |
| Modify   | `apps/api/src/modules/chat/chat.service.ts`                   | Add `transcribeAudio(buffer, mime, userId, language?)` |
| Modify   | `apps/api/src/modules/chat/chat.controller.ts`                | Add `POST /chat/transcribe` with `FileInterceptor` |
| Create   | `apps/web/src/features/chat/use-voice-recorder.ts`            | MediaRecorder + Web Audio hook (state machine: idle→recording→processing) |
| Create   | `apps/web/src/features/chat/voice-waveform.tsx`               | Animated bar waveform (32 CSS divs, heights driven by FFT data) |
| Modify   | `apps/web/src/features/chat/send-message-form.tsx`            | Integrate voice hook + conditional UI |
| Modify   | `apps/web/src/features/chat/index.ts`                         | Export `useVoiceRecorder`, `VoiceWaveform` |
| Modify   | `apps/web/messages/en.json`                                   | Add `chat.mic`, `chat.transcribing`, `chat.micDenied`, `chat.tooShort`, `chat.transcribeError` |
| Modify   | `apps/web/messages/ru.json`                                   | Same keys in Russian |

---

## Task 1: Backend — Install types, env, and `transcribeAudio` service method

**Files:**
- Install dev dep: `apps/api` (add `@types/multer`)
- Modify: `apps/api/.env.example`
- Modify: `apps/api/src/modules/chat/chat.service.ts`

- [ ] **Step 1.1: Install `@types/multer`**

```bash
cd apps/api && npm install -D @types/multer
```

Expected: resolves `@types/multer` in `apps/api/node_modules`, no errors.

- [ ] **Step 1.2: Add `OPENAI_API_KEY` to `.env.example` and your local `.env`**

In `apps/api/.env.example`, add after `ANTHROPIC_MODEL=...`:

```
OPENAI_API_KEY=
```

Also add to your actual `apps/api/.env`:

```
OPENAI_API_KEY=sk-...your-key...
```

- [ ] **Step 1.3: Add `transcribeAudio` to `ChatService`**

At the top of `apps/api/src/modules/chat/chat.service.ts`, add `InternalServerErrorException` and `TooManyRequestsException` to the `@nestjs/common` import:

```typescript
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
```

At the **bottom** of the `ChatService` class (before the closing `}`), add:

```typescript
async transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  userId: string,
  language?: string,
): Promise<{ text: string }> {
  // Rate limit: 10 transcriptions per minute per user
  const key = `ratelimit:transcribe:${userId}`;
  const count = await this.redisService.incrementRateLimit(key, 60);
  if (count > 10) {
    throw new TooManyRequestsException('Transcription rate limit exceeded: 10 per minute');
  }

  const formData = new FormData();
  const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
  formData.append('file', new Blob([buffer], { type: mimeType }), `audio.${ext}`);
  formData.append('model', 'whisper-1');
  if (language) formData.append('language', language);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    this.logger.error(`Whisper API error: ${err}`);
    throw new InternalServerErrorException('Transcription failed');
  }

  const data = (await res.json()) as { text: string };
  return { text: data.text };
}
```

- [ ] **Step 1.4: Typecheck**

```bash
cd /path/to/repo && npx turbo typecheck --filter=@mindbridge/api
```

Expected: no errors.

- [ ] **Step 1.5: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json apps/api/.env.example apps/api/src/modules/chat/chat.service.ts
git commit -m "feat(api): add transcribeAudio to ChatService with rate limiting"
```

---

## Task 2: Backend — `POST /chat/transcribe` controller endpoint

**Files:**
- Modify: `apps/api/src/modules/chat/chat.controller.ts`

- [ ] **Step 2.1: Add `FileInterceptor` imports to the controller**

Update the `@nestjs/common` import block at the top of `apps/api/src/modules/chat/chat.controller.ts`:

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
```

- [ ] **Step 2.2: Add `transcribe` endpoint to `ChatController`**

After the `deleteSession` method (before the closing `}`), add:

```typescript
@Post('transcribe')
@UseInterceptors(
  FileInterceptor('audio', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — Whisper hard limit
  }),
)
async transcribe(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: { id: string },
  @Body('language') language?: string,
) {
  if (!file) throw new BadRequestException('No audio file provided');
  return this.chatService.transcribeAudio(file.buffer, file.mimetype, user.id, language);
}
```

- [ ] **Step 2.3: Typecheck**

```bash
npx turbo typecheck --filter=@mindbridge/api
```

Expected: no errors.

- [ ] **Step 2.4: Smoke-test the endpoint manually**

Start the API: `cd apps/api && npm run dev`

```bash
# Record a short .webm file first (or use any existing audio file)
curl -X POST http://localhost:3001/api/chat/transcribe \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "audio=@/path/to/test.webm" \
  -F "language=en"
```

Expected: `{"text":"...transcribed content..."}` or a meaningful error if `OPENAI_API_KEY` is not set.

- [ ] **Step 2.5: Commit**

```bash
git add apps/api/src/modules/chat/chat.controller.ts
git commit -m "feat(api): POST /chat/transcribe proxies audio to Whisper API"
```

---

## Task 3: Frontend — `useVoiceRecorder` hook

**Files:**
- Create: `apps/web/src/features/chat/use-voice-recorder.ts`

- [ ] **Step 3.1: Create the hook file**

Create `apps/web/src/features/chat/use-voice-recorder.ts` with this content:

```typescript
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
```

- [ ] **Step 3.2: Typecheck**

```bash
npx turbo typecheck --filter=@mindbridge/web
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add apps/web/src/features/chat/use-voice-recorder.ts
git commit -m "feat(web): add useVoiceRecorder hook (MediaRecorder + Web Audio + Whisper)"
```

---

## Task 4: Frontend — `VoiceWaveform` component and i18n keys

**Files:**
- Create: `apps/web/src/features/chat/voice-waveform.tsx`
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/ru.json`

- [ ] **Step 4.1: Create `VoiceWaveform`**

Create `apps/web/src/features/chat/voice-waveform.tsx`:

```typescript
'use client';

interface VoiceWaveformProps {
  levels: number[];
}

export function VoiceWaveform({ levels }: VoiceWaveformProps) {
  return (
    <div className="flex flex-1 items-center justify-center gap-[2px]">
      {levels.map((v, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-[#C4856F] transition-[height] duration-75 dark:bg-[#D4A89A]"
          style={{ height: `${Math.max(4, v * 28)}px` }}
        />
      ))}
      {/* Placeholder bars while analyser warms up */}
      {levels.length === 0 &&
        Array.from({ length: 32 }, (_, i) => (
          <div key={i} className="h-1 w-[3px] rounded-full bg-[#C4856F]/40 dark:bg-[#D4A89A]/40" />
        ))}
    </div>
  );
}
```

- [ ] **Step 4.2: Add i18n keys to `en.json`**

In `apps/web/messages/en.json`, inside the `"chat"` object, add these keys after `"sessionInProgress"`:

```json
"mic": "Voice input",
"transcribing": "Transcribing...",
"micDenied": "Microphone access denied. Enable it in browser settings.",
"micUnavailable": "Microphone is not available in this browser.",
"tooShort": "Recording too short, try again.",
"transcribeError": "Couldn't transcribe audio. Please try again."
```

- [ ] **Step 4.3: Add i18n keys to `ru.json`**

In `apps/web/messages/ru.json`, inside the `"chat"` object, add after `"sessionInProgress"`:

```json
"mic": "Голосовой ввод",
"transcribing": "Распознаю...",
"micDenied": "Доступ к микрофону запрещён. Разрешите в настройках браузера.",
"micUnavailable": "Микрофон недоступен в этом браузере.",
"tooShort": "Запись слишком короткая, попробуйте ещё раз.",
"transcribeError": "Не удалось распознать аудио. Попробуйте ещё раз."
```

- [ ] **Step 4.4: Typecheck**

```bash
npx turbo typecheck --filter=@mindbridge/web
```

Expected: no errors.

- [ ] **Step 4.5: Commit**

```bash
git add apps/web/src/features/chat/voice-waveform.tsx apps/web/messages/en.json apps/web/messages/ru.json
git commit -m "feat(web): add VoiceWaveform component and voice i18n keys"
```

---

## Task 5: Frontend — Integrate voice into `SendMessageForm` + update exports

**Files:**
- Modify: `apps/web/src/features/chat/send-message-form.tsx`
- Modify: `apps/web/src/features/chat/index.ts`

- [ ] **Step 5.1: Rewrite `send-message-form.tsx`**

Replace the entire contents of `apps/web/src/features/chat/send-message-form.tsx` with:

```typescript
'use client';

import { ArrowUp, Check, Loader2, Mic, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { VoiceWaveform } from './voice-waveform';
import { useVoiceRecorder } from './use-voice-recorder';

interface SendMessageFormProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SendMessageForm({ onSend, disabled }: SendMessageFormProps) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = content.trim().length > 0;

  const { state: voiceState, levels, duration, error, start, stop, cancel } = useVoiceRecorder(
    (text) => setContent((prev) => (prev ? `${prev} ${text}` : text)),
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [content]);

  // Surface voice errors as toasts
  useEffect(() => {
    if (!error) return;
    const messages: Record<string, string> = {
      micDenied: t('micDenied'),
      micUnavailable: t('micUnavailable'),
      tooShort: t('tooShort'),
      transcribeError: t('transcribeError'),
    };
    toast.error(messages[error] ?? error);
  }, [error, t]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (voiceState === 'idle') start();
  };

  return (
    <div className="shrink-0 border-t border-[#EDE8E4] bg-white px-4 pb-2 pt-3 dark:border-[#2E2824] dark:bg-[#221E1B]">
      <div className="mx-auto flex max-w-3xl items-end gap-2.5">
        {/* Attach button — always visible */}
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F2EF] transition-colors hover:bg-[#EDE8E4] dark:bg-[#2E2824] dark:hover:bg-[#3A332E]"
        >
          <Plus className="h-5 w-5 text-[#9A8880]" />
        </button>

        {/* ── IDLE: normal textarea + mic/send ── */}
        {voiceState === 'idle' && (
          <>
            <div className="relative flex flex-1 items-end rounded-[22px] bg-[#F5F2EF] transition-shadow focus-within:ring-2 focus-within:ring-[#C4856F40] dark:bg-[#2E2824]">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                disabled={disabled}
                rows={1}
                className="max-h-[120px] min-h-[44px] flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-sm leading-5 text-[#2B2320] outline-none placeholder:text-[#B0A098] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#E8E0D8] dark:placeholder:text-[#7A6F65]"
              />
            </div>

            <button
              type="button"
              onClick={hasContent ? handleSend : handleMicClick}
              disabled={disabled}
              aria-label={hasContent ? t('send') : t('mic')}
              className="send-button-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-[0_2px_8px_#C4856F30] transition-opacity disabled:opacity-50"
            >
              {hasContent ? (
                <ArrowUp className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </button>
          </>
        )}

        {/* ── RECORDING: waveform + cancel + stop ── */}
        {voiceState === 'recording' && (
          <div className="flex flex-1 items-center gap-2 rounded-[22px] bg-[#F5F2EF] px-3 py-2 dark:bg-[#2E2824]">
            {/* Cancel */}
            <button
              type="button"
              onClick={cancel}
              aria-label="Cancel recording"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Live waveform */}
            <VoiceWaveform levels={levels} />

            {/* Timer */}
            <span className="shrink-0 font-mono text-xs tabular-nums text-[#9A8880] dark:text-[#A09A93]">
              {formatDuration(duration)}
            </span>

            {/* Stop + transcribe */}
            <button
              type="button"
              onClick={() => stop(locale)}
              aria-label="Stop and transcribe"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#C4856F] text-white transition-opacity hover:opacity-90 dark:bg-[#D4A89A] dark:text-[#1A1614]"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── PROCESSING: spinner ── */}
        {voiceState === 'processing' && (
          <div className="flex flex-1 items-center gap-2.5 rounded-[22px] bg-[#F5F2EF] px-4 py-3 dark:bg-[#2E2824]">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#C4856F] dark:text-[#D4A89A]" />
            <span className="text-sm text-[#9A8880] dark:text-[#A09A93]">{t('transcribing')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Update `index.ts` exports**

Replace `apps/web/src/features/chat/index.ts` with:

```typescript
export { EndSessionButton } from './end-session-button';
export { SendMessageForm } from './send-message-form';
export { StartSessionButton } from './start-session-button';
export type { ChatMessage } from './use-chat-stream';
export { useChatStream } from './use-chat-stream';
export { useVoiceRecorder } from './use-voice-recorder';
export type { VoiceRecorderState } from './use-voice-recorder';
export { VoiceWaveform } from './voice-waveform';
```

- [ ] **Step 5.3: Typecheck both apps**

```bash
npx turbo typecheck
```

Expected: no errors in either `@mindbridge/api` or `@mindbridge/web`.

- [ ] **Step 5.4: Commit**

```bash
git add apps/web/src/features/chat/send-message-form.tsx apps/web/src/features/chat/index.ts
git commit -m "feat(web): integrate voice recording into SendMessageForm"
```

---

## Task 6: Manual smoke-test checklist

Run `npx turbo dev` (both API on :3001 and Web on :3000 must be running, plus Docker for Redis/Postgres).

- [ ] **6.1 Desktop Chrome**: Open `/dashboard/chat/<active-session-id>`. Click mic → browser permission popup → allow → waveform bars animate → speak → ✓ button → spinner → text appears in textarea. Type more and send.
- [ ] **6.2 Cancel flow**: Click mic → speak → click X → nothing sent to Whisper, textarea unchanged.
- [ ] **6.3 Too-short recording**: Click mic → immediately ✓ → toast "Recording too short, try again."
- [ ] **6.4 Permission denied**: In Chrome DevTools → Application → Permissions → Block microphone → click mic → toast with denied message. After unblocking, mic works again.
- [ ] **6.5 Browser unsupported guard**: In DevTools console run `delete window.MediaRecorder` then click mic → "Microphone is not available in this browser" toast.
- [ ] **6.6 Russian transcription**: Switch app locale to RU. Record Russian phrase → Whisper returns Cyrillic text.
- [ ] **6.7 Text appending**: Type "Hello" in textarea → record "world" → transcribed text becomes "Hello world".
- [ ] **6.8 Inactive session**: On an ended session, `SendMessageForm` is not rendered — no mic to test, confirm no console errors.
- [ ] **6.9 Rate limit**: Make 11 rapid back-to-back recordings (< 1 min) → 11th shows transcribeError toast (backend returns 429).
- [ ] **6.10 `npx turbo build`**: Full production build passes.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task covering it |
|-----------------|-----------------|
| `POST /chat/transcribe` backend endpoint | Task 2 |
| `FileInterceptor` with 25 MB limit | Task 2 Step 2.2 |
| Whisper API call with `whisper-1` | Task 1 Step 1.3 |
| 10 req/min rate limiting per user | Task 1 Step 1.3 |
| `useVoiceRecorder` hook | Task 3 |
| MediaRecorder with format fallback for iOS Safari | Task 3 Step 3.1 (`pickMimeType`) |
| Web Audio API waveform (AnalyserNode + FFT) | Task 3 Step 3.1 |
| `VoiceWaveform` CSS bars component | Task 4 Step 4.1 |
| Idle / recording / processing UI in SendMessageForm | Task 5 Step 5.1 |
| Guard: mic unavailable (old browser / non-HTTPS) | Task 3 Step 3.1, Task 5 Step 5.1 |
| Guard: recording too short (< 1 KB) | Task 3 Step 3.1 |
| iOS AudioContext `resume()` after getUserMedia | Task 3 Step 3.1 |
| Haptic feedback `navigator.vibrate` | Task 3 Step 3.1 |
| EN + RU i18n keys | Task 4 Steps 4.2-4.3 |
| `OPENAI_API_KEY` env var | Task 1 Step 1.2 |
| `@types/multer` install | Task 1 Step 1.1 |
| Cancel without Whisper call | Task 3 Step 3.1 (`cancel`) |
| Text appending to existing input | Task 5 Step 5.1 (`onTranscribed` callback) |

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency check:**
- `transcribeAudio(buffer: Buffer, mimeType: string, userId: string, language?: string)` — defined in Task 1, called in Task 2 with same signature ✓
- `useVoiceRecorder(onTranscribed)` returns `{ state, levels, duration, error, start, stop, cancel }` — defined in Task 3, consumed in Task 5 ✓
- `stop(locale: string)` — called in Task 5 with `locale` from `useLocale()` ✓
- `VoiceWaveform({ levels: number[] })` — defined in Task 4, used in Task 5 ✓
- Cookie name `'token'` — `getAuthToken()` uses this (confirmed from `client.ts`) ✓
- API path `${env.apiUrl}/api/chat/transcribe` — matches controller route `@Controller('chat')` + `@Post('transcribe')` ✓
