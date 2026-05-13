import { Tenant } from '../../tenants/tenant.entity';
export declare enum PolicyType {
    REGULAR = "regular",
    FLEXIBLE = "flexible",
    SHIFT = "shift",
    REMOTE = "remote"
}
export declare enum GracePeriodType {
    MINUTES = "minutes",
    PERCENTAGE = "percentage"
}
export declare class AttendancePolicy {
    id: string;
    name: string;
    description: string;
    policyType: PolicyType;
    standardCheckIn: Date;
    standardCheckOut: Date;
    lunchStart: Date;
    lunchEnd: Date;
    requiredWorkHours: number;
    gracePeriodMinutes: number;
    gracePeriodType: GracePeriodType;
    lateThresholdMinutes: number;
    halfDayThresholdMinutes: number;
    absentThresholdMinutes: number;
    overtimeRate: number;
    weekendOvertimeRate: number;
    holidayOvertimeRate: number;
    workingDays: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
    shiftSettings: {
        morningShift?: {
            start: string;
            end: string;
        };
        eveningShift?: {
            start: string;
            end: string;
        };
        nightShift?: {
            start: string;
            end: string;
        };
    };
    flexibleSettings: {
        coreHoursStart: string;
        coreHoursEnd: string;
        minWorkHours: number;
        maxWorkHours: number;
    };
    remoteSettings: {
        requireCheckIn: boolean;
        requireActivityTracking: boolean;
        allowFlexibleHours: boolean;
    };
    isAutoApprovalEnabled: boolean;
    requireLocationCheck: boolean;
    allowedLocations: {
        latitude: number;
        longitude: number;
        radius: number;
        name: string;
    }[];
    isActive: boolean;
    effectiveFrom: Date;
    effectiveTo: Date;
    tenantId: string;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
}
