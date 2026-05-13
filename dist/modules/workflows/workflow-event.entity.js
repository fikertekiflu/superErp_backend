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
exports.WorkflowEvent = exports.EventType = void 0;
const typeorm_1 = require("typeorm");
const workflow_execution_entity_1 = require("./workflow-execution.entity");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
var EventType;
(function (EventType) {
    EventType["TRIGGERED"] = "triggered";
    EventType["STATE_CHANGED"] = "state_changed";
    EventType["TASK_CREATED"] = "task_created";
    EventType["TASK_CLAIMED"] = "task_claimed";
    EventType["TASK_COMPLETED"] = "task_completed";
    EventType["APPROVAL_REQUESTED"] = "approval_requested";
    EventType["APPROVED"] = "approved";
    EventType["REJECTED"] = "rejected";
    EventType["STEP_EXECUTED"] = "step_executed";
    EventType["COMPLETED"] = "completed";
    EventType["CANCELLED"] = "cancelled";
    EventType["ESCALATED"] = "escalated";
})(EventType || (exports.EventType = EventType = {}));
let WorkflowEvent = class WorkflowEvent {
    id;
    execution;
    executionId;
    tenant;
    tenantId;
    actor;
    actorId;
    eventType;
    fromState;
    toState;
    stepId;
    stepName;
    taskId;
    metadata;
    notes;
    createdAt;
};
exports.WorkflowEvent = WorkflowEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_execution_entity_1.WorkflowExecution),
    (0, typeorm_1.JoinColumn)({ name: 'executionId' }),
    __metadata("design:type", workflow_execution_entity_1.WorkflowExecution)
], WorkflowEvent.prototype, "execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenantId' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], WorkflowEvent.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'actorId' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowEvent.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "fromState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "toState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "stepId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "stepName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkflowEvent.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowEvent.prototype, "createdAt", void 0);
exports.WorkflowEvent = WorkflowEvent = __decorate([
    (0, typeorm_1.Entity)('workflow_events')
], WorkflowEvent);
//# sourceMappingURL=workflow-event.entity.js.map