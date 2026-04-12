'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef } from 'react';

import type { ChatMessage } from '@/features/chat';
import { cn } from '@/shared/lib/utils';
import { MarkdownMessage } from '@/shared/ui/markdown-message';
import { ScrollArea } from '@/shared/ui';

interface ChatWindowProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

const PROSE =
  'prose prose-sm dark:prose-invert max-w-none ' +
  'prose-p:my-1.5 prose-p:leading-relaxed ' +
  'prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold ' +
  'prose-strong:font-semibold prose-strong:text-foreground ' +
  'prose-ul:my-1.5 prose-li:my-0.5 ' +
  'prose-blockquote:border-l-primary/30 prose-blockquote:not-italic prose-blockquote:text-muted-foreground ' +
  'prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md ' +
  'prose-code:before:content-none prose-code:after:content-none ' +
  'prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-0 prose-pre:overflow-hidden';

function MiraAvatar() {
  return (
    <div className="mira-avatar-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
      <Sparkles className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="message-bubble flex justify-end">
        <div
          data-ph-mask
          className="user-bubble-gradient max-w-[260px] rounded-2xl rounded-tr-none px-3.5 py-3.5 text-sm shadow-[0_2px_6px_#C4856F20]"
        >
          <p className="whitespace-pre-wrap leading-relaxed text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-bubble flex gap-2.5">
      <MiraAvatar />
      <div
        data-ph-mask
        className={cn(
          'max-w-[260px] rounded-2xl rounded-tl-none bg-white px-3.5 py-3.5 shadow-[0_1px_4px_#0000000A] dark:bg-[#221E1B] dark:shadow-[0_1px_4px_#00000020]',
          PROSE,
        )}
      >
        <MarkdownMessage content={message.content} isStreaming={message.isStreaming} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <MiraAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-white px-3.5 py-3.5 shadow-[0_1px_4px_#0000000A] dark:bg-[#221E1B] dark:shadow-[0_1px_4px_#00000020]">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#C4856F]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#C4856F]" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#C4856F]" />
      </div>
    </div>
  );
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const t = useTranslations('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(messages.length);

  const scrollToBottom = useCallback((smooth: boolean) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'end' });
  }, []);

  // Smooth scroll only when a new message is added (not on every content update)
  useEffect(() => {
    const isNewMessage = messages.length !== msgCountRef.current;
    msgCountRef.current = messages.length;
    scrollToBottom(isNewMessage);
  }, [messages.length, messages[messages.length - 1]?.content, scrollToBottom]);

  const lastIsStreaming = messages.at(-1)?.isStreaming;
  const showTypingIndicator = isStreaming && !lastIsStreaming;

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <div className="mira-avatar-gradient mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">{t('chatEmptyTitle')}</h3>
            <p className="max-w-sm text-sm">{t('chatEmptyDesc')}</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message._key ?? message.id} message={message} />
        ))}

        {showTypingIndicator && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
