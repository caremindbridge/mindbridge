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
}

export function EndSessionButton({ onEnd, disabled }: EndSessionButtonProps) {
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
        <Button variant="outline" size="sm" disabled={disabled}>
          <Square className="mr-2 h-3 w-3" />
          {t('endSession')}
        </Button>
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
