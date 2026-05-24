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
exports.WorkflowAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_execution_entity_1 = require("./workflow-execution.entity");
const workflow_entity_1 = require("./workflow.entity");
const task_entity_1 = require("../tasks/task.entity");
const role_entity_1 = require("../roles/role.entity");
let WorkflowAnalyticsService = class WorkflowAnalyticsService {
    executionRepo;
    workflowRepo;
    taskRepo;
    roleRepo;
    constructor(executionRepo, workflowRepo, taskRepo, roleRepo) {
        this.executionRepo = executionRepo;
        this.workflowRepo = workflowRepo;
        this.taskRepo = taskRepo;
        this.roleRepo = roleRepo;
    }
    parseDateRange(dateRange) {
        const end = new Date();
        const start = new Date();
        switch (dateRange) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(end.getFullYear() - 1);
                break;
            case '30d':
            default:
                start.setDate(end.getDate() - 30);
        }
        return { start, end };
    }
    async getAnalytics(tenantId, dateRange = '30d', workflowId) {
        const { start, end } = this.parseDateRange(dateRange);
        const workflowWhere = { tenantId };
        if (workflowId)
            workflowWhere.id = workflowId;
        const workflows = await this.workflowRepo.find({ where: workflowWhere });
        const workflowIds = workflows.map((w) => w.id);
        const execQb = this.executionRepo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.workflow', 'workflow')
            .where('e.tenantId = :tenantId', { tenantId })
            .andWhere('e.createdAt BETWEEN :start AND :end', { start, end });
        if (workflowId) {
            execQb.andWhere('e.workflowId = :workflowId', { workflowId });
        }
        else if (workflowIds.length > 0) {
            execQb.andWhere('e.workflowId IN (:...workflowIds)', { workflowIds });
        }
        const executions = await execQb.getMany();
        const totalWorkflows = workflows.length;
        const activeWorkflows = workflows.filter((w) => w.status === workflow_entity_1.WorkflowStatus.ACTIVE).length;
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter((e) => e.status === workflow_execution_entity_1.ExecutionStatus.COMPLETED).length;
        const failedExecutions = executions.filter((e) => e.status === workflow_execution_entity_1.ExecutionStatus.FAILED ||
            e.status === workflow_execution_entity_1.ExecutionStatus.CANCELLED ||
            e.status === workflow_execution_entity_1.ExecutionStatus.REJECTED).length;
        const completedWithTimes = executions.filter((e) => e.completedAt && e.startedAt);
        const averageExecutionTime = completedWithTimes.length > 0
            ? completedWithTimes.reduce((sum, e) => {
                return (sum +
                    (new Date(e.completedAt).getTime() -
                        new Date(e.startedAt).getTime()));
            }, 0) / completedWithTimes.length
            : 0;
        const statusCounts = new Map();
        for (const e of executions) {
            statusCounts.set(e.status, (statusCounts.get(e.status) || 0) + 1);
        }
        const executionsByStatus = [...statusCounts.entries()].map(([status, count]) => ({
            status,
            count,
            percentage: totalExecutions > 0
                ? Math.round((count / totalExecutions) * 1000) / 10
                : 0,
        }));
        const byWorkflow = new Map();
        for (const e of executions) {
            const name = e.workflow?.name || 'Unknown';
            const key = e.workflowId || name;
            const row = byWorkflow.get(key) || {
                name,
                total: 0,
                success: 0,
                times: [],
            };
            row.total++;
            if (e.status === workflow_execution_entity_1.ExecutionStatus.COMPLETED)
                row.success++;
            if (e.completedAt && e.startedAt) {
                row.times.push(new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime());
            }
            byWorkflow.set(key, row);
        }
        const executionsByWorkflow = [...byWorkflow.values()].map((row) => ({
            workflowName: row.name,
            executions: row.total,
            successRate: row.total > 0 ? Math.round((row.success / row.total) * 1000) / 10 : 0,
            avgTime: row.times.length > 0
                ? Math.round(row.times.reduce((a, b) => a + b, 0) / row.times.length)
                : 0,
        }));
        const dayMap = new Map();
        for (const e of executions) {
            const day = e.createdAt.toISOString().slice(0, 10);
            const row = dayMap.get(day) || { count: 0, success: 0 };
            row.count++;
            if (e.status === workflow_execution_entity_1.ExecutionStatus.COMPLETED)
                row.success++;
            dayMap.set(day, row);
        }
        const executionsOverTime = [...dayMap.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, row]) => ({
            date,
            count: row.count,
            successRate: row.count > 0
                ? Math.round((row.success / row.count) * 1000) / 10
                : 0,
        }));
        const topPerformers = [...executionsByWorkflow]
            .sort((a, b) => b.successRate - a.successRate || b.executions - a.executions)
            .slice(0, 5);
        const stepWait = new Map();
        for (const e of executions) {
            const wfName = e.workflow?.name || 'Unknown';
            for (const sr of e.stepResults || []) {
                if (!sr.stepName)
                    continue;
                const key = `${wfName}::${sr.stepName}`;
                const row = stepWait.get(key) || {
                    workflowName: wfName,
                    stepName: sr.stepName,
                    waits: 0,
                    fails: 0,
                };
                if (sr.status === 'waiting_for_approval' ||
                    sr.status === 'waiting_for_task') {
                    row.waits += 1;
                }
                if (sr.status === 'failed')
                    row.fails++;
                stepWait.set(key, row);
            }
        }
        const bottlenecks = [...stepWait.values()]
            .map((row) => ({
            workflowName: row.workflowName,
            stepName: row.stepName,
            avgTime: row.waits * 3600000,
            failureRate: row.waits > 0
                ? Math.round((row.fails / row.waits) * 1000) / 10
                : 0,
        }))
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, 8);
        const tasks = await this.taskRepo.find({
            where: {
                tenantId,
                status: task_entity_1.TaskStatus.COMPLETED,
                completedAt: (0, typeorm_2.Between)(start, end),
            },
            relations: ['claimedBy'],
        });
        const roles = await this.roleRepo
            .createQueryBuilder('role')
            .innerJoin('role.tenant', 'tenant')
            .where('tenant.id = :tenantId', { tenantId })
            .getMany();
        const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
        const roleStats = new Map();
        for (const t of tasks) {
            const roleId = t.assignedToRoleId || 'unassigned';
            const row = roleStats.get(roleId) || {
                completed: 0,
                times: [],
                assigned: 0,
            };
            row.assigned++;
            row.completed++;
            if (t.claimedAt && t.completedAt) {
                row.times.push(new Date(t.completedAt).getTime() - new Date(t.claimedAt).getTime());
            }
            roleStats.set(roleId, row);
        }
        const rolePerformance = [...roleStats.entries()].map(([roleId, row]) => ({
            roleName: roleNameById.get(roleId) || 'Unassigned',
            tasksCompleted: row.completed,
            avgCompletionTime: row.times.length > 0
                ? Math.round(row.times.reduce((a, b) => a + b, 0) / row.times.length)
                : 0,
            completionRate: 100,
        }));
        return {
            totalWorkflows,
            activeWorkflows,
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            averageExecutionTime: Math.round(averageExecutionTime),
            executionsByStatus,
            executionsByWorkflow,
            executionsOverTime,
            topPerformers,
            bottlenecks,
            rolePerformance,
        };
    }
    async exportCsv(tenantId, dateRange = '30d', workflowId) {
        const data = await this.getAnalytics(tenantId, dateRange, workflowId);
        const lines = [
            'SuperERP Workflow Analytics',
            `Date range,${dateRange}`,
            `Generated,${new Date().toISOString()}`,
            '',
            'Summary',
            `Total workflows,${data.totalWorkflows}`,
            `Active workflows,${data.activeWorkflows}`,
            `Total executions,${data.totalExecutions}`,
            `Successful,${data.successfulExecutions}`,
            `Failed/Cancelled,${data.failedExecutions}`,
            `Avg execution time (ms),${data.averageExecutionTime}`,
            '',
            'Executions by status',
            'Status,Count,Percentage',
            ...data.executionsByStatus.map((r) => `${r.status},${r.count},${r.percentage}`),
            '',
            'Executions by workflow',
            'Workflow,Executions,Success rate,Avg time ms',
            ...data.executionsByWorkflow.map((r) => `"${r.workflowName}",${r.executions},${r.successRate},${r.avgTime}`),
            '',
            'Role performance',
            'Role,Tasks completed,Avg completion ms',
            ...data.rolePerformance.map((r) => `"${r.roleName}",${r.tasksCompleted},${r.avgCompletionTime}`),
        ];
        return lines.join('\n');
    }
};
exports.WorkflowAnalyticsService = WorkflowAnalyticsService;
exports.WorkflowAnalyticsService = WorkflowAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_execution_entity_1.WorkflowExecution)),
    __param(1, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __param(2, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(3, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowAnalyticsService);
//# sourceMappingURL=workflow-analytics.service.js.map