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
exports.WorkflowApprovalLimitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const role_entity_1 = require("../roles/role.entity");
const workflow_branching_util_1 = require("./workflow-branching.util");
let WorkflowApprovalLimitsService = class WorkflowApprovalLimitsService {
    userRepo;
    roleRepo;
    constructor(userRepo, roleRepo) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }
    async getEffectiveLimit(userId, tenantId, assignedToRoleId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenantId },
            relations: ['roles'],
        });
        if (!user)
            return null;
        if (user.role === user_entity_1.UserRole.TENANT_ADMIN || user.role === user_entity_1.UserRole.SUPER_ADMIN) {
            return null;
        }
        if (user.approvalLimitOverride != null &&
            !Number.isNaN(Number(user.approvalLimitOverride))) {
            return Number(user.approvalLimitOverride);
        }
        const roleIds = new Set();
        if (assignedToRoleId)
            roleIds.add(assignedToRoleId);
        for (const r of user.roles || []) {
            roleIds.add(r.id);
        }
        if (roleIds.size === 0)
            return null;
        const roles = await this.roleRepo.find({
            where: { id: (0, typeorm_2.In)([...roleIds]) },
        });
        const limits = roles
            .map((r) => r.maxApprovalAmount)
            .filter((v) => v != null && !Number.isNaN(Number(v)))
            .map(Number);
        if (limits.length === 0)
            return null;
        return Math.min(...limits);
    }
    async assertCanApproveAmount(userId, tenantId, execution, assignedToRoleId, amountField = 'amount') {
        const limit = await this.getEffectiveLimit(userId, tenantId, assignedToRoleId);
        if (limit == null)
            return;
        const entityData = (execution.context?.entityData || {});
        const raw = (0, workflow_branching_util_1.resolveEntityFieldValue)(entityData, amountField);
        const amount = Number(raw);
        if (Number.isNaN(amount))
            return;
        if (amount > limit) {
            throw new common_1.BadRequestException(`Approval limit exceeded: amount ${amount} is above your limit of ${limit}. Escalate to a user with a higher limit.`);
        }
    }
};
exports.WorkflowApprovalLimitsService = WorkflowApprovalLimitsService;
exports.WorkflowApprovalLimitsService = WorkflowApprovalLimitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowApprovalLimitsService);
//# sourceMappingURL=workflow-approval-limits.service.js.map