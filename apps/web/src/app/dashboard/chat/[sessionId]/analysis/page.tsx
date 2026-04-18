import { SessionAnalysisPage } from '@/views/session-analysis';

export default function AnalysisRoute({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: { direct?: string };
}) {
  return (
    <SessionAnalysisPage
      sessionId={params.sessionId}
      direct={searchParams.direct === 'true'}
    />
  );
}
