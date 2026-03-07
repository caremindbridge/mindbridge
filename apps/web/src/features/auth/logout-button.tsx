'use client';

import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { analytics } from '@/shared/lib/analytics';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    analytics.reset();
    Cookies.remove('token');
    queryClient.clear();
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2">
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
