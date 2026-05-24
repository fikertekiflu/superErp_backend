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
exports.AdminWorkflowCatalogController = exports.WorkflowCatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const workflow_catalog_service_1 = require("./workflow-catalog.service");
let WorkflowCatalogController = class WorkflowCatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    listPublished(req) {
        return this.catalogService.listPublishedForTenant(req.user.tenantId);
    }
    getOne(catalogKey) {
        return this.catalogService.getPublishedByKey(catalogKey);
    }
};
exports.WorkflowCatalogController = WorkflowCatalogController;
__decorate([
    (0, common_1.Get)('published'),
    (0, swagger_1.ApiOperation)({
        summary: 'List published workflow templates (tenant deploy catalog)',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkflowCatalogController.prototype, "listPublished", null);
__decorate([
    (0, common_1.Get)('published/:catalogKey'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one published template definition' }),
    __param(0, (0, common_1.Param)('catalogKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowCatalogController.prototype, "getOne", null);
exports.WorkflowCatalogController = WorkflowCatalogController = __decorate([
    (0, swagger_1.ApiTags)('Workflow Catalog'),
    (0, common_1.Controller)('workflows/catalog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [workflow_catalog_service_1.WorkflowCatalogService])
], WorkflowCatalogController);
let AdminWorkflowCatalogController = class AdminWorkflowCatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    listAll() {
        return this.catalogService.listAllForAdmin();
    }
    sync() {
        return this.catalogService.syncLibraryFromDefinitions(false);
    }
    publish(catalogKey) {
        return this.catalogService.publish(catalogKey);
    }
    unpublish(catalogKey) {
        return this.catalogService.unpublish(catalogKey);
    }
};
exports.AdminWorkflowCatalogController = AdminWorkflowCatalogController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all catalog templates (super admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminWorkflowCatalogController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync template library from platform definitions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminWorkflowCatalogController.prototype, "sync", null);
__decorate([
    (0, common_1.Patch)(':catalogKey/publish'),
    __param(0, (0, common_1.Param)('catalogKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminWorkflowCatalogController.prototype, "publish", null);
__decorate([
    (0, common_1.Patch)(':catalogKey/unpublish'),
    __param(0, (0, common_1.Param)('catalogKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminWorkflowCatalogController.prototype, "unpublish", null);
exports.AdminWorkflowCatalogController = AdminWorkflowCatalogController = __decorate([
    (0, swagger_1.ApiTags)('Admin Workflow Templates'),
    (0, common_1.Controller)('admin/workflow-templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [workflow_catalog_service_1.WorkflowCatalogService])
], AdminWorkflowCatalogController);
//# sourceMappingURL=workflow-catalog.controller.js.map