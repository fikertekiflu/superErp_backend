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
exports.WorkflowExecution = exports.WorkflowState = exports.ExecutionStatus = void 0;
const typeorm_1 = require("typeorm");
const workflow_entity_1 = require("./workflow.entity");
const user_entity_1 = require("../users/user.entity");
const tenant_entity_1 = require("../tenants/tenant.entity");
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["PENDING"] = "pending";
    ExecutionStatus["RUNNING"] = "running";
    ExecutionStatus["COMPLETED"] = "completed";
    ExecutionStatus["FAILED"] = "failed";
    ExecutionStatus["PAUSED"] = "paused";
    ExecutionStatus["CANCELLED"] = "cancelled";
    ExecutionStatus["REJECTED"] = "rejected";
})(ExecutionStatus || (exports.ExecutionStatus = ExecutionStatus = {}));
var WorkflowState;
(function (WorkflowState) {
    WorkflowState["DRAFT"] = "draft";
    WorkflowState["PENDING"] = "pending";
    WorkflowState["IN_PROGRESS"] = "in_progress";
    WorkflowState["REVIEW"] = "review";
    WorkflowState["APPROVAL"] = "approval";
    WorkflowState["IT_SETUP"] = "it_setup";
    WorkflowState["FINANCE_APPROVAL"] = "finance_approval";
    WorkflowState["HR_FINALIZATION"] = "hr_finalization";
    WorkflowState["COMPLETED"] = "completed";
    WorkflowState["REJECTED"] = "rejected";
    WorkflowState["CANCELLED"] = "cancelled";
})(WorkflowState || (exports.WorkflowState = WorkflowState = {}));
let WorkflowExecution = class WorkflowExecution {
    id;
    workflow;
    workflowId;
    tenant;
    tenantId;
    triggeredBy;
    triggeredById;
    status;
    currentState;
    currentStepOrder;
    stateHistory;
    context;
    stepResults;
    startedAt;
    completedAt;
    createdAt;
    updatedAt;
};
exports.WorkflowExecution = WorkflowExecution;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_entity_1.Workflow),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", workflow_entity_1.Workflow)
], WorkflowExecution.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tenant_entity_1.Tenant),
    (0, typeorm_1.JoinColumn)({ name: 'tenantId' }),
    __metadata("design:type", tenant_entity_1.Tenant)
], WorkflowExecution.prototype, "tenant", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'triggeredById' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowExecution.prototype, "triggeredBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "triggeredById", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: ExecutionStatus.PENDING }),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: WorkflowState.PENDING }),
    __metadata("design:type", String)
], WorkflowExecution.prototype, "currentState", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkflowExecution.prototype, "currentStepOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], WorkflowExecution.prototype, "stateHistory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowExecution.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], WorkflowExecution.prototype, "stepResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkflowExecution.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkflowExecution.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowExecution.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowExecution.prototype, "updatedAt", void 0);
exports.WorkflowExecution = WorkflowExecution = __decorate([
    (0, typeorm_1.Entity)('workflow_executions')
], WorkflowExecution);
//# sourceMappingURL=workflow-execution.entity.js.map