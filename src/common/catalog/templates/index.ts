import { HR_FINANCE_TEMPLATES } from './hr-finance-templates';
import { RETAIL_CRM_TEMPLATES } from './retail-crm-templates';
import { MANUFACTURING_TEMPLATES } from './manufacturing-templates';
import { HEALTHCARE_TEMPLATES } from './healthcare-templates';
import { SERVICES_IT_TEMPLATES } from './services-it-templates';
import { WorkflowTemplateDefinition } from '../workflow-template.types';

export const ALL_WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] = [
  ...HR_FINANCE_TEMPLATES,
  ...RETAIL_CRM_TEMPLATES,
  ...MANUFACTURING_TEMPLATES,
  ...HEALTHCARE_TEMPLATES,
  ...SERVICES_IT_TEMPLATES,
];

export const TEMPLATE_INDUSTRY_TAGS: Record<string, string[]> = Object.fromEntries(
  ALL_WORKFLOW_TEMPLATES.map((t) => [t.id, t.industries]),
);
