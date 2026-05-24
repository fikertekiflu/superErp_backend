import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Task, TaskStatus } from './task.entity';
import { User } from '../users/user.entity';
import { Entity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';
import { WorkflowDelegationsService } from '../workflows/workflow-delegations.service';
import { WorkflowApprovalLimitsService } from '../workflows/workflow-approval-limits.service';
import { TaskType } from './task.entity';
import {
  buildTaskEntityPreview,
  TaskEntityPreview,
} from './task-entity-preview.util';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Entity)
    private entityRepo: Repository<Entity>,
    @InjectRepository(EntityData)
    private entityDataRepo: Repository<EntityData>,
    private moduleRef: ModuleRef,
    private delegationsService: WorkflowDelegationsService,
    private approvalLimitsService: WorkflowApprovalLimitsService,
  ) {}

  private entityDefCache = new Map<string, Entity | null>();

  async getTasksForUser(userId: string, tenantId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { assignedTo: { id: userId }, tenant: { id: tenantId } },
      relations: ['execution', 'step'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTasks(tenantId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['assignedTo', 'createdBy', 'execution'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTask(id: string): Promise<Task & { entityPreview?: TaskEntityPreview | null }> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'execution', 'step'],
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.enrichTaskWithEntityPreview(task);
  }

  async completeTask(
    taskId: string,
    userId: string,
    result: { approved?: boolean; notes?: string; data?: any },
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['execution', 'step'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const isAssignee =
      task.assignedToId === userId || task.claimedByUserId === userId;
    if (!isAssignee) {
      throw new ForbiddenException('Task not assigned to you');
    }
    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error('Task is not in a completable state');
    }

    if (
      task.type === TaskType.APPROVAL &&
      result.approved === true &&
      task.execution
    ) {
      const amountField =
        (task.step?.config as { approvalAmountField?: string })
          ?.approvalAmountField || 'amount';
      await this.approvalLimitsService.assertCanApproveAmount(
        userId,
        task.tenantId!,
        task.execution,
        task.assignedToRoleId,
        amountField,
      );
    }

    const executionService = this.moduleRef.get(WorkflowExecutionService, {
      strict: false,
    });
    await executionService.resumeAfterTaskCompletion(taskId, result);

    return this.getTask(taskId);
  }

  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, assignedTo: { id: userId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.taskRepo.update(taskId, { status: TaskStatus.IN_PROGRESS });
    return this.getTask(taskId);
  }

  async cancelTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, assignedTo: { id: userId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.taskRepo.update(taskId, { status: TaskStatus.CANCELLED });
    return this.getTask(taskId);
  }

  async getTaskStats(tenantId: string): Promise<any> {
    const total = await this.taskRepo.count({ where: { tenant: { id: tenantId } } });
    const pending = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: TaskStatus.PENDING } });
    const inProgress = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: TaskStatus.IN_PROGRESS } });
    const completed = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: TaskStatus.COMPLETED } });

    return { total, pending, inProgress, completed };
  }

  // ==================== ROLE-BASED CLAIM SYSTEM ====================

  /**
   * Get all tasks visible to a user based on their roles
   * Shows: unclaimed tasks in user's roles + tasks claimed by user
   */
  async getTasksByUserRoles(
    userId: string,
    tenantId: string,
  ): Promise<Array<Task & { entityPreview?: TaskEntityPreview | null }>> {
    // Get user's roles
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const userRoleIds = user.roles?.map((r) => r.id) || [];
    const delegatedRoleIds =
      await this.delegationsService.getActiveDelegateRoleIds(tenantId, userId);
    const effectiveRoleIds = [
      ...new Set([...userRoleIds, ...delegatedRoleIds]),
    ];

    if (effectiveRoleIds.length === 0) {
      return this.getTasksForUser(userId, tenantId);
    }

    const tasks = await this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.execution', 'execution')
      .leftJoinAndSelect('task.step', 'step')
      .leftJoinAndSelect('task.claimedBy', 'claimedBy')
      .where('task.tenantId = :tenantId', { tenantId })
      .andWhere(
        `(
          task.claimedByUserId = :userId 
          OR (
            task.claimedByUserId IS NULL 
            AND task.assignedToRoleId IN (:...roleIds)
          )
        )`,
        { userId, roleIds: effectiveRoleIds }
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    return Promise.all(tasks.map((t) => this.enrichTaskWithEntityPreview(t)));
  }

  private async loadEntityDefinition(
    entityDefinitionId: string,
    tenantId: string,
  ): Promise<Entity | null> {
    const cacheKey = `${tenantId}:${entityDefinitionId}`;
    if (this.entityDefCache.has(cacheKey)) {
      return this.entityDefCache.get(cacheKey) ?? null;
    }
    const entity = await this.entityRepo.findOne({
      where: { id: entityDefinitionId, tenantId },
    });
    this.entityDefCache.set(cacheKey, entity);
    return entity;
  }

  private async enrichTaskWithEntityPreview(
    task: Task,
  ): Promise<Task & { entityPreview?: TaskEntityPreview | null }> {
    const ctx = task.execution?.context;
    const meta = (task.metadata || {}) as Record<string, unknown>;

    const recordId =
      (ctx?.recordId as string | undefined) ||
      (ctx?.entityId as string | undefined) ||
      (meta.recordId as string | undefined) ||
      (meta.entityId as string | undefined);

    const entityDefinitionId =
      (ctx?.entityDefinitionId as string | undefined) ||
      (meta.entityDefinitionId as string | undefined);

    const entitySlug =
      (ctx?.entityType as string | undefined) ||
      (meta.entitySlug as string | undefined) ||
      (meta.entityName as string | undefined);

    let entityData =
      (ctx?.entityData as Record<string, unknown> | undefined) ||
      (meta.entityData as Record<string, unknown> | undefined);

    if ((!entityData || Object.keys(entityData).length === 0) && recordId) {
      const record = await this.entityDataRepo.findOne({
        where: { id: recordId, tenantId: task.tenantId },
      });
      entityData = record?.data;
    }

    let entityDef: Entity | null = null;
    if (entityDefinitionId && task.tenantId) {
      entityDef = await this.loadEntityDefinition(
        entityDefinitionId,
        task.tenantId,
      );
    } else if (recordId && task.tenantId) {
      const record = await this.entityDataRepo.findOne({
        where: { id: recordId, tenantId: task.tenantId },
      });
      if (record?.entityId) {
        entityDef = await this.loadEntityDefinition(record.entityId, task.tenantId);
      }
    }

    const entityPreview = buildTaskEntityPreview(entityData, {
      entityName: entityDef?.name || entitySlug,
      entitySlug,
      entityDefinitionId: entityDefinitionId || entityDef?.id,
      recordId,
      fieldDefinitions: entityDef?.fields,
    });

    return { ...task, entityPreview };
  }

  /**
   * Claim a task - user takes ownership of an unclaimed task
   */
  async claimTask(taskId: string, userId: string, tenantId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, tenantId },
    });

    if (!task) throw new NotFoundException('Task not found');

    // Check if already claimed
    if (task.claimedByUserId) {
      if (task.claimedByUserId === userId) {
        return task; // Already claimed by this user
      }
      throw new ForbiddenException('Task already claimed by another user');
    }

    // Get user's roles to verify they can claim this task
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const userRoleIds = user.roles?.map((r) => r.id) || [];
    const access = await this.delegationsService.canActOnRole(
      tenantId,
      userId,
      task.assignedToRoleId,
      userRoleIds,
    );
    if (!access.allowed) {
      throw new ForbiddenException(
        'You do not have the required role (or active delegation) to claim this task',
      );
    }

    const metadata = {
      ...(task.metadata || {}),
      ...(access.viaDelegation ? { actedViaDelegation: true } : {}),
    };

    await this.taskRepo.update(taskId, {
      claimedByUserId: userId,
      claimedAt: new Date(),
      assignedToId: userId,
      status: TaskStatus.IN_PROGRESS,
      metadata: metadata as Task['metadata'],
    });

    this.logger.log(`Task ${taskId} claimed by user ${userId}`);
    return this.getTask(taskId);
  }

  /**
   * Unclaim a task - release ownership (e.g., if user can't complete it)
   */
  async unclaimTask(taskId: string, userId: string, tenantId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, tenantId },
    });

    if (!task) throw new NotFoundException('Task not found');

    // Only the claimed user can unclaim
    if (task.claimedByUserId !== userId) {
      throw new ForbiddenException('Only the claimed user can unclaim this task');
    }

    // Can only unclaim if still in progress
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new ForbiddenException('Cannot unclaim task that is not in progress');
    }

    await this.taskRepo.update(taskId, {
      claimedByUserId: undefined,
      claimedAt: undefined,
      assignedToId: undefined,
      status: TaskStatus.PENDING,
    });

    this.logger.log(`Task ${taskId} unclaimed by user ${userId}`);
    return this.getTask(taskId);
  }
}
