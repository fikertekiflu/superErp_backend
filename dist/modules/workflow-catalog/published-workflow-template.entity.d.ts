export declare class PublishedWorkflowTemplate {
    id: string;
    catalogKey: string;
    name: string;
    description: string;
    category: string;
    definition: Record<string, unknown>;
    industryTags: string[];
    blueprintTags: string[];
    isPublished: boolean;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
