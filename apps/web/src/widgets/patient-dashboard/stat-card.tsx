'use client';

import type { ReactNode } from 'react';

import { Card, CardContent } from '@/shared/ui';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  compact?: boolean;
}

export function StatCard({ icon, label, value, description, trend, compact }: StatCardProps) {
  return (
    <Card>
      <CardContent className={compact ? 'p-3 md:p-6' : 'p-6'}>
        <div className={compact ? 'flex items-start gap-2 md:gap-3' : 'flex items-start gap-3'}>
          <div className={compact ? 'mt-0.5 hidden shrink-0 text-muted-foreground md:block' : 'mt-0.5 shrink-0 text-muted-foreground'}>{icon}</div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className={compact ? 'text-xs leading-tight text-muted-foreground md:text-sm' : 'text-sm text-muted-foreground'}>{label}</p>
            <div className="flex items-center gap-1.5">
              <p className={compact ? 'text-xl font-bold md:text-2xl' : 'text-2xl font-bold'}>{value}</p>
              {trend && (
                <span
                  className={
                    trend === 'up'
                      ? 'text-emerald-500'
                      : trend === 'down'
                        ? 'text-rose-500'
                        : 'text-muted-foreground'
                  }
                >
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
