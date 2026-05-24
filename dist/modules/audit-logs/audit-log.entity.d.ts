export declare enum AuditAction {
    ENTITY_CREATED = "entity_created",
    ENTITY_UPDATED = "entity_updated",
    ENTITY_DELETED = "entity_deleted",
    ENTITY_DATA_CREATED = "entity_data_created",
    ENTITY_DATA_UPDATED = "entity_data_updated",
    ENTITY_DATA_DELETED = "entity_data_deleted",
    ROLE_CREATED = "role_created",
    ROLE_UPDATED = "role_updated",
    ROLE_DELETED = "role_deleted",
    ROLE_PERMISSIONS_UPDATED = "role_permissions_updated",
    USER_CREATED = "user_created",
    TENANT_APPROVED = "tenant_approved",
    TENANT_REJECTED = "tenant_rejected",
    WORKFLOW_TRANSITION = "workflow_transition"
}
export declare class AuditLog {
    id: string;
    tenantId?: string;
    actorId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
