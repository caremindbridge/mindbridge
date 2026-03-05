import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ProfileService } from './profile.service';

class UpdatePatientContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  pronouns?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  medications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnoses?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  previousTherapy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  relationships?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  livingSituation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goals?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalNotes?: string;
}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('my')
  async getMyProfile(@CurrentUser() user: { id: string }) {
    const profile = await this.profileService.getByUserId(user.id);

    if (!profile) {
      return { content: null, sessionsIncorporated: 0 };
    }

    return {
      content: profile.content,
      sessionsIncorporated: profile.sessionsIncorporated,
      updatedAt: profile.updatedAt,
    };
  }

  @Get('my/context')
  async getMyContext(@CurrentUser() user: { id: string }) {
    const profile = await this.profileService.getByUserId(user.id);
    return { context: profile?.patientContext ?? null };
  }

  @Put('my/context')
  async updateMyContext(
    @CurrentUser() user: { id: string },
    @Body('context') dto: UpdatePatientContextDto,
  ) {
    const profile = await this.profileService.updatePatientContext(user.id, dto ?? {});
    return { context: profile.patientContext };
  }
}
