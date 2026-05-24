"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEntityFieldValue = resolveEntityFieldValue;
exports.evaluateOneCondition = evaluateOneCondition;
exports.evaluateConditions = evaluateConditions;
function resolveEntityFieldValue(entityData, field) {
    const key = field.replace(/^entity\./, '').trim();
    if (!key)
        return undefined;
    if (entityData[key] !== undefined && entityData[key] !== null) {
        return entityData[key];
    }
    const lower = key.toLowerCase();
    for (const [k, val] of Object.entries(entityData)) {
        if (k.toLowerCase() === lower && val !== undefined && val !== null) {
            return val;
        }
    }
    return undefined;
}
function evaluateOneCondition(entityData, condition) {
    const fieldValue = resolveEntityFieldValue(entityData, condition.field);
    const expected = condition.value;
    switch (condition.operator) {
        case 'equals':
            return fieldValue == expected;
        case 'not_equals':
            return fieldValue != expected;
        case 'contains':
            return String(fieldValue ?? '')
                .toLowerCase()
                .includes(String(expected ?? '').toLowerCase());
        case 'greater_than':
            return Number(fieldValue) > Number(expected);
        case 'less_than':
            return Number(fieldValue) < Number(expected);
        default:
            return false;
    }
}
function evaluateConditions(entityData, conditions, matchMode = 'all') {
    if (!conditions || conditions.length === 0) {
        return true;
    }
    const results = conditions.map((c) => evaluateOneCondition(entityData, c));
    return matchMode === 'any'
        ? results.some(Boolean)
        : results.every(Boolean);
}
//# sourceMappingURL=workflow-branching.util.js.map