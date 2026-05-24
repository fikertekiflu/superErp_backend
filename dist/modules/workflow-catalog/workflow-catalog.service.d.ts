import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PublishedWorkflowTemplate } from './published-workflow-template.entity';
import { WorkflowTemplateDefinition } from '../../common/catalog/workflow-template-definitions';
import { Tenant } from '../tenants/tenant.entity';
export declare class WorkflowCatalogService implements OnModuleInit {
    private readonly catalogRepo;
    private readonly tenantRepo;
    private readonly logger;
    constructor(catalogRepo: Repository<PublishedWorkflowTemplate>, tenantRepo: Repository<Tenant>);
    onModuleInit(): Promise<void>;
    syncLibraryFromDefinitions(resetPublishState?: boolean): Promise<{
        synced: number;
    }>;
    listAllForAdmin(): Promise<PublishedWorkflowTemplate[]>;
    listPublishedForTenant(tenantId?: string): Promise<{
        industry: string;
        industryLabel: string;
        templates: Array<WorkflowTemplateDefinition & {
            isSuggested: boolean;
            isPublished: boolean;
        }>;
    }>;
    getPublishedByKey(catalogKey: string): Promise<WorkflowTemplateDefinition | null>;
    publish(catalogKey: string): Promise<PublishedWorkflowTemplate>;
    unpublish(catalogKey: string): Promise<PublishedWorkflowTemplate>;
}
