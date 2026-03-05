import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClaudeModule } from '../claude/claude.module';
import { PatientProfile } from './entities/patient-profile.entity';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfile]), ClaudeModule],
  providers: [ProfileService],
  controllers: [],
  exports: [ProfileService],
})
export class ProfileModule {}
