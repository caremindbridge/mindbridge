import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionStatusEnum } from './entities/session.entity';
import { ChatService } from './chat.service';

class SendMessageBodyDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  async createSession(@CurrentUser() user: { id: string }) {
    return this.chatService.createSession(user.id);
  }

  @Get('sessions')
  async getSessions(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SessionStatusEnum,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const { sessions, total } = await this.chatService.getSessions(user.id, p, l, status);
    return { sessions, total, page: p, limit: l };
  }

  @Get('sessions/:id')
  async getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.getSession(id, user.id);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() body: SendMessageBodyDto,
  ) {
    return this.chatService.sendMessage(id, user.id, body.content);
  }

  @Post('sessions/:id/end')
  async endSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.endSession(id, user.id);
  }

  @Get('sessions/:id/analysis')
  async getAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.getAnalysis(id, user.id);
  }

  @Delete('sessions/:id')
  async deleteSession(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.chatService.deleteSession(id, user.id);
    return { success: true };
  }
}
