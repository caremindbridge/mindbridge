'use client';

import { useEffect, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import type { PatientContextData } from '@mindbridge/types/src/profile';

import { usePatientDossier, useUpdateTherapistNotes } from '@/entities/profile';
import { cn } from '@/shared/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MarkdownMessage,
  Skeleton,
  Textarea,
} from '@/shared/ui';

interface PatientDossierProps {
  patientId: string;
}

export function PatientDossier({ patientId }: PatientDossierProps) {
  const t = useTranslations('dossier');
  const { data: dossier, isLoading } = usePatientDossier(patientId);
  const updateNotes = useUpdateTherapistNotes(patientId);

  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (dossier?.therapistNotes != null) setNotes(dossier.therapistNotes);
  }, [dossier?.therapistNotes]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!dossier?.hasDossier) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    );
  }

  const { intake, clinicalProfile } = dossier;
  const aiSections = clinicalProfile?.content ? parseAIProfile(clinicalProfile.content) : null;

  const hasOverview =
    intake &&
    hasAnyValue(intake, [
      'name',
      'age',
      'pronouns',
      'occupation',
      'relationships',
      'livingSituation',
    ]);
  const hasClinical =
    intake?.medications ||
    intake?.diagnoses ||
    intake?.previousTherapy ||
    aiSections?.coreIssues?.length ||
    aiSections?.patterns?.length ||
    aiSections?.coping?.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          {dossier.updatedAt && (
            <span className="text-xs text-muted-foreground">
              {t('updated', {
                time: formatDistanceToNow(new Date(dossier.updatedAt), { addSuffix: true }),
              })}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ─── OVERVIEW ─── */}
        {hasOverview && intake && (
          <DossierSection title={t('overview')}>
            <div className="space-y-1 text-sm">
              {(intake.name || intake.age || intake.pronouns) && (
                <p className="font-medium">
                  {[intake.name, intake.age && `${intake.age}`, intake.pronouns]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {intake.occupation && <InfoLine icon="💼" text={intake.occupation} />}
              {intake.relationships && <InfoLine icon="❤️" text={intake.relationships} />}
              {intake.livingSituation && <InfoLine icon="🏠" text={intake.livingSituation} />}
            </div>
          </DossierSection>
        )}

        {/* ─── CLINICAL ─── */}
        {hasClinical && (
          <DossierSection title={t('clinical')}>
            <div className="space-y-3 text-sm">
              {intake?.diagnoses && (
                <FieldBlock label={t('diagnoses')} value={intake.diagnoses} />
              )}
              {intake?.medications && (
                <FieldBlock label={t('medications')} value={intake.medications} />
              )}
              {intake?.previousTherapy && (
                <FieldBlock label={t('previousTherapy')} value={intake.previousTherapy} />
              )}
              {aiSections?.coreIssues && aiSections.coreIssues.length > 0 && (
                <FieldBlock label={t('coreIssues')}>
                  <BulletList items={aiSections.coreIssues} />
                </FieldBlock>
              )}
              {aiSections?.patterns && aiSections.patterns.length > 0 && (
                <FieldBlock label={t('patterns')}>
                  <BulletList items={aiSections.patterns} />
                </FieldBlock>
              )}
              {aiSections?.coping && aiSections.coping.length > 0 && (
                <FieldBlock label={t('copingStrategies')}>
                  <BulletList items={aiSections.coping} />
                </FieldBlock>
              )}
            </div>
          </DossierSection>
        )}

        {/* ─── GOALS ─── */}
        {intake?.goals && (
          <DossierSection title={t('goals')}>
            <p className="text-sm">{intake.goals}</p>
          </DossierSection>
        )}

        {/* ─── PROGRESS ─── */}
        {(aiSections?.progress?.length || aiSections?.lastSession) && (
          <DossierSection
            title={t('progress', { count: clinicalProfile?.sessionsIncorporated ?? 0 })}
          >
            <div className="space-y-2 text-sm">
              {aiSections?.progress && aiSections.progress.length > 0 && (
                <BulletList items={aiSections.progress} />
              )}
              {aiSections?.lastSession && (
                <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs">
                  <span className="font-medium">{t('lastSession')}: </span>
                  <MarkdownMessage content={aiSections.lastSession} />
                </div>
              )}
            </div>
          </DossierSection>
        )}

        {/* ─── RISK FLAGS ─── */}
        {aiSections?.riskFlags &&
          !aiSections.riskFlags.toLowerCase().includes('none') && (
            <DossierSection title={t('riskFlags')} variant="destructive">
              <div className="text-sm">
                <MarkdownMessage content={aiSections.riskFlags!} />
              </div>
            </DossierSection>
          )}

        {/* ─── YOUR NOTES ─── */}
        <DossierSection title={t('yourNotes')}>
          <p className="mb-2 text-xs text-muted-foreground">{t('yourNotesDescription')}</p>
          <Textarea
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= 2000) {
                setNotes(e.target.value);
                setIsDirty(true);
              }
            }}
            placeholder={t('notesPlaceholder')}
            className="min-h-[100px] resize-y font-mono text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{notes.length}/2000</span>
            <Button
              size="sm"
              disabled={!isDirty || updateNotes.isPending}
              onClick={async () => {
                try {
                  await updateNotes.mutateAsync(notes);
                  setIsDirty(false);
                  toast.success(t('notesSaved'));
                } catch {
                  toast.error(t('notesSaveError'));
                }
              }}
            >
              {updateNotes.isPending ? t('saving') : t('saveNotes')}
            </Button>
          </div>
        </DossierSection>
      </CardContent>
    </Card>
  );
}

