import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;
    const { user } = context.switchToHttp().getRequest();

    // Therapists always retain access to therapist-only endpoints regardless of active mode
    if (user?.role === 'therapist' && roles.includes('therapist')) return true;

    // Therapists can access patient-only endpoints — data is always scoped to user.id (JWT),
    // so there is no security risk. activeMode is not available here because the interceptor
    // that enriches it runs after guards.
    if (user?.role === 'therapist' && roles.includes('patient')) return true;

    // Regular role check
    const effectiveRole: string = user?.activeMode ?? user?.role;
    return roles.includes(effectiveRole);
  }
}
