'use client';

import { useMediaQuery } from '@/shared/lib/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onOpenChange, title, children }: BottomSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={title ? undefined : 'sr-only'}>{title ?? ' '}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom,16px)]"
      >
        <div className="mx-auto mt-2 mb-3 h-1 w-10 rounded-full bg-muted-foreground/20" />
        {title ? (
          <SheetHeader className="px-4 pb-2 text-left">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        ) : (
          <SheetTitle className="sr-only">{' '}</SheetTitle>
        )}
        <div className="overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
