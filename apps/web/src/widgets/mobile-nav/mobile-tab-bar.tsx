'use client';

import { BarChart3, Home, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/utils';

const tabs = [
  { href: '/dashboard', icon: Home, match: /^\/dashboard$/ },
  { href: '/dashboard/chat', icon: MessageSquare, match: /^\/dashboard\/chat/ },
  { href: '/dashboard/analytics', icon: BarChart3, match: /^\/dashboard\/analytics/ },
  { href: '/dashboard/settings', icon: User, match: /^\/dashboard\/(settings|about-me)/ },
] as const;

interface MobileTabBarProps {
  hide?: boolean;
}

export function MobileTabBar({ hide = false }: MobileTabBarProps) {
  const pathname = usePathname();

  if (hide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-5 pt-2 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      <div
        className="flex h-[58px] items-center justify-around rounded-[26px] px-1"
        style={{
          background: 'rgba(255, 255, 255, 0.38)',
          backdropFilter: 'blur(40px) saturate(200%) brightness(115%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(115%)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          boxShadow:
            '0 8px 40px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(0,0,0,0.04) inset',
        }}
      >
        {tabs.map((tab) => {
          const active = tab.match.test(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center h-full transition-opacity active:opacity-50"
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-[14px] transition-all duration-200',
                  active ? 'h-9 w-12' : 'h-9 w-10',
                )}
                style={
                  active
                    ? {
                        background: 'rgba(196, 133, 111, 0.15)',
                        boxShadow: '0 1px 4px rgba(196,133,111,0.12) inset',
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    'transition-all duration-200',
                    active
                      ? 'h-[22px] w-[22px] text-primary stroke-[2px]'
                      : 'h-5 w-5 text-muted-foreground/70 stroke-[1.5px]',
                  )}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
