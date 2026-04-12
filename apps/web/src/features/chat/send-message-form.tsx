'use client';

import { ArrowUp, Mic, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface SendMessageFormProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function SendMessageForm({ onSend, disabled }: SendMessageFormProps) {
  const t = useTranslations('chat');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = content.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [content]);

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

  return (
    <div className="shrink-0 border-t border-[#EDE8E4] bg-white px-4 pb-2 pt-3 dark:border-[#2E2824] dark:bg-[#221E1B]">
      <div className="mx-auto flex max-w-3xl items-end gap-2.5">
        {/* Attach button */}
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F5F2EF] transition-colors hover:bg-[#EDE8E4] dark:bg-[#2E2824] dark:hover:bg-[#3A332E]"
        >
          <Plus className="h-5 w-5 text-[#9A8880]" />
        </button>

        {/* Text input pill */}
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

        {/* Mic / Send button */}
        <button
          type="button"
          onClick={hasContent ? handleSend : undefined}
          disabled={disabled}
          className="send-button-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-[0_2px_8px_#C4856F30] transition-opacity disabled:opacity-50"
        >
          {hasContent ? (
            <ArrowUp className="h-5 w-5 text-white" />
          ) : (
            <Mic className="h-5 w-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
