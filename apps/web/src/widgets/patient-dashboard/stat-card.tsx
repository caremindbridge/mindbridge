'use client';

import type { ReactNode } from 'react';

import { Card, CardContent } from '@/shared/ui';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
}

export function StatCard({ icon, label, value, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-muted-foreground">{icon}</div>
          <div className="flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-bold">{value}</p>
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
