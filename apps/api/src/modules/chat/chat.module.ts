import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClaudeModule } from '../claude';
import { Mood } from '../mood/mood.entity';
import { ProfileModule } from '../profile/profile.module';
import { RedisModule } from '../redis/redis.module';
import { SubscriptionModule } from '../subscription/subscription.module';

import { ChatCleanupService } from './chat-cleanup.service';
import { ChatSseController } from './chat-sse.controller';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { SessionAnalysis } from './entities/session-analysis.entity';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Message, SessionAnalysis, Mood]),
    ScheduleModule.forRoot(),
    ClaudeModule,
    ProfileModule,
    RedisModule,
    SubscriptionModule,
  ],
  controllers: [ChatController, ChatSseController],
  providers: [ChatService, ChatCleanupService],
})
export class ChatModule {}
