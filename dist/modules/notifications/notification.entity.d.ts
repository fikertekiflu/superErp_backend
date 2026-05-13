import { User } from '../users/user.entity';
import { Tenant } from '../tenants/tenant.entity';
export declare enum NotificationType {
    EMAIL = "email",
    DASHBOARD = "dashboard",
    BOTH = "both"
}
export declare class Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    user: User;
    userId: string;
    tenant: Tenant;
    tenantId: string;
    executionId: string;
    entityId: string;
    metadata: {
        actionUrl?: string;
        entityType?: string;
        priority?: 'low' | 'medium' | 'high';
    };
    emailSentAt: Date;
    createdAt: Date;
}
