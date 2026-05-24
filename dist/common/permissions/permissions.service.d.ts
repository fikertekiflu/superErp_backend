import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { Role, RoleEntityPermission } from '../../modules/roles/role.entity';
import { EntityAction, UserPermissionSnapshot } from './permissions.types';
export declare class PermissionsService {
    private readonly userRepository;
    private readonly roleRepository;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>);
    isTenantAdmin(systemRole: string): boolean;
    isSuperAdmin(systemRole: string): boolean;
    getSnapshot(userId: string, tenantId: string | undefined, systemRole: string): Promise<UserPermissionSnapshot>;
    assertCanManageSchemas(userId: string, tenantId: string | undefined, systemRole: string): Promise<void>;
    assertEntityAction(userId: string, tenantId: string | undefined, systemRole: string, entityId: string, action: EntityAction): Promise<void>;
    filterReadableEntityIds(userId: string, tenantId: string | undefined, systemRole: string, entityIds: string[]): Promise<string[]>;
    mergeGrant(existing: RoleEntityPermission[], grant: RoleEntityPermission): RoleEntityPermission[];
}
