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
exports.WorkflowExecutionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const workflow_execution_service_1 = require("./workflow-execution.service");
let WorkflowExecutionsController = class WorkflowExecutionsController {
    executionService;
    constructor(executionService) {
        this.executionService = executionService;
    }
    async getExecutions(req) {
        return this.executionService.getExecutions(req.user.tenantId);
    }
    async getExecution(id) {
        return this.executionService.getExecution(id);
    }
    async triggerWorkflow(workflowId, body, req) {
        return this.executionService.triggerWorkflow(workflowId, req.user.userId, req.user.tenantId, {
            ...body,
            triggerType: 'manual',
        });
    }
    async approveWorkflow(executionId, body, req) {
        return this.executionService.handleApproval(executionId, body.taskId, req.user.userId, 'approve', body.notes);
    }
    async rejectWorkflow(executionId, body, req) {
        return this.executionService.handleApproval(executionId, body.taskId, req.user.userId, 'reject', body.notes || body.reason);
    }
    async getExecutionEvents(id, req) {
        return this.executionService.getExecutionEvents(id, req.user.tenantId);
    }
    async getExecutionWithHistory(id) {
        return this.executionService.getExecution(id);
    }
    async executeTransition(id, transitionId, body, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.executionService.executeTransition(id, transitionId, userId, tenantId, body.notes);
    }
};
exports.WorkflowExecutionsController = WorkflowExecutionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workflow executions for tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "getExecutions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow execution by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "getExecution", null);
__decorate([
    (0, common_1.Post)('trigger/:workflowId'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger a workflow execution' }),
    __param(0, (0, common_1.Param)('workflowId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "triggerWorkflow", null);
__decorate([
    (0, common_1.Post)(':executionId/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a workflow approval step' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "approveWorkflow", null);
__decorate([
    (0, common_1.Post)(':executionId/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a workflow approval step' }),
    __param(0, (0, common_1.Param)('executionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "rejectWorkflow", null);
__decorate([
    (0, common_1.Get)(':id/events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow execution audit events' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "getExecutionEvents", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow execution with full history and events' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "getExecutionWithHistory", null);
__decorate([
    (0, common_1.Post)(':id/transitions/:transitionId/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a workflow transition' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('transitionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowExecutionsController.prototype, "executeTransition", null);
exports.WorkflowExecutionsController = WorkflowExecutionsController = __decorate([
    (0, swagger_1.ApiTags)('Workflow Executions'),
    (0, common_1.Controller)('workflow-executions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [workflow_execution_service_1.WorkflowExecutionService])
], WorkflowExecutionsController);
//# sourceMappingURL=workflow-executions.controller.js.map