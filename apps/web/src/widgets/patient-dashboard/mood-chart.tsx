'use client';

import { format } from 'date-fns';
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
  const { data: moods, isLoading } = useMoods(from, to);

  if (isLoading) {
    return <Skeleton className="h-[370px] w-full rounded-xl" />;
  }

  if (!moods?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No mood entries in this period</p>
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
        <CardTitle>Mood Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} ticks={[1, 3, 5, 7, 10]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="mood"
              name="Mood"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
