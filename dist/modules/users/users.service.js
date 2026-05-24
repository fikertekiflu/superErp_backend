"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./user.entity");
const role_entity_1 = require("../roles/role.entity");
let UsersService = class UsersService {
    userRepository;
    roleRepository;
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async findOne(id) {
        return this.userRepository.findOne({ where: { id }, relations: ['roles'] });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email }, relations: ['roles'] });
    }
    async update(id, updateData) {
        await this.userRepository.update(id, updateData);
    }
    async updateProfile(userId, data) {
        const user = await this.findOne(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const patch = {};
        if (data.firstName !== undefined)
            patch.firstName = data.firstName.trim();
        if (data.lastName !== undefined)
            patch.lastName = data.lastName.trim();
        if (data.phone !== undefined) {
            patch.phone = data.phone.trim() ? data.phone.trim() : undefined;
        }
        await this.userRepository.update(userId, patch);
        const updated = await this.findOne(userId);
        if (!updated)
            throw new common_1.NotFoundException('User not found');
        return updated;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.findOne(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        if (currentPassword === newPassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(userId, { password: hashed });
    }
    sanitizeUser(user) {
        const { password: _pw, ...safe } = user;
        return safe;
    }
    async updateUserApprovalLimit(userId, tenantId, approvalLimitOverride) {
        const user = await this.userRepository.findOne({
            where: { id: userId, tenantId },
            relations: ['roles'],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await this.userRepository.update(userId, {
            approvalLimitOverride: approvalLimitOverride === undefined ? null : approvalLimitOverride,
        });
        return this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });
    }
    async getTenantRoles(tenantId) {
        return this.roleRepository.find({
            where: { tenant: { id: tenantId }, isActive: true },
            order: { name: 'ASC' },
        });
    }
    async createTenantRole(tenantId, data) {
        const role = this.roleRepository.create({
            name: data.name,
            description: data.description,
            entityPermissions: data.entityPermissions || [],
            tenant: { id: tenantId },
            isActive: true,
        });
        return this.roleRepository.save(role);
    }
    async updateTenantRole(roleId, tenantId, data) {
        const role = await this.roleRepository.findOne({ where: { id: roleId, tenant: { id: tenantId } } });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        await this.roleRepository.update(roleId, data);
        return this.roleRepository.findOne({ where: { id: roleId } });
    }
    async deleteTenantRole(roleId, tenantId) {
        const role = await this.roleRepository.findOne({ where: { id: roleId, tenant: { id: tenantId } } });
        if (role) {
            await this.roleRepository.update(roleId, { isActive: false });
        }
    }
    async assignRoleToUser(userId, roleId, tenantId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, tenantId },
            relations: ['roles']
        });
        const role = await this.roleRepository.findOne({
            where: { id: roleId, tenant: { id: tenantId } }
        });
        if (!user || !role)
            throw new common_1.NotFoundException('User or role not found');
        user.roles = [...(user.roles || []), role];
        await this.userRepository.save(user);
    }
    async removeRoleFromUser(userId, roleId, tenantId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, tenantId },
            relations: ['roles']
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.roles = user.roles?.filter(role => role.id !== roleId) || [];
        await this.userRepository.save(user);
    }
    async getTenantUsers(tenantId) {
        return this.userRepository.find({
            where: { tenantId },
            relations: ['roles'],
            order: { createdAt: 'DESC' },
        });
    }
    async createTenantUser(tenantId, data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.userRepository.create({
            ...data,
            password: hashedPassword,
            tenantId,
            status: user_entity_1.UserStatus.ACTIVE,
            isActive: true,
        });
        const saved = await this.userRepository.save(user);
        if (data.roleIds && data.roleIds.length > 0) {
            for (const roleId of data.roleIds) {
                await this.assignRoleToUser(saved.id, roleId, tenantId);
            }
        }
        return this.findOne(saved.id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map