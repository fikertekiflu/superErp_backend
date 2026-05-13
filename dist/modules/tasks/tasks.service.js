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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const core_1 = require("@nestjs/core");
const task_entity_1 = require("./task.entity");
const user_entity_1 = require("../users/user.entity");
const workflow_execution_service_1 = require("../workflows/workflow-execution.service");
let TasksService = class TasksService {
    taskRepo;
    userRepo;
    moduleRef;
    constructor(taskRepo, userRepo, moduleRef) {
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
        this.moduleRef = moduleRef;
    }
    async getTasksForUser(userId, tenantId) {
        return this.taskRepo.find({
            where: { assignedTo: { id: userId }, tenant: { id: tenantId } },
            relations: ['execution', 'step'],
            order: { createdAt: 'DESC' },
        });
    }
    async getAllTasks(tenantId) {
        return this.taskRepo.find({
            where: { tenant: { id: tenantId } },
            relations: ['assignedTo', 'createdBy', 'execution'],
            order: { createdAt: 'DESC' },
        });
    }
    async getTask(id) {
        const task = await this.taskRepo.findOne({
            where: { id },
            relations: ['assignedTo', 'createdBy', 'execution', 'step'],
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async completeTask(taskId, userId, result) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, assignedTo: { id: userId } },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found or not assigned to you');
        if (task.status !== task_entity_1.TaskStatus.PENDING && task.status !== task_entity_1.TaskStatus.IN_PROGRESS) {
            throw new Error('Task is not in a completable state');
        }
        const executionService = this.moduleRef.get(workflow_execution_service_1.WorkflowExecutionService, { strict: false });
        await executionService.resumeAfterTaskCompletion(taskId, result);
        return this.getTask(taskId);
    }
    async startTask(taskId, userId) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, assignedTo: { id: userId } },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.taskRepo.update(taskId, { status: task_entity_1.TaskStatus.IN_PROGRESS });
        return this.getTask(taskId);
    }
    async cancelTask(taskId, userId) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, assignedTo: { id: userId } },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.taskRepo.update(taskId, { status: task_entity_1.TaskStatus.CANCELLED });
        return this.getTask(taskId);
    }
    async getTaskStats(tenantId) {
        const total = await this.taskRepo.count({ where: { tenant: { id: tenantId } } });
        const pending = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: task_entity_1.TaskStatus.PENDING } });
        const inProgress = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: task_entity_1.TaskStatus.IN_PROGRESS } });
        const completed = await this.taskRepo.count({ where: { tenant: { id: tenantId }, status: task_entity_1.TaskStatus.COMPLETED } });
        return { total, pending, inProgress, completed };
    }
    async getTasksByUserRoles(userId, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenantId },
            relations: ['roles'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const userRoleIds = user.roles?.map(r => r.id) || [];
        if (userRoleIds.length === 0) {
            return this.getTasksForUser(userId, tenantId);
        }
        const tasks = await this.taskRepo
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.execution', 'execution')
            .leftJoinAndSelect('task.step', 'step')
            .leftJoinAndSelect('task.claimedBy', 'claimedBy')
            .where('task.tenantId = :tenantId', { tenantId })
            .andWhere(`(
          task.claimedByUserId = :userId 
          OR (
            task.claimedByUserId IS NULL 
            AND task.assignedToRoleId IN (:...roleIds)
          )
        )`, { userId, roleIds: userRoleIds })
            .orderBy('task.createdAt', 'DESC')
            .getMany();
        return tasks;
    }
    async claimTask(taskId, userId, tenantId) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, tenantId },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.claimedByUserId) {
            if (task.claimedByUserId === userId) {
                return task;
            }
            throw new common_1.ForbiddenException('Task already claimed by another user');
        }
        const user = await this.userRepo.findOne({
            where: { id: userId, tenantId },
            relations: ['roles'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const userRoleIds = user.roles?.map(r => r.id) || [];
        if (!task.assignedToRoleId || !userRoleIds.includes(task.assignedToRoleId)) {
            throw new common_1.ForbiddenException('You do not have the required role to claim this task');
        }
        await this.taskRepo.update(taskId, {
            claimedByUserId: userId,
            claimedAt: new Date(),
            assignedToId: userId,
            status: task_entity_1.TaskStatus.IN_PROGRESS,
        });
        console.log(`✅ Task ${taskId} claimed by user ${userId}`);
        return this.getTask(taskId);
    }
    async unclaimTask(taskId, userId, tenantId) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId, tenantId },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.claimedByUserId !== userId) {
            throw new common_1.ForbiddenException('Only the claimed user can unclaim this task');
        }
        if (task.status !== task_entity_1.TaskStatus.IN_PROGRESS) {
            throw new common_1.ForbiddenException('Cannot unclaim task that is not in progress');
        }
        await this.taskRepo.update(taskId, {
            claimedByUserId: undefined,
            claimedAt: undefined,
            assignedToId: undefined,
            status: task_entity_1.TaskStatus.PENDING,
        });
        console.log(`🔄 Task ${taskId} unclaimed by user ${userId}`);
        return this.getTask(taskId);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        core_1.ModuleRef])
], TasksService);
//# sourceMappingURL=tasks.service.js.map