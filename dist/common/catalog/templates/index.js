"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_INDUSTRY_TAGS = exports.ALL_WORKFLOW_TEMPLATES = void 0;
const hr_finance_templates_1 = require("./hr-finance-templates");
const retail_crm_templates_1 = require("./retail-crm-templates");
const manufacturing_templates_1 = require("./manufacturing-templates");
const healthcare_templates_1 = require("./healthcare-templates");
const services_it_templates_1 = require("./services-it-templates");
exports.ALL_WORKFLOW_TEMPLATES = [
    ...hr_finance_templates_1.HR_FINANCE_TEMPLATES,
    ...retail_crm_templates_1.RETAIL_CRM_TEMPLATES,
    ...manufacturing_templates_1.MANUFACTURING_TEMPLATES,
    ...healthcare_templates_1.HEALTHCARE_TEMPLATES,
    ...services_it_templates_1.SERVICES_IT_TEMPLATES,
];
exports.TEMPLATE_INDUSTRY_TAGS = Object.fromEntries(exports.ALL_WORKFLOW_TEMPLATES.map((t) => [t.id, t.industries]));
//# sourceMappingURL=index.js.map