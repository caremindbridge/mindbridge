'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Brain } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useMyContext, useMyProfile, useUpdateMyContext } from '@/entities/profile';
import {
  Button,
  Card,
  CardContent,
  Input,
  MarkdownMessage,
  Skeleton,
  Textarea,
} from '@/shared/ui';

const schema = z.object({
  name: z.string().max(100).optional(),
  age: z.coerce.number().int().min(0).max(150).optional().or(z.literal('')),
  pronouns: z.string().max(50).optional(),
  medications: z.string().max(500).optional(),
  diagnoses: z.string().max(500).optional(),
  previousTherapy: z.string().max(500).optional(),
  occupation: z.string().max(200).optional(),
  relationships: z.string().max(500).optional(),
  livingSituation: z.string().max(500).optional(),
  goals: z.string().max(1000).optional(),
  additionalNotes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function AboutMePage() {
  const t = useTranslations('aboutMe');
  const { data: contextData, isLoading } = useMyContext();
  const { data: myProfile } = useMyProfile();
  const updateContext = useUpdateMyContext();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    if (contextData?.context) {
      const c = contextData.context;
      reset({
        name: c.name ?? '',
        age: c.age ?? ('' as unknown as number),
        pronouns: c.pronouns ?? '',
        medications: c.medications ?? '',
        diagnoses: c.diagnoses ?? '',
        previousTherapy: c.previousTherapy ?? '',
        occupation: c.occupation ?? '',
        relationships: c.relationships ?? '',
        livingSituation: c.livingSituation ?? '',
        goals: c.goals ?? '',
        additionalNotes: c.additionalNotes ?? '',
      });
    }
  }, [contextData, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const clean = {
        name: values.name || undefined,
        age: values.age === '' || values.age === undefined ? undefined : Number(values.age),
        pronouns: values.pronouns || undefined,
        medications: values.medications || undefined,
        diagnoses: values.diagnoses || undefined,
        previousTherapy: values.previousTherapy || undefined,
        occupation: values.occupation || undefined,
        relationships: values.relationships || undefined,
        livingSituation: values.livingSituation || undefined,
        goals: values.goals || undefined,
        additionalNotes: values.additionalNotes || undefined,
      };
      await updateContext.mutateAsync(clean);
      reset(values);
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Grid: left = info fields, right = goals + save */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* ── Left ── */}
          <div className="space-y-4">
            <SectionCard title={t('basicInfo')}>
              <FieldRow label={t('name')}>
                <Input {...register('name')} placeholder={t('namePlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('age')}>
                <Input {...register('age')} type="number" min={0} max={150} placeholder="28" className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('pronouns')}>
                <Input {...register('pronouns')} placeholder={t('pronounsPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
            </SectionCard>

            <SectionCard title={t('health')} description={t('healthDescription')}>
              <FieldRow label={t('medications')}>
                <Input {...register('medications')} placeholder={t('medicationsPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('diagnoses')}>
                <Input {...register('diagnoses')} placeholder={t('diagnosesPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('previousTherapy')}>
                <Input {...register('previousTherapy')} placeholder={t('previousTherapyPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
            </SectionCard>

            <SectionCard title={t('lifeContext')}>
              <FieldRow label={t('occupation')}>
                <Input {...register('occupation')} placeholder={t('occupationPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('relationships')}>
                <Input {...register('relationships')} placeholder={t('relationshipsPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
              <FieldRow label={t('livingSituation')}>
                <Input {...register('livingSituation')} placeholder={t('livingSituationPlaceholder')} className="h-8 w-full text-sm" />
              </FieldRow>
            </SectionCard>
          </div>

          {/* ── Right ── */}
          <div className="flex flex-col gap-4">
            <SectionCard title={t('goals')}>
              <div className="px-5 pb-4">
                <Textarea
                  {...register('goals')}
                  placeholder={t('goalsPlaceholder')}
                  className="min-h-[120px] resize-none text-sm"
                />
              </div>
            </SectionCard>

            <SectionCard title={t('anythingElse')} description={t('anythingElseDescription')}>
              <div className="px-5 pb-4">
                <Textarea
                  {...register('additionalNotes')}
                  placeholder={t('anythingElsePlaceholder')}
                  className="min-h-[120px] resize-none text-sm"
                />
              </div>
            </SectionCard>

            <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
              <p className="text-xs text-muted-foreground">🔒 {t('privacyNotice')}</p>
              <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? t('saving') : t('save')}
              </Button>
            </div>
          </div>

        </div>

        {/* What Mira knows — full width */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('whatMiraKnows')}
                </p>
              </div>
              {(myProfile?.sessionsIncorporated ?? 0) > 0 && (
                <span className="mt-1.5 inline-block whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {myProfile!.sessionsIncorporated} sessions incorporated
                </span>
              )}
            </div>
            <div className="border-t px-5 py-4">
              {myProfile?.content ? (
                <div className="text-xs text-foreground/70">
                  <MarkdownMessage content={myProfile.content} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">Nothing yet</p>
                  <p className="text-xs text-muted-foreground/70">
                    Mira will build a profile of you automatically after your first session.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </form>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>
          )}
        </div>
        <div className="divide-y divide-border/50">{children}</div>
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4 px-5 py-2.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}
