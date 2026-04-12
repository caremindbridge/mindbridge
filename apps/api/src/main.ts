import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api', { exclude: ['/'] });

  const corsOrigin = process.env.CORS_ORIGIN || configService.get<string>('frontendUrl') || 'http://localhost:3000';
  const origins = corsOrigin.split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Locale'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('port', 3001);

  // 0.0.0.0 required for Railway/Docker — localhost won't bind correctly
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on port ${port}`);
}

bootstrap();
