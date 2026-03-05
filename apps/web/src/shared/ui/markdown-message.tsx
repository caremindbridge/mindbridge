'use client';

import { code } from '@streamdown/code';
import { memo } from 'react';
import { Streamdown } from 'streamdown';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
}

const PLUGINS = { code };

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  isStreaming = false,
}: MarkdownMessageProps) {
  return (
    <Streamdown
      mode={isStreaming ? 'streaming' : 'static'}
      animated={isStreaming}
      isAnimating={isStreaming}
      plugins={PLUGINS}
    >
      {content}
    </Streamdown>
  );
});
