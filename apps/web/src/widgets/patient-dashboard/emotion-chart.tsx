'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

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
  const t = useTranslations('dashboard');
  const tm = useTranslations('mood');
  const { data: emotions, isLoading } = useEmotionDistribution(from, to);

  if (isLoading) {
    return <Skeleton className="h-[370px] w-full rounded-xl" />;
  }

  if (!emotions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('emotionDistribution')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('noEmotionData')}</p>
        </CardContent>
      </Card>
    );
  }

  const emotionKeyMap: Record<string, string> = {
    anxiety: 'emotionAnxiety',
    sadness: 'emotionSadness',
    joy: 'emotionJoy',
    calm: 'emotionCalm',
    irritation: 'emotionIrritation',
    fear: 'emotionFear',
    anger: 'emotionAnger',
    hope: 'emotionHope',
    loneliness: 'emotionLoneliness',
    gratitude: 'emotionGratitude',
  };

  const chartData = emotions.map(({ emotion, count }) => ({
    emotion,
    label: emotionKeyMap[emotion] ? tm(emotionKeyMap[emotion] as Parameters<typeof tm>[0]) : emotion,
    count,
  }));

  const barHeight = 32;
  const chartHeight = Math.max(200, chartData.length * barHeight + 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('emotionDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 32, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={90}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map(({ emotion }) => (
                <Cell key={emotion} fill={EMOTION_COLORS[emotion] ?? DEFAULT_COLOR} />
              ))}
              <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
