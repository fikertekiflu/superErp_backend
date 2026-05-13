import { WorkflowExecution } from './workflow-execution.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare enum EventType {
    TRIGGERED = "triggered",
    STATE_CHANGED = "state_changed",
    TASK_CREATED = "task_created",
    TASK_CLAIMED = "task_claimed",
    TASK_COMPLETED = "task_completed",
    APPROVAL_REQUESTED = "approval_requested",
    APPROVED = "approved",
    REJECTED = "rejected",
    STEP_EXECUTED = "step_executed",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ESCALATED = "escalated"
}
export declare class WorkflowEvent {
    id: string;
    execution: WorkflowExecution;
    executionId: string;
    tenant: Tenant;
    tenantId: string;
    actor: User;
    actorId: string;
    eventType: EventType;
    fromState: string;
    toState: string;
    stepId: string;
    stepName: string;
    taskId: string;
    metadata: {
        approved?: boolean;
        rejectionReason?: string;
        assignedToRoleId?: string;
        assignedToUserId?: string;
        triggerReason?: string;
        overdueHours?: number;
        escalatedTo?: string;
        [key: string]: any;
    };
    notes: string;
    createdAt: Date;
}
