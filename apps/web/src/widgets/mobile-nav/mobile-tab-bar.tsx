'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { Activity, Home, MessageCircle, Settings, User, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useUser } from '@/entities/user';
import { cn } from '@/shared/lib/utils';

const PATIENT_TABS = [
  { href: '/dashboard', icon: Home, key: 'home', match: /^\/dashboard$/ },
  { href: '/dashboard/chat', icon: MessageCircle, key: 'sessions', match: /^\/dashboard\/chat/ },
  { href: '/dashboard/analytics', icon: Activity, key: 'analytics', match: /^\/dashboard\/analytics/ },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-5 pt-2.5 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
      <div className="glass-nav flex h-[62px] items-center rounded-[32px] p-1">
        {tabs.map((tab) => {
          const active = tab.match.test(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center h-full gap-[3px] rounded-[28px] transition-all duration-200 active:opacity-50',
                active && 'tab-active',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  active
                    ? 'text-foreground'
                    : 'text-[#B0A098] dark:text-[#7A6F65]',
                )}
              />
              <span
                className={cn(
                  'text-[10px] tracking-[0.2px] leading-none transition-colors duration-200',
                  active
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-[#B0A098] dark:text-[#7A6F65]',
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
