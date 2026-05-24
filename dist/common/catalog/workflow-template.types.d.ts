export interface WorkflowTemplateDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
    tags: string[];
    entities: string[];
    entitySlugs?: string[];
    industries: string[];
    trigger: 'manual' | 'event_based' | 'scheduled' | 'webhook';
    states: {
        name: string;
        key: string;
        order: number;
        description: string;
    }[];
    transitions: {
        name: string;
        fromState: string;
        toState: string;
        requiredRole?: string;
    }[];
    steps: {
        name: string;
        description: string;
        type: 'automation' | 'task' | 'approval';
        order: number;
        config: any;
    }[];
}
