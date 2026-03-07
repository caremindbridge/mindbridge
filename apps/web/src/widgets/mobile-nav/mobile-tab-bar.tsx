'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { BarChart3, Home, MessageSquare, Settings, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useUser } from '@/entities/user';
import { cn } from '@/shared/lib/utils';

const PATIENT_TABS = [
  { href: '/dashboard', icon: Home, key: 'home', match: /^\/dashboard$/ },
  { href: '/dashboard/chat', icon: MessageSquare, key: 'sessions', match: /^\/dashboard\/chat/ },
  { href: '/dashboard/analytics', icon: BarChart3, key: 'analytics', match: /^\/dashboard\/analytics/ },
  { href: '/dashboard/settings', icon: User, key: 'profile', match: /^\/dashboard\/(settings|about-me)/ },
];

const THERAPIST_TABS = [
  { href: '/dashboard/therapist', icon: Users, key: 'patients', match: /^\/dashboard\/therapist/ },
  { href: '/dashboard/settings', icon: Settings, key: 'settings', match: /^\/dashboard\/settings/ },
];

interface MobileTabBarProps {
  hide?: boolean;
}

export function MobileTabBar({ hide = false }: MobileTabBarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { user } = useUser();

  if (hide) return null;

  const isTherapistMode =
    user?.role === UserRole.THERAPIST ? (user.activeMode ?? 'therapist') === 'therapist' : false;
  const tabs = isTherapistMode ? THERAPIST_TABS : PATIENT_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-5 pt-2 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      <div className="glass-nav flex h-[62px] items-center justify-around rounded-[26px] px-1">
        {tabs.map((tab) => {
          const active = tab.match.test(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition-opacity active:opacity-50"
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-[14px] transition-all duration-200',
                  active ? 'glass-pill h-8 w-12' : 'h-8 w-10',
                )}
              >
                <Icon
                  className={cn(
                    'transition-all duration-200',
                    active
                      ? 'h-[20px] w-[20px] text-primary stroke-[2px]'
                      : 'h-[18px] w-[18px] text-muted-foreground/70 stroke-[1.5px]',
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  active ? 'text-primary' : 'text-muted-foreground/70',
                )}
              >
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
