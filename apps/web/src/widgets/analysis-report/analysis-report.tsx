'use client';

import type { SessionAnalysisDto } from '@mindbridge/types/src/chat';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle,
  ClipboardCopy,
  Heart,
  Lightbulb,
  Target,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';

interface AnalysisReportProps {
  analysis: SessionAnalysisDto;
}

const frequencyColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
};

export function AnalysisReport({ analysis }: AnalysisReportProps) {
  const t = useTranslations('analysis');
  const [copied, setCopied] = useState(false);

  const copyBrief = async () => {
    await navigator.clipboard.writeText(analysis.therapistBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tabs defaultValue="distortions" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="distortions">{t('distortions')}</TabsTrigger>
        <TabsTrigger value="emotions">{t('emotions')}</TabsTrigger>
        <TabsTrigger value="themes">{t('themes')}</TabsTrigger>
        <TabsTrigger value="progress">{t('progress')}</TabsTrigger>
        <TabsTrigger value="therapist">{t('forTherapist')}</TabsTrigger>
      </TabsList>

      {/* Cognitive Distortions */}
      <TabsContent value="distortions" className="space-y-4">
        <div className="grid gap-4">
          {analysis.cognitiveDistortions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Brain className="mx-auto mb-2 h-8 w-8" />
                {t('noDistortions')}
              </CardContent>
            </Card>
          ) : (
            analysis.cognitiveDistortions.map((distortion, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{distortion.type}</CardTitle>
                    <Badge variant={frequencyColors[distortion.frequency] || 'secondary'}>
                      {distortion.frequency}
                    </Badge>
                  </div>
                  <CardDescription>{distortion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted p-3 text-sm italic">
                    &ldquo;{distortion.example}&rdquo;
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Emotional Track */}
      <TabsContent value="emotions" className="space-y-4">
        <div className="grid gap-4">
          {analysis.emotionalTrack.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Heart className="mx-auto mb-2 h-8 w-8" />
                {t('noEmotions')}
              </CardContent>
            </Card>
          ) : (
            analysis.emotionalTrack.map((point, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{point.emotion}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {point.intensity}/10
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={point.intensity * 10} className="h-2" />
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">{t('moment')}:</span> {point.moment}
                    </p>
                    <p>
                      <span className="font-medium">{t('trigger')}:</span> {point.trigger}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* Themes & Triggers */}
      <TabsContent value="themes" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              {t('themesTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.themes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noThemes')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map((theme, i) => (
                  <Badge key={i} variant="outline">
                    {theme}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              {t('triggersTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.triggers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noTriggers')}</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm">
                {analysis.triggers.map((trigger, i) => (
                  <li key={i}>{trigger}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Progress & Recommendations */}
      <TabsContent value="progress" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              {t('progressSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.progressSummary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" />
              {t('recommendationsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noRecommendations')}</p>
            ) : (
              <ul className="list-inside list-disc space-y-2 text-sm">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {analysis.homework && analysis.homework.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                {t('homeworkTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-decimal space-y-2 text-sm">
                {analysis.homework.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Therapist Brief */}
      <TabsContent value="therapist" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{t('therapistBrief')}</CardTitle>
                <CardDescription>{t('therapistBriefDesc')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyBrief}>
                <ClipboardCopy className="mr-2 h-3 w-3" />
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {analysis.therapistBrief}
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
