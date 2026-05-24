export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export interface StepCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export function resolveEntityFieldValue(
  entityData: Record<string, unknown>,
  field: string,
): unknown {
  const key = field.replace(/^entity\./, '').trim();
  if (!key) return undefined;

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

export function evaluateOneCondition(
  entityData: Record<string, unknown>,
  condition: StepCondition,
): boolean {
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

export function evaluateConditions(
  entityData: Record<string, unknown>,
  conditions: StepCondition[] | undefined,
  matchMode: 'all' | 'any' = 'all',
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  const results = conditions.map((c) =>
    evaluateOneCondition(entityData, c),
  );

  return matchMode === 'any'
    ? results.some(Boolean)
    : results.every(Boolean);
}
