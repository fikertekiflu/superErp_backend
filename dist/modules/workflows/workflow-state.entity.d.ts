import { Workflow } from './workflow.entity';
export declare class WorkflowState {
    id: string;
    name: string;
    key: string;
    description: string;
    order: number;
    metadata: Record<string, any>;
    workflow: Workflow;
    workflowId: string;
    createdAt: Date;
    updatedAt: Date;
}
