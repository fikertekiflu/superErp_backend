export interface BlueprintOption {
    id: string;
    name: string;
    description: string;
    entities: string[];
}
export declare const BLUEPRINT_OPTIONS: BlueprintOption[];
export interface IndustryProfile {
    defaultBlueprintId: string;
    suggestedBlueprintIds: string[];
    suggestedWorkflowCatalogKeys: string[];
}
export declare const INDUSTRY_PROFILES: Record<string, IndustryProfile>;
export declare function inferBlueprintFromDomain(domain: string): string | null;
export declare function getIndustryProfile(industry: string): IndustryProfile;
