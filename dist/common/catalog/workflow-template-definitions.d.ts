import { WorkflowTemplateDefinition } from './workflow-template.types';
export type { WorkflowTemplateDefinition } from './workflow-template.types';
export declare const WORKFLOW_TEMPLATE_DEFINITIONS: WorkflowTemplateDefinition[];
export declare const getTemplateById: (id: string) => WorkflowTemplateDefinition | undefined;
export declare const getTemplatesByCategory: (category: string) => WorkflowTemplateDefinition[];
export declare const getTemplatesByIndustry: (industry: string) => WorkflowTemplateDefinition[];
export declare const getTemplateCategories: () => string[];
export declare const getTemplateIndustries: () => string[];
export declare const searchTemplates: (query: string) => WorkflowTemplateDefinition[];
