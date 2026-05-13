"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_entity_1 = require("./workflow.entity");
const workflow_step_entity_1 = require("./workflow-step.entity");
const workflow_state_entity_1 = require("./workflow-state.entity");
const workflow_transition_entity_1 = require("./workflow-transition.entity");
const entity_entity_1 = require("../entities/entity.entity");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
let WorkflowsService = class WorkflowsService {
    workflowsRepository;
    workflowStepsRepository;
    workflowStatesRepository;
    workflowTransitionsRepository;
    entitiesRepository;
    subscriptionsService;
    constructor(workflowsRepository, workflowStepsRepository, workflowStatesRepository, workflowTransitionsRepository, entitiesRepository, subscriptionsService) {
        this.workflowsRepository = workflowsRepository;
        this.workflowStepsRepository = workflowStepsRepository;
        this.workflowStatesRepository = workflowStatesRepository;
        this.workflowTransitionsRepository = workflowTransitionsRepository;
        this.entitiesRepository = entitiesRepository;
        this.subscriptionsService = subscriptionsService;
    }
    async create(createWorkflowDto, userId, tenantId) {
        try {
            if (createWorkflowDto.entityAssignments &&
                createWorkflowDto.entityAssignments.length > 0) {
                for (const assignment of createWorkflowDto.entityAssignments) {
                    const entity = await this.entitiesRepository.findOne({
                        where: { id: assignment.entityId, tenantId },
                    });
                    if (!entity) {
                        throw new common_1.NotFoundException(`Entity with ID ${assignment.entityId} not found`);
                    }
                }
            }
            if (tenantId) {
                const currentCount = await this.workflowsRepository.count({
                    where: { tenant: { id: tenantId } },
                });
                await this.subscriptionsService.checkLimit(tenantId, 'maxWorkflows', currentCount);
            }
            const workflowData = {
                ...createWorkflowDto,
                createdBy: { id: userId },
            };
            if (tenantId) {
                workflowData.tenant = { id: tenantId };
            }
            const workflow = this.workflowsRepository.create(workflowData);
            return (await this.workflowsRepository.save(workflow));
        }
        catch (error) {
            console.error('Error in WorkflowsService.create:', error);
            throw error;
        }
    }
    async findAll(tenantId) {
        return this.workflowsRepository.find({
            where: { tenant: { id: tenantId } },
            relations: ['tenant'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, tenantId) {
        try {
            const workflow = await this.workflowsRepository.findOne({
                where: { id, tenant: { id: tenantId } },
                relations: ['steps', 'createdBy', 'tenant'],
            });
            if (!workflow) {
                throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
            }
            return workflow;
        }
        catch (error) {
            console.error(`Error finding workflow ${id}:`, error);
            throw error;
        }
    }
    async update(id, updateWorkflowDto, userId, tenantId) {
        const workflow = await this.findOne(id, tenantId);
        if (updateWorkflowDto.entityAssignments) {
            for (const assignment of updateWorkflowDto.entityAssignments) {
                const entity = await this.entitiesRepository.findOne({
                    where: { id: assignment.entityId, tenantId },
                });
                if (!entity) {
                    throw new common_1.NotFoundException(`Entity with ID ${assignment.entityId} not found`);
                }
            }
        }
        await this.workflowsRepository.update(id, {
            ...updateWorkflowDto,
            updatedBy: { id: userId },
        });
        return this.findOne(id, tenantId);
    }
    async remove(id, tenantId) {
        const workflow = await this.findOne(id, tenantId);
        if (workflow.status === workflow_entity_1.WorkflowStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Cannot delete an active workflow. Deactivate it first.');
        }
        await this.workflowsRepository.delete(id);
    }
    async activate(id, userId, tenantId) {
        const workflow = await this.findOne(id, tenantId);
        await this.workflowsRepository.update(id, {
            status: workflow_entity_1.WorkflowStatus.ACTIVE,
            updatedBy: { id: userId },
        });
        return this.findOne(id, tenantId);
    }
    async deactivate(id, userId, tenantId) {
        const workflow = await this.findOne(id, tenantId);
        await this.workflowsRepository.update(id, {
            status: workflow_entity_1.WorkflowStatus.PAUSED,
            updatedBy: { id: userId },
        });
        return this.findOne(id, tenantId);
    }
    async duplicate(id, userId, tenantId) {
        const originalWorkflow = await this.findOne(id, tenantId);
        const duplicatedWorkflow = this.workflowsRepository.create({
            name: `${originalWorkflow.name} (Copy)`,
            description: originalWorkflow.description,
            status: workflow_entity_1.WorkflowStatus.DRAFT,
            trigger: workflow_entity_1.WorkflowTrigger.MANUAL,
            config: originalWorkflow.config,
            entityAssignments: originalWorkflow.entityAssignments,
            createdBy: { id: userId },
            tenant: { id: tenantId },
        });
        return this.workflowsRepository.save(duplicatedWorkflow);
    }
    async startWorkflow(workflowId, userId, tenantId) {
        const workflow = await this.findOne(workflowId, tenantId);
        if (workflow.status !== workflow_entity_1.WorkflowStatus.ACTIVE) {
            throw new common_1.BadRequestException('Workflow must be active to start');
        }
        return this.activate(workflowId, userId, tenantId);
    }
    async getWorkflowEntities(id, tenantId) {
        const workflow = await this.findOne(id, tenantId);
        if (!workflow.entityAssignments ||
            workflow.entityAssignments.length === 0) {
            return [];
        }
        const entityIds = workflow.entityAssignments.map((a) => a.entityId);
        return this.entitiesRepository.find({ where: { id: (0, typeorm_2.In)(entityIds) } });
    }
    async addStep(workflowId, stepData, tenantId) {
        const workflow = await this.findOne(workflowId, tenantId);
        const step = this.workflowStepsRepository.create({
            ...stepData,
            workflow: { id: workflowId },
        });
        return this.workflowStepsRepository.save(step);
    }
    async updateStep(stepId, stepData, tenantId) {
        const step = await this.workflowStepsRepository.findOne({
            where: { id: stepId },
            relations: ['workflow'],
        });
        if (!step || step.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException(`Step with ID ${stepId} not found`);
        }
        await this.workflowStepsRepository.update(stepId, stepData);
        const updated = await this.workflowStepsRepository.findOne({
            where: { id: stepId },
        });
        if (!updated)
            throw new common_1.NotFoundException(`Step with ID ${stepId} not found after update`);
        return updated;
    }
    async removeStep(stepId, tenantId) {
        const step = await this.workflowStepsRepository.findOne({
            where: { id: stepId },
            relations: ['workflow'],
        });
        if (!step || step.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException(`Step with ID ${stepId} not found`);
        }
        await this.workflowStepsRepository.delete(stepId);
    }
    async getWorkflowStats(tenantId) {
        const totalWorkflows = await this.workflowsRepository.count({
            where: { tenant: { id: tenantId } },
        });
        const statusCounts = await this.workflowsRepository
            .createQueryBuilder('workflow')
            .select('workflow.status')
            .addSelect('COUNT(*)', 'count')
            .where('workflow.tenantId = :tenantId', { tenantId })
            .groupBy('workflow.status')
            .getRawMany();
        const recentWorkflows = await this.workflowsRepository.find({
            where: { tenant: { id: tenantId } },
            order: { updatedAt: 'DESC' },
            take: 5,
            relations: ['createdBy'],
        });
        return {
            totalWorkflows,
            statusBreakdown: statusCounts,
            recentWorkflows: recentWorkflows.map((wf) => ({
                id: wf.id,
                name: wf.name,
                status: wf.status,
                updatedAt: wf.updatedAt,
                createdBy: wf.createdBy?.firstName + ' ' + wf.createdBy?.lastName,
            })),
        };
    }
    async createState(workflowId, stateData, tenantId) {
        const workflow = await this.workflowsRepository.findOne({
            where: { id: workflowId, tenantId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const state = this.workflowStatesRepository.create({
            ...stateData,
            workflowId,
        });
        return await this.workflowStatesRepository.save(state);
    }
    async getStates(workflowId, tenantId) {
        const workflow = await this.workflowsRepository.findOne({
            where: { id: workflowId, tenantId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        return await this.workflowStatesRepository.find({
            where: { workflowId },
            order: { order: 'ASC' },
        });
    }
    async updateState(stateId, stateData, tenantId) {
        const state = await this.workflowStatesRepository.findOne({
            where: { id: stateId },
            relations: ['workflow'],
        });
        if (!state || state.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException('State not found');
        }
        Object.assign(state, stateData);
        return await this.workflowStatesRepository.save(state);
    }
    async deleteState(stateId, tenantId) {
        const state = await this.workflowStatesRepository.findOne({
            where: { id: stateId },
            relations: ['workflow'],
        });
        if (!state || state.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException('State not found');
        }
        await this.workflowTransitionsRepository.delete([
            { fromStateId: stateId },
            { toStateId: stateId },
        ]);
        await this.workflowStatesRepository.delete(stateId);
    }
    async createTransition(workflowId, transitionData, tenantId) {
        const workflow = await this.workflowsRepository.findOne({
            where: { id: workflowId, tenantId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        const fromState = await this.workflowStatesRepository.findOne({
            where: { id: transitionData.fromStateId, workflowId },
        });
        const toState = await this.workflowStatesRepository.findOne({
            where: { id: transitionData.toStateId, workflowId },
        });
        if (!fromState || !toState) {
            throw new common_1.NotFoundException('State not found in this workflow');
        }
        const transition = this.workflowTransitionsRepository.create({
            ...transitionData,
            workflowId,
        });
        return await this.workflowTransitionsRepository.save(transition);
    }
    async getTransitions(workflowId, tenantId) {
        const workflow = await this.workflowsRepository.findOne({
            where: { id: workflowId, tenantId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException('Workflow not found');
        }
        return await this.workflowTransitionsRepository.find({
            where: { workflowId },
            relations: ['fromState', 'toState', 'requiredRole'],
        });
    }
    async updateTransition(transitionId, transitionData, tenantId) {
        const transition = await this.workflowTransitionsRepository.findOne({
            where: { id: transitionId },
            relations: ['workflow'],
        });
        if (!transition || transition.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Transition not found');
        }
        Object.assign(transition, transitionData);
        return await this.workflowTransitionsRepository.save(transition);
    }
    async deleteTransition(transitionId, tenantId) {
        const transition = await this.workflowTransitionsRepository.findOne({
            where: { id: transitionId },
            relations: ['workflow'],
        });
        if (!transition || transition.workflow.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Transition not found');
        }
        await this.workflowTransitionsRepository.delete(transitionId);
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(1, (0, typeorm_1.InjectRepository)(workflow_step_entity_1.WorkflowStep)),
    __param(2, (0, typeorm_1.InjectRepository)(workflow_state_entity_1.WorkflowState)),
    __param(3, (0, typeorm_1.InjectRepository)(workflow_transition_entity_1.WorkflowTransition)),
    __param(4, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        subscriptions_service_1.SubscriptionsService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map