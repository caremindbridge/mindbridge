'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useInvitePatient } from '@/entities/therapist';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui';

interface InvitePatientDialogProps {
  open: boolean;
  onClose: () => void;
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Patient</DialogTitle>
        </DialogHeader>

        {inviteCode ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this code with your patient. It expires in 7 days.
            </p>
            <div className="rounded-lg border bg-muted px-4 py-3 text-center">
              <p className="font-mono text-2xl font-bold tracking-widest">{inviteCode}</p>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-email">Patient email</Label>
              <Input
                id="patient-email"
                type="email"
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSubmit} disabled={invite.isPending}>
                {invite.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={invite.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
