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
export declare function buildTaskEntityPreview(entityData: Record<string, unknown> | undefined, options: {
    entityName?: string;
    entitySlug?: string;
    entityDefinitionId?: string;
    recordId?: string;
    fieldDefinitions?: FieldDefinition[];
}): TaskEntityPreview | null;
