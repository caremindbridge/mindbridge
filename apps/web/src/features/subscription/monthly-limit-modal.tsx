'use client';

import type { UsageStatus } from '@mindbridge/types/src/subscription';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { createPackCheckout } from '@/shared/api/client';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Badge, Button, Separator } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

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
  const tc = useTranslations('common');
  const tp = useTranslations('pricing');

  const handleBuyPack = async (packId: string) => {
    try {
      const { url } = await createPackCheckout(packId);
      if (url) {
        window.location.href = url;
      } else {
        toast.info(tp('comingSoon'));
      }
    } catch {
      toast.error(tc('error'));
    }
  };

  const resetDate = usage?.periodEnd
    ? new Date(usage.periodEnd).toLocaleDateString()
    : '';
  const isTrialUser = !usage?.plan || usage.plan === 'trial';

  return (
    <BottomSheet open={open} onOpenChange={onClose} title={t('monthlyLimitTitle')}>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('monthlyLimitDescription')}</p>
          {resetDate && (
            <p className="text-xs text-muted-foreground mt-1">{t('resetsOn', { date: resetDate })}</p>
          )}
        </div>

        <Separator />

        {isTrialUser ? (
          <p className="text-sm text-muted-foreground">{t('packsRequirePlan')}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('getMoreMessages')}</p>
            {PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleBuyPack(pack.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 active:bg-muted/50',
                  pack.popular && 'border-primary/50 bg-primary/5',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tp('packMessages', { count: pack.messages })}</span>
                  {pack.popular && <Badge className="text-[10px]">{tp('popular')}</Badge>}
                  {pack.bestValue && (
                    <Badge variant="secondary" className="text-[10px]">
                      {tp('bestValue')}
                    </Badge>
                  )}
                </div>
                <span className="font-semibold">{pack.price}</span>
              </button>
            ))}
          </div>
        )}

        <Separator />

        <Button variant="outline" className="w-full" asChild onClick={onClose}>
          <Link href="/pricing">{t('upgradePlan')}</Link>
        </Button>
      </div>
    </BottomSheet>
  );
}
