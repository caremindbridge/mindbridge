'use client';

import { User } from 'lucide-react';
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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush-100">
      <span className="text-sm">🌿</span>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
      <User className="h-4 w-4" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="message-bubble flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <UserAvatar />
      </div>
    );
  }

  return (
    <div className="message-bubble flex gap-3">
      <MiraAvatar />
      <div className={cn('max-w-[85%] rounded-2xl rounded-bl-md bg-muted/60 px-4 py-2.5', PROSE)}>
        <MarkdownMessage content={message.content} isStreaming={message.isStreaming} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <MiraAvatar />
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const t = useTranslations('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, messages[messages.length - 1]?.content, scrollToBottom]);

  const lastIsStreaming = messages.at(-1)?.isStreaming;
  const showTypingIndicator = isStreaming && !lastIsStreaming;

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blush-100 text-3xl">
              🌿
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
