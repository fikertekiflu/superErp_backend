import { Repository } from 'typeorm';
import { Entity } from './entity.entity';
import { EntityData } from './entity-data.entity';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { CreateEntityDataDto, UpdateEntityDataDto } from './dto/create-entity-data.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WorkflowTriggerService } from '../workflows/workflow-trigger.service';
import { PermissionsService } from '../../common/permissions/permissions.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export interface EntityAuthContext {
    userId: string;
    tenantId?: string;
    systemRole: string;
}
export declare class EntitiesService {
    private entitiesRepository;
    private entityDataRepository;
    private subscriptionsService;
    private workflowTriggerService;
    private permissionsService;
    private auditLogsService;
    constructor(entitiesRepository: Repository<Entity>, entityDataRepository: Repository<EntityData>, subscriptionsService: SubscriptionsService, workflowTriggerService: WorkflowTriggerService, permissionsService: PermissionsService, auditLogsService: AuditLogsService);
    create(createEntityDto: CreateEntityDto, auth: EntityAuthContext): Promise<Entity>;
    findAll(auth: EntityAuthContext): Promise<Entity[]>;
    findOne(id: string, auth: EntityAuthContext): Promise<Entity>;
    findBySlug(slug: string, auth: EntityAuthContext): Promise<Entity>;
    update(id: string, updateEntityDto: UpdateEntityDto, auth: EntityAuthContext): Promise<Entity>;
    remove(id: string, auth: EntityAuthContext): Promise<void>;
    private findOneForTenant;
    private validateEntityFieldDefinitions;
    private validateDynamicData;
    private assertLookupValue;
    private assertFieldUnique;
    createEntityData(createEntityDataDto: CreateEntityDataDto, auth: EntityAuthContext): Promise<EntityData>;
    findAllData(entityId: string, auth: EntityAuthContext): Promise<EntityData[]>;
    findDataById(id: string, auth: EntityAuthContext): Promise<EntityData>;
    updateData(id: string, updateEntityDataDto: UpdateEntityDataDto, auth: EntityAuthContext): Promise<EntityData>;
    removeData(id: string, auth: EntityAuthContext): Promise<void>;
    searchData(entityId: string, query: string, auth: EntityAuthContext): Promise<EntityData[]>;
    private validateEntityData;
    private validateFieldType;
    private validateFieldRules;
    getEntityStats(entityId: string, auth: EntityAuthContext): Promise<{
        totalRecords: number;
        recentRecords: number;
        entityId: string;
    }>;
    getEntityInsights(entityId: string, auth: EntityAuthContext): Promise<{
        entityId: string;
        entityName: string;
        totalRecords: number;
        recentRecords: number;
        recordsByDay: {
            date: string;
            label: string;
            count: number;
        }[];
        fieldBreakdown: {
            name: string;
            total: number;
        } | null;
    }>;
    private triggerWorkflowsForEntity;
}
