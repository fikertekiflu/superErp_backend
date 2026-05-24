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
exports.PublishedWorkflowTemplate = void 0;
const typeorm_1 = require("typeorm");
let PublishedWorkflowTemplate = class PublishedWorkflowTemplate {
    id;
    catalogKey;
    name;
    description;
    category;
    definition;
    industryTags;
    blueprintTags;
    isPublished;
    publishedAt;
    createdAt;
    updatedAt;
};
exports.PublishedWorkflowTemplate = PublishedWorkflowTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PublishedWorkflowTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], PublishedWorkflowTemplate.prototype, "catalogKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PublishedWorkflowTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PublishedWorkflowTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PublishedWorkflowTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PublishedWorkflowTemplate.prototype, "definition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], PublishedWorkflowTemplate.prototype, "industryTags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], PublishedWorkflowTemplate.prototype, "blueprintTags", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], PublishedWorkflowTemplate.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PublishedWorkflowTemplate.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PublishedWorkflowTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PublishedWorkflowTemplate.prototype, "updatedAt", void 0);
exports.PublishedWorkflowTemplate = PublishedWorkflowTemplate = __decorate([
    (0, typeorm_1.Entity)('published_workflow_templates')
], PublishedWorkflowTemplate);
//# sourceMappingURL=published-workflow-template.entity.js.map