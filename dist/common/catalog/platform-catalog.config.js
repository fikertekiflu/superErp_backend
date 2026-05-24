"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDUSTRY_PROFILES = exports.BLUEPRINT_OPTIONS = void 0;
exports.inferBlueprintFromDomain = inferBlueprintFromDomain;
exports.getIndustryProfile = getIndustryProfile;
exports.BLUEPRINT_OPTIONS = [
    {
        id: 'standard',
        name: 'Standard ERP',
        description: 'The foundation for operational excellence. Best for product-led growth.',
        entities: ['Clients', 'Products', 'Orders'],
    },
    {
        id: 'crm',
        name: 'CRM Focused',
        description: 'Prioritize relationships and deal flow. Accelerate your sales cycle.',
        entities: ['Leads', 'Deals', 'Activities'],
    },
    {
        id: 'inventory',
        name: 'Inventory & Stock',
        description: 'Precision logistics and supply chain management for complex ops.',
        entities: ['Products', 'Suppliers', 'Stock'],
    },
];
exports.INDUSTRY_PROFILES = {
    retail: {
        defaultBlueprintId: 'crm',
        suggestedBlueprintIds: ['crm', 'standard'],
        suggestedWorkflowCatalogKeys: [
            'cafe-order-flow',
            'customer-order-fulfillment',
            'sales-lead-to-deal',
            'inventory-restock',
            'return-refund',
            'customer-support-ticket',
        ],
    },
    hospitality: {
        defaultBlueprintId: 'standard',
        suggestedBlueprintIds: ['standard', 'crm'],
        suggestedWorkflowCatalogKeys: [
            'cafe-order-flow',
            'customer-order-fulfillment',
            'employee-onboarding',
            'leave-request',
        ],
    },
    manufacturing: {
        defaultBlueprintId: 'inventory',
        suggestedBlueprintIds: ['inventory', 'standard'],
        suggestedWorkflowCatalogKeys: [
            'procurement-approval',
            'quality-control-inspection',
            'equipment-maintenance',
            'production-batch-release',
            'supplier-onboarding',
        ],
    },
    services: {
        defaultBlueprintId: 'standard',
        suggestedBlueprintIds: ['standard', 'crm'],
        suggestedWorkflowCatalogKeys: [
            'client-onboarding',
            'project-milestone-approval',
            'timesheet-approval',
            'invoice-approval',
            'contract-approval',
        ],
    },
    healthcare: {
        defaultBlueprintId: 'standard',
        suggestedBlueprintIds: ['standard'],
        suggestedWorkflowCatalogKeys: [
            'patient-registration',
            'appointment-booking',
            'lab-results-review',
            'clinical-incident-report',
            'employee-onboarding',
        ],
    },
    technology: {
        defaultBlueprintId: 'crm',
        suggestedBlueprintIds: ['crm', 'standard'],
        suggestedWorkflowCatalogKeys: [
            'sales-lead-to-deal',
            'incident-management',
            'customer-support-ticket',
            'employee-onboarding',
        ],
    },
    other: {
        defaultBlueprintId: 'standard',
        suggestedBlueprintIds: ['standard', 'crm', 'inventory'],
        suggestedWorkflowCatalogKeys: [
            'employee-onboarding',
            'leave-request',
            'customer-support-ticket',
            'expense-approval',
        ],
    },
};
function inferBlueprintFromDomain(domain) {
    const normalized = (domain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalized)
        return null;
    if (normalized.includes('erp'))
        return 'standard';
    if (normalized.includes('crm') || normalized.includes('sales'))
        return 'crm';
    if (normalized.includes('inventory') ||
        normalized.includes('stock') ||
        normalized.includes('warehouse') ||
        normalized.includes('supply')) {
        return 'inventory';
    }
    return null;
}
function getIndustryProfile(industry) {
    return exports.INDUSTRY_PROFILES[industry] ?? exports.INDUSTRY_PROFILES.other;
}
//# sourceMappingURL=platform-catalog.config.js.map