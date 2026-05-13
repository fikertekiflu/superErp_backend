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
exports.WorkflowTransition = void 0;
const typeorm_1 = require("typeorm");
const workflow_entity_1 = require("./workflow.entity");
const workflow_state_entity_1 = require("./workflow-state.entity");
const role_entity_1 = require("../roles/role.entity");
let WorkflowTransition = class WorkflowTransition {
    id;
    name;
    description;
    fromState;
    fromStateId;
    toState;
    toStateId;
    requiredRole;
    requiredRoleId;
    conditions;
    actions;
    metadata;
    workflow;
    workflowId;
    createdAt;
    updatedAt;
};
exports.WorkflowTransition = WorkflowTransition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_state_entity_1.WorkflowState),
    (0, typeorm_1.JoinColumn)({ name: 'fromStateId' }),
    __metadata("design:type", workflow_state_entity_1.WorkflowState)
], WorkflowTransition.prototype, "fromState", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "fromStateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_state_entity_1.WorkflowState),
    (0, typeorm_1.JoinColumn)({ name: 'toStateId' }),
    __metadata("design:type", workflow_state_entity_1.WorkflowState)
], WorkflowTransition.prototype, "toState", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "toStateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role),
    (0, typeorm_1.JoinColumn)({ name: 'requiredRoleId' }),
    __metadata("design:type", role_entity_1.Role)
], WorkflowTransition.prototype, "requiredRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "requiredRoleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], WorkflowTransition.prototype, "conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], WorkflowTransition.prototype, "actions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkflowTransition.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workflow_entity_1.Workflow, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workflowId' }),
    __metadata("design:type", workflow_entity_1.Workflow)
], WorkflowTransition.prototype, "workflow", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowTransition.prototype, "workflowId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowTransition.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkflowTransition.prototype, "updatedAt", void 0);
exports.WorkflowTransition = WorkflowTransition = __decorate([
    (0, typeorm_1.Entity)('workflow_transitions')
], WorkflowTransition);
//# sourceMappingURL=workflow-transition.entity.js.map