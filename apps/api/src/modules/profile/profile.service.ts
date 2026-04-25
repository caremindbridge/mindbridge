import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { buildLangInstruction } from '../claude/claude-prompts';
import { ClaudeService } from '../claude/claude.service';
import { PatientContextData, PatientProfile } from './entities/patient-profile.entity';
import {
  EXTRACT_CONTEXT_PROMPT,
  PROFILE_CONDENSE_PROMPT,
  PROFILE_INIT_PROMPT,
  PROFILE_UPDATE_PROMPT,
} from './profile.prompts';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const NO_AI_SESSIONS_CONTENT = 'No AI sessions yet.';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly MAX_PROFILE_WORDS = 650;

  constructor(
    @InjectRepository(PatientProfile)
    private readonly profileRepo: Repository<PatientProfile>,
    private readonly claudeService: ClaudeService,
  ) {}

  async getByUserId(userId: string): Promise<PatientProfile | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }

  async createInitialProfile(
    userId: string,
    sessionMessages: Array<{ role: string; content: string }>,
  ): Promise<PatientProfile> {
    const messagesText = sessionMessages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const content = await this.claudeService.complete(
      PROFILE_INIT_PROMPT + this.detectLanguageOverride(messagesText),
      [{ role: 'user', content: messagesText }],
      { model: HAIKU_MODEL, maxTokens: 1500 },
    );

    const profile = this.profileRepo.create({
      userId,
      content,
      sessionsIncorporated: 1,
      version: 1,
    });

    return this.profileRepo.save(profile);
  }

  async updateProfile(
    userId: string,
    sessionMessages: Array<{ role: string; content: string }>,
  ): Promise<PatientProfile> {
    const existing = await this.getByUserId(userId);

    let profile: PatientProfile;

    const noAiContent =
      !existing ||
      existing.content === NO_AI_SESSIONS_CONTENT ||
      !this.isValidProfile(existing.content);

    if (noAiContent) {
      if (!existing) {
        profile = await this.createInitialProfile(userId, sessionMessages);
      } else {
        // Profile exists (e.g. therapist wrote notes) but no AI content yet — generate initial
        const messagesText = sessionMessages
          .filter((m) => m.role !== 'system')
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n\n');

        const content = await this.claudeService.complete(
          PROFILE_INIT_PROMPT + this.detectLanguageOverride(messagesText),
          [{ role: 'user', content: messagesText }],
          { model: HAIKU_MODEL, maxTokens: 1500 },
        );

        existing.content = content;
        existing.sessionsIncorporated = Math.max(existing.sessionsIncorporated, 1);
        existing.version += 1;
        profile = await this.profileRepo.save(existing);
      }
    } else {
      const messagesText = sessionMessages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');

      const prompt =
        PROFILE_UPDATE_PROMPT.replace('{current_profile}', existing!.content).replace(
          '{session_messages}',
          messagesText,
        ) + this.detectLanguageOverride(messagesText);

      const newContent = await this.claudeService.complete(
        prompt,
        [{ role: 'user', content: 'Update the profile based on the latest session.' }],
        { model: HAIKU_MODEL, maxTokens: 1500 },
      );

      const wordCount = newContent.split(/\s+/).length;
      let finalContent = newContent;

      if (wordCount > this.MAX_PROFILE_WORDS) {
        this.logger.warn(
          `Profile for user ${userId} exceeded ${this.MAX_PROFILE_WORDS} words (${wordCount}), condensing...`,
        );
        finalContent = await this.condenseProfile(newContent);
      }

      existing!.content = finalContent;
      existing!.sessionsIncorporated += 1;
      existing!.version += 1;
      profile = await this.profileRepo.save(existing!);
    }

    await this.extractAndMergeContext(profile, sessionMessages);

    return (await this.profileRepo.findOne({ where: { userId } }))!;
  }

  private detectLanguageOverride(text: string): string {
    const cyrillicChars = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
    const totalChars = text.replace(/\s/g, '').length;
    const locale = totalChars > 0 && cyrillicChars / totalChars > 0.1 ? 'ru' : 'en';
    return buildLangInstruction(locale);
  }

  private isValidProfile(content: string): boolean {
    return /CORE ISSUES|CURRENT PATTERNS|COPING STRATEGIES|LAST SESSION SUMMARY|ОСНОВНЫЕ ПРОБЛЕМЫ|ТЕКУЩИЕ ПАТТЕРНЫ|СТРАТЕГИИ СОВЛАДАНИЯ|РЕЗЮМЕ ПОСЛЕДНЕЙ СЕССИИ/i.test(
      content,
    );
  }

  private async condenseProfile(profileText: string): Promise<string> {
    const prompt =
      PROFILE_CONDENSE_PROMPT.replace('{profile}', profileText) +
      this.detectLanguageOverride(profileText);

    return this.claudeService.complete(
      prompt,
      [{ role: 'user', content: 'Condense this profile.' }],
      { model: HAIKU_MODEL, maxTokens: 1200 },
    );
  }

  private async extractAndMergeContext(
    profile: PatientProfile,
    sessionMessages: Array<{ role: string; content: string }>,
  ): Promise<void> {
    try {
      const messagesText = sessionMessages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n\n');

      const response = await this.claudeService.complete(
        EXTRACT_CONTEXT_PROMPT,
        [{ role: 'user', content: messagesText }],
        { model: HAIKU_MODEL, maxTokens: 500 },
      );

      const cleaned = response.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      const extracted: Partial<PatientContextData> = JSON.parse(cleaned);
      const current: PatientContextData = profile.patientContext ?? {};
      const merged: PatientContextData = { ...current };

      const regularFields = [
        'name',
        'age',
        'pronouns',
        'previousTherapy',
        'occupation',
        'relationships',
        'livingSituation',
        'goals',
      ] as const;

      for (const key of regularFields) {
        const currentVal = current[key];
        const extractedVal = extracted[key];
        if ((!currentVal || currentVal === '') && extractedVal != null && extractedVal !== '') {
          (merged as Record<string, unknown>)[key] = extractedVal;
        }
      }

      // medications & diagnoses: append if new info found, fill if empty
      for (const key of ['medications', 'diagnoses'] as const) {
        const currentVal = current[key];
        const extractedVal = extracted[key];
        if (!extractedVal) continue;

        if (!currentVal || currentVal === '') {
          merged[key] = String(extractedVal);
        } else if (!currentVal.toLowerCase().includes(String(extractedVal).toLowerCase())) {
          merged[key] = `${currentVal}, ${extractedVal}`;
        }
      }

      if (JSON.stringify(merged) !== JSON.stringify(current)) {
        profile.patientContext = merged;
        await this.profileRepo.save(profile);
        this.logger.log(`Auto-filled patient context for user ${profile.userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to extract patient context for user ${profile.userId}: ${(error as Error).message}`,
      );
    }
  }

  async updatePatientContext(
    userId: string,
    context: PatientContextData,
  ): Promise<PatientProfile> {
    let profile = await this.getByUserId(userId);
    const contextWithTimestamp = { ...context, updatedAt: new Date().toISOString() };

    if (!profile) {
      profile = this.profileRepo.create({
        userId,
        content: NO_AI_SESSIONS_CONTENT,
        patientContext: contextWithTimestamp,
        sessionsIncorporated: 0,
        version: 1,
      });
    } else {
      profile.patientContext = contextWithTimestamp;
    }

    return this.profileRepo.save(profile);
  }

  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    return this.getByUserId(patientId);
  }

  async updateTherapistNotes(patientId: string, notes: string): Promise<PatientProfile> {
    let profile = await this.getByUserId(patientId);

    if (!profile) {
      profile = this.profileRepo.create({
        userId: patientId,
        content: NO_AI_SESSIONS_CONTENT,
        therapistNotes: notes,
        sessionsIncorporated: 0,
        version: 1,
      });
    } else {
      profile.therapistNotes = notes;
    }

    return this.profileRepo.save(profile);
  }

  getFullContext(profile: PatientProfile): string {
    const sections: string[] = [];

    if (profile.patientContext) {
      const pc = profile.patientContext;
      const lines: string[] = [];
      if (pc.name) lines.push(`Patient prefers to be called: ${pc.name}`);
      if (pc.age) lines.push(`Age: ${pc.age}`);
      if (pc.pronouns) lines.push(`Pronouns: ${pc.pronouns}`);
      if (pc.medications) lines.push(`Current medications (patient-reported): ${pc.medications}`);
      if (pc.diagnoses) lines.push(`Diagnoses (patient-reported): ${pc.diagnoses}`);
      if (pc.previousTherapy) lines.push(`Previous therapy experience: ${pc.previousTherapy}`);
      if (pc.occupation) lines.push(`Occupation: ${pc.occupation}`);
      if (pc.relationships) lines.push(`Relationships: ${pc.relationships}`);
      if (pc.livingSituation) lines.push(`Living situation: ${pc.livingSituation}`);
      if (pc.goals) lines.push(`Patient's stated goals: ${pc.goals}`);
      if (pc.additionalNotes) lines.push(`Patient's additional notes: ${pc.additionalNotes}`);
      if (lines.length > 0) {
        sections.push(`PATIENT INTAKE INFORMATION:\n${lines.join('\n')}`);
      }
    }

    if (profile.content && profile.content !== NO_AI_SESSIONS_CONTENT) {
      sections.push(
        `CLINICAL PROFILE (AI-observed over ${profile.sessionsIncorporated} sessions):\n${profile.content}`,
      );
    }

    if (profile.therapistNotes) {
      sections.push(
        `THERAPIST INSTRUCTIONS (prioritize these in the session):\n${profile.therapistNotes}`,
      );
    }

    return sections.join('\n\n---\n\n');
  }
}
