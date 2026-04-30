import { Repository } from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowStep } from './workflow-step.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class WorkflowsService {
    private workflowsRepository;
    private workflowStepsRepository;
    private entitiesRepository;
    private subscriptionsService;
    constructor(workflowsRepository: Repository<Workflow>, workflowStepsRepository: Repository<WorkflowStep>, entitiesRepository: Repository<DynamicEntity>, subscriptionsService: SubscriptionsService);
    create(createWorkflowDto: CreateWorkflowDto, userId: string, tenantId?: string): Promise<Workflow>;
    findAll(tenantId?: string): Promise<Workflow[]>;
    findOne(id: string, tenantId?: string): Promise<Workflow>;
    update(id: string, updateWorkflowDto: UpdateWorkflowDto, userId: string, tenantId?: string): Promise<Workflow>;
    remove(id: string, tenantId?: string): Promise<void>;
    activate(id: string, userId: string, tenantId?: string): Promise<Workflow>;
    deactivate(id: string, userId: string, tenantId?: string): Promise<Workflow>;
    duplicate(id: string, userId: string, tenantId?: string): Promise<Workflow>;
    startWorkflow(workflowId: string, userId: string, tenantId?: string): Promise<Workflow>;
    getWorkflowEntities(id: string, tenantId?: string): Promise<any[]>;
    addStep(workflowId: string, stepData: any, tenantId?: string): Promise<WorkflowStep>;
    updateStep(stepId: string, stepData: any, tenantId?: string): Promise<WorkflowStep>;
    removeStep(stepId: string, tenantId?: string): Promise<void>;
    getWorkflowStats(tenantId?: string): Promise<any>;
}
