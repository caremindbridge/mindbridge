import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { TherapistService } from '../therapist.service';

@Injectable()
export class PatientAccessGuard implements CanActivate {
  constructor(private readonly therapistService: TherapistService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      user: { id: string };
      params: Record<string, string>;
    }>();
    const therapistId = req.user.id;
    const patientId = req.params['id'] ?? req.params['userId'] ?? req.params['patientId'];
    if (!patientId) return false;
    return this.therapistService.isLinked(therapistId, patientId);
  }
}
