import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId') ?? '',
      clientSecret: configService.get<string>('google.clientSecret') ?? '',
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, name, photos, id } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('No email returned from Google'), undefined);
    }

    const user = await this.usersService.findOrCreateOAuth({
      email,
      name:
        [name?.givenName, name?.familyName].filter(Boolean).join(' ') ||
        email.split('@')[0],
      avatar: photos?.[0]?.value ?? undefined,
      provider: 'google',
      providerId: id,
    });

    done(null, user);
  }
}
