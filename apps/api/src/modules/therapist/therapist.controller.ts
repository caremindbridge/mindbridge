import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
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
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from '../profile/profile.service';

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

class UpdateTherapistNotesDto {
  @IsString()
  @MaxLength(2000)
  notes!: string;
}

@Controller('therapist')
@UseGuards(JwtAuthGuard)
export class TherapistController {
  constructor(
    private readonly therapistService: TherapistService,
    private readonly profileService: ProfileService,
  ) {}

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

  @Get('patients/:id/profile')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  async getPatientDossier(@Param('id', ParseUUIDPipe) patientId: string) {
    const profile = await this.profileService.getByUserId(patientId);

    if (!profile) {
      return {
        patientId,
        hasDossier: false,
        message:
          'No data yet. Dossier will appear after the patient fills About Me or completes a session.',
      };
    }

    const NO_AI = 'No AI sessions yet.';

    return {
      patientId,
      hasDossier: true,
      updatedAt: profile.updatedAt,
      intake: profile.patientContext ?? null,
      clinicalProfile:
        profile.content && profile.content !== NO_AI
          ? { content: profile.content, sessionsIncorporated: profile.sessionsIncorporated }
          : null,
      therapistNotes: profile.therapistNotes,
    };
  }

  @Patch('patients/:id/profile/notes')
  @UseGuards(RolesGuard, PatientAccessGuard)
  @Roles('therapist')
  async updateTherapistNotes(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateTherapistNotesDto,
  ) {
    const profile = await this.profileService.updateTherapistNotes(patientId, dto.notes);
    return {
      id: profile.id,
      therapistNotes: profile.therapistNotes,
      updatedAt: profile.updatedAt,
    };
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
