'use client';

import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui';

interface SendMessageFormProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function SendMessageForm({ onSend, disabled }: SendMessageFormProps) {
  const t = useTranslations('chat');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: shrink to auto first so it can shrink back, then grow to scrollHeight
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
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
    <div className="border-t bg-background/80 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={disabled}
            rows={1}
            className="max-h-[200px] min-h-[44px] flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            size="icon"
            className="mb-[6px] mr-2 h-8 w-8 shrink-0 rounded-full"
            onClick={handleSend}
            disabled={!content.trim() || disabled}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
