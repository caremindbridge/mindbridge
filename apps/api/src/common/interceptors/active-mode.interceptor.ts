import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { RedisService } from '../../modules/redis/redis.service';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class ActiveModeInterceptor implements NestInterceptor {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<{ user?: { id?: string; role?: string; activeMode?: string } }>();

    if (req.user?.id) {
      const userId = req.user.id;
      let mode = await this.redisService.getActiveMode(userId);

      if (!mode) {
        const dbUser = await this.usersService.findById(userId);
        mode = dbUser?.activeMode ?? dbUser?.role ?? req.user.role ?? 'patient';
        await this.redisService.setActiveMode(userId, mode);
      }

      req.user.activeMode = mode;
    }

    return next.handle();
  }
}
