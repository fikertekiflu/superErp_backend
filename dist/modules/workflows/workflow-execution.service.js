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
var WorkflowExecutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_execution_entity_1 = require("./workflow-execution.entity");
const workflow_event_entity_1 = require("./workflow-event.entity");
const workflow_entity_1 = require("./workflow.entity");
const workflow_state_entity_1 = require("./workflow-state.entity");
const workflow_transition_entity_1 = require("./workflow-transition.entity");
const workflow_step_entity_1 = require("./workflow-step.entity");
const task_entity_1 = require("../tasks/task.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const user_entity_1 = require("../users/user.entity");
const conditional_logic_service_1 = require("./conditional-logic.service");
const workflow_automation_service_1 = require("./workflow-automation.service");
const email_service_1 = require("../email/email.service");
const workflow_branching_util_1 = require("./workflow-branching.util");
const entity_data_entity_1 = require("../entities/entity-data.entity");
let WorkflowExecutionService = WorkflowExecutionService_1 = class WorkflowExecutionService {
    executionRepo;
    workflowRepo;
    stepRepo;
    taskRepo;
    notificationRepo;
    userRepo;
    eventRepo;
    workflowStateRepo;
    workflowTransitionRepo;
    conditionalLogicService;
    workflowAutomationService;
    emailService;
    entityDataRepo;
    logger = new common_1.Logger(WorkflowExecutionService_1.name);
    constructor(executionRepo, workflowRepo, stepRepo, taskRepo, notificationRepo, userRepo, eventRepo, workflowStateRepo, workflowTransitionRepo, conditionalLogicService, workflowAutomationService, emailService, entityDataRepo) {
        this.executionRepo = executionRepo;
        this.workflowRepo = workflowRepo;
        this.stepRepo = stepRepo;
        this.taskRepo = taskRepo;
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
        this.workflowStateRepo = workflowStateRepo;
        this.workflowTransitionRepo = workflowTransitionRepo;
        this.conditionalLogicService = conditionalLogicService;
        this.workflowAutomationService = workflowAutomationService;
        this.emailService = emailService;
        this.entityDataRepo = entityDataRepo;
    }
    async triggerWorkflow(workflowId, triggeredByUserId, tenantId, context = {}) {
        const workflow = await this.workflowRepo.findOne({
            where: { id: workflowId, tenant: { id: tenantId } },
            relations: ['steps', 'states'],
        });
        if (!workflow)
            throw new common_1.NotFoundException('Workflow not found');
        if (workflow.status !== workflow_entity_1.WorkflowStatus.ACTIVE) {
            throw new common_1.BadRequestException('Workflow is not active');
        }
        if (context.triggerType !== 'manual' && workflow.trigger !== context.triggerType) {
            throw new common_1.BadRequestException('Trigger type does not match workflow configuration');
        }
        let initialState = 'PENDING';
        if (workflow.states && workflow.states.length > 0) {
            const firstState = workflow.states.sort((a, b) => a.order - b.order)[0];
            initialState = firstState.key;
        }
        const execution = this.executionRepo.create();
        execution.workflowId = workflowId;
        execution.tenantId = tenantId;
        execution.triggeredById = triggeredByUserId;
        execution.status = workflow_execution_entity_1.ExecutionStatus.RUNNING;
        execution.currentStepOrder = 0;
        execution.currentState = initialState;
        execution.stateHistory = [{
                fromState: '',
                toState: initialState,
                timestamp: new Date().toISOString(),
                notes: 'Workflow triggered',
            }];
        execution.context = context;
        execution.stepResults = [];
        execution.startedAt = new Date();
        const saved = await this.executionRepo.save(execution);
        await this.logEvent(saved.id, tenantId, workflow_event_entity_1.EventType.TRIGGERED, triggeredByUserId, {}, {
            notes: 'Workflow triggered',
        });
        await this.runNextStep(saved.id);
        const result = await this.executionRepo.findOne({ where: { id: saved.id } });
        return result;
    }
    async runNextStep(executionId) {
        const execution = await this.loadExecution(executionId);
        if (!execution?.workflow)
            return;
        const steps = this.getSortedSteps(execution.workflow);
        const currentStepOrder = execution.currentStepOrder || 0;
        const nextStep = steps.find((step) => step.order > currentStepOrder);
        if (!nextStep) {
            await this.completeExecution(executionId, execution.workflow.name);
            return;
        }
        await this.runStepAt(executionId, nextStep);
    }
    getSortedSteps(workflow) {
        return [...(workflow.steps || [])].sort((a, b) => a.order - b.order);
    }
    async loadExecution(executionId) {
        return this.executionRepo.findOne({
            where: { id: executionId },
            relations: ['workflow', 'workflow.steps'],
        });
    }
    async completeExecution(executionId, workflowName) {
        await this.executionRepo.update(executionId, {
            status: workflow_execution_entity_1.ExecutionStatus.COMPLETED,
            completedAt: new Date(),
        });
        this.logger.log(`Workflow ${workflowName || executionId} completed`);
    }
    async runStepAt(executionId, step) {
        await this.executionRepo.update(executionId, {
            currentStepOrder: step.order,
        });
        const execution = await this.loadExecution(executionId);
        if (!execution)
            return;
        await this.executeStepOfType(executionId, step, execution);
    }
    async gotoStepById(executionId, stepId) {
        const execution = await this.loadExecution(executionId);
        if (!execution?.workflow)
            return;
        const target = execution.workflow.steps?.find((s) => s.id === stepId);
        if (!target) {
            this.logger.warn(`Branch target step ${stepId} not found — completing workflow`);
            await this.completeExecution(executionId, execution.workflow.name);
            return;
        }
        this.logger.log(`Branching to step "${target.name}" (${target.id})`);
        await this.runStepAt(executionId, target);
    }
    async proceedAfterStep(executionId, completedStep) {
        const explicitNext = completedStep.config?.nextStepId;
        if (explicitNext) {
            await this.gotoStepById(executionId, explicitNext);
            return;
        }
        await this.runNextStep(executionId);
    }
    async executeStepOfType(executionId, step, execution) {
        switch (step.type) {
            case workflow_step_entity_1.StepType.AUTOMATION:
                await this.executeAutomationStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.TASK:
                await this.executeTaskStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.APPROVAL:
                await this.executeApprovalStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.CONDITION:
            case 'conditional':
                await this.executeConditionStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.NOTIFICATION:
                await this.executeNotificationStep(executionId, step, execution);
                break;
            default:
                this.logger.warn(`Unknown step type: ${step.type} — skipping`);
                await this.runNextStep(executionId);
        }
    }
    async routeAfterRejection(executionId, step, userId, notes) {
        const rejectStepId = step.config?.onRejectStepId;
        const rejectAction = step.config?.onRejectAction || 'cancel';
        await this.logEvent(executionId, (await this.loadExecution(executionId)).tenantId, workflow_event_entity_1.EventType.REJECTED, userId, { rejectionReason: notes }, { stepId: step.id, stepName: step.name, notes });
        if (rejectStepId && rejectAction === 'goto') {
            await this.executionRepo.update(executionId, {
                status: workflow_execution_entity_1.ExecutionStatus.RUNNING,
            });
            this.logger.log(`Rejection routed to step ${rejectStepId}`);
            await this.gotoStepById(executionId, rejectStepId);
            return;
        }
        const execution = await this.loadExecution(executionId);
        if (!execution)
            return;
        const rejectionState = step.config?.rejectionState || workflow_execution_entity_1.WorkflowState.REJECTED;
        await this.transitionState(execution, rejectionState, userId, notes || 'Approval rejected');
        await this.executionRepo.update(executionId, {
            status: workflow_execution_entity_1.ExecutionStatus.REJECTED,
            completedAt: new Date(),
        });
        this.logger.log(`Workflow rejected at step "${step.name}"`);
    }
    async executeStep(executionId, step, execution) {
        this.logger.log(`Executing step ${step.order}: ${step.name} (type: ${step.type})`);
        switch (step.type) {
            case workflow_step_entity_1.StepType.AUTOMATION:
                await this.executeAutomationStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.NOTIFICATION:
                await this.executeNotificationStep(executionId, step, execution);
                break;
            case workflow_step_entity_1.StepType.TASK:
                await this.executeTaskStep(executionId, step, execution);
                return;
            case workflow_step_entity_1.StepType.APPROVAL:
                await this.executeApprovalStep(executionId, step, execution);
                return;
            case workflow_step_entity_1.StepType.CONDITION:
                await this.executeConditionStep(executionId, step, execution);
                break;
            default:
                console.warn(`Unknown step type: ${step.type}, skipping`);
                await this.recordStepResult(executionId, step, 'skipped', { reason: 'Unknown step type' });
                await this.runNextStep(executionId);
                return;
        }
    }
    async executeAutomationStep(executionId, step, execution) {
        this.logger.log(`Running automation step "${step.name}" (execution ${executionId})`);
        const results = await this.workflowAutomationService.runAutomationStep(step, execution);
        this.logger.log(`Automation results: ${JSON.stringify(results.map((r) => ({ type: r.type, status: r.status, detail: r.detail })))}`);
        await this.logEvent(executionId, execution.tenantId, workflow_event_entity_1.EventType.STEP_EXECUTED, execution.triggeredById, { automationResults: results }, {
            stepId: step.id,
            stepName: step.name,
            fromState: execution.currentState,
            toState: execution.currentState,
            notes: `Automation: ${results.map((r) => r.type).join(', ')}`,
        });
        const failed = results.some((r) => r.status === 'failed');
        await this.recordStepResult(executionId, step, failed ? 'failed' : 'completed', {
            actions: results,
        });
        await this.proceedAfterStep(executionId, step);
    }
    async executeNotificationStep(executionId, step, execution) {
        const notificationType = step.config?.notificationType || 'dashboard';
        const targetUserIds = step.config?.assignToUsers || [execution.triggeredById];
        const entityName = execution.context?.entityType || 'Record';
        const entityData = execution.context?.entityData || {};
        let emailSent = false;
        for (const userId of targetUserIds) {
            if (notificationType === 'dashboard' || notificationType === 'both') {
                await this.createNotification(execution.tenantId, userId, step.name || 'Workflow Notification', step.description || `Notification from workflow for ${entityName}`, execution.context?.entityId, executionId);
            }
            if (notificationType === 'email' || notificationType === 'both') {
                const user = await this.userRepo.findOne({ where: { id: userId } });
                if (user?.email) {
                    const subject = step.name || 'Workflow Notification';
                    const text = step.description ||
                        `Notification from workflow for ${entityName}`;
                    const result = await this.emailService.send({
                        to: user.email,
                        subject,
                        text,
                    });
                    if (result.sent)
                        emailSent = true;
                }
            }
        }
        await this.recordStepResult(executionId, step, 'completed', {
            notificationType,
            recipients: targetUserIds.length,
            emailSent
        });
        await this.proceedAfterStep(executionId, step);
    }
    buildTaskEntityMetadata(execution) {
        const ctx = execution.context || {};
        const recordId = ctx.recordId ||
            ctx.entityId;
        return {
            entityName: ctx.entityType,
            entitySlug: ctx.entityType,
            recordId,
            entityId: recordId,
            entityDefinitionId: ctx.entityDefinitionId,
            entityData: ctx.entityData,
        };
    }
    async executeTaskStep(executionId, step, execution) {
        const roleId = step.config?.assignToRoles?.[0];
        const userId = step.config?.assignToUsers?.[0];
        const dueHours = step.config?.timeLimit || 24;
        const task = this.taskRepo.create({
            title: step.name,
            description: step.description,
            type: task_entity_1.TaskType.TASK,
            status: task_entity_1.TaskStatus.PENDING,
            assignedToRoleId: roleId,
            visibleToRoleIds: roleId ? [roleId] : [],
            assignedToId: userId || undefined,
            createdBy: { id: execution.triggeredById },
            tenant: { id: execution.tenantId },
            execution: { id: executionId },
            step: { id: step.id },
            dueDate: new Date(Date.now() + dueHours * 60 * 60 * 1000),
            metadata: {
                ...this.buildTaskEntityMetadata(execution),
                actionRequired: step.description,
                priority: 'medium',
                assignmentType: roleId ? 'role_based' : userId ? 'user_direct' : 'creator_fallback',
            },
        });
        await this.taskRepo.save(task);
        await this.executionRepo.update(executionId, {
            status: workflow_execution_entity_1.ExecutionStatus.PAUSED,
            stepResults: [
                ...(execution.stepResults || []),
                {
                    stepId: step.id,
                    stepName: step.name,
                    status: 'waiting_for_task',
                    result: { taskId: task.id, assignedToRoleId: roleId, assignedToUserId: userId },
                },
            ],
        });
        this.logger.log(`Task created: ${task.id} assigned to role ${roleId || 'N/A'}. Execution paused.`);
    }
    async executeApprovalStep(executionId, step, execution) {
        const roleId = step.config?.assignToRoles?.[0];
        const userId = step.config?.assignToUsers?.[0];
        const timeLimitHours = step.config?.timeLimit || 72;
        const task = this.taskRepo.create({
            title: `Approval Required: ${step.name}`,
            description: step.description || 'Please review and approve or reject this workflow step',
            type: task_entity_1.TaskType.APPROVAL,
            status: task_entity_1.TaskStatus.PENDING,
            assignedToRoleId: roleId,
            visibleToRoleIds: roleId ? [roleId] : [],
            assignedToId: userId || undefined,
            createdBy: { id: execution.triggeredById },
            tenant: { id: execution.tenantId },
            execution: { id: executionId },
            step: { id: step.id },
            dueDate: new Date(Date.now() + timeLimitHours * 60 * 60 * 1000),
            metadata: {
                ...this.buildTaskEntityMetadata(execution),
                actionRequired: 'Approve or reject this step',
                priority: 'high',
                assignmentType: roleId ? 'role_based' : userId ? 'user_direct' : 'creator_fallback',
            },
        });
        await this.taskRepo.save(task);
        await this.executionRepo.update(executionId, {
            status: workflow_execution_entity_1.ExecutionStatus.PAUSED,
            stepResults: [
                ...(execution.stepResults || []),
                {
                    stepId: step.id,
                    stepName: step.name,
                    status: 'waiting_for_approval',
                    result: { taskId: task.id, assignedToRoleId: roleId, assignedToUserId: userId },
                },
            ],
        });
        this.logger.log(`Approval task created: ${task.id} assigned to role ${roleId || 'N/A'}. Execution paused.`);
    }
    async executeConditionStep(executionId, step, execution) {
        const entityData = (execution.context?.entityData || {});
        const conditions = step.config?.conditions || [];
        const matchMode = step.config?.matchMode || 'all';
        const conditionsMet = (0, workflow_branching_util_1.evaluateConditions)(entityData, conditions, matchMode);
        const onTrueStepId = step.config?.onTrueStepId;
        const onFalseStepId = step.config?.onFalseStepId;
        const onFalseAction = step.config?.onFalseAction || 'complete';
        await this.recordStepResult(executionId, step, 'completed', {
            conditionsMet,
            matchMode,
            conditionsChecked: conditions.length,
            branch: conditionsMet ? 'true' : 'false',
        });
        this.logger.log(`Condition "${step.name}": ${conditionsMet ? 'TRUE' : 'FALSE'} (${matchMode}, ${conditions.length} rule(s))`);
        if (conditionsMet) {
            if (onTrueStepId) {
                await this.gotoStepById(executionId, onTrueStepId);
            }
            else {
                await this.proceedAfterStep(executionId, step);
            }
            return;
        }
        if (onFalseStepId) {
            await this.gotoStepById(executionId, onFalseStepId);
            return;
        }
        if (onFalseAction === 'next') {
            await this.proceedAfterStep(executionId, step);
            return;
        }
        await this.completeExecution(executionId, execution.workflow?.name);
    }
    async resumeAfterTaskCompletion(taskId, result) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId },
            relations: ['execution'],
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.taskRepo.update(taskId, {
            status: task_entity_1.TaskStatus.COMPLETED,
            completedAt: new Date(),
            result,
        });
        const execution = task.execution;
        if (!execution)
            return;
        if (task.type === task_entity_1.TaskType.APPROVAL && result.approved === false) {
            const rejectedStep = await this.stepRepo.findOne({
                where: { id: task.stepId },
            });
            if (rejectedStep) {
                await this.routeAfterRejection(execution.id, rejectedStep, execution.triggeredById, result.notes);
            }
            else {
                await this.executionRepo.update(execution.id, {
                    status: workflow_execution_entity_1.ExecutionStatus.CANCELLED,
                    completedAt: new Date(),
                });
            }
            return;
        }
        await this.handleStateTransitionAfterTaskCompletion(execution, task, result);
        await this.executionRepo.update(execution.id, {
            status: workflow_execution_entity_1.ExecutionStatus.RUNNING,
            stepResults: [
                ...(execution.stepResults || []).filter((r) => r.stepId !== task.stepId),
                {
                    stepId: task.stepId,
                    stepName: task.title,
                    status: 'completed',
                    result,
                    completedAt: new Date(),
                },
            ],
        });
        this.logger.log(`Task ${taskId} completed. Resuming workflow ${execution.id}`);
        await this.runNextStep(execution.id);
    }
    async handleStateTransitionAfterTaskCompletion(execution, task, result) {
        try {
            const completedStep = await this.stepRepo.findOne({
                where: { id: task.stepId },
                relations: ['workflow'],
            });
            if (!completedStep)
                return;
            const transitions = await this.workflowTransitionRepo.find({
                where: { workflowId: completedStep.workflowId },
                relations: ['fromState', 'toState'],
            });
            const nextTransition = transitions.find(t => {
                if (completedStep.type === 'task' && completedStep.order === 2) {
                    return t.fromState?.key === 'new_hire' && t.toState?.key === 'it_setup';
                }
                if (completedStep.type === 'task' && completedStep.order === 3) {
                    return t.fromState?.key === 'it_setup' && t.toState?.key === 'finance_review';
                }
                if (completedStep.type === 'approval' && completedStep.order === 4) {
                    return t.fromState?.key === 'finance_review' && t.toState?.key === 'completed';
                }
                return false;
            });
            if (nextTransition) {
                const timestamp = new Date().toISOString();
                await this.executionRepo.update(execution.id, {
                    currentState: nextTransition.toState.key,
                    stateHistory: [
                        ...(execution.stateHistory || []),
                        {
                            notes: `State transition triggered by task completion: ${task.title}`,
                            toState: nextTransition.toState.key,
                            fromState: execution.currentState,
                            timestamp,
                        },
                    ],
                });
                this.logger.log(`State transition: ${execution.currentState} → ${nextTransition.toState.key}`);
            }
        }
        catch (error) {
            console.error('Error handling state transition:', error);
        }
    }
    async recordStepResult(executionId, step, status, result) {
        const execution = await this.executionRepo.findOne({ where: { id: executionId } });
        if (!execution)
            return;
        const existing = execution.stepResults || [];
        const filtered = existing.filter((r) => r.stepId !== step.id);
        await this.executionRepo.update(executionId, {
            stepResults: [
                ...filtered,
                {
                    stepId: step.id,
                    stepName: step.name,
                    status,
                    result,
                    completedAt: new Date(),
                },
            ],
        });
    }
    async resolveAssignment(roleId, userId, fallbackUserId, triggeredById, tenantId) {
        if (userId) {
            const user = await this.userRepo.findOne({ where: { id: userId, tenantId, isActive: true } });
            if (user)
                return user.id;
            console.warn(`Assigned user ${userId} not found or inactive, falling back`);
        }
        if (roleId) {
            const usersInRole = await this.userRepo
                .createQueryBuilder('user')
                .leftJoin('user.roles', 'role')
                .where('user.tenantId = :tenantId', { tenantId })
                .andWhere('role.id = :roleId', { roleId })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .orderBy('user.createdAt', 'ASC')
                .limit(1)
                .getOne();
            if (usersInRole) {
                this.logger.debug(`Assigned task to role ${roleId} → user ${usersInRole.id}`);
                return usersInRole.id;
            }
            this.logger.warn(`No active users found in role ${roleId}, falling back`);
        }
        this.logger.debug(`Task assigned to creator ${triggeredById} (no role/user match)`);
        return triggeredById;
    }
    async createNotification(tenantId, userId, title, message, entityId, executionId) {
        const notification = this.notificationRepo.create({
            title,
            message,
            type: notification_entity_1.NotificationType.DASHBOARD,
            isRead: false,
            user: { id: userId },
            tenant: { id: tenantId },
            entityId,
            executionId,
        });
        await this.notificationRepo.save(notification);
    }
    async getExecutions(tenantId) {
        return this.executionRepo.find({
            where: { tenant: { id: tenantId } },
            relations: ['workflow', 'triggeredBy'],
            order: { createdAt: 'DESC' },
        });
    }
    async getExecution(id) {
        const execution = await this.executionRepo.findOne({
            where: { id },
            relations: ['workflow', 'workflow.steps', 'triggeredBy'],
        });
        if (!execution)
            throw new common_1.NotFoundException('Execution not found');
        const events = await this.eventRepo.find({
            where: { executionId: id },
            relations: ['actor'],
            order: { createdAt: 'ASC' },
        });
        return { ...execution, events };
    }
    async logEvent(executionId, tenantId, eventType, actorId, metadata = {}, options = {}) {
        const event = this.eventRepo.create({
            execution: { id: executionId },
            tenant: { id: tenantId },
            actor: actorId ? { id: actorId } : undefined,
            actorId: actorId || undefined,
            eventType,
            fromState: options.fromState,
            toState: options.toState,
            stepId: options.stepId,
            stepName: options.stepName,
            taskId: options.taskId,
            metadata,
            notes: options.notes,
        });
        return this.eventRepo.save(event);
    }
    async transitionState(execution, newState, actorId, notes) {
        const oldState = execution.currentState || workflow_execution_entity_1.WorkflowState.PENDING;
        const historyEntry = {
            fromState: oldState,
            toState: newState,
            timestamp: new Date().toISOString(),
            actorId,
            action: 'state_transition',
            notes,
        };
        execution.stateHistory = [...(execution.stateHistory || []), historyEntry];
        execution.currentState = newState;
        await this.executionRepo.save(execution);
        await this.logEvent(execution.id, execution.tenantId, workflow_event_entity_1.EventType.STATE_CHANGED, actorId, { triggerReason: notes }, { fromState: oldState, toState: newState, notes });
        this.logger.log(`State transition: ${oldState} → ${newState} (execution: ${execution.id})`);
    }
    async findValidTransitions(workflowId, currentState) {
        const currentStateDef = await this.workflowStateRepo.findOne({
            where: { workflowId, key: currentState },
        });
        if (!currentStateDef)
            return [];
        return await this.workflowTransitionRepo.find({
            where: { workflowId, fromStateId: currentStateDef.id },
            relations: ['toState', 'requiredRole'],
        });
    }
    async executeTransition(executionId, transitionId, userId, tenantId, notes) {
        const execution = await this.executionRepo.findOne({
            where: { id: executionId },
            relations: ['workflow'],
        });
        if (!execution)
            throw new common_1.NotFoundException('Execution not found');
        const transition = await this.workflowTransitionRepo.findOne({
            where: { id: transitionId, workflowId: execution.workflowId },
            relations: ['fromState', 'toState'],
        });
        if (!transition)
            throw new common_1.NotFoundException('Transition not found');
        if (transition.fromState.key !== execution.currentState) {
            throw new common_1.BadRequestException('Transition not valid from current state');
        }
        if (transition.requiredRoleId) {
            const actor = await this.userRepo.findOne({
                where: { id: userId, tenantId },
                relations: ['roles'],
            });
            const hasRole = actor?.roles?.some((r) => r.id === transition.requiredRoleId);
            if (!hasRole) {
                throw new common_1.ForbiddenException('You do not have the required role for this transition');
            }
        }
        await this.transitionState(execution, transition.toState.key, userId, notes || `Transition: ${transition.name}`);
        const freshExecution = await this.executionRepo.findOne({
            where: { id: executionId },
            relations: ['workflow'],
        });
        if (freshExecution && transition.actions?.length) {
            await this.executeTransitionActions(executionId, freshExecution, transition.actions, userId);
        }
        const result = await this.executionRepo.findOne({ where: { id: executionId } });
        if (!result)
            throw new common_1.NotFoundException('Execution not found');
        return result;
    }
    async executeTransitionActions(executionId, execution, actions, actorUserId) {
        for (const action of actions) {
            await this.runTransitionAction(executionId, execution, action, actorUserId);
        }
    }
    async runTransitionAction(executionId, execution, action, actorUserId) {
        const config = action.config || {};
        switch (action.type) {
            case 'create_task':
                await this.createTaskFromTransitionConfig(executionId, execution, config);
                break;
            case 'send_notification': {
                const userIds = config.assignToUsers ||
                    (config.assignToUser ? [config.assignToUser] : [execution.triggeredById]);
                const title = config.title || 'Workflow notification';
                const message = config.message ||
                    config.description ||
                    `Update from workflow ${execution.workflow?.name || ''}`;
                for (const uid of userIds) {
                    if (!uid)
                        continue;
                    await this.createNotification(execution.tenantId, uid, title, message, execution.context?.entityId, executionId);
                }
                break;
            }
            case 'update_field': {
                const updates = config.updates
                    ? config.updates
                    : config.field != null
                        ? { [config.field]: config.value }
                        : {};
                if (Object.keys(updates).length === 0)
                    break;
                const context = { ...(execution.context || {}) };
                context.entityData = { ...(context.entityData || {}), ...updates };
                await this.executionRepo.update(executionId, { context });
                const recordId = context.recordId || context.entityId || execution.context?.entityId;
                if (recordId) {
                    const record = await this.entityDataRepo.findOne({
                        where: { id: recordId, tenantId: execution.tenantId },
                    });
                    if (record) {
                        record.data = { ...record.data, ...updates };
                        await this.entityDataRepo.save(record);
                    }
                }
                break;
            }
            default:
                this.logger.warn(`Unknown transition action type: ${action.type}`);
        }
    }
    async createTaskFromTransitionConfig(executionId, execution, config) {
        const isApproval = config.taskType === 'approval';
        const roleId = config.assignToRoles?.[0];
        const userId = config.assignToUsers?.[0];
        const timeLimitHours = config.timeLimit || 72;
        const title = config.title ||
            (isApproval ? 'Approval Required' : 'Task');
        const description = config.description || 'Action required from workflow transition';
        const task = this.taskRepo.create({
            title: isApproval ? `Approval Required: ${title}` : title,
            description,
            type: isApproval ? task_entity_1.TaskType.APPROVAL : task_entity_1.TaskType.TASK,
            status: task_entity_1.TaskStatus.PENDING,
            assignedToRoleId: roleId,
            visibleToRoleIds: roleId ? [roleId] : [],
            assignedToId: userId || undefined,
            createdBy: { id: execution.triggeredById },
            tenant: { id: execution.tenantId },
            execution: { id: executionId },
            dueDate: new Date(Date.now() + timeLimitHours * 60 * 60 * 1000),
            metadata: {
                ...this.buildTaskEntityMetadata(execution),
                actionRequired: description,
                priority: config.priority || 'medium',
                assignmentType: roleId ? 'role_based' : userId ? 'user_direct' : 'creator_fallback',
                source: 'transition_action',
            },
        });
        await this.taskRepo.save(task);
        await this.executionRepo.update(executionId, {
            status: workflow_execution_entity_1.ExecutionStatus.PAUSED,
            stepResults: [
                ...(execution.stepResults || []),
                {
                    stepId: null,
                    stepName: title,
                    status: isApproval ? 'waiting_for_approval' : 'waiting_for_task',
                    result: { taskId: task.id, assignedToRoleId: roleId, source: 'transition' },
                },
            ],
        });
        this.logger.log(`Transition action created ${isApproval ? 'approval' : 'task'} ${task.id}`);
    }
    async handleApproval(executionId, taskId, userId, decision, notes) {
        const execution = await this.executionRepo.findOne({
            where: { id: executionId },
            relations: ['workflow', 'workflow.steps'],
        });
        if (!execution)
            throw new common_1.NotFoundException('Execution not found');
        if (execution.status !== workflow_execution_entity_1.ExecutionStatus.PAUSED) {
            throw new common_1.BadRequestException('Execution is not waiting for approval');
        }
        const lastStepResult = execution.stepResults?.[execution.stepResults.length - 1];
        if (!lastStepResult || lastStepResult.status !== 'waiting_for_approval') {
            throw new common_1.BadRequestException('No approval step is currently active');
        }
        const step = execution.workflow?.steps?.find(s => s.id === lastStepResult.stepId);
        if (!step)
            throw new common_1.NotFoundException('Step not found');
        await this.logEvent(executionId, execution.tenantId, decision === 'approve' ? workflow_event_entity_1.EventType.APPROVED : workflow_event_entity_1.EventType.REJECTED, userId, { approved: decision === 'approve', rejectionReason: decision === 'reject' ? notes : undefined }, { stepId: step.id, stepName: step.name, taskId, notes });
        if (decision === 'reject') {
            await this.routeAfterRejection(executionId, step, userId, notes);
            return (await this.loadExecution(executionId));
        }
        lastStepResult.status = 'approved';
        lastStepResult.result = {
            ...lastStepResult.result,
            approved: true,
            approvedBy: userId,
            notes,
        };
        execution.status = workflow_execution_entity_1.ExecutionStatus.RUNNING;
        await this.executionRepo.save(execution);
        await this.logEvent(executionId, execution.tenantId, workflow_event_entity_1.EventType.STEP_EXECUTED, userId, { result: 'approved' }, { stepId: step.id, stepName: step.name });
        await this.proceedAfterStep(executionId, step);
        return (await this.loadExecution(executionId));
    }
    async getExecutionEvents(executionId, tenantId) {
        return this.eventRepo.find({
            where: { executionId, tenantId },
            relations: ['actor'],
            order: { createdAt: 'ASC' },
        });
    }
};
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.WorkflowExecutionService = WorkflowExecutionService = WorkflowExecutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_execution_entity_1.WorkflowExecution)),
    __param(1, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(2, (0, typeorm_1.InjectRepository)(workflow_step_entity_1.WorkflowStep)),
    __param(3, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(4, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(workflow_event_entity_1.WorkflowEvent)),
    __param(7, (0, typeorm_1.InjectRepository)(workflow_state_entity_1.WorkflowState)),
    __param(8, (0, typeorm_1.InjectRepository)(workflow_transition_entity_1.WorkflowTransition)),
    __param(12, (0, typeorm_1.InjectRepository)(entity_data_entity_1.EntityData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        conditional_logic_service_1.ConditionalLogicService,
        workflow_automation_service_1.WorkflowAutomationService,
        email_service_1.EmailService,
        typeorm_2.Repository])
], WorkflowExecutionService);
//# sourceMappingURL=workflow-execution.service.js.map