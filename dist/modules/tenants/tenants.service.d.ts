import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EntitiesService } from '../entities/entities.service';
import { WorkflowsService } from '../workflows/workflows.service';
export declare class TenantsService {
    private tenantsRepository;
    private entitiesService;
    private workflowsService;
    constructor(tenantsRepository: Repository<Tenant>, entitiesService: EntitiesService, workflowsService: WorkflowsService);
    create(createTenantDto: CreateTenantDto, userId: string): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    findByUserId(userId: string): Promise<Tenant | null>;
    findOne(id: string): Promise<Tenant | null>;
    update(id: string, updateData: Partial<Tenant>): Promise<Tenant>;
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
    findPending(): Promise<Tenant[]>;
    approveTenant(tenantId: string, adminUserId: string): Promise<Tenant>;
    rejectTenant(tenantId: string, adminUserId: string, reason: string): Promise<Tenant>;
    private seedBlueprint;
}
