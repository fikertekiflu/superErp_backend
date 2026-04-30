export declare enum TenantStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    TRIAL = "trial"
}
export declare enum TenantPlan {
    BASIC = "basic",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise",
    CUSTOM = "custom"
}
export declare class Tenant {
    id: string;
    name: string;
    domain: string;
    description: string;
    status: TenantStatus;
    plan: TenantPlan;
    subscriptionExpiresAt: Date;
    maxUsers: number;
    maxStorageMB: number;
    settings: Record<string, any>;
    isOnboarded: boolean;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    users: any[];
    roles: any[];
}
