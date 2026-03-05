'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { createPackCheckout } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { Badge, Button, Dialog, DialogContent, DialogTitle, Separator } from '@/shared/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  usage?: UsageStatus;
}

const PACKS = [
  { id: 'pack_50', messages: 50, price: '$2.99' },
  { id: 'pack_150', messages: 150, price: '$6.99', popular: true },
  { id: 'pack_400', messages: 400, price: '$14.99', bestValue: true },
];

export function MonthlyLimitModal({ open, onClose, usage }: Props) {
  const t = useTranslations('subscription');

  const handleBuyPack = async (packId: string) => {
    try {
      const { url } = await createPackCheckout(packId);
      if (url) {
        window.location.href = url;
      } else {
        toast.info('Payments coming soon!');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const resetDate = usage?.periodEnd
    ? new Date(usage.periodEnd).toLocaleDateString()
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t('monthlyLimitTitle')}</DialogTitle>
        <p className="text-sm text-muted-foreground">{t('monthlyLimitDescription')}</p>
        {resetDate && (
          <p className="text-xs text-muted-foreground">{t('resetsOn', { date: resetDate })}</p>
        )}

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('getMoreMessages')}</p>
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleBuyPack(pack.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50',
                pack.popular && 'border-primary/50 bg-primary/5',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{pack.messages} messages</span>
                {pack.popular && <Badge className="text-[10px]">Popular</Badge>}
                {pack.bestValue && (
                  <Badge variant="secondary" className="text-[10px]">
                    Best Value
                  </Badge>
                )}
              </div>
              <span className="font-semibold">{pack.price}</span>
            </button>
          ))}
        </div>

        <Separator />

        <Button variant="outline" className="w-full" asChild>
          <Link href="/pricing">{t('upgradePlan')}</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
