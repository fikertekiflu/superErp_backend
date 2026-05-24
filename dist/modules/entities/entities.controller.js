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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const entities_service_1 = require("./entities.service");
const create_entity_dto_1 = require("./dto/create-entity.dto");
const update_entity_dto_1 = require("./dto/update-entity.dto");
const create_entity_data_dto_1 = require("./dto/create-entity-data.dto");
let EntitiesController = class EntitiesController {
    entitiesService;
    constructor(entitiesService) {
        this.entitiesService = entitiesService;
    }
    authFromRequest(req) {
        return {
            userId: req.user.userId,
            tenantId: req.user.tenantId,
            systemRole: req.user.role,
        };
    }
    async create(createEntityDto, req) {
        return this.entitiesService.create(createEntityDto, this.authFromRequest(req));
    }
    async findAll(req) {
        return this.entitiesService.findAll(this.authFromRequest(req));
    }
    async findBySlug(slug, req) {
        return this.entitiesService.findBySlug(slug, this.authFromRequest(req));
    }
    async findDataById(dataId, req) {
        return this.entitiesService.findDataById(dataId, this.authFromRequest(req));
    }
    async updateData(dataId, updateEntityDataDto, req) {
        return this.entitiesService.updateData(dataId, updateEntityDataDto, this.authFromRequest(req));
    }
    async findOne(id, req) {
        return this.entitiesService.findOne(id, this.authFromRequest(req));
    }
    async update(id, updateEntityDto, req) {
        return this.entitiesService.update(id, updateEntityDto, this.authFromRequest(req));
    }
    async remove(id, req) {
        return this.entitiesService.remove(id, this.authFromRequest(req));
    }
    async createData(id, createEntityDataDto, req) {
        createEntityDataDto.entityId = id;
        return this.entitiesService.createEntityData(createEntityDataDto, this.authFromRequest(req));
    }
    async findAllData(id, req) {
        return this.entitiesService.findAllData(id, this.authFromRequest(req));
    }
    async removeData(dataId, req) {
        return this.entitiesService.removeData(dataId, this.authFromRequest(req));
    }
    async searchData(id, query, req) {
        return this.entitiesService.searchData(id, query || '', this.authFromRequest(req));
    }
    async getStats(id, req) {
        return this.entitiesService.getEntityStats(id, this.authFromRequest(req));
    }
    async getInsights(id, req) {
        return this.entitiesService.getEntityInsights(id, this.authFromRequest(req));
    }
};
exports.EntitiesController = EntitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new entity' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Entity created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_entity_dto_1.CreateEntityDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all entities for current tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Entity slug' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)('data/:dataId'),
    (0, swagger_1.ApiParam)({ name: 'dataId', description: 'Data record ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get data record by ID' }),
    __param(0, (0, common_1.Param)('dataId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findDataById", null);
__decorate([
    (0, common_1.Patch)('data/:dataId'),
    (0, swagger_1.ApiParam)({ name: 'dataId', description: 'Data record ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update data record' }),
    __param(0, (0, common_1.Param)('dataId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_entity_data_dto_1.UpdateEntityDataDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "updateData", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update entity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_entity_dto_1.UpdateEntityDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete entity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/data'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create data for entity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_entity_data_dto_1.CreateEntityDataDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "createData", null);
__decorate([
    (0, common_1.Get)(':id/data'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all data for entity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findAllData", null);
__decorate([
    (0, common_1.Delete)(':id/data/:dataId'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiParam)({ name: 'dataId', description: 'Data ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete entity data' }),
    __param(0, (0, common_1.Param)('dataId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "removeData", null);
__decorate([
    (0, common_1.Get)(':id/search'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Search entity data with filters' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "searchData", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity statistics and reports' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id/insights'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Dynamic dashboard insights for an entity' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "getInsights", null);
exports.EntitiesController = EntitiesController = __decorate([
    (0, swagger_1.ApiTags)('entities'),
    (0, common_1.Controller)('entities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [entities_service_1.EntitiesService])
], EntitiesController);
//# sourceMappingURL=entities.controller.js.map