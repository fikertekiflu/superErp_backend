import { WorkflowTemplateDefinition } from '../workflow-template.types';

type PartialTemplate = Omit<
  WorkflowTemplateDefinition,
  'entities' | 'trigger' | 'industries'
> & {
  entities?: string[];
  trigger?: WorkflowTemplateDefinition['trigger'];
  industries?: string[];
};

export function defineTemplate(t: PartialTemplate): WorkflowTemplateDefinition {
  return {
    entities: [],
    ...t,
    trigger: t.trigger ?? 'manual',
    industries: t.industries ?? ['other'],
  };
}
