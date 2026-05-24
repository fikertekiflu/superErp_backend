import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
import { Entity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';
import { WorkflowDelegationsService } from '../workflows/workflow-delegations.service';
import { WorkflowApprovalLimitsService } from '../workflows/workflow-approval-limits.service';
import { TaskEntityPreview } from './task-entity-preview.util';
export declare class TasksService {
    private taskRepo;
    private userRepo;
    private entityRepo;
    private entityDataRepo;
    private moduleRef;
    private delegationsService;
    private approvalLimitsService;
    private readonly logger;
    constructor(taskRepo: Repository<Task>, userRepo: Repository<User>, entityRepo: Repository<Entity>, entityDataRepo: Repository<EntityData>, moduleRef: ModuleRef, delegationsService: WorkflowDelegationsService, approvalLimitsService: WorkflowApprovalLimitsService);
    private entityDefCache;
    getTasksForUser(userId: string, tenantId: string): Promise<Task[]>;
    getAllTasks(tenantId: string): Promise<Task[]>;
    getTask(id: string): Promise<Task & {
        entityPreview?: TaskEntityPreview | null;
    }>;
    completeTask(taskId: string, userId: string, result: {
        approved?: boolean;
        notes?: string;
        data?: any;
    }): Promise<Task>;
    startTask(taskId: string, userId: string): Promise<Task>;
    cancelTask(taskId: string, userId: string): Promise<Task>;
    getTaskStats(tenantId: string): Promise<any>;
    getTasksByUserRoles(userId: string, tenantId: string): Promise<Array<Task & {
        entityPreview?: TaskEntityPreview | null;
    }>>;
    private loadEntityDefinition;
    private enrichTaskWithEntityPreview;
    claimTask(taskId: string, userId: string, tenantId: string): Promise<Task>;
    unclaimTask(taskId: string, userId: string, tenantId: string): Promise<Task>;
}
