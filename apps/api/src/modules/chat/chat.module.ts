import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClaudeModule } from '../claude';
import { ChatController } from './chat.controller';
import { ChatSseController } from './chat-sse.controller';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Session } from './entities/session.entity';
import { SessionAnalysis } from './entities/session-analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Message, SessionAnalysis]),
    ClaudeModule,
  ],
  controllers: [ChatController, ChatSseController],
  providers: [ChatService],
})
export class ChatModule {}
