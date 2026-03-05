import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PatientAccessGuard } from '../therapist/guards/patient-access.guard';
import { GenerateReportDto, ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('therapist')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  generate(@CurrentUser() user: { id: string }, @Body() dto: GenerateReportDto) {
    return this.reportService.generate(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.reportService.findById(id, user.id);
  }

  @Get('patient/:patientId')
  @UseGuards(PatientAccessGuard)
  findByPatient(@Param('patientId') patientId: string, @CurrentUser() user: { id: string }) {
    return this.reportService.findByPatient(user.id, patientId);
  }
}
