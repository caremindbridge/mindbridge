'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { BarChart3, LayoutDashboard, Link2, LogOut, MessageCircle, Settings, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import Cookies from 'js-cookie';

import { useUser } from '@/entities/user';
import { ModeSwitcher } from '@/features/auth';
// import { UsageBar } from '@/features/subscription'; // TODO: Re-enable when monetization is ready
import { ThemeToggle } from '@/features/theme';
import { AcceptInviteDialog } from '@/features/therapist';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  Logo,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

const PATIENT_NAV = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { key: 'cbtSessions', href: '/dashboard/chat', icon: MessageCircle },
  { key: 'analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { key: 'aboutMe', href: '/dashboard/about-me', icon: UserCircle },
] as const;

const THERAPIST_NAV = [
  { key: 'myPatients', href: '/dashboard/therapist', icon: Users, exact: true },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
] as const;

export function Sidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const tn = useTranslations('nav');
  const tm = useTranslations('mode');
  const [acceptOpen, setAcceptOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  // If activeMode not set (old backend or null), therapists default to therapist mode
  const isTherapistMode = user?.role === UserRole.THERAPIST
    ? (user.activeMode ?? 'therapist') === 'therapist'
    : false;
  const navItems = isTherapistMode ? THERAPIST_NAV : PATIENT_NAV;

  const displayName = user?.name ?? user?.email ?? '';
  const initials = (user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?').toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Logo size="default" />
        <ThemeToggle />
      </div>

      <div className="mx-4 border-t" />

      {/* Mode switcher — therapists only */}
      {user?.role === UserRole.THERAPIST && (
        <div className="px-3 pt-2 pb-1">
          <ModeSwitcher />
          {!isTherapistMode && (
            <p className="mt-1 px-3 text-[10px] text-muted-foreground">
              {tm('personalMode')}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = 'exact' in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                'justify-start gap-3',
                isActive
                  ? 'bg-blush-100 text-blush-600 font-medium hover:bg-blush-100'
                  : 'text-sidebar-foreground hover:bg-blush-50',
              )}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {tn(item.key)}
              </Link>
            </Button>
          );
        })}

        {!isTherapistMode && (
          <Button
            variant="ghost"
            className="justify-start gap-3 overflow-hidden"
            onClick={() => setAcceptOpen(true)}
          >
            <Link2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{tn('connectToTherapist')}</span>
          </Button>
        )}

      </nav>

      {/* Usage bar — patients only — TODO: Re-enable when monetization is ready */}
      {/* {!isTherapistMode && <UsageBar />} */}

      {/* Profile */}
      <div className="shrink-0 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-blush-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 shrink-0">
                {user?.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
                <AvatarFallback className="bg-blush-100 text-blush-600 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">{displayName}</p>
                {user?.name && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
                {user?.name ? (
                  <>
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </>
                ) : (
                  <p className="truncate text-sm font-medium">{user?.email}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                {tn('settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2">
              <LogOut className="h-4 w-4" />
              {tn('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!isTherapistMode && (
        <AcceptInviteDialog open={acceptOpen} onClose={() => setAcceptOpen(false)} />
      )}
    </aside>
  );
}
