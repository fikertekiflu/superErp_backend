export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
export interface StepCondition {
    field: string;
    operator: ConditionOperator;
    value: unknown;
}
export declare function resolveEntityFieldValue(entityData: Record<string, unknown>, field: string): unknown;
export declare function evaluateOneCondition(entityData: Record<string, unknown>, condition: StepCondition): boolean;
export declare function evaluateConditions(entityData: Record<string, unknown>, conditions: StepCondition[] | undefined, matchMode?: 'all' | 'any'): boolean;
