import { FieldDefinition } from '../entities/entity.entity';

export interface TaskEntityPreviewField {
  key: string;
  label: string;
  value: unknown;
  displayValue: string;
}

export interface TaskEntityPreview {
  entityName: string;
  entitySlug?: string;
  entityDefinitionId?: string;
  recordId?: string;
  fields: TaskEntityPreviewField[];
}

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

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function fieldLabel(
  key: string,
  definitions?: FieldDefinition[],
): string {
  const def = definitions?.find(
    (f) => f.name === key || f.name?.toLowerCase() === key.toLowerCase(),
  );
  return def?.label || def?.name || key.replace(/_/g, ' ');
}

function sortFieldKeys(keys: string[]): string[] {
  const priority = new Map(
    PRIORITY_FIELD_KEYS.map((k, i) => [k.toLowerCase(), i]),
  );
  return [...keys].sort((a, b) => {
    const pa = priority.get(a.toLowerCase());
    const pb = priority.get(b.toLowerCase());
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return a.localeCompare(b);
  });
}

export function buildTaskEntityPreview(
  entityData: Record<string, unknown> | undefined,
  options: {
    entityName?: string;
    entitySlug?: string;
    entityDefinitionId?: string;
    recordId?: string;
    fieldDefinitions?: FieldDefinition[];
  },
): TaskEntityPreview | null {
  if (!entityData || Object.keys(entityData).length === 0) {
    return null;
  }

  const skipKeys = new Set(['id', 'tenantid', 'createdat', 'updatedat']);
  const keys = sortFieldKeys(
    Object.keys(entityData).filter((k) => !skipKeys.has(k.toLowerCase())),
  );

  const fields: TaskEntityPreviewField[] = keys.map((key) => {
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
