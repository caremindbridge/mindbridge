import { ChatPage } from '@/views/chat';

export default function ChatSessionRoute({
  params,
}: {
  params: { sessionId: string };
}) {
  return <ChatPage sessionId={params.sessionId} />;
}
