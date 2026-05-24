export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    TENANT_ADMIN = "tenant_admin",
    MANAGER = "manager",
    USER = "user"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date;
    isEmailVerified: boolean;
    emailVerificationToken: string;
    passwordResetToken: string;
    passwordResetExpiresAt: Date;
    isActive: boolean;
    approvalLimitOverride?: number | null;
    createdAt: Date;
    updatedAt: Date;
    tenant: any;
    tenantId: string;
    roleEntity: any;
    roleId: string;
    roles: any[];
}
