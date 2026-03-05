import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionAnalysis } from '../chat/entities/session-analysis.entity';
import { TherapistModule } from '../therapist/therapist.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionAnalysis]), TherapistModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
