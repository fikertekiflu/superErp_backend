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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const role_entity_1 = require("../roles/role.entity");
let UsersController = class UsersController {
    usersService;
    userRepo;
    roleRepo;
    constructor(usersService, userRepo, roleRepo) {
        this.usersService = usersService;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }
    async getTenantUsers(req) {
        return this.usersService.getTenantUsers(req.user.tenantId);
    }
    async getCurrentUser(req) {
        return this.usersService.findOne(req.user.userId);
    }
    async getTenantRoles(req) {
        return this.usersService.getTenantRoles(req.user.tenantId);
    }
    async createTenantRole(req, body) {
        return this.usersService.createTenantRole(req.user.tenantId, body);
    }
    async assignRoleToUser(req, roleId, userId) {
        await this.usersService.assignRoleToUser(userId, roleId, req.user.tenantId);
        return { message: 'Role assigned successfully' };
    }
    async removeRoleFromUser(req, roleId, userId) {
        await this.usersService.removeRoleFromUser(userId, roleId, req.user.tenantId);
        return { message: 'Role removed successfully' };
    }
    async createTenantUser(req, body) {
        return this.usersService.createTenantUser(req.user.tenantId, body);
    }
    async getUsersByRole(req, roleId) {
        return this.userRepo
            .createQueryBuilder('user')
            .leftJoin('user.roles', 'role')
            .where('user.tenantId = :tenantId', { tenantId: req.user.tenantId })
            .andWhere('role.id = :roleId', { roleId })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
            .orderBy('user.firstName', 'ASC')
            .getMany();
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users for current tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getTenantUsers", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user info' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all roles for current tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getTenantRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant role' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createTenantRole", null);
__decorate([
    (0, common_1.Post)('roles/:roleId/assign/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign role to user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "assignRoleToUser", null);
__decorate([
    (0, common_1.Delete)('roles/:roleId/remove/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove role from user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeRoleFromUser", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createTenantUser", null);
__decorate([
    (0, common_1.Get)('by-role/:roleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get users assigned to a specific role' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUsersByRole", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersController);
//# sourceMappingURL=users.controller.js.map