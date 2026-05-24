export declare class CreateEntityDto {
    name: string;
    slug: string;
    description?: string;
    pluralName?: string;
    icon?: string;
    isInMenu?: boolean;
    menuOrder?: number;
    fields: {
        name: string;
        label: string;
        type: string;
        required: boolean;
        unique: boolean;
        options?: string[];
        defaultValue?: any;
        display: {
            order: number;
            showInList: boolean;
            showInForm: boolean;
        };
    }[];
    config?: any;
}
