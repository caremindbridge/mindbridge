'use client';

import { Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui';

interface EndSessionButtonProps {
  onEnd: () => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export function EndSessionButton({ onEnd, disabled, compact }: EndSessionButtonProps) {
  const t = useTranslations('chat');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    setLoading(true);
    try {
      await onEnd();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {compact ? (
        <button
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
        >
          <Square className="h-[18px] w-[18px] fill-current" strokeWidth={0} />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Square className="h-3 w-3 fill-current" strokeWidth={0} />
          {t('endSession')}
        </Button>
      )}

      <BottomSheet open={open} onOpenChange={setOpen} title={t('endSessionTitle')}>
        <p className="mb-6 text-sm text-muted-foreground">{t('endSessionDesc')}</p>
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleEnd} disabled={loading}>
            {loading ? t('ending') : t('endSession')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setOpen(false)} disabled={loading}>
            {tc('cancel')}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
