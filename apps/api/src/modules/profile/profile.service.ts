import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClaudeService } from '../claude/claude.service';
import { PatientProfile } from './entities/patient-profile.entity';
import {
  PROFILE_CONDENSE_PROMPT,
  PROFILE_INIT_PROMPT,
  PROFILE_UPDATE_PROMPT,
} from './profile.prompts';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

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
      PROFILE_INIT_PROMPT,
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

    if (!existing) {
      return this.createInitialProfile(userId, sessionMessages);
    }

    const messagesText = sessionMessages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = PROFILE_UPDATE_PROMPT.replace(
      '{current_profile}',
      existing.content,
    ).replace('{session_messages}', messagesText);

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

    existing.content = finalContent;
    existing.sessionsIncorporated += 1;
    existing.version += 1;

    return this.profileRepo.save(existing);
  }

  private async condenseProfile(profileText: string): Promise<string> {
    const prompt = PROFILE_CONDENSE_PROMPT.replace('{profile}', profileText);

    return this.claudeService.complete(
      prompt,
      [{ role: 'user', content: 'Condense this profile.' }],
      { model: HAIKU_MODEL, maxTokens: 1200 },
    );
  }

  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    return this.getByUserId(patientId);
  }

  async updateTherapistNotes(patientId: string, notes: string): Promise<PatientProfile> {
    let profile = await this.getByUserId(patientId);

    if (!profile) {
      profile = this.profileRepo.create({
        userId: patientId,
        content: 'PATIENT PROFILE\n---\nNo AI sessions yet.\n---',
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
    let context = profile.content;

    if (profile.therapistNotes) {
      context += `\n\nTHERAPIST NOTES (follow these instructions during the session):\n${profile.therapistNotes}`;
    }

    return context;
  }
}
