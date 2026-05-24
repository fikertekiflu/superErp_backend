import { WorkflowCatalogService } from './workflow-catalog.service';
export declare class WorkflowCatalogController {
    private readonly catalogService;
    constructor(catalogService: WorkflowCatalogService);
    listPublished(req: any): Promise<{
        industry: string;
        industryLabel: string;
        templates: Array<import("../../common/catalog/workflow-template.types").WorkflowTemplateDefinition & {
            isSuggested: boolean;
            isPublished: boolean;
        }>;
    }>;
    getOne(catalogKey: string): Promise<import("../../common/catalog/workflow-template.types").WorkflowTemplateDefinition | null>;
}
export declare class AdminWorkflowCatalogController {
    private readonly catalogService;
    constructor(catalogService: WorkflowCatalogService);
    listAll(): Promise<import("./published-workflow-template.entity").PublishedWorkflowTemplate[]>;
    sync(): Promise<{
        synced: number;
    }>;
    publish(catalogKey: string): Promise<import("./published-workflow-template.entity").PublishedWorkflowTemplate>;
    unpublish(catalogKey: string): Promise<import("./published-workflow-template.entity").PublishedWorkflowTemplate>;
}
