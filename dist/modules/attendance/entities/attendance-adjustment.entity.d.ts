import { Tenant } from '../../tenants/tenant.entity';
import { Employee } from '../../hrm/entities/employee.entity';
import { Attendance } from './attendance.entity';
export declare enum AdjustmentType {
    CHECK_IN_ADJUSTMENT = "check_in_adjustment",
    CHECK_OUT_ADJUSTMENT = "check_out_adjustment",
    STATUS_CHANGE = "status_change",
    OVERTIME_ADJUSTMENT = "overtime_adjustment",
    MANUAL_ADDITION = "manual_addition",
    CORRECTION = "correction"
}
export declare enum AdjustmentStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class AttendanceAdjustment {
    id: string;
    attendanceId: string;
    attendance: Attendance;
    employeeId: string;
    employee: Employee;
    adjustmentType: AdjustmentType;
    reason: string;
    description: string;
    originalCheckIn: Date;
    newCheckIn: Date;
    originalCheckOut: Date;
    newCheckOut: Date;
    originalTotalHours: number;
    newTotalHours: number;
    originalOvertimeHours: number;
    newOvertimeHours: number;
    originalStatus: string;
    newStatus: string;
    status: AdjustmentStatus;
    requestedById: string;
    approvedById: string;
    approvedAt: Date;
    rejectionReason: string;
    supportingDocuments: {
        fileName: string;
        fileUrl: string;
        uploadedAt: Date;
    }[];
    tenantId: string;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
}
