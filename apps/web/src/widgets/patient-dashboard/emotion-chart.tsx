'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useEmotionDistribution } from '@/entities/mood';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

const EMOTION_COLORS: Record<string, string> = {
  anxiety: 'hsl(35, 75%, 55%)',
  sadness: 'hsl(240, 40%, 58%)',
  joy: 'hsl(152, 45%, 45%)',
  calm: 'hsl(195, 75%, 42%)',
  irritation: 'hsl(25, 80%, 55%)',
  fear: 'hsl(260, 45%, 58%)',
  anger: 'hsl(0, 60%, 55%)',
  hope: 'hsl(80, 50%, 45%)',
  loneliness: 'hsl(215, 15%, 48%)',
  gratitude: 'hsl(330, 60%, 55%)',
};

const DEFAULT_COLOR = 'hsl(25, 10%, 60%)';

interface EmotionChartProps {
  from?: string;
  to?: string;
}

export function EmotionChart({ from, to }: EmotionChartProps) {
  const { data: emotions, isLoading } = useEmotionDistribution(from, to);

  if (isLoading) {
    return <Skeleton className="h-[370px] w-full rounded-xl" />;
  }

  if (!emotions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotion Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No emotion data in this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotion Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={emotions}
              dataKey="count"
              nameKey="emotion"
              cx="50%"
              cy="45%"
              outerRadius={90}
            >
              {emotions.map(({ emotion }) => (
                <Cell key={emotion} fill={EMOTION_COLORS[emotion] ?? DEFAULT_COLOR} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, String(name)]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
