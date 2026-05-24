export type EntityAction = 'create' | 'read' | 'update' | 'delete';
export interface EntityPermissionGrant {
    entityId: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}
export interface ResolvedEntityPermission {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}
export interface UserPermissionSnapshot {
    systemRole: string;
    canManageSchemas: boolean;
    isFullAccess: boolean;
    byEntity: Record<string, ResolvedEntityPermission>;
}
