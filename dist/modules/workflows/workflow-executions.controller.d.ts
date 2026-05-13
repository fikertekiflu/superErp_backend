import { WorkflowExecutionService } from './workflow-execution.service';
export declare class WorkflowExecutionsController {
    private readonly executionService;
    constructor(executionService: WorkflowExecutionService);
    getExecutions(req: any): Promise<import("./workflow-execution.entity").WorkflowExecution[]>;
    getExecution(id: string): Promise<import("./workflow-execution.entity").WorkflowExecution & {
        events: import("./workflow-event.entity").WorkflowEvent[];
    }>;
    triggerWorkflow(workflowId: string, body: {
        entityId?: string;
        entityType?: string;
        entityData?: Record<string, any>;
    }, req: any): Promise<import("./workflow-execution.entity").WorkflowExecution>;
    approveWorkflow(executionId: string, body: {
        taskId: string;
        notes?: string;
    }, req: any): Promise<import("./workflow-execution.entity").WorkflowExecution>;
    rejectWorkflow(executionId: string, body: {
        taskId: string;
        notes?: string;
        reason?: string;
    }, req: any): Promise<import("./workflow-execution.entity").WorkflowExecution>;
    getExecutionEvents(id: string, req: any): Promise<import("./workflow-event.entity").WorkflowEvent[]>;
    getExecutionWithHistory(id: string): Promise<import("./workflow-execution.entity").WorkflowExecution & {
        events: import("./workflow-event.entity").WorkflowEvent[];
    }>;
    executeTransition(id: string, transitionId: string, body: {
        notes?: string;
    }, req: any): Promise<import("./workflow-execution.entity").WorkflowExecution>;
}
