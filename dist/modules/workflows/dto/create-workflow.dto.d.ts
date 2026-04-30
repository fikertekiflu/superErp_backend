import { WorkflowStatus, WorkflowTrigger } from '../workflow.entity';
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    status?: WorkflowStatus;
    trigger?: WorkflowTrigger;
    config?: any;
    entityAssignments?: any[];
}
