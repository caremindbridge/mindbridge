'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui';

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
    <BottomSheet open={open} onOpenChange={onClose} title={t('sessionLimitTitle')}>
      <div className="text-center pb-2">
        <div className="text-3xl mb-3">💬</div>
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
      </div>
    </BottomSheet>
  );
}
