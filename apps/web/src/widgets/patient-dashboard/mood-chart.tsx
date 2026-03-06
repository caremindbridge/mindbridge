'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useMoods } from '@/entities/mood';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

interface MoodChartProps {
  from?: string;
  to?: string;
}

export function MoodChart({ from, to }: MoodChartProps) {
  const t = useTranslations('dashboard');
  const { data: moods, isLoading } = useMoods(from, to);

  if (isLoading) {
    return <Skeleton className="h-[370px] w-full rounded-xl" />;
  }

  if (!moods?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('moodOverTime')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('noMoodData')}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = moods.map((m) => ({
    date: format(new Date(m.createdAt), 'MMM d'),
    mood: m.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('moodOverTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={40} />
            <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} ticks={[1, 3, 5, 7, 10]} width={28} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mood"
              name={t('avgMood')}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
