'use client';

import type { UserDto } from '@mindbridge/types/src/user';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { updateProfile } from '@/shared/api/client';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, Card, CardContent, Input } from '@/shared/ui';

interface ProfileSectionProps {
  user: UserDto;
  onUpdated: () => void;
}

export function ProfileSection({ user, onUpdated }: ProfileSectionProps) {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const [name, setName] = useState(user.name ?? '');
  const [saving, setSaving] = useState(false);

  const displayName = user.name ?? user.email ?? '';
  const initials = (user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?').toUpperCase();
  const joinedDate = format(new Date(user.createdAt), 'MMMM yyyy');

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || undefined });
      onUpdated();
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <p className="px-5 pt-4 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('profile')}
        </p>

        <div className="divide-y divide-border/50">
          {/* Avatar row */}
          <div className="flex items-center gap-4 px-5 py-4">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border">
              {user.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{t('joinedOn', { date: joinedDate })}</p>
            </div>
          </div>

          {/* Name */}
          <div className="px-5 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('name')}</p>
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="h-9 flex-1 text-sm"
              />
              <Button
                size="sm"
                className="h-9 shrink-0"
                onClick={handleSave}
                disabled={saving || name.trim() === (user.name ?? '')}
              >
                {saving ? tc('saving') : tc('save')}
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('email')}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Auth provider */}
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm font-medium">{t('authProvider')}</p>
            <Badge variant="secondary">
              {user.provider === 'google' ? 'Google' : 'Email'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
