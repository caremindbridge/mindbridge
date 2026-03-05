'use client';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

interface WeeklyInsightProps {
  insight: string | null;
  topics: Array<{ topic: string; count: number }>;
}

export function WeeklyInsight({ insight, topics }: WeeklyInsightProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insight ? (
          <p className="rounded-lg border border-blush-200 bg-blush-50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
            {insight}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete a CBT session to see personalized insights.
          </p>
        )}
        {topics.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top Topics
            </p>
            <div className="flex flex-wrap gap-2">
              {topics.map(({ topic, count }) => (
                <Badge key={topic} variant="secondary">
                  {topic} · {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
