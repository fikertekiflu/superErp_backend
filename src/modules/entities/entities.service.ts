import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Entity, EntityStatus } from './entity.entity';
import { EntityData } from './entity-data.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import {
  CreateEntityDataDto,
  UpdateEntityDataDto,
} from './dto/create-entity-data.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Workflow } from '../workflows/workflow.entity';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(Entity)
    private entitiesRepository: Repository<Entity>,
    @InjectRepository(EntityData)
    private entityDataRepository: Repository<EntityData>,
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    private subscriptionsService: SubscriptionsService,
    private moduleRef: ModuleRef,
  ) {}

  // Entity CRUD Operations
  async create(
    createEntityDto: CreateEntityDto,
    userId: string,
    tenantId?: string,
  ): Promise<Entity> {
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

    const entity = this.entitiesRepository.create({
      ...(createEntityDto as any),
      createdById: userId,
      tenantId,
    });

    return this.entitiesRepository.save(entity) as unknown as Promise<Entity>;
  }

  async findAll(tenantId?: string): Promise<Entity[]> {
    return this.entitiesRepository.find({
      where: { tenantId },
      order: { menuOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId?: string): Promise<Entity> {
    const entity = await this.entitiesRepository.findOne({
      where: { id, tenantId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    return entity;
  }

  async findBySlug(slug: string, tenantId?: string): Promise<Entity> {
    const entity = await this.entitiesRepository.findOne({
      where: { slug, tenantId },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with slug '${slug}' not found`);
    }

    return entity;
  }

  async update(
    id: string,
    updateEntityDto: UpdateEntityDto,
    userId: string,
    tenantId?: string,
  ): Promise<Entity> {
    const entity = await this.findOne(id, tenantId);

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
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const entity = await this.findOne(id, tenantId);

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
  }

  // Dynamic data validation
  private validateDynamicData(entity: Entity, data: any): void {
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
      }

      // Unique field validation
      if (field.unique && value) {
        // This would require checking against existing data
        // For now, just log warning
        console.warn(
          `Unique field validation not implemented for ${field.name}`,
        );
      }
    }
  }

  // Entity Data CRUD Operations
  async createEntityData(
    createEntityDataDto: CreateEntityDataDto,
    userId: string,
    tenantId?: string,
  ): Promise<EntityData> {
    const entity = await this.findOne(createEntityDataDto.entityId, tenantId);

    if (!entity) {
      throw new NotFoundException(
        `Entity with ID ${createEntityDataDto.entityId} not found`,
      );
    }

    // Validate dynamic data against entity schema
    this.validateDynamicData(entity, createEntityDataDto.data);

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

    return saved;
  }

  async findAllData(
    entityId: string,
    tenantId?: string,
  ): Promise<EntityData[]> {
    // Verify entity exists and belongs to tenant
    await this.findOne(entityId, tenantId);

    return this.entityDataRepository.find({
      where: { entityId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findDataById(id: string, tenantId?: string): Promise<EntityData> {
    const entityData = await this.entityDataRepository.findOne({
      where: { id, tenantId },
    });

    if (!entityData) {
      throw new NotFoundException(`Entity data with ID ${id} not found`);
    }

    return entityData;
  }

  async updateData(
    id: string,
    updateEntityDataDto: UpdateEntityDataDto,
    userId: string,
    tenantId?: string,
  ): Promise<EntityData> {
    const entityData = await this.findDataById(id, tenantId);

    // Get entity to validate fields
    const entity = await this.findOne(entityData.entityId, tenantId);

    // Validate updated data only if data is provided
    if (updateEntityDataDto.data) {
      this.validateEntityData(updateEntityDataDto.data, entity);
    }

    await this.entityDataRepository.update(id, {
      ...updateEntityDataDto,
      updatedById: userId,
    });

    return this.findDataById(id, tenantId);
  }

  async removeData(id: string, tenantId?: string): Promise<void> {
    await this.findDataById(id, tenantId);
    await this.entityDataRepository.delete(id);
  }

  // Search data
  async searchData(
    entityId: string,
    query: string,
    tenantId?: string,
  ): Promise<EntityData[]> {
    // Verify entity exists and belongs to tenant
    await this.findOne(entityId, tenantId);

    return this.entityDataRepository
      .createQueryBuilder('entityData')
      .where('entityData.entityId = :entityId', { entityId })
      .andWhere('entityData.tenantId = :tenantId', { tenantId })
      .andWhere('entityData.data::text ILIKE :query', { query: `%${query}%` })
      .orderBy('entityData.createdAt', 'DESC')
      .getMany();
  }

  // Helper methods
  private validateEntityData(
    data: Record<string, any>,
    entity: Entity,
  ): void {
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

      // Unique validation (simplified - would need database query for full validation)
      if (field.unique) {
        // TODO: Implement unique validation with database query
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
  async getEntityStats(entityId: string, tenantId?: string): Promise<any> {
    // Verify entity exists and belongs to tenant
    await this.findOne(entityId, tenantId);

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
      // Lazily resolve WorkflowExecutionService to avoid circular DI
      const workflowExecutionService = this.moduleRef.get(WorkflowExecutionService, { strict: false });

      // Find active workflows linked to this entity with event_based trigger
      const workflows = await this.workflowsRepository.find({
        where: { tenant: { id: tenantId }, status: 'active', trigger: 'event_based' },
      });

      for (const workflow of workflows) {
        const isLinked = workflow.entityAssignments?.some(
          (a: any) => a.entityId === entityId,
        );
        if (!isLinked) continue;

        console.log(`🔥 Triggering workflow "${workflow.name}" for entity "${entityName}" (data ID: ${dataId})`);

        await workflowExecutionService.triggerWorkflow(
          workflow.id,
          userId,
          tenantId,
          {
            entityId: dataId,
            entityType: entityName,
            entityData: data,
            triggerType: 'event_based',
          },
        );
      }
    } catch (error) {
      // Don't fail the entity data creation if workflow trigger fails
      console.error('Failed to trigger workflows for entity:', error);
    }
  }
}
