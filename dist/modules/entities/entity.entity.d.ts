export declare enum EntityStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    DRAFT = "draft"
}
export declare enum FieldType {
    STRING = "string",
    NUMBER = "number",
    DATE = "date",
    BOOLEAN = "boolean",
    EMAIL = "email",
    PHONE = "phone",
    TEXT = "text",
    SELECT = "select",
    MULTI_SELECT = "multi_select",
    FILE = "file",
    IMAGE = "image",
    DECIMAL = "decimal",
    INTEGER = "integer"
}
export declare class Entity {
    id: string;
    name: string;
    slug: string;
    description: string;
    fields: FieldDefinition[];
    status: EntityStatus;
    icon: string;
    isInMenu: boolean;
    menuOrder: number;
    tenant: any;
    tenantId: string;
    createdBy: any;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    data: any[];
}
export interface FieldDefinition {
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    unique: boolean;
    defaultValue?: any;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        minLength?: number;
        maxLength?: number;
    };
    display: {
        order: number;
        width?: string;
        showInList?: boolean;
        showInForm?: boolean;
        searchable?: boolean;
    };
}
