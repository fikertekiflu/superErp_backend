import { ALL_WORKFLOW_TEMPLATES } from './templates';
import { WorkflowTemplateDefinition } from './workflow-template.types';

export type { WorkflowTemplateDefinition } from './workflow-template.types';

export const WORKFLOW_TEMPLATE_DEFINITIONS: WorkflowTemplateDefinition[] =
  ALL_WORKFLOW_TEMPLATES;

export const getTemplateById = (
  id: string,
): WorkflowTemplateDefinition | undefined => {
  return WORKFLOW_TEMPLATE_DEFINITIONS.find((template) => template.id === id);
};

export const getTemplatesByCategory = (
  category: string,
): WorkflowTemplateDefinition[] => {
  return WORKFLOW_TEMPLATE_DEFINITIONS.filter(
    (template) => template.category === category,
  );
};

export const getTemplatesByIndustry = (
  industry: string,
): WorkflowTemplateDefinition[] => {
  if (!industry || industry === 'all') {
    return WORKFLOW_TEMPLATE_DEFINITIONS;
  }
  return WORKFLOW_TEMPLATE_DEFINITIONS.filter((t) =>
    t.industries.includes(industry),
  );
};

export const getTemplateCategories = (): string[] => {
  return [
    ...new Set(WORKFLOW_TEMPLATE_DEFINITIONS.map((template) => template.category)),
  ];
};

export const getTemplateIndustries = (): string[] => {
  return [
    ...new Set(WORKFLOW_TEMPLATE_DEFINITIONS.flatMap((t) => t.industries)),
  ].sort();
};

export const searchTemplates = (query: string): WorkflowTemplateDefinition[] => {
  const lowercaseQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATE_DEFINITIONS.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
      template.category.toLowerCase().includes(lowercaseQuery),
  );
};
