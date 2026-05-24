"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTemplates = exports.getTemplateIndustries = exports.getTemplateCategories = exports.getTemplatesByIndustry = exports.getTemplatesByCategory = exports.getTemplateById = exports.WORKFLOW_TEMPLATE_DEFINITIONS = void 0;
const templates_1 = require("./templates");
exports.WORKFLOW_TEMPLATE_DEFINITIONS = templates_1.ALL_WORKFLOW_TEMPLATES;
const getTemplateById = (id) => {
    return exports.WORKFLOW_TEMPLATE_DEFINITIONS.find((template) => template.id === id);
};
exports.getTemplateById = getTemplateById;
const getTemplatesByCategory = (category) => {
    return exports.WORKFLOW_TEMPLATE_DEFINITIONS.filter((template) => template.category === category);
};
exports.getTemplatesByCategory = getTemplatesByCategory;
const getTemplatesByIndustry = (industry) => {
    if (!industry || industry === 'all') {
        return exports.WORKFLOW_TEMPLATE_DEFINITIONS;
    }
    return exports.WORKFLOW_TEMPLATE_DEFINITIONS.filter((t) => t.industries.includes(industry));
};
exports.getTemplatesByIndustry = getTemplatesByIndustry;
const getTemplateCategories = () => {
    return [
        ...new Set(exports.WORKFLOW_TEMPLATE_DEFINITIONS.map((template) => template.category)),
    ];
};
exports.getTemplateCategories = getTemplateCategories;
const getTemplateIndustries = () => {
    return [
        ...new Set(exports.WORKFLOW_TEMPLATE_DEFINITIONS.flatMap((t) => t.industries)),
    ].sort();
};
exports.getTemplateIndustries = getTemplateIndustries;
const searchTemplates = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return exports.WORKFLOW_TEMPLATE_DEFINITIONS.filter((template) => template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
        template.category.toLowerCase().includes(lowercaseQuery));
};
exports.searchTemplates = searchTemplates;
//# sourceMappingURL=workflow-template-definitions.js.map