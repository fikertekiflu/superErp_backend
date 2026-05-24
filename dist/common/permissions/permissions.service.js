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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../modules/users/user.entity");
const role_entity_1 = require("../../modules/roles/role.entity");
const FULL = {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
};
const NONE = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
};
let PermissionsService = class PermissionsService {
    userRepository;
    roleRepository;
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    isTenantAdmin(systemRole) {
        return systemRole === user_entity_1.UserRole.TENANT_ADMIN;
    }
    isSuperAdmin(systemRole) {
        return systemRole === user_entity_1.UserRole.SUPER_ADMIN;
    }
    async getSnapshot(userId, tenantId, systemRole) {
        if (this.isSuperAdmin(systemRole)) {
            return {
                systemRole,
                canManageSchemas: true,
                isFullAccess: true,
                byEntity: {},
            };
        }
        if (this.isTenantAdmin(systemRole)) {
            return {
                systemRole,
                canManageSchemas: true,
                isFullAccess: true,
                byEntity: {},
            };
        }
        const user = await this.userRepository.findOne({
            where: { id: userId, tenantId },
            relations: ['roles'],
        });
        const byEntity = {};
        for (const role of user?.roles || []) {
            const grants = role.entityPermissions || [];
            for (const grant of grants) {
                const current = byEntity[grant.entityId] || { ...NONE };
                byEntity[grant.entityId] = {
                    canCreate: current.canCreate || grant.canCreate,
                    canRead: current.canRead || grant.canRead,
                    canUpdate: current.canUpdate || grant.canUpdate,
                    canDelete: current.canDelete || grant.canDelete,
                };
            }
        }
        return {
            systemRole,
            canManageSchemas: false,
            isFullAccess: false,
            byEntity,
        };
    }
    async assertCanManageSchemas(userId, tenantId, systemRole) {
        const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
        if (!snapshot.canManageSchemas) {
            throw new common_1.ForbiddenException('Only tenant administrators can manage entity definitions');
        }
    }
    async assertEntityAction(userId, tenantId, systemRole, entityId, action) {
        const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
        if (snapshot.isFullAccess)
            return;
        const perms = snapshot.byEntity[entityId] || NONE;
        const allowed = action === 'create'
            ? perms.canCreate
            : action === 'read'
                ? perms.canRead
                : action === 'update'
                    ? perms.canUpdate
                    : perms.canDelete;
        if (!allowed) {
            throw new common_1.ForbiddenException(`You do not have permission to ${action} records for this entity`);
        }
    }
    async filterReadableEntityIds(userId, tenantId, systemRole, entityIds) {
        const snapshot = await this.getSnapshot(userId, tenantId, systemRole);
        if (snapshot.isFullAccess)
            return entityIds;
        return entityIds.filter((id) => snapshot.byEntity[id]?.canRead);
    }
    mergeGrant(existing, grant) {
        const idx = existing.findIndex((g) => g.entityId === grant.entityId);
        if (idx === -1)
            return [...existing, grant];
        const next = [...existing];
        next[idx] = grant;
        return next;
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map