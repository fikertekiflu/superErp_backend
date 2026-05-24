import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role, RoleEntityPermission } from '../roles/role.entity';
import { PermissionsService } from '../../common/permissions/permissions.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly permissionsService;
    private userRepo;
    private roleRepo;
    constructor(usersService: UsersService, permissionsService: PermissionsService, userRepo: Repository<User>, roleRepo: Repository<Role>);
    getMyPermissions(req: any): Promise<import("../../common/permissions/permissions.types").UserPermissionSnapshot>;
    getTenantUsers(req: any): Promise<User[]>;
    getCurrentUser(req: any): Promise<Omit<User, "password"> | null>;
    updateCurrentUser(req: any, body: UpdateProfileDto): Promise<Omit<User, "password">>;
    changePassword(req: any, body: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getTenantRoles(req: any): Promise<Role[]>;
    createTenantRole(req: any, body: {
        name: string;
        description?: string;
        entityPermissions?: RoleEntityPermission[];
    }): Promise<Role>;
    updateTenantRole(req: any, roleId: string, body: {
        name?: string;
        description?: string;
        entityPermissions?: RoleEntityPermission[];
        maxApprovalAmount?: number | null;
    }): Promise<Role>;
    setUserApprovalLimit(req: any, userId: string, body: {
        approvalLimitOverride?: number | null;
    }): Promise<User>;
    updateRolePermissions(req: any, roleId: string, body: {
        entityPermissions: RoleEntityPermission[];
    }): Promise<Role>;
    deleteTenantRole(req: any, roleId: string): Promise<{
        message: string;
    }>;
    assignRoleToUser(req: any, roleId: string, userId: string): Promise<{
        message: string;
    }>;
    removeRoleFromUser(req: any, roleId: string, userId: string): Promise<{
        message: string;
    }>;
    createTenantUser(req: any, body: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        role?: UserRole;
        roleIds?: string[];
    }): Promise<User>;
    getUsersByRole(req: any, roleId: string): Promise<User[]>;
}
