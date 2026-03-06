import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { ActiveModeInterceptor } from './common/interceptors/active-mode.interceptor';

import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmailModule } from './modules/email/email.module';
import { MoodModule } from './modules/mood/mood.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RedisModule } from './modules/redis';
import { ReportModule } from './modules/report/report.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { TherapistModule } from './modules/therapist/therapist.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('database.url');
        return {
          type: 'postgres' as const,
          url: dbUrl,
          autoLoadEntities: true,
          // WARNING: synchronize should be false in production once stable.
          synchronize: true,
          ssl:
            dbUrl?.includes('neon.tech') || process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),
    RedisModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ChatModule,
    DashboardModule,
    MoodModule,
    TherapistModule,
    ReportModule,
    ProfileModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ActiveModeInterceptor }],
})
export class AppModule {}
