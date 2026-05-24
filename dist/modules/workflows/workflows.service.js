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
const role_entity_1 = require("../roles/role.entity");
const workflow_automation_service_1 = require("./workflow-automation.service");
const workflow_execution_entity_1 = require("./workflow-execution.entity");
const workflow_event_entity_1 = require("./workflow-event.entity");
const task_entity_1 = require("../tasks/task.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const entities_service_1 = require("../entities/entities.service");
const user_entity_1 = require("../users/user.entity");
const template_entity_blueprints_1 = require("../../common/catalog/template-entity-blueprints");
let WorkflowsService = class WorkflowsService {
    workflowsRepository;
    workflowStepsRepository;
    workflowStatesRepository;
    workflowTransitionsRepository;
    workflowExecutionsRepository;
    workflowEventsRepository;
    taskRepository;
    notificationRepository;
    entitiesRepository;
    roleRepository;
    subscriptionsService;
    workflowAutomationService;
    entitiesService;
    constructor(workflowsRepository, workflowStepsRepository, workflowStatesRepository, workflowTransitionsRepository, workflowExecutionsRepository, workflowEventsRepository, taskRepository, notificationRepository, entitiesRepository, roleRepository, subscriptionsService, workflowAutomationService, entitiesService) {
        this.workflowsRepository = workflowsRepository;
        this.workflowStepsRepository = workflowStepsRepository;
        this.workflowStatesRepository = workflowStatesRepository;
        this.workflowTransitionsRepository = workflowTransitionsRepository;
        this.workflowExecutionsRepository = workflowExecutionsRepository;
        this.workflowEventsRepository = workflowEventsRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.entitiesRepository = entitiesRepository;
        this.roleRepository = roleRepository;
        this.subscriptionsService = subscriptionsService;
        this.workflowAutomationService = workflowAutomationService;
        this.entitiesService = entitiesService;
    }
    entityAuth(userId, tenantId) {
        return {
            userId,
            tenantId,
            systemRole: user_entity_1.UserRole.TENANT_ADMIN,
        };
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
        await this.findOne(id, tenantId);
        await this.workflowsRepository.manager.transaction(async (manager) => {
            const workflow = await manager.findOne(workflow_entity_1.Workflow, {
                where: { id, tenantId },
            });
            if (!workflow) {
                throw new common_1.NotFoundException('Workflow not found');
            }
            if (workflow.status === workflow_entity_1.WorkflowStatus.ACTIVE) {
                await manager.update(workflow_entity_1.Workflow, id, {
                    status: workflow_entity_1.WorkflowStatus.PAUSED,
                });
            }
            const executions = await manager.find(workflow_execution_entity_1.WorkflowExecution, {
                where: { workflowId: id },
                select: ['id'],
            });
            const executionIds = executions.map((e) => e.id);
            if (executionIds.length > 0) {
                await manager.delete(task_entity_1.Task, { executionId: (0, typeorm_2.In)(executionIds) });
                await manager.delete(workflow_event_entity_1.WorkflowEvent, { executionId: (0, typeorm_2.In)(executionIds) });
                await manager.delete(notification_entity_1.Notification, {
                    executionId: (0, typeorm_2.In)(executionIds),
                });
                await manager.delete(workflow_execution_entity_1.WorkflowExecution, { workflowId: id });
            }
            await manager.delete(workflow_transition_entity_1.WorkflowTransition, { workflowId: id });
            await manager.delete(workflow_state_entity_1.WorkflowState, { workflowId: id });
            await manager.delete(workflow_step_entity_1.WorkflowStep, { workflowId: id });
            await manager.delete(workflow_entity_1.Workflow, { id });
        });
        return { deleted: true };
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
        let config = stepData.config;
        if (stepData.type === 'automation' && config) {
            config = this.workflowAutomationService.normalizeStepConfig(config);
        }
        const step = this.workflowStepsRepository.create({
            ...stepData,
            config,
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
        const patch = { ...stepData };
        if ((patch.type === 'automation' || step.type === 'automation') &&
            patch.config) {
            patch.config = this.workflowAutomationService.normalizeStepConfig(patch.config);
        }
        await this.workflowStepsRepository.update(stepId, patch);
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
        const totalExecutions = await this.workflowExecutionsRepository.count({
            where: { tenantId },
        });
        const completedExecutions = await this.workflowExecutionsRepository.count({
            where: { tenantId, status: workflow_execution_entity_1.ExecutionStatus.COMPLETED },
        });
        const successRate = totalExecutions > 0
            ? Math.round((completedExecutions / totalExecutions) * 1000) / 10
            : 100;
        return {
            totalWorkflows,
            totalExecutions,
            successRate,
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
        const duplicate = await this.workflowStatesRepository.findOne({
            where: { workflowId, key: stateData.key },
        });
        if (duplicate) {
            throw new common_1.BadRequestException(`State key "${stateData.key}" already exists in this workflow`);
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
    async deployFromTemplate(dto, userId, tenantId) {
        let workflowId = null;
        try {
            return await this.deployFromTemplateInternal(dto, userId, tenantId, (id) => {
                workflowId = id;
            });
        }
        catch (error) {
            if (workflowId) {
                try {
                    await this.remove(workflowId, tenantId);
                }
                catch (cleanupErr) {
                    console.error(`Failed to roll back partial template deploy ${workflowId}`, cleanupErr);
                }
            }
            throw error;
        }
    }
    async deployFromTemplateInternal(dto, userId, tenantId, onWorkflowCreated) {
        const trigger = Object.values(workflow_entity_1.WorkflowTrigger).includes(dto.trigger)
            ? dto.trigger
            : workflow_entity_1.WorkflowTrigger.MANUAL;
        const seedEntities = dto.seedEntities !== false;
        const { assignments: entityAssignments, createdEntitySlugs, linkedEntitySlugs } = await this.resolveEntityAssignmentsWithSeed(tenantId, userId, dto.entityAssignments || [], dto.entitySlugs || [], seedEntities);
        const workflow = await this.create({
            name: dto.name,
            description: dto.description,
            trigger,
            status: workflow_entity_1.WorkflowStatus.DRAFT,
            entityAssignments,
            config: {
                templateId: dto.templateId,
                deployedFrom: 'template',
                deployedAt: new Date().toISOString(),
                linkedEntitySlugs,
                createdEntitySlugs,
            },
        }, userId, tenantId);
        onWorkflowCreated?.(workflow.id);
        const stateKeyToId = {};
        const sortedStates = [...dto.states].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const state of sortedStates) {
            const created = await this.createState(workflow.id, {
                name: state.name,
                key: state.key,
                description: state.description,
                order: state.order ?? 0,
            }, tenantId);
            stateKeyToId[state.key] = created.id;
        }
        const roleNameToId = await this.buildRoleNameMap(tenantId, dto, dto.seedRoles !== false);
        for (const transition of dto.transitions) {
            const fromStateId = stateKeyToId[transition.fromState];
            const toStateId = stateKeyToId[transition.toState];
            if (!fromStateId || !toStateId) {
                throw new common_1.BadRequestException(`Invalid transition states: ${transition.fromState} -> ${transition.toState}`);
            }
            const requiredRoleId = transition.requiredRole
                ? roleNameToId[transition.requiredRole.trim().toLowerCase()]
                : undefined;
            await this.createTransition(workflow.id, {
                name: transition.name,
                fromStateId,
                toStateId,
                requiredRoleId,
            }, tenantId);
        }
        const sortedSteps = [...dto.steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const step of sortedSteps) {
            let config = this.resolveStepConfig(step.config, roleNameToId);
            if (step.type === 'automation') {
                config = this.workflowAutomationService.normalizeStepConfig(config);
            }
            await this.addStep(workflow.id, {
                name: step.name,
                description: step.description,
                type: step.type,
                order: step.order ?? 1,
                config,
            }, tenantId);
        }
        if (dto.activate) {
            return this.activate(workflow.id, userId, tenantId);
        }
        return this.findOne(workflow.id, tenantId);
    }
    collectTemplateRoleNames(dto) {
        const names = new Set();
        for (const t of dto.transitions) {
            if (t.requiredRole?.trim())
                names.add(t.requiredRole.trim());
        }
        for (const step of dto.steps) {
            const roles = step.config?.assignToRoles;
            if (Array.isArray(roles)) {
                for (const r of roles) {
                    if (typeof r === 'string' && r.trim())
                        names.add(r.trim());
                }
            }
        }
        return [...names];
    }
    async buildRoleNameMap(tenantId, dto, seedMissing) {
        const map = {};
        const existing = await this.roleRepository.find({
            where: { tenant: { id: tenantId }, isActive: true },
        });
        for (const role of existing) {
            map[role.name.trim().toLowerCase()] = role.id;
        }
        if (!seedMissing)
            return map;
        for (const name of this.collectTemplateRoleNames(dto)) {
            const key = name.toLowerCase();
            if (map[key])
                continue;
            const created = await this.roleRepository.save(this.roleRepository.create({
                name,
                description: 'Auto-created from workflow template',
                tenant: { id: tenantId },
                isActive: true,
                entityPermissions: [],
            }));
            map[key] = created.id;
        }
        return map;
    }
    async resolveEntityAssignmentsWithSeed(tenantId, userId, explicit, slugs, seedEntities) {
        const createdEntitySlugs = [];
        const linkedEntitySlugs = [];
        if (seedEntities && slugs.length > 0) {
            const seeded = await this.ensureTemplateEntities(tenantId, userId, slugs);
            createdEntitySlugs.push(...seeded.created);
            linkedEntitySlugs.push(...seeded.linked);
        }
        const assignments = await this.resolveEntityAssignments(tenantId, explicit, slugs);
        for (const a of assignments) {
            const entity = await this.entitiesRepository.findOne({
                where: { id: a.entityId, tenantId },
            });
            if (entity?.slug && !linkedEntitySlugs.includes(entity.slug)) {
                linkedEntitySlugs.push(entity.slug);
            }
        }
        return {
            assignments,
            createdEntitySlugs,
            linkedEntitySlugs: [...new Set(linkedEntitySlugs)],
        };
    }
    async ensureTemplateEntities(tenantId, userId, requestedSlugs) {
        const created = [];
        const linked = [];
        const processedBlueprints = new Set();
        const auth = this.entityAuth(userId, tenantId);
        for (const rawSlug of requestedSlugs) {
            const blueprint = (0, template_entity_blueprints_1.findBlueprintForSlug)(rawSlug);
            if (!blueprint || processedBlueprints.has(blueprint.slug)) {
                continue;
            }
            processedBlueprints.add(blueprint.slug);
            const candidates = [blueprint.slug, ...blueprint.aliases];
            let existing = null;
            for (const candidate of candidates) {
                existing = await this.entitiesRepository.findOne({
                    where: { slug: candidate, tenantId },
                });
                if (existing)
                    break;
            }
            if (existing) {
                linked.push(existing.slug);
                continue;
            }
            try {
                const saved = await this.entitiesService.create(blueprint.definition, auth);
                created.push(saved.slug);
                linked.push(saved.slug);
            }
            catch (err) {
                const msg = err?.message || '';
                if (msg.includes('already exists')) {
                    const again = await this.entitiesRepository.findOne({
                        where: { slug: blueprint.slug, tenantId },
                    });
                    if (again)
                        linked.push(again.slug);
                }
                else {
                    throw err;
                }
            }
        }
        return { created, linked };
    }
    async resolveEntityAssignments(tenantId, explicit, slugs) {
        const defaultPerms = {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: false,
        };
        const byEntityId = new Map();
        for (const item of explicit) {
            byEntityId.set(item.entityId, {
                entityId: item.entityId,
                permissions: {
                    canCreate: item.permissions?.canCreate ?? defaultPerms.canCreate,
                    canRead: item.permissions?.canRead ?? defaultPerms.canRead,
                    canUpdate: item.permissions?.canUpdate ?? defaultPerms.canUpdate,
                    canDelete: item.permissions?.canDelete ?? defaultPerms.canDelete,
                },
            });
        }
        for (const slug of slugs) {
            const blueprint = (0, template_entity_blueprints_1.findBlueprintForSlug)(slug);
            const candidates = blueprint
                ? [blueprint.slug, ...blueprint.aliases]
                : [slug];
            for (const candidate of candidates) {
                const entity = await this.entitiesRepository.findOne({
                    where: { slug: candidate, tenantId },
                });
                if (entity && !byEntityId.has(entity.id)) {
                    byEntityId.set(entity.id, {
                        entityId: entity.id,
                        permissions: defaultPerms,
                    });
                    break;
                }
            }
        }
        return [...byEntityId.values()];
    }
    resolveStepConfig(config, roleNameToId) {
        if (!config)
            return config;
        const next = { ...config };
        if (Array.isArray(next.assignToRoles)) {
            next.assignToRoles = next.assignToRoles
                .map((name) => roleNameToId[name.trim().toLowerCase()] || name)
                .filter(Boolean);
        }
        return next;
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(1, (0, typeorm_1.InjectRepository)(workflow_step_entity_1.WorkflowStep)),
    __param(2, (0, typeorm_1.InjectRepository)(workflow_state_entity_1.WorkflowState)),
    __param(3, (0, typeorm_1.InjectRepository)(workflow_transition_entity_1.WorkflowTransition)),
    __param(4, (0, typeorm_1.InjectRepository)(workflow_execution_entity_1.WorkflowExecution)),
    __param(5, (0, typeorm_1.InjectRepository)(workflow_event_entity_1.WorkflowEvent)),
    __param(6, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(7, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(8, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __param(9, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(12, (0, common_1.Inject)((0, common_1.forwardRef)(() => entities_service_1.EntitiesService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        subscriptions_service_1.SubscriptionsService,
        workflow_automation_service_1.WorkflowAutomationService,
        entities_service_1.EntitiesService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map