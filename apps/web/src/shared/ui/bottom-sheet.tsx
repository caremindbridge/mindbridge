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
  footer?: React.ReactNode;
}

export function BottomSheet({ open, onOpenChange, title, children, footer }: BottomSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle className={title ? undefined : 'sr-only'}>{title ?? ' '}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="shrink-0 pt-2">{footer}</div>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92vh] flex-col rounded-t-2xl p-0"
      >
        <div className="mx-auto mt-2 mb-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />
        {title ? (
          <SheetHeader className="shrink-0 px-4 pb-2 text-left">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        ) : (
          <SheetTitle className="sr-only">{' '}</SheetTitle>
        )}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-border/60 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
