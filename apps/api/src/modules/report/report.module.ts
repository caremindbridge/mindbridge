import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { ClaudeModule } from '../claude/claude.module';
import { Mood } from '../mood/mood.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TherapistModule } from '../therapist/therapist.module';
import { ReportController } from './report.controller';
import { Report } from './report.entity';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Mood, SessionAnalysis]),
    TherapistModule,
    ClaudeModule,
    SubscriptionModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
