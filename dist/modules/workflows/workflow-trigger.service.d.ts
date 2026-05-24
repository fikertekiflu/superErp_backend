import { Repository } from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowExecutionService } from './workflow-execution.service';
import { Entity } from '../entities/entity.entity';
export declare class WorkflowTriggerService {
    private readonly workflowsRepository;
    private readonly entityRepository;
    private readonly workflowExecutionService;
    private readonly logger;
    constructor(workflowsRepository: Repository<Workflow>, entityRepository: Repository<Entity>, workflowExecutionService: WorkflowExecutionService);
    triggerForEntityRecord(tenantId: string, entityDefinitionId: string, entityName: string, recordId: string, data: Record<string, unknown>, userId: string): Promise<void>;
    triggerForEntitySlugs(tenantId: string, slugs: string[], recordId: string, data: Record<string, unknown>, userId: string): Promise<void>;
}
