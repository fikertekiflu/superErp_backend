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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const tenants_service_1 = require("./tenants.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const update_tenant_settings_dto_1 = require("./dto/update-tenant-settings.dto");
const submit_verification_dto_1 = require("./dto/submit-verification.dto");
const verification_document_types_1 = require("./verification-document.types");
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async create(createTenantDto, req) {
        return this.tenantsService.create(createTenantDto, req.user.userId);
    }
    async findAll() {
        return this.tenantsService.findAll();
    }
    async findMyTenant(req) {
        return this.tenantsService.findByUserId(req.user.userId);
    }
    async onboard(setupData, req) {
        return this.tenantsService.completeOnboarding(req.user.tenantId, req.user.userId, setupData);
    }
    async findMe(req) {
        return this.tenantsService.findOne(req.user.tenantId);
    }
    async updateMe(dto, req) {
        const tenant = await this.tenantsService.updateMySettings(req.user.tenantId, dto);
        return tenant;
    }
    async submitVerification(files, body, req) {
        return this.tenantsService.submitVerificationApplication(req.user.tenantId, {
            legalBusinessName: body.legalBusinessName,
            tinNumber: body.tinNumber,
            businessRegistrationNumber: body.businessRegistrationNumber,
            businessPhone: body.businessPhone,
            businessAddress: body.businessAddress,
        }, files);
    }
    async getVerificationFile(tenantId, documentId, req, res) {
        await this.tenantsService.streamVerificationFile(tenantId, documentId, req.user, res);
    }
    async submitDocuments(body, req) {
        return this.tenantsService.submitDocuments(req.user.tenantId, body.documents);
    }
    async findPending() {
        return this.tenantsService.findPending();
    }
    async approveTenant(id, req) {
        return this.tenantsService.approveTenant(id, req.user.userId);
    }
    async rejectTenant(id, req, body) {
        return this.tenantsService.rejectTenant(id, req.user.userId, body.reason);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant (company)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tenants (super admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findMyTenant", null);
__decorate([
    (0, common_1.Post)('onboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete tenant onboarding' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "onboard", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current workspace details' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current workspace settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_tenant_settings_dto_1.UpdateTenantSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('submit-verification'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)(verification_document_types_1.VERIFICATION_FILE_FIELDS.map((f) => ({ name: f.field, maxCount: 1 })), {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit verification application with PDF/image uploads',
    }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submit_verification_dto_1.SubmitVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "submitVerification", null);
__decorate([
    (0, common_1.Get)(':tenantId/verification-files/:documentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream a verification document (PDF/image)' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getVerificationFile", null);
__decorate([
    (0, common_1.Patch)('submit-documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit verification documents (legacy URLs)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "submitDocuments", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending verification tenants (super admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findPending", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a tenant (super admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "approveTenant", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a tenant (super admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "rejectTenant", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map