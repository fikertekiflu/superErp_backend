import { User } from '../users/user.entity';
import { Workflow } from './workflow.entity';
export declare enum StepType {
    TASK = "task",
    APPROVAL = "approval",
    NOTIFICATION = "notification",
    CONDITION = "condition",
    AUTOMATION = "automation"
}
export declare enum StepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    SKIPPED = "skipped",
    FAILED = "failed"
}
export declare class WorkflowStep {
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    order: number;
    config: {
        assignToRoles?: string[];
        assignToUsers?: string[];
        requiredFields?: string[];
        conditions?: {
            field: string;
            operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
            value: any;
        }[];
        actions?: {
            type: 'create_entity' | 'update_entity' | 'send_notification' | 'update_field';
            config?: any;
        }[];
        timeLimit?: number;
    };
    validationRules: {
        required: string[];
        fieldValidations: {
            field: string;
            type: 'required' | 'format' | 'range';
            rule: any;
        }[];
    };
    workflow: Workflow;
    workflowId: string;
    assignedTo: User;
    assignedToId: string;
    completedBy: User;
    completedById: string;
    result: {
        success: boolean;
        data?: any;
        error?: string;
    };
    startedAt: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
