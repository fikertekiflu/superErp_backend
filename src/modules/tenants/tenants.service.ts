import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  TenantVerificationProfile,
  VerificationUploadedFile,
} from './verification-document.types';
import { TenantVerificationStorageService } from './tenant-verification-storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  TenantNotificationSettingsDto,
  TenantRegionalSettingsDto,
} from './dto/update-tenant-settings.dto';
import { EntitiesService } from '../entities/entities.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { UserRole } from '../users/user.entity';
import { EntityAuthContext } from '../entities/entities.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/audit-log.entity';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    private entitiesService: EntitiesService,
    private workflowsService: WorkflowsService,
    private auditLogsService: AuditLogsService,
    private verificationStorage: TenantVerificationStorageService,
  ) {}

  private entityAuth(userId: string, tenantId: string): EntityAuthContext {
    return {
      userId,
      tenantId,
      systemRole: UserRole.TENANT_ADMIN,
    };
  }

  async create(
    createTenantDto: CreateTenantDto,
    userId: string,
  ): Promise<Tenant> {
    // ... existing implementation remains same
    const existingTenantByDomain = await this.tenantsRepository.findOne({
      where: { domain: createTenantDto.domain },
    });

    if (existingTenantByDomain) {
      throw new ConflictException(
        `Company domain '${createTenantDto.domain}' already exists.`,
      );
    }

    const existingTenantByName = await this.tenantsRepository.findOne({
      where: { name: createTenantDto.name },
    });

    if (existingTenantByName) {
      throw new ConflictException(
        `Company name '${createTenantDto.name}' already exists.`,
      );
    }

    const tenant = this.tenantsRepository.create({
      ...(createTenantDto as any),
      createdById: userId,
    });

    return this.tenantsRepository.save(tenant) as unknown as Promise<Tenant>;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findByUserId(userId: string): Promise<Tenant | null> {
    // This would need a user-tenant relationship table
    // For now, return null or implement based on your user-tenant logic
    console.debug(`findByUserId called for user: ${userId}`);
    return Promise.resolve(null);
  }

  async findOne(id: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    await this.tenantsRepository.update(id, updateData);
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new Error('Tenant not found after update');
    }
    return tenant;
  }

  async updateMySettings(
    tenantId: string,
    dto: {
      name?: string;
      description?: string;
      industry?: string;
      companySize?: string;
      regional?: TenantRegionalSettingsDto;
      notifications?: TenantNotificationSettingsDto;
    },
  ): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (dto.name?.trim()) {
      const nameTaken = await this.tenantsRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (nameTaken && nameTaken.id !== tenantId) {
        throw new ConflictException('Workspace name is already in use');
      }
    }

    const settings = {
      ...(tenant.settings || {}),
      ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
      ...(dto.companySize !== undefined ? { companySize: dto.companySize } : {}),
      ...(dto.regional
        ? {
            regional: {
              ...(tenant.settings?.regional || {}),
              ...dto.regional,
            },
          }
        : {}),
      ...(dto.notifications
        ? {
            notifications: {
              ...(tenant.settings?.notifications || {}),
              ...dto.notifications,
            },
          }
        : {}),
    };

    const patch: Partial<Tenant> = { settings };
    if (dto.name?.trim()) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;

    return this.update(tenantId, patch);
  }

  async completeOnboarding(
    tenantId: string,
    userId: string,
    setupData: { industry: string; companySize: string; settings?: any },
  ): Promise<Tenant> {
    const existing = await this.findOne(tenantId);
    const templateId = setupData.settings?.templateId;

    const tenant = await this.update(tenantId, {
      isOnboarded: true,
      // Don't set to ACTIVE — they need verification first
      status: TenantStatus.PENDING_VERIFICATION,
      settings: {
        ...(existing?.settings || {}),
        industry: setupData.industry,
        companySize: setupData.companySize,
        templateId,
        blueprintId: templateId,
      },
    });
    if (templateId) {
      await this.seedBlueprint(tenantId, userId, templateId);
    }

    return tenant;
  }

  // === Verification Pipeline ===

  async submitDocuments(
    tenantId: string,
    documents: Array<{ name: string; fileUrl: string; type: string }>,
  ): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const docsWithTimestamp = documents.map((doc) => ({
      ...doc,
      uploadedAt: new Date().toISOString(),
    }));

    return this.update(tenantId, {
      verificationDocuments: docsWithTimestamp,
      verificationStatus: 'submitted',
      status: TenantStatus.PENDING_VERIFICATION,
      rejectionReason: null,
    } as any);
  }

  async submitVerificationApplication(
    tenantId: string,
    profile: TenantVerificationProfile,
    files: Partial<Record<string, VerificationUploadedFile[]>>,
  ): Promise<Tenant> {
    const tenant = await this.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!profile.tinNumber?.trim()) {
      throw new BadRequestException('TIN number is required');
    }
    if (!profile.legalBusinessName?.trim()) {
      throw new BadRequestException('Legal business name is required');
    }

    const documents = this.verificationStorage.collectUploadedFiles(
      tenantId,
      files as any,
    );

    const verificationProfile: TenantVerificationProfile = {
      ...profile,
      submittedAt: new Date().toISOString(),
    };

    return this.update(tenantId, {
      verificationDocuments: documents,
      verificationStatus: 'submitted',
      status: TenantStatus.PENDING_VERIFICATION,
      rejectionReason: null,
      settings: {
        ...(tenant.settings || {}),
        verificationProfile,
      },
    } as any);
  }

  async streamVerificationFile(
    tenantId: string,
    documentId: string,
    actor: { userId: string; tenantId?: string; role?: string },
    res: Response,
  ): Promise<void> {
    const tenant = await this.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    this.verificationStorage.assertCanAccess(actor, tenantId);

    const doc = (tenant.verificationDocuments || []).find(
      (d) => d.id === documentId,
    );
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.storagePath && doc.mimeType && doc.fileName) {
      this.verificationStorage.streamDocument(
        doc.storagePath,
        doc.mimeType,
        doc.fileName,
        res,
      );
      return;
    }

    if (doc.fileUrl) {
      res.redirect(doc.fileUrl);
      return;
    }

    throw new NotFoundException('Document file is not available');
  }

  getVerificationProfile(tenant: Tenant): TenantVerificationProfile | null {
    return tenant.settings?.verificationProfile ?? null;
  }

  async findPending(): Promise<Tenant[]> {
    return this.tenantsRepository.find({
      where: [
        { verificationStatus: 'submitted' },
        { status: TenantStatus.PENDING_VERIFICATION },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async approveTenant(tenantId: string, adminUserId: string): Promise<Tenant> {
    const tenant = await this.update(tenantId, {
      status: TenantStatus.ACTIVE,
      verificationStatus: 'approved',
      verifiedAt: new Date(),
      verifiedBy: adminUserId,
      rejectionReason: null,
    } as any);

    await this.auditLogsService.log({
      tenantId,
      actorId: adminUserId,
      action: AuditAction.TENANT_APPROVED,
      resourceType: 'tenant',
      resourceId: tenantId,
      resourceName: tenant.name,
    });

    return tenant;
  }

  async rejectTenant(tenantId: string, adminUserId: string, reason: string): Promise<Tenant> {
    const tenant = await this.update(tenantId, {
      status: TenantStatus.REJECTED,
      verificationStatus: 'rejected',
      rejectionReason: reason,
      verifiedBy: adminUserId,
    } as any);

    await this.auditLogsService.log({
      tenantId,
      actorId: adminUserId,
      action: AuditAction.TENANT_REJECTED,
      resourceType: 'tenant',
      resourceId: tenantId,
      resourceName: tenant.name,
      metadata: { reason },
    });

    return tenant;
  }

  private async seedBlueprint(
    tenantId: string,
    userId: string,
    templateId: string,
  ) {
    this.logger.log(`Seeding blueprint ${templateId} for tenant ${tenantId}`);

    try {
      if (templateId === 'crm') {
        // 1. Create Leads Entity
        const leads = await this.entitiesService.create(
          {
            name: 'Leads',
            slug: 'leads',
            description: 'Potential customers and sales opportunities',
            icon: 'Users',
            isInMenu: true,
            menuOrder: 1,
            fields: [
              {
                name: 'name',
                label: 'Contact Name',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                unique: true,
                display: { order: 2, showInList: true, showInForm: true },
              },
              {
                name: 'status',
                label: 'Lead Status',
                type: 'select',
                required: true,
                unique: false,
                options: ['New', 'Contacted', 'Qualified', 'Lost'],
                defaultValue: 'New',
                display: { order: 3, showInList: true, showInForm: true },
              },
              {
                name: 'value',
                label: 'Estimated Value',
                type: 'number',
                required: false,
                unique: false,
                display: { order: 4, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        // 2. Create Deals Entity
        const deals = await this.entitiesService.create(
          {
            name: 'Deals',
            slug: 'deals',
            description: 'Sales pipeline stages and contract tracking',
            icon: 'Briefcase',
            isInMenu: true,
            menuOrder: 2,
            fields: [
              {
                name: 'title',
                label: 'Deal Title',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'stage',
                label: 'Sales Stage',
                type: 'select',
                required: true,
                unique: false,
                options: [
                  'Discovery',
                  'Proposal',
                  'Negotiation',
                  'Closed Won',
                  'Closed Lost',
                ],
                defaultValue: 'Discovery',
                display: { order: 2, showInList: true, showInForm: true },
              },
              {
                name: 'amount',
                label: 'Deal Amount',
                type: 'number',
                required: true,
                unique: false,
                display: { order: 3, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        // 3. Create Sales Pipeline Workflow
        await this.workflowsService.create(
          {
            name: 'Sales Master Pipeline',
            description: 'Automated sales tracking from lead to closed deal',
            status: 'active' as any,
            trigger: 'manual' as any,
            entityAssignments: [
              {
                entityId: leads.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: false,
                },
              },
              {
                entityId: deals.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                },
              },
            ],
          },
          userId,
          tenantId,
        );
      } else if (templateId === 'inventory') {
        const products = await this.entitiesService.create(
          {
            name: 'Products',
            slug: 'products',
            description: 'Inventory items and stock levels',
            icon: 'Package',
            isInMenu: true,
            menuOrder: 1,
            fields: [
              {
                name: 'sku',
                label: 'SKU Code',
                type: 'string',
                required: true,
                unique: true,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'name',
                label: 'Product Name',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 2, showInList: true, showInForm: true },
              },
              {
                name: 'stock',
                label: 'Current Stock',
                type: 'number',
                required: true,
                unique: false,
                defaultValue: 0,
                display: { order: 3, showInList: true, showInForm: true },
              },
              {
                name: 'price',
                label: 'Unit Price',
                type: 'number',
                required: true,
                unique: false,
                display: { order: 4, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        const suppliers = await this.entitiesService.create(
          {
            name: 'Suppliers',
            slug: 'suppliers',
            description: 'External vendors and supply partners',
            icon: 'Truck',
            isInMenu: true,
            menuOrder: 2,
            fields: [
              {
                name: 'name',
                label: 'Vendor Name',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'contact',
                label: 'Primary Contact',
                type: 'string',
                required: false,
                unique: false,
                display: { order: 2, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        await this.workflowsService.create(
          {
            name: 'Supply Chain Flow',
            description: 'Automated restock alerts and supplier management',
            status: 'active' as any,
            trigger: 'manual' as any,
            entityAssignments: [
              {
                entityId: products.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                },
              },
              {
                entityId: suppliers.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: false,
                },
              },
            ],
          },
          userId,
          tenantId,
        );
      } else if (templateId === 'standard' || !templateId) {
        // Standard ERP / Fallback
        const clients = await this.entitiesService.create(
          {
            name: 'Clients',
            slug: 'clients',
            description: 'Customer directory and profiles',
            icon: 'Users',
            isInMenu: true,
            menuOrder: 1,
            fields: [
              {
                name: 'company',
                label: 'Company Name',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'email',
                label: 'Contact Email',
                type: 'email',
                required: true,
                unique: true,
                display: { order: 2, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        const products = await this.entitiesService.create(
          {
            name: 'Products',
            slug: 'products',
            description: 'Product catalog',
            icon: 'Package',
            isInMenu: true,
            menuOrder: 2,
            fields: [
              {
                name: 'name',
                label: 'Product Name',
                type: 'string',
                required: true,
                unique: false,
                display: { order: 1, showInList: true, showInForm: true },
              },
              {
                name: 'price',
                label: 'Standard Price',
                type: 'number',
                required: true,
                unique: false,
                display: { order: 2, showInList: true, showInForm: true },
              },
            ],
          },
          this.entityAuth(userId, tenantId),
        );

        await this.workflowsService.create(
          {
            name: 'General Operations',
            description: 'Standard business operational workflow',
            status: 'active' as any,
            trigger: 'manual' as any,
            entityAssignments: [
              {
                entityId: clients.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: false,
                },
              },
              {
                entityId: products.id,
                permissions: {
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                },
              },
            ],
          },
          userId,
          tenantId,
        );
      }
    } catch (err) {
      console.error(`Error seeding blueprint ${templateId}:`, err);
      // We don't throw here to avoid failing the whole onboarding if seeding has a minor issue
    }
  }
}
