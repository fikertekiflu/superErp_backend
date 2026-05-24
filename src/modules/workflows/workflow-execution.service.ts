import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowExecution, ExecutionStatus, WorkflowState } from './workflow-execution.entity';
import { WorkflowEvent, EventType } from './workflow-event.entity';
import { Workflow, WorkflowStatus } from './workflow.entity';
import { WorkflowState as WorkflowStateDefinition } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowStep, StepStatus, StepType } from './workflow-step.entity';
import { Task, TaskStatus, TaskType } from '../tasks/task.entity';
import { Notification, NotificationType } from '../notifications/notification.entity';
import { User } from '../users/user.entity';
import { ConditionalLogicService, ConditionalStep } from './conditional-logic.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { EmailService } from '../email/email.service';
import { evaluateConditions } from './workflow-branching.util';
import { EntityData } from '../entities/entity-data.entity';

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(
    @InjectRepository(WorkflowExecution)
    private executionRepo: Repository<WorkflowExecution>,
    @InjectRepository(Workflow)
    private workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private stepRepo: Repository<WorkflowStep>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(WorkflowEvent)
    private eventRepo: Repository<WorkflowEvent>,
    @InjectRepository(WorkflowStateDefinition)
    private workflowStateRepo: Repository<WorkflowStateDefinition>,
    @InjectRepository(WorkflowTransition)
    private workflowTransitionRepo: Repository<WorkflowTransition>,
    private conditionalLogicService: ConditionalLogicService,
    private workflowAutomationService: WorkflowAutomationService,
    private emailService: EmailService,
    @InjectRepository(EntityData)
    private entityDataRepo: Repository<EntityData>,
  ) {}

  /**
   * Trigger a workflow execution — this is the entry point
   * Called when an entity record is created/updated and a workflow matches
   */
  async triggerWorkflow(
    workflowId: string,
    triggeredByUserId: string,
    tenantId: string,
    context: {
      entityId?: string;
      recordId?: string;
      entityDefinitionId?: string;
      entityType?: string;
      entityData?: Record<string, any>;
      triggerType?: string;
    } = {},
  ): Promise<WorkflowExecution> {
    // Load workflow with steps and states
    const workflow = await this.workflowRepo.findOne({
      where: { id: workflowId, tenant: { id: tenantId } },
      relations: ['steps', 'states'],
    });

    if (!workflow) throw new NotFoundException('Workflow not found');
    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Workflow is not active');
    }

    // Check trigger matches - allow manual trigger for any workflow
    if (context.triggerType !== 'manual' && workflow.trigger !== context.triggerType) {
      throw new BadRequestException('Trigger type does not match workflow configuration');
    }

    // Get initial state (first state by order, or use PENDING as fallback)
    let initialState = 'PENDING';
    if (workflow.states && workflow.states.length > 0) {
      const firstState = workflow.states.sort((a, b) => a.order - b.order)[0];
      initialState = firstState.key;
    }

    // Create execution record
    const execution = this.executionRepo.create();
    execution.workflowId = workflowId;
    execution.tenantId = tenantId;
    execution.triggeredById = triggeredByUserId;
    execution.status = ExecutionStatus.RUNNING;
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

    // Log trigger event
    await this.logEvent(saved.id, tenantId, EventType.TRIGGERED, triggeredByUserId, {}, {
      notes: 'Workflow triggered',
    });

    // Run the first step
    await this.runNextStep(saved.id);

    const result = await this.executionRepo.findOne({ where: { id: saved.id } });
    return result!;
  }

  /**
   * Execute the next linear step (by order) after currentStepOrder.
   */
  private async runNextStep(executionId: string): Promise<void> {
    const execution = await this.loadExecution(executionId);
    if (!execution?.workflow) return;

    const steps = this.getSortedSteps(execution.workflow);
    const currentStepOrder = execution.currentStepOrder || 0;
    const nextStep = steps.find((step) => step.order > currentStepOrder);

    if (!nextStep) {
      await this.completeExecution(executionId, execution.workflow.name);
      return;
    }

    await this.runStepAt(executionId, nextStep);
  }

  private getSortedSteps(workflow: Workflow): WorkflowStep[] {
    return [...(workflow.steps || [])].sort((a, b) => a.order - b.order);
  }

  private async loadExecution(executionId: string): Promise<WorkflowExecution | null> {
    return this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['workflow', 'workflow.steps'],
    });
  }

  private async completeExecution(
    executionId: string,
    workflowName?: string,
  ): Promise<void> {
    await this.executionRepo.update(executionId, {
      status: ExecutionStatus.COMPLETED,
      completedAt: new Date(),
    });
    this.logger.log(`Workflow ${workflowName || executionId} completed`);
  }

  private async runStepAt(
    executionId: string,
    step: WorkflowStep,
  ): Promise<void> {
    await this.executionRepo.update(executionId, {
      currentStepOrder: step.order,
    });

    const execution = await this.loadExecution(executionId);
    if (!execution) return;

    await this.executeStepOfType(executionId, step, execution);
  }

  private async gotoStepById(
    executionId: string,
    stepId: string,
  ): Promise<void> {
    const execution = await this.loadExecution(executionId);
    if (!execution?.workflow) return;

    const target = execution.workflow.steps?.find((s) => s.id === stepId);
    if (!target) {
      this.logger.warn(`Branch target step ${stepId} not found — completing workflow`);
      await this.completeExecution(executionId, execution.workflow.name);
      return;
    }

    this.logger.log(`Branching to step "${target.name}" (${target.id})`);
    await this.runStepAt(executionId, target);
  }

  /**
   * After a step finishes, follow explicit nextStepId or the next step in order.
   */
  private async proceedAfterStep(
    executionId: string,
    completedStep: WorkflowStep,
  ): Promise<void> {
    const explicitNext = completedStep.config?.nextStepId as string | undefined;
    if (explicitNext) {
      await this.gotoStepById(executionId, explicitNext);
      return;
    }
    await this.runNextStep(executionId);
  }

  private async executeStepOfType(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    switch (step.type) {
      case StepType.AUTOMATION:
        await this.executeAutomationStep(executionId, step, execution);
        break;
      case StepType.TASK:
        await this.executeTaskStep(executionId, step, execution);
        break;
      case StepType.APPROVAL:
        await this.executeApprovalStep(executionId, step, execution);
        break;
      case StepType.CONDITION:
      case 'conditional':
        await this.executeConditionStep(executionId, step, execution);
        break;
      case StepType.NOTIFICATION:
        await this.executeNotificationStep(executionId, step, execution);
        break;
      default:
        this.logger.warn(`Unknown step type: ${step.type} — skipping`);
        await this.runNextStep(executionId);
    }
  }

  private async routeAfterRejection(
    executionId: string,
    step: WorkflowStep,
    userId: string,
    notes?: string,
  ): Promise<void> {
    const rejectStepId = step.config?.onRejectStepId as string | undefined;
    const rejectAction = step.config?.onRejectAction || 'cancel';

    await this.logEvent(
      executionId,
      (await this.loadExecution(executionId))!.tenantId,
      EventType.REJECTED,
      userId,
      { rejectionReason: notes },
      { stepId: step.id, stepName: step.name, notes },
    );

    if (rejectStepId && rejectAction === 'goto') {
      await this.executionRepo.update(executionId, {
        status: ExecutionStatus.RUNNING,
      });
      this.logger.log(`Rejection routed to step ${rejectStepId}`);
      await this.gotoStepById(executionId, rejectStepId);
      return;
    }

    const execution = await this.loadExecution(executionId);
    if (!execution) return;

    const rejectionState =
      step.config?.rejectionState || WorkflowState.REJECTED;
    await this.transitionState(
      execution,
      rejectionState as WorkflowState,
      userId,
      notes || 'Approval rejected',
    );

    await this.executionRepo.update(executionId, {
      status: ExecutionStatus.REJECTED,
      completedAt: new Date(),
    });
    this.logger.log(`Workflow rejected at step "${step.name}"`);
  }

  /**
   * Execute a single step based on its type
   */
  private async executeStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    this.logger.log(`Executing step ${step.order}: ${step.name} (type: ${step.type})`);

    switch (step.type) {
      case StepType.AUTOMATION:
        await this.executeAutomationStep(executionId, step, execution);
        break;
      case StepType.NOTIFICATION:
        await this.executeNotificationStep(executionId, step, execution);
        break;
      case StepType.TASK:
        await this.executeTaskStep(executionId, step, execution);
        // Task steps PAUSE execution until completed by a human
        return;
      case StepType.APPROVAL:
        await this.executeApprovalStep(executionId, step, execution);
        // Approval steps PAUSE execution until approved/rejected
        return;
      case StepType.CONDITION:
        await this.executeConditionStep(executionId, step, execution);
        break;
      default:
        console.warn(`Unknown step type: ${step.type}, skipping`);
        await this.recordStepResult(executionId, step, 'skipped', { reason: 'Unknown step type' });
        await this.runNextStep(executionId);
        return;
    }
  }

  /**
   * AUTOMATION step — auto-update fields, create records, send notifications
   */
  private async executeAutomationStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    this.logger.log(
      `Running automation step "${step.name}" (execution ${executionId})`,
    );

    const results = await this.workflowAutomationService.runAutomationStep(
      step,
      execution,
    );

    this.logger.log(
      `Automation results: ${JSON.stringify(results.map((r) => ({ type: r.type, status: r.status, detail: r.detail })))}`,
    );

    await this.logEvent(
      executionId,
      execution.tenantId,
      EventType.STEP_EXECUTED,
      execution.triggeredById,
      { automationResults: results },
      {
        stepId: step.id,
        stepName: step.name,
        fromState: execution.currentState,
        toState: execution.currentState,
        notes: `Automation: ${results.map((r) => r.type).join(', ')}`,
      },
    );

    const failed = results.some((r) => r.status === 'failed');
    await this.recordStepResult(executionId, step, failed ? 'failed' : 'completed', {
      actions: results,
    });

    await this.proceedAfterStep(executionId, step);
  }

  /**
   * NOTIFICATION step — send email and/or dashboard alert
   */
  private async executeNotificationStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    const notificationType = step.config?.notificationType || 'dashboard';
    const targetUserIds = step.config?.assignToUsers || [execution.triggeredById];
    const entityName = execution.context?.entityType || 'Record';
    const entityData = execution.context?.entityData || {};

    let emailSent = false;

    for (const userId of targetUserIds) {
      // Create dashboard notification
      if (notificationType === 'dashboard' || notificationType === 'both') {
        await this.createNotification(
          execution.tenantId,
          userId,
          step.name || 'Workflow Notification',
          step.description || `Notification from workflow for ${entityName}`,
          execution.context?.entityId,
          executionId,
        );
      }

      if (notificationType === 'email' || notificationType === 'both') {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (user?.email) {
          const subject = step.name || 'Workflow Notification';
          const text =
            step.description ||
            `Notification from workflow for ${entityName}`;
          const result = await this.emailService.send({
            to: user.email,
            subject,
            text,
          });
          if (result.sent) emailSent = true;
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

  private buildTaskEntityMetadata(execution: WorkflowExecution) {
    const ctx = execution.context || {};
    const recordId =
      (ctx.recordId as string | undefined) ||
      (ctx.entityId as string | undefined);

    return {
      entityName: ctx.entityType as string | undefined,
      entitySlug: ctx.entityType as string | undefined,
      recordId,
      entityId: recordId,
      entityDefinitionId: ctx.entityDefinitionId as string | undefined,
      entityData: ctx.entityData as Record<string, unknown> | undefined,
    };
  }

  /**
   * TASK step — create a human task and PAUSE execution
   */
  private async executeTaskStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    const roleId = step.config?.assignToRoles?.[0];
    const userId = step.config?.assignToUsers?.[0];
    const dueHours = step.config?.timeLimit || 24;

    // Role-based assignment with claim system
    const task = this.taskRepo.create({
      title: step.name,
      description: step.description,
      type: TaskType.TASK,
      status: TaskStatus.PENDING,
      assignedToRoleId: roleId, // Role this task is assigned to
      visibleToRoleIds: roleId ? [roleId] : [], // All users with this role can see it
      assignedToId: userId || undefined, // Specific user (if direct assignment)
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
      } as any,
    });

    await this.taskRepo.save(task);

    // PAUSE execution — will resume when task is completed
    await this.executionRepo.update(executionId, {
      status: ExecutionStatus.PAUSED,
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

  /**
   * APPROVAL step — create an approval task and PAUSE execution
   */
  private async executeApprovalStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    const roleId = step.config?.assignToRoles?.[0];
    const userId = step.config?.assignToUsers?.[0];
    const timeLimitHours = step.config?.timeLimit || 72;

    // Role-based assignment with claim system
    const task = this.taskRepo.create({
      title: `Approval Required: ${step.name}`,
      description: step.description || 'Please review and approve or reject this workflow step',
      type: TaskType.APPROVAL,
      status: TaskStatus.PENDING,
      assignedToRoleId: roleId, // Role this task is assigned to
      visibleToRoleIds: roleId ? [roleId] : [], // All users with this role can see it
      assignedToId: userId || undefined, // Specific user (if direct assignment)
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
      } as any,
    });

    await this.taskRepo.save(task);

    // PAUSE execution
    await this.executionRepo.update(executionId, {
      status: ExecutionStatus.PAUSED,
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

  /**
   * CONDITION step — branch to onTrueStepId / onFalseStepId or follow default path
   */
  private async executeConditionStep(
    executionId: string,
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<void> {
    const entityData = (execution.context?.entityData || {}) as Record<
      string,
      unknown
    >;
    const conditions = step.config?.conditions || [];
    const matchMode =
      (step.config?.matchMode as 'all' | 'any' | undefined) || 'all';
    const conditionsMet = evaluateConditions(
      entityData,
      conditions,
      matchMode,
    );

    const onTrueStepId = step.config?.onTrueStepId as string | undefined;
    const onFalseStepId = step.config?.onFalseStepId as string | undefined;
    const onFalseAction =
      (step.config?.onFalseAction as string | undefined) || 'complete';

    await this.recordStepResult(executionId, step, 'completed', {
      conditionsMet,
      matchMode,
      conditionsChecked: conditions.length,
      branch: conditionsMet ? 'true' : 'false',
    });

    this.logger.log(
      `Condition "${step.name}": ${conditionsMet ? 'TRUE' : 'FALSE'} (${matchMode}, ${conditions.length} rule(s))`,
    );

    if (conditionsMet) {
      if (onTrueStepId) {
        await this.gotoStepById(executionId, onTrueStepId);
      } else {
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

  /**
   * Resume execution after a task/approval is completed
   */
  async resumeAfterTaskCompletion(taskId: string, result: { approved?: boolean; notes?: string; data?: any }): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['execution'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Update task status
    await this.taskRepo.update(taskId, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result,
    });

    const execution = task.execution;
    if (!execution) return;

    // For approval tasks, check if rejected
    if (task.type === TaskType.APPROVAL && result.approved === false) {
      const rejectedStep = await this.stepRepo.findOne({
        where: { id: task.stepId },
      });
      if (rejectedStep) {
        await this.routeAfterRejection(
          execution.id,
          rejectedStep,
          execution.triggeredById,
          result.notes,
        );
      } else {
        await this.executionRepo.update(execution.id, {
          status: ExecutionStatus.CANCELLED,
          completedAt: new Date(),
        });
      }
      return;
    }

    // Check if this task completion should trigger a state transition
    await this.handleStateTransitionAfterTaskCompletion(execution, task, result);

    // Resume execution — set back to RUNNING and proceed
    await this.executionRepo.update(execution.id, {
      status: ExecutionStatus.RUNNING,
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

  /**
   * Handle state transitions after task completion
   */
  private async handleStateTransitionAfterTaskCompletion(
    execution: WorkflowExecution,
    task: Task,
    result: { approved?: boolean; notes?: string; data?: any }
  ): Promise<void> {
    try {
      // Find the step that was just completed
      const completedStep = await this.stepRepo.findOne({
        where: { id: task.stepId },
        relations: ['workflow'],
      });

      if (!completedStep) return;

      // Get all transitions for this workflow
      const transitions = await this.workflowTransitionRepo.find({
        where: { workflowId: completedStep.workflowId },
        relations: ['fromState', 'toState'],
      });

      // Find the next state transition based on the completed step
      const nextTransition = transitions.find(t => {
        // Logic to determine which transition should happen based on the step
        // This could be configured in the step config or based on step type
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
        // Update execution state
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
    } catch (error) {
      console.error('Error handling state transition:', error);
    }
  }

  /**
   * Helper: Record step result
   */
  private async recordStepResult(
    executionId: string,
    step: WorkflowStep,
    status: string,
    result: any,
  ): Promise<void> {
    const execution = await this.executionRepo.findOne({ where: { id: executionId } });
    if (!execution) return;

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

  /**
   * Helper: Resolve task assignment (custom role → user fallback)
   */
  private async resolveAssignment(
    roleId: string | undefined,
    userId: string | undefined,
    fallbackUserId: string | undefined,
    triggeredById: string,
    tenantId: string,
  ): Promise<string> {
    // 1. Try specific user assignment first
    if (userId) {
      const user = await this.userRepo.findOne({ where: { id: userId, tenantId, isActive: true } });
      if (user) return user.id;
      console.warn(`Assigned user ${userId} not found or inactive, falling back`);
    }

    // 2. Try custom role assignment
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

    // 3. Fallback to creator
    this.logger.debug(`Task assigned to creator ${triggeredById} (no role/user match)`);
    return triggeredById;
  }

  /**
   * Helper: Create a notification
   */
  private async createNotification(
    tenantId: string,
    userId: string,
    title: string,
    message: string,
    entityId?: string,
    executionId?: string,
  ): Promise<void> {
    const notification = this.notificationRepo.create({
      title,
      message,
      type: NotificationType.DASHBOARD,
      isRead: false,
      user: { id: userId },
      tenant: { id: tenantId },
      entityId,
      executionId,
    });
    await this.notificationRepo.save(notification);
  }

  /**
   * Get all executions for a tenant
   */
  async getExecutions(tenantId: string): Promise<WorkflowExecution[]> {
    return this.executionRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['workflow', 'triggeredBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single execution with events
   */
  async getExecution(id: string): Promise<WorkflowExecution & { events: WorkflowEvent[] }> {
    const execution = await this.executionRepo.findOne({
      where: { id },
      relations: ['workflow', 'workflow.steps', 'triggeredBy'],
    });
    if (!execution) throw new NotFoundException('Execution not found');
    
    // Load events
    const events = await this.eventRepo.find({
      where: { executionId: id },
      relations: ['actor'],
      order: { createdAt: 'ASC' },
    });
    
    return { ...execution, events } as any;
  }

  /**
   * Log a workflow event for audit trail
   */
  private async logEvent(
    executionId: string,
    tenantId: string,
    eventType: EventType,
    actorId: string,
    metadata: any = {},
    options: {
      fromState?: string;
      toState?: string;
      stepId?: string;
      stepName?: string;
      taskId?: string;
      notes?: string;
    } = {}
  ): Promise<WorkflowEvent> {
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

  /**
   * Transition workflow state with audit logging
   */
  private async transitionState(
    execution: WorkflowExecution,
    newState: WorkflowState,
    actorId: string,
    notes?: string
  ): Promise<void> {
    const oldState = execution.currentState || WorkflowState.PENDING;
    
    // Update state history
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
    
    // Save execution
    await this.executionRepo.save(execution);
    
    // Log event
    await this.logEvent(
      execution.id,
      execution.tenantId,
      EventType.STATE_CHANGED,
      actorId,
      { triggerReason: notes },
      { fromState: oldState, toState: newState, notes }
    );
    
    this.logger.log(`State transition: ${oldState} → ${newState} (execution: ${execution.id})`);
  }

  /**
   * Find valid transitions from current state
   */
  private async findValidTransitions(
    workflowId: string,
    currentState: string
  ): Promise<WorkflowTransition[]> {
    const currentStateDef = await this.workflowStateRepo.findOne({
      where: { workflowId, key: currentState },
    });

    if (!currentStateDef) return [];

    return await this.workflowTransitionRepo.find({
      where: { workflowId, fromStateId: currentStateDef.id },
      relations: ['toState', 'requiredRole'],
    });
  }

  /**
   * Execute a dynamic transition
   */
  async executeTransition(
    executionId: string,
    transitionId: string,
    userId: string,
    tenantId: string,
    notes?: string
  ): Promise<WorkflowExecution> {
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['workflow'],
    });

    if (!execution) throw new NotFoundException('Execution not found');

    const transition = await this.workflowTransitionRepo.findOne({
      where: { id: transitionId, workflowId: execution.workflowId },
      relations: ['fromState', 'toState'],
    });

    if (!transition) throw new NotFoundException('Transition not found');

    // Check if transition is valid from current state
    if (transition.fromState.key !== execution.currentState) {
      throw new BadRequestException('Transition not valid from current state');
    }

    if (transition.requiredRoleId) {
      const actor = await this.userRepo.findOne({
        where: { id: userId, tenantId },
        relations: ['roles'],
      });
      const hasRole = actor?.roles?.some(
        (r) => r.id === transition.requiredRoleId,
      );
      if (!hasRole) {
        throw new ForbiddenException(
          'You do not have the required role for this transition',
        );
      }
    }

    // Transition to the new state
    await this.transitionState(
      execution,
      transition.toState.key as any,
      userId,
      notes || `Transition: ${transition.name}`
    );

    const freshExecution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['workflow'],
    });
    if (freshExecution && transition.actions?.length) {
      await this.executeTransitionActions(
        executionId,
        freshExecution,
        transition.actions,
        userId,
      );
    }

    const result = await this.executionRepo.findOne({ where: { id: executionId } });
    if (!result) throw new NotFoundException('Execution not found');
    return result;
  }

  private async executeTransitionActions(
    executionId: string,
    execution: WorkflowExecution,
    actions: NonNullable<WorkflowTransition['actions']>,
    actorUserId: string,
  ): Promise<void> {
    for (const action of actions) {
      await this.runTransitionAction(executionId, execution, action, actorUserId);
    }
  }

  private async runTransitionAction(
    executionId: string,
    execution: WorkflowExecution,
    action: { type?: string; config?: Record<string, any> },
    actorUserId: string,
  ): Promise<void> {
    const config = action.config || {};
    switch (action.type) {
      case 'create_task':
        await this.createTaskFromTransitionConfig(executionId, execution, config);
        break;
      case 'send_notification': {
        const userIds: string[] =
          config.assignToUsers ||
          (config.assignToUser ? [config.assignToUser] : [execution.triggeredById]);
        const title = config.title || 'Workflow notification';
        const message =
          config.message ||
          config.description ||
          `Update from workflow ${execution.workflow?.name || ''}`;
        for (const uid of userIds) {
          if (!uid) continue;
          await this.createNotification(
            execution.tenantId,
            uid,
            title,
            message,
            execution.context?.entityId,
            executionId,
          );
        }
        break;
      }
      case 'update_field': {
        const updates: Record<string, unknown> = config.updates
          ? config.updates
          : config.field != null
            ? { [config.field]: config.value }
            : {};
        if (Object.keys(updates).length === 0) break;

        const context = { ...(execution.context || {}) };
        context.entityData = { ...(context.entityData || {}), ...updates };
        await this.executionRepo.update(executionId, { context });

        const recordId =
          context.recordId || context.entityId || execution.context?.entityId;
        if (recordId) {
          const record = await this.entityDataRepo.findOne({
            where: { id: recordId as string, tenantId: execution.tenantId },
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

  private async createTaskFromTransitionConfig(
    executionId: string,
    execution: WorkflowExecution,
    config: Record<string, any>,
  ): Promise<void> {
    const isApproval = config.taskType === 'approval';
    const roleId = config.assignToRoles?.[0];
    const userId = config.assignToUsers?.[0];
    const timeLimitHours = config.timeLimit || 72;
    const title =
      config.title ||
      (isApproval ? 'Approval Required' : 'Task');
    const description =
      config.description || 'Action required from workflow transition';

    const task = this.taskRepo.create({
      title: isApproval ? `Approval Required: ${title}` : title,
      description,
      type: isApproval ? TaskType.APPROVAL : TaskType.TASK,
      status: TaskStatus.PENDING,
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
      } as any,
    });

    await this.taskRepo.save(task);

    await this.executionRepo.update(executionId, {
      status: ExecutionStatus.PAUSED,
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

    this.logger.log(
      `Transition action created ${isApproval ? 'approval' : 'task'} ${task.id}`,
    );
  }

  /**
   * Handle approval with approve/reject paths
   */
  async handleApproval(
    executionId: string,
    taskId: string,
    userId: string,
    decision: 'approve' | 'reject',
    notes?: string
  ): Promise<WorkflowExecution> {
    const execution = await this.executionRepo.findOne({
      where: { id: executionId },
      relations: ['workflow', 'workflow.steps'],
    });
    
    if (!execution) throw new NotFoundException('Execution not found');
    if (execution.status !== ExecutionStatus.PAUSED) {
      throw new BadRequestException('Execution is not waiting for approval');
    }

    // Find the current step from stepResults
    const lastStepResult = execution.stepResults?.[execution.stepResults.length - 1];
    if (!lastStepResult || lastStepResult.status !== 'waiting_for_approval') {
      throw new BadRequestException('No approval step is currently active');
    }

    const step = execution.workflow?.steps?.find(s => s.id === lastStepResult.stepId);
    if (!step) throw new NotFoundException('Step not found');

    // Log the approval/rejection event
    await this.logEvent(
      executionId,
      execution.tenantId,
      decision === 'approve' ? EventType.APPROVED : EventType.REJECTED,
      userId,
      { approved: decision === 'approve', rejectionReason: decision === 'reject' ? notes : undefined },
      { stepId: step.id, stepName: step.name, taskId, notes }
    );

    if (decision === 'reject') {
      await this.routeAfterRejection(executionId, step, userId, notes);
      return (await this.loadExecution(executionId))!;
    }

    lastStepResult.status = 'approved';
    lastStepResult.result = {
      ...lastStepResult.result,
      approved: true,
      approvedBy: userId,
      notes,
    };

    execution.status = ExecutionStatus.RUNNING;
    await this.executionRepo.save(execution);

    await this.logEvent(
      executionId,
      execution.tenantId,
      EventType.STEP_EXECUTED,
      userId,
      { result: 'approved' },
      { stepId: step.id, stepName: step.name },
    );

    await this.proceedAfterStep(executionId, step);

    return (await this.loadExecution(executionId))!;
  }

  /**
   * Get workflow events for audit trail
   */
  async getExecutionEvents(executionId: string, tenantId: string): Promise<WorkflowEvent[]> {
    return this.eventRepo.find({
      where: { executionId, tenantId },
      relations: ['actor'],
      order: { createdAt: 'ASC' },
    });
  }
}
