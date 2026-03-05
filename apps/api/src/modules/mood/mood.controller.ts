import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientAccessGuard } from '../therapist/guards/patient-access.guard';
import { CreateMoodDto } from './dto/create-mood.dto';
import { MoodQueryDto } from './dto/mood-query.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { MoodService } from './mood.service';

@Controller('mood')
@UseGuards(JwtAuthGuard)
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('patient')
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateMoodDto,
  ) {
    return this.moodService.create(user.id, dto);
  }

  @Get('stats')
  getStats(@CurrentUser() user: { id: string }) {
    return this.moodService.getStats(user.id);
  }

  @Get('emotions')
  getEmotions(
    @CurrentUser() user: { id: string },
    @Query() q: MoodQueryDto,
  ) {
    return this.moodService.getEmotionDistribution(user.id, q.from, q.to);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  findByPatient(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() q: MoodQueryDto,
  ) {
    return this.moodService.findByUser(userId, q.from, q.to);
  }

  @Get('user/:userId/stats')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  getPatientStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.moodService.getStats(userId);
  }

  @Get()
  findMy(
    @CurrentUser() user: { id: string },
    @Query() q: MoodQueryDto,
  ) {
    return this.moodService.findByUser(user.id, q.from, q.to);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMoodDto,
  ) {
    return this.moodService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.moodService.delete(id, user.id);
  }
}
