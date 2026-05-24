import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Role, RoleEntityPermission } from '../roles/role.entity';
export declare class UsersService {
    private userRepository;
    private roleRepository;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>);
    findOne(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateData: any): Promise<void>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<User>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    sanitizeUser(user: User): Omit<User, 'password'>;
    updateUserApprovalLimit(userId: string, tenantId: string, approvalLimitOverride?: number | null): Promise<User>;
    getTenantRoles(tenantId: string): Promise<Role[]>;
    createTenantRole(tenantId: string, data: {
        name: string;
        description?: string;
        entityPermissions?: RoleEntityPermission[];
    }): Promise<Role>;
    updateTenantRole(roleId: string, tenantId: string, data: Partial<Role>): Promise<Role>;
    deleteTenantRole(roleId: string, tenantId: string): Promise<void>;
    assignRoleToUser(userId: string, roleId: string, tenantId: string): Promise<void>;
    removeRoleFromUser(userId: string, roleId: string, tenantId: string): Promise<void>;
    getTenantUsers(tenantId: string): Promise<User[]>;
    createTenantUser(tenantId: string, data: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        role?: UserRole;
        roleIds?: string[];
    }): Promise<User>;
}
