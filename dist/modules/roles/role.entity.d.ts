import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
export declare class Role {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    tenant?: Tenant;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
