import { Workflow } from './workflow.entity';
import { WorkflowState } from './workflow-state.entity';
import { Role } from '../roles/role.entity';
export declare class WorkflowTransition {
    id: string;
    name: string;
    description: string;
    fromState: WorkflowState;
    fromStateId: string;
    toState: WorkflowState;
    toStateId: string;
    requiredRole: Role;
    requiredRoleId: string;
    conditions: {
        field?: string;
        operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
        value?: any;
    }[];
    actions: {
        type?: 'create_task' | 'send_notification' | 'update_field';
        config?: Record<string, any>;
    }[];
    metadata: Record<string, any>;
    workflow: Workflow;
    workflowId: string;
    createdAt: Date;
    updatedAt: Date;
}
