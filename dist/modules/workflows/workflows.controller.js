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
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const workflows_service_1 = require("./workflows.service");
const create_workflow_dto_1 = require("./dto/create-workflow.dto");
const update_workflow_dto_1 = require("./dto/update-workflow.dto");
let WorkflowsController = class WorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    async create(createWorkflowDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.create(createWorkflowDto, userId, tenantId);
    }
    async findAll(req, status) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.findAll(tenantId);
    }
    async update(id, updateWorkflowDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.update(id, updateWorkflowDto, userId, tenantId);
    }
    async remove(id, req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.remove(id, tenantId);
    }
    async activate(id, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.activate(id, userId, tenantId);
    }
    async deactivate(id, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.deactivate(id, userId, tenantId);
    }
    async duplicate(id, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.duplicate(id, userId, tenantId);
    }
    async startWorkflow(id, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.workflowsService.startWorkflow(id, userId, tenantId);
    }
    async getStats(req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.getWorkflowStats(tenantId);
    }
    async getWorkflowEntities(id, req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.getWorkflowEntities(id, tenantId);
    }
    async addStep(id, stepData, req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.addStep(id, stepData, tenantId);
    }
    async updateStep(stepId, stepData, req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.updateStep(stepId, stepData, tenantId);
    }
    async removeStep(stepId, req) {
        const tenantId = req.user.tenantId;
        return this.workflowsService.removeStep(stepId, tenantId);
    }
    async findOne(id, req) {
        return this.workflowsService.findOne(id, req.user.tenantId);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new workflow' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workflow created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_workflow_dto_1.CreateWorkflowDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workflows' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflows retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update workflow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_workflow_dto_1.UpdateWorkflowDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete workflow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Activate workflow' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow activated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate workflow' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workflow deactivated successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Duplicate workflow' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workflow duplicated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Start workflow execution' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow started successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "startWorkflow", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workflow statistics retrieved successfully',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id/entities'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entities assigned to workflow' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Workflow entities retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflowEntities", null);
__decorate([
    (0, common_1.Post)(':id/steps'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a step to a workflow' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "addStep", null);
__decorate([
    (0, common_1.Patch)('steps/:stepId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a workflow step' }),
    __param(0, (0, common_1.Param)('stepId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "updateStep", null);
__decorate([
    (0, common_1.Delete)('steps/:stepId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a workflow step' }),
    __param(0, (0, common_1.Param)('stepId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "removeStep", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Workflow ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get workflow by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workflow retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Workflow not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findOne", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, swagger_1.ApiTags)('Workflows'),
    (0, common_1.Controller)('workflows'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map