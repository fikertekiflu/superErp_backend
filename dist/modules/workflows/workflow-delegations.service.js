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
exports.WorkflowDelegationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workflow_delegation_entity_1 = require("./workflow-delegation.entity");
const user_entity_1 = require("../users/user.entity");
let WorkflowDelegationsService = class WorkflowDelegationsService {
    delegationRepo;
    userRepo;
    constructor(delegationRepo, userRepo) {
        this.delegationRepo = delegationRepo;
        this.userRepo = userRepo;
    }
    async create(tenantId, delegatorUserId, body) {
        if (body.delegateUserId === delegatorUserId) {
            throw new common_1.BadRequestException('Cannot delegate to yourself');
        }
        const startsAt = new Date(body.startsAt);
        const endsAt = new Date(body.endsAt);
        if (endsAt <= startsAt) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const delegate = await this.userRepo.findOne({
            where: { id: body.delegateUserId, tenantId },
        });
        if (!delegate)
            throw new common_1.NotFoundException('Delegate user not found');
        const delegator = await this.userRepo.findOne({
            where: { id: delegatorUserId, tenantId },
            relations: ['roles'],
        });
        if (!delegator)
            throw new common_1.NotFoundException('Delegator not found');
        if (body.roleIds?.length) {
            const delegatorRoleIds = new Set(delegator.roles?.map((r) => r.id) || []);
            for (const rid of body.roleIds) {
                if (!delegatorRoleIds.has(rid)) {
                    throw new common_1.BadRequestException('You can only delegate roles assigned to you');
                }
            }
        }
        const delegation = this.delegationRepo.create({
            tenantId,
            delegatorUserId,
            delegateUserId: body.delegateUserId,
            roleIds: body.roleIds?.length ? body.roleIds : [],
            startsAt,
            endsAt,
            reason: body.reason,
            isActive: true,
        });
        return this.delegationRepo.save(delegation);
    }
    async listForUser(tenantId, userId) {
        const [granted, received] = await Promise.all([
            this.delegationRepo.find({
                where: { tenantId, delegatorUserId: userId },
                relations: ['delegate', 'delegator'],
                order: { createdAt: 'DESC' },
            }),
            this.delegationRepo.find({
                where: { tenantId, delegateUserId: userId },
                relations: ['delegate', 'delegator'],
                order: { createdAt: 'DESC' },
            }),
        ]);
        return { granted, received };
    }
    async revoke(id, tenantId, userId) {
        const delegation = await this.delegationRepo.findOne({
            where: { id, tenantId },
        });
        if (!delegation)
            throw new common_1.NotFoundException('Delegation not found');
        if (delegation.delegatorUserId !== userId) {
            throw new common_1.ForbiddenException('Only the delegator can revoke');
        }
        delegation.isActive = false;
        return this.delegationRepo.save(delegation);
    }
    async getActiveDelegateRoleIds(tenantId, delegateUserId) {
        const now = new Date();
        const delegations = await this.delegationRepo.find({
            where: {
                tenantId,
                delegateUserId,
                isActive: true,
                startsAt: (0, typeorm_2.LessThanOrEqual)(now),
                endsAt: (0, typeorm_2.MoreThanOrEqual)(now),
            },
            relations: ['delegator', 'delegator.roles'],
        });
        const roleIds = new Set();
        for (const d of delegations) {
            if (d.roleIds?.length) {
                d.roleIds.forEach((id) => roleIds.add(id));
            }
            else {
                for (const r of d.delegator?.roles || []) {
                    roleIds.add(r.id);
                }
            }
        }
        return [...roleIds];
    }
    async canActOnRole(tenantId, userId, assignedToRoleId, userRoleIds) {
        if (!assignedToRoleId) {
            return { allowed: false, viaDelegation: false };
        }
        if (userRoleIds.includes(assignedToRoleId)) {
            return { allowed: true, viaDelegation: false };
        }
        const delegatedRoleIds = await this.getActiveDelegateRoleIds(tenantId, userId);
        if (delegatedRoleIds.includes(assignedToRoleId)) {
            return { allowed: true, viaDelegation: true };
        }
        return { allowed: false, viaDelegation: false };
    }
};
exports.WorkflowDelegationsService = WorkflowDelegationsService;
exports.WorkflowDelegationsService = WorkflowDelegationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workflow_delegation_entity_1.WorkflowDelegation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowDelegationsService);
//# sourceMappingURL=workflow-delegations.service.js.map