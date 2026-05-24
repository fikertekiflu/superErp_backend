declare class TemplateStateDto {
    name: string;
    key: string;
    order?: number;
    description?: string;
}
declare class TemplateTransitionDto {
    name: string;
    fromState: string;
    toState: string;
    requiredRole?: string;
}
declare class TemplateStepDto {
    name: string;
    description: string;
    type: string;
    order?: number;
    config?: Record<string, unknown>;
}
export declare class DeployWorkflowTemplateDto {
    name: string;
    description?: string;
    templateId?: string;
    trigger: string;
    states: TemplateStateDto[];
    transitions: TemplateTransitionDto[];
    steps: TemplateStepDto[];
    entityAssignments?: Array<{
        entityId: string;
        permissions?: Record<string, boolean>;
    }>;
    entitySlugs?: string[];
    activate?: boolean;
    seedRoles?: boolean;
    seedEntities?: boolean;
}
export {};
