import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TherapistModule } from '../therapist/therapist.module';
import { MoodController } from './mood.controller';
import { Mood } from './mood.entity';
import { MoodService } from './mood.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mood]), TherapistModule],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}
