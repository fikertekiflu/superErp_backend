import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { WorkflowExecution } from './workflow-execution.entity';
export declare class WorkflowApprovalLimitsService {
    private readonly userRepo;
    private readonly roleRepo;
    constructor(userRepo: Repository<User>, roleRepo: Repository<Role>);
    getEffectiveLimit(userId: string, tenantId: string, assignedToRoleId?: string): Promise<number | null>;
    assertCanApproveAmount(userId: string, tenantId: string, execution: WorkflowExecution, assignedToRoleId?: string, amountField?: string): Promise<void>;
}
