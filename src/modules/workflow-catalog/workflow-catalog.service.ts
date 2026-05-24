import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublishedWorkflowTemplate } from './published-workflow-template.entity';
import {
  WORKFLOW_TEMPLATE_DEFINITIONS,
  WorkflowTemplateDefinition,
} from '../../common/catalog/workflow-template-definitions';
import { TEMPLATE_INDUSTRY_TAGS } from '../../common/catalog/templates';
import { getIndustryProfile } from '../../common/catalog/platform-catalog.config';
import { Tenant } from '../tenants/tenant.entity';

function industryTagsFor(template: WorkflowTemplateDefinition): string[] {
  return (
    TEMPLATE_INDUSTRY_TAGS[template.id] ??
    template.industries ??
    ['other']
  );
}

const INDUSTRY_LABELS: Record<string, string> = {
  retail: 'Retail & E-commerce',
  hospitality: 'Hospitality & Café',
  manufacturing: 'Manufacturing',
  services: 'Professional Services',
  healthcare: 'Healthcare',
  technology: 'Technology & IT',
  other: 'General',
};

const CATALOG_BLUEPRINT_TAGS: Record<string, string[]> = {
  'employee-onboarding': ['standard', 'crm', 'inventory'],
  'leave-request': ['standard', 'crm'],
  'expense-approval': ['standard', 'crm'],
  'procurement-approval': ['inventory', 'standard'],
  'incident-management': ['standard', 'inventory'],
};

@Injectable()
export class WorkflowCatalogService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowCatalogService.name);

  constructor(
    @InjectRepository(PublishedWorkflowTemplate)
    private readonly catalogRepo: Repository<PublishedWorkflowTemplate>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.syncLibraryFromDefinitions(false);
  }

  async syncLibraryFromDefinitions(
    resetPublishState = false,
  ): Promise<{ synced: number }> {
    let synced = 0;
    for (const template of WORKFLOW_TEMPLATE_DEFINITIONS) {
      const existing = await this.catalogRepo.findOne({
        where: { catalogKey: template.id },
      });

      const payload: Partial<PublishedWorkflowTemplate> = {
        catalogKey: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        definition: template as unknown as Record<string, unknown>,
        industryTags: industryTagsFor(template),
        blueprintTags: CATALOG_BLUEPRINT_TAGS[template.id] ?? ['standard'],
      };

      if (!existing) {
        await this.catalogRepo.save(
          this.catalogRepo.create({
            ...payload,
            isPublished: true,
            publishedAt: new Date(),
          }),
        );
        synced++;
      } else {
        existing.name = payload.name!;
        existing.description = payload.description!;
        existing.category = payload.category!;
        existing.definition = payload.definition!;
        existing.industryTags = payload.industryTags!;
        existing.blueprintTags = payload.blueprintTags!;
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

  async listAllForAdmin(): Promise<PublishedWorkflowTemplate[]> {
    return this.catalogRepo.find({ order: { name: 'ASC' } });
  }

  async listPublishedForTenant(tenantId?: string): Promise<{
    industry: string;
    industryLabel: string;
    templates: Array<
      WorkflowTemplateDefinition & {
        isSuggested: boolean;
        isPublished: boolean;
      }
    >;
  }> {
    const published = await this.catalogRepo.find({
      where: { isPublished: true },
      order: { name: 'ASC' },
    });

    let industry = 'other';
    if (tenantId) {
      const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
      industry = tenant?.settings?.industry ?? 'other';
    }

    const profile = getIndustryProfile(industry);
    const allowedKeys = new Set(profile.suggestedWorkflowCatalogKeys);

    for (const row of published) {
      const def = row.definition as unknown as WorkflowTemplateDefinition;
      const industries = def.industries ?? row.industryTags ?? [];
      if (industries.length === 1 && industries[0] === industry) {
        allowedKeys.add(row.catalogKey);
      }
    }

    const templates = published
      .filter((row) => allowedKeys.has(row.catalogKey))
      .map((row) => {
        const def = row.definition as unknown as WorkflowTemplateDefinition;
        const industries = def.industries ?? row.industryTags ?? [];
        return {
          ...def,
          id: row.catalogKey,
          industries,
          isPublished: true,
          isSuggested: profile.suggestedWorkflowCatalogKeys.includes(
            row.catalogKey,
          ),
        };
      });

    return {
      industry,
      industryLabel: INDUSTRY_LABELS[industry] ?? industry,
      templates,
    };
  }

  async getPublishedByKey(
    catalogKey: string,
  ): Promise<WorkflowTemplateDefinition | null> {
    const row = await this.catalogRepo.findOne({
      where: { catalogKey, isPublished: true },
    });
    if (!row) return null;
    return row.definition as unknown as WorkflowTemplateDefinition;
  }

  async publish(catalogKey: string): Promise<PublishedWorkflowTemplate> {
    const row = await this.catalogRepo.findOne({ where: { catalogKey } });
    if (!row) {
      throw new NotFoundException(`Catalog template ${catalogKey} not found`);
    }
    row.isPublished = true;
    row.publishedAt = new Date();
    return this.catalogRepo.save(row);
  }

  async unpublish(catalogKey: string): Promise<PublishedWorkflowTemplate> {
    const row = await this.catalogRepo.findOne({ where: { catalogKey } });
    if (!row) {
      throw new NotFoundException(`Catalog template ${catalogKey} not found`);
    }
    row.isPublished = false;
    row.publishedAt = null;
    return this.catalogRepo.save(row);
  }

}
