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
exports.EntitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const core_1 = require("@nestjs/core");
const entity_entity_1 = require("./entity.entity");
const entity_data_entity_1 = require("./entity-data.entity");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const workflow_entity_1 = require("../workflows/workflow.entity");
const workflow_execution_service_1 = require("../workflows/workflow-execution.service");
let EntitiesService = class EntitiesService {
    entitiesRepository;
    entityDataRepository;
    workflowsRepository;
    subscriptionsService;
    moduleRef;
    constructor(entitiesRepository, entityDataRepository, workflowsRepository, subscriptionsService, moduleRef) {
        this.entitiesRepository = entitiesRepository;
        this.entityDataRepository = entityDataRepository;
        this.workflowsRepository = workflowsRepository;
        this.subscriptionsService = subscriptionsService;
        this.moduleRef = moduleRef;
    }
    async create(createEntityDto, userId, tenantId) {
        const existing = await this.entitiesRepository.findOne({
            where: { slug: createEntityDto.slug, tenantId },
        });
        if (existing) {
            throw new common_1.ForbiddenException(`Entity with slug '${createEntityDto.slug}' already exists`);
        }
        if (tenantId) {
            const currentCount = await this.entitiesRepository.count({
                where: { tenantId },
            });
            await this.subscriptionsService.checkLimit(tenantId, 'maxEntities', currentCount);
        }
        const entity = this.entitiesRepository.create({
            ...createEntityDto,
            createdById: userId,
            tenantId,
        });
        return this.entitiesRepository.save(entity);
    }
    async findAll(tenantId) {
        return this.entitiesRepository.find({
            where: { tenantId },
            order: { menuOrder: 'ASC', name: 'ASC' },
        });
    }
    async findOne(id, tenantId) {
        const entity = await this.entitiesRepository.findOne({
            where: { id, tenantId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID ${id} not found`);
        }
        return entity;
    }
    async findBySlug(slug, tenantId) {
        const entity = await this.entitiesRepository.findOne({
            where: { slug, tenantId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with slug '${slug}' not found`);
        }
        return entity;
    }
    async update(id, updateEntityDto, userId, tenantId) {
        const entity = await this.findOne(id, tenantId);
        if (updateEntityDto.slug && updateEntityDto.slug !== entity.slug) {
            const existing = await this.entitiesRepository.findOne({
                where: { slug: updateEntityDto.slug, tenantId },
            });
            if (existing) {
                throw new common_1.ForbiddenException(`Entity with slug '${updateEntityDto.slug}' already exists`);
            }
        }
        await this.entitiesRepository.update(id, updateEntityDto);
        return this.findOne(id, tenantId);
    }
    async remove(id, tenantId) {
        const entity = await this.findOne(id, tenantId);
        const dataCount = await this.entityDataRepository.count({
            where: { entityId: id },
        });
        if (dataCount > 0) {
            throw new common_1.ForbiddenException(`Cannot delete entity with ${dataCount} data records. Delete data first.`);
        }
        await this.entitiesRepository.delete(id);
    }
    validateDynamicData(entity, data) {
        if (!entity.fields || !Array.isArray(entity.fields)) {
            throw new common_1.BadRequestException('Entity fields are not properly configured');
        }
        for (const field of entity.fields) {
            const value = data[field.name];
            if (field.required &&
                (value === undefined || value === null || value === '')) {
                throw new common_1.BadRequestException(`${field.label} is required`);
            }
            switch (field.type) {
                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        throw new common_1.BadRequestException(`${field.label} must be a valid email`);
                    }
                    break;
                case 'number':
                    if (value !== undefined && value !== null && isNaN(Number(value))) {
                        throw new common_1.BadRequestException(`${field.label} must be a valid number`);
                    }
                    break;
                case 'string':
                    if (value !== undefined &&
                        value !== null &&
                        typeof value !== 'string') {
                        throw new common_1.BadRequestException(`${field.label} must be a string`);
                    }
                    break;
                case 'boolean':
                    if (value !== undefined &&
                        value !== null &&
                        typeof value !== 'boolean') {
                        throw new common_1.BadRequestException(`${field.label} must be true or false`);
                    }
                    break;
                case 'date':
                    if (value && !(value instanceof Date) && isNaN(Date.parse(value))) {
                        throw new common_1.BadRequestException(`${field.label} must be a valid date`);
                    }
                    break;
                case 'phone':
                    if (value && !/^[\d\s\-\(\)]+$/.test(value.replace(/\s/g, ''))) {
                        throw new common_1.BadRequestException(`${field.label} must be a valid phone number`);
                    }
                    break;
            }
            if (field.unique && value) {
                console.warn(`Unique field validation not implemented for ${field.name}`);
            }
        }
    }
    async createEntityData(createEntityDataDto, userId, tenantId) {
        const entity = await this.findOne(createEntityDataDto.entityId, tenantId);
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID ${createEntityDataDto.entityId} not found`);
        }
        this.validateDynamicData(entity, createEntityDataDto.data);
        const entityData = this.entityDataRepository.create({
            ...createEntityDataDto,
            entity,
            tenantId,
            createdById: userId,
        });
        const saved = await this.entityDataRepository.save(entityData);
        await this.triggerWorkflowsForEntity(entity.id, entity.name, saved.id, saved.data, userId, tenantId);
        return saved;
    }
    async findAllData(entityId, tenantId) {
        await this.findOne(entityId, tenantId);
        return this.entityDataRepository.find({
            where: { entityId, tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async findDataById(id, tenantId) {
        const entityData = await this.entityDataRepository.findOne({
            where: { id, tenantId },
        });
        if (!entityData) {
            throw new common_1.NotFoundException(`Entity data with ID ${id} not found`);
        }
        return entityData;
    }
    async updateData(id, updateEntityDataDto, userId, tenantId) {
        const entityData = await this.findDataById(id, tenantId);
        const entity = await this.findOne(entityData.entityId, tenantId);
        if (updateEntityDataDto.data) {
            this.validateEntityData(updateEntityDataDto.data, entity);
        }
        await this.entityDataRepository.update(id, {
            ...updateEntityDataDto,
            updatedById: userId,
        });
        return this.findDataById(id, tenantId);
    }
    async removeData(id, tenantId) {
        await this.findDataById(id, tenantId);
        await this.entityDataRepository.delete(id);
    }
    async searchData(entityId, query, tenantId) {
        await this.findOne(entityId, tenantId);
        return this.entityDataRepository
            .createQueryBuilder('entityData')
            .where('entityData.entityId = :entityId', { entityId })
            .andWhere('entityData.tenantId = :tenantId', { tenantId })
            .andWhere('entityData.data::text ILIKE :query', { query: `%${query}%` })
            .orderBy('entityData.createdAt', 'DESC')
            .getMany();
    }
    validateEntityData(data, entity) {
        const errors = [];
        for (const field of entity.fields) {
            const value = data[field.name];
            if (field.required &&
                (value === undefined || value === null || value === '')) {
                errors.push(`Field '${field.label}' is required`);
                continue;
            }
            if (value === undefined || value === null) {
                continue;
            }
            if (!this.validateFieldType(value, field.type)) {
                errors.push(`Field '${field.label}' must be of type ${field.type}`);
            }
            if (field.unique) {
            }
            if (field.validation) {
                const validationErrors = this.validateFieldRules(value, field);
                errors.push(...validationErrors);
            }
        }
        if (errors.length > 0) {
            throw new common_1.ForbiddenException(`Validation failed: ${errors.join(', ')}`);
        }
    }
    validateFieldType(value, type) {
        switch (type) {
            case 'string':
            case 'text':
            case 'email':
            case 'phone':
                return typeof value === 'string';
            case 'number':
            case 'integer':
            case 'decimal':
                return typeof value === 'number';
            case 'boolean':
                return typeof value === 'boolean';
            case 'date':
                return value instanceof Date || !isNaN(Date.parse(value));
            case 'select':
                return typeof value === 'string';
            case 'multi_select':
                return (Array.isArray(value) && value.every((v) => typeof v === 'string'));
            case 'file':
            case 'image':
                return typeof value === 'string';
            default:
                return true;
        }
    }
    validateFieldRules(value, field) {
        const errors = [];
        const validation = field.validation;
        if (!validation)
            return errors;
        if (typeof value === 'string') {
            if (validation.minLength && value.length < validation.minLength) {
                errors.push(`Field '${field.label}' must be at least ${validation.minLength} characters`);
            }
            if (validation.maxLength && value.length > validation.maxLength) {
                errors.push(`Field '${field.label}' must be at most ${validation.maxLength} characters`);
            }
        }
        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                errors.push(`Field '${field.label}' must be at least ${validation.min}`);
            }
            if (validation.max !== undefined && value > validation.max) {
                errors.push(`Field '${field.label}' must be at most ${validation.max}`);
            }
        }
        if (validation.pattern && typeof value === 'string') {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                errors.push(`Field '${field.label}' format is invalid`);
            }
        }
        return errors;
    }
    async getEntityStats(entityId, tenantId) {
        await this.findOne(entityId, tenantId);
        const totalRecords = await this.entityDataRepository.count({
            where: { entityId, tenantId },
        });
        const recentRecords = await this.entityDataRepository.count({
            where: {
                entityId,
                tenantId,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            totalRecords,
            recentRecords,
            entityId,
        };
    }
    async triggerWorkflowsForEntity(entityId, entityName, dataId, data, userId, tenantId) {
        if (!tenantId)
            return;
        try {
            const workflowExecutionService = this.moduleRef.get(workflow_execution_service_1.WorkflowExecutionService, { strict: false });
            const workflows = await this.workflowsRepository.find({
                where: { tenant: { id: tenantId }, status: 'active', trigger: 'event_based' },
            });
            for (const workflow of workflows) {
                const isLinked = workflow.entityAssignments?.some((a) => a.entityId === entityId);
                if (!isLinked)
                    continue;
                console.log(`🔥 Triggering workflow "${workflow.name}" for entity "${entityName}" (data ID: ${dataId})`);
                await workflowExecutionService.triggerWorkflow(workflow.id, userId, tenantId, {
                    entityId: dataId,
                    entityType: entityName,
                    entityData: data,
                    triggerType: 'event_based',
                });
            }
        }
        catch (error) {
            console.error('Failed to trigger workflows for entity:', error);
        }
    }
};
exports.EntitiesService = EntitiesService;
exports.EntitiesService = EntitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __param(1, (0, typeorm_1.InjectRepository)(entity_data_entity_1.EntityData)),
    __param(2, (0, typeorm_1.InjectRepository)(workflow_entity_1.Workflow)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        subscriptions_service_1.SubscriptionsService,
        core_1.ModuleRef])
], EntitiesService);
//# sourceMappingURL=entities.service.js.map