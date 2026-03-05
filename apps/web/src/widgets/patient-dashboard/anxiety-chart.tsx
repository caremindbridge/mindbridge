'use client';

import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

interface AnxietyData {
  anxietyLevel: number | null;
  depressionLevel: number | null;
  createdAt: string;
}

interface AnxietyChartProps {
  analyses: AnxietyData[];
}

export function AnxietyChart({ analyses }: AnxietyChartProps) {
  if (!analyses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anxiety & Depression</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No session data in this period</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...analyses].reverse().map((a) => ({
    date: format(new Date(a.createdAt), 'MMM d'),
    anxiety: a.anxietyLevel,
    depression: a.depressionLevel,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anxiety & Depression</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} ticks={[0, 2, 4, 6, 8, 10]} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="anxiety"
              name="Anxiety"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="depression"
              name="Depression"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
