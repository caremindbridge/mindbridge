'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createSession } from '@/shared/api/client';
import { analytics } from '@/shared/lib/analytics';
import { Button } from '@/shared/ui';

export function StartSessionButton() {
  const t = useTranslations('chat');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await createSession();
      analytics.sessionStarted(session.id);
      router.push(`/dashboard/chat/${session.id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button variant="cta" size="cta" onClick={handleStart} disabled={loading}>
      <Plus className="mr-2 h-4 w-4" />
      {loading ? t('creating') : t('newSession')}
    </Button>
  );
}
