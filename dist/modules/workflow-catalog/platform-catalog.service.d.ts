export declare class PlatformCatalogService {
    getOnboardingRecommendations(industry: string, domain: string): {
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
