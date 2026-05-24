import { Repository } from 'typeorm';
import { WorkflowExecution } from './workflow-execution.entity';
import { Workflow } from './workflow.entity';
import { Task } from '../tasks/task.entity';
import { Role } from '../roles/role.entity';
export interface WorkflowAnalyticsDto {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    executionsByStatus: Array<{
        status: string;
        count: number;
        percentage: number;
    }>;
    executionsByWorkflow: Array<{
        workflowName: string;
        executions: number;
        successRate: number;
        avgTime: number;
    }>;
    executionsOverTime: Array<{
        date: string;
        count: number;
        successRate: number;
    }>;
    topPerformers: Array<{
        workflowName: string;
        executions: number;
        avgTime: number;
        successRate: number;
    }>;
    bottlenecks: Array<{
        workflowName: string;
        stepName: string;
        avgTime: number;
        failureRate: number;
    }>;
    rolePerformance: Array<{
        roleName: string;
        tasksCompleted: number;
        avgCompletionTime: number;
        completionRate: number;
    }>;
}
export declare class WorkflowAnalyticsService {
    private readonly executionRepo;
    private readonly workflowRepo;
    private readonly taskRepo;
    private readonly roleRepo;
    constructor(executionRepo: Repository<WorkflowExecution>, workflowRepo: Repository<Workflow>, taskRepo: Repository<Task>, roleRepo: Repository<Role>);
    private parseDateRange;
    getAnalytics(tenantId: string, dateRange?: string, workflowId?: string): Promise<WorkflowAnalyticsDto>;
    exportCsv(tenantId: string, dateRange?: string, workflowId?: string): Promise<string>;
}
