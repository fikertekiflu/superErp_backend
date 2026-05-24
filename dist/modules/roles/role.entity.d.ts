import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
export interface RoleEntityPermission {
    entityId: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}
export declare class Role {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    entityPermissions: RoleEntityPermission[];
    maxApprovalAmount?: number | null;
    tenant?: Tenant;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
