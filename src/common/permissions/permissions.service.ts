import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../modules/users/user.entity';
import { Role, RoleEntityPermission } from '../../modules/roles/role.entity';
import {
  EntityAction,
  ResolvedEntityPermission,
  UserPermissionSnapshot,
} from './permissions.types';

const FULL: ResolvedEntityPermission = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
};

const NONE: ResolvedEntityPermission = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
};

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  isTenantAdmin(systemRole: string): boolean {
    return systemRole === UserRole.TENANT_ADMIN;
  }

  isSuperAdmin(systemRole: string): boolean {
    return systemRole === UserRole.SUPER_ADMIN;
  }

  async getSnapshot(
    userId: string,
    tenantId: string | undefined,
    systemRole: string,
  ): Promise<UserPermissionSnapshot> {
    if (this.isSuperAdmin(systemRole)) {
      return {
        systemRole,
        canManageSchemas: true,
        isFullAccess: true,
        byEntity: {},
      };
    }

    if (this.isTenantAdmin(systemRole)) {
      return {
        systemRole,
        canManageSchemas: true,
        isFullAccess: true,
        byEntity: {},
      };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });

    const byEntity: Record<string, ResolvedEntityPermission> = {};

    for (const role of user?.roles || []) {
      const grants = role.entityPermissions || [];
      for (const grant of grants) {
        const current = byEntity[grant.entityId] || { ...NONE };
        byEntity[grant.entityId] = {
          canCreate: current.canCreate || grant.canCreate,
          canRead: current.canRead || grant.canRead,
          canUpdate: current.canUpdate || grant.canUpdate,
          canDelete: current.canDelete || grant.canDelete,
        };
      }
    }

    return {
      systemRole,
      canManageSchemas: false,
      isFullAccess: false,
      byEntity,
    };
  }

  async assertCanManageSchemas(
    userId: string,
    tenantId: string | undefined,
    systemRole: string,
  ): Promise<void> {
    const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
    if (!snapshot.canManageSchemas) {
      throw new ForbiddenException(
        'Only tenant administrators can manage entity definitions',
      );
    }
  }

  async assertEntityAction(
    userId: string,
    tenantId: string | undefined,
    systemRole: string,
    entityId: string,
    action: EntityAction,
  ): Promise<void> {
    const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
    if (snapshot.isFullAccess) return;

    const perms = snapshot.byEntity[entityId] || NONE;
    const allowed =
      action === 'create'
        ? perms.canCreate
        : action === 'read'
          ? perms.canRead
          : action === 'update'
            ? perms.canUpdate
            : perms.canDelete;

    if (!allowed) {
      throw new ForbiddenException(
        `You do not have permission to ${action} records for this entity`,
      );
    }
  }

  async filterReadableEntityIds(
    userId: string,
    tenantId: string | undefined,
    systemRole: string,
    entityIds: string[],
  ): Promise<string[]> {
    const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
    if (snapshot.isFullAccess) return entityIds;
    return entityIds.filter((id) => snapshot.byEntity[id]?.canRead);
  }

  mergeGrant(
    existing: RoleEntityPermission[],
    grant: RoleEntityPermission,
  ): RoleEntityPermission[] {
    const idx = existing.findIndex((g) => g.entityId === grant.entityId);
    if (idx === -1) return [...existing, grant];
    const next = [...existing];
    next[idx] = grant;
    return next;
  }
}
