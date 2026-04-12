import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsString } from 'class-validator';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionCategoryEnum, SessionStatusEnum } from './entities/session.entity';
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
    @Query('category') category?: SessionCategoryEnum,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const { sessions, total } = await this.chatService.getSessions(user.id, p, l, status, category);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        title: s.title,
        category: s.category,
        userId: s.userId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        endedAt: s.endedAt,
        analysis: s.analysis
          ? {
              anxietyLevel: s.analysis.anxietyLevel,
              depressionLevel: s.analysis.depressionLevel,
              moodOutcome: s.analysis.moodOutcome,
              shortSummary: s.analysis.shortSummary,
            }
          : null,
      })),
      total,
      page: p,
      limit: l,
    };
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
    @Headers('x-locale') locale?: string,
  ) {
    return this.chatService.sendMessage(id, user.id, body.content, locale ?? 'en');
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

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — Whisper hard limit
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
    @Body('language') language?: string,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');
    return this.chatService.transcribeAudio(file.buffer, file.mimetype, user.id, language);
  }
}
