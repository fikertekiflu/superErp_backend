"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTaskEntityPreview = buildTaskEntityPreview;
const PRIORITY_FIELD_KEYS = [
    'amount',
    'title',
    'name',
    'email',
    'description',
    'status',
    'category',
    'total',
    'vendor',
    'department',
];
function formatDisplayValue(value) {
    if (value === null || value === undefined || value === '')
        return '—';
    if (typeof value === 'boolean')
        return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
        return Number.isInteger(value)
            ? value.toLocaleString()
            : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        }
        catch {
            return String(value);
        }
    }
    return String(value);
}
function fieldLabel(key, definitions) {
    const def = definitions?.find((f) => f.name === key || f.name?.toLowerCase() === key.toLowerCase());
    return def?.label || def?.name || key.replace(/_/g, ' ');
}
function sortFieldKeys(keys) {
    const priority = new Map(PRIORITY_FIELD_KEYS.map((k, i) => [k.toLowerCase(), i]));
    return [...keys].sort((a, b) => {
        const pa = priority.get(a.toLowerCase());
        const pb = priority.get(b.toLowerCase());
        if (pa !== undefined && pb !== undefined)
            return pa - pb;
        if (pa !== undefined)
            return -1;
        if (pb !== undefined)
            return 1;
        return a.localeCompare(b);
    });
}
function buildTaskEntityPreview(entityData, options) {
    if (!entityData || Object.keys(entityData).length === 0) {
        return null;
    }
    const skipKeys = new Set(['id', 'tenantid', 'createdat', 'updatedat']);
    const keys = sortFieldKeys(Object.keys(entityData).filter((k) => !skipKeys.has(k.toLowerCase())));
    const fields = keys.map((key) => {
        const value = entityData[key];
        return {
            key,
            label: fieldLabel(key, options.fieldDefinitions),
            value,
            displayValue: formatDisplayValue(value),
        };
    });
    return {
        entityName: options.entityName || options.entitySlug || 'Record',
        entitySlug: options.entitySlug,
        entityDefinitionId: options.entityDefinitionId,
        recordId: options.recordId,
        fields,
    };
}
//# sourceMappingURL=task-entity-preview.util.js.map