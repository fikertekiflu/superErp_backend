import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    create(createWorkflowDto: CreateWorkflowDto, req: any): Promise<import("./workflow.entity").Workflow>;
    findAll(req: any, status?: string): Promise<import("./workflow.entity").Workflow[]>;
    update(id: string, updateWorkflowDto: UpdateWorkflowDto, req: any): Promise<import("./workflow.entity").Workflow>;
    remove(id: string, req: any): Promise<void>;
    activate(id: string, req: any): Promise<import("./workflow.entity").Workflow>;
    deactivate(id: string, req: any): Promise<import("./workflow.entity").Workflow>;
    duplicate(id: string, req: any): Promise<import("./workflow.entity").Workflow>;
    startWorkflow(id: string, req: any): Promise<import("./workflow.entity").Workflow>;
    getStats(req: any): Promise<any>;
    getWorkflowEntities(id: string, req: any): Promise<any[]>;
    addStep(id: string, stepData: any, req: any): Promise<import("./workflow-step.entity").WorkflowStep>;
    updateStep(stepId: string, stepData: any, req: any): Promise<import("./workflow-step.entity").WorkflowStep>;
    removeStep(stepId: string, req: any): Promise<void>;
    createState(id: string, stateData: any, req: any): Promise<import("./workflow-state.entity").WorkflowState>;
    getStates(id: string, req: any): Promise<import("./workflow-state.entity").WorkflowState[]>;
    updateState(stateId: string, stateData: any, req: any): Promise<import("./workflow-state.entity").WorkflowState>;
    deleteState(stateId: string, req: any): Promise<void>;
    createTransition(id: string, transitionData: any, req: any): Promise<import("./workflow-transition.entity").WorkflowTransition>;
    getTransitions(id: string, req: any): Promise<import("./workflow-transition.entity").WorkflowTransition[]>;
    updateTransition(transitionId: string, transitionData: any, req: any): Promise<import("./workflow-transition.entity").WorkflowTransition>;
    deleteTransition(transitionId: string, req: any): Promise<void>;
    findOne(id: string, req: any): Promise<import("./workflow.entity").Workflow>;
}