// ─── Helper components ────────────────────────────────────────

function DossierSection({
  title,
  children,
  variant,
}: {
  title: string;
  children: ReactNode;
  variant?: 'destructive';
}) {
  return (
    <div>
      <div
        className={cn(
          'mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wider',
          variant === 'destructive'
            ? 'border-destructive/30 text-destructive'
            : 'border-border/50 text-muted-foreground',
        )}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldBlock({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {value && <p className="mt-0.5">{value}</p>}
      {children}
    </div>
  );
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
  return (
    <p className="text-muted-foreground">
      <span className="mr-1.5">{icon}</span>
      {text}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0 text-muted-foreground">•</span>
          <span><InlineMarkdown text={item} /></span>
        </li>
      ))}
    </ul>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── AI profile parser ────────────────────────────────────────

function parseAIProfile(content: string): {
  coreIssues?: string[];
  patterns?: string[];
  coping?: string[];
  progress?: string[];
  lastSession?: string;
  riskFlags?: string;
} {
  const getBullets = (header: string): string[] => {
    const regex = new RegExp(
      `${header}[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z]{2,}[^a-z]|---\\s*$|$)`,
      'i',
    );
    const match = content.match(regex);
    if (!match) return [];
    return match[1]
      .split('\n')
      .map((l) => l.replace(/^[\s\-•*]+/, '').trim())
      .filter(Boolean);
  };

  const getBlock = (header: string): string | undefined => {
    const regex = new RegExp(
      `${header}[^\\n]*\\n([\\s\\S]*?)(?=\\n[A-Z]{2,}[^a-z]|---\\s*$|$)`,
      'i',
    );
    const match = content.match(regex);
    const raw = match?.[1]?.trim();
    if (!raw) return undefined;
    // strip leading bullet if single line
    return raw.replace(/^[\-•*]\s*/, '').trim() || undefined;
  };

  return {
    coreIssues: getBullets('CORE ISSUES'),
    patterns: getBullets('CURRENT PATTERNS'),
    coping: getBullets('COPING STRATEGIES'),
    progress: getBullets('PROGRESS'),
    lastSession: getBlock('LAST SESSION SUMMARY'),
    riskFlags: getBlock('RISK FLAGS'),
  };
}

function hasAnyValue(obj: PatientContextData, keys: (keyof PatientContextData)[]): boolean {
  return keys.some((k) => obj[k] != null && obj[k] !== '');
}
