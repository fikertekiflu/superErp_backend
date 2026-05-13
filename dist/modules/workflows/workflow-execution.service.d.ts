import { Repository } from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowEvent } from './workflow-event.entity';
import { Workflow } from './workflow.entity';
import { WorkflowState as WorkflowStateDefinition } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowStep } from './workflow-step.entity';
import { Task } from '../tasks/task.entity';
import { Notification } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
import { ConditionalLogicService } from './conditional-logic.service';
export declare class WorkflowExecutionService {
    private executionRepo;
    private workflowRepo;
    private stepRepo;
    private taskRepo;
    private notificationRepo;
    private userRepo;
    private eventRepo;
    private workflowStateRepo;
    private workflowTransitionRepo;
    private conditionalLogicService;
    constructor(executionRepo: Repository<WorkflowExecution>, workflowRepo: Repository<Workflow>, stepRepo: Repository<WorkflowStep>, taskRepo: Repository<Task>, notificationRepo: Repository<Notification>, userRepo: Repository<User>, eventRepo: Repository<WorkflowEvent>, workflowStateRepo: Repository<WorkflowStateDefinition>, workflowTransitionRepo: Repository<WorkflowTransition>, conditionalLogicService: ConditionalLogicService);
    triggerWorkflow(workflowId: string, triggeredByUserId: string, tenantId: string, context?: {
        entityId?: string;
        entityType?: string;
        entityData?: Record<string, any>;
        triggerType?: string;
    }): Promise<WorkflowExecution>;
    private runNextStep;
    private executeStep;
    private executeAutomationStep;
    private executeNotificationStep;
    private executeTaskStep;
    private executeApprovalStep;
    private executeConditionStep;
    resumeAfterTaskCompletion(taskId: string, result: {
        approved?: boolean;
        notes?: string;
        data?: any;
    }): Promise<void>;
    private handleStateTransitionAfterTaskCompletion;
    private recordStepResult;
    private resolveAssignment;
    private createNotification;
    getExecutions(tenantId: string): Promise<WorkflowExecution[]>;
    getExecution(id: string): Promise<WorkflowExecution & {
        events: WorkflowEvent[];
    }>;
    private logEvent;
    private transitionState;
    private findValidTransitions;
    executeTransition(executionId: string, transitionId: string, userId: string, tenantId: string, notes?: string): Promise<WorkflowExecution>;
    handleApproval(executionId: string, taskId: string, userId: string, decision: 'approve' | 'reject', notes?: string): Promise<WorkflowExecution>;
    getExecutionEvents(executionId: string, tenantId: string): Promise<WorkflowEvent[]>;
}
