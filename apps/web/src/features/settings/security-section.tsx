'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { changePassword } from '@/shared/api/client';
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

interface SecuritySectionProps {
  user: UserDto;
}

export function SecuritySection({ user }: SecuritySectionProps) {
  const t = useTranslations('settings');
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOAuth = user.provider !== 'local';

  const handleClose = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(t('passwordUpdated'));
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('security')}
          </p>
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium">{t('changePassword')}</p>
                {isOAuth && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t('googleAuth')}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isOAuth}
                onClick={() => setOpen(true)}
              >
                {t('changePassword')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>{t('currentPassword')} → {t('newPassword')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">{t('currentPassword')}</Label>
              <Input id="cur-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">{t('newPassword')}</Label>
              <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-pw">{t('confirmPassword')}</Label>
              <Input id="cfg-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !currentPassword || !newPassword || !confirmPassword}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
