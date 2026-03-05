import { Controller, Get, Param, ParseUUIDPipe, Query, Sse, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, merge, interval } from 'rxjs';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

interface SseMessageEvent {
  data: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatSseController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly chatService: ChatService,
  ) {}

  @Get('sessions/:id/stream')
  @Sse()
  async stream(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: { id: string },
  ): Promise<Observable<SseMessageEvent>> {
    await this.chatService.verifySessionOwnership(sessionId, user.id);

    const chatEvents$ = fromEvent(this.eventEmitter, `chat.${sessionId}`).pipe(
      map((event: unknown) => ({
        data: JSON.stringify(event),
      })),
    );

    const keepalive$ = interval(15000).pipe(
      map(() => ({
        data: JSON.stringify({ type: 'keepalive' }),
      })),
    );

    return merge(chatEvents$, keepalive$);
  }
}
