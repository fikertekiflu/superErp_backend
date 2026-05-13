import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Task } from './task.entity';
import { User } from '../users/user.entity';
export declare class TasksService {
    private taskRepo;
    private userRepo;
    private moduleRef;
    constructor(taskRepo: Repository<Task>, userRepo: Repository<User>, moduleRef: ModuleRef);
    getTasksForUser(userId: string, tenantId: string): Promise<Task[]>;
    getAllTasks(tenantId: string): Promise<Task[]>;
    getTask(id: string): Promise<Task>;
    completeTask(taskId: string, userId: string, result: {
        approved?: boolean;
        notes?: string;
        data?: any;
    }): Promise<Task>;
    startTask(taskId: string, userId: string): Promise<Task>;
    cancelTask(taskId: string, userId: string): Promise<Task>;
    getTaskStats(tenantId: string): Promise<any>;
    getTasksByUserRoles(userId: string, tenantId: string): Promise<Task[]>;
    claimTask(taskId: string, userId: string, tenantId: string): Promise<Task>;
    unclaimTask(taskId: string, userId: string, tenantId: string): Promise<Task>;
}
