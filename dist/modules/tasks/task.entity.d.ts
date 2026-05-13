import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { WorkflowExecution } from '../workflows/workflow-execution.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum TaskType {
    TASK = "task",
    APPROVAL = "approval"
}
export declare class Task {
    id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    assignedTo: User;
    assignedToId: string;
    assignedToRoleId: string;
    visibleToRoleIds: string[];
    claimedBy: User;
    claimedByUserId: string;
    claimedAt: Date;
    createdBy: User;
    createdById: string;
    tenant: Tenant;
    tenantId: string;
    execution: WorkflowExecution;
    executionId: string;
    step: WorkflowStep;
    stepId: string;
    metadata: {
        entityName?: string;
        entityId?: string;
        actionRequired?: string;
        priority?: 'low' | 'medium' | 'high';
    };
    dueDate: Date;
    completedAt: Date;
    result: {
        approved?: boolean;
        notes?: string;
        data?: any;
    };
    createdAt: Date;
    updatedAt: Date;
}
