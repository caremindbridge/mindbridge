import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { Mood } from '../mood/mood.entity';
import { UsersModule } from '../users/users.module';
import { PatientTherapist } from './entities/patient-therapist.entity';
import { PatientAccessGuard } from './guards/patient-access.guard';
import { TherapistController } from './therapist.controller';
import { TherapistService } from './therapist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientTherapist, Mood, SessionAnalysis]),
    UsersModule,
  ],
  controllers: [TherapistController],
  providers: [TherapistService, PatientAccessGuard],
  exports: [TherapistService, PatientAccessGuard],
})
export class TherapistModule {}
