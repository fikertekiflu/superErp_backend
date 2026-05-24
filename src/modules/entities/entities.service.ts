import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entity, EntityStatus } from './entity.entity';
import { EntityData } from './entity-data.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import {
  CreateEntityDataDto,
  UpdateEntityDataDto,
} from './dto/create-entity-data.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WorkflowTriggerService } from '../workflows/workflow-trigger.service';
import { PermissionsService } from '../../common/permissions/permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

export interface EntityAuthContext {
  userId: string;
  tenantId?: string;
  systemRole: string;
}

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(Entity)
    private entitiesRepository: Repository<Entity>,
    @InjectRepository(EntityData)
    private entityDataRepository: Repository<EntityData>,
    private subscriptionsService: SubscriptionsService,
    private workflowTriggerService: WorkflowTriggerService,
    private permissionsService: PermissionsService,
    private auditLogsService: AuditLogsService,
  ) {}

  // Entity CRUD Operations
  async create(
    createEntityDto: CreateEntityDto,
    auth: EntityAuthContext,
  ): Promise<Entity> {
    const { userId, tenantId, systemRole } = auth;
    await this.permissionsService.assertCanManageSchemas(
      userId,
      tenantId,
      systemRole,
    );
    // Check if slug already exists for this tenant
    const existing = await this.entitiesRepository.findOne({
      where: { slug: createEntityDto.slug, tenantId },
    });

    if (existing) {
      throw new ForbiddenException(
        `Entity with slug '${createEntityDto.slug}' already exists`,
      );
    }

    // Check subscription limits
    if (tenantId) {
      const currentCount = await this.entitiesRepository.count({
        where: { tenantId },
      });
      await this.subscriptionsService.checkLimit(tenantId, 'maxEntities', currentCount);
    }

    this.validateEntityFieldDefinitions(createEntityDto.fields);

    const entity = this.entitiesRepository.create({
      ...(createEntityDto as any),
      createdById: userId,
      tenantId,
    });

    const saved = (await this.entitiesRepository.save(
      entity,
    )) as unknown as Entity;

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_CREATED,
      resourceType: 'entity',
      resourceId: saved.id,
      resourceName: saved.name,
    });

    return saved;
  }

  async findAll(auth: EntityAuthContext): Promise<Entity[]> {
    const { tenantId, userId, systemRole } = auth;
    const all = await this.entitiesRepository.find({
      where: { tenantId },
      order: { menuOrder: 'ASC', name: 'ASC' },
    });
    const readable = await this.permissionsService.filterReadableEntityIds(
      userId,
      tenantId,
      systemRole,
      all.map((e) => e.id),
    );
    const readableSet = new Set(readable);
    const snapshot = await this.permissionsService.getSnapshot(
      userId,
      tenantId,
      systemRole,
    );
    if (snapshot.isFullAccess) return all;
    return all.filter((e) => readableSet.has(e.id));
  }

  async findOne(id: string, auth: EntityAuthContext): Promise<Entity> {
    const { tenantId, userId, systemRole } = auth;
    const entity = await this.entitiesRepository.findOne({
      where: { id, tenantId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    await this.permissionsService.assertEntityAction(
      userId,
      tenantId,
      systemRole,
      id,
      'read',
    );

    return entity;
  }

  async findBySlug(slug: string, auth: EntityAuthContext): Promise<Entity> {
    const { tenantId } = auth;
    const entity = await this.entitiesRepository.findOne({
      where: { slug, tenantId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with slug '${slug}' not found`);
    }

    return this.findOne(entity.id, auth);
  }

  async update(
    id: string,
    updateEntityDto: UpdateEntityDto,
    auth: EntityAuthContext,
  ): Promise<Entity> {
    const { userId, tenantId, systemRole } = auth;
    await this.permissionsService.assertCanManageSchemas(
      userId,
      tenantId,
      systemRole,
    );
    const entity = await this.findOneForTenant(id, tenantId);

    // If updating slug, check for conflicts
    if (updateEntityDto.slug && updateEntityDto.slug !== entity.slug) {
      const existing = await this.entitiesRepository.findOne({
        where: { slug: updateEntityDto.slug, tenantId },
      });

      if (existing) {
        throw new ForbiddenException(
          `Entity with slug '${updateEntityDto.slug}' already exists`,
        );
      }
    }

    await this.entitiesRepository.update(id, updateEntityDto as any);
    const updated = await this.findOneForTenant(id, tenantId);

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_UPDATED,
      resourceType: 'entity',
      resourceId: id,
      resourceName: updated.name,
      metadata: { changes: updateEntityDto },
    });

    return updated;
  }

  async remove(id: string, auth: EntityAuthContext): Promise<void> {
    const { userId, tenantId, systemRole } = auth;
    await this.permissionsService.assertCanManageSchemas(
      userId,
      tenantId,
      systemRole,
    );
    const entity = await this.findOneForTenant(id, tenantId);

    // Check if there's any data associated with this entity
    const dataCount = await this.entityDataRepository.count({
      where: { entityId: id },
    });

    if (dataCount > 0) {
      throw new ForbiddenException(
        `Cannot delete entity with ${dataCount} data records. Delete data first.`,
      );
    }

    await this.entitiesRepository.delete(id);

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_DELETED,
      resourceType: 'entity',
      resourceId: id,
      resourceName: entity.name,
    });
  }

  private async findOneForTenant(
    id: string,
    tenantId?: string,
  ): Promise<Entity> {
    const entity = await this.entitiesRepository.findOne({
      where: { id, tenantId },
    });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  private validateEntityFieldDefinitions(
    fields: Array<{ type: string; label: string; relatedEntityId?: string }> | undefined,
  ): void {
    if (!fields?.length) return;

    for (const field of fields) {
      if (field.type === 'lookup' && !field.relatedEntityId) {
        throw new BadRequestException(
          `Lookup field "${field.label}" requires a related entity`,
        );
      }
    }
  }

  // Dynamic data validation
  private async validateDynamicData(
    entity: Entity,
    data: Record<string, any>,
    tenantId?: string,
  ): Promise<void> {
    if (!entity.fields || !Array.isArray(entity.fields)) {
      throw new BadRequestException(
        'Entity fields are not properly configured',
      );
    }

    for (const field of entity.fields) {
      const value = data[field.name];

      // Check required fields
      if (
        field.required &&
        (value === undefined || value === null || value === '')
      ) {
        throw new BadRequestException(`${field.label} is required`);
      }

      // Type validation
      switch (field.type) {
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new BadRequestException(
              `${field.label} must be a valid email`,
            );
          }
          break;
        case 'number':
          if (value !== undefined && value !== null && isNaN(Number(value))) {
            throw new BadRequestException(
              `${field.label} must be a valid number`,
            );
          }
          break;
        case 'string':
          if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
          ) {
            throw new BadRequestException(`${field.label} must be a string`);
          }
          break;
        case 'boolean':
          if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'boolean'
          ) {
            throw new BadRequestException(
              `${field.label} must be true or false`,
            );
          }
          break;
        case 'date':
          if (value && !(value instanceof Date) && isNaN(Date.parse(value))) {
            throw new BadRequestException(
              `${field.label} must be a valid date`,
            );
          }
          break;
        case 'phone':
          if (value && !/^[\d\s\-\(\)]+$/.test(value.replace(/\s/g, ''))) {
            throw new BadRequestException(
              `${field.label} must be a valid phone number`,
            );
          }
          break;
        case 'lookup':
          if (value && field.relatedEntityId) {
            await this.assertLookupValue(
              field.relatedEntityId,
              value,
              tenantId,
            );
          }
          break;
      }

      if (field.unique && value !== undefined && value !== null && value !== '') {
        await this.assertFieldUnique(
          entity.id,
          field.name,
          value,
          tenantId,
        );
      }
    }
  }

  private async assertLookupValue(
    relatedEntityId: string,
    value: unknown,
    tenantId?: string,
  ): Promise<void> {
    const id = String(value);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Lookup value must be a valid record id');
    }

    const record = await this.entityDataRepository.findOne({
      where: { id, entityId: relatedEntityId, tenantId },
    });

    if (!record) {
      throw new BadRequestException(
        'Lookup value must reference an existing related record',
      );
    }
  }

  private async assertFieldUnique(
    entityId: string,
    fieldName: string,
    value: unknown,
    tenantId?: string,
    excludeDataId?: string,
  ): Promise<void> {
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
      throw new BadRequestException(
        `Value for "${fieldName}" must be unique`,
      );
    }
  }

  // Entity Data CRUD Operations
  async createEntityData(
    createEntityDataDto: CreateEntityDataDto,
    auth: EntityAuthContext,
  ): Promise<EntityData> {
    const { userId, tenantId, systemRole } = auth;
    await this.permissionsService.assertEntityAction(
      userId,
      tenantId,
      systemRole,
      createEntityDataDto.entityId,
      'create',
    );
    const entity = await this.findOneForTenant(
      createEntityDataDto.entityId,
      tenantId,
    );

    if (!entity) {
      throw new NotFoundException(
        `Entity with ID ${createEntityDataDto.entityId} not found`,
      );
    }

    await this.validateDynamicData(
      entity,
      createEntityDataDto.data,
      tenantId,
    );

    const entityData = this.entityDataRepository.create({
      ...createEntityDataDto,
      entity,
      tenantId,
      createdById: userId,
    });

    const saved = await this.entityDataRepository.save(entityData);

    // Trigger matching workflows after data is created
    await this.triggerWorkflowsForEntity(
      entity.id,
      entity.name,
      saved.id,
      saved.data,
      userId,
      tenantId,
    );

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_DATA_CREATED,
      resourceType: 'entity_data',
      resourceId: saved.id,
      resourceName: entity.name,
    });

    return saved;
  }

  async findAllData(
    entityId: string,
    auth: EntityAuthContext,
  ): Promise<EntityData[]> {
    await this.findOne(entityId, auth);

    const { tenantId } = auth;
    return this.entityDataRepository.find({
      where: { entityId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findDataById(id: string, auth: EntityAuthContext): Promise<EntityData> {
    const { tenantId, userId, systemRole } = auth;
    const entityData = await this.entityDataRepository.findOne({
      where: { id, tenantId },
    });

    if (!entityData) {
      throw new NotFoundException(`Entity data with ID ${id} not found`);
    }

    await this.permissionsService.assertEntityAction(
      userId,
      tenantId,
      systemRole,
      entityData.entityId,
      'read',
    );

    return entityData;
  }

  async updateData(
    id: string,
    updateEntityDataDto: UpdateEntityDataDto,
    auth: EntityAuthContext,
  ): Promise<EntityData> {
    const { userId, tenantId, systemRole } = auth;
    const entityData = await this.findDataById(id, auth);

    await this.permissionsService.assertEntityAction(
      userId,
      tenantId,
      systemRole,
      entityData.entityId,
      'update',
    );

    const entity = await this.findOneForTenant(entityData.entityId, tenantId);

    if (updateEntityDataDto.data) {
      await this.validateEntityData(
        updateEntityDataDto.data,
        entity,
        tenantId,
        id,
      );
    }

    await this.entityDataRepository.update(id, {
      ...updateEntityDataDto,
      updatedById: userId,
    });

    const updated = await this.findDataById(id, auth);

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_DATA_UPDATED,
      resourceType: 'entity_data',
      resourceId: id,
      resourceName: entity.name,
    });

    return updated;
  }

  async removeData(id: string, auth: EntityAuthContext): Promise<void> {
    const { userId, tenantId, systemRole } = auth;
    const entityData = await this.findDataById(id, auth);

    await this.permissionsService.assertEntityAction(
      userId,
      tenantId,
      systemRole,
      entityData.entityId,
      'delete',
    );

    const entity = await this.findOneForTenant(entityData.entityId, tenantId);
    await this.entityDataRepository.delete(id);

    await this.auditLogsService.log({
      tenantId,
      actorId: userId,
      action: AuditAction.ENTITY_DATA_DELETED,
      resourceType: 'entity_data',
      resourceId: id,
      resourceName: entity.name,
    });
  }

  // Search data
  async searchData(
    entityId: string,
    query: string,
    auth: EntityAuthContext,
  ): Promise<EntityData[]> {
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

  // Helper methods
  private async validateEntityData(
    data: Record<string, any>,
    entity: Entity,
    tenantId?: string,
    excludeDataId?: string,
  ): Promise<void> {
    const errors: string[] = [];

    for (const field of entity.fields) {
      const value = data[field.name];

      // Check required fields
      if (
        field.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push(`Field '${field.label}' is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (!this.validateFieldType(value, field.type)) {
        errors.push(`Field '${field.label}' must be of type ${field.type}`);
      }

      if (field.unique) {
        await this.assertFieldUnique(
          entity.id,
          field.name,
          value,
          tenantId,
          excludeDataId,
        );
      }

      if (field.type === 'lookup' && field.relatedEntityId) {
        await this.assertLookupValue(
          field.relatedEntityId,
          value,
          tenantId,
        );
      }

      // Validation rules
      if (field.validation) {
        const validationErrors = this.validateFieldRules(value, field);
        errors.push(...validationErrors);
      }
    }

    if (errors.length > 0) {
      throw new ForbiddenException(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private validateFieldType(value: any, type: string): boolean {
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
        return (
          Array.isArray(value) && value.every((v) => typeof v === 'string')
        );
      case 'file':
      case 'image':
        return typeof value === 'string'; // File path or URL
      case 'lookup':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  private validateFieldRules(value: any, field: any): string[] {
    const errors: string[] = [];
    const validation = field.validation;

    if (!validation) return errors;

    if (typeof value === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        errors.push(
          `Field '${field.label}' must be at least ${validation.minLength} characters`,
        );
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        errors.push(
          `Field '${field.label}' must be at most ${validation.maxLength} characters`,
        );
      }
    }

    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push(
          `Field '${field.label}' must be at least ${validation.min}`,
        );
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

  // Get statistics
  async getEntityStats(
    entityId: string,
    auth: EntityAuthContext,
  ): Promise<{
    totalRecords: number;
    recentRecords: number;
    entityId: string;
  }> {
    await this.findOne(entityId, auth);
    const { tenantId } = auth;

    const totalRecords = await this.entityDataRepository.count({
      where: { entityId, tenantId },
    });

    const recentRecords = await this.entityDataRepository.count({
      where: {
        entityId,
        tenantId,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    });

    return {
      totalRecords,
      recentRecords,
      entityId,
    };
  }

  async getEntityInsights(
    entityId: string,
    auth: EntityAuthContext,
  ): Promise<{
    entityId: string;
    entityName: string;
    totalRecords: number;
    recentRecords: number;
    recordsByDay: { date: string; label: string; count: number }[];
    fieldBreakdown: { name: string; total: number } | null;
  }> {
    const entity = await this.findOne(entityId, auth);
    const stats = await this.getEntityStats(entityId, auth);
    const { tenantId } = auth;

    const rows = await this.entityDataRepository.find({
      where: { entityId, tenantId },
      order: { createdAt: 'ASC' },
      take: 2000,
    });

    const byDay: Record<string, number> = {};
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

    const numberField = entity.fields?.find((f) =>
      ['number', 'integer', 'decimal'].includes(f.type),
    );

    let fieldBreakdown: { name: string; total: number } | null = null;
    if (numberField) {
      const total = rows.reduce(
        (sum, r) => sum + (Number(r.data[numberField.name]) || 0),
        0,
      );
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

  /**
   * Trigger workflows that are linked to this entity and have event_based trigger
   */
  private async triggerWorkflowsForEntity(
    entityId: string,
    entityName: string,
    dataId: string,
    data: Record<string, any>,
    userId: string,
    tenantId?: string,
  ): Promise<void> {
    if (!tenantId) return;

    try {
      await this.workflowTriggerService.triggerForEntityRecord(
        tenantId,
        entityId,
        entityName,
        dataId,
        data,
        userId,
      );
    } catch (error) {
      // Don't fail the entity data creation if workflow trigger fails
      console.error('Failed to trigger workflows for entity:', error);
    }
  }
}
