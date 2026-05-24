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
exports.AuditLog = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
var AuditAction;
(function (AuditAction) {
    AuditAction["ENTITY_CREATED"] = "entity_created";
    AuditAction["ENTITY_UPDATED"] = "entity_updated";
    AuditAction["ENTITY_DELETED"] = "entity_deleted";
    AuditAction["ENTITY_DATA_CREATED"] = "entity_data_created";
    AuditAction["ENTITY_DATA_UPDATED"] = "entity_data_updated";
    AuditAction["ENTITY_DATA_DELETED"] = "entity_data_deleted";
    AuditAction["ROLE_CREATED"] = "role_created";
    AuditAction["ROLE_UPDATED"] = "role_updated";
    AuditAction["ROLE_DELETED"] = "role_deleted";
    AuditAction["ROLE_PERMISSIONS_UPDATED"] = "role_permissions_updated";
    AuditAction["USER_CREATED"] = "user_created";
    AuditAction["TENANT_APPROVED"] = "tenant_approved";
    AuditAction["TENANT_REJECTED"] = "tenant_rejected";
    AuditAction["WORKFLOW_TRANSITION"] = "workflow_transition";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLog = class AuditLog {
    id;
    tenantId;
    actorId;
    action;
    resourceType;
    resourceId;
    resourceName;
    metadata;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditAction }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "resourceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['tenantId', 'createdAt'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map