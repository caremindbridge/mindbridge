'use client';

import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteAccount } from '@/shared/api/client';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button, Card, CardContent, Input, Label } from '@/shared/ui';

export function DangerSection() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setConfirmation('');
  };

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteAccount('DELETE');
      Cookies.remove('token');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/20">
        <CardContent className="p-0">
          <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('dataAndPrivacy')}
          </p>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0 mr-3">
                <p className="text-sm font-medium">{t('exportData')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('exportComingSoon')}</p>
              </div>
              <Button variant="outline" size="sm" disabled className="shrink-0">
                {t('exportData')}
              </Button>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium">{t('deleteAccount')}</p>
              <Button variant="destructive" size="sm" onClick={() => setOpen(true)} className="shrink-0">
                {t('deleteAccount')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BottomSheet
        open={open}
        onOpenChange={(v) => { if (!v) handleClose(); }}
        title={t('deleteConfirmTitle')}
      >
        <div className="space-y-4 pb-2">
          <p className="text-sm text-muted-foreground">{t('deleteConfirmDescription')}</p>
          <div className="space-y-2">
            <Label htmlFor="del-confirm">{t('deleteConfirmPlaceholder')}</Label>
            <Input
              id="del-confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || deleting}
            >
              {deleting ? t('deleting') : t('deleteConfirmButton')}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={deleting}>
              {tc('cancel')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
