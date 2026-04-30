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
exports.WorkflowStep = exports.StepStatus = exports.StepType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const workflow_entity_1 = require("./workflow.entity");
var StepType;
(function (StepType) {
    StepType["TASK"] = "task";
    StepType["APPROVAL"] = "approval";
    StepType["NOTIFICATION"] = "notification";
    StepType["CONDITION"] = "condition";
    StepType["AUTOMATION"] = "automation";
})(StepType || (exports.StepType = StepType = {}));
var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "pending";
    StepStatus["IN_PROGRESS"] = "in_progress";
    StepStatus["COMPLETED"] = "completed";
    StepStatus["SKIPPED"] = "skipped";
    StepStatus["FAILED"] = "failed";
})(StepStatus || (exports.StepStatus = StepStatus = {}));
let WorkflowStep = class WorkflowStep {
    id;
    name;
    description;
    type;
    status;
    order;
    config;
    validationRules;
    workflow;
    workflowId;
    assignedTo;
    assignedToId;
    completedBy;
    completedById;
    result;
    startedAt;
    completedAt;
    createdAt;
    updatedAt;
};
exports.WorkflowStep = WorkflowStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowStep.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowStep.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: StepType.TASK }),
    __metadata("design:type", String)
], WorkflowStep.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: StepStatus.PENDING }),
    __metadata("design:type", String)
], WorkflowStep.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], WorkflowStep.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "validationRules", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_entity_1.Workflow),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", workflow_entity_1.Workflow)
], WorkflowStep.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowStep.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'assignedToId' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowStep.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowStep.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'completedById' }),
    __metadata("design:type", user_entity_1.User)
], WorkflowStep.prototype, "completedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowStep.prototype, "completedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowStep.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowStep.prototype, "updatedAt", void 0);
exports.WorkflowStep = WorkflowStep = __decorate([
    (0, typeorm_1.Entity)('workflow_steps')
], WorkflowStep);
//# sourceMappingURL=workflow-step.entity.js.map