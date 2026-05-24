import { Repository } from 'typeorm';
import { WorkflowDelegation } from './workflow-delegation.entity';
import { User } from '../users/user.entity';
export declare class WorkflowDelegationsService {
    private readonly delegationRepo;
    private readonly userRepo;
    constructor(delegationRepo: Repository<WorkflowDelegation>, userRepo: Repository<User>);
    create(tenantId: string, delegatorUserId: string, body: {
        delegateUserId: string;
        startsAt: string;
        endsAt: string;
        roleIds?: string[];
        reason?: string;
    }): Promise<WorkflowDelegation>;
    listForUser(tenantId: string, userId: string): Promise<{
        granted: WorkflowDelegation[];
        received: WorkflowDelegation[];
    }>;
    revoke(id: string, tenantId: string, userId: string): Promise<WorkflowDelegation>;
    getActiveDelegateRoleIds(tenantId: string, delegateUserId: string): Promise<string[]>;
    canActOnRole(tenantId: string, userId: string, assignedToRoleId: string | undefined, userRoleIds: string[]): Promise<{
        allowed: boolean;
        viaDelegation: boolean;
    }>;
}
