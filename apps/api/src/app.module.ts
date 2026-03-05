import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { ChatModule } from './modules/chat/chat.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MoodModule } from './modules/mood/mood.module';
import { RedisModule } from './modules/redis';
import { ProfileModule } from './modules/profile/profile.module';
import { ReportModule } from './modules/report/report.module';
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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('database.url'),
        autoLoadEntities: true,
        // WARNING: synchronize should be false in production.
        // Use migrations instead.
        synchronize: true,
      }),
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
  ],
})
export class AppModule {}
