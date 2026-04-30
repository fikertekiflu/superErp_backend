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
exports.Entity = exports.FieldType = exports.EntityStatus = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
var EntityStatus;
(function (EntityStatus) {
    EntityStatus["ACTIVE"] = "active";
    EntityStatus["INACTIVE"] = "inactive";
    EntityStatus["DRAFT"] = "draft";
})(EntityStatus || (exports.EntityStatus = EntityStatus = {}));
var FieldType;
(function (FieldType) {
    FieldType["STRING"] = "string";
    FieldType["NUMBER"] = "number";
    FieldType["DATE"] = "date";
    FieldType["BOOLEAN"] = "boolean";
    FieldType["EMAIL"] = "email";
    FieldType["PHONE"] = "phone";
    FieldType["TEXT"] = "text";
    FieldType["SELECT"] = "select";
    FieldType["MULTI_SELECT"] = "multi_select";
    FieldType["FILE"] = "file";
    FieldType["IMAGE"] = "image";
    FieldType["DECIMAL"] = "decimal";
    FieldType["INTEGER"] = "integer";
})(FieldType || (exports.FieldType = FieldType = {}));
let Entity = class Entity {
    id;
    name;
    slug;
    description;
    fields;
    status;
    icon;
    isInMenu;
    menuOrder;
    tenant;
    tenantId;
    createdBy;
    createdById;
    createdAt;
    updatedAt;
    data;
};
exports.Entity = Entity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Entity unique identifier' }),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Entity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Product', description: 'Entity display name' }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Entity.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'product',
        description: 'Entity system name (lowercase, no spaces)',
    }),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Entity.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Products in inventory',
        description: 'Entity description',
    }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Entity.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['name', 'price', 'quantity'],
        description: 'Field definitions',
    }),
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], Entity.prototype, "fields", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'active',
        enum: EntityStatus,
        description: 'Entity status',
    }),
    (0, typeorm_1.Column)({ type: 'enum', enum: EntityStatus, default: EntityStatus.ACTIVE }),
    __metadata("design:type", String)
], Entity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'fa-box', description: 'Icon for UI display' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Entity.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: true,
        description: 'Whether entity is available in menu',
    }),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Entity.prototype, "isInMenu", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Display order in menu' }),
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Entity.prototype, "menuOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant that owns this entity' }),
    (0, typeorm_1.ManyToOne)('Tenant', 'entities'),
    __metadata("design:type", Object)
], Entity.prototype, "tenant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tenant ID' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Entity.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User who created this entity' }),
    (0, typeorm_1.ManyToOne)('User', 'entities'),
    __metadata("design:type", Object)
], Entity.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who created this entity' }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Entity.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], Entity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], Entity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('EntityData', 'entity'),
    __metadata("design:type", Array)
], Entity.prototype, "data", void 0);
exports.Entity = Entity = __decorate([
    (0, typeorm_1.Entity)('entities'),
    (0, typeorm_1.Index)(['slug', 'tenantId'], { unique: true })
], Entity);
//# sourceMappingURL=entity.entity.js.map