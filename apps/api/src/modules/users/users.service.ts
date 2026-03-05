import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRoleEnum } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(
    email: string,
    hashedPassword: string | null,
    options?: {
      name?: string;
      avatar?: string;
      role?: UserRoleEnum;
      provider?: string;
      providerId?: string;
      emailVerified?: boolean;
    },
  ): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name: options?.name ?? null,
      role: options?.role ?? UserRoleEnum.Patient,
      provider: options?.provider ?? 'local',
      providerId: options?.providerId ?? null,
      avatar: options?.avatar ?? null,
      emailVerified: options?.emailVerified ?? false,
    });
    return this.usersRepository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async delete(userId: string): Promise<void> {
    await this.usersRepository.delete(userId);
  }

  async findOrCreateOAuth(profile: {
    email: string;
    name: string;
    avatar?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // 1. Look up by provider + providerId (exact OAuth account match)
    let user = await this.usersRepository.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
    });
    if (user) return user;

    // 2. Look up by email (user may have registered with email+password first)
    user = await this.usersRepository.findOne({ where: { email: profile.email } });
    if (user) {
      user.provider = profile.provider;
      user.providerId = profile.providerId;
      user.emailVerified = true;
      if (!user.name) user.name = profile.name;
      if (!user.avatar) user.avatar = profile.avatar ?? null;
      return this.usersRepository.save(user);
    }

    // 3. Create new OAuth user (no password)
    return this.create(profile.email, null, {
      name: profile.name,
      provider: profile.provider,
      providerId: profile.providerId,
      avatar: profile.avatar,
      emailVerified: true,
    });
  }
}
