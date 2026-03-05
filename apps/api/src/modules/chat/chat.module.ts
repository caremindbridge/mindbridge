import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClaudeModule } from '../claude';
import { ProfileModule } from '../profile/profile.module';

import { ChatSseController } from './chat-sse.controller';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { SessionAnalysis } from './entities/session-analysis.entity';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Message, SessionAnalysis]),
    ClaudeModule,
    ProfileModule,
  ],
  controllers: [ChatController, ChatSseController],
  providers: [ChatService],
})
export class ChatModule {}
