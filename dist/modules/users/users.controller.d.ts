import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
export declare class UsersController {
    private readonly usersService;
    private userRepo;
    private roleRepo;
    constructor(usersService: UsersService, userRepo: Repository<User>, roleRepo: Repository<Role>);
    getTenantUsers(req: any): Promise<User[]>;
    getCurrentUser(req: any): Promise<User | null>;
    getTenantRoles(req: any): Promise<Role[]>;
    createTenantRole(req: any, body: {
        name: string;
        description?: string;
    }): Promise<Role>;
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
