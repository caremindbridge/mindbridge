import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientAccessGuard } from '../therapist/guards/patient-access.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('mood-metrics')
  async getMyMoodMetrics(
    @CurrentUser() user: { id: string; role: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.dashboardService.getMoodMetrics(user.id, fromDate, toDate);
  }

  @Get('mood-metrics/user/:userId')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  async getUserMoodMetrics(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.dashboardService.getMoodMetrics(userId, fromDate, toDate);
  }
}
