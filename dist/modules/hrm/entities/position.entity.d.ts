import { Tenant } from '../../tenants/tenant.entity';
export declare class Position {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
}
