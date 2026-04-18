'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCreateMood } from '@/entities/mood';
import { analytics } from '@/shared/lib/analytics';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button, Textarea } from '@/shared/ui';

interface MoodCheckInProps {
  sessionId: string;
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const EMOTIONS = [
  { value: 'anxiety', key: 'emotionAnxiety', emoji: '😰' },
  { value: 'sadness', key: 'emotionSadness', emoji: '😢' },
  { value: 'joy', key: 'emotionJoy', emoji: '😊' },
  { value: 'calm', key: 'emotionCalm', emoji: '😌' },
  { value: 'irritation', key: 'emotionIrritation', emoji: '😤' },
  { value: 'fear', key: 'emotionFear', emoji: '😨' },
  { value: 'anger', key: 'emotionAnger', emoji: '😠' },
  { value: 'hope', key: 'emotionHope', emoji: '🤞' },
  { value: 'loneliness', key: 'emotionLoneliness', emoji: '😔' },
  { value: 'gratitude', key: 'emotionGratitude', emoji: '🙏' },
] as const;

function moodEmoji(v: number): string {
  if (v <= 2) return '😔';
  if (v <= 4) return '😟';
  if (v <= 6) return '😐';
  if (v <= 8) return '🙂';
  return '😊';
}

export function MoodCheckIn({ sessionId, open, onComplete, onSkip }: MoodCheckInProps) {
  const t = useTranslations('mood');
  const [value, setValue] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const createMood = useCreateMood();

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  };

  const handleSave = async () => {
    try {
      await createMood.mutateAsync({
        value,
        emotions: selectedEmotions,
        note: note || undefined,
        sessionId,
      });
      analytics.moodCheckedIn(value, 'post_session');
      onComplete();
    } catch {
      toast.error(t('failedToSave'));
    }
  };

  const footer = (
    <div className="flex flex-col gap-3">
      <Button
        variant="cta"
        size="cta"
        className="w-full"
        onClick={handleSave}
        disabled={createMood.isPending}
      >
        {createMood.isPending ? t('saving') : t('submit')}
      </Button>
      <Button variant="ghost" className="w-full" onClick={onSkip} disabled={createMood.isPending}>
        {t('skip')}
      </Button>
    </div>
  );

  return (
    <BottomSheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onSkip(); }} title={t('title')} footer={footer}>
      <div className="space-y-5">
        {/* Mood Scale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t('rateYourMood')}</p>
            <span className="text-2xl">{moodEmoji(value)}</span>
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
              <Button
                key={v}
                variant={value === v ? 'default' : 'outline'}
                className="h-10 w-10 p-0 text-sm"
                onClick={() => setValue(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('low')}</span>
            <span>{t('high')}</span>
          </div>
        </div>

        {/* Emotions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('emotionsOptional')}</p>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map(({ value: v, key, emoji }) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleEmotion(v)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedEmotions.includes(v)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-accent'
                }`}
              >
                {emoji} {t(key)}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <Textarea
          placeholder={t('howWasSession')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          className="resize-none"
          rows={3}
        />
      </div>
    </BottomSheet>
  );
}
