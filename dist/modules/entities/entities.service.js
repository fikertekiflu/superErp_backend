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
const entity_entity_1 = require("./entity.entity");
const entity_data_entity_1 = require("./entity-data.entity");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const workflow_trigger_service_1 = require("../workflows/workflow-trigger.service");
const permissions_service_1 = require("../../common/permissions/permissions.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const audit_log_entity_1 = require("../audit-logs/audit-log.entity");
let EntitiesService = class EntitiesService {
    entitiesRepository;
    entityDataRepository;
    subscriptionsService;
    workflowTriggerService;
    permissionsService;
    auditLogsService;
    constructor(entitiesRepository, entityDataRepository, subscriptionsService, workflowTriggerService, permissionsService, auditLogsService) {
        this.entitiesRepository = entitiesRepository;
        this.entityDataRepository = entityDataRepository;
        this.subscriptionsService = subscriptionsService;
        this.workflowTriggerService = workflowTriggerService;
        this.permissionsService = permissionsService;
        this.auditLogsService = auditLogsService;
    }
    async create(createEntityDto, auth) {
        const { userId, tenantId, systemRole } = auth;
        await this.permissionsService.assertCanManageSchemas(userId, tenantId, systemRole);
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
        this.validateEntityFieldDefinitions(createEntityDto.fields);
        const entity = this.entitiesRepository.create({
            ...createEntityDto,
            createdById: userId,
            tenantId,
        });
        const saved = (await this.entitiesRepository.save(entity));
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_CREATED,
            resourceType: 'entity',
            resourceId: saved.id,
            resourceName: saved.name,
        });
        return saved;
    }
    async findAll(auth) {
        const { tenantId, userId, systemRole } = auth;
        const all = await this.entitiesRepository.find({
            where: { tenantId },
            order: { menuOrder: 'ASC', name: 'ASC' },
        });
        const readable = await this.permissionsService.filterReadableEntityIds(userId, tenantId, systemRole, all.map((e) => e.id));
        const readableSet = new Set(readable);
        const snapshot = await this.permissionsService.getSnapshot(userId, tenantId, systemRole);
        if (snapshot.isFullAccess)
            return all;
        return all.filter((e) => readableSet.has(e.id));
    }
    async findOne(id, auth) {
        const { tenantId, userId, systemRole } = auth;
        const entity = await this.entitiesRepository.findOne({
            where: { id, tenantId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID ${id} not found`);
        }
        await this.permissionsService.assertEntityAction(userId, tenantId, systemRole, id, 'read');
        return entity;
    }
    async findBySlug(slug, auth) {
        const { tenantId } = auth;
        const entity = await this.entitiesRepository.findOne({
            where: { slug, tenantId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with slug '${slug}' not found`);
        }
        return this.findOne(entity.id, auth);
    }
    async update(id, updateEntityDto, auth) {
        const { userId, tenantId, systemRole } = auth;
        await this.permissionsService.assertCanManageSchemas(userId, tenantId, systemRole);
        const entity = await this.findOneForTenant(id, tenantId);
        if (updateEntityDto.slug && updateEntityDto.slug !== entity.slug) {
            const existing = await this.entitiesRepository.findOne({
                where: { slug: updateEntityDto.slug, tenantId },
            });
            if (existing) {
                throw new common_1.ForbiddenException(`Entity with slug '${updateEntityDto.slug}' already exists`);
            }
        }
        await this.entitiesRepository.update(id, updateEntityDto);
        const updated = await this.findOneForTenant(id, tenantId);
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_UPDATED,
            resourceType: 'entity',
            resourceId: id,
            resourceName: updated.name,
            metadata: { changes: updateEntityDto },
        });
        return updated;
    }
    async remove(id, auth) {
        const { userId, tenantId, systemRole } = auth;
        await this.permissionsService.assertCanManageSchemas(userId, tenantId, systemRole);
        const entity = await this.findOneForTenant(id, tenantId);
        const dataCount = await this.entityDataRepository.count({
            where: { entityId: id },
        });
        if (dataCount > 0) {
            throw new common_1.ForbiddenException(`Cannot delete entity with ${dataCount} data records. Delete data first.`);
        }
        await this.entitiesRepository.delete(id);
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_DELETED,
            resourceType: 'entity',
            resourceId: id,
            resourceName: entity.name,
        });
    }
    async findOneForTenant(id, tenantId) {
        const entity = await this.entitiesRepository.findOne({
            where: { id, tenantId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID ${id} not found`);
        }
        return entity;
    }
    validateEntityFieldDefinitions(fields) {
        if (!fields?.length)
            return;
        for (const field of fields) {
            if (field.type === 'lookup' && !field.relatedEntityId) {
                throw new common_1.BadRequestException(`Lookup field "${field.label}" requires a related entity`);
            }
        }
    }
    async validateDynamicData(entity, data, tenantId) {
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
                case 'lookup':
                    if (value && field.relatedEntityId) {
                        await this.assertLookupValue(field.relatedEntityId, value, tenantId);
                    }
                    break;
            }
            if (field.unique && value !== undefined && value !== null && value !== '') {
                await this.assertFieldUnique(entity.id, field.name, value, tenantId);
            }
        }
    }
    async assertLookupValue(relatedEntityId, value, tenantId) {
        const id = String(value);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            throw new common_1.BadRequestException('Lookup value must be a valid record id');
        }
        const record = await this.entityDataRepository.findOne({
            where: { id, entityId: relatedEntityId, tenantId },
        });
        if (!record) {
            throw new common_1.BadRequestException('Lookup value must reference an existing related record');
        }
    }
    async assertFieldUnique(entityId, fieldName, value, tenantId, excludeDataId) {
        const qb = this.entityDataRepository
            .createQueryBuilder('d')
            .where('d.entityId = :entityId', { entityId })
            .andWhere('d.tenantId = :tenantId', { tenantId })
            .andWhere(`d.data ->> :fieldName = :value`, {
            fieldName,
            value: String(value),
        });
        if (excludeDataId) {
            qb.andWhere('d.id != :excludeDataId', { excludeDataId });
        }
        const conflict = await qb.getOne();
        if (conflict) {
            throw new common_1.BadRequestException(`Value for "${fieldName}" must be unique`);
        }
    }
    async createEntityData(createEntityDataDto, auth) {
        const { userId, tenantId, systemRole } = auth;
        await this.permissionsService.assertEntityAction(userId, tenantId, systemRole, createEntityDataDto.entityId, 'create');
        const entity = await this.findOneForTenant(createEntityDataDto.entityId, tenantId);
        if (!entity) {
            throw new common_1.NotFoundException(`Entity with ID ${createEntityDataDto.entityId} not found`);
        }
        await this.validateDynamicData(entity, createEntityDataDto.data, tenantId);
        const entityData = this.entityDataRepository.create({
            ...createEntityDataDto,
            entity,
            tenantId,
            createdById: userId,
        });
        const saved = await this.entityDataRepository.save(entityData);
        await this.triggerWorkflowsForEntity(entity.id, entity.name, saved.id, saved.data, userId, tenantId);
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_DATA_CREATED,
            resourceType: 'entity_data',
            resourceId: saved.id,
            resourceName: entity.name,
        });
        return saved;
    }
    async findAllData(entityId, auth) {
        await this.findOne(entityId, auth);
        const { tenantId } = auth;
        return this.entityDataRepository.find({
            where: { entityId, tenantId },
            order: { createdAt: 'DESC' },
        });
    }
    async findDataById(id, auth) {
        const { tenantId, userId, systemRole } = auth;
        const entityData = await this.entityDataRepository.findOne({
            where: { id, tenantId },
        });
        if (!entityData) {
            throw new common_1.NotFoundException(`Entity data with ID ${id} not found`);
        }
        await this.permissionsService.assertEntityAction(userId, tenantId, systemRole, entityData.entityId, 'read');
        return entityData;
    }
    async updateData(id, updateEntityDataDto, auth) {
        const { userId, tenantId, systemRole } = auth;
        const entityData = await this.findDataById(id, auth);
        await this.permissionsService.assertEntityAction(userId, tenantId, systemRole, entityData.entityId, 'update');
        const entity = await this.findOneForTenant(entityData.entityId, tenantId);
        if (updateEntityDataDto.data) {
            await this.validateEntityData(updateEntityDataDto.data, entity, tenantId, id);
        }
        await this.entityDataRepository.update(id, {
            ...updateEntityDataDto,
            updatedById: userId,
        });
        const updated = await this.findDataById(id, auth);
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_DATA_UPDATED,
            resourceType: 'entity_data',
            resourceId: id,
            resourceName: entity.name,
        });
        return updated;
    }
    async removeData(id, auth) {
        const { userId, tenantId, systemRole } = auth;
        const entityData = await this.findDataById(id, auth);
        await this.permissionsService.assertEntityAction(userId, tenantId, systemRole, entityData.entityId, 'delete');
        const entity = await this.findOneForTenant(entityData.entityId, tenantId);
        await this.entityDataRepository.delete(id);
        await this.auditLogsService.log({
            tenantId,
            actorId: userId,
            action: audit_log_entity_1.AuditAction.ENTITY_DATA_DELETED,
            resourceType: 'entity_data',
            resourceId: id,
            resourceName: entity.name,
        });
    }
    async searchData(entityId, query, auth) {
        await this.findOne(entityId, auth);
        const { tenantId } = auth;
        return this.entityDataRepository
            .createQueryBuilder('entityData')
            .where('entityData.entityId = :entityId', { entityId })
            .andWhere('entityData.tenantId = :tenantId', { tenantId })
            .andWhere('entityData.data::text ILIKE :query', { query: `%${query}%` })
            .orderBy('entityData.createdAt', 'DESC')
            .getMany();
    }
    async validateEntityData(data, entity, tenantId, excludeDataId) {
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
                await this.assertFieldUnique(entity.id, field.name, value, tenantId, excludeDataId);
            }
            if (field.type === 'lookup' && field.relatedEntityId) {
                await this.assertLookupValue(field.relatedEntityId, value, tenantId);
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
            case 'lookup':
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
    async getEntityStats(entityId, auth) {
        await this.findOne(entityId, auth);
        const { tenantId } = auth;
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
    async getEntityInsights(entityId, auth) {
        const entity = await this.findOne(entityId, auth);
        const stats = await this.getEntityStats(entityId, auth);
        const { tenantId } = auth;
        const rows = await this.entityDataRepository.find({
            where: { entityId, tenantId },
            order: { createdAt: 'ASC' },
            take: 2000,
        });
        const byDay = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            byDay[d.toISOString().slice(0, 10)] = 0;
        }
        for (const row of rows) {
            const key = new Date(row.createdAt).toISOString().slice(0, 10);
            if (byDay[key] !== undefined) {
                byDay[key]++;
            }
        }
        const recordsByDay = Object.entries(byDay).map(([date, count]) => ({
            date,
            label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
            }),
            count,
        }));
        const numberField = entity.fields?.find((f) => ['number', 'integer', 'decimal'].includes(f.type));
        let fieldBreakdown = null;
        if (numberField) {
            const total = rows.reduce((sum, r) => sum + (Number(r.data[numberField.name]) || 0), 0);
            fieldBreakdown = { name: numberField.label, total };
        }
        return {
            entityId,
            entityName: entity.name,
            totalRecords: stats.totalRecords,
            recentRecords: stats.recentRecords,
            recordsByDay,
            fieldBreakdown,
        };
    }
    async triggerWorkflowsForEntity(entityId, entityName, dataId, data, userId, tenantId) {
        if (!tenantId)
            return;
        try {
            await this.workflowTriggerService.triggerForEntityRecord(tenantId, entityId, entityName, dataId, data, userId);
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        subscriptions_service_1.SubscriptionsService,
        workflow_trigger_service_1.WorkflowTriggerService,
        permissions_service_1.PermissionsService,
        audit_logs_service_1.AuditLogsService])
], EntitiesService);
//# sourceMappingURL=entities.service.js.map