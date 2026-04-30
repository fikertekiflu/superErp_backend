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
    async create(createEntityDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.entitiesService.create(createEntityDto, userId, tenantId);
    }
    async findAll(req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.findAll(tenantId);
    }
    async findOne(id, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.findOne(id, tenantId);
    }
    async findBySlug(slug, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.findBySlug(slug, tenantId);
    }
    async update(id, updateEntityDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.entitiesService.update(id, updateEntityDto, userId, tenantId);
    }
    async remove(id, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.remove(id, tenantId);
    }
    async createData(id, createEntityDataDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        createEntityDataDto.entityId = id;
        return this.entitiesService.createEntityData(createEntityDataDto, userId, tenantId);
    }
    async findAllData(id, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.findAllData(id, tenantId);
    }
    async findDataById(dataId, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.findDataById(dataId, tenantId);
    }
    async updateData(dataId, updateEntityDataDto, req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        return this.entitiesService.updateData(dataId, updateEntityDataDto, userId, tenantId);
    }
    async removeData(id, dataId, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.removeData(dataId, tenantId);
    }
    async searchData(id, searchQuery, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.searchData(id, searchQuery, tenantId);
    }
    async getStats(id, req) {
        const tenantId = req.user.tenantId;
        return this.entitiesService.getEntityStats(id, tenantId);
    }
};
exports.EntitiesController = EntitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new entity' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Entity created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Entity slug already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_entity_dto_1.CreateEntityDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all entities for current tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entities retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Entity slug' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update entity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Entity slug already exists' }),
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
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Cannot delete entity with data' }),
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
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Data created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
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
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "findAllData", null);
__decorate([
    (0, common_1.Get)('data/:dataId'),
    (0, swagger_1.ApiParam)({ name: 'dataId', description: 'Data record ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get data record by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Data not found' }),
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
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Data not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    __param(0, (0, common_1.Param)('dataId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_entity_data_dto_1.UpdateEntityDataDto, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "updateData", null);
__decorate([
    (0, common_1.Delete)(':id/data/:dataId'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiParam)({ name: 'dataId', description: 'Data ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete entity data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Data deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity or data not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('dataId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "removeData", null);
__decorate([
    (0, common_1.Get)(':id/search'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Search entity data with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "searchData", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Entity ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get entity statistics and reports' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entity statistics' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entity not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EntitiesController.prototype, "getStats", null);
exports.EntitiesController = EntitiesController = __decorate([
    (0, swagger_1.ApiTags)('entities'),
    (0, common_1.Controller)('entities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [entities_service_1.EntitiesService])
], EntitiesController);
//# sourceMappingURL=entities.controller.js.map