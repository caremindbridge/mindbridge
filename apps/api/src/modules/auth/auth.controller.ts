import { CurrentUser } from '@common/decorators/current-user.decorator';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  HttpCode,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Equals,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Request, Response } from 'express';


import { User, UserRoleEnum } from '../users/user.entity';

import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(['patient', 'therapist'])
  role?: UserRoleEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

class LoginBodyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

class DeleteAccountDto {
  @IsString()
  @Equals('DELETE')
  confirmation!: string;
}

class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

class SwitchModeDto {
  @IsString()
  @IsIn(['therapist', 'patient'])
  mode!: 'therapist' | 'patient';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterBodyDto) {
    return this.authService.register({
      email: body.email,
      password: body.password,
      role: body.role,
      name: body.name,
    });
  }

  @Post('login')
  async login(@Body() body: LoginBodyDto) {
    return this.authService.login({ email: body.email, password: body.password });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.getMe(user.id);
  }

  @Patch('me/mode')
  @UseGuards(JwtAuthGuard)
  async switchMode(@CurrentUser() user: { id: string }, @Body() dto: SwitchModeDto) {
    return this.authService.switchMode(user.id, dto.mode);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { message: 'Password updated successfully' };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteAccount(
    @CurrentUser() user: { id: string },
    @Body() dto: DeleteAccountDto,
  ) {
    await this.authService.deleteAccount(user.id);
  }

  // ─── Password reset ────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If this email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully.' };
  }

  // ─── Email Verification (temporarily disabled) ────────────────────

  // @Post('verify-email')
  // @HttpCode(200)
  // async verifyEmail(@Body() dto: VerifyEmailDto) {
  //   await this.authService.verifyEmail(dto.token);
  //   return { message: 'Email verified successfully' };
  // }

  // @Post('resend-verification')
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(200)
  // async resendVerification(
  //   @CurrentUser() user: { id: string; email: string; emailVerified?: boolean },
  // ) {
  //   const rateLimitKey = `ratelimit:verify:${user.id}`;
  //   const count = await this.authService.checkVerifyRateLimit(rateLimitKey);
  //   if (count > 1) {
  //     return { message: 'Verification email already sent. Check your inbox.' };
  //   }
  //   await this.authService.sendVerification(user.id, user.email);
  //   return { message: 'Verification email sent' };
  // }

  // ─── Google OAuth ──────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Guard redirects to Google automatically
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    await this.authService.ensureTrialExists(user);
    const token = this.authService.generateToken(user);

    const defaultFrontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';

    // Validate the state (origin passed by the frontend) against allowed origins
    const corsOrigin = process.env.CORS_ORIGIN || defaultFrontendUrl;
    const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
    const stateUrl = (req.query as Record<string, string>)['state'];
    const frontendUrl =
      stateUrl && allowedOrigins.includes(stateUrl) ? stateUrl : defaultFrontendUrl;

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}
