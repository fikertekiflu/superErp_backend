import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowState } from './workflow-state.entity';
export declare enum WorkflowStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    PAUSED = "paused",
    COMPLETED = "completed",
    ARCHIVED = "archived"
}
export declare enum WorkflowTrigger {
    MANUAL = "manual",
    SCHEDULED = "scheduled",
    EVENT_BASED = "event_based",
    WEBHOOK = "webhook"
}
export declare class Workflow {
    id: string;
    name: string;
    description: string;
    status: string;
    trigger: string;
    config: {
        assignToRoles?: string[];
        assignToUsers?: string[];
        requiredFields?: string[];
        autoStart?: boolean;
        schedule?: {
            frequency: 'daily' | 'weekly' | 'monthly';
            time: string;
        };
    };
    entityAssignments: {
        entityId: string;
        permissions: {
            canCreate: boolean;
            canRead: boolean;
            canUpdate: boolean;
            canDelete: boolean;
        };
    }[];
    steps: WorkflowStep[];
    states: WorkflowState[];
    tenant: Tenant;
    tenantId: string;
    createdBy: User;
    createdById: string;
    updatedBy: User;
    updatedById: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
