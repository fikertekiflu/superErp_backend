import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare class WorkflowDelegation {
    id: string;
    tenantId: string;
    tenant: Tenant;
    delegatorUserId: string;
    delegator: User;
    delegateUserId: string;
    delegate: User;
    roleIds: string[];
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}
