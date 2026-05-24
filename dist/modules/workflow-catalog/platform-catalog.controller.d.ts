import { PlatformCatalogService } from './platform-catalog.service';
export declare class PlatformCatalogController {
    private readonly platformCatalogService;
    constructor(platformCatalogService: PlatformCatalogService);
    getOnboardingRecommendations(industry: string, domain: string, req: any): {
        industry: string;
        domain: string;
        suggestedBlueprintId: string;
        suggestedBlueprintIds: string[];
        domainInferredBlueprintId: string | null;
        suggestedWorkflowCatalogKeys: string[];
        suggestedWorkflows: {
            id: string;
            name: string;
            description: string;
            category: string;
            icon: string;
            estimatedTime: string;
        }[];
        blueprints: {
            isSuggested: boolean;
            isDefault: boolean;
            isDomainMatch: boolean;
            id: string;
            name: string;
            description: string;
            entities: string[];
        }[];
    };
}
