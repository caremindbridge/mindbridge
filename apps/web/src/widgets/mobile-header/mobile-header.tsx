'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/shared/lib/utils';

const ROOT_PAGES = [
  '/dashboard',
  '/dashboard/chat',
  '/dashboard/analytics',
  '/dashboard/settings',
];

interface MobileHeaderProps {
  title?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({ title, rightAction, className }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = ROOT_PAGES.includes(pathname);

  return (
    <header
      className={cn(
        'lg:hidden sticky top-0 z-40',
        'bg-background/90 backdrop-blur-xl',
        'border-b border-border/30',
        'h-11 flex items-center px-4 shrink-0',
        className,
      )}
    >
      {/* Left */}
      {isRoot ? (
        <div className="w-8" />
      ) : (
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary -ml-1 active:opacity-60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Center */}
      <div className="flex-1 flex justify-center px-2 min-w-0">
        <h1 className="text-[15px] font-semibold truncate">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex justify-end shrink-0">
        {rightAction ?? <div className="w-8" />}
      </div>
    </header>
  );
}
