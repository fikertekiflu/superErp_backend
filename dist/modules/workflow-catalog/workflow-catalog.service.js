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
var WorkflowCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCatalogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const published_workflow_template_entity_1 = require("./published-workflow-template.entity");
const workflow_template_definitions_1 = require("../../common/catalog/workflow-template-definitions");
const templates_1 = require("../../common/catalog/templates");
const platform_catalog_config_1 = require("../../common/catalog/platform-catalog.config");
const tenant_entity_1 = require("../tenants/tenant.entity");
function industryTagsFor(template) {
    return (templates_1.TEMPLATE_INDUSTRY_TAGS[template.id] ??
        template.industries ??
        ['other']);
}
const INDUSTRY_LABELS = {
    retail: 'Retail & E-commerce',
    hospitality: 'Hospitality & Café',
    manufacturing: 'Manufacturing',
    services: 'Professional Services',
    healthcare: 'Healthcare',
    technology: 'Technology & IT',
    other: 'General',
};
const CATALOG_BLUEPRINT_TAGS = {
    'employee-onboarding': ['standard', 'crm', 'inventory'],
    'leave-request': ['standard', 'crm'],
    'expense-approval': ['standard', 'crm'],
    'procurement-approval': ['inventory', 'standard'],
    'incident-management': ['standard', 'inventory'],
};
let WorkflowCatalogService = WorkflowCatalogService_1 = class WorkflowCatalogService {
    catalogRepo;
    tenantRepo;
    logger = new common_1.Logger(WorkflowCatalogService_1.name);
    constructor(catalogRepo, tenantRepo) {
        this.catalogRepo = catalogRepo;
        this.tenantRepo = tenantRepo;
    }
    async onModuleInit() {
        await this.syncLibraryFromDefinitions(false);
    }
    async syncLibraryFromDefinitions(resetPublishState = false) {
        let synced = 0;
        for (const template of workflow_template_definitions_1.WORKFLOW_TEMPLATE_DEFINITIONS) {
            const existing = await this.catalogRepo.findOne({
                where: { catalogKey: template.id },
            });
            const payload = {
                catalogKey: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                definition: template,
                industryTags: industryTagsFor(template),
                blueprintTags: CATALOG_BLUEPRINT_TAGS[template.id] ?? ['standard'],
            };
            if (!existing) {
                await this.catalogRepo.save(this.catalogRepo.create({
                    ...payload,
                    isPublished: true,
                    publishedAt: new Date(),
                }));
                synced++;
            }
            else {
                existing.name = payload.name;
                existing.description = payload.description;
                existing.category = payload.category;
                existing.definition = payload.definition;
                existing.industryTags = payload.industryTags;
                existing.blueprintTags = payload.blueprintTags;
                if (resetPublishState) {
                    existing.isPublished = true;
                    existing.publishedAt = new Date();
                }
                await this.catalogRepo.save(existing);
                synced++;
            }
        }
        this.logger.log(`Workflow catalog synced (${synced} templates)`);
        return { synced };
    }
    async listAllForAdmin() {
        return this.catalogRepo.find({ order: { name: 'ASC' } });
    }
    async listPublishedForTenant(tenantId) {
        const published = await this.catalogRepo.find({
            where: { isPublished: true },
            order: { name: 'ASC' },
        });
        let industry = 'other';
        if (tenantId) {
            const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
            industry = tenant?.settings?.industry ?? 'other';
        }
        const profile = (0, platform_catalog_config_1.getIndustryProfile)(industry);
        const allowedKeys = new Set(profile.suggestedWorkflowCatalogKeys);
        for (const row of published) {
            const def = row.definition;
            const industries = def.industries ?? row.industryTags ?? [];
            if (industries.length === 1 && industries[0] === industry) {
                allowedKeys.add(row.catalogKey);
            }
        }
        const templates = published
            .filter((row) => allowedKeys.has(row.catalogKey))
            .map((row) => {
            const def = row.definition;
            const industries = def.industries ?? row.industryTags ?? [];
            return {
                ...def,
                id: row.catalogKey,
                industries,
                isPublished: true,
                isSuggested: profile.suggestedWorkflowCatalogKeys.includes(row.catalogKey),
            };
        });
        return {
            industry,
            industryLabel: INDUSTRY_LABELS[industry] ?? industry,
            templates,
        };
    }
    async getPublishedByKey(catalogKey) {
        const row = await this.catalogRepo.findOne({
            where: { catalogKey, isPublished: true },
        });
        if (!row)
            return null;
        return row.definition;
    }
    async publish(catalogKey) {
        const row = await this.catalogRepo.findOne({ where: { catalogKey } });
        if (!row) {
            throw new common_1.NotFoundException(`Catalog template ${catalogKey} not found`);
        }
        row.isPublished = true;
        row.publishedAt = new Date();
        return this.catalogRepo.save(row);
    }
    async unpublish(catalogKey) {
        const row = await this.catalogRepo.findOne({ where: { catalogKey } });
        if (!row) {
            throw new common_1.NotFoundException(`Catalog template ${catalogKey} not found`);
        }
        row.isPublished = false;
        row.publishedAt = null;
        return this.catalogRepo.save(row);
    }
};
exports.WorkflowCatalogService = WorkflowCatalogService;
exports.WorkflowCatalogService = WorkflowCatalogService = WorkflowCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(published_workflow_template_entity_1.PublishedWorkflowTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WorkflowCatalogService);
//# sourceMappingURL=workflow-catalog.service.js.map