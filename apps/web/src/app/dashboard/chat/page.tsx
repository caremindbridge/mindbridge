import type { Metadata } from 'next';

import { ChatSessionsPage } from '@/views/chat-sessions';

export const metadata: Metadata = { title: 'Sessions' };

export default function ChatRoute() {
  return <ChatSessionsPage />;
}
