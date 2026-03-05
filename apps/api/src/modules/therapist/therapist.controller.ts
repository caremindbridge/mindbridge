import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientAccessGuard } from './guards/patient-access.guard';
import { TherapistService } from './therapist.service';

class InvitePatientDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
}

class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;
}

@Controller('therapist')
@UseGuards(JwtAuthGuard)
export class TherapistController {
  constructor(private readonly therapistService: TherapistService) {}

  @Post('invite')
  @UseGuards(RolesGuard)
  @Roles('therapist')
  invitePatient(
    @CurrentUser() user: { id: string },
    @Body() dto: InvitePatientDto,
  ) {
    return this.therapistService.invitePatient(user.id, dto.email);
  }

  @Post('accept-invite')
  @UseGuards(RolesGuard)
  @Roles('patient')
  acceptInvite(
    @CurrentUser() user: { id: string },
    @Body() dto: AcceptInviteDto,
  ) {
    return this.therapistService.acceptInvite(user.id, dto.inviteCode);
  }

  @Get('patients')
  @UseGuards(RolesGuard)
  @Roles('therapist')
  getPatients(@CurrentUser() user: { id: string }) {
    return this.therapistService.getPatients(user.id);
  }

  @Get('patients/:id')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  getPatientProfile(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) patientId: string,
  ) {
    return this.therapistService.getPatientProfile(user.id, patientId);
  }

  @Delete('patients/:id')
  @HttpCode(204)
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  disconnectPatient(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) patientId: string,
  ) {
    return this.therapistService.disconnectPatient(user.id, patientId);
  }

  @Get('my-therapist')
  @UseGuards(RolesGuard)
  @Roles('patient')
  getMyTherapist(@CurrentUser() user: { id: string }) {
    return this.therapistService.getMyTherapist(user.id);
  }

  @Delete('my-therapist')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('patient')
  disconnectFromTherapist(@CurrentUser() user: { id: string }) {
    return this.therapistService.disconnectFromTherapist(user.id);
  }
}
