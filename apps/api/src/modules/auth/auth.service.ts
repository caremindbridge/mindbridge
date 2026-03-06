import { randomBytes, randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { User, UserRoleEnum } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    role?: UserRoleEnum;
    name?: string;
  }): Promise<{ access_token: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    const user = await this.usersService.create(dto.email, hashedPassword, {
      role: dto.role,
      name: dto.name,
    });

    const trialPlan = user.role === UserRoleEnum.Therapist ? 'therapist_trial' : 'trial';
    await this.subscriptionService.createTrial(user.id, trialPlan);

    // Email verification is temporarily disabled
    // this.sendVerification(user.id, user.email).catch((err) =>
    //   this.logger.error('Failed to send verification email', err),
    // );

    return { access_token: this.generateToken(user) };
  }

  async login(dto: {
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account uses social login. Please sign in with Google.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset activeMode on login so therapists always start in therapist mode
    if (user.role === UserRoleEnum.Therapist && user.activeMode !== null) {
      await this.usersService.updateActiveMode(user.id, null);
      await this.redisService.clearActiveMode(user.id);
    }

    return { access_token: this.generateToken(user) };
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: string;
    activeMode: string;
    provider: string | null;
    emailVerified: boolean;
    createdAt: Date;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      activeMode: user.activeMode ?? user.role,
      provider: user.provider,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  async switchMode(userId: string, mode: 'therapist' | 'patient'): Promise<{ activeMode: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRoleEnum.Therapist) {
      throw new ForbiddenException('Only therapists can switch modes');
    }

    if (mode === 'patient') {
      const patientSub = await this.subscriptionService.getActiveByType(userId, 'patient');
      if (!patientSub) {
        await this.subscriptionService.createTrial(userId, 'trial');
      }
    }

    await this.usersService.updateActiveMode(userId, mode);
    await this.redisService.clearActiveMode(userId);

    return { activeMode: mode };
  }

  async forgotPassword(email: string): Promise<void> {
    // Rate limit: max 3 requests per email per 15 minutes
    const rateLimitKey = `ratelimit:reset:${email}`;
    const count = await this.redisService.incrementRateLimit(rateLimitKey, 900);
    if (count > 3) return;

    const user = await this.usersService.findByEmail(email);
    // Don't reveal whether the email exists
    if (!user || !user.password) return;

    const token = randomBytes(32).toString('hex');
    await this.redisService.setResetToken(token, user.id);

    const frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordReset(user.email, resetUrl);
  }

  async updateProfile(
    userId: string,
    dto: { name?: string },
  ): Promise<{
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: string;
    provider: string | null;
    emailVerified: boolean;
    createdAt: Date;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.name !== undefined) user.name = dto.name || null;
    await this.usersService.save(user);
    return this.getMe(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.provider !== 'local' || !user.password) {
      throw new BadRequestException('Password change not available for OAuth accounts');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.usersService.delete(userId);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redisService.getResetToken(token);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);
    await this.redisService.deleteResetToken(token);
  }

  async ensureTrialExists(user: User): Promise<void> {
    const existing = await this.subscriptionService.getActive(user.id);
    if (!existing) {
      const plan = user.role === UserRoleEnum.Therapist ? 'therapist_trial' : 'trial';
      await this.subscriptionService.createTrial(user.id, plan);
    }
    // Reset activeMode on OAuth login so therapists always start in therapist mode
    if (user.role === UserRoleEnum.Therapist && user.activeMode !== null) {
      await this.usersService.updateActiveMode(user.id, null);
      await this.redisService.clearActiveMode(user.id);
    }
  }

  async checkVerifyRateLimit(key: string): Promise<number> {
    return this.redisService.incrementRateLimit(key, 120);
  }

  async sendVerification(userId: string, email: string): Promise<void> {
    const token = randomUUID();
    await this.redisService.setVerificationToken(token, userId);
    const frontendUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/auth/verified?token=${token}`;
    await this.emailService.sendVerificationEmail(email, verifyUrl);
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.redisService.getVerificationToken(token);
    if (!userId) throw new BadRequestException('Invalid or expired verification link');

    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    user.emailVerified = true;
    await this.usersService.save(user);
    await this.redisService.deleteVerificationToken(token);
  }

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }
}
