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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDelegation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
let WorkflowDelegation = class WorkflowDelegation {
    id;
    tenantId;
    tenant;
    delegatorUserId;
    delegator;
    delegateUserId;
    delegate;
    roleIds;
    startsAt;
    endsAt;
    isActive;
    reason;
    createdAt;
    updatedAt;
};
exports.WorkflowDelegation = WorkflowDelegation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowDelegation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowDelegation.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenantId' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], WorkflowDelegation.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowDelegation.prototype, "delegatorUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'delegatorUserId' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowDelegation.prototype, "delegator", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowDelegation.prototype, "delegateUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'delegateUserId' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowDelegation.prototype, "delegate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], WorkflowDelegation.prototype, "roleIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WorkflowDelegation.prototype, "startsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], WorkflowDelegation.prototype, "endsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], WorkflowDelegation.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkflowDelegation.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowDelegation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowDelegation.prototype, "updatedAt", void 0);
exports.WorkflowDelegation = WorkflowDelegation = __decorate([
    (0, typeorm_1.Entity)('workflow_delegations')
], WorkflowDelegation);
//# sourceMappingURL=workflow-delegation.entity.js.map