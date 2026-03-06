'use client';

import { Check, Copy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">
        Share this code with your patient. It expires in 7 days.
      </p>
      <button
        onClick={handleCopy}
        className="group w-full rounded-xl border bg-muted px-4 py-4 text-center transition-colors hover:bg-muted/70 active:scale-[0.98] transition-transform"
      >
        <p className="font-mono text-3xl font-bold tracking-[0.3em]">{code}</p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Copied!</span></>
          ) : (
            <><Copy className="h-3.5 w-3.5" />Tap to copy</>
          )}
        </p>
      </button>
      <Button className="w-full" onClick={onDone}>Done</Button>
    </div>
  );
}

export function InvitePatientDialog({ open, onClose }: InvitePatientDialogProps) {
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
      toast.success(`Invite sent! Code: ${result.inviteCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
      title="Invite Patient"
    >
      {inviteCode ? (
        <InviteCodeResult code={inviteCode} onDone={handleClose} />
      ) : (
        <div className="space-y-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="patient-email">Patient email</Label>
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
              {invite.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={invite.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
