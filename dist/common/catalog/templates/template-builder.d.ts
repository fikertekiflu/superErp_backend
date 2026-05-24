import { WorkflowTemplateDefinition } from '../workflow-template.types';
type PartialTemplate = Omit<WorkflowTemplateDefinition, 'entities' | 'trigger' | 'industries'> & {
    entities?: string[];
    trigger?: WorkflowTemplateDefinition['trigger'];
    industries?: string[];
};
export declare function defineTemplate(t: PartialTemplate): WorkflowTemplateDefinition;
export {};
