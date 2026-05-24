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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const tenant_verification_storage_service_1 = require("./tenant-verification-storage.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
const entities_service_1 = require("../entities/entities.service");
const workflows_service_1 = require("../workflows/workflows.service");
const user_entity_1 = require("../users/user.entity");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const audit_log_entity_1 = require("../audit-logs/audit-log.entity");
let TenantsService = TenantsService_1 = class TenantsService {
    tenantsRepository;
    entitiesService;
    workflowsService;
    auditLogsService;
    verificationStorage;
    logger = new common_1.Logger(TenantsService_1.name);
    constructor(tenantsRepository, entitiesService, workflowsService, auditLogsService, verificationStorage) {
        this.tenantsRepository = tenantsRepository;
        this.entitiesService = entitiesService;
        this.workflowsService = workflowsService;
        this.auditLogsService = auditLogsService;
        this.verificationStorage = verificationStorage;
    }
    entityAuth(userId, tenantId) {
        return {
            userId,
            tenantId,
            systemRole: user_entity_1.UserRole.TENANT_ADMIN,
        };
    }
    async create(createTenantDto, userId) {
        const existingTenantByDomain = await this.tenantsRepository.findOne({
            where: { domain: createTenantDto.domain },
        });
        if (existingTenantByDomain) {
            throw new common_1.ConflictException(`Company domain '${createTenantDto.domain}' already exists.`);
        }
        const existingTenantByName = await this.tenantsRepository.findOne({
            where: { name: createTenantDto.name },
        });
        if (existingTenantByName) {
            throw new common_1.ConflictException(`Company name '${createTenantDto.name}' already exists.`);
        }
        const tenant = this.tenantsRepository.create({
            ...createTenantDto,
            createdById: userId,
        });
        return this.tenantsRepository.save(tenant);
    }
    async findAll() {
        return this.tenantsRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    findByUserId(userId) {
        console.debug(`findByUserId called for user: ${userId}`);
        return Promise.resolve(null);
    }
    async findOne(id) {
        return this.tenantsRepository.findOne({
            where: { id },
        });
    }
    async update(id, updateData) {
        await this.tenantsRepository.update(id, updateData);
        const tenant = await this.findOne(id);
        if (!tenant) {
            throw new Error('Tenant not found after update');
        }
        return tenant;
    }
    async updateMySettings(tenantId, dto) {
        const tenant = await this.findOne(tenantId);
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (dto.name?.trim()) {
            const nameTaken = await this.tenantsRepository.findOne({
                where: { name: dto.name.trim() },
            });
            if (nameTaken && nameTaken.id !== tenantId) {
                throw new common_1.ConflictException('Workspace name is already in use');
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
        const patch = { settings };
        if (dto.name?.trim())
            patch.name = dto.name.trim();
        if (dto.description !== undefined)
            patch.description = dto.description;
        return this.update(tenantId, patch);
    }
    async completeOnboarding(tenantId, userId, setupData) {
        const existing = await this.findOne(tenantId);
        const templateId = setupData.settings?.templateId;
        const tenant = await this.update(tenantId, {
            isOnboarded: true,
            status: tenant_entity_1.TenantStatus.PENDING_VERIFICATION,
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
    async submitDocuments(tenantId, documents) {
        const tenant = await this.findOne(tenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const docsWithTimestamp = documents.map((doc) => ({
            ...doc,
            uploadedAt: new Date().toISOString(),
        }));
        return this.update(tenantId, {
            verificationDocuments: docsWithTimestamp,
            verificationStatus: 'submitted',
            status: tenant_entity_1.TenantStatus.PENDING_VERIFICATION,
            rejectionReason: null,
        });
    }
    async submitVerificationApplication(tenantId, profile, files) {
        const tenant = await this.findOne(tenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        if (!profile.tinNumber?.trim()) {
            throw new common_1.BadRequestException('TIN number is required');
        }
        if (!profile.legalBusinessName?.trim()) {
            throw new common_1.BadRequestException('Legal business name is required');
        }
        const documents = this.verificationStorage.collectUploadedFiles(tenantId, files);
        const verificationProfile = {
            ...profile,
            submittedAt: new Date().toISOString(),
        };
        return this.update(tenantId, {
            verificationDocuments: documents,
            verificationStatus: 'submitted',
            status: tenant_entity_1.TenantStatus.PENDING_VERIFICATION,
            rejectionReason: null,
            settings: {
                ...(tenant.settings || {}),
                verificationProfile,
            },
        });
    }
    async streamVerificationFile(tenantId, documentId, actor, res) {
        const tenant = await this.findOne(tenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        this.verificationStorage.assertCanAccess(actor, tenantId);
        const doc = (tenant.verificationDocuments || []).find((d) => d.id === documentId);
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.storagePath && doc.mimeType && doc.fileName) {
            this.verificationStorage.streamDocument(doc.storagePath, doc.mimeType, doc.fileName, res);
            return;
        }
        if (doc.fileUrl) {
            res.redirect(doc.fileUrl);
            return;
        }
        throw new common_1.NotFoundException('Document file is not available');
    }
    getVerificationProfile(tenant) {
        return tenant.settings?.verificationProfile ?? null;
    }
    async findPending() {
        return this.tenantsRepository.find({
            where: [
                { verificationStatus: 'submitted' },
                { status: tenant_entity_1.TenantStatus.PENDING_VERIFICATION },
            ],
            order: { createdAt: 'DESC' },
        });
    }
    async approveTenant(tenantId, adminUserId) {
        const tenant = await this.update(tenantId, {
            status: tenant_entity_1.TenantStatus.ACTIVE,
            verificationStatus: 'approved',
            verifiedAt: new Date(),
            verifiedBy: adminUserId,
            rejectionReason: null,
        });
        await this.auditLogsService.log({
            tenantId,
            actorId: adminUserId,
            action: audit_log_entity_1.AuditAction.TENANT_APPROVED,
            resourceType: 'tenant',
            resourceId: tenantId,
            resourceName: tenant.name,
        });
        return tenant;
    }
    async rejectTenant(tenantId, adminUserId, reason) {
        const tenant = await this.update(tenantId, {
            status: tenant_entity_1.TenantStatus.REJECTED,
            verificationStatus: 'rejected',
            rejectionReason: reason,
            verifiedBy: adminUserId,
        });
        await this.auditLogsService.log({
            tenantId,
            actorId: adminUserId,
            action: audit_log_entity_1.AuditAction.TENANT_REJECTED,
            resourceType: 'tenant',
            resourceId: tenantId,
            resourceName: tenant.name,
            metadata: { reason },
        });
        return tenant;
    }
    async seedBlueprint(tenantId, userId, templateId) {
        this.logger.log(`Seeding blueprint ${templateId} for tenant ${tenantId}`);
        try {
            if (templateId === 'crm') {
                const leads = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                const deals = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                await this.workflowsService.create({
                    name: 'Sales Master Pipeline',
                    description: 'Automated sales tracking from lead to closed deal',
                    status: 'active',
                    trigger: 'manual',
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
                }, userId, tenantId);
            }
            else if (templateId === 'inventory') {
                const products = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                const suppliers = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                await this.workflowsService.create({
                    name: 'Supply Chain Flow',
                    description: 'Automated restock alerts and supplier management',
                    status: 'active',
                    trigger: 'manual',
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
                }, userId, tenantId);
            }
            else if (templateId === 'standard' || !templateId) {
                const clients = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                const products = await this.entitiesService.create({
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
                }, this.entityAuth(userId, tenantId));
                await this.workflowsService.create({
                    name: 'General Operations',
                    description: 'Standard business operational workflow',
                    status: 'active',
                    trigger: 'manual',
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
                }, userId, tenantId);
            }
        }
        catch (err) {
            console.error(`Error seeding blueprint ${templateId}:`, err);
        }
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        entities_service_1.EntitiesService,
        workflows_service_1.WorkflowsService,
        audit_logs_service_1.AuditLogsService,
        tenant_verification_storage_service_1.TenantVerificationStorageService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map