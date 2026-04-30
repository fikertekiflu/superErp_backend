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
exports.EntityData = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let EntityData = class EntityData {
    id;
    entity;
    entityId;
    data;
    tenant;
    tenantId;
    createdBy;
    createdById;
    updatedBy;
    updatedById;
    createdAt;
    updatedAt;
};
exports.EntityData = EntityData;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data record unique identifier' }),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EntityData.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entity this data belongs to' }),
    (0, typeorm_1.ManyToOne)('Entity', 'data'),
    __metadata("design:type", Object)
], EntityData.prototype, "entity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entity ID' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EntityData.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dynamic field values stored as JSON' }),
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], EntityData.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant that owns this data' }),
    (0, typeorm_1.ManyToOne)('Tenant', 'entityData'),
    __metadata("design:type", Object)
], EntityData.prototype, "tenant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EntityData.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User who created this data' }),
    (0, typeorm_1.ManyToOne)('User', 'entityData'),
    __metadata("design:type", Object)
], EntityData.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who created this data' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EntityData.prototype, "createdById", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User who last updated this data' }),
    (0, typeorm_1.ManyToOne)('User', 'updatedEntityData'),
    __metadata("design:type", Object)
], EntityData.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who last updated this data' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EntityData.prototype, "updatedById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], EntityData.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], EntityData.prototype, "updatedAt", void 0);
exports.EntityData = EntityData = __decorate([
    (0, typeorm_1.Entity)('entity_data')
], EntityData);
//# sourceMappingURL=entity-data.entity.js.map