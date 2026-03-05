'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button, Dialog, DialogContent, DialogTitle } from '@/shared/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionLimit: number;
}

export function SessionLimitModal({ open, onClose, sessionLimit }: Props) {
  const t = useTranslations('subscription');
  const router = useRouter();

  const handleNewSession = () => {
    onClose();
    router.push('/dashboard/chat');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center">
        <div className="text-3xl">💬</div>
        <DialogTitle>{t('sessionLimitTitle')}</DialogTitle>
        <p className="text-sm text-muted-foreground">
          {t('sessionLimitDescription', { limit: sessionLimit })}
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('endSession')}
          </Button>
          <Button className="flex-1" onClick={handleNewSession}>
            {t('newSession')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
