'use client';

import { UserRole } from '@mindbridge/types/src/user';
import { CreditCard, LayoutDashboard, Link2, LogOut, MessageCircle, Settings, Sparkles, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import Cookies from 'js-cookie';

import { useUsageStatus } from '@/entities/subscription';
import { useUser } from '@/entities/user';
import { UsageBar } from '@/features/subscription';
import { ThemeToggle } from '@/features/theme';
import { AcceptInviteDialog } from '@/features/therapist';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
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
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'CBT Sessions', href: '/dashboard/chat', icon: MessageCircle },
  { label: 'About Me', href: '/dashboard/about-me', icon: UserCircle },
  { label: 'Pricing', href: '/pricing', icon: CreditCard, exact: true },
];

const THERAPIST_NAV = [
  { label: 'My Patients', href: '/dashboard/therapist', icon: Users, exact: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const { user } = useUser();
  const { data: usage } = useUsageStatus();
  const pathname = usePathname();
  const router = useRouter();
  const [acceptOpen, setAcceptOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const isTherapist = user?.role === UserRole.THERAPIST;
  const navItems = isTherapist ? THERAPIST_NAV : PATIENT_NAV;

  const displayName = user?.name ?? user?.email ?? '';
  const initials = (user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? '?').toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="text-lg font-bold tracking-tight">MindBridge</span>
        <ThemeToggle />
      </div>

      <div className="mx-4 border-t" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = item.exact
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
                {item.label}
              </Link>
            </Button>
          );
        })}

        {!isTherapist && (
          <Button
            variant="ghost"
            className="justify-start gap-3"
            onClick={() => setAcceptOpen(true)}
          >
            <Link2 className="h-4 w-4" />
            Connect to Therapist
          </Button>
        )}

        {usage?.status === 'trial' && (
          <Button
            variant="soft"
            asChild
            className="justify-start gap-3"
          >
            <Link href="/pricing">
              <Sparkles className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </nav>

      {/* Usage bar — patients only */}
      {!isTherapist && <UsageBar />}

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
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!isTherapist && (
        <AcceptInviteDialog open={acceptOpen} onClose={() => setAcceptOpen(false)} />
      )}
    </aside>
  );
}
