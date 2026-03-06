'use client';

import { Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui';

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <button
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
          >
            <Square className="h-[18px] w-[18px] fill-current" strokeWidth={0} />
          </button>
        ) : (
          <Button variant="outline" size="sm" disabled={disabled} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Square className="h-3 w-3 fill-current" strokeWidth={0} />
            {t('endSession')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('endSessionTitle')}</DialogTitle>
          <DialogDescription>{t('endSessionDesc')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleEnd} disabled={loading}>
            {loading ? t('ending') : t('endSession')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
