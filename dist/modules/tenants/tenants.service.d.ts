import { Response } from 'express';
import { TenantVerificationProfile, VerificationUploadedFile } from './verification-document.types';
import { TenantVerificationStorageService } from './tenant-verification-storage.service';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantNotificationSettingsDto, TenantRegionalSettingsDto } from './dto/update-tenant-settings.dto';
import { EntitiesService } from '../entities/entities.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class TenantsService {
    private tenantsRepository;
    private entitiesService;
    private workflowsService;
    private auditLogsService;
    private verificationStorage;
    private readonly logger;
    constructor(tenantsRepository: Repository<Tenant>, entitiesService: EntitiesService, workflowsService: WorkflowsService, auditLogsService: AuditLogsService, verificationStorage: TenantVerificationStorageService);
    private entityAuth;
    create(createTenantDto: CreateTenantDto, userId: string): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    findByUserId(userId: string): Promise<Tenant | null>;
    findOne(id: string): Promise<Tenant | null>;
    update(id: string, updateData: Partial<Tenant>): Promise<Tenant>;
    updateMySettings(tenantId: string, dto: {
        name?: string;
        description?: string;
        industry?: string;
        companySize?: string;
        regional?: TenantRegionalSettingsDto;
        notifications?: TenantNotificationSettingsDto;
    }): Promise<Tenant>;
    completeOnboarding(tenantId: string, userId: string, setupData: {
        industry: string;
        companySize: string;
        settings?: any;
    }): Promise<Tenant>;
    submitDocuments(tenantId: string, documents: Array<{
        name: string;
        fileUrl: string;
        type: string;
    }>): Promise<Tenant>;
    submitVerificationApplication(tenantId: string, profile: TenantVerificationProfile, files: Partial<Record<string, VerificationUploadedFile[]>>): Promise<Tenant>;
    streamVerificationFile(tenantId: string, documentId: string, actor: {
        userId: string;
        tenantId?: string;
        role?: string;
    }, res: Response): Promise<void>;
    getVerificationProfile(tenant: Tenant): TenantVerificationProfile | null;
    findPending(): Promise<Tenant[]>;
    approveTenant(tenantId: string, adminUserId: string): Promise<Tenant>;
    rejectTenant(tenantId: string, adminUserId: string, reason: string): Promise<Tenant>;
    private seedBlueprint;
}
