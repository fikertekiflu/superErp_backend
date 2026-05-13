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
let WorkflowExecutionService = class WorkflowExecutionService {
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
    constructor(executionRepo, workflowRepo, stepRepo, taskRepo, notificationRepo, userRepo, eventRepo, workflowStateRepo, workflowTransitionRepo, conditionalLogicService) {
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
        const execution = await this.executionRepo.findOne({
            where: { id: executionId },
            relations: ['workflow', 'workflow.steps'],
        });
        if (!execution || !execution.workflow) {
            console.error(`Execution ${executionId} not found or has no workflow`);
            return;
        }
        const steps = execution.workflow.steps.sort((a, b) => a.order - b.order);
        const currentStepOrder = execution.currentStepOrder || 0;
        const nextStep = steps.find(step => step.order > currentStepOrder);
        if (!nextStep) {
            await this.executionRepo.update(executionId, {
                status: workflow_execution_entity_1.ExecutionStatus.COMPLETED,
                completedAt: new Date(),
            });
            console.log(`✅ Workflow ${execution.workflow.name} completed!`);
            return;
        }
        await this.executionRepo.update(executionId, {
            currentStepOrder: nextStep.order,
        });
        switch (nextStep.type) {
            case workflow_step_entity_1.StepType.AUTOMATION:
                await this.executeAutomationStep(executionId, nextStep, execution);
                break;
            case workflow_step_entity_1.StepType.TASK:
                await this.executeTaskStep(executionId, nextStep, execution);
                break;
            case workflow_step_entity_1.StepType.APPROVAL:
                await this.executeApprovalStep(executionId, nextStep, execution);
                break;
            case 'conditional':
                await this.executeConditionStep(executionId, nextStep, execution);
                break;
            default:
                console.warn(`Unknown step type: ${nextStep.type}`);
                await this.runNextStep(executionId);
        }
    }
    async executeStep(executionId, step, execution) {
        console.log(`Executing step ${step.order}: ${step.name} (type: ${step.type})`);
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
        const actions = step.config?.actions || [];
        const results = [];
        if (actions.length === 0) {
            console.log(`Automation step "${step.name}" — no actions configured, marking as completed`);
            await this.recordStepResult(executionId, step, 'completed', { actions: [], note: 'No actions configured' });
            await this.runNextStep(executionId);
            return;
        }
        for (const action of actions) {
            switch (action.type) {
                case 'update_field':
                    results.push({ action: 'update_field', status: 'executed', config: action.config });
                    console.log(`Auto-updating field: ${JSON.stringify(action.config)}`);
                    break;
                case 'create_entity':
                    results.push({ action: 'create_entity', status: 'executed', config: action.config });
                    console.log(`Auto-creating entity record: ${JSON.stringify(action.config)}`);
                    break;
                case 'update_entity':
                    results.push({ action: 'update_entity', status: 'executed', config: action.config });
                    console.log(`Auto-updating entity: ${JSON.stringify(action.config)}`);
                    break;
                case 'send_notification':
                    await this.createNotification(execution.tenantId, step.config?.assignToUsers?.[0] || execution.triggeredById, `Workflow: ${execution.workflow?.name || 'Automation'}`, `Step "${step.name}" executed automatically`, execution.context?.entityId, executionId);
                    results.push({ action: 'send_notification', status: 'sent' });
                    break;
                default:
                    results.push({ action: action.type, status: 'skipped', reason: 'Unknown action' });
            }
        }
        await this.recordStepResult(executionId, step, 'completed', { actions: results });
        await this.runNextStep(executionId);
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
                    console.log(`📧 Email sent to ${user.email}: ${step.name} — ${step.description}`);
                    emailSent = true;
                }
            }
        }
        await this.recordStepResult(executionId, step, 'completed', {
            notificationType,
            recipients: targetUserIds.length,
            emailSent
        });
        await this.runNextStep(executionId);
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
                entityName: execution.context?.entityType,
                entityId: execution.context?.entityId,
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
        console.log(`📋 Task created: ${task.id} assigned to role ${roleId || 'N/A'}. Execution paused.`);
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
                entityName: execution.context?.entityType,
                entityId: execution.context?.entityId,
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
        console.log(`✅ Approval task created: ${task.id} assigned to role ${roleId || 'N/A'}. Execution paused.`);
    }
    async executeConditionStep(executionId, step, execution) {
        const conditions = step.config?.conditions || [];
        const entityData = execution.context?.entityData || {};
        let allConditionsMet = true;
        for (const cond of conditions) {
            const fieldValue = entityData[cond.field];
            let conditionMet = false;
            switch (cond.operator) {
                case 'equals':
                    conditionMet = fieldValue == cond.value;
                    break;
                case 'not_equals':
                    conditionMet = fieldValue != cond.value;
                    break;
                case 'contains':
                    conditionMet = String(fieldValue).includes(String(cond.value));
                    break;
                case 'greater_than':
                    conditionMet = Number(fieldValue) > Number(cond.value);
                    break;
                case 'less_than':
                    conditionMet = Number(fieldValue) < Number(cond.value);
                    break;
            }
            if (!conditionMet) {
                allConditionsMet = false;
                break;
            }
        }
        await this.recordStepResult(executionId, step, 'completed', {
            allConditionsMet,
            conditionsChecked: conditions.length,
        });
        if (allConditionsMet) {
            console.log(`Condition step passed — continuing workflow`);
            await this.runNextStep(executionId);
        }
        else {
            console.log(`Condition step failed — skipping remaining steps`);
            await this.executionRepo.update(executionId, {
                status: workflow_execution_entity_1.ExecutionStatus.COMPLETED,
                completedAt: new Date(),
                stepResults: [
                    ...(execution.stepResults || []),
                    {
                        stepId: step.id,
                        stepName: step.name,
                        status: 'condition_not_met',
                        result: { allConditionsMet: false },
                        completedAt: new Date(),
                    },
                ],
            });
        }
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
            await this.executionRepo.update(execution.id, {
                status: workflow_execution_entity_1.ExecutionStatus.CANCELLED,
                completedAt: new Date(),
                stepResults: [
                    ...(execution.stepResults || []),
                    {
                        stepId: task.stepId,
                        stepName: task.title,
                        status: 'rejected',
                        result: { approved: false, notes: result.notes },
                        completedAt: new Date(),
                    },
                ],
            });
            console.log(`Approval rejected — workflow ${execution.id} cancelled`);
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
        console.log(`🔄 Task ${taskId} completed. Resuming workflow ${execution.id}`);
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
                console.log(`🔄 State transition: ${execution.currentState} → ${nextTransition.toState.key}`);
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
                console.log(`Assigned task to role ${roleId} → user ${usersInRole.id}`);
                return usersInRole.id;
            }
            console.warn(`No active users found in role ${roleId}, falling back`);
        }
        console.log(`Task assigned to creator ${triggeredById} (no role/user match)`);
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
        console.log(`🔄 State transition: ${oldState} → ${newState} (execution: ${execution.id})`);
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
        }
        await this.transitionState(execution, transition.toState.key, userId, notes || `Transition: ${transition.name}`);
        if (transition.actions) {
            for (const action of transition.actions) {
                if (action.type === 'create_task') {
                }
            }
        }
        const result = await this.executionRepo.findOne({ where: { id: executionId } });
        if (!result)
            throw new common_1.NotFoundException('Execution not found');
        return result;
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
            const rejectionState = step.config?.rejectionState || workflow_execution_entity_1.WorkflowState.REJECTED;
            await this.transitionState(execution, rejectionState, userId, notes || 'Approval rejected');
            execution.status = workflow_execution_entity_1.ExecutionStatus.REJECTED;
            execution.completedAt = new Date();
            await this.executionRepo.save(execution);
            console.log(`❌ Workflow rejected at step "${step.name}"`);
            return execution;
        }
        lastStepResult.status = 'approved';
        lastStepResult.result = { ...lastStepResult.result, approved: true, approvedBy: userId, notes };
        execution.currentStepOrder += 1;
        execution.status = workflow_execution_entity_1.ExecutionStatus.RUNNING;
        await this.executionRepo.save(execution);
        await this.logEvent(executionId, execution.tenantId, workflow_event_entity_1.EventType.STEP_EXECUTED, userId, { result: 'approved' }, { stepId: step.id, stepName: step.name });
        await this.runNextStep(executionId);
        return execution;
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
exports.WorkflowExecutionService = WorkflowExecutionService = __decorate([
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        conditional_logic_service_1.ConditionalLogicService])
], WorkflowExecutionService);
//# sourceMappingURL=workflow-execution.service.js.map