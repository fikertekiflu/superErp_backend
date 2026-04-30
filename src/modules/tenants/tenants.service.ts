import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EntitiesService } from '../entities/entities.service';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    private entitiesService: EntitiesService,
    private workflowsService: WorkflowsService,
  ) {}

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

  async completeOnboarding(
    tenantId: string,
    userId: string,
    setupData: { industry: string; companySize: string; settings?: any },
  ): Promise<Tenant> {
    const tenant = await this.update(tenantId, {
      isOnboarded: true,
      status: TenantStatus.ACTIVE,
    });

    const templateId = setupData.settings?.templateId;
    if (templateId) {
      await this.seedBlueprint(tenantId, userId, templateId);
    }

    return tenant;
  }

  private async seedBlueprint(
    tenantId: string,
    userId: string,
    templateId: string,
  ) {
    console.log(`Seeding blueprint ${templateId} for tenant ${tenantId}`);

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
          userId,
          tenantId,
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
          userId,
          tenantId,
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
          userId,
          tenantId,
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
          userId,
          tenantId,
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
          userId,
          tenantId,
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
          userId,
          tenantId,
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
