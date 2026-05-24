import { Workflow } from './workflow.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare enum ExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    PAUSED = "paused",
    CANCELLED = "cancelled",
    REJECTED = "rejected"
}
export declare enum WorkflowState {
    DRAFT = "draft",
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    REVIEW = "review",
    APPROVAL = "approval",
    IT_SETUP = "it_setup",
    FINANCE_APPROVAL = "finance_approval",
    HR_FINALIZATION = "hr_finalization",
    COMPLETED = "completed",
    REJECTED = "rejected",
    CANCELLED = "cancelled"
}
export declare class WorkflowExecution {
    id: string;
    workflow: Workflow;
    workflowId: string;
    tenant: Tenant;
    tenantId: string;
    triggeredBy: User;
    triggeredById: string;
    status: string;
    currentState: string;
    currentStepOrder: number;
    stateHistory: {
        fromState: string;
        toState: string;
        timestamp: string;
        actorId?: string;
        actorName?: string;
        action?: string;
        notes?: string;
    }[];
    context: {
        entityId?: string;
        recordId?: string;
        entityDefinitionId?: string;
        entityType?: string;
        entityData?: Record<string, any>;
        triggerType?: string;
        [key: string]: any;
    };
    stepResults: any[];
    startedAt: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
