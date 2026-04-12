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
