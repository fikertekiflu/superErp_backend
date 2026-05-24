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
exports.AuditLogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const audit_logs_service_1 = require("./audit-logs.service");
const common_2 = require("@nestjs/common");
const user_entity_1 = require("../users/user.entity");
let AuditLogsController = class AuditLogsController {
    auditLogsService;
    constructor(auditLogsService) {
        this.auditLogsService = auditLogsService;
    }
    async findPlatform(limit) {
        return this.auditLogsService.findAllPlatform(limit ? parseInt(limit, 10) : 200);
    }
    async findAll(req, limit, resourceType) {
        const { tenantId, role, userId } = req.user;
        if (!tenantId) {
            throw new common_2.ForbiddenException('Tenant context required');
        }
        const isAdmin = role === user_entity_1.UserRole.TENANT_ADMIN || role === user_entity_1.UserRole.SUPER_ADMIN;
        if (!isAdmin) {
            throw new common_2.ForbiddenException('Only tenant administrators can view audit logs');
        }
        return this.auditLogsService.findForTenant(tenantId, {
            limit: limit ? parseInt(limit, 10) : 100,
            resourceType,
        });
    }
};
exports.AuditLogsController = AuditLogsController;
__decorate([
    (0, common_1.Get)('platform'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Platform-wide audit logs (super admin)' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "findPlatform", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs for current tenant' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'resourceType', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('resourceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AuditLogsController.prototype, "findAll", null);
exports.AuditLogsController = AuditLogsController = __decorate([
    (0, swagger_1.ApiTags)('audit-logs'),
    (0, common_1.Controller)('audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [audit_logs_service_1.AuditLogsService])
], AuditLogsController);
//# sourceMappingURL=audit-logs.controller.js.map