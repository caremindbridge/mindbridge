'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAcceptInvite } from '@/entities/therapist';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui';

interface AcceptInviteDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AcceptInviteDialog({ open, onClose }: AcceptInviteDialogProps) {
  const t = useTranslations('therapist');
  const tc = useTranslations('common');
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accept = useAcceptInvite();

  const handleClose = () => {
    setCode('');
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setError(null);
    try {
      await accept.mutateAsync(code.trim().toUpperCase());
      setSuccess(true);
      toast.success(t('connectedSuccess'));
    } catch {
      setError(t('invalidCode'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('connectTherapist')}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="font-medium">{t('connected')}</p>
            <p className="text-sm text-muted-foreground">
              {t('connectedDesc')}
            </p>
            <Button className="w-full" onClick={handleClose}>
              {tc('close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('enterCode')}
            </p>
            <div className="space-y-2">
              <Label htmlFor="invite-code">{t('inviteCode')}</Label>
              <Input
                id="invite-code"
                placeholder="XXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono text-center text-lg tracking-widest"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={accept.isPending || code.length !== 8}
              >
                {accept.isPending ? t('connecting') : t('connect')}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={accept.isPending}>
                {tc('cancel')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
