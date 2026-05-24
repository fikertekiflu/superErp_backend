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
exports.DeployWorkflowTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TemplateStateDto {
    name;
    key;
    order;
    description;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStateDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateStateDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStateDto.prototype, "description", void 0);
class TemplateTransitionDto {
    name;
    fromState;
    toState;
    requiredRole;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateTransitionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateTransitionDto.prototype, "fromState", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateTransitionDto.prototype, "toState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateTransitionDto.prototype, "requiredRole", void 0);
class TemplateStepDto {
    name;
    description;
    type;
    order;
    config;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStepDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStepDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplateStepDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TemplateStepDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], TemplateStepDto.prototype, "config", void 0);
class DeployWorkflowTemplateDto {
    name;
    description;
    templateId;
    trigger;
    states;
    transitions;
    steps;
    entityAssignments;
    entitySlugs;
    activate;
    seedRoles;
    seedEntities;
}
exports.DeployWorkflowTemplateDto = DeployWorkflowTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeployWorkflowTemplateDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeployWorkflowTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeployWorkflowTemplateDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeployWorkflowTemplateDto.prototype, "trigger", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateStateDto),
    __metadata("design:type", Array)
], DeployWorkflowTemplateDto.prototype, "states", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateTransitionDto),
    __metadata("design:type", Array)
], DeployWorkflowTemplateDto.prototype, "transitions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TemplateStepDto),
    __metadata("design:type", Array)
], DeployWorkflowTemplateDto.prototype, "steps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], DeployWorkflowTemplateDto.prototype, "entityAssignments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DeployWorkflowTemplateDto.prototype, "entitySlugs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeployWorkflowTemplateDto.prototype, "activate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeployWorkflowTemplateDto.prototype, "seedRoles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeployWorkflowTemplateDto.prototype, "seedEntities", void 0);
//# sourceMappingURL=deploy-workflow-template.dto.js.map