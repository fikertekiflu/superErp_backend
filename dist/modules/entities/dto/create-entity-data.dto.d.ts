export declare class CreateEntityDataDto {
    entityId: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
}
declare const UpdateEntityDataDto_base: import("@nestjs/common").Type<Partial<CreateEntityDataDto>>;
export declare class UpdateEntityDataDto extends UpdateEntityDataDto_base {
}
export {};
