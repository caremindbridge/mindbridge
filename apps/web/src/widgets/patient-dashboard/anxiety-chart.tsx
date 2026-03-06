'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
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
  const t = useTranslations('dashboard');

  if (!analyses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('anxietyDepression')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('noSessionData')}</p>
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
        <CardTitle>{t('anxietyDepression')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={40} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} ticks={[0, 3, 6, 10]} width={28} />
            <Tooltip />
            <Legend />
            <ReferenceLine
              y={3}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              label={{ value: t('levelLow'), position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine
              y={6}
              stroke="hsl(var(--border))"
              strokeDasharray="4 4"
              label={{ value: t('levelModerate'), position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="anxiety"
              name={t('anxietyLevel')}
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="depression"
              name={t('depressionLevel')}
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            0–3: {t('levelLow')}
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
            4–6: {t('levelModerate')}
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />
            7–10: {t('levelHigh')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
