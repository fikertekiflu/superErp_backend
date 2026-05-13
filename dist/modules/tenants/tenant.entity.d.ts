export declare enum TenantStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    TRIAL = "trial",
    PENDING_VERIFICATION = "pending_verification",
    REJECTED = "rejected"
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
    verificationStatus: string;
    verificationDocuments: Array<{
        name: string;
        fileUrl: string;
        type: string;
        uploadedAt: string;
    }>;
    rejectionReason: string;
    verifiedAt: Date;
    verifiedBy: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    users: any[];
    roles: any[];
}
