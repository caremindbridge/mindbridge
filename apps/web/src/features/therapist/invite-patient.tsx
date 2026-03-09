'use client';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useInvitePatient } from '@/entities/therapist';
import { Button, Input, Label } from '@/shared/ui';
import { BottomSheet } from '@/shared/ui/bottom-sheet';

interface InvitePatientDialogProps {
  open: boolean;
  onClose: () => void;
}

function InviteCodeResult({ code, onDone }: { code: string; onDone: () => void }) {
  const t = useTranslations('therapist');
  const tc = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t('codeCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">
        {t('shareCode')}
      </p>
      <button
        onClick={handleCopy}
        className="group w-full rounded-xl border bg-muted px-4 py-4 text-center transition hover:bg-muted/70 active:scale-[0.98]"
      >
        <p className="font-mono text-3xl font-bold tracking-[0.3em]">{code}</p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">{t('copied')}</span></>
          ) : (
            <><Copy className="h-3.5 w-3.5" />{t('tapToCopy')}</>
          )}
        </p>
      </button>
      <Button className="w-full" onClick={onDone}>{tc('done')}</Button>
    </div>
  );
}

export function InvitePatientDialog({ open, onClose }: InvitePatientDialogProps) {
  const t = useTranslations('therapist');
  const tc = useTranslations('common');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const invite = useInvitePatient();

  const handleClose = () => {
    setEmail('');
    setInviteCode(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setError(null);
    try {
      const result = await invite.mutateAsync(email.trim());
      setInviteCode(result.inviteCode);
      toast.success(t('inviteSent', { code: result.inviteCode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToSendInvite'));
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
      title={t('invitePatient')}
    >
      {inviteCode ? (
        <InviteCodeResult code={inviteCode} onDone={handleClose} />
      ) : (
        <div className="space-y-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="patient-email">{t('patientEmail')}</Label>
            <Input
              id="patient-email"
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-base"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={invite.isPending}>
              {invite.isPending ? t('sending') : t('sendInvite')}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={invite.isPending}>
              {tc('cancel')}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
