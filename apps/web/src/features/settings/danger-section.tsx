'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { deleteAccount } from '@/shared/api/client';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui';

export function DangerSection() {
  const t = useTranslations('settings');
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
              <div>
                <p className="text-sm font-medium">{t('exportData')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('exportComingSoon')}</p>
              </div>
              <Button variant="outline" size="sm" disabled>{t('exportData')}</Button>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium">{t('deleteAccount')}</p>
              <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
                {t('deleteAccount')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('deleteConfirmDescription')}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || deleting}
            >
              {deleting ? t('deleting') : t('deleteConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
