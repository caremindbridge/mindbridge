import { SessionAnalysisPage } from '@/views/session-analysis';

export default function AnalysisRoute({
  params,
}: {
  params: { sessionId: string };
}) {
  return <SessionAnalysisPage sessionId={params.sessionId} />;
}
