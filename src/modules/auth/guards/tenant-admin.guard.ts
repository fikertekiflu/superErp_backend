import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '../../users/user.entity';

@Injectable()
export class TenantAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const role = user?.role;
    if (
      role === UserRole.TENANT_ADMIN ||
      role === UserRole.SUPER_ADMIN
    ) {
      return true;
    }
    throw new ForbiddenException('Tenant administrator access required');
  }
}
