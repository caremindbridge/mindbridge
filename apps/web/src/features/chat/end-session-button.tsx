'use client';

import { Square } from 'lucide-react';
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
          End Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>End Session?</DialogTitle>
          <DialogDescription>
            This will end the current CBT session and generate an analysis of your conversation. You
            won&apos;t be able to send more messages after ending.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEnd} disabled={loading}>
            {loading ? 'Ending...' : 'End Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
