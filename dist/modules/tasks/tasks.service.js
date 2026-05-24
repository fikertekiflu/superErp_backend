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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const core_1 = require("@nestjs/core");
const task_entity_1 = require("./task.entity");
const user_entity_1 = require("../users/user.entity");
const entity_entity_1 = require("../entities/entity.entity");
const entity_data_entity_1 = require("../entities/entity-data.entity");
const workflow_execution_service_1 = require("../workflows/workflow-execution.service");
const workflow_delegations_service_1 = require("../workflows/workflow-delegations.service");
const workflow_approval_limits_service_1 = require("../workflows/workflow-approval-limits.service");
const task_entity_2 = require("./task.entity");
const task_entity_preview_util_1 = require("./task-entity-preview.util");
let TasksService = TasksService_1 = class TasksService {
    taskRepo;
    userRepo;
    entityRepo;
    entityDataRepo;
    moduleRef;
    delegationsService;
    approvalLimitsService;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(taskRepo, userRepo, entityRepo, entityDataRepo, moduleRef, delegationsService, approvalLimitsService) {
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
        this.entityRepo = entityRepo;
        this.entityDataRepo = entityDataRepo;
        this.moduleRef = moduleRef;
        this.delegationsService = delegationsService;
        this.approvalLimitsService = approvalLimitsService;
    }
    entityDefCache = new Map();
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
        return this.enrichTaskWithEntityPreview(task);
    }
    async completeTask(taskId, userId, result) {
        const task = await this.taskRepo.findOne({
            where: { id: taskId },
            relations: ['execution', 'step'],
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        const isAssignee = task.assignedToId === userId || task.claimedByUserId === userId;
        if (!isAssignee) {
            throw new common_1.ForbiddenException('Task not assigned to you');
        }
        if (task.status !== task_entity_1.TaskStatus.PENDING && task.status !== task_entity_1.TaskStatus.IN_PROGRESS) {
            throw new Error('Task is not in a completable state');
        }
        if (task.type === task_entity_2.TaskType.APPROVAL &&
            result.approved === true &&
            task.execution) {
            const amountField = task.step?.config
                ?.approvalAmountField || 'amount';
            await this.approvalLimitsService.assertCanApproveAmount(userId, task.tenantId, task.execution, task.assignedToRoleId, amountField);
        }
        const executionService = this.moduleRef.get(workflow_execution_service_1.WorkflowExecutionService, {
            strict: false,
        });
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
        const userRoleIds = user.roles?.map((r) => r.id) || [];
        const delegatedRoleIds = await this.delegationsService.getActiveDelegateRoleIds(tenantId, userId);
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
            .andWhere(`(
          task.claimedByUserId = :userId 
          OR (
            task.claimedByUserId IS NULL 
            AND task.assignedToRoleId IN (:...roleIds)
          )
        )`, { userId, roleIds: effectiveRoleIds })
            .orderBy('task.createdAt', 'DESC')
            .getMany();
        return Promise.all(tasks.map((t) => this.enrichTaskWithEntityPreview(t)));
    }
    async loadEntityDefinition(entityDefinitionId, tenantId) {
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
    async enrichTaskWithEntityPreview(task) {
        const ctx = task.execution?.context;
        const meta = (task.metadata || {});
        const recordId = ctx?.recordId ||
            ctx?.entityId ||
            meta.recordId ||
            meta.entityId;
        const entityDefinitionId = ctx?.entityDefinitionId ||
            meta.entityDefinitionId;
        const entitySlug = ctx?.entityType ||
            meta.entitySlug ||
            meta.entityName;
        let entityData = ctx?.entityData ||
            meta.entityData;
        if ((!entityData || Object.keys(entityData).length === 0) && recordId) {
            const record = await this.entityDataRepo.findOne({
                where: { id: recordId, tenantId: task.tenantId },
            });
            entityData = record?.data;
        }
        let entityDef = null;
        if (entityDefinitionId && task.tenantId) {
            entityDef = await this.loadEntityDefinition(entityDefinitionId, task.tenantId);
        }
        else if (recordId && task.tenantId) {
            const record = await this.entityDataRepo.findOne({
                where: { id: recordId, tenantId: task.tenantId },
            });
            if (record?.entityId) {
                entityDef = await this.loadEntityDefinition(record.entityId, task.tenantId);
            }
        }
        const entityPreview = (0, task_entity_preview_util_1.buildTaskEntityPreview)(entityData, {
            entityName: entityDef?.name || entitySlug,
            entitySlug,
            entityDefinitionId: entityDefinitionId || entityDef?.id,
            recordId,
            fieldDefinitions: entityDef?.fields,
        });
        return { ...task, entityPreview };
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
        const userRoleIds = user.roles?.map((r) => r.id) || [];
        const access = await this.delegationsService.canActOnRole(tenantId, userId, task.assignedToRoleId, userRoleIds);
        if (!access.allowed) {
            throw new common_1.ForbiddenException('You do not have the required role (or active delegation) to claim this task');
        }
        const metadata = {
            ...(task.metadata || {}),
            ...(access.viaDelegation ? { actedViaDelegation: true } : {}),
        };
        await this.taskRepo.update(taskId, {
            claimedByUserId: userId,
            claimedAt: new Date(),
            assignedToId: userId,
            status: task_entity_1.TaskStatus.IN_PROGRESS,
            metadata: metadata,
        });
        this.logger.log(`Task ${taskId} claimed by user ${userId}`);
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
        this.logger.log(`Task ${taskId} unclaimed by user ${userId}`);
        return this.getTask(taskId);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __param(3, (0, typeorm_1.InjectRepository)(entity_data_entity_1.EntityData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        core_1.ModuleRef,
        workflow_delegations_service_1.WorkflowDelegationsService,
        workflow_approval_limits_service_1.WorkflowApprovalLimitsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map