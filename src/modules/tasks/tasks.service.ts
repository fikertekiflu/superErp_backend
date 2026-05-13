import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Task, TaskStatus } from './task.entity';
import { User } from '../users/user.entity';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private moduleRef: ModuleRef,
  ) {}

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

  async getTask(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy', 'execution', 'step'],
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async completeTask(
    taskId: string,
    userId: string,
    result: { approved?: boolean; notes?: string; data?: any },
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, assignedTo: { id: userId } },
    });
    if (!task) throw new NotFoundException('Task not found or not assigned to you');
    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error('Task is not in a completable state');
    }

    // Resume the workflow execution (lazily resolve to avoid circular DI)
    const executionService = this.moduleRef.get(WorkflowExecutionService, { strict: false });
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
  async getTasksByUserRoles(userId: string, tenantId: string): Promise<Task[]> {
    // Get user's roles
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const userRoleIds = user.roles?.map(r => r.id) || [];
    if (userRoleIds.length === 0) {
      // If user has no roles, only show directly assigned tasks
      return this.getTasksForUser(userId, tenantId);
    }

    // Query: Tasks where:
    // 1. User has claimed the task (claimedByUserId = userId)
    // 2. OR task is unclaimed (claimedByUserId IS NULL) AND user's role matches assignedToRoleId
    // 3. AND tenantId matches
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
        { userId, roleIds: userRoleIds }
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    return tasks;
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

    const userRoleIds = user.roles?.map(r => r.id) || [];

    // Verify user has the required role
    if (!task.assignedToRoleId || !userRoleIds.includes(task.assignedToRoleId)) {
      throw new ForbiddenException('You do not have the required role to claim this task');
    }

    // Claim the task
    await this.taskRepo.update(taskId, {
      claimedByUserId: userId,
      claimedAt: new Date(),
      assignedToId: userId, // Also set as assigned for backward compatibility
      status: TaskStatus.IN_PROGRESS,
    });

    console.log(`✅ Task ${taskId} claimed by user ${userId}`);
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

    console.log(`🔄 Task ${taskId} unclaimed by user ${userId}`);
    return this.getTask(taskId);
  }
}
